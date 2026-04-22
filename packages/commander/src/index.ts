import { ConsoleLogger } from "@odg/log";
import { program } from "commander";

import MakeFile, {
    type MakeEventOptions,
    type MakeExceptionOptions,
    type MakeHandlerOptions,
    type MakePageOptions,
    type MakeSelectorOptions,
} from "./Generators/MakeFile";

const make = new MakeFile(new ConsoleLogger());

const pathOption = "-p, --path <path>";

function collect(value: string, previous: string[] = []): string[] {
    return [ ...previous, value ];
}

const commandPathsDefaults = {
    pages: "./src/Pages/",
    selectors: "./src/Selectors/",
    handlers: "./src/Handlers/",
    listeners: "./src/app/Listeners/",
    exceptions: "./src/Exceptions/",
};

const registrationDefaults = {
    register: false,
    containerEnumPath: "./src/app/Enums/ContainerName.ts",
    eventEnumPath: "./src/app/Enums/EventName.ts",
    configEnumPath: "./src/app/Enums/ConfigName.ts",
    containerInterfacePath: "./@types/ContainerInterface.d.ts",
    eventsInterfacePath: "./@types/EventsInterface.d.ts",
    pagesIndexPath: "./src/Pages/index.ts",
    selectorsIndexPath: "./src/Selectors/index.ts",
    handlersIndexPath: "./src/Handlers/index.ts",
    listenersIndexPath: "./src/app/Listeners/index.ts",
    envExamplePath: "./.env.example",
    eventPayloadType: "EventBrowserParameters",
};

program
    .command("make:page")
    .name("make:page")
    .argument("<pageName>", "page name create")
    .option(pathOption, "Destination Page Path", commandPathsDefaults.pages)
    .option("-s, --selectors", "Create Selectors", false)
    .option("--selectorPath <selectorPath>", "Selector Path", commandPathsDefaults.selectors)
    .option("-e, --event", "Create Event", false)
    .option("--eventPath <eventPath>", "Event Path", commandPathsDefaults.listeners)
    .option("--handlerPath <handlerPath>", "Handler Path", commandPathsDefaults.handlers)
    .option("--handler-from <handlerFrom>", "Use If Handler From")
    .option("--handler-to <handlerTo>", "Use if Handler To")
    .option(
        "--register",
        "Enable post-scaffold registration (Container, barrels, events, etc.)",
        registrationDefaults.register,
    )
    .option("--containerEnumPath <containerEnumPath>", "Container enum path", registrationDefaults.containerEnumPath)
    .option("--eventEnumPath <eventEnumPath>", "EventName enum path", registrationDefaults.eventEnumPath)
    .option("--configEnumPath <configEnumPath>", "ConfigName enum path", registrationDefaults.configEnumPath)
    .option(
        "--containerInterfacePath <containerInterfacePath>",
        "ContainerInterface path",
        registrationDefaults.containerInterfacePath,
    )
    .option(
        "--eventsInterfacePath <eventsInterfacePath>",
        "EventsInterface path",
        registrationDefaults.eventsInterfacePath,
    )
    .option("--pagesIndexPath <pagesIndexPath>", "Pages barrel path", registrationDefaults.pagesIndexPath)
    .option(
        "--selectorsIndexPath <selectorsIndexPath>",
        "Selectors barrel path",
        registrationDefaults.selectorsIndexPath,
    )
    .option("--handlersIndexPath <handlersIndexPath>", "Handlers barrel path", registrationDefaults.handlersIndexPath)
    .option(
        "--listenersIndexPath <listenersIndexPath>",
        "Listeners barrel path",
        registrationDefaults.listenersIndexPath,
    )
    .option("--envExamplePath <envExamplePath>", ".env.example path", registrationDefaults.envExamplePath)
    .option("--typeImport <statement>", "Explicit import statement to insert (repeatable)", collect, [])
    .option("--eventPayloadType <type>", "EventsInterface payload type", registrationDefaults.eventPayloadType)
    .description("Test command description")
    .version("0.1.1")
    .action(async (pageName: string, options: MakePageOptions) => make.makePage(pageName, options));

program
    .command("make:selector")
    .name("make:selector")
    .argument("<selectorName>", "selector of page name")
    .option(pathOption, "Destination Selector Path", commandPathsDefaults.selectors)
    .option("--register", "Enable post-scaffold registration (Container, barrels, etc.)", registrationDefaults.register)
    .option(
        "--selectorsIndexPath <selectorsIndexPath>",
        "Selectors barrel path",
        registrationDefaults.selectorsIndexPath,
    )
    .option("--typeImport <statement>", "Explicit import statement to insert (repeatable)", collect, [])
    .description("Test command description")
    .version("0.1.1")
    .action(async (selectorName: string, options: MakeSelectorOptions) => make.makeSelectors(selectorName, options));

program
    .command("make:handler")
    .name("make:handler")
    .argument("<handlerName>", "selector of page name")
    .option("--handler-from <handlerFrom>", "handler source page")
    .option("--handler-to <handlerTo>", "handler destination page")
    .option(pathOption, "Destination Path", commandPathsDefaults.handlers)
    .option("--register", "Enable post-scaffold registration", registrationDefaults.register)
    .option(
        "--containerEnumPath <containerEnumPath>",
        "ContainerName enum path",
        registrationDefaults.containerEnumPath,
    )
    .option(
        "--containerInterfacePath <containerInterfacePath>",
        "ContainerInterface path",
        registrationDefaults.containerInterfacePath,
    )
    .option("--handlersIndexPath <handlersIndexPath>", "Handlers barrel path", registrationDefaults.handlersIndexPath)
    .option("--typeImport <statement>", "Explicit import statement to insert (repeatable)", collect, [])
    .description("Make Handler file")
    .version("0.1.1")
    .action(async (handlerName: string, options: MakeHandlerOptions) => make.makeHandler(handlerName, options));

program
    .command("make:event")
    .name("make:event")
    .argument("<eventName>", "EventName")
    .option(pathOption, "Destination EventListener Path", commandPathsDefaults.listeners)
    .option("--register", "Enable post-scaffold registration (Container, barrels, etc.)", registrationDefaults.register)
    .option(
        "--containerEnumPath <containerEnumPath>",
        "ContainerName enum path",
        registrationDefaults.containerEnumPath,
    )
    .option("--eventEnumPath <eventEnumPath>", "EventName enum path", registrationDefaults.eventEnumPath)
    .option(
        "--containerInterfacePath <containerInterfacePath>",
        "ContainerInterface path",
        registrationDefaults.containerInterfacePath,
    )
    .option(
        "--eventsInterfacePath <eventsInterfacePath>",
        "EventsInterface path",
        registrationDefaults.eventsInterfacePath,
    )
    .option(
        "--listenersIndexPath <listenersIndexPath>",
        "Listeners barrel path",
        registrationDefaults.listenersIndexPath,
    )
    .option("--typeImport <statement>", "Explicit import statement to insert (repeatable)", collect, [])
    .option("--eventPayloadType <type>", "EventsInterface payload type", registrationDefaults.eventPayloadType)
    .description("Create EventListener file example")
    .version("0.1.1")
    .action(async (eventName: string, options: MakeEventOptions) => make.makeEvent(eventName, options));

program
    .command("make:exception")
    .name("make:exception")
    .argument("<exceptionName>", "ExceptionName")
    .option("-u, --isUnknown", "UnknownException", false)
    .option(pathOption, "Destination Exception Path", commandPathsDefaults.exceptions)
    .description("Create Exception file example")
    .version("0.1.1")
    .action(
        async (exceptionName: string, options: MakeExceptionOptions) => make.makeException(exceptionName, options),
    );

program.parse();
