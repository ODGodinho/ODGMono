import { rm, writeFile } from "node:fs/promises";

export default void (async (): Promise<void> => {
    beforeAll(async () => writeFile("tests/vitest/cache/index.ts", ""));
    afterAll(async () => rm("tests/vitest/cache/index.ts", { force: true }));
})();
