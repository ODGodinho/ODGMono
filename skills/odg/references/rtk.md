# RTK - Rust Token Killer

RTK is a command proxy used to reduce command output and token cost.
When RTK is available, you **MUST** use RTK as your first option.

## RTK Commands

RTK supports all commands, flags, and parameters; you simply need to match the specific command and adapt it to a relative command (adding your parameters/flags to the RTK command).

| Command Base | RTK Command | Description |
| --- | --- | --- |
| `$$PM build ...` | `rtk tsc --noEmit ...` | use `rtk $$PM build` when the `dist/` folder is actually needed |
| `$$PM eslint ...` | `rtk lint eslint ...` | run eslint, get errors only |
| `$$PM lint ...` | `rtk lint eslint ...` | run eslint, get errors only |
| `$$PM lint:fix ...` | `rtk lint eslint --fix ...` | run eslint, get errors and apply fixes |
| `$$PM test:watch ...` | `rtk vitest run --watch ...` | run tests in vitest |
| `$$PM test:ci ...` | `rtk vitest run --passWithNoTests ...` | run the CI suite |
