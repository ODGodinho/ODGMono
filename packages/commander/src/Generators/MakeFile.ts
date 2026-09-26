import { join, normalize, relative } from "node:path";

import { Str } from "@odg/chemical-x";
import type { LoggerInterface } from "@odg/log";

import { registerArtifact, registerService } from "../Registrations/register.ts";
import { didEnsureBarrelLine } from "../Registrations/ts-mutators.ts";
import type { RegistrationTargets } from "../Registrations/types.ts";

import StubCreator from "./StubCreator.ts";

interface RegistrationOptions {
    register?: boolean;
    registrationTargets?: Omit<RegistrationTargets, "enabled">;
    containerEnumPath?: string;
    eventEnumPath?: string;
    configEnumPath?: string;
    configValidatorPath?: string;
    containerInterfacePath?: string;
    eventsInterfacePath?: string;
    pagesIndexPath?: string;
    selectorsIndexPath?: string;
    handlersIndexPath?: string;
    listenersIndexPath?: string;
    envExamplePath?: string;
    eventPayloadType?: string;
    containerEnumMemberValue?: string;
    typeImport?: string[];
    typeImports?: string[];
}

export interface MakePageOptions extends RegistrationOptions {
    selectors: boolean;
    event?: string;
    listeners?: boolean;
    path: string;
    listenersPath?: string;
    selectorPath?: string;
    handlerPath?: string;
    handler?: boolean;
    handlerFrom?: string;
    handlerTo?: string;
}

export interface MakeSelectorOptions extends RegistrationOptions {
    path: string;
}

export interface MakeHandlerOptions extends RegistrationOptions {
    path: string;
    handlerFrom?: string;
    handlerTo?: string;
}

export interface MakeEventOptions extends RegistrationOptions {
    path?: string;
}

export interface MakeListenerOptions extends RegistrationOptions {
    path: string;
    event: string;
}

export interface MakeExceptionOptions {
    path: string;
    isUnknown: boolean;
}

export interface MakeConfigOptions extends RegistrationOptions {
    path?: string;

    /** Zod validator expression written into configValidator, e.g. `zod.string()` */
    validator?: string;

    /** Path to the file that exports `configValidator = zod.object({...})`. */
    configValidatorPath?: string;
}

export interface MakeServiceOptions {
    path: string;
    testPath: string;
    containerEnumPath: string;
    containerInterfacePath: string;

    /** The class injects something the RequestContainer binds: no scope instead of `"Singleton"`. */
    request?: boolean;
}

export type HttpMethodType = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export interface MakeRouteOptions {
    method: HttpMethodType;

    /** HTTP path of the procedure. Default: `/<feature>` */
    path?: string;

    /** Also scaffold `<Feature>Service`, typed by the feature's Interface. */
    service?: boolean;
    serviceOptions: MakeServiceOptions;
    routesPath: string;
    validatorsPath: string;
    interfacesPath: string;
    testPath: string;
}

export interface MakeMiddlewareOptions {
    path: string;
    testPath: string;
}

export default class MakeFile {

    private readonly stubCreator = new StubCreator();

    public constructor(private readonly logger: LoggerInterface) {

    }

    /**
     * Use this function to create Page Crawler class
     *
     * @param {string} pageName Selector file name
     * @param {MakePageOptions} options Options command
     * @returns {Promise<void>}
     */
    public async generatePage(pageName: string, options: MakePageOptions): Promise<void> {
        const pageNameString = new Str(pageName);
        const pageClassName = pageNameString.pascalCase().toString();
        const filePath = await this.stubCreator.create("page", `${pageClassName}Page`, options.path, {
            "PageName:UCFirst": pageClassName,
            "PageName:LCFirst": pageNameString.camelCase().toString(),
        });

        const targets = this.buildRegistrationTargets(options);

        await this.scaffoldPageAddOns(pageClassName, options);

        await registerArtifact({
            kind: "page",
            name: pageClassName,
            pageClassName: `${pageClassName}Page`,
            containerEnumMember: `${pageClassName}Page`,
            filePath,
        }, targets);

        await this.logger.info(`Page created successfully in : ${filePath}`);
    }

    public async generateSelectors(selectorName: string, options: MakeSelectorOptions): Promise<void> {
        const selectorNameString = new Str(selectorName);
        const pageName = selectorNameString.pascalCase().toString();
        const filePath = await this.stubCreator.create("selector", `${pageName}Selector`, options.path, {
            "SelectorName:UCFirst": pageName,
            "SelectorName:LCFirst": selectorNameString.camelCase().toString(),
        });

        await registerArtifact({
            kind: "selector",
            name: selectorName,
            selectorClassName: `${pageName}Selector`,
            filePath,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Selector created successfully in : ${filePath}`);
    }

    public async generateHandler(handlerName: string, options: MakeHandlerOptions): Promise<void> {
        const isTransition = options.handlerFrom !== undefined || options.handlerTo !== undefined;
        const handlerFromString = new Str(options.handlerFrom ?? handlerName);
        const handlerToString = new Str(options.handlerTo ?? handlerName);
        const handlerNameString = new Str(handlerName);
        const handlerClassName = isTransition
            ? `${handlerFromString.pascalCase().toString()}To${handlerToString.pascalCase().toString()}Handler`
            : `${handlerNameString.pascalCase().toString()}Handler`;

        const selectorNameString = new Str(handlerName);
        const selectorName = selectorNameString.camelCase().toString();
        const handlerPageSelectorBundle = `${selectorName}Selector`;

        const filePath = await this.stubCreator.create("handler", handlerClassName, options.path, {
            "HandlerClassName": handlerClassName,
            "HandlerPageSelectorBundle": handlerPageSelectorBundle,
        });

        await registerArtifact({
            kind: "handler",
            name: handlerName,
            handlerClassName,
            containerEnumMember: handlerClassName,
            filePath,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Handler created successfully in : ${filePath}`);
    }

    public async generateEvent(eventName: string, options: MakeEventOptions): Promise<void> {
        const eventNameString = new Str(eventName);
        const pageClassName = eventNameString.pascalCase().toString();
        const eventEnumMember = `${pageClassName}Event`;

        await registerArtifact({
            kind: "event",
            name: eventName,
            eventEnumMember,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Event "${eventEnumMember}" registered in targets (use make:listener to scaffold a listener class)`);
    }

    public async generateListener(listenerName: string, options: MakeListenerOptions): Promise<void> {
        if (options.register) {
            await this.generateEvent(options.event, {
                ...options,
                path: undefined,
            });
        }

        const listenerNameString = new Str(listenerName);
        const eventNameString = new Str(options.event);
        const listenerPascal = listenerNameString.pascalCase().toString();
        const eventBindingPascal = eventNameString.pascalCase().toString();
        const listenerClassName = `${listenerPascal}EventListener`;
        const filePath = await this.stubCreator.create("listener", listenerClassName, options.path, {
            "ListenerName:UCFirst": listenerPascal,
            "ListenerName:LCFirst": listenerNameString.camelCase().toString(),
            "EventBinding:UCFirst": eventBindingPascal,
            "EventBinding:LCFirst": eventNameString.camelCase().toString(),
        });

        await registerArtifact({
            kind: "listener",
            name: listenerName,
            listenerClassName,
            containerEnumMember: listenerClassName,
            filePath,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Listener created successfully in : ${filePath}`);
    }

    public async generateConfig(configName: string, options: MakeConfigOptions): Promise<void> {
        const validator = options.validator ?? "zod.string()";
        const configKey = new Str(configName).constCase().toString();

        await registerArtifact({
            kind: "config",
            name: configKey,
            configEnumMembers: [ configKey ],
            envExampleLines: [ `\n# ${configKey}`, `${configKey}=""` ],
            configValidatorType: validator,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Config "${configKey}" registered successfully`);
    }

    public async generateException(exceptionName: string, options: MakeExceptionOptions): Promise<void> {
        const exceptionNameString = new Str(exceptionName);
        const exceptionClassName = exceptionNameString.pascalCase().toString();
        const exceptionType = options.isUnknown ? "UnknownException" : "Exception";

        const filePath = await this.stubCreator.create("exception", `${exceptionClassName}${exceptionType}`, options.path, {
            "ExceptionType": exceptionType,
            "ExceptionName": exceptionClassName,
        });

        await this.logger.info(`Exception created successfully in : ${filePath}`);
    }

    /**
     * Service of an ODG API: enum → ContainerInterface → barrel → class, plus its unit test.
     *
     * @param {string} serviceName Base name, without the `Service` suffix
     * @param {MakeServiceOptions} options Paths and scope
     * @returns {Promise<void>}
     */
    public async generateService(serviceName: string, options: MakeServiceOptions): Promise<void> {
        const name = new Str(serviceName).pascalCase().toString();

        await this.stubCreator.assertAbsent(await this.serviceFiles(name, options));

        const filePath = await this.createService(name, options, "service");

        await this.logger.info(`Service created successfully in : ${normalize(filePath)}`);
    }

    /**
     * Feature of an ODG API (oRPC): route file exporting only procedures, validator, interface, their
     * barrels, the router line and a route test. Nothing is written when any file already exists.
     *
     * @param {string} featureName Feature name; camelCase is the router namespace
     * @param {MakeRouteOptions} options Method, path, folders and whether to chain make:service
     * @returns {Promise<void>}
     */
    public async generateRoute(featureName: string, options: MakeRouteOptions): Promise<void> {
        const feature = new Str(featureName).camelCase().toString();
        const name = new Str(featureName).pascalCase().toString();
        const procedures: Record<HttpMethodType, string> = {
            DELETE: "destroy",
            GET: "show",
            PATCH: "update",
            POST: "store",
            PUT: "update",
        };
        const variables = {
            "FeatureName:UCFirst": name,
            "FeatureName:LCFirst": feature,
            "Procedure": procedures[options.method],
            "Method": options.method,
            "Path": options.path ?? `/${feature}`,
            "TestSetupPath": this.setupPath(options.testPath),
        };
        const files = [
            [ options.service ? "route-service" : "route", feature, options.routesPath ],
            [ "route.test", `${feature}.test`, options.testPath ],
            [ "validator", `${name}Validator`, options.validatorsPath ],
            [ "interface", `${name}Interface`, options.interfacesPath ],
        ] as const;

        await this.stubCreator.assertAbsent([
            ...await Promise.all(files.map(async ([ , file, path ]) => this.stubCreator.getPath(file, path))),
            ...options.service ? await this.serviceFiles(name, options.serviceOptions) : [],
        ]);

        await Promise.all(files.map(async ([ stub, file, path ]) => this.stubCreator.write(
            stub,
            file,
            path,
            variables,
        )));
        await this.registerRoute(feature, name, options);

        await this.logger.info([
            `Route ${feature}.${variables.Procedure} created successfully in : ${join(options.routesPath, feature)}.ts`,
            "The path stays in the route file; move it to src/Http/paths.ts only when a second file needs it.",
        ].join("\n"));
    }

    /**
     * Pipeline middleware of an ODG API (`MiddlewareInterface`), its barrel line and its test. It is
     * **not** added to `HttpServer.create()`: its place in the array is the composer's decision, so
     * the command prints the line and the criterion instead.
     *
     * @param {string} middlewareName Base name, without the `Middleware` suffix
     * @param {MakeMiddlewareOptions} options Folders
     * @returns {Promise<void>}
     */
    public async generateMiddleware(middlewareName: string, options: MakeMiddlewareOptions): Promise<void> {
        const name = new Str(middlewareName).pascalCase().toString();
        const className = `${name}Middleware`;
        const variables = { MiddlewareName: name };

        await this.stubCreator.assertAbsent(await Promise.all([
            this.stubCreator.getPath(className, options.path),
            this.stubCreator.getPath(`${className}.test`, options.testPath),
        ]));

        const filePath = await this.stubCreator.write("middleware", className, options.path, variables);

        await this.stubCreator.write("middleware.test", `${className}.test`, options.testPath, variables);
        await didEnsureBarrelLine({
            barrelPath: join(options.path, "index.ts"),
            line: `export * from "./${className}.js";`,
        });

        await this.logger.info([
            `Middleware created successfully in : ${normalize(filePath)}`,
            "Not added to the pipeline: its place is the composer's decision. In src/Http/HttpServer.ts:",
            `    import { ${className} } from "./Middlewares/${className}.js";`,
            `    new ${className}(),   // in the middlewares array of create()`,
            "Above ErrorBoundaryMiddleware: its `await next()` sees every response, errors and 404 included",
            "    (timing, logging).",
            "Below it: only requests that reach the transports, and what it throws gets serialized",
            "    (auth, rate limit).",
            "Always above the transports (OpenApiDocument, Rpc, OpenApi): they answer and never call next.",
        ].join("\n"));
    }

    /**
     * Barrel lines of a route feature, in wiring order: contracts, the service when chained, and
     * the router line last.
     *
     * @param {string} feature Router namespace (camelCase)
     * @param {string} name PascalCase name of the feature
     * @param {MakeRouteOptions} options Folders and whether to chain make:service
     * @returns {Promise<void>}
     */
    private async registerRoute(feature: string, name: string, options: MakeRouteOptions): Promise<void> {
        await didEnsureBarrelLine({
            barrelPath: join(options.validatorsPath, "index.ts"),
            line: `export * from "./${name}Validator.js";`,
        });
        await didEnsureBarrelLine({
            barrelPath: join(options.interfacesPath, "index.ts"),
            line: `export type * from "./${name}Interface.js";`,
        });

        if (options.service) {
            await this.createService(name, options.serviceOptions, "service-route");
        }

        await didEnsureBarrelLine({
            barrelPath: join(options.routesPath, "index.ts"),
            line: `export * as ${feature} from "./${feature}.js";`,
        });
    }

    private async serviceFiles(name: string, options: MakeServiceOptions): Promise<string[]> {
        return Promise.all([
            this.stubCreator.getPath(`${name}Service`, options.path),
            this.stubCreator.getPath(`${name}Service.test`, options.testPath),
        ]);
    }

    private async createService(
        name: string,
        options: MakeServiceOptions,
        stub: "service-route" | "service",
    ): Promise<string> {
        const className = `${name}Service`;
        const scope = options.request
            ? {
                ServiceScope: "",
                ServiceScopeDoc: "No scope: a new instance per injection, built with the objects of its request",
                TestResolver: "forRequest",
                TestResolverCall: "()",
            }
            : {
                ServiceScope: ", \"Singleton\"",
                ServiceScopeDoc: "Singleton: one per process; drop the scope once it injects a request binding",
                TestResolver: "container",
                TestResolverCall: "",
            };
        const variables = {
            ...scope,
            ServiceName: name,
            TestSetupPath: this.setupPath(options.testPath),
        };

        const filePath = await this.stubCreator.write(stub, className, options.path, variables);

        await this.stubCreator.write(`${stub}.test`, `${className}.test`, options.testPath, variables);
        await registerService({
            className,
            containerEnumPath: options.containerEnumPath,
            containerInterfacePath: options.containerInterfacePath,
        });
        await didEnsureBarrelLine({
            barrelPath: join(options.path, "index.ts"),
            line: `export * from "./${className}.js";`,
        });

        return filePath;
    }

    /**
     * Relative specifier from a test folder to `tests/setup`, where the template keeps `container.js`.
     *
     * @param {string} testPath Folder of the generated test
     * @returns {string} e.g. `../../setup`
     */
    private setupPath(testPath: string): string {
        return relative(testPath, "tests/setup");
    }

    private buildRegistrationTargets(options: RegistrationOptions): RegistrationTargets {
        const {
            register: shouldRegister = false,
            registrationTargets,
            typeImport,
            typeImports,
            ...targets
        } = options;

        return {
            enabled: shouldRegister,
            ...registrationTargets,
            ...targets,
            typeImports: typeImports ?? typeImport ?? registrationTargets?.typeImports,
        };
    }

    /**
     * Runs optional selector, event, and handler file generation from make:page, forwarding `register` and
     * `registrationTargets` so enums and barrels stay in sync with the parent command.
     *
     * @param {string} pageName Base page name (same as make:page first argument)
     * @param {MakePageOptions} options Full make:page options including paths and registration targets
     * @returns {Promise<void>}
     */
    private async scaffoldPageAddOns(pageName: string, options: MakePageOptions): Promise<void> {
        if (options.selectors && options.selectorPath) {
            await this.generateSelectors(pageName, {
                ...options,
                path: options.selectorPath,
            });
        }

        if (options.event) {
            await this.generateEvent(options.event, {
                ...options,
            });
        }

        if (options.listeners && options.listenersPath) {
            const eventBinding = options.event ?? pageName;

            await this.generateListener(pageName, {
                ...options,
                path: options.listenersPath,
                event: eventBinding,
            });
        }

        if (options.handlerPath && (options.handlerFrom ?? options.handlerTo ?? options.handler)) {
            await this.generateHandler(pageName, {
                ...options,
                path: options.handlerPath,
                handlerFrom: options.handlerFrom,
                handlerTo: options.handlerTo,
            });
        }
    }

}
