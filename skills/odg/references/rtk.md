# RTK - Rust Token Killer

RTK is a command proxy that trims command output. Use the mappings below; anything not listed runs plain or through `rtk proxy <cmd>` (unfiltered). Output that must stay intact — large JSON, `grep -n`, test output — goes through `rtk proxy`, never through a filter.

Call project binaries as `node_modules/.bin/<bin>`, not `$$PM <bin>`: the package manager may abort when `.yarnrc.yml` (or an equivalent) requires an environment variable the session does not have.

| Command Base | RTK Command | Description |
| --- | --- | --- |
| `$$PM build ...` | `rtk tsc --noEmit ...` | use `rtk $$PM build` when the `dist/` folder is actually needed |
| `$$PM eslint <files>` / `$$PM lint` | `rtk proxy node_modules/.bin/eslint <files>` | eslint only |
| `$$PM lint:fix ...` | `rtk proxy node_modules/.bin/eslint --fix ...` | apply fixes, print what remains |
| `eslint --stdin` (💡 snippet) | `rtk proxy node_modules/.bin/eslint --stdin --stdin-filename <path>` | lint of a code snippet |
| `$$PM test:ci ...` / `vitest` | `rtk proxy node_modules/.bin/vitest run --coverage.enabled=false --reporter=dot --passWithNoTests ...` | coverage off: its output pollutes the result |
| `$$PM test:watch ...` | `rtk proxy node_modules/.bin/vitest run --coverage.enabled=false --reporter=dot --watch ...` | run tests in vitest |

To tell whether two files are identical, run `cmp -s a b` and read its exit code; do not send `diff` through `rtk`, its output is long and unfiltered.
