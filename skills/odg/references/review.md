# ODG Code Review Guidelines

Use this file when the user requests a code review of current changes, unpushed commits, or staged files, get all changes and compare with `main` / `master` or `develop` branch.

## Review Process

**MANDATORY** The agent **MUST** report every rule violation it observes, with **no upper cap** and **no severity filtering**. Trivial violations, **MUST** be reported the same as structural ones. The number of comments in the output **MUST** equal the number of violations.
A finding is **deterministic** when an automated gate configured in the project — `eslint`, `tsc`, `prettier`, or any equivalent check, The agent **MUST NOT** spend review effort on deterministic findings.

The agent **MUST** include maintainability issues in the violation count, not only functional defects:

1. **Identify Changes:** Run the script from the project root. `$$SKILL_DIR/scripts/review.sh > .review/$$GIT_BRANCH.md`. This file **MUST** be your **only** input for diff content. You **MUST NOT** run `git diff`, `git show`, `git log -p`, `git blame`, or any command wrappers.
2. **Index References** Read `.review/$$GIT_BRANCH.md` end-to-end.
3. **Forgiveness Rule:** If a file is modified but the surrounding legacy code is out of standard, DO NOT propagate the error to your review unless the user's specific change caused it. Focus on the impact of the new code.
4. **Mindset**: You **MUST** act as a Senior Tech Leader and Specialist. You **MUST NOT** limit your analysis to syntax or static checklist compliance. You **MUST** proactively investigate the operational context of the diff, challenge design choices, analyze surrounding legacy code for side effects, read all referenced documentation and utilize relevant agent skills to uncover logical bugs (such as inverted conditions), regressions (such as lost toggles/kill-switches), and design flaws that extend beyond the literal checklist.
5. **Knowledge Indexing:** Before start review all **touch, edit** references via the [Routing map](../SKILL.md#routing-map) include Packages References Rules
6. **Review Checklist** read review checklist in [Review Checklist](./review/checklist.md) and check inconsistency
7. **Execute Output** Start print all outputs [Output Format](#output-format)

## Output Format

The agent **MUST** format its review output exactly according to the following Markdown structure. The agent **MUST NOT** deviate from this template or add conversational fillers.

### Review Summary

The agent **MUST** provide a brief 1-2 sentence summary regarding the overall impact of the analyzed changes. The agent **MUST** state what is being implemented and whether the overall architecture is sound.

### GitLab Comments

*(If no issues are found, output exactly: "No issues found. The code adheres to the project standards.")*

The agent **MUST** repeat the block below **once per violation**, with **no cap**. The agent **MUST** end the section with the count footer.

- `path/to/file.ts:LINE` - ($$rule-checklist-name)
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
