# Build, hooks and dependencies

Rules for `package.json` scripts and dependencies, `.husky/**`, lint-staged, the lockfile, the `Dockerfile` and `.gitlab-ci.yml`. These files run on every developer's machine and in every build: a mistake here breaks the team, not one card.

## Dependencies

- `package.json` and the lockfile never contain `portal:` or `link:` paths to a developer's disk.
- No `resolutions`/`overrides` that repeat a range already in `dependencies`; a published library's `resolutions` never reach its consumers.
- A package the deployed runtime never imports at execution time (`eslint`, `typescript`, `prettier`, `vitest`, `jest`, `tsc-alias`, `husky`, `concurrently`, `lint-staged`, `@types/*`, build orchestrators) is a devDependency, never under `dependencies`.
- A new package **MUST** be secure, widely adopted, maintained, and not rival an installed one unless worth the migration.
- `scripts` keep alphabetical order.
- Browser engine versions (`playwright`/`puppeteer`) stay aligned across `package.json`, the shared SDK, and the `Dockerfile` base image.

## Hooks and CI

- `lint-staged` uses `"*": "$$PM lint:fix"`, never `"*.{ts,tsx,js}"`, so `@odg/eslint-config` reaches config, CI, `.env.example` and style files.
- When `.gitlab-ci.yml` or deployment manifests maintain an explicit `VARIABLES:` allowlist, every new required env key lands there in the same change.

Lint-bound: most bullets above leave this file when the lint rules ship.
