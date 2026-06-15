import {
    appendFile,
    mkdir,
    readFile,
    writeFile,
} from "node:fs/promises";
import nodePath from "node:path";

import { File, Str } from "@odg/chemical-x";
import { InvalidArgumentException } from "@odg/exception";

export default class StubCreator {

    public async create(
        stub: string,
        name: string,
        pathDestination: string,
        variables: Record<string, number | string>,
    ): Promise<string> {
        const destination = await this.getPath(name, pathDestination);
        const fileInstance = new File(destination);

        if (await fileInstance.exists()) {
            throw new InvalidArgumentException(`The ${name} already exists.`);
        }

        const content = await this.getStub(stub, variables);

        await mkdir(pathDestination, { recursive: true });
        await writeFile(destination, content);

        const indexFile = `${pathDestination}/index.ts`;

        await this.appendToIndexIfExists(indexFile, name);

        return destination;
    }

    /**
     * Return stub file content.
     *
     * @param {string} name Name file stub
     * @param {Record<string, number | string>} variables Variable to replace in stub
     * @returns {Promise<string>}
     */
    public async getStub(name: string, variables: Record<string, number | string>): Promise<string> {
        const pathStub = await this.getStubPath(name);
        const file = await readFile(`${pathStub}/${name}.stub`);
        const stringInstance = new Str(file.toString());

        return stringInstance
            .formatUnicorn(variables)
            .toString();
    }

    /**
     * Return path to save stub.
     *
     * @param {string} name Generate file name
     * @param {string} path File path destination
     * @returns {Promise<string>}
     */
    public async getPath(name: string, path: string): Promise<string> {
        return `${path}/${name}.ts`;
    }

    /**
     * Get the path to the stubs.
     *
     * @param {string} name Stub File Name
     * @returns {Promise<string>}
     */
    public async getStubPath(name: string): Promise<string> {
        const stubPathLocal = `${nodePath.resolve("./stubs")}/${name}.stub`;
        const fileInstance = new File(stubPathLocal);

        if (await fileInstance.exists()) {
            return nodePath.resolve("./stubs");
        }

        return nodePath.join(process.cwd(), "node_modules/@odg/command/stubs");
    }

    private async appendToIndexIfExists(indexFile: string, name: string): Promise<void> {
        const fileInstance = new File(indexFile);

        if (!await fileInstance.exists()) {
            return;
        }

        const exportLine = `export * from "./${name}";`;
        const existing = await readFile(indexFile, { encoding: "utf8" });

        if (existing.includes(exportLine)) {
            return;
        }

        const insert = existing.endsWith("\n") || existing.length === 0 ? "" : "\n";

        await appendFile(indexFile, `${insert}${exportLine}\n`);
    }

}
