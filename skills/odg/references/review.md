# ODG Code Review Guidelines

Use this file when the user requests a code review of the current changes, unpushed commits, or staged files.

## Pre-flight Gate (MUST)

`review.sh` (Step 1 of the process below) runs `tsc`, `eslint`, and `vitest run` and writes the result to the **"Pre-flight Validation"** section of `logs/review.log`.

You **MUST** read that section before any other section of the log. If any step is marked 🛑 (non-zero exit), you **MUST**:

1. Stop the review immediately.
2. Output exactly: `🛑 Review halted — pre-flight failed at: <command>`.
3. Reproduce the failing tail already captured in the log (no extra commands).
4. **MUST NOT** produce a "📝 Review Summary" or any GitLab Comments section.
5. **MUST NOT** rationalize a failure as "out of scope", "pre-existing", or "unrelated to the diff".

## 🔒 Source of Truth (MUST)

Once `review.sh` has produced `logs/review.log`, that file is the **only** allowed input for diff content during the review.

You **MUST NOT** run, during a review: `git diff`, `git show`, `git log -p`, `git blame`, `rtk git diff`, `rtk git show`, `rtk git log -p`.

If `review.log` lacks surrounding context for a changed line, you **MUST** open the file directly with the `Read` tool — never with `git`.

## 🎯 Exhaustiveness (MUST)

You **MUST** report every rule violation you observe, with **no upper cap** and **no severity filtering**. Trivial violations (naming, missing `const` on `export`, unused base-injected field, redundant import, missing comma, wrong icon) **MUST** be reported the same as structural ones. The number of comments in the output **MUST** equal the number of violations — never round down, never "pick the top N", never collapse multiple violations into one comment.

## 🕵️‍♂️ Step-by-Step Review Process

1. **Identify Changes:** Run the script from the project root. `$SKILL_DIR` **MUST** be expanded per the "Path convention" in `SKILL.md`.
   - `$SKILL_DIR/scripts/review.sh > logs/review.log`
2. **MUST** read `logs/review.log` end-to-end. Apply the **Pre-flight Gate** (above) before reading any diff.
3. **MUST** load every reference required by the touched surfaces (see the map below). No skipping.
4. **Forgiveness Rule:** If a file is modified but the surrounding legacy code is out of standard, DO NOT propagate the error to your review unless the user's specific change caused it. Focus on the impact of the new code.
5. **Validation:** Check if the changes follow the mandatory "Command-First" workflow (scaffolded correctly) and if all wiring (Container, Enums, Types) is complete.

## Skill References Map (MUST follow)

Load the **minimum** references required by the touched surfaces. At minimum, always load:

- [references/architecture.md](./architecture.md)

Then load additional references based on file paths:

- **Pages**
  - Trigger: `src/Pages/**`
  - **MUST** read: - [references/pages.md](./pages.md)
  - **SHOULD** read: [references/selectors.md](./selectors.md) (if selectors are involved)
- **Handlers**
  - Trigger: `src/Handlers/**` OR edits to `src/Handlers/BaseHandler.ts`
  - **MUST** read: [references/handler.md](./handler.md)
- **Events / Listeners**
  - Trigger: `src/app/Listeners/**`, `src/app/Enums/EventName.ts`, or `@types/EventsInterface.d.ts`
  - **MUST** read: [references/events.md](./events.md)
- **Services**
  - Trigger: `src/app/Services/**`
  - **MUST** read: [references/services.md](./services.md)
  - **SHOULD** read: [references/events.md](./events.md) (if service dispatches events)
- **Config / Enums / Container wiring**
  - Trigger: `src/app/Enums/**`, `src/Configs/**`, `src/app/Container.ts`, `@types/ContainerInterface.d.ts`
  - **MUST** read: [references/execution.md](./execution.md)
  - **MUST** read: [references/diagnostics.md](./diagnostics.md)
  - **SHOULD** read: [references/configs.md](./configs.md) (if ConfigName/env keys are involved)
- **Testing**
  - Trigger: `tests/**`
  - **MUST** read:  [references/testing.md](./testing.md)

## Review Checklist (ODG-specific)

Use this checklist when writing comments:

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

### GitLab Comments

*(If no issues are found, output exactly: "No issues found. The code adheres to the project standards.")*

Repeat the block below **once per violation**, with **no cap**. End the section with the count footer.

- `path/to/file.ts:LINE` | **between:** `START-END`
  - [ICON] [Direct description of the violation. No conversational filler.]
    - 💡 [Code snippet or correction in 1–3 lines.]

Icon legend:

| Icon | Use for |
| --- | --- |
| ❌ | Structural error or ODG pattern violation |
| ⚠️ | Side-effect, infinite-loop, or DI edge-case risk |
| 💬 | Style, naming, or trivial rule violation (still **MUST** be reported) |

**Footer (MUST):** `_Emitted N comments across M files._`

### 🤖 New Rule Suggestions (Optional)

- [You **MAY** provide suggestions here. Example: "I noticed pattern X being repeated. It is **RECOMMENDED** to create a new rule in `@odg/eslint-config` that prohibits the use of function Y without Z."]
