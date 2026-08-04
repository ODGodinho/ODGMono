# ODG CLI Recipes

This file governs the execution phase. For planning rules, see [./plan.md](./plan.md).
Treat @odg/command as a CLI contract. Choose commands from the real artifact being created.

- Full CLI Guide: [@odg/command/AGENTS.md]($$PROJECT_ROOT/node_modules/@odg/command/AGENTS.md)

## Global Rules

- Commands **MUST** be executed from the project root unless a custom path is explicitly required.
- The positional input **MUST** represent the base resource name and **MUST NOT** include the suffix.
  - `Login` not `LoginPage`
  - `Login` not `LoginHandler`
  - `Login` not `LoginEventListener`
  - `Login` not `LoginSelector`
- Examples **SHOULD** be derived from the official CLI help via `$$PM odg --help` or `$$PM odg make:* --help`.
- If path-flag behavior is ambiguous, developers **MUST** verify the CLI help output before suggesting any split-command workaround.

## Available Scaffold Commands

```bash
$$PM odg make:page <Name> [flags]       # Creates Page class
$$PM odg make:handler <Name> [flags]    # Creates Handler class
$$PM odg make:event <Name> [flags]      # Creates EventName enum entry + payload type
$$PM odg make:listener <Name> [flags]   # Creates Listener class
$$PM odg make:selector <Name> [flags]   # Creates Selector file
$$PM odg make:config <Name> [flags]     # Mutates config wiring (no standalone file created)
```

**No command exists for Components** — they are created manually (see execution.md).

## Known Local Limitation

Current local contract exposes and forwards --path, --selectorPath, --eventPath, and --handlerPath from make:page into the nested generators. Prefer a single make:page command with explicit path flags when the whole step belongs together.

Only fall back to separate commands with -p when a real runtime failure is reproduced in the local installed version or when one artifact needs to be generated independently from the rest of the step.

Example for this repo:

- $$PM odg make:page Search --path src/Pages/Google --selectors --selectorPath src/Selectors/Google --event --listeners --listenersPath src/app/Listeners/Search --register
