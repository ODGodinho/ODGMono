import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { preProcessFile } from "typescript";

import * as everything from "#app";

import * as portable from "../../src/portable.ts";

describe("portable entry", () => {
    test("leaves out only what needs Node: File", () => {
        expect(Object.keys(everything).filter((name) => !(name in portable))).toStrictEqual([ "File" ]);
    });

    test("keeps node:* and src/Node out of every file but the main index, types included", async () => {
        const source = join(import.meta.dirname, "../../src");
        const files = await readdir(source, { recursive: true });
        const portableFiles = files.filter((file) => file.endsWith(".ts")
            && !file.startsWith("Node")
            && file !== "index.ts");
        const offenders = await Promise.all(portableFiles.map(async (file) => {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- this package's own src, listed above
            const text = await readFile(join(source, file), "utf8");
            const imports = preProcessFile(text, true, true).importedFiles.map(({ fileName }) => fileName);

            return imports.some((name) => name.startsWith("node:") || /(?:^|\/)Node(?:\/|$)/u.test(name)) ? file : undefined;
        }));

        expect(portableFiles.length).toBeGreaterThan(0);
        expect(offenders.filter(Boolean)).toStrictEqual([]);
    });
});
