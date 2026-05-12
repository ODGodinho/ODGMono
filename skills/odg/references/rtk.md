# RTK - Rust Token Killer

RTK is command proxy to run commands with token optimization.

**MUST** run RTK commands to reduce resource consumption.

| Command Base | Reference Command | Description |
| --- | --- | --- |
| yarn build | rtk tsc --noEmit | use rtk yarn build if need generate dist/ folder |
| yarn lint | rtk lint eslint | N/A |
| yarn lint:fix | rtk lint eslint --fix | N/A |
| yarn test:watch | rtk vitest run --watch | N/A |
| yarn test:ci | rtk vitest run --passWithNoTests | N/A |
| yarn test:watch | rtk vitest run --watch | N/A |
