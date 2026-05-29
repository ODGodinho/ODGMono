---
name: odg
description: "Use whenever the user works in an ODG codebase (@odg/** packages, commands, playwright-cli, Pages, Handlers, Selectors, Events, Listeners, Configs, Services, Container, ContainerName, EventName, ConfigName, naming, lifecycle, or transitions). The assistant MUST trigger on: (1) Scaffolding — `yarn odg` codebase @odg. (2) Conceptual questions (what/why/when/how) about. (3) Code review/revisar a branch, PR, commit, or diff. (4) Runtime debug — debug requests or symptoms (TimeoutError, waitForSelector fail, undefined-property errors, stuck page, retry loop). (5) Wiring/tsc — `Property X does not exist on ContainerInterface`, edits to `Container.ts` or `@types/*.d.ts`, missing enum entry. The assistant MUST enforce command-first scaffolding, enum wiring, pre-flight review gate, SSOT review log, playwright-cli debug, and MUST read matching `references/*.md` before any conceptual answer."
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
