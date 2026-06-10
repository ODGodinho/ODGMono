# Skill References Map

Load the **MINIMUM** references required by the touched surfaces
The reference **MUST** always be there whenever you start a plan, edit one of these files.

Then load additional references based on file paths:

## Files references

- **Pages**: page intent and page-level behavior.
  - Trigger: File: `src/Pages/**` Command: `make:page`
  - **MUST** read [references/pages.md](./pages.md)
  - **SHOULD** read [references/selectors.md](./selectors.md) (if selectors are involved)
- **Configs**: config and environment involved.
  - Trigger: File: `src/Configs/**`, `src/app/Enums/Config**`, `.env**` Command: `make:config`
  - **MUST** read [references/configs.md](./configs.md)
- **Handlers** when to create or use a Handler, plus transition validation and page-state checks.
  - Trigger: `src/Handlers/**` Command: `make:handler`
  - **MUST** read [references/handler.md](./handler.md)
- **Selectors** - selector conventions and regex request guidance.
  - Trigger: `src/Selectors/**`
  - **MUST** read [references/selectors.md](./selectors.md)
- **Events / Listeners** Events and Listeners to dispatch events
  - Trigger: `src/app/Listeners/**`, `src/app/Enums/Event**`, or `EventsInterface.d.ts`
  - **MUST** read [references/events.md](./events.md)
- **Services** service lifecycle, orchestration, and transaction handler pattern.
  - Trigger: `src/app/Services/**`
  - **MUST** read [references/services.md](./services.md)
  - **SHOULD** read [references/events.md](./events.md) (if service dispatches events)
- **Testing**
  - Trigger: `tests/**`
  - **MUST** read [references/testing.md](./testing.md)
- **Enums / Container wiring**
  - Trigger: `src/app/Enums/**`, `src/Configs/**`, `src/app/Container.ts`, `@types/ContainerInterface.d.ts`
  - **MUST** read [references/execution.md](./execution.md)
  - **MUST** read [references/diagnostics.md](./diagnostics.md)
  - **SHOULD** read [references/configs.md](./configs.md) (if ConfigName/env keys are involved)

## Packages references

You **MUST** read a package's `agents.md` whenever you **touch, edit, OR review** code that imports it.

| Package Name | Agents.md | Description |
| --- | --- | --- |
| `@odg/message` | [agents.md](./node_modules/@odg/message/agents.md) | All request/http or message of this packageß |

## Others references

- **Plan** planning is started
  - read [references/plan.md](./plan.md)
- **Commands** command selection, flags, naming, and known CLI limits.
  - [references/commands.md](./commands.md)
- **Execution** scaffold order, structural checks, and validation sequence.
  - [references/execution.md](./execution.md)
- **Architecture** responsibilities and wiring boundaries. read always change or review code
  - [references/architecture.md](./architecture.md)
- **Diagnostics** common TSC and wiring failures.
  - [references/diagnostics.md](./diagnostics.md)
- **Debugger** runtime debug workflow. Trigger phrases: `rode o debug`, `erro na execução`, `debug o crawler`, `run debug`, `crawler is failing`, `fix the runtime error`, Crawler raised a `TimeoutError`, `waitForSelector` failure, or `Cannot read properties of undefined (reading 'execute')` at runtime.
  - [references/debug.md](./debug.md)
- **Review**  code review workflow and findings format. read if request a code review.
  - [references/review.md](./review.md)
- **RTK** token-saving command proxy. Load only when `rtk --version` succeeds.
  - [`references/rtk.md`](./rtk.md)
