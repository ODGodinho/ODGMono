# Execution Rules For ODG Tasks

Use this file while implementing changes.

## State Machine

Always split the work into three phases:

1. Scaffold
2. Structural validation
3. Manual semantics

Do not continue to business logic while the generated structure is still broken.

## Scaffold Priority

1. make:page with --selectors --event --listeners --register when a new page also needs selectors, event contract, and a default listener class.
2. make:page --register when the page is the central artifact.
3. make:handler --register when only a handler is missing.
4. make:event --register when only the event contract (enum + EventsInterface) is missing; make:listener --register when only a listener class is missing.
5. make:selector --register when only selectors are missing.

## Structural Validation Checklist

After every scaffold, verify all of the following before writing semantics:

- no tsc failure was introduced by the generated wiring
- `ContainerName.ts`: entry is in the correct section (`// Pages`, `// Handlers`, or `// Events`)

If any of these fail, fix only the minimum structural defect first.

### Event Wiring Chain

After registering an event contract (`make:event` or `make:page --event` with `--register`), and after scaffolding a listener (`make:listener` or `make:page --listeners`), close the full chain before writing logic:

1. `src/app/Enums/EventName.ts` — enum key present
2. `@types/EventsInterface.d.ts` — payload type added to `EventBaseInterface`
3. For each listener: `src/app/Enums/ContainerName.ts` — listener entry in `// Events` section with `dot.case` value (via `make:listener --register` or `make:page --listeners --register`)

## Post-Scaffold Per-File Checklist

| Generated File | Required Action |
| --- | --- |
| `src/Pages/<Name>Page.ts` | Write `execute()` interaction logic |
| `src/Handlers/<Name>Handler.ts` | Write `waitForHandler()`, attemptableFlowInterface and write identify\* and \*Solution functions |
| `src/Selectors/<Name>Selector.ts` | Replace placeholders with real selectors from page inspection |
| `src/app/Listeners/<Name>EventListener.ts` | Call `setPage(page).execute()` on page, call `handler.execute()` if handler transaction handler **MUST** call handler in *Service.ts |
| `@types/EventsInterface.d.ts` | Add payload type if an event was generated |

## Manual Semantics

Only after structure is stable:

- replace placeholder selectors with real selectors from page inspection
- write page interaction logic
- write handler success and failure gates
- complete listener or service orchestration
- If config is not optional add new config in `tests/vitest/init.ts` to tests workings

## Validation Sequence

Before shell commands, check whether rtk exists with command -v rtk.

When RTK is available, prefer the repo adapters:

- rtk tsc --noEmit
- rtk lint eslint --fix
- rtk vitest run

Without RTK, use the project commands:

- tsc or the narrowest real build command used by the repo
- yarn lint:fix
- yarn test

## Build Divergence Rule

If editor diagnostics and the real compile output disagree, the compile output wins. Stop trusting editor diagnostics for that file until the state is stable again.

## Local Limitation Shortcut

If the task needs custom subpaths, try the native make:page path flags first. Use separate scaffold commands with -p only after a real local failure is reproduced or when the step truly needs split generation.
