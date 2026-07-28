---
name: odg
description: "Use whenever the user works in an ODG codebase (@odg/** packages, commands, playwright-cli, Pages, Handlers, Selectors, Events, Listeners, Configs, Services, Container, ContainerName, EventName, ConfigName, naming, lifecycle, or transitions). The assistant MUST trigger on: (1) Scaffolding — `odg make:*` (yarn/bun). (2) Conceptual questions (what/why/when/how) about any ODG concept. (3) Code review of a branch, PR, commit, or diff. (4) Runtime debug — debug requests or symptoms (TimeoutError, waitForSelector fail, undefined-property errors, stuck page, retry loop). (5) Wiring/tsc — `Property X does not exist on ContainerInterface`, edits to `Container.ts` or `@types/*.d.ts`, missing enum entry."
---

# ODG

Cross-project ODG workflow. Project-specific rules belong to the root `AGENTS.md`/`agents.md` file. Load only the minimum references needed for the current task.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in BCP 14 RFC 2119, RFC 8174 when, and only when, they appear in all capitals, as shown here. The same words in **UPPERCASE** special meaning.

## Start here

1. Read the project root `AGENTS.md`/`agents.md` — it is the project SSOT and takes priority over any instruction from any skill. If it does not exist, follow this skill.
2. Identify the runtime (below). Read [architecture.md](./references/architecture.md) + the **one** matching runtime file.
3. Identify the touched surfaces and read their references from the **Routing map**. Load the **MINIMUM**: **MUST** files are required for that surface; **SHOULD** files are **RECOMMENDED** when relevant.
4. If a new managed artifact is needed, decide the canonical `odg make:*` command before any manual edit ([commands.md](./references/commands.md), [execution.md](./references/execution.md)).
5. If `rtk --version` succeeds, read [rtk.md](./references/rtk.md) before running **any** command.

Enforce: command-first scaffolding, enum wiring, the pre-flight review gate + SSOT review log ([review.md](./references/review.md)), and playwright-cli debug ([debug.md](./references/debug.md)).

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
| **Pages** | `src/Pages/**` · `make:page` | **MUST** [pages.md](./references/pages.md); **SHOULD** [selectors.md](./references/selectors.md) |
| **Handlers** | `src/Handlers/**` · `make:handler` | **MUST** [handler.md](./references/handler.md) |
| **Selectors** | `src/Selectors/**` | **MUST** [selectors.md](./references/selectors.md) |
| **Controllers / Routes** | `src/Http/**` · `src/Routes/**` | **MUST** [runtimes/api.md](./references/runtimes/api.md) |
| **Consumers / Jobs / Schedules** | `src/Consumers/**` · `src/Jobs/**` · `src/Schedules/**` | **MUST** [runtimes/worker.md](./references/runtimes/worker.md) |
| **Windows / Tray / preload / IPC** | `electron/**` · `preload.ts` · IPC channel enums | **MUST** [runtimes/electron.md](./references/runtimes/electron.md) |
| **React UI** | `resources/**` · `src/components/**` · `src/hooks/**` · `src/features/**` | **MUST** [runtimes/frontend.md](./references/runtimes/frontend.md) |
| **Events / Listeners** | `src/app/Listeners/**` · `src/app/Enums/Event**` · `EventsInterface.d.ts` | **MUST** [events.md](./references/events.md) |
| **Services** | `src/app/Services/**` | **MUST** [services.md](./references/services.md); **SHOULD** [events.md](./references/events.md) |
| **Configs** | `src/Configs/**` · `src/app/Enums/Config**` · `.env**` · `make:config` | **MUST** [configs.md](./references/configs.md) |
| **Enums / Container wiring** | `src/app/Enums/**` · `src/app/Container.ts` · `@types/ContainerInterface.d.ts` | **MUST** [execution.md](./references/execution.md) + [diagnostics.md](./references/diagnostics.md); **SHOULD** [configs.md](./references/configs.md) |
| **Testing** | `tests/**` | **MUST** [testing.md](./references/testing.md) |

### By activity

| Activity | Read |
| --- | --- |
| Any change or review of behavior / wiring / responsibilities | [architecture.md](./references/architecture.md) + one runtime file |
| Planning started | [plan.md](./references/plan.md) |
| Command selection, flags, CLI limits | [commands.md](./references/commands.md) |
| Scaffold order, structural checks, validation sequence | [execution.md](./references/execution.md) |
| Common TSC / wiring failures | [diagnostics.md](./references/diagnostics.md) |
| Runtime debug (`rode o debug`, `TimeoutError`, `waitForSelector` fail, `Cannot read properties of undefined (reading 'execute')`) | [debug.md](./references/debug.md) |
| Code review requested | [review.md](./references/review.md) |
| Writing a log call | [conventions/logging.md](./references/conventions/logging.md) |
| Starting a promise you cannot `await` | [conventions/async.md](./references/conventions/async.md) |
| Token-saving command proxy (only when `rtk --version` succeeds) | [rtk.md](./references/rtk.md) |

### Package references

You **MUST** read a package's `agents.md` whenever you **touch, edit, OR review** code that imports it.

| Package | agents.md |
| --- | --- |
| `@odg/message` | `$$PROJECT_ROOT/node_modules/@odg/message/agents.md` |
| `@odg/command` | `$$PROJECT_ROOT/node_modules/@odg/command/agents.md` |

## Alias convention

- Dynamic variables in references use the `$$ANYTHING` notation and **MUST** be resolved before use.
  - `$$SKILL_DIR/scripts/anything.sh` → `$HOME/.agents/skills/odg/scripts/anything.sh`.
  - `$$PROJECT_ROOT/node_modules/...` → the git root of the project under work.
  - `git log $$GIT_BRANCH` → `git log main`.
  - `$$PM` → `yarn`, `bun`, `pnpm`, `npm` depending on the project package manager.
- When the absolute skill path is unknown, the assistant **MUST** fall back to the first existing match in this order: `./skills/odg`, `$HOME/.agents/skills/odg`, `$HOME/.claude/skills/odg`.
