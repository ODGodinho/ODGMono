---
name: odg
description: "Use whenever the user works in an ODG codebase (@odg/** packages, commands, playwright-cli, Pages, Handlers, Selectors, Events, Listeners, Configs, Services, Container, ContainerName, EventName, ConfigName, naming, lifecycle, or transitions). The assistant MUST trigger on: (1) Scaffolding — `odg make:*` (yarn/bun). (2) Conceptual questions (what/why/when/how) about any ODG concept. (3) Code review of a branch, PR, commit, diff, or of a whole task spanning several MRs (a card link, an MR link, 'revise a tarefa'). (4) Runtime debug — debug requests or symptoms (TimeoutError, waitForSelector fail, undefined-property errors, stuck page, retry loop). (5) Wiring/tsc — `Property X does not exist on ContainerInterface`, edits to `Container.ts` or `@types/*.d.ts`, missing enum entry."
---

# ODG

Cross-project ODG workflow. Project-specific rules belong to the root `AGENTS.md` file.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** follow BCP 14 (RFC 2119, RFC 8174) when written in capitals.

## Start here

1. The root `AGENTS.md` is the project SSOT and takes priority over any instruction from any skill or prompt. If it does not exist, the skill's instructions take priority over the prompt.
2. Identify the touched surfaces and read their references from the **Routing map**. Load the **MINIMUM**: **MUST** files are required for that surface; **SHOULD** files are **RECOMMENDED** when relevant.
3. If `rtk --version` succeeds, read [rtk.md](./references/rtk.md) before running **any** command.

Reading a reference, an AGENTS.md, or a .d.ts/type file at a known path MUST use the Read tool, never cat/head/tail via Bash — Bash is for commands that have no dedicated tool, not for file inspection. Only fall back to ls/find/grep when the exact path is genuinely unknown; once found, Read it rather than cat it.

`$$SKILL_DIR/scripts/*` are executed, never opened: each one prints what the agent needs.

## Runtime detection

Decide once, from the project root, cheapest signal first. Read exactly one runtime file.

| Signal | Runtime | Read |
| --- | --- | --- |
| `electron` in `package.json` dependencies, or `electron/` + `resources/` folders | Electron | [runtimes/electron.md](./references/runtimes/electron.md) |
| `src/Pages/` + `src/Selectors/`, or `playwright`/`puppeteer` dependency | Crawler | [runtimes/crawler.md](./references/runtimes/crawler.md) |
| `react` dependency with no `electron` | Frontend | [runtimes/frontend.md](./references/runtimes/frontend.md) |
| `@odg/http` dependency, or `src/Http/Routes/` | API | [runtimes/api.md](./references/runtimes/api.md) |

An Electron project carries the Frontend ring inside `resources/` — read [runtimes/frontend.md](./references/runtimes/frontend.md) too, but only when the task touches the renderer.

## Routing map

Read the matching reference **before** you plan, edit, or review one of these files. A trigger matches the file's role in the architecture, not its name: `src/Handlers/**` means a managed ODG Handler, not every file that sits inside a folder called `Handlers`.

### By surface

| Surface | Trigger | Read |
| --- | --- | --- |
| **Architecture** | Any change or review of behavior / wiring / responsibilities, or deciding between a helper and a class, whether a class should be split, or whether a class is a DTO or a Service, Writing a log call, starting a promise you cannot `await`, or declaring a constant | **MUST** [architecture.md](./references/architecture.md) + [conventions.md](./references/conventions.md) + one runtime file |
| **Commands** | Scaffolding with `odg make:*`, command flags, CLI limits | [commands.md](./references/commands.md) |
| **Pages** | `src/Pages/**` · `make:page` | **MUST** [pages.md](./references/pages.md); **SHOULD** [selectors.md](./references/selectors.md) |
| **Handlers** | `src/Handlers/**` · `make:handler` | **MUST** [handler.md](./references/handler.md) |
| **Selectors** | `src/Selectors/**` | **MUST** [selectors.md](./references/selectors.md) |
| **Browser automation** | Pages, Components, Handlers, and any code that calls `page`, `locator`, `route` or `context` | **MUST** [browser-automation.md](./references/browser-automation.md) |
| **Windows / Tray / preload / IPC** | `electron/**` · `preload.ts` · IPC channel enums | **MUST** [runtimes/electron.md](./references/runtimes/electron.md) |
| **HTTP routes / RequestContainer** | `src/Http/**` · `src/app/RequestContainer.ts` · `src/database/**` · `make:route` · `make:middleware` | **MUST** [runtimes/api.md](./references/runtimes/api.md) |
| **React UI** | `resources/**` · `src/components/**` · `src/hooks/**` · `src/features/**` | **MUST** [runtimes/frontend.md](./references/runtimes/frontend.md) |
| **Events / Listeners** | `src/app/Listeners/**` · `src/app/Enums/Event**` · `EventsInterface.d.ts` | **MUST** [events.md](./references/events.md) |
| **Services Crawlers** | `src/app/Services/**` | **MUST** [services.md](./references/runtimes/crawler/services.md); **SHOULD** [events.md](./references/events.md) |
| **Configs** | `src/Configs/**` · `src/app/Enums/Config**` · `.env**` · `make:config` | **MUST** [configs.md](./references/configs.md) |
| **Enums / Container wiring** | `src/app/Enums/**` · `src/app/Container.ts` · `@types/ContainerInterface.d.ts` | **MUST** [diagnostics.md](./references/diagnostics.md); **SHOULD** [configs.md](./references/configs.md) |
| **Diagnostic** | Common TSC / wiring failures or lint error | [diagnostics.md](./references/diagnostics.md) |
| **Testing** | `tests/**` | **MUST** [testing.md](./references/testing.md) |
| **Build** | `package.json` scripts or dependencies · `.husky/**` · lockfile · `Dockerfile` · `.gitlab-ci.yml` | **MUST** [build.md](./references/build.md) |
| **Browser Debugger** | Runtime debug (`rode o debug`, `TimeoutError`, `waitForSelector` fail, `Cannot read properties of undefined (reading 'execute')`, playwright error) | [debug.md](./references/debug.md) |
| **Code Review** | Code review requested | [review.md](./references/review.md) |
| **Delivering** | Before you report done, commit, or push | **MUST** [review/checklist.md](./references/review/checklist.md) |
| **Review findings** | Applying findings from a review | **MUST** *Applying review findings* below + the reference each finding cites |
| **Prompt Plans** | Planning started | [plan.md](./references/plan.md) |

Unlisted runtime (worker) → apply [architecture.md](./references/architecture.md) only; no dedicated runtime file exists yet.

### Package references

Read a package's `AGENTS.md` when the work **uses that package's API** — a mere `import` elsewhere in the file is not a reason to read it.

| Package | Trigger | AGENTS.md |
| --- | --- | --- |
| `@odg/chemical-x` | Any managed artifact — Page, Component, Handler, `@ODGDecorators.*`, `@attemptableFlow`, `retry()`, Browser/Context/Page wrappers | `$$PROJECT_ROOT/node_modules/@odg/chemical-x/AGENTS.md` |
| `@odg/message` | If need message send with request and response (Requester, HTTP) | `$$PROJECT_ROOT/node_modules/@odg/message/AGENTS.md` |
| `@odg/axios` | Axios with @odg/message interface | `$$PROJECT_ROOT/node_modules/@odg/axios/AGENTS.md` |
| `@odg/command` | If need command to make files | `$$PROJECT_ROOT/node_modules/@odg/command/AGENTS.md` |
| `@odg/log` | If need use logger/audit application | `$$PROJECT_ROOT/node_modules/@odg/log/AGENTS.md` |
| `@odg/json-log` | If you need standardized structured logging, all logs share the same JSON format, use this if need filter key in graylog/Kibana etc | `$$PROJECT_ROOT/node_modules/@odg/json-log/AGENTS.md` |

## Before you deliver

Before you report a coding task as done, commit, or push:

1. Read [review/checklist.md](./references/review/checklist.md) and evaluate your diff against it exactly as the reviewer will: **Always**, **Declaration** and **Contract**, and every section whose trigger your diff shows. Fix every item that fires. An item whose fix is a *Strategy change* ([review.md](./references/review.md) → *Strategy change*) is not applied by the writer: ask the lead. The reviewer finds what you did not look for: most second-round findings in this team's history broke a rule that already existed in the checklist.
2. Run lint and tsc on the files you touched ([rtk.md](./references/rtk.md) when rtk is present) and fix what they report, warnings included. Do not count on CI to run lint: this run is the gate.

## Applying review findings

**WHEN** you apply findings from a review (pasted from another chat, read from GitLab, or from `.review/<branch>/output.md`):

1. Read every finding before editing and group them by cause. Two or more findings on the same flow mean the flow needs a plan, not a series of patches: re-plan with [plan.md](./references/plan.md) first. Applying 💡 one by one is how the fix for one finding becomes the next finding.
2. Before changing code for a finding, read the rule it cites (the checklist item and its `source:line`). Your fix must satisfy that rule and every rule your new lines trigger.
3. Apply a 💡 as written. Do **NOT** apply a 💡 that changes the strategy ([review.md](./references/review.md) → *Strategy change*): answer it with the trade-off and wait for the lead's decision.
4. When you disagree with a finding, reply with the reason (the card, the code, the rule). Do not skip it silently.
5. Fix code is judged as new code: [review/checklist.md](./references/review/checklist.md) → **Review-fix code** names how fixes usually go wrong.
6. After the batch, run *Before you deliver* (it re-checks the card's criteria too), then request a new review.

## Alias convention

- Dynamic variables in references use the `$$ANYTHING` notation and **MUST** be resolved before use.
  - `$$SKILL_DIR/scripts/anything.sh` → `$HOME/.agents/skills/odg/scripts/anything.sh`.
  - `$$PROJECT_ROOT/node_modules/...` → the git root of the project under work.
  - `git log $$GIT_BRANCH` → `git log main`.
  - `$$PM` → `yarn`, `bun`, `pnpm`, `npm` depending on the project package manager.
- When the absolute skill path is unknown, the assistant **MUST** fall back to the first existing match in this order: `./skills/odg`, `$HOME/.agents/skills/odg`, `$HOME/.claude/skills/odg`.
