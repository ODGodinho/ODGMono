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
        const pageUcFirst = new Str(pageName).ucFirst().toString();
        const filePath = await this.stubCreator.create("page", `${pageUcFirst}Page`, options.path, {
            "PageName:UCFirst": pageUcFirst,
            "PageName:LCFirst": pageName.charAt(0).toLowerCase() + pageName.slice(1),
        });

        const targets = this.buildRegistrationTargets(options);

        await this.scaffoldPageAddOns(pageName, options);

        await registerArtifact({
            kind: "page",
            name: pageName,
            pageClassName: `${pageUcFirst}Page`,
            containerEnumMember: `${pageUcFirst}Page`,
            filePath,
        }, targets);

        await this.logger.info(`Page created successfully in : ${filePath}`);
    }

    public async makeSelectors(selectorName: string, options: MakeSelectorOptions): Promise<void> {
        const pageUcFirst = new Str(selectorName).ucFirst().toString();

        const filePath = await this.stubCreator.create("selector", `${pageUcFirst}Selector`, options.path, {
            "SelectorName:UCFirst": pageUcFirst,
            "SelectorName:LCFirst": selectorName.charAt(0).toLowerCase() + selectorName.slice(1),
        });

        await registerArtifact({
            kind: "selector",
            name: selectorName,
            selectorClassName: `${pageUcFirst}Selector`,
            filePath,
        }, this.buildRegistrationTargets(options));

        await this.logger.info(`Selector created successfully in : ${filePath}`);
    }

    public async makeHandler(handlerName: string, options: MakeHandlerOptions): Promise<void> {
        const isTransition = options.handlerFrom !== undefined || options.handlerTo !== undefined;
        const handlerClassName = isTransition
            ? `${new Str(options.handlerFrom ?? handlerName).ucFirst().toString()}To${new Str(options.handlerTo ?? handlerName).ucFirst().toString()}Handler`
            : `${new Str(handlerName).ucFirst().toString()}Handler`;

        const handlerPageLcFirst = handlerName.charAt(0).toLowerCase() + handlerName.slice(1);
        const handlerPageSelectorBundle = `${handlerPageLcFirst}Selector`;

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
        const pageUcFirst = new Str(eventName).ucFirst().toString();

        const listenerClassName = `${pageUcFirst}EventListener`;
        const eventEnumMember = `${pageUcFirst}Event`;
        const containerEnumMember = `${pageUcFirst}EventListener`;

        const filePath = await this.stubCreator.create("event", listenerClassName, options.path, {
            "EventName:UCFirst": pageUcFirst,
            "EventName:LCFirst": eventName.charAt(0).toLowerCase() + eventName.slice(1),
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
        const exceptionUcFirst = new Str(exceptionName).ucFirst().toString();
        const exceptionType = options.isUnknown ? "UnknownException" : "Exception";

        const filePath = await this.stubCreator.create("exception", `${exceptionUcFirst}${exceptionType}`, options.path, {
            "ExceptionType": exceptionType,
            "ExceptionName": exceptionUcFirst,
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

        if (options.handlerPath && (options.handlerFrom ?? options.handlerTo)) {
            await this.makeHandler(pageName, {
                ...options,
                path: options.handlerPath,
                handlerFrom: options.handlerFrom,
                handlerTo: options.handlerTo,
            });
        }
    }

}
