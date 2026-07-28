# ODG Architecture — Universal Shape

The part of an ODG project that is **identical in every runtime**. Read this for any task touching behavior, wiring, or review, then read the one runtime file that matches the project.

Do **NOT** re-derive the project shape by reading source. Trust this map and open source only for the concrete logic you change.

## The model — three rings

Dependencies point **inward only**.

```text
  ENTRY ─────▶ APP ─────▶ CORE
  varies       identical   identical
```

| Ring | Owns | Varies by runtime? |
| --- | --- | --- |
| **ENTRY** | Adapters that wake the process up: DOM steps, HTTP routes, queue consumers, IPC handlers, React trees | **Yes** — the only ring that changes |
| **APP** | Composition + orchestration: `Container`, `Enums`, `Services`, `Listeners`, `Providers` | No |
| **CORE** | Contracts and pure logic: `Interfaces`, `Validators`, `Exceptions`, `Configs`, `Kernel` | No |

**An ENTRY artifact MUST NOT contain business logic.** A Page, an HTTP controller, a queue consumer and an `ipcMain.handle` callback are the same thing — a different way to invoke the application. They translate an external event into a Service call and translate the result back. Nothing else.

Read exactly one: [crawler](./runtimes/crawler.md) · [electron](./runtimes/electron.md).

## Universal spine

Source root is `src/`. `@types/` sits at the project root.

```text
src/ or $$PROJECT_ROOT
    Kernel/
        Kernel.ts               boot/init/shutdown lifecycle + application creation
        ProcessKernel.ts        process events (SIGINT, SIGTERM, unhandledRejection, uncaughtException)
        index.ts                barrel
    Configs/
        Config.ts               configValidator (zod) + ConfigType
        index.ts                barrel
    Interfaces/
        <Name>Interface.ts      shared contracts (prefer zod.infer<>)
    Validators/
        CustomValidator.ts      reusable zod *helper* functions
        <Name>Validator.ts      zod schema for a domain/service/integration
    Exceptions/
        <Name>Exception.ts
    app/
        Container.ts            composition root — the ONLY place for manual bindings
        Enums/                  name SSOTs: ContainerName · EventName · ConfigName (+ barrel)
        Services/               orchestration: dispatch events, drive handlers (usually Singleton)
        Listeners/
            <Name>EventListener.ts
        Providers/              EventServiceProvider — registers Listeners on boot
    ContainerInject.ts          typed @$inject / @$multiInject (wraps inversify)

@types/
    ContainerInterface.d.ts     mirror of every binding (id → type)
    EventsInterface.d.ts        event → payload contract
```

`ContainerInject.ts` sits at the source root and is imported by relative path (`../ContainerInject.js`), not through an alias.

### Naming

- `app/` is lowercase — a namespace, not a class bucket.

### `index.ts`

A barrel: re-exports only, no declarations. Every sibling in the folder is exported, including base classes.

A file **MUST** import its own siblings by relative path, never through the folder's own barrel or alias. `SearchPage.ts` imports `BasePage` as `../BasePage`, not as `#pages`. The barrel is for external consumers; importing it from inside its own folder turns the re-export into a cycle.

`Configs/Config.ts` holds `configValidator` and its inferred type together — the type is `zod.infer<typeof configValidator>`, not an independent contract, so it stays with the schema. A project needing more than one schema names each scope explicitly: `Configs/MainConfig.ts`, `Configs/RendererConfig.ts`.

Do not name the inferred type `ConfigInterface` — `@odg/config` already exports a generic `ConfigInterface<T>`. Use `ConfigType` or `MyConfig`.

## The alias contract

The alias — not the physical folder — is the import surface. `#services` means the same thing in a crawler, an API and an Electron main process. Code imports through aliases; physical paths **MUST NOT** appear in `import` statements outside a folder's own siblings.

`package.json#imports` + `tsconfig.json#paths` are the **only** source of truth for which aliases exist — one `#name` per top-level folder in the spine above. This document does not restate that list; it drifts.

- An alias **MUST** be declared in **both** `package.json#imports` and `tsconfig.json#paths`, pointing at the same target.
- An alias **MUST NOT** be declared for a folder that does not exist.
- A project **MUST NOT** carry an alias for a ring it does not have (no `#pages` in an API).
- Every project **MUST** extend `@odg/tsconfig`.

> Nothing checks the two files against each other automatically. When a task touches either file, diff the two maps key by key.

## Wiring contract (add X → you MUST also touch Y)

Two paths, decided by layer. **Use the official CLI (`odg make:*`) to scaffold — never hand-create these files.** Step order and post-scaffold checks live in [execution.md](./execution.md); this is the invariant contract the CLI must satisfy.

- **Domain class (Service, Listener, and every managed class of the runtime ring)** — `@ODGDecorators.injectable(...)` + `loadModule` auto-registers it, so you wire only its *identity*:
  1. `src/app/Enums/ContainerName.ts` — add the key, in the correct section.
  2. `@types/ContainerInterface.d.ts` — add `[ContainerName.X]: Type;` **and** its `import type`.
  3. The folder's `index.ts` barrel — export the new file.
- **Infra / factory / lib (Config, Logger, EventBus, Requester, dynamic values)** — no decorator; **manually bind** in `src/app/Container.ts`, plus the same enum + `ContainerInterface` entries.
- **Event** adds a parallel chain: `EventName` key + payload in `@types/EventsInterface.d.ts` + the Listener. See [events.md](./events.md).
- **Config key**: `ConfigName` + `configValidator` + `.env.example` + test default. See [configs.md](./configs.md).

`ContainerName` dotted suffixes (`.page`, `.handler`, `.event.listener`, `.service`) are **load-bearing, not cosmetic** — instance tests discover classes by filtering on them.

TSC/wiring failures (missing `ContainerInterface` entry, section drift, barrel gaps) → [diagnostics.md](./diagnostics.md).

### Registration & decorators

| Artifact | Registered via | Decorator |
| --- | --- | --- |
| Service | decorator (auto) | `@ODGDecorators.injectable(ContainerName.X, "Singleton")` |
| Listener | decorator (auto) | `@ODGDecorators.injectable(ContainerName.X, "Singleton")` + `@registerListener(EventName.X, ContainerName.X, {})` |
| Runtime-ring managed class | decorator (auto) | see the runtime file — usually `@injectable(ContainerName.X)` with no singleton |
| Config, Logger, EventBus, Requester, Kernel, factories | **manual** in `Container.ts` | `toDynamicValue` / `toConstantValue` |

Domain classes are discovered by `ODGDecorators.loadModule` (invoked in `setUp`); their barrels are imported for side-effect in `Container.ts`. Only infra/factories/libs are bound by hand.

## Container & Enums rules

- Developers **MUST** use `ContainerName`, `EventName`, and `ConfigName` enums instead of loose strings.
- Manual bindings **MUST** be maintained strictly inside `src/app/Container.ts`.
- Barrel files **MUST** be kept updated whenever files are added or removed from a directory.
- Whenever a binding is added in `src/app/Container.ts`, `@types/ContainerInterface.d.ts` **MUST** be updated with the corresponding entry.
- **MUST NOT** disable an ESLint rule unless there is no plausible fix and the reason is documented.
- **MUST NOT** disable ESLint for an entire file when a narrower occurrence-level disable is enough.
- An injected primitive (`Logger`, `Config`, requester, `EventBus`) **MUST** be used directly at the call site. **MUST NOT** wrap it in a bespoke function or class that only forwards to it without adding behavior.

## Helper classes

- `CustomValidator` is a class of reusable validation **helper** functions, not a data schema. It **MUST NOT** be treated as, or replaced by, a `zod`/`yup` schema.
- A `Helpers/` folder holds **pure functions only**. A class that is `@injectable` is a Service, not a helper, and belongs in `Services/`.

## Review-time gaps

A review pass still has to check these — neither has an automated gate:

| Gap | Why it slips through |
| --- | --- |
| Ring direction (ENTRY → APP → CORE) in a single-root project | APP legitimately references ENTRY types; no rule distinguishes that from a real violation |
| Alias parity (`package.json#imports` ↔ `tsconfig.json#paths`) | `tsc` only reads `paths` — a drifted `imports` entry compiles fine and fails at runtime |

A project **MUST** run `lint` and `tsc:check` in CI.
