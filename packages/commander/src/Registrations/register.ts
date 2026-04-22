import { dirname, relative } from "node:path";

import { InvalidArgumentException } from "@odg/exception";

import { resolveContainerEnumMemberValue } from "./pascal-to-dot-lower";
import {
    ensureBarrelExport,
    ensureEnumMember,
    ensureEnvironmentExampleLines,
    ensureInterfaceProperty,
    ensureTopLevelStatements,
    ensureTypeNamedImport,
    ensureValueNamedImport,
} from "./ts-mutators";
import type { ArtifactDescriptor, RegistrationTargets } from "./types";

/** TypeScript path alias for the listeners barrel (see tsconfig paths). */
const listenersTypeModuleSpecifier = "@listeners";

/** TypeScript path alias for the pages barrel (see tsconfig paths). */
const pagesTypeModuleSpecifier = "@pages";

/** TypeScript path alias for the handlers barrel (see tsconfig paths). */
const handlersTypeModuleSpecifier = "@handlers";

function resolveRelativeExportPath(
    filePath: string | undefined,
    barrelPath: string,
    fallbackExportName: string,
): string {
    if (!filePath) {
        return `./${fallbackExportName}`;
    }

    const barrelDirectory = dirname(barrelPath);
    const filePathWithoutExtension = filePath.replace(/\.ts$/, "");
    const relativePath = relative(barrelDirectory, filePathWithoutExtension);

    return `./${relativePath}`;
}

async function registerContainerEnumMember(
    containerEnumPath: string,
    memberName: string,
    memberValue: string,
): Promise<void> {
    await ensureEnumMember({
        filePath: containerEnumPath,
        enumName: "ContainerName",
        memberName,
        memberValue,
    });
}

async function registerContainerInterfaceBinding(
    containerInterfacePath: string,
    enumMember: string,
    className: string,
    moduleSpecifier: string,
): Promise<void> {
    await ensureValueNamedImport({
        filePath: containerInterfacePath,
        moduleSpecifier,
        name: className,
    });

    await ensureInterfaceProperty({
        filePath: containerInterfacePath,
        interfaceName: "ContainerInterface",
        propertyName: `[ContainerName.${enumMember}]`,
        propertyType: className,
    });
}

async function registerBarrelExport(
    barrelPath: string,
    filePath: string | undefined,
    fallbackExportName: string,
): Promise<void> {
    const relativeExportPath = resolveRelativeExportPath(filePath, barrelPath, fallbackExportName);

    await ensureBarrelExport({
        barrelPath,
        relativeExportPath,
    });
}

async function registerConfigEnumMembers(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    if (!descriptor.configEnumMembers?.length || !targets.configEnumPath) {
        return;
    }

    for (const key of descriptor.configEnumMembers) {
        await ensureEnumMember({
            filePath: targets.configEnumPath,
            enumName: "ConfigName",
            memberName: key,
            memberValue: key,
        });
    }
}

async function registerEnvironmentExampleLines(
    descriptor: ArtifactDescriptor,
    targets: RegistrationTargets,
): Promise<void> {
    if (!descriptor.envExampleLines?.length || !targets.envExamplePath) {
        return;
    }

    await ensureEnvironmentExampleLines({
        filePath: targets.envExamplePath,
        lines: descriptor.envExampleLines,
    });
}

async function registerImports(targets: RegistrationTargets): Promise<void> {
    const imports = targets.typeImports ?? [];

    if (imports.length === 0) return;

    const importTargets = new Set<string>([
        targets.containerEnumPath,
        targets.eventEnumPath,
        targets.configEnumPath,
        targets.containerInterfacePath,
        targets.eventsInterfacePath,
        targets.pagesIndexPath,
        targets.selectorsIndexPath,
        targets.handlersIndexPath,
        targets.listenersIndexPath,
    ].filter(Boolean) as string[]);

    await Promise.all([ ...importTargets ].map(async (filePath) => ensureTopLevelStatements({
        filePath,
        statements: imports,
    })));
}

async function registerPage(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    if (descriptor.containerEnumMember && targets.containerEnumPath) {
        await registerContainerEnumMember(
            targets.containerEnumPath,
            descriptor.containerEnumMember,
            resolveContainerEnumMemberValue(undefined, descriptor.containerEnumMember),
        );
    }

    if (descriptor.pageClassName && targets.pagesIndexPath) {
        await registerBarrelExport(
            targets.pagesIndexPath,
            descriptor.filePath,
            descriptor.pageClassName,
        );
    }

    if (descriptor.containerEnumMember && descriptor.pageClassName && targets.containerInterfacePath) {
        await registerContainerInterfaceBinding(
            targets.containerInterfacePath,
            descriptor.containerEnumMember,
            descriptor.pageClassName,
            pagesTypeModuleSpecifier,
        );
    }

    await registerConfigEnumMembers(descriptor, targets);
    await registerEnvironmentExampleLines(descriptor, targets);
}

async function registerSelector(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    if (!descriptor.selectorClassName || !targets.selectorsIndexPath) return;

    await registerBarrelExport(
        targets.selectorsIndexPath,
        descriptor.filePath,
        descriptor.selectorClassName,
    );
}

async function registerHandler(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    if (descriptor.containerEnumMember && targets.containerEnumPath) {
        await registerContainerEnumMember(
            targets.containerEnumPath,
            descriptor.containerEnumMember,
            resolveContainerEnumMemberValue(undefined, descriptor.containerEnumMember),
        );
    }

    if (descriptor.handlerClassName && targets.handlersIndexPath) {
        await registerBarrelExport(
            targets.handlersIndexPath,
            descriptor.filePath,
            descriptor.handlerClassName,
        );
    }

    if (descriptor.containerEnumMember && descriptor.handlerClassName && targets.containerInterfacePath) {
        await registerContainerInterfaceBinding(
            targets.containerInterfacePath,
            descriptor.containerEnumMember,
            descriptor.handlerClassName,
            handlersTypeModuleSpecifier,
        );
    }
}

async function registerEventsInterface(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    const payloadType = targets.eventPayloadType;

    if (!payloadType || !descriptor.eventEnumMember || !targets.eventsInterfacePath) {
        throw new InvalidArgumentException(
            "Missing explicit event payload type: pass --eventPayloadType to register EventsInterface safely.",
        );
    }

    await ensureInterfaceProperty({
        filePath: targets.eventsInterfacePath,
        interfaceName: "EventBaseInterface",
        propertyName: `[EventName.${descriptor.eventEnumMember}]`,
        propertyType: payloadType,
    });
}

async function registerEventContainerInterface(
    descriptor: ArtifactDescriptor,
    targets: RegistrationTargets,
): Promise<void> {
    if (
        !descriptor.listenerClassName
        || !descriptor.containerEnumMember
        || !descriptor.eventEnumMember
        || !targets.containerInterfacePath
    ) {
        return;
    }

    await ensureTypeNamedImport({
        filePath: targets.containerInterfacePath,
        moduleSpecifier: listenersTypeModuleSpecifier,
        name: descriptor.listenerClassName,
    });

    await ensureInterfaceProperty({
        filePath: targets.containerInterfacePath,
        interfaceName: "ContainerInterface",
        propertyName: `[ContainerName.${descriptor.containerEnumMember}]`,
        propertyType: descriptor.listenerClassName,
    });
}

async function registerEvent(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    if (descriptor.eventEnumMember && targets.eventEnumPath) {
        await ensureEnumMember({
            filePath: targets.eventEnumPath,
            enumName: "EventName",
            memberName: descriptor.eventEnumMember,
            memberValue: descriptor.eventEnumMember,
        });
    }

    if (descriptor.listenerClassName && targets.listenersIndexPath) {
        await registerBarrelExport(
            targets.listenersIndexPath,
            descriptor.filePath,
            descriptor.listenerClassName,
        );
    }

    if (descriptor.containerEnumMember && targets.containerEnumPath) {
        await ensureEnumMember({
            filePath: targets.containerEnumPath,
            enumName: "ContainerName",
            memberName: descriptor.containerEnumMember,
            memberValue: resolveContainerEnumMemberValue(
                targets.containerEnumMemberValue,
                descriptor.containerEnumMember,
            ),
        });
    }

    await registerEventContainerInterface(descriptor, targets);

    if (descriptor.eventEnumMember && targets.eventsInterfacePath) {
        await registerEventsInterface(descriptor, targets);
    }
}

export async function registerArtifact(descriptor: ArtifactDescriptor, targets: RegistrationTargets): Promise<void> {
    if (!targets.enabled) return;

    await registerImports(targets);

    switch (descriptor.kind) {
        case "page":
            await registerPage(descriptor, targets);

            break;
        case "selector":
            await registerSelector(descriptor, targets);

            break;
        case "handler":
            await registerHandler(descriptor, targets);

            break;
        case "event":
            await registerEvent(descriptor, targets);

            break;
    }
}
