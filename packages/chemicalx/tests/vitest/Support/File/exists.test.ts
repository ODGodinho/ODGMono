import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { File } from "src";

describe("File", () => {
    describe("exists", () => {
        let temporaryDirectory: string;

        beforeAll(async () => {
            temporaryDirectory = await mkdtemp(join(tmpdir(), "chemicalx-file-"));
        });

        afterAll(async () => {
            await rm(temporaryDirectory, { recursive: true, force: true });
        });

        test("returns true when path exists", async () => {
            const filePath = join(temporaryDirectory, "exists.txt");

            // eslint-disable-next-line security/detect-non-literal-fs-filename -- mkdtemp sandbox
            await writeFile(filePath, "x", "utf8");

            await expect(new File(filePath).exists()).resolves.toBe(true);
        });

        test("returns false when path does not exist", async () => {
            const missingPath = join(temporaryDirectory, `missing-${Date.now()}.txt`);

            await expect(new File(missingPath).exists()).resolves.toBe(false);
        });
    });
});
