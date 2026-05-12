---
name: odg
description: "Use this skill whenever the task is in an ODG crawler codebase or @odg ecosystem and involves planning or implementing Pages, Handlers, Selectors, Events, Listeners, configs, container wiring, or any yarn odg make:* command. Use it when the user mentions make:page, make:handler, make:event, make:listener, make:selector, make:config, ContainerName, EventName, ConfigName, or asks how to structure a crawler flow, because the correct answer depends on command-first scaffolding, enum wiring, and post-scaffold validation. Use when the user mentions scaffolding OR when the app fails at runtime — yarn dev error, crawler exception/timeout, handler picks wrong branch, selector wait fails, or phrases like"
---

# ODG

Use this skill to keep ODG changes command-first and low-noise. Load only the reference files needed for the current task.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 RFC 2119, RFC 8174 when, and only when, they appear in all capitals, as shown here. The same words in **lowercase** carry **no** special meaning.

## Start here

1. Read the project root `AGENTS.md` first — it is the project SSOT and takes priority over any instruction in this skill. Follow its mandatory pre-action checklist and read any package `agents.md` files it references before implementing. If `AGENTS.md` does not exist, follow this skill's instructions.
2. Treat @odg/command as CLI-first. Never describe it as a library API.
3. If a new Page, Handler, Selector, Event, Listeners or Config is needed, decide the canonical yarn odg make:* command before any manual edit.
4. **MUST** read [references/architecture.md](./references/architecture.md) before read, change or review any file.
5. If `rtk --version` command exists, you **MUST** read [RTK](./references/rtk.md) before running **any** command. Running commands without reading RTK first is **NOT** allowed.

## Path convention

- `$SKILL_DIR` **MUST** be replaced with the absolute directory containing this `SKILL.md` before any command runs.
- IA **MUST NOT** leave `$SKILL_DIR` literal and **MUST NOT** rewrite it to a relative form (e.g., `./skills/odg/...`).
- If the absolute path is unknown, IA **MUST** fall back to the first match: `./skills/odg`, `$HOME/.agents/skills/odg`, `$HOME/.claude/skills/odg`.

## Reference map

- [references/pages.md](./references/pages.md): use reference of pages of crawler, or intent of page.
- [references/configs.md](./references/configs.md): use reference to change, create or update configs or environments
- [references/handler.md](./references/handler.md): Create a Handler whenever a step or transition can produce 2 or more distinct outcomes that must be identified at runtime (login results, page transitions, conditional modals). use reference of handler and transition validation, validate step success, check page transition, validate page state.
- [references/selectors.md](./references/selectors.md): use reference of selectors and regex request.
- [references/events.md](./references/events.md): Use reference of Event and Listeners
- [references/services.md](./references/services.md): service lifecycle, orchestration, and transaction handler pattern.
- [references/plan.md](./references/plan.md): planning rules and output shape.
- [references/commands.md](./references/commands.md): command selection, flags, naming, and known CLI limits.
- [references/execution.md](./references/execution.md): scaffold order, structural checks, and validation sequence.
- [references/architecture.md](./references/architecture.md): responsibilities and wiring boundaries.
- [references/testing.md](./references/testing.md): vitest setup, test patterns for Pages, Handlers, and Listeners.
- [references/diagnostics.md](./references/diagnostics.md): common tsc errors, wiring failures, and how to fix them.
- [references/debug.md](./references/debug.md): runtime debug workflow — MUST follow when user reports execution/runtime errors or asks to debug the crawler. Boots playwright-cli browser, runs `yarn dev` with `BROWSER_CONNECT`, captures errors, classifies (DOM vs DI/TSC), fixes, re-validates. If the user says any of: "rode o debug", "estou tendo erro na execução", "debug o crawler", "run debug", "crawler is failing", "fix the runtime error", or describes a runtime/selector failure they want debugged — you **MUST** read
- [references/review.md](./references/review.md): If the user requests a review of changes, you **MUST** follow the process in, read references and follow the process.
