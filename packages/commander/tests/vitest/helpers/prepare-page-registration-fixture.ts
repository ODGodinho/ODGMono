import {
    mkdir,
    rm,
    writeFile,
} from "node:fs/promises";
import nodePath from "node:path";

export interface PageRegistrationPaths {
    containerEnumPath: string;
    containerInterfacePath: string;
    pagesIndexPath: string;
}

export async function preparePageRegistrationFixture(cacheRoot: string): Promise<PageRegistrationPaths> {
    await rm(cacheRoot, { recursive: true, force: true });
    await mkdir(cacheRoot, { recursive: true });

    const containerEnumPath = `${cacheRoot}/ContainerName.ts`;
    const containerInterfacePath = `${cacheRoot}/ContainerInterface.d.ts`;
    const pagesIndexPath = `${cacheRoot}/Pages/index.ts`;

    await writeFile(containerEnumPath, "export enum ContainerName {\n}\n", "utf8");
    await writeFile(containerInterfacePath, "export interface ContainerInterface {\n}\n", "utf8");
    await mkdir(nodePath.dirname(pagesIndexPath), { recursive: true });
    await writeFile(pagesIndexPath, "", "utf8");

    return {
        containerEnumPath,
        containerInterfacePath,
        pagesIndexPath,
    };
}
