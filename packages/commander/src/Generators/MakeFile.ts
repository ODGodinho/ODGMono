import { Str } from "@odg/chemical-x";
import type { LoggerInterface } from "@odg/log";

import { registerArtifact } from "../Registrations/register";
import type { RegistrationTargets } from "../Registrations/types";

import StubCreator from "./StubCreator";

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
