# RTK - Rust Token Killer

RTK is a command proxy used to reduce command output and token cost.

When RTK is available, you **MUST** prefer RTK commands.

| Command Base | Reference Command | Description |
| --- | --- | --- |
| yarn build | rtk tsc --noEmit | use rtk yarn build if need generate dist/ folder |
| yarn lint | rtk lint eslint | run eslint get errors only |
| yarn lint:fix | rtk lint eslint --fix | run eslint get errors and apply fixes |
| yarn test:watch | rtk vitest run --watch | run tests in vitest |
| yarn test:ci | rtk vitest run --passWithNoTests | N/A |
| yarn test:watch | rtk vitest run --watch | N/A |
