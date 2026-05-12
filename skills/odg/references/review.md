# ODG Code Review Guidelines

Use this file when the user requests a code review of the current changes, unpushed commits, or staged files.

## 🕵️‍♂️ Step-by-Step Review Process

1. **WHEN** execute exact command if shell end with errors, **MUST** stop the review and ask the user to fix the errors before continuing.
  - RTK available: `rtk tsc --noEmit && rtk lint eslint --quiet && rtk vitest run`
  - RTK not available: `yarn tsc --noEmit && yarn eslint --quiet && yarn vitest run`
2. **Identify Changes:** Run script from the project root. **MUST** be expanded to the absolute skill directory per the "Path convention" in `SKILL.md`.
   - `$SKILL_DIR/scripts/review.sh > logs/review.log`
3. **MUST** read logs/review.log and review the changes
4. **MUST** load all references related to the changes files
5. **Forgiveness Rule:** If a file is modified but the surrounding legacy code is out of standard, DO NOT propagate the error to your review unless the user's specific change caused it. Focus on the impact of the new code.
6. **Validation:** Check if the changes follow the mandatory "Command-First" workflow (scaffolded correctly) and if all wiring (Container, Enums, Types) is complete.

## Skill References Map (MUST follow)

Load the **minimum** references required by the touched surfaces. At minimum, always load:

- [references/architecture.md](./architecture.md)

Then load additional references based on file paths:

- **Pages**
  - Trigger: `src/Pages/**`
  - MUST read: - [references/pages.md](./pages.md)
  - SHOULD read: [references/selectors.md](./selectors.md) (if selectors are involved)
- **Handlers**
  - Trigger: `src/Handlers/**` OR edits to `src/Handlers/BaseHandler.ts`
  - MUST read: [references/handler.md](./handler.md)
- **Events / Listeners**
  - Trigger: `src/app/Listeners/**`, `src/app/Enums/EventName.ts`, or `@types/EventsInterface.d.ts`
  - MUST read: [references/events.md](./events.md)
- **Services**
  - Trigger: `src/app/Services/**`
  - MUST read: [references/services.md](./services.md)
  - SHOULD read: [references/events.md](./events.md) (if service dispatches events)
- **Config / Enums / Container wiring**
  - Trigger: `src/app/Enums/**`, `src/Configs/**`, `src/app/Container.ts`, `@types/ContainerInterface.d.ts`
  - MUST read: [references/execution.md](./execution.md)
  - MUST read: [references/diagnostics.md](./diagnostics.md)
  - SHOULD read: [references/configs.md](./configs.md) (if ConfigName/env keys are involved)
- **Testing**
  - Trigger: `tests/**`
  - MUST read:  [references/testing.md](./testing.md)

## Review Checklist (ODG-specific)

Use this checklist when writing comments:

- **Base injected properties consistency**
  - Pages/Handlers should use base-injected fields as defined by `references/pages.md` and `references/handler.md` (e.g., `logger`, `config`, `bus`, `$$s`).
- **Event wiring chain completeness**
  - `EventName` enum updated
  - `@types/EventsInterface.d.ts` payload added
  - Listener exists and is registered (decorator path or provider path)
- **Handler retry safety**
  - When a handler re-dispatches an event, ensure it does not create infinite loops (follow `references/handler.md` guidance).
- **Command-first discipline**
  - No manually created Page/Handler/Selector/Event files; scaffolding must be CLI-first when creating new artifacts.

## 📝 Output Format

You **MUST** format your review output exactly according to the following Markdown structure. You **MUST NOT** deviate from this template or add conversational fillers.

### 📝 Review Summary

[You **MUST** provide a brief 1-2 sentence summary regarding the overall impact of the analyzed changes. You **MUST** state what is being implemented and whether the overall architecture is sound.]

### 🛠️ GitLab Comments

*(If no issues are found, you **MUST** output exactly: "No issues found. The code adheres to the project standards.")*

- `path/to/file.ts:10` | **between:** `10-15`
  - ❌ [You **MUST** directly describe the structural error or ODG pattern violation.]
    - 💡 [You **SHOULD** provide a code snippet or clear instruction on how to resolve the issue using the correct architecture.]

- `path/to/file.ts:10` | **between:** `10-15`
  - ⚠️ [**WHEN** applicable, you **MUST** describe potential side-effects, infinite loops, or dependency injection edge cases.]

### 🤖 New Rule Suggestions (Optional)

- [You **MAY** provide suggestions here. Example: "I noticed pattern X being repeated. It is **RECOMMENDED** to create a new rule in `@odg/eslint-config` that prohibits the use of function Y without Z."]
