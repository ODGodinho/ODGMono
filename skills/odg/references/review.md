# ODG Code Review

Placeholders (`$$SKILL_DIR`, `$$GIT_BRANCH`) are defined in [SKILL.md](../SKILL.md#alias-convention).

## Scope

`$$MODE` defaults to `all`; `staged` and `commits` only when the request says **only**, and `delta` only for another review of a branch already reviewed (*Re-review*).

| Request says | `$$MODE` | Diff |
| --- | --- | --- |
| "review", "revisa", nothing specific | `all` | merge-base with the remote default branch → working tree, index and untracked included |
| "só o que está em stage" | `staged` | `HEAD` → index |
| "só os commits", "a branch", "unpushed" | `commits` | merge-base with the remote default branch → `HEAD` |
| "revisa de novo", "novo review", "nova revisão", with `.review/$$GIT_BRANCH/state` on disk | `delta` | the tree the previous review saw → working tree, untracked included |

`REVIEW_BASE=<ref>` overrides the base when the request names one ("desde o commit X").

## Process

1. From the project root run `$$SKILL_DIR/scripts/review.sh .review/$$GIT_BRANCH $$MODE`. Its output is the only diff source: never run `git diff`, `git show`, `git log -p` or `git blame`, except the `git show` a marker prints.
2. Read `index.md` and every part it lists. Read each `_NEW FILE CREATED_` in full before judging it; a `_FILE DELETED_` only when a finding depends on the old body; open the rest of a file only for a symbol the changed lines read or write.
3. Read the references [checklist.md](./review/checklist.md) names before its first section, then the `AGENTS.md` of each package a changed line calls — `index.md` lists the candidates under "Package References Required". Nothing else.
4. Evaluate [checklist.md](./review/checklist.md): **Always**, then **Declaration** and **Contract** whenever the diff changes source code, then every other section whose trigger the diff shows. Repo-wide searches use the Grep tool, or `grep -rn` with quoted globs.
5. Write the output to `.review/$$GIT_BRANCH/output.md`, run `$$SKILL_DIR/scripts/review-check.sh --apply < .review/$$GIT_BRANCH/output.md`, fix what it prints until it exits 0. `--apply` applies every 💡 `suggestion` or `diff` block to a scratch copy of the tree and runs the project's eslint and tsc there, reporting only what the 💡 introduce; it is the only lint and tsc the review runs. Then print only the path of `output.md` and the count of findings per icon (❌, ⚠️, 💬); do not reprint the file.

The card gives the intent; the diff gives the facts. Ask the tracker only for the fields the review needs — summary, description, status, comments. Derive every finding from the diff and the references, never from session memory.

## Existing comments

Only when the request names a card or an MR/PR that already has discussion; run it before step 4. Read the MR threads from `discussions.md` in the output directory: `review-task.sh` writes it per MR (open threads, author replies, resolved state), also for a single repo given as one `<repo-path>:<branch>`. Do not work out how to query GitLab; when the file is missing (no `glab`), read the threads through the tracker the request names. Read every comment, open and resolved — the code is the authority on what is still true, not the thread's state. Classify each as **valid** (still applies, even if marked resolved), **resolved** (the code fixed it), **stale** (file or line gone) or **contested** (the code or the repo contradicts a premise of the thread or of a reply; state the evidence as `path:line`). Never repeat one as a finding; where a comment and the diff disagree, the diff wins and the disagreement is a finding.

A finding or 💡 **MUST NOT** reverse a decision the lead already took in the MR threads, or an author's contestation backed by proof (code, runtime, spec), unless the diff changed its premise. A contestation whose proof the code or the repo contradicts may become a finding that cites the thread and the evidence. A lead decision whose premise is contradicted stays **contested** in the evaluation only: no finding, no 💡 against it. Cite the thread when a finding touches it.

## Re-review

**WHEN** `$$MODE` is `delta`. Every run of `review.sh` writes `.review/$$GIT_BRANCH/state` with the tree that review saw, so a new chat re-reviews as well as the same one: everything it needs is on disk.

1. Step 1 runs in `delta` mode; for a task with MRs, `review-task.sh --delta` updates each checkout first. The diff is exactly what changed since the previous review, untracked files included. A `delta` with no `state` stops with an error: run a full review instead.
2. Read the previous `.review/$$GIT_BRANCH/output.md` before writing the new one, and give each of its findings a status: **resolved**, **open**, **resolved with a new problem**, or **discarded** (its thread was deleted from the MR: a decision already taken, never re-emitted). Read the status from the current code, not from a commit message or a reply.
3. Review the delta with the full checklist: **Always**, **Declaration**, **Contract** and every section whose trigger the delta shows. **Review-fix code** names where second-round problems come from.
4. Code the delta does not touch is not reviewed again; the previous review owns it. Exception: when the delta changes behavior that untouched code depends on (a caller, a contract, a shared value), follow it there with the **Cross-file trace pass**.
5. Output: a `### Previous findings` section before `### GitLab Comments`, one line per previous finding (`` - `path:LINE` — status — why ``), then the new findings in the usual format.

## Multi-repo task

A card that touches 2+ repos is reviewed as one task, even before its MRs exist:

- MRs open: `$$SKILL_DIR/scripts/review-task.sh [--discard] [--delta] <repo-path>:<branch>...` checks out every branch and runs step 1 per repo in `commits` mode, use only if the dev is not on the branch local.
- Before the push: `$$SKILL_DIR/scripts/review-task.sh --local [--delta] <repo-path>...` reviews each repo's working tree in `all` mode, without checking anything out.
- `--delta` runs step 1 in `delta` mode instead, per repo, after the checkout (*Re-review*); a repo without `state` gets the full mode and a warning.

Review each repo into its own output, then make **one** pass over all of them. That pass is where rules duplicated between repos and consumers left behind are found; a single-repo review cannot see them:

- **Repeated rule** — a rule that appears in 2+ repos is stated once, in the repo whose `AGENTS.md` owns it, and only cited in the others.
- **Shared change** — when the diff of a shared package changes an export in a way that can break its consumers (removed or renamed member, changed signature, return type or thrown error, changed default), report it once, on that change: name the export and what a consumer must adapt. If a search the review already runs shows that export used in another repo, list those `path:line` in the same finding, without reviewing them. Do not search other repos for this purpose, and do not check pinned versions or lockfiles.
- **Shared logic** — checklist **Shared-layer first**, applied across the repos of the task.

## Output

Markdown only, no conversational filler, in the language of the project's `AGENTS.md`, else Portuguese.

### Review Summary

One or two sentences: what the change implements and whether its architecture is sound. Last line, fixed: `Lint e tsc: rodados só sobre os 💡; testes não executados pela review.` When no 💡 carries a `suggestion` or `diff` block, nothing ran, and the line reads `Lint e tsc: não rodados, nenhum 💡 com código; testes não executados pela review.`

### GitLab Comments

No violation → exactly `No issues found. The code adheres to the project standards.` Otherwise one block per violation, with no cap and no severity filter — a trivial violation is reported like a structural one:

```text
- `path/to/file.ts:LINE` — `(Rule Name | source:line)`
  - [ICON] Description of the violation.
    - 💡 Correction in 1–x lines.
```

- **Rule Name**: the name of the rule the finding violates, verbatim, without its trailing parenthetical: the bold item of [checklist.md](./review/checklist.md); or, for a rule that a skill reference, an `AGENTS.md` or a package doc states and no checklist item names, the heading or bold lead that names it in that file, with its line in **source:line**. `Agent Found` is a finding of the agent's own, which nothing in the skill, the `AGENTS.md` files or the code prescribes; it needs no **source:line**.
- **source:line**: pipe-separated: a repo `path:line`, a skill reference (`conventions.md:81`), the project or a package `AGENTS.md:LINE` or doc, by its path from the project root (`node_modules/@odg/chemical-x/docs/helpers.md:40`). Required when the Rule Name comes from one of those files; optional otherwise. Never a checklist line, never a whole file.
- **Anchor**: an MR/PR line comment anchors to `path/to/file.ts:LINE`; a card comment with no line anchors to the `path` alone or to the symbol.
- **ICON**: one per block. ❌ structural error or ODG pattern violation · ⚠️ side effect, infinite loop, DI edge case, or a design change beyond the card (any item of *Strategy change* below) · 💬 style, naming, trivial rule.
- **💡**: the final code, not a direction; it passes the project's lint and tsc and every skill or `AGENTS.md` rule.
  - When the fix replaces the commented lines, write it as a GitLab suggestion block, indented under the 💡: a fence opened with ```` ```suggestion:-N+M ```` (N and M count the lines replaced above and below `LINE`; `-0+0` for `LINE` alone) holding the exact lines after the fix. The author applies it with one click, and step 5 applies it to a scratch copy and runs eslint and tsc on the result. A fix that also changes other lines or other files is written as one ```` ```diff ```` block in unified format instead: a `--- a/<path>` and `+++ b/<path>` header per file, then its hunks (a new file starts from `--- /dev/null`); step 5 applies it the same way. Any other 💡 names the exact code or library symbol to use.
  - Before writing a 💡, evaluate it as new code against the checklist sections it triggers: a 💡 that adds a log meets **Duplicate logging** and **Log content**, one that adds a catch meets **Error boundary placement**, one that adds a comment meets **Comments and docblocks**, one that adds a function meets **Unjustified abstraction**. A 💡 that would itself be a finding is wrong.
  - Overlapping findings: when 2+ findings fall on the same lines or the same method, each rule keeps its own block, and only the first carries the code, fixing all of them; the others read `💡 Corrigido pelo 💡 de \`path:LINE\`.` Never fold a second rule into another rule's block.
  - Layer first: when the commented code sits in the wrong layer (a Page validating the next page's transition, a Component that only classifies a response), the finding reports the layer violation; a 💡 that polishes code that must move or be deleted is wrong.
  - Never `confirmar com`, `decidir entre/com`, `avaliar se`, `ver com o time`, `alinhar com`.
- **Strategy change.** A finding whose fix changes any of the following ends with `Decisão: <A> vs <B>`, each option with what it costs, and carries **no** 💡 code:
  - which class reports a step's success or failure;
  - when and how a process or a browser ends;
  - the retry or attempt policy;
  - a mechanism the card did not ask for (lock, cache, toggle, fallback, idle timeout, retry wrapper) that the 💡 would add; taking out one that the diff added without the card asking is an ordinary finding with its 💡;
  - a required value or field made optional;
  - a class split or merged;
  - code moved between repos or into a shared package;
  - the type contract of a payload.

  Why: applied as code, a 💡 of this kind starts the longest chains of findings in this team's review history. The author builds it, the lead undoes it, and every finding raised on the intermediate code is wasted work.

Footer: `_Emitted N comments._` then `Gatilhos ausentes: <checklist sections whose trigger the diff does not show>`.

### Multi-repo

Only for a multi-repo task. One line per cross-repo item — repeated rule, shared change (export + what a consumer must adapt + any `path:line` a search already showed), shared logic to move. Omit the section for a single repo.

### Avaliação dos comentários existentes

Only for the pass above. One line per comment read — `path:LINE` — `valid | resolved | stale | contested` — one sentence on why; for `contested`, the evidence as `path:line`. No icon, no 💡.

### New Rule Suggestions (optional)

A pattern worth a new lint or skill rule, e.g. "X repeats; a rule in `@odg/eslint-config` forbidding Y without Z".
