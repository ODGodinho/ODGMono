/** Minimal `.d.ts` bodies used by registration tests (avoid >120 char lines). */

export function emptyContainerInterfaceWithImport(): string {
    return [
        "import type { ContainerName } from \"./ContainerName\";",
        "",
        "export interface ContainerInterface {",
        "}",
        "",
    ].join("\n");
}

export function emptyEventBaseInterfaceWithImport(): string {
    return [
        "import type { EventName } from \"./EventName\";",
        "",
        "export interface EventBaseInterface {",
        "}",
        "",
    ].join("\n");
}
