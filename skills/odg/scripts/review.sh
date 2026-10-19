#!/usr/bin/env bash
# review.sh <outdir> [all|staged|commits]
#
# Escreve <outdir>/index.md (escopo, tabela, pacotes, partes) e
# <outdir>/part-N.md (diffs, cortados só em fronteira de arquivo).
#
# Um único `git diff` por modo, com par fixo de refs:
#   all      merge-base -> working tree (+ untracked)      [padrão]
#   staged   HEAD       -> índice
#   commits  merge-base -> HEAD
#
# Knobs: REVIEW_BASE, REVIEW_CONTEXT_LINES (1), REVIEW_MAX_DIFF_LINES_PER_FILE (1200),
#        REVIEW_MAX_LINES_PER_PART (1500), REVIEW_MAX_FILES (200).
set -euo pipefail

OUTDIR="${1:?usage: review.sh <outdir> [all|staged|commits]}"
MODE="${2:-all}"

case "$MODE" in
    all|staged|commits) ;;
    *)
        printf 'review.sh: modo inválido "%s" (all|staged|commits)\n' "$MODE" >&2
        exit 2
        ;;
esac

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# Estes knobs alimentam flags do git (`--unified=N`). Um valor não-numérico
# faz o git falhar e o diff desaparecer do relatório sem aviso, então o
# fallback é explícito e vai para stderr.
require_positive_int() {
    local name="$1"
    local value="$2"
    local fallback="$3"

    if [[ "$value" =~ ^[0-9]+$ ]]; then
        printf '%s' "$value"
        return
    fi

    printf 'review.sh: %s inválido (%s); usando %s\n' "$name" "$value" "$fallback" >&2
    printf '%s' "$fallback"
}

CONTEXT_LINES="$(require_positive_int REVIEW_CONTEXT_LINES "${REVIEW_CONTEXT_LINES:-1}" 1)"
MAX_DIFF_LINES_PER_FILE="$(require_positive_int REVIEW_MAX_DIFF_LINES_PER_FILE "${REVIEW_MAX_DIFF_LINES_PER_FILE:-1200}" 1200)"
MAX_LINES_PER_PART="$(require_positive_int REVIEW_MAX_LINES_PER_PART "${REVIEW_MAX_LINES_PER_PART:-1500}" 1500)"
MAX_FILES="$(require_positive_int REVIEW_MAX_FILES "${REVIEW_MAX_FILES:-200}" 200)"

IGNORE_REGEX='(^yarn.lock$|^pnpm-lock.yaml$|^package-lock.json$|^.review/|^dist/|^.next/|^coverage/|^.turbo/|^.git/|^.yarn/|\.snap$|\.min\.|bun.lock$|bun.lockb$|.yarn|.claude)'

choose_base_ref() {
    if [[ -n "${REVIEW_BASE:-}" ]]; then
        printf '%s' "$REVIEW_BASE"
        return
    fi

    local candidate

    for candidate in origin/main origin/master origin/develop upstream/main upstream/master main master develop HEAD~1; do
        if git rev-parse --verify --quiet "$candidate" >/dev/null; then
            printf '%s' "$candidate"
            return
        fi
    done

    # Repositório com um único commit: nada commitado para comparar,
    # mas o modo `all` ainda cobre índice + working tree.
    printf 'HEAD'
}

BASE_REF="$(choose_base_ref)"

MERGE_BASE="$(
    git merge-base "$BASE_REF" HEAD 2>/dev/null \
    || git rev-parse "$BASE_REF"
)"

# O único ponto que decide o par de refs. Tudo (name-status, numstat, patch)
# passa por aqui, então um arquivo nunca mostra "só um lado".
gdiff() {
    case "$MODE" in
        all)     git -c core.quotePath=false diff --find-renames --find-copies --no-ext-diff "$MERGE_BASE" "$@" ;;
        staged)  git -c core.quotePath=false diff --cached --find-renames --find-copies --no-ext-diff HEAD "$@" ;;
        commits) git -c core.quotePath=false diff --find-renames --find-copies --no-ext-diff "$MERGE_BASE" HEAD "$@" ;;
    esac
}

UNTRACKED=""
if [[ "$MODE" == "all" ]]; then
    UNTRACKED="$(git -c core.quotePath=false ls-files --others --exclude-standard)"
fi

is_untracked_file() {
    [[ -n "$UNTRACKED" ]] || return 1
    grep -Fqx -- "$1" <<< "$UNTRACKED"
}

# Linhas `status<TAB>old<TAB>new`. `old` vazio quando não é rename/copy.
# Untracked entra como `A` só no modo `all`.
NAME_STATUS="$(
    {
        gdiff --name-status
        if [[ -n "$UNTRACKED" ]]; then
            printf 'A\t%s\n' $UNTRACKED
        fi
    } | awk -F'\t' 'BEGIN { OFS = "\t" }
        NF == 0 { next }
        $1 ~ /^[RC]/ { print $1, $2, $3; next }
        { print $1, "", $2 }'
)"

status_of()      { awk -F'\t' -v f="$1" '$3 == f { print substr($1, 1, 1); exit }' <<< "$NAME_STATUS"; }
rename_source()  { awk -F'\t' -v f="$1" '$3 == f { print $2; exit }' <<< "$NAME_STATUS"; }

# Renomeio puro (R100/C100): conteúdo idêntico, nada para revisar dentro.
PURE_RENAME_PAIRS="$(awk -F'\t' '$1 == "R100" || $1 == "C100" { print $2 "\t" $3 }' <<< "$NAME_STATUS" | sort)"

is_ignored_file() {
    git check-ignore -q "$1" || [[ "$1" =~ $IGNORE_REGEX ]]
}

# Arquivos com conteúdo para revisar: nem renomeio puro, nem ignorado, nem diretório.
REVIEWABLE_FILES="$(
    awk -F'\t' '!($1 == "R100" || $1 == "C100") { print $3 }' <<< "$NAME_STATUS" \
    | while IFS= read -r f; do
        [[ -z "$f" || -d "$f" ]] && continue
        if is_ignored_file "$f"; then continue; fi
        printf '%s\n' "$f"
    done
)"

IGNORED_FILES="$(
    awk -F'\t' '{ print $3 }' <<< "$NAME_STATUS" \
    | while IFS= read -r f; do
        [[ -z "$f" ]] && continue
        if is_ignored_file "$f"; then printf '%s\n' "$f"; fi
    done
)"

# Pathspec old+new para o git detectar o rename no diff por arquivo.
PATHSPEC=()
resolve_pathspec() {
    local old
    old="$(rename_source "$1")"
    if [[ -n "$old" && "$old" != "$1" ]]; then
        PATHSPEC=("$old" "$1")
    else
        PATHSPEC=("$1")
    fi
}

numstat_for_file() {
    local file="$1"

    if is_untracked_file "$file"; then
        { git diff --no-index --numstat -- /dev/null "$file" || true; } \
            | awk 'NR == 1 { print $1 "\t" $2 }'
        return
    fi

    resolve_pathspec "$file"
    gdiff --numstat -- "${PATHSPEC[@]}" | awk 'NR == 1 { print $1 "\t" $2 }'
}

# Descarta o cabeçalho do patch mantendo tudo a partir do primeiro `@@`.
# Filtrar por prefixo (`--- `, `+++ `) apagaria linhas de CONTEÚDO cujo texto
# começa com `--`/`++`. `Binary files ... differ` não tem `@@` e precisa sobreviver.
strip_diff_headers() {
    awk '
        /^Binary files / { print; next }
        /^@@/ { body = 1 }
        body { print }
    '
}

# Usa awk em vez de `head`: `head` fecha o pipe e o SIGPIPE derrubaria o
# script sob `pipefail`.
cap_patch_lines() {
    local out="$1"
    local total
    total="$(printf '%s\n' "$out" | awk 'END { print NR }')"

    if (( total <= MAX_DIFF_LINES_PER_FILE )); then
        printf '%s' "$out"
        return
    fi

    printf '%s\n' "$out" | awk -v n="$MAX_DIFF_LINES_PER_FILE" 'NR <= n'
    printf '... [truncated: %s of %s lines]' "$MAX_DIFF_LINES_PER_FILE" "$total"
}

patch_for_file() {
    resolve_pathspec "$1"
    cap_patch_lines "$(gdiff --unified="$CONTEXT_LINES" -- "${PATHSPEC[@]}" | strip_diff_headers)"
}

# Conteúdo do lado "novo" do arquivo, no escopo do modo. É o que o revisor
# também deve ler quando o relatório marca NEW FILE.
read_new_side() {
    case "$MODE" in
        all)     cat -- "$1" ;;
        staged)  git show ":$1" ;;
        commits) git show "HEAD:$1" ;;
    esac 2>/dev/null || true
}

new_file_hint() {
    case "$MODE" in
        all)     printf 'Read `%s`' "$1" ;;
        staged)  printf '`git show :%s`' "$1" ;;
        commits) printf '`git show HEAD:%s`' "$1" ;;
    esac
}

deleted_file_hint() {
    case "$MODE" in
        all|commits) printf 'old body: `git show %s:%s`' "$MERGE_BASE" "$1" ;;
        staged)      printf 'old body: `git show HEAD:%s`' "$1" ;;
    esac
}

pkg_version() {
    sed -nE 's/^[[:space:]]*"version":[[:space:]]*"([^"]+)".*/\1/p' "node_modules/$1/package.json" | head -n 1
}

# Pacotes `@scope/name` com AGENTS.md importados por qualquer arquivo revisado
# (novo ou editado), e quais arquivos os importam. Sem heurística por token:
# a regra do SKILL.md é "importa → lê o AGENTS.md".
PACKAGE_PAIRS="$(
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ "$file" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]] || continue
        [[ "$(status_of "$file")" == "D" ]] && continue
        read_new_side "$file" \
            | perl -ne 'while (/(?:from|import|require)\s*\(?\s*["\x27](@[a-z0-9_.-]+\/[a-z0-9_.-]+)["\x27]/g) { print "$1\n" }' \
            | sort -u \
            | while IFS= read -r pkg; do
                if [[ -f "node_modules/$pkg/AGENTS.md" ]]; then printf '%s@%s\t%s\n' "$pkg" "$(pkg_version "$pkg")" "$file"; fi
            done
    done <<< "$REVIEWABLE_FILES"
)"

# ---------------------------------------------------------------- partes --

mkdir -p "$OUTDIR"
rm -f "$OUTDIR"/index.md "$OUTDIR"/part-*.md

PART=0
PART_LINES=0
PART_FILES=0
PARTS_SUMMARY=""

close_part() {
    (( PART == 0 )) && return
    PARTS_SUMMARY="${PARTS_SUMMARY}- [part-${PART}.md](part-${PART}.md) — ${PART_FILES} files, ${PART_LINES} lines\n"
}

open_part() {
    close_part
    PART=$((PART + 1))
    PART_FILE="$OUTDIR/part-${PART}.md"
    printf '# Code Changes — part %s\n\n' "$PART" > "$PART_FILE"
    PART_LINES=2
    PART_FILES=0
}

emit_block() {
    local block="$1"
    local n
    n="$(printf '%s\n' "$block" | awk 'END { print NR }')"

    if (( PART == 0 )) || (( PART_FILES > 0 && PART_LINES + n > MAX_LINES_PER_PART )); then
        open_part
    fi

    printf '%s\n' "$block" >> "$PART_FILE"
    PART_LINES=$((PART_LINES + n))
    PART_FILES=$((PART_FILES + 1))
}

TABLE_ROWS=""
FILE_COUNT=0

while IFS= read -r file; do
    [[ -z "$file" ]] && continue

    status="$(status_of "$file")"
    old="$(rename_source "$file")"
    IFS=$'\t' read -r added deleted < <(numstat_for_file "$file")
    changes="+${added:--}/-${deleted:--}"

    FILE_COUNT=$((FILE_COUNT + 1))
    if (( FILE_COUNT > MAX_FILES )); then
        TABLE_ROWS="${TABLE_ROWS}| ... | | Truncated after ${MAX_FILES} files |\n"
        break
    fi
    TABLE_ROWS="${TABLE_ROWS}| \`${file}\` | ${status} | ${changes} |\n"

    block="### \`${file}\`"$'\n'

    case "$status" in
        A)
            block+="> _NEW FILE CREATED_ (${changes}) — $(new_file_hint "$file")"$'\n'
            ;;
        D)
            block+="> _FILE DELETED_ (${changes}) — $(deleted_file_hint "$file")"$'\n'
            ;;
        *)
            if [[ -n "$old" && "$old" != "$file" ]]; then
                block+="> _Renamed from \`${old}\` to \`${file}\`_"$'\n\n'
            fi
            diff_output="$(patch_for_file "$file")"
            if [[ -z "$diff_output" ]]; then
                block+="> _Only metadata changes_"$'\n'
            else
                block+='```diff'$'\n'"${diff_output}"$'\n''```'$'\n'
            fi
            ;;
    esac

    emit_block "$block"
done <<< "$REVIEWABLE_FILES"

close_part

# ---------------------------------------------------------------- index --

{
    printf '# Review: `%s` (mode: %s)\n' "$(git branch --show-current 2>/dev/null || echo HEAD)" "$MODE"

    printf '\n## Review Scope\n\n'
    case "$MODE" in
        all)     printf -- '- Diff: `%s` (merge-base with `%s`) → **working tree**, plus untracked files\n' "$MERGE_BASE" "$BASE_REF" ;;
        staged)  printf -- '- Diff: `HEAD` → **index** (staged changes only)\n' ;;
        commits) printf -- '- Diff: `%s` (merge-base with `%s`) → `HEAD` (committed changes only)\n' "$MERGE_BASE" "$BASE_REF" ;;
    esac
    printf -- '- Generated: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    if [[ -n "$PURE_RENAME_PAIRS" ]]; then
        printf '\n## Renamed Paths (no content changes)\n\n'
        printf 'File contents are byte-identical — there is nothing to review inside them.\n'
        printf 'The agent **MUST** still check packaging and reference impact of the move itself\n'
        printf '(stale paths in `package.json` `files`, imports, docs links, case-only renames on\n'
        printf 'case-insensitive filesystems).\n\n'
        printf '%s\n' "$PURE_RENAME_PAIRS" | awk -F'\t' '
            NF < 2 { next }
            {
                old = $1; new = $2
                n = split(old, so, "/")
                m = split(new, sn, "/")
                i = 1
                while (i <= n && i <= m && so[i] == sn[i]) i++
                j = 0
                while (j < (n - i + 1) && j < (m - i + 1) && so[n - j] == sn[m - j]) j++
                old_mid = ""
                for (k = i; k <= n - j; k++) old_mid = old_mid (old_mid == "" ? "" : "/") so[k]
                new_mid = ""
                for (k = i; k <= m - j; k++) new_mid = new_mid (new_mid == "" ? "" : "/") sn[k]
                prefix = ""
                for (k = 1; k < i; k++) prefix = prefix (prefix == "" ? "" : "/") so[k]
                key = prefix "\x1f" old_mid "\x1f" new_mid
                count[key]++
                kprefix[key] = prefix; koldmid[key] = old_mid; knewmid[key] = new_mid
            }
            END {
                for (key in count) {
                    p = kprefix[key]; om = koldmid[key]; nm = knewmid[key]; c = count[key]
                    old_full = (om == "" ? p : (p == "" ? om : p "/" om))
                    new_full = (nm == "" ? p : (p == "" ? nm : p "/" nm))
                    if (c == 1) printf "- `%s` \xe2\x86\x92 `%s`\n", old_full, new_full
                    else        printf "- `%s` \xe2\x86\x92 `%s` (%d files)\n", old_full, new_full, c
                }
            }
        ' | sort
    fi

    printf '\n## Risk Areas\n\n'
    risks=""
    grep -Eq '(Container|Provider|Kernel)' <<< "$REVIEWABLE_FILES" && risks="${risks}- Dependency Injection / Container Wiring\n"
    grep -Eq '(Event|Listener)'            <<< "$REVIEWABLE_FILES" && risks="${risks}- Event Flow / Event Dispatching\n"
    grep -Eq '(Service)'                   <<< "$REVIEWABLE_FILES" && risks="${risks}- Service Behavior / Side Effects\n"
    grep -Eq '(Config)'                    <<< "$REVIEWABLE_FILES" && risks="${risks}- Configuration Contracts / Runtime Configuration\n"
    grep -Eq '(Page|Handler|Selector)'     <<< "$REVIEWABLE_FILES" && risks="${risks}- Crawler Flow / Page Interaction\n"
    grep -Eiq '(Middleware|Cors|Auth|Session|RateLimit|Token|Secret|Crypt|Validator)' <<< "$REVIEWABLE_FILES" && risks="${risks}- Security / Request Boundary (CORS, auth, rate limit, input validation)\n"
    if [[ -z "$risks" ]]; then
        printf '_No obvious high-risk areas detected._\n'
    else
        printf '%b' "$risks"
    fi

    printf '\n## Changed Files\n\n'
    if [[ -z "$TABLE_ROWS" ]]; then
        printf '_No changed files._\n'
    else
        printf '| File | Status | Changes |\n| --- | --- | --- |\n'
        printf '%b' "$TABLE_ROWS"
        printf '\nStatus: A new, M modified, D deleted, R renamed with changes, C copied with changes.\n'
    fi

    if [[ "$MODE" == "all" ]]; then
        INDEX_STATE="$(git -c core.quotePath=false status --short --untracked-files=all 2>/dev/null | grep -vE '^.. \.review/' || true)"
        if [[ -n "$INDEX_STATE" ]]; then
            printf '\n## Index State\n\n'
            printf '`git status --short` (index column, worktree column). A commit now takes only the first column.\n\n'
            printf '```\n%s\n```\n' "$INDEX_STATE"
            if grep -q '^AD ' <<< "$INDEX_STATE"; then
                printf '\n`AD`: staged as new, deleted on disk, absent from the diff above but a commit would publish it. Unstage it or review it with `git show :<path>`.\n'
            fi
        fi
    fi

    if [[ -n "$IGNORED_FILES" ]]; then
        printf '\n## Ignored Files\n\n'
        printf 'Changed but not diffed (lockfiles, snapshots, build output); dependency changes show in `package.json`.\n\n'
        while IFS= read -r f; do
            [[ -z "$f" ]] && continue
            printf -- '- `%s` (%s)\n' "$f" "$(status_of "$f")"
        done <<< "$IGNORED_FILES"
    fi

    printf '\n## Package References Required\n\n'
    if [[ -z "$PACKAGE_PAIRS" ]]; then
        printf '_No registered packages imported by the reviewed files._\n'
    else
        printf 'Candidates: before emitting findings, read the `AGENTS.md` of each package below that a changed line calls:\n\n'
        printf '%s\n' "$PACKAGE_PAIRS" | sort -u | awk -F'\t' '
            { files[$1] = (files[$1] == "" ? "" : files[$1] ", ") "`" $2 "`" }
            END {
                for (p in files) { n = p; sub(/@[^@]*$/, "", n); printf "- `%s` — [AGENTS.md](node_modules/%s/AGENTS.md) — imported by %s\n", p, n, files[p] }
            }
        ' | sort
    fi

    printf '\n## Parts\n\n'
    if [[ -z "$PARTS_SUMMARY" ]]; then
        printf '_No diff content._\n'
    else
        printf '%b' "$PARTS_SUMMARY"
        printf '\nRead every part before emitting findings.\n'
    fi
} > "$OUTDIR/index.md"

printf 'review.sh: %s files, %s part(s) → %s/index.md\n' "$FILE_COUNT" "$PART" "$OUTDIR" >&2
