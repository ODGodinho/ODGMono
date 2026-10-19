# Testing

This skill is cross-project. The test layout, runner projects, and setup chain are **project-specific** and **MUST** be read from the project itself, never assumed from this file:

1. The root `AGENTS.md`, and any testing doc it points to (for example `docs/**/testing-strategy.md`) — SSOT.
2. `package.json` scripts (`test`, `test:ci`, `test:unit`, `test:browser`, …) and the runner config (`vitest.config.*`, `vitest.workspace.*`, `bunfig.toml`) — the authoritative list of suites and setup files.

Layouts differ across ODG projects: a single `tests/vitest/` with one runner, or split `tests/unit/` + `tests/browser/` with per-project setup files chaining into a shared bootstrap. Locate the setup file(s) from the runner config before editing anything.

## Universal invariant

Every `ConfigName` key mapping to a **required** Zod field (no `.optional()`) **MUST** have a dummy value in the project's test setup, or the suite fails at boot. When you add a required config via `make:config`, add its dummy in the same change.

Rules:

- Dummy values **MUST** satisfy the Zod type: numbers as numeric strings (`"5000"`), booleans as `"true"`/`"false"`, enums as a valid member.
- **MUST** follow the assignment style already used in that setup file. `??=` is idempotent and preserves a value already present in the environment; plain `=` overwrites it. Do not switch styles.

## Test design

- A negative case changes **one** factor from the positive case and keeps everything else equal; otherwise the test does not prove which factor matters.
- A new branch of logic gets a test in the existing suite of the same subject, in the same MR.
- Test the behavior the card changes (how many times a hook fires in a real boot), not only that a class resolves from the container.
- An assertion on a value the code reads from env uses that env value (the setup's value or `env.get(...)`), never a local literal: the literal breaks in another environment.
- Test doubles enter through the constructor. **MUST NOT** mutate a prototype or a module global (`S3.prototype.getObject = …`).
- Exercise the public method and assert what reaches the double (`vi.mocked(requester.request).mock.calls`). Never call a protected member through brackets.
- Assert a rejection with `await expect(promise).rejects…` or `promise.catch((exception: unknown) => exception)`; no try/catch helper.
- A test moves and renames with its source: the path under `tests/` mirrors `src/`.
- Behavior of a shared package is tested in the package; a consumer tests only its own integration.
- When the approach changes, the tests and test comments written for the old approach change with it.
