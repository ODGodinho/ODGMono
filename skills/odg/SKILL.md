---
name: odg
description: "Use whenever the user works in an ODG codebase (@odg/** packages, commands, playwright-cli, Pages, Handlers, Selectors, Events, Listeners, Configs, Services, Container, ContainerName, EventName, ConfigName, naming, lifecycle, or transitions). The assistant MUST trigger on: (1) Scaffolding — `odg make:*` (yarn/bun). (2) Conceptual questions (what/why/when/how) about any ODG concept. (3) Code review of a branch, PR, commit, diff, or of a whole task spanning several MRs (a card link, an MR link, 'revise a tarefa'). (4) Runtime debug — debug requests or symptoms (TimeoutError, waitForSelector fail, undefined-property errors, stuck page, retry loop). (5) Wiring/tsc — `Property X does not exist on ContainerInterface`, edits to `Container.ts` or `@types/*.d.ts`, missing enum entry."
---

# ODG

Cross-project ODG workflow. Project-specific rules belong to the root `AGENTS.md` file. Load only the minimum references needed for the current task.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in BCP 14 RFC 2119, RFC 8174 when, and only when, they appear in all capitals, as shown here. The same words in **UPPERCASE** special meaning.

## Start here

1. The `AGENTS.md` it is the project SSOT and takes priority over any instruction from any skill or prompt. If it does not exist, prioritize the skill's instructions over the prompt..
2. Identify the touched surfaces and read their references from the **Routing map**. Load the **MINIMUM**: **MUST** files are required for that surface; **SHOULD** files are **RECOMMENDED** when relevant.
3. If `rtk --version` succeeds, read [rtk.md](./references/rtk.md) before running **any** command.

Reading a reference, an AGENTS.md, or a .d.ts/type file at a known path MUST use the Read tool, never cat/head/tail via Bash — Bash is for commands that have no dedicated tool, not for file inspection. Only fall back to ls/find/grep when the exact path is genuinely unknown; once found, Read it rather than cat it.

## Runtime detection

Decide once, from the project root, cheapest signal first. Read exactly one runtime file.

| Signal | Runtime | Read |
| --- | --- | --- |
| `electron` in `package.json` dependencies, or `electron/` + `resources/` folders | Electron | [runtimes/electron.md](./references/runtimes/electron.md) |
| `src/Pages/` + `src/Selectors/`, or `playwright`/`puppeteer` dependency | Crawler | [runtimes/crawler.md](./references/runtimes/crawler.md) |
| `react` dependency with no `electron` | Frontend | [runtimes/frontend.md](./references/runtimes/frontend.md) |

An Electron project carries the Frontend ring inside `resources/` — read [runtimes/frontend.md](./references/runtimes/frontend.md) too, but only when the task touches the renderer.

## Routing map

Read the matching reference **before** you plan, edit, or review one of these files.

### By surface

| Surface | Trigger | Read |
| --- | --- | --- |
| **Architecture** | Any change or review of behavior / wiring / responsibilities, or deciding between a helper and a class, whether a class should be split, or whether a class is a DTO or a Service, Writing a log call, starting a promise you cannot `await`, or declaring a constant | **MUST** [architecture.md](./references/architecture.md) + [conventions.md](./references/conventions.md) + one runtime file |
| **Commands** | Command selection, flags, CLI limits, before run anything command | [commands.md](./references/commands.md) |
| **Pages** | `src/Pages/**` · `make:page` | **MUST** [pages.md](./references/pages.md); **SHOULD** [selectors.md](./references/selectors.md) |
| **Handlers** | `src/Handlers/**` · `make:handler` | **MUST** [handler.md](./references/handler.md) |
| **Selectors** | `src/Selectors/**` | **MUST** [selectors.md](./references/selectors.md) |
| **Windows / Tray / preload / IPC** | `electron/**` · `preload.ts` · IPC channel enums | **MUST** [runtimes/electron.md](./references/runtimes/electron.md) |
| **React UI** | `resources/**` · `src/components/**` · `src/hooks/**` · `src/features/**` | **MUST** [runtimes/frontend.md](./references/runtimes/frontend.md) |
| **Events / Listeners** | `src/app/Listeners/**` · `src/app/Enums/Event**` · `EventsInterface.d.ts` | **MUST** [events.md](./references/events.md) |
| **Services** | `src/app/Services/**` | **MUST** [services.md](./references/services.md); **SHOULD** [events.md](./references/events.md) |
| **Configs** | `src/Configs/**` · `src/app/Enums/Config**` · `.env**` · `make:config` | **MUST** [configs.md](./references/configs.md) |
| **Enums / Container wiring** | `src/app/Enums/**` · `src/app/Container.ts` · `@types/ContainerInterface.d.ts` | **MUST** [diagnostics.md](./references/diagnostics.md); **SHOULD** [configs.md](./references/configs.md) |
| **Diagnostic** | Common TSC / wiring failures or lint error | [diagnostics.md](./references/diagnostics.md) |
| **Testing** | `tests/**` | **MUST** [testing.md](./references/testing.md) |
| **Browser Debugger** | Runtime debug (`rode o debug`, `TimeoutError`, `waitForSelector` fail, `Cannot read properties of undefined (reading 'execute')`, playwright error) | [debug.md](./references/debug.md) |
| **Code Review** | Code review requested | [review.md](./references/review.md) |
| **Commands RTK** | Token-saving command proxy (only when `rtk --version` succeeds) | [rtk.md](./references/rtk.md) |
| **Prompt Plans** | Planning started | [plan.md](./references/plan.md) |

Unlisted runtime (API, worker) → apply [architecture.md](./references/architecture.md) only; no dedicated runtime file exists yet.

### Package references

You **MUST** read a package's `AGENTS.md` whenever you **touch, edit, OR review** code that imports it.

| Package | Trigger | AGENTS.md |
| --- | --- | --- |
| `@odg/chemical-x` | Any managed artifact — Page, Component, Handler, `@ODGDecorators.*`, `@attemptableFlow`, `retry()`, Browser/Context/Page wrappers | `$$PROJECT_ROOT/node_modules/@odg/chemical-x/AGENTS.md` |
| `@odg/message` | If need message send with request and response (Requester, HTTP) | `$$PROJECT_ROOT/node_modules/@odg/message/AGENTS.md` |
| `@odg/axios` | Axios with @odg/message interface | `$$PROJECT_ROOT/node_modules/@odg/axios/AGENTS.md` |
| `@odg/command` | If need command to make files | `$$PROJECT_ROOT/node_modules/@odg/command/AGENTS.md` |
| `@odg/log` | If need use logger/audit application | `$$PROJECT_ROOT/node_modules/@odg/log/AGENTS.md` |
| `@odg/json-log` | If you need standardized structured logging, all logs share the same JSON format, use this if need filter key in graylog/Kibana etc | `$$PROJECT_ROOT/node_modules/@odg/json-log/AGENTS.md` |

## Alias convention

- Dynamic variables in references use the `$$ANYTHING` notation and **MUST** be resolved before use.
  - `$$SKILL_DIR/scripts/anything.sh` → `$HOME/.agents/skills/odg/scripts/anything.sh`.
  - `$$PROJECT_ROOT/node_modules/...` → the git root of the project under work.
  - `git log $$GIT_BRANCH` → `git log main`.
  - `$$PM` → `yarn`, `bun`, `pnpm`, `npm` depending on the project package manager.
- When the absolute skill path is unknown, the assistant **MUST** fall back to the first existing match in this order: `./skills/odg`, `$HOME/.agents/skills/odg`, `$HOME/.claude/skills/odg`.
