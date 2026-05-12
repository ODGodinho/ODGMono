# Testing

Tests live in `tests/vitest/`. The runner is **Vitest**. Tests run with `yarn test:ci`.

## tests/vitest/init.ts

This file runs before every test suite. Its job is to populate `process.env` with valid dummy values for all **required** config keys, meaning those without `.optional()` in the Zod schema.

Rules:

- Every `ConfigName` key that maps to a **required** Zod field **MUST** have a dummy value here.
- Dummy values must satisfy the Zod type: numbers as numeric strings (`"5000"`), booleans as `"true"` or `"false"`, enums as a valid member.
- When you add a new required config via `make:config`, add its dummy here immediately.

```typescript
// tests/vitest/init.ts
process.env.APP_NAME = "test-app";
process.env.USE_HEADLESS = "true";
process.env.HANDLER_TIMEOUT = "5000";
process.env.HANDLER_ATTEMPT = "2";
process.env.PAGE_ATTEMPT = "3";
```
