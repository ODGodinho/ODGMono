import { configDefaults, defineConfig } from "vitest/config";

const coverage100 = 100;
const vite = defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        testTimeout: 25_000,
        globals: true,
        pool: "forks",
        maxWorkers: 1,

        // Fixtures of make:* write real `*.test.ts` files here.
        exclude: [ ...configDefaults.exclude, "tests/vitest/cache/**" ],
        coverage: {
            enabled: true,
            provider: "istanbul",
            thresholds: {
                branches: coverage100,
                functions: coverage100,
                lines: coverage100,
                statements: coverage100,
            },
            exclude: [
                "src/index.ts",
                "src/index.js",
                "odg.js",
            ],
        },
        setupFiles: [ "./tests/vitest/init.ts" ],
    },
});

export default vite;
