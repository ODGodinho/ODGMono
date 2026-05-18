---
name: odg
description: "Use this skill whenever the user is working in an ODG crawler codebase or @odg ecosystem (chemical-x, command, events, playwright-cli). Triggers in five scenarios. (1) Scaffolding — any yarn odg make:page, make:handler, make:event, make:listener, make:selector, make:config, or any mention of ContainerName, EventName, ConfigName, Pages, Handlers, Selectors, Events, Listeners, Services, Components, or how to structure a crawler flow. (2) Conceptual questions — any question that asks what / why / when / how about Pages, Handlers, Selectors, Events, Listeners, Configs, Services, Container, scaffolding flow, naming conventions, lifecycle, or transition validation (e.g. 'quais tipos de handler existem?', 'qual nome devo dar ao handler?', 'como crio uma page?', 'como funciona o evento X?'), including questions that do not edit any file. (3) Code review — user says review, revisar, revise o branch, revise o PR, faça um review, or asks to review current changes, commits, staged files, or the diff. (4) Runtime debug — user says rode o debug, estou tendo erro na execução, debug o crawler, corrija o erro do crawler, crawler is failing, fix the runtime error; or symptoms like yarn dev error, TimeoutError, waitForSelector failure, Cannot read properties of undefined (reading execute), crawler stuck on a page, retry loop, handler picks wrong branch. (5) Wiring / tsc errors — Property X does not exist on type ContainerInterface, new container binding without typed entry, edits to src/app/Container.ts or @types/ContainerInterface.d.ts or @types/EventsInterface.d.ts, missing enum entry for EventName/ConfigName/ContainerName. Enforces command-first scaffolding, enum wiring, pre-flight gate before any review, single-source-of-truth review log, the playwright-cli runtime debug workflow, and MANDATORY reading of the matching references/*.md file before answering any conceptual question listed above."
---

# ODG

Use this skill for cross-project ODG workflow. Project-specific rules belong to the root AGENTS.md or agents.md file. Load only the minimum references needed for the current task.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL**  in this document are to be interpreted as described in BCP 14 RFC 2119, RFC 8174 when, and only when, they appear in all capitals, as shown here. The same words in **UPPERCASE** special meaning.

## Start here

Whenever the user's message matches **any** trigger in the `description` above — including **purely conceptual questions** (e.g. "what is", "how do I", "which types", "what is the name", "when to create"), regardless of whether the user asks to edit code — the assistant **MUST** perform the following gate **before** producing any substantive answer:

1. The assistant **MUST** read [./references/references.md](./references/references.md) and use it as the routing map.
2. Read the project root `AGENTS.md` first — it is the project SSOT and takes priority over any instruction in this skill. Follow its mandatory pre-action checklist and read any package `agents.md` files it references before implementing. If `AGENTS.md` does not exist, follow this skill's instructions.
3. The assistant **MUST** identify the topic (Page, Handler, Selector, Event/Listener, Config, Service, Testing, Container/Wiring, Architecture, Plan, Review, Debug) from the user's question and **MUST** read every reference file marked **MUST** for that topic. Reference files marked **SHOULD** are **RECOMMENDED** and **SHOULD** be read when relevant.
4. If a new Page, Handler, Selector, Event, Listeners or Config is needed, decide the canonical yarn odg make:* command before any manual edit.
5. If `rtk --version` command exists, read [RTK](./references/rtk.md) before running **any** command. Running commands without reading RTK first is **NOT** allowed.

## Alias convention

- Dynamic variables in references use the `$$NAME` notation and **MUST** be resolved before use.
  - Example: `$$SKILL_DIR/scripts/anything.sh` → `$HOME/.agents/skills/odg/scripts/anything.sh`.
  - Example: `git log $$GIT_BRANCH` → `git log main`.
- When the absolute skill path is unknown, the assistant **MUST** fall back to the first existing match in this order: `./skills/odg`, `$HOME/.agents/skills/odg`, `$HOME/.claude/skills/odg`.
