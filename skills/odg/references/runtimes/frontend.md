# Runtime — Frontend (standalone web)

Read [architecture.md](../architecture.md) for the universal spine first. In an Electron renderer this is the same ring, minus IPC — see [electron.md](./electron.md).

## Entry ring

Once a second business domain appears, group by feature rather than by type:

```text
src/
    features/<feature>/     components · hooks · api · types — the feature owns its slice
    components/             SHARED components only
    hooks/ · lib/ · css/
    app/                    Container, Kernel, providers, router
```

The trigger to move from type-folders to feature-folders is **a second bounded context, not a file count**. A feature **MUST NOT** import from another feature; compose them at the `app/` layer.
