---
name: odg
description: "Use this skill whenever the user is working in an ODG crawler codebase or @odg ecosystem (chemical-x, command, events, playwright-cli). Triggers in four scenarios. (1) Scaffolding — any yarn odg make:page, make:handler, make:event, make:listener, make:selector, make:config, or any mention of ContainerName, EventName, ConfigName, Pages, Handlers, Selectors, Events, Listeners, Services, Components, or how to structure a crawler flow. (2) Code review — user says review, revisar, revise o branch, revise o PR, faça um review, or asks to review current changes, commits, staged files, or the diff. (3) Runtime debug — user says rode o debug, estou tendo erro na execução, debug o crawler, corrija o erro do crawler, crawler is failing, fix the runtime error; or symptoms like yarn dev error, TimeoutError, waitForSelector failure, Cannot read properties of undefined (reading execute), crawler stuck on a page, retry loop, handler picks wrong branch. (4) Wiring / tsc errors — Property X does not exist on type ContainerInterface, new container binding without typed entry, edits to src/app/Container.ts or @types/ContainerInterface.d.ts or @types/EventsInterface.d.ts, missing enum entry for EventName/ConfigName/ContainerName. Enforces command-first scaffolding, enum wiring, pre-flight gate before any review, single-source-of-truth review log, and the playwright-cli runtime debug workflow.""
---

# ODG

Use this skill for cross-project ODG workflow. Project-specific rules belong to the root AGENTS.md or agents.md file. Load only the minimum references needed for the current task.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 RFC 2119, RFC 8174 when, and only when, they appear in all capitals, as shown here. The same words in **UPPERCASE**lowercase** carry**no** special meaning.

## Start here

1. Read the project root `AGENTS.md` first — it is the project SSOT and takes priority over any instruction in this skill. Follow its mandatory pre-action checklist and read any package `agents.md` files it references before implementing. If `AGENTS.md` does not exist, follow this skill's instructions.
2. Treat @odg/command as CLI-first. Never describe it as a library API.
3. If a new Page, Handler, Selector, Event, Listeners or Config is needed, decide the canonical yarn odg make:* command before any manual edit.
4. **MUST** read [references/architecture.md](./references/architecture.md) before read, change or review any file.
5. If `rtk --version` command exists, you **MUST** read [RTK](./references/rtk.md) before running **any** command. Running commands without reading RTK first is **NOT** allowed.
6. If the task is a code review, `logs/review.log` is the only change-discovery artifact after the review script runs. If it diverges from disk, the agent **MUST** stop and regenerate or fix the artifact instead of opening extra git diffs.

## Path convention

- `$SKILL_DIR` **MUST** be replaced with the absolute directory containing this `SKILL.md` before any command runs.
- IA **MUST NOT** leave `$SKILL_DIR` literal and **MUST NOT** rewrite it to a relative form (e.g., `./skills/odg/...`).
- If the absolute path is unknown, IA **MUST** fall back to the first match: `./skills/odg`, `$HOME/.agents/skills/odg`, `$HOME/.claude/skills/odg`.

## Reference map

- [references/pages.md](./references/pages.md): page intent and page-level behavior.
- [references/configs.md](./references/configs.md): config and environment changes.
- [references/handler.md](./references/handler.md): when to create or use a Handler, plus transition validation and page-state checks.
- [references/selectors.md](./references/selectors.md): selector conventions and regex request guidance.
- [references/events.md](./references/events.md): Events and Listeners.
- [references/services.md](./references/services.md): service lifecycle, orchestration, and transaction handler pattern.
- [references/plan.md](./references/plan.md): planning rules and output shape.
- [references/commands.md](./references/commands.md): command selection, flags, naming, and known CLI limits.
- [references/execution.md](./references/execution.md): scaffold order, structural checks, and validation sequence.
- [references/architecture.md](./references/architecture.md): responsibilities and wiring boundaries.
- [references/testing.md](./references/testing.md): Vitest patterns for Pages, Handlers, and Listeners.
- [references/diagnostics.md](./references/diagnostics.md): common TSC and wiring failures.
- [references/debug.md](./references/debug.md): runtime debug workflow. Read this when the user reports runtime errors, selector failures, or asks to debug execution. Trigger phrases include: rode o debug, estou tendo erro na execução, debug o crawler, run debug, crawler is failing, fix the runtime error.
- [references/review.md](./references/review.md): code review workflow and findings format, if running code-review **MUST** read this reference.
