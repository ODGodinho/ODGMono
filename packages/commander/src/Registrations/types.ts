export type ArtifactKind = "config" | "event" | "handler" | "listener" | "page" | "selector";

export interface RegistrationTargets {
    enabled: boolean;

    // Enums
    containerEnumPath?: string;
    eventEnumPath?: string;
    configEnumPath?: string;

    // Interfaces (.d.ts or .ts)
    containerInterfacePath?: string;
    eventsInterfacePath?: string;

    // Barrels
    pagesIndexPath?: string;
    selectorsIndexPath?: string;
    handlersIndexPath?: string;
    listenersIndexPath?: string;

    // Non-TS helpers
    envExamplePath?: string;

    /** Path to the file containing `configValidator = zod.object({...})` to mutate. */
    configValidatorPath?: string;

    // Extra explicit metadata (never inferred)
    eventPayloadType?: string;
    typeImports?: string[];

    /** Overrides ContainerName enum value for event/listener registration (default: dot.lower from class name). */
    containerEnumMemberValue?: string;
}

export interface ArtifactDescriptor {
    kind: ArtifactKind;

    // Canonical “resource” name, without suffixes
    name: string;

    // Generated symbols (class names / enum members)
    pageClassName?: string;
    selectorClassName?: string;
    handlerClassName?: string;
    eventEnumMember?: string;
    listenerClassName?: string;
    containerEnumMember?: string;

    // Actual file path created (absolute or relative)
    filePath?: string;

    // Optional: keys to register in ConfigName/.env.example
    configEnumMembers?: string[];
    envExampleLines?: string[];

    // Optional: zod validator expression for make:config
    configValidatorType?: string;
}
