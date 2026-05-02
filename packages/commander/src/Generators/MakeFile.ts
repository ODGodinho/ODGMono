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
    event: boolean;
    path: string;
    eventPath?: string;
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
    path: string;
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
    public async makePage(pageName: string, options: MakePageOptions): Promise<void> {
        const pageClassName = new Str(pageName).pascalCase().toString();
        const filePath = await this.stubCreator.create("page", `${pageClassName}Page`, options.path, {
            "PageName:UCFirst": pageClassName,
            "PageName:LCFirst": new Str(pageClassName).camelCase().toString(),
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

    public async makeSelectors(selectorName: string, options: MakeSelectorOptions): Promise<void> {
        const pageName = new Str(selectorName).pascalCase().toString();

        const filePath = await this.stubCreator.create("selector", `${pageName}Selector`, options.path, {
            "SelectorName:UCFirst": pageName,
            "SelectorName:LCFirst": new Str(selectorName).camelCase().toString(),
        });

        await registerArtifact({
            kind: "selector",
            name: selectorName,
            selectorClassName: `${pageName}Selector`,
            filePath,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Selector created successfully in : ${filePath}`);
    }

    public async makeHandler(handlerName: string, options: MakeHandlerOptions): Promise<void> {
        const isTransition = options.handlerFrom !== undefined || options.handlerTo !== undefined;
        const handlerClassName = isTransition
            ? `${new Str(options.handlerFrom ?? handlerName).pascalCase().toString()}To${new Str(options.handlerTo ?? handlerName).pascalCase().toString()}Handler`
            : `${new Str(handlerName).pascalCase().toString()}Handler`;

        const selectorName = new Str(handlerName).camelCase().toString();
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

    public async makeEvent(eventName: string, options: MakeEventOptions): Promise<void> {
        const pageClassName = new Str(eventName).pascalCase().toString();

        const listenerClassName = `${pageClassName}EventListener`;
        const eventEnumMember = `${pageClassName}Event`;
        const containerEnumMember = `${pageClassName}EventListener`;

        const filePath = await this.stubCreator.create("event", listenerClassName, options.path, {
            "EventName:UCFirst": pageClassName,
            "EventName:LCFirst": new Str(eventName).camelCase().toString(),
        });

        await registerArtifact({
            kind: "event",
            name: eventName,
            listenerClassName,
            eventEnumMember,
            containerEnumMember,
            filePath,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Event created successfully in : ${filePath}`);
    }

    public async makeConfig(configName: string, options: MakeConfigOptions): Promise<void> {
        const validator = options.validator ?? "zod.string()";

        await registerArtifact({
            kind: "config",
            name: configName,
            configEnumMembers: [ configName ],
            envExampleLines: [ `\n# ${configName}`, `${configName}=""` ],
            configValidatorType: validator,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Config "${configName}" registered successfully`);
    }

    public async makeException(exceptionName: string, options: MakeExceptionOptions): Promise<void> {
        const exceptionClassName = new Str(exceptionName).pascalCase().toString();
        const exceptionType = options.isUnknown ? "UnknownException" : "Exception";

        const filePath = await this.stubCreator.create("exception", `${exceptionClassName}${exceptionType}`, options.path, {
            "ExceptionType": exceptionType,
            "ExceptionName": exceptionClassName,
        });

        await this.logger.info(`Exception created successfully in : ${filePath}`);
    }

    private buildRegistrationTargets(options: RegistrationOptions): RegistrationTargets {
        const {
            register = false,
            registrationTargets,
            typeImport,
            typeImports,
            ...targets
        } = options;

        return {
            enabled: register,
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
            await this.makeSelectors(pageName, {
                ...options,
                path: options.selectorPath,
            });
        }

        if (options.event && options.eventPath) {
            await this.makeEvent(pageName, {
                ...options,
                path: options.eventPath,
            });
        }

        if (options.handlerPath && (options.handlerFrom ?? options.handlerTo ?? options.handler)) {
            await this.makeHandler(pageName, {
                ...options,
                path: options.handlerPath,
                handlerFrom: options.handlerFrom,
                handlerTo: options.handlerTo,
            });
        }
    }

}
