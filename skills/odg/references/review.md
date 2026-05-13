# ODG Code Review Guidelines

Use this file when the user requests a code review of the current changes, unpushed commits, or staged files.

## 🔒 Source of Truth (MUST)

Once `review.sh` has produced `logs/review.log`, that file is the **only** allowed input for diff content during the review.

You **MUST NOT** run, during a review: `git diff`, `git show`, `git log -p`, `git blame`, `rtk git diff`, `rtk git show`, `rtk git log -p`.

If `review.log` lacks surrounding context for a changed line, you **MUST** open the file directly with the `Read` tool — never with `git`.

## 🎯 Exhaustiveness (MUST)

You **MUST** report every rule violation you observe, with **no upper cap** and **no severity filtering**. Trivial violations (naming, missing `const` on `export`, unused base-injected field, redundant import, missing comma, wrong icon) **MUST** be reported the same as structural ones. The number of comments in the output **MUST** equal the number of violations — never round down, never "pick the top N", never collapse multiple violations into one comment.

You **MUST** include maintainability issues in the violation count, not only functional defects:

- typo/misspelling in symbol names (method, class, variable, enum member, file name)
- naming drift or inconsistent terms for the same domain concept
- duplicate enum/config sources-of-truth that increase ambiguity
- validator overfitting that tightly couples to volatile upstream payload fields
- development-only tooling declared under runtime `dependencies` in `package.json`

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

Each bullet names a **pattern to detect** and the **action** when matched (`→ violation`). Patterns are domain-neutral — `*Base*`, `Foo*`, `Common*`, `Core*`, `.extend(...)`, etc. apply regardless of file or class name. Walk the list per-file, then finish with the **cross-file trace pass** at the end.

- **Event wiring chain completeness**
  - `EventName` enum updated, `@types/EventsInterface.d.ts` payload added, Listener exists and is registered (decorator path or provider path).
- **Base + specialization boundary**
  - Shared artifacts (`*Base*`, `Common*`, `Core*`, or any class extended via subclass / `.extend(...)`) hold only fields and behavior used by **2+** specializations with equivalent semantics. A field in base consumed by only one specialization → violation.
  - Specialization-specific fields and behavior stay in the specialized artifact. Applies to classes, interfaces, validators, configs, DTOs, schemas, constants, enums.
- **External payload resilience**
  - Schemas consuming external or volatile payloads (third-party APIs, scraped responses, upstream service responses) **SHOULD** validate only the fields the consumer actually reads and **SHOULD** permit unknown fields via `.passthrough()` (or the equivalent escape in the schema library) so upstream additions do not break the parser.
  - This rule applies regardless of the schema library (`zod`, `yup`, `io-ts`, etc.); detect the escape primitive native to the library in use.
- **Contract fidelity**
  - For every changed public method or interface, parameters declared in the contract must influence behavior or output. A semantically relevant parameter ignored at the call site → violation.
  - Trace `signature → implementation → downstream call payload`. A break in argument-flow integrity is a finding even when compilation passes.
- **Hidden state coupling**
  - Logic that reads hidden state (injected payload snapshots, singleton mutable fields, ambient globals, process state) where an explicit method argument would suffice → violation, especially when reuse or concurrency can let the state diverge from the call arguments.
- **Layer ownership**
  - Each concern stays in its layer: orchestration vs business rules, shared contract vs implementation detail, transport schema vs domain schema, base abstraction vs specialization. Cross-layer leak without explicit justification → violation.
- **Dependency hygiene**
  - Development tooling declared under runtime `dependencies` in `package.json` → violation. Common offenders: `eslint`, `typescript`, `prettier`, `vitest`, `jest`, `tsc-alias`, `husky`, `concurrently`, `lint-staged`, `@types/*`, build orchestrators.
  - When in doubt, ask: *"does the deployed runtime import this at execution time?"* If no, it is `devDependencies`.
- **Naming coherence**
  - Patterns: legacy term inside a new abstraction namespace, specialization name mixed into an unrelated namespace, typo in a public symbol propagated to consumers, or two names for the same domain concept (e.g., `offer_id` vs `outbound_offer_id`) → maintainability violation **even when behavior is correct**.
  - **Procedure for renames**: when `logs/review.log` shows a symbol rename — capture old + new verbatim, search both with `Read` across validators/interfaces/helpers/parsers/config keys; if both coexist with the same semantic meaning emit `competing contract keys`. Removal of the legacy symbol is **REQUIRED** unless it is explicitly kept for a documented migration window.
- **Cross-file trace pass (do last, MUST)**
  - After per-file review, run **one** cross-file pass: (1) identify changed shared/base artifacts; (2) map every dependent/specialized artifact touched by the diff; (3) verify boundary, flow, and ownership invariants across files — not only per-file; (4) emit one comment per violation, never collapse.

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
