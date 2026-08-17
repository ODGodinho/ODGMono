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
    Instructions/               static text the program carries (AI prompts, templates)
        <Name>.ts               one coherent unit per file — see "Text as data" below
        index.ts                barrel
    database/                   only in projects that own a schema — see runtimes/api.md
        DatabaseSeeder.ts       registry of seeders (ordered runUp / reversed runDown)
        Seeders/<Name>Seeder.ts idempotent, minimum initial data, no logging
    app/
        Container.ts            composition root — the ONLY place for manual bindings
        ContainerInject.ts      typed @$inject / @$multiInject (wraps inversify)
        Enums/                  name SSOTs: ContainerName · EventName · ConfigName (+ barrel)
        Services/               orchestration: dispatch events, drive handlers (usually Singleton)
        Listeners/
            <Name>EventListener.ts
        Providers/              EventServiceProvider — registers Listeners on boot

@types/
    ContainerInterface.d.ts     mirror of every binding (id → type)
    EventsInterface.d.ts        event → payload contract
```

`ContainerInject.ts` lives in `src/app/` (as shown above) and is imported through the `#app/*` alias (`#app/ContainerInject.js`).

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

### Monorepo exception — `paths` shadows across packages

`tsconfig#paths` is **global to a compilation**, while `package.json#imports` is **per package**. So in a
monorepo where package B imports package A's TypeScript source (a shared contract type, for example),
B's `paths` also apply while the compiler reads A's files — and identically named aliases (`#enums`,
`#kernel`) silently resolve to **B's** folders inside A's code. The symptom is nonsense: `Property 'X'
does not exist on type 'typeof ContainerName'` pointing at a file where that member plainly exists.

Therefore: when two workspaces would declare the same alias name and one imports the other's source,
the **importing** package **MUST NOT** declare `paths` for those aliases — `package.json#imports`
resolves them correctly on its own under `moduleResolution` `nodenext` or `bundler`. Record the
exception in the project `AGENTS.md`.

The `extends` target **MUST** be a relative path (`../../node_modules/@odg/tsconfig/tsconfig.node.json`),
not the `@odg/tsconfig/...` package specifier: Bun ignores specifier-based `extends`, which silently
drops `emitDecoratorMetadata` and breaks every `@$inject` at runtime. See
[diagnostics.md](./diagnostics.md).

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
| `Kernel`, `ProcessKernel`, seeders, HTTP adapter | decorator (auto) | `@ODGDecorators.injectable(ContainerName.X, "Singleton")`; the barrel is imported for side-effect in `Container.ts` |
| Config, Logger, EventBus, Requester, DB handle, external SDK clients, factories | **manual** in `Container.ts` | `toDynamicValue` / `toConstantValue` |

Domain classes are discovered by `ODGDecorators.loadModule` (invoked in `setUp`); their barrels are imported for side-effect in `Container.ts`. Only infra/factories/libs are bound by hand.

### Two-phase binding

`Container.setUp()` has phases, and the split is load-bearing:

```typescript
await ODGDecorators.loadModule(this);
await this.bindKernel();                       // only what the Kernel itself needs
await this.get(ContainerName.Kernel).init();   // ← the Kernel is CONSTRUCTED here
await this.bindApp();                          // everything that needs an initialized Config
```

A class resolved in phase 2 **MUST NOT** inject a binding registered in phase 3, or boot fails with
`No matching bindings found`. Late bindings are resolved inside the method that uses them, and the
constraint is stated in the class docblock.

### Typing a binding in `ContainerInterface`

A binding **MUST NOT** be typed as a union of an implementation and its interface
(`Logger | LoggerInterface`). A union collapses to its narrowest member at every injection site, so
consumers lose the concrete API and are forced to re-resolve the binding from the Container just to
reach it. Declare the concrete type when the app depends on its methods (`Logger` already satisfies
`LoggerInterface`); declare the interface when it is genuinely swappable.

## Managed artifacts

A managed artifact is any class the Container registers and the framework drives: Service, Listener,
Page, Component, Handler, Window, IPC handler. The framework only ever sees the interface, so the
conventional entrypoint — `execute()`, or `handler()` for a Listener — is the class's whole contract,
and the attemptable flow wrapped around it belongs to `@odg/chemical-x`.

**WHEN** a task writes, reviews, or debugs an artifact's entrypoint, its retry or error behavior, or a
caller of it, read `@odg/chemical-x`'s `AGENTS.md` and follow it to `docs/attemptable-flow.md` first.
That document owns the public-surface contract, the lifecycle order, and the decorator's traps — this
skill does not restate them.

## Container & Enums rules

- Developers **MUST** use `ContainerName`, `EventName`, and `ConfigName` enums instead of loose strings.
- Manual bindings **MUST** be maintained strictly inside `src/app/Container.ts`.
- Barrel files **MUST** be kept updated whenever files are added or removed from a directory.
- **MUST NOT** disable ESLint for an entire file when a narrower occurrence-level disable is enough.
- An injected primitive (`Logger`, `Config`, requester, `EventBus`) **MUST** be used directly at the call site. **MUST NOT** wrap it in a bespoke function or class that only forwards to it without adding behavior.

## Helper classes

- `CustomValidator` is a class of reusable validation **helper** functions, not a data schema. It **MUST NOT** be treated as, or replaced by, a `zod`/`yup` schema.
- A `Helpers/` folder holds **pure functions only**. A class that is `@injectable` is a Service, not a helper, and belongs in `Services/`.

## Text as data

Long text the program *carries* — AI prompts and agent instructions, message templates, static domain lists — is **data**, and `Instructions/` is its folder. Only projects that carry such text have it; it is not part of the minimum spine.

- **One coherent unit per file**, named for what it is (`DevelopmentProcess.ts`, `Workspace.ts`, `Adjustment.ts`), exported through the barrel.
- A unit **MAY** be a function whose entire body is one template literal — the parameter fills a slot in the text. It is still data, not logic.
- The consuming Service **composes** named units and **MUST NOT** author fragments inline:

```typescript
const sections = [
    developmentProcess,
    workspaceInstruction(request.repos),
    request.adjustmentComments.length > 0 ? adjustmentInstruction(request.adjustmentComments) : null,
    cardInstruction(request.card),
];

return sections.filter(Boolean).join("\n\n");
