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
