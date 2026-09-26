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
        const destination = await this.write(stub, name, pathDestination, variables);

        await this.appendToIndexIfExists(`${pathDestination}/index.ts`, name);

        return destination;
    }

    /**
     * Writes the file from the stub and nothing else. `create` also appends to the folder's
     * `index.ts` in the crawler style; the API commands write their barrel lines themselves.
     *
     * @param {string} stub Stub file name, without `.stub`
     * @param {string} name Generated file name, without `.ts`
     * @param {string} pathDestination Destination folder
     * @param {Record<string, number | string>} variables Variables to replace in the stub
     * @returns {Promise<string>} Path of the written file
     */
    public async write(
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

        return destination;
    }

    /**
     * Fails before anything is written when any of the files a command would create already exists,
     * so a command that creates several files never leaves half of them behind.
     *
     * @param {string[]} paths Files the command is about to create
     * @returns {Promise<void>}
     */
    public async assertAbsent(paths: string[]): Promise<void> {
        const existing = await Promise.all(paths.map(async (path) => new File(path).exists()));
        const taken = paths.filter((_path, index) => existing[index]);

        if (taken.length === 0) {
            return;
        }

        const takenPaths = taken.map((path) => nodePath.normalize(path)).join(", ");

        throw new InvalidArgumentException(`Nothing was written, already exists: ${takenPaths}`);
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

        return await fileInstance.exists()
            ? nodePath.resolve("./stubs")
            : nodePath.join(process.cwd(), "node_modules/@odg/command/stubs");
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
