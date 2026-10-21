# ODG Code Review

Placeholders (`$$SKILL_DIR`, `$$GIT_BRANCH`) are defined in [SKILL.md](../SKILL.md#alias-convention).

## Scope

`$$MODE` defaults to `all`; the other two only when the request says **only**.

| Request says | `$$MODE` | Diff |
| --- | --- | --- |
| "review", "revisa", nothing specific | `all` | merge-base with the remote default branch → working tree, index and untracked included |
| "só o que está em stage" | `staged` | `HEAD` → index |
| "só os commits", "a branch", "unpushed" | `commits` | merge-base with the remote default branch → `HEAD` |

`REVIEW_BASE=<ref>` overrides the base when the request names one ("desde o commit X").

## Process

1. From the project root run `$$SKILL_DIR/scripts/review.sh .review/$$GIT_BRANCH $$MODE`. Its output is the only diff source: never run `git diff`, `git show`, `git log -p` or `git blame`, except the `git show` a marker prints.
2. Read `index.md` and every part it lists. Read each `_NEW FILE CREATED_` in full before judging it; a `_FILE DELETED_` only when a finding depends on the old body; open the rest of a file only for a symbol the changed lines read or write.
3. Read [architecture.md](./architecture.md) and [conventions.md](./conventions.md) whenever the diff changes source code, plus the reference the [Routing map](../SKILL.md#routing-map) names for each surface a changed file belongs to, then the `AGENTS.md` of each package a changed line calls — `index.md` lists the candidates under "Package References Required". Nothing else.
4. Evaluate [checklist.md](./review/checklist.md): **Always**, then **Declaration** and **Contract** whenever the diff changes source code, then every other section whose trigger the diff shows. Repo-wide searches use the Grep tool, or `grep -rn` with quoted globs.
5. Write the output to `.review/$$GIT_BRANCH/output.md`, run `$$SKILL_DIR/scripts/review-check.sh < .review/$$GIT_BRANCH/output.md`, fix what it prints until it exits 0. Then print only the path of `output.md` and the count of findings per icon (❌, ⚠️, 💬); do not reprint the file.

The card gives the intent; the diff gives the facts. Ask the tracker only for the fields the review needs — summary, description, status, comments. Derive every finding from the diff and the references, never from session memory.

## Existing comments

Only when the request names a card or an MR/PR that already has discussion; run it before step 4. Read the MR threads from `discussions.md` in the output directory: `review-task.sh` writes it per MR (open threads, author replies, resolved state), also for a single repo given as one `<repo-path>:<branch>`. Do not work out how to query GitLab; when the file is missing (no `glab`), read the threads through the tracker the request names. Read every open comment — the diff is the authority on what is still true. Classify each as **valid** (still applies), **resolved** (the diff fixed it) or **stale** (file or line gone). Never repeat one as a finding; where a comment and the diff disagree, the diff wins and the disagreement is a finding.

A finding or 💡 **MUST NOT** reverse a decision the lead already took in the MR threads, or an author's contestation backed by proof (code, runtime, spec), unless the diff changed its premise. Cite the thread when a finding touches it.

## Multi-repo task

A card that touches 2+ repos is reviewed as one task, even before its MRs exist:

- MRs open: `$$SKILL_DIR/scripts/review-task.sh [--discard] <repo-path>:<branch>...` checks out every branch and runs step 1 per repo in `commits` mode.
- Before the push: `$$SKILL_DIR/scripts/review-task.sh --local <repo-path>...` reviews each repo's working tree in `all` mode, without checking anything out.

Review each repo into its own output, then make **one** pass over all of them. That pass is where rules duplicated between repos and consumers left behind are found; a single-repo review cannot see them:

- **Repeated rule** — a rule that appears in 2+ repos is stated once, in the repo whose `AGENTS.md` owns it, and only cited in the others.
- **Shared change** — when one repo changes a shared package's export, every repo that pins that package, inside the task or not, is a consumer; report, per consumer, its pinned version and the `path:line` that uses the changed export, and **prove** the pinned version carries the change (`git -C <lib-repo> tag --contains <merge-sha> | sort -V | head -1` against the consumer's lock entry) instead of assuming it. A consumer left on the old behavior is a finding.
- **Shared logic** — logic that serves 2+ repos belongs to the shared package, not copied into each. (If exist shared package)

## Output

Markdown only, no conversational filler, in the language of the project's `AGENTS.md`, else Portuguese.

### Review Summary

One or two sentences: what the change implements and whether its architecture is sound. Last line, fixed: `Lint, tsc e testes: não executados pela review.`

### GitLab Comments

No violation → exactly `No issues found. The code adheres to the project standards.` Otherwise one block per violation, with no cap and no severity filter — a trivial violation is reported like a structural one:

```text
- `path/to/file.ts:LINE` — `(Rule Name | source:line)`
  - [ICON] Description of the violation.
    - 💡 Correction in 1–x lines.
```

- **Rule Name**: the bold item of [checklist.md](./review/checklist.md) the finding violates, verbatim, without its trailing parenthetical; or `Agent Found` for a regression reproduced by running a command, the reproduction being the citation.
- **source:line**: optional, pipe-separated: a repo `path:line`, a skill reference (`conventions.md:81`), the project or a package `AGENTS.md:LINE`. Never a checklist line, never a whole file.
- **Anchor**: an MR/PR line comment anchors to `path/to/file.ts:LINE`; a card comment with no line anchors to the `path` alone or to the symbol.
- **ICON**: one per block. ❌ structural error or ODG pattern violation · ⚠️ side effect, infinite loop, DI edge case, or a design change beyond the card (any item of *Strategy change* below) · 💬 style, naming, trivial rule.
- **💡**: the concrete correction, code or the symbol to use, that passes the project's lint and every skill or `AGENTS.md` rule. With `node_modules` present, check a snippet with `node_modules/.bin/eslint --stdin --stdin-filename <path>`; that is the only command the review runs. Never `confirmar com`, `decidir entre/com`, `avaliar se`, `ver com o time`, `alinhar com`. Layer first: when the commented code sits in the wrong layer (a Page validating the next page's transition, a Component that only classifies a response), the finding reports the layer violation; a 💡 that polishes code that must move or be deleted is wrong.
- **Strategy change.** A finding whose fix changes any of the following ends with `Decisão: <A> vs <B>`, each option with what it costs, and carries **no** 💡 code:
  - which class reports a step's success or failure;
  - when and how a process or a browser ends;
  - the retry or attempt policy;
  - a mechanism the card did not ask for (lock, cache, toggle, fallback, idle timeout, retry wrapper);
  - a required value or field made optional;
  - a class split or merged;
  - code moved between repos or into a shared package;
  - the type contract of a payload.

  Why: applied as code, a 💡 of this kind starts the longest chains of findings in this team's review history. The author builds it, the lead undoes it, and every finding raised on the intermediate code is wasted work.

Footer: `_Emitted N comments._` then `Gatilhos ausentes: <checklist sections whose trigger the diff does not show>`.

### Multi-repo

Only for a multi-repo task. One line per cross-repo item — repeated rule, shared change (consumer + pinned version + `path:line`), shared logic to move. Omit the section for a single repo.

### Avaliação dos comentários existentes

Only for the pass above. One line per open comment — `path:LINE` — `valid | resolved | stale` — one sentence on why. No icon, no 💡.

### New Rule Suggestions (optional)

A pattern worth a new lint or skill rule, e.g. "X repeats; a rule in `@odg/eslint-config` forbidding Y without Z".
