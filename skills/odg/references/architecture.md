# ODG Architecture Boundaries

Use this file when the task touches behavior, wiring, or responsibilities.

You **MUST** adhere to the rules defined in this document.

## Container, Enums

- Developers **MUST** use `ContainerName`, `EventName`, and `ConfigName` enums instead of loose strings.
- Dependencies **MUST** be injected using `@$inject` or `@$multiInject` from `~/ContainerInject`.
- Manual bindings **MUST** be maintained strictly inside `src/app/Container.ts`.
- The `@ODGDecorators.injectable(...)` decorator **MUST** be placed at the very top of decorated classes.
- Barrel files **MUST** be kept updated whenever files are added or removed from a directory.
- Whenever a binding is added in `src/app/Container.ts`, `@types/ContainerInterface.d.ts` **MUST** be updated with the corresponding entry. Failure to do so causes `Property X does not exist on type ContainerInterface` tsc errors.
- **MUST NOT** Disable the eslint rule only if you are using it and add comments stating that there is no plausible way to fix this problem.
- **MUST NOT** disable eslint in all file, prefer disable in occurrence

### Decorator Scope

| Situation | Decorator |
| --- | --- |
| Domain classes (Listener, Service) | `@ODGDecorators.injectable(ContainerName.X, "Singleton")` |
| Pages and Handlers (managed lifecycle) | `@ODGDecorators.injectable(ContainerName.X)` — no singleton |
| Components (`Pages/Components/`) | `@ODGDecorators.injectable(ContainerName.X)` — no singleton |
| Factories, libs, or dynamic values | Manual binding in `src/app/Container.ts` |

## Audit

### Logs audit

```typescript
// ❌ Logger string before object to converted
process.on("error", (error: Error) => {
    logger?.error("Updater error", {
        message: error.message,
        stack: error.stack,
    });
});

// ✅ Logger object first parameter to converted
process.on("error", (error: Error) => {
    logger?.error(error, { // Log lib resolve any object and format
        message: "Updater error"
    });
});
```
