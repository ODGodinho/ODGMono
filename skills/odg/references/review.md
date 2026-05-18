# ODG Code Review Guidelines

Use this file when the user requests a code review of current changes, unpushed commits, or staged files, get all changes and compare with `main` / `master` or `develop` branch.

## 🔒 Source of Truth (MUST)

Once has produced output with review git information and files change, that file is the **only** allowed input for diff content during the review.

During a review, the agent **MUST NOT** run any of: `git diff`, `git show`, `git log -p`, `git blame`, or any optimizer / proxy wrapper of these (e.g., `rtk git diff` if such a proxy is available).

## Exhaustiveness (MUST)

The agent **MUST** report every rule violation it observes, with **no upper cap** and **no severity filtering**. Trivial violations (naming, missing `const` on `export`, unused base-injected field, redundant import, missing comma, wrong icon) **MUST** be reported the same as structural ones. The number of comments in the output **MUST** equal the number of violations — never round down, never "pick the top N", never collapse multiple violations into one comment.

The agent **MUST** include maintainability issues in the violation count, not only functional defects:

## 🕵️‍♂️ Step-by-Step Review Process

1. **Identify Changes:** Run the script from the project root. `$$SKILL_DIR/scripts/review.sh > .review/$GIT_BRANCH.md`
2. **MUST** read `.review/$$GIT_BRANCH.md` end-to-end.
3. **Forgiveness Rule:** If a file is modified but the surrounding legacy code is out of standard, DO NOT propagate the error to your review unless the user's specific change caused it. Focus on the impact of the new code.
4. **Validation:** Check if the changes follow the mandatory "Command-First" workflow (scaffolded correctly) and if all wiring (Container, Enums, Types) is complete.
5. **Knowledge Indexing:** Before start review read all needs references in [References to review](./references.md)
6. **Review Checklist** read review checklist in [Review Checklist](./review/checklist.md) and check inconsistency
7. **Execute Output** Start print all outputs [Output Format](#output-format)

## Output Format

The agent **MUST** format its review output exactly according to the following Markdown structure. The agent **MUST NOT** deviate from this template or add conversational fillers.

### Review Summary

The agent **MUST** provide a brief 1-2 sentence summary regarding the overall impact of the analyzed changes. The agent **MUST** state what is being implemented and whether the overall architecture is sound.

### GitLab Comments

*(If no issues are found, output exactly: "No issues found. The code adheres to the project standards.")*

The agent **MUST** repeat the block below **once per violation**, with **no cap**. The agent **MUST** end the section with the count footer.

- `path/to/file.ts:LINE`
  - [ICON] [Direct description of the violation. No conversational filler.]
    - 💡 [Code snippet or correction in 1–3 lines.]

Icon legend:

| Icon | Use for |
| --- | --- |
| ❌ | Structural error or ODG pattern violation |
| ⚠️ | Side-effect, infinite-loop, or DI edge-case risk |
| 💬 | Style, naming, or trivial rule violation (still **MUST** be reported) |

**Footer (MUST):** `_Emitted N comments across M files._`

### New Rule Suggestions (Optional)

The agent **MAY** add a final section with suggestions for new lint rules or skill rules. Example: "I noticed pattern X being repeated. It is **RECOMMENDED** to create a new rule in `@odg/eslint-config` that prohibits the use of function Y without Z."
