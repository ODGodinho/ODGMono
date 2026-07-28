# Runtime — Electron

Read [architecture.md](../architecture.md) for the universal spine first. The spine appears **twice** here — once per process.

## Vocabulary

**Main process** (Node.js, the application entry point — informally "back electron"), **renderer process** (the UI), **preload script** (runs in the renderer context with `contextBridge` access), **utility process** (optional child processes). The preload script is not "the bridge" — it uses the `contextBridge` API.

## Entry ring

Three top-level folders, one per audience:

```text
app/            SHARED tier — compiled into BOTH bundles
    Enums/          ContainerName · EventName · ConfigName · pure domain enums
    Interfaces/
    Validators/
    Exceptions/
    Helpers/        pure functions only

electron/       MAIN PROCESS (universal spine + main-only entry ring)
    main.ts         bootstrap: Container.setUp() → Kernel.boot()
    preload.ts      contextBridge surface
    preload.d.ts    the type contract for what preload exposes
    Container.ts · Kernel/ · Configs/ · Services/ · Listeners/ · Providers/
    Windows/        BrowserWindow subclasses
    Tray/
    Browser/        node:os / path-resolution / launcher code

resources/      RENDERER PROCESS (universal spine + React entry ring)
    renderer.tsx    bootstrap: Container.setUp() → Kernel.boot() → createRoot()
    Container.ts · Kernel/ · Configs/
    components/ · hooks/ · pages/ · contexts/ · features/ · css/
```

## Boundary rules

1. **`app/` MUST NOT import `node:*`, `electron`, `playwright`, or touch `window`/`document`.** It is the intersection of both runtimes. Main/renderer communicate only over IPC.
2. **`ContainerInterface` MUST be split per process** — `@types/ContainerInterface.main.d.ts` and `@types/ContainerInterface.renderer.d.ts`.
3. **Two tsconfigs, not one** — `tsconfig.node.json` (`electron/` + `app/`) and `tsconfig.web.json` (`resources/` + `app/`), both extending the root.

IPC channel names **MUST** be an enum in `app/Enums/`, never string literals.

For the renderer's React conventions, read [frontend.md](./frontend.md).
