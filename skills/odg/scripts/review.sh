#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)"
cd "$ROOT_DIR"

BASE_REF="${REVIEW_BASE:-}"
HEAD_REF="${REVIEW_HEAD:-HEAD}"

CONTEXT_LINES="${REVIEW_CONTEXT_LINES:-1}"
MAX_DIFF_LINES_PER_FILE="${REVIEW_MAX_DIFF_LINES_PER_FILE:-1200}"
MAX_FILES="${REVIEW_MAX_FILES:-200}"

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

CONTEXT_LINES="$(require_positive_int REVIEW_CONTEXT_LINES "$CONTEXT_LINES" 1)"
MAX_DIFF_LINES_PER_FILE="$(require_positive_int REVIEW_MAX_DIFF_LINES_PER_FILE "$MAX_DIFF_LINES_PER_FILE" 1200)"
MAX_FILES="$(require_positive_int REVIEW_MAX_FILES "$MAX_FILES" 200)"

IGNORE_REGEX='(^yarn.lock$|^pnpm-lock.yaml$|^package-lock.json$|^.review/|^dist/|^.next/|^coverage/|^.turbo/|^.git/|^.yarn/|\.snap$|\.min\.|bun.lock$|bun.lockb$|.yarn|.claude)'

choose_base_ref() {
    if [[ -n "$BASE_REF" ]]; then
        printf '%s' "$BASE_REF"
        return
    fi

    local candidate

    for candidate in \
        "origin/main" \
        "origin/master" \
        "origin/develop" \
        "upstream/main" \
        "upstream/master" \
        "main" \
        "master" \
        "develop"; do

        if git rev-parse --verify --quiet "$candidate" >/dev/null; then
            printf '%s' "$candidate"
            return
        fi
    done

    printf '%s' "HEAD~1"
}

print_section() {
    printf '\n## %s\n\n' "$1"
}

list_scopes() {
    printf '%s\n' "commits" "staged" "worktree"
}

list_untracked_files() {
    git ls-files \
        --others \
        --exclude-standard
}

diff_name_only_for_scope() {
    local scope="$1"

    case "$scope" in
        worktree)
            git diff \
                --name-only \
                --find-renames \
                --find-copies
            ;;
        staged)
            git diff \
                --cached \
                --name-only \
                --find-renames \
                --find-copies
            ;;
        commits)
            git diff \
                --name-only \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF"
            ;;
    esac
}

diff_numstat_for_scope() {
    local scope="$1"

    case "$scope" in
        worktree)
            git diff \
                --numstat \
                --find-renames \
                --find-copies
            ;;
        staged)
            git diff \
                --cached \
                --numstat \
                --find-renames \
                --find-copies
            ;;
        commits)
            git diff \
                --numstat \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF"
            ;;
    esac
}

rename_source_for_file() {
    local file="$1"

    awk -F'\t' -v f="$file" '$2==f{print $1; exit}' <<< "$RENAME_MAP"
}

# Escreve no global PATHSPEC (array), consumido imediatamente pelo chamador
# como `-- "${PATHSPEC[@]}"`. É global e não retorno por stdout porque um path
# pode conter qualquer byte exceto NUL, inclusive tab e newline, o que
# quebraria a serialização.
PATHSPEC=()

resolve_pathspec_array() {
    local file="$1"
    local old

    old="$(rename_source_for_file "$file")"

    if [[ -n "$old" && "$old" != "$file" ]]; then
        PATHSPEC=("$old" "$file")
    else
        PATHSPEC=("$file")
    fi
}

# Renomeio puro = tem origem de rename E zero linhas adicionadas/removidas.
# Estes arquivos são omitidos de todas as seções e resumidos em uma única
# linha por pasta em "Renamed Paths".
is_pure_rename_file() {
    local file="$1"

    grep -Fqx -- "$file" <<< "$PURE_RENAME_FILES"
}

# Existe no baseline? `git ls-tree` sai com 0 mesmo sem match,
# então o que vale é a saída estar não-vazia.
exists_in_merge_base() {
    local file="$1"

    [[ -n "$(git ls-tree -r "$MERGE_BASE" -- "$file" 2>/dev/null)" ]]
}

# Aplica MAX_DIFF_LINES_PER_FILE. Usa awk em vez de `head` porque `head`
# fecha o pipe e o SIGPIPE resultante derrubaria o script sob `pipefail`.
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

# Primeiro patch não-vazio entre worktree, staged e commits.
patch_for_file() {
    local file="$1"
    local scope
    local out

    for scope in worktree staged commits; do
        out="$(diff_patch_for_file "$scope" "$file" 2>/dev/null | strip_diff_headers)"

        if [[ -n "$out" ]]; then
            cap_patch_lines "$out"
            return
        fi
    done
}

diff_numstat_for_file() {
    local scope="$1"
    local file="$2"

    resolve_pathspec_array "$file"

    case "$scope" in
        worktree)
            git diff \
                --numstat \
                --find-renames \
                --find-copies \
                -- "${PATHSPEC[@]}"
            ;;
        staged)
            git diff \
                --cached \
                --numstat \
                --find-renames \
                --find-copies \
                -- "${PATHSPEC[@]}"
            ;;
        commits)
            git diff \
                --numstat \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "${PATHSPEC[@]}"
            ;;
    esac
}

diff_name_status_for_file() {
    local scope="$1"
    local file="$2"

    resolve_pathspec_array "$file"

    case "$scope" in
        worktree)
            git diff \
                --name-status \
                --find-renames \
                --find-copies \
                -- "${PATHSPEC[@]}"
            ;;
        staged)
            git diff \
                --cached \
                --name-status \
                --find-renames \
                --find-copies \
                -- "${PATHSPEC[@]}"
            ;;
        commits)
            git diff \
                --name-status \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "${PATHSPEC[@]}"
            ;;
    esac
}

diff_patch_for_file() {
    local scope="$1"
    local file="$2"

    resolve_pathspec_array "$file"

    case "$scope" in
        worktree)
            git diff \
                --find-renames \
                --find-copies \
                --unified="$CONTEXT_LINES" \
                --no-ext-diff \
                -- "${PATHSPEC[@]}"
            ;;
        staged)
            git diff \
                --cached \
                --find-renames \
                --find-copies \
                --unified="$CONTEXT_LINES" \
                --no-ext-diff \
                -- "${PATHSPEC[@]}"
            ;;
        commits)
            git diff \
                --find-renames \
                --find-copies \
                --unified="$CONTEXT_LINES" \
                --no-ext-diff \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "${PATHSPEC[@]}"
            ;;
    esac
}

list_reviewed_files() {
    while IFS= read -r scope; do
        diff_name_only_for_scope "$scope"
    done < <(list_scopes)

    list_untracked_files
}

list_unique_reviewed_files() {
    list_reviewed_files | awk 'NF && !seen[$0]++'
}

# Igual a list_unique_reviewed_files, mas sem os renomeios puros.
# É esta lista que alimenta Risk Areas, Changed Files, Package References
# e os diffs — renomeio puro não é conteúdo para revisar.
# Preenchida em REVIEWABLE_FILES antes da primeira seção ser impressa.
list_reviewable_files() {
    printf '%s\n' "$REVIEWABLE_FILES"
}

is_untracked_file() {
    local file="$1"

    list_untracked_files | grep -Fqx -- "$file"
}

add_numstat_value() {
    local total="$1"
    local value="$2"

    if [[ ! "$total" =~ ^[0-9]+$ || ! "$value" =~ ^[0-9]+$ ]]; then
        printf '%s' "-"
        return
    fi

    printf '%s' "$((total + value))"
}

read_numstat_totals_for_file() {
    local file="$1"
    local scope
    local added=0
    local deleted=0
    local current_added
    local current_deleted

    while IFS= read -r scope; do
        [[ -z "$scope" ]] && continue

        if [[ "$scope" == "untracked" ]]; then
            read -r current_added current_deleted < <(
                git diff \
                    --no-index \
                    --numstat \
                    -- /dev/null "$file" \
                    | awk 'NR==1 {print $1 "\t" $2}' \
                    || true
            )
        else
            read -r current_added current_deleted < <(
                diff_numstat_for_file "$scope" "$file" | awk 'NR==1 {print $1 "\t" $2}'
            )
        fi

        added="$(add_numstat_value "$added" "${current_added:--}")"
        deleted="$(add_numstat_value "$deleted" "${current_deleted:--}")"
    done < <(list_file_scopes "$file")

    printf '%s\t%s\n' "$added" "$deleted"
}

list_file_scopes() {
    local file="$1"
    local scope

    while IFS= read -r scope; do
        if [[ -n "$(diff_name_status_for_file "$scope" "$file")" ]]; then
            printf '%s\n' "$scope"
        fi
    done < <(list_scopes)

    if is_untracked_file "$file"; then
        printf '%s\n' "untracked"
    fi
}

format_file_details() {
    local file="$1"
    local added
    local deleted

    read -r added deleted < <(read_numstat_totals_for_file "$file")

    printf '+%s/-%s' \
        "${added:--}" \
        "${deleted:--}"
}

print_review_scope() {
    print_section "Review Scope"

    printf -- '- Source: committed branch delta from `%s` to `%s`\n' "$MERGE_BASE" "$HEAD_REF"
}

is_ignored_file() {
    local file="$1"

    if git check-ignore -q "$file"; then
        return 0
    fi

    [[ "$file" =~ $IGNORE_REGEX ]]
}

print_changed_files() {
    print_section "Changed Files"

    printf '| File | Changes |\n'
    printf '| --- | --- |\n'

    local count=0
    local file

    while IFS= read -r file; do
        [[ -z "$file" ]] && continue

        if is_ignored_file "$file"; then
            continue
        fi

        printf '| `%s` | %s |\n' \
            "$file" \
            "$(format_file_details "$file")"

        count=$((count + 1))

        if (( count >= MAX_FILES )); then
            printf '| ... | Truncated after %s files |\n' "$MAX_FILES"
            break
        fi
    done < <(list_reviewable_files)

    if (( count == 0 )); then
        printf '_No changed files._\n'
    fi
}

print_risk_areas() {
    print_section "Risk Areas"

    local risks=""

    local changed_files

    changed_files="$(list_reviewable_files)"

    if grep -Eq '(Container|Provider|Kernel)' <<< "$changed_files"; then
        risks="${risks}- Dependency Injection / Container Wiring\n"
    fi

    if grep -Eq '(Event|Listener)' <<< "$changed_files"; then
        risks="${risks}- Event Flow / Event Dispatching\n"
    fi

    if grep -Eq '(Service)' <<< "$changed_files"; then
        risks="${risks}- Service Behavior / Side Effects\n"
    fi

    if grep -Eq '(Config)' <<< "$changed_files"; then
        risks="${risks}- Configuration Contracts / Runtime Configuration\n"
    fi

    if grep -Eq '(Page|Handler|Selector)' <<< "$changed_files"; then
        risks="${risks}- Crawler Flow / Page Interaction\n"
    fi

    if [[ -z "$risks" ]]; then
        printf '_No obvious high-risk areas detected._\n'
        return
    fi

    printf '%b' "$risks"
}

parse_scoped_imports() {
    local file="$1"

    perl -0777 -ne '
        while (/import\s+(.+?)\s+from\s+["\x27](@[a-z0-9_-]+\/[a-z0-9_-]+)["\x27]/sg) {
            my ($body, $pkg) = ($1, $2);
            $body =~ s/\*\s+as\s+(\w+)/$1/g;
            $body =~ s/\b\w+\s+as\s+(\w+)\b/$1/g;
            $body =~ s/\btype\b//g;
            $body =~ s/[\{\}*]/ /g;
            for my $tok (split /[,\s]+/, $body) {
                next unless $tok =~ /^[A-Za-z_]\w*$/;
                print "$tok\t$pkg\n";
            }
        }
    ' "$file" 2>/dev/null || true
}

extract_diff_tokens() {
    local file="$1"
    local diff_text

    diff_text="$(patch_for_file "$file")"

    [[ -z "$diff_text" ]] && return

    printf '%s' "$diff_text" \
        | grep -E '^[+-]' \
        | grep -vE '^(\+\+\+|---)' \
        | grep -oE '[A-Za-z_][A-Za-z0-9_]*' \
        | sort -u \
        || true
}

detect_packages_in_file() {
    local file="$1"
    local imports_map
    local tokens
    local sym
    local pkg

    imports_map="$(parse_scoped_imports "$file")"
    [[ -z "$imports_map" ]] && return

    tokens="$(extract_diff_tokens "$file")"
    [[ -z "$tokens" ]] && return

    while IFS=$'\t' read -r sym pkg; do
        [[ -z "$sym" || -z "$pkg" ]] && continue
        [[ -f "node_modules/$pkg/AGENTS.md" ]] || continue
        if grep -qxF "$sym" <<< "$tokens"; then
            printf '%s\n' "$pkg"
        fi
    done <<< "$imports_map"
}

print_package_references_required() {
    print_section "Package References Required"

    local packages
    local file
    local pkg

    packages="$(
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            if is_ignored_file "$file"; then continue; fi
            [[ "$file" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]] || continue
            [[ -f "$file" ]] || continue
            detect_packages_in_file "$file"
        done < <(list_reviewable_files) | sort -u
    )"

    if [[ -z "$packages" ]]; then
        printf '_No registered packages touched by the diff._\n'
        return
    fi

    printf 'The agent **MUST** read each `AGENTS.md` below before emitting findings:\n\n'

    while IFS= read -r pkg; do
        [[ -z "$pkg" ]] && continue
        printf -- '- `%s` — [AGENTS.md](node_modules/%s/AGENTS.md)\n' "$pkg" "$pkg"
    done <<< "$packages"
}

# Descarta o cabeçalho do patch mantendo tudo a partir do primeiro `@@`.
# Filtrar por prefixo (`--- `, `+++ `) apagaria linhas de CONTEÚDO cujo texto
# começa com `--`/`++` — um comentário SQL removido (`-- nota`) vira `--- nota`
# no patch e desaparecia do relatório.
# `Binary files ... differ` não tem `@@` e precisa sobreviver.
strip_diff_headers() {
    awk '
        /^Binary files / { print; next }
        /^@@/ { body = 1 }
        body { print }
    '
}

# Agrupa pares "old\tnew" de renomeios puros (sem mudança de conteúdo) por
# pasta renomeada em comum, e imprime uma única linha por pasta em vez de
# um bloco por arquivo. Ex.: 9 arquivos sob `source/` -> `src/` viram
# "- `source` → `src` (9 files)".
print_renamed_paths() {
    [[ -z "$PURE_RENAME_PAIRS" ]] && return

    print_section "Renamed Paths (no content changes)"

    printf 'File contents are byte-identical — there is nothing to review inside them.\n'
    printf 'The agent **MUST** still check packaging and reference impact of the move itself\n'
    printf '(stale paths in `package.json` `files`, imports, docs links, case-only renames on\n'
    printf 'case-insensitive filesystems).\n\n'

    printf '%s' "$PURE_RENAME_PAIRS" | awk -F'\t' '
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
            kprefix[key] = prefix
            koldmid[key] = old_mid
            knewmid[key] = new_mid
        }
        END {
            for (key in count) {
                p = kprefix[key]; om = koldmid[key]; nm = knewmid[key]; c = count[key]

                # Mover para uma subpasta deixa o segmento antigo vazio
                # (`app/x.ts` -> `app/Services/x.ts`); sem este guarda a
                # saída virava "`app/` -> `app/Services`".
                old_full = (om == "" ? p : (p == "" ? om : p "/" om))
                new_full = (nm == "" ? p : (p == "" ? nm : p "/" nm))

                if (c == 1) {
                    printf "- `%s` \xe2\x86\x92 `%s`\n", old_full, new_full
                } else {
                    printf "- `%s` \xe2\x86\x92 `%s` (%d files)\n", old_full, new_full, c
                }
            }
        }
    ' | sort
}

print_smart_diffs() {
    print_section "Code Changes (Diffs)"
    local file

    while IFS= read -r file; do
        [[ -z "$file" ]] && continue

        # Filtros de segurança que já implementamos
        if is_ignored_file "$file"; then continue; fi
        if [[ -d "$file" ]]; then continue; fi

        local old
        old="$(rename_source_for_file "$file")"

        printf '### `%s`\n' "$file"

        if [[ -n "$old" && "$old" != "$file" ]]; then
            printf '> _Renamed from `%s` to `%s`_\n\n' "$old" "$file"
        fi

        # REGRA 1: Se for arquivo novo de verdade (sem origem de rename), NÃO manda o diff. Força o READ.
        if [[ -z "$old" ]] && { is_untracked_file "$file" || ! exists_in_merge_base "$file"; }; then
            printf '> _NEW FILE CREATED_\n\n'
            continue
        fi

        # REGRA 2: Se for arquivo modificado, manda o diff unificado.
        # patch_for_file cobre worktree, staged e commits, e passa o pathspec
        # antigo+novo para que o git detecte o rename corretamente.
        local diff_output
        diff_output="$(patch_for_file "$file")"

        if [[ -z "$diff_output" ]]; then
            printf '> _Only metadata changes_\n\n'
        else
            # Imprime o diff envelopado para a IA entender que é um código de comparação
            printf '```diff\n%s\n```\n\n' "$diff_output"
        fi

    done < <(list_reviewable_files)
}

BASE_REF="$(choose_base_ref)"

MERGE_BASE="$(
    git merge-base "$BASE_REF" "$HEAD_REF" \
    2>/dev/null \
    || git rev-parse "$BASE_REF"
)"

# Um único passe de `--name-status` por escopo alimenta o mapa de renomeios
# E a detecção de renomeio puro. A versão anterior chamava
# read_numstat_totals_for_file por arquivo renomeado (~5 processos git cada):
# 1297 chamadas e 10,35s para um rename de 250 arquivos.
NAME_STATUS_ALL="$(
    {
        git diff --name-status --find-renames --find-copies
        git diff --cached --name-status --find-renames --find-copies
        git diff --name-status --find-renames --find-copies "$MERGE_BASE" "$HEAD_REF"
    } 2>/dev/null
)"

RENAME_MAP="$(
    printf '%s\n' "$NAME_STATUS_ALL" \
        | awk -F'\t' '$1 ~ /^[RC]/ { print $2"\t"$3 }' \
        | awk 'NF && !seen[$0]++'
)"

# Renomeio puro = o destino aparece como R100/C100 (git: conteúdo idêntico) e
# nunca como M/A/D nem como rename com similaridade < 100 em nenhum escopo.
# Cobre binário de graça: R100 não depende de numstat, que devolve `-` e
# fazia o teste `== "0"` falhar para PNG/fontes.
PURE_RENAME_PAIRS="$(
    printf '%s\n' "$NAME_STATUS_ALL" \
        | awk -F'\t' '
            $1 ~ /^[RC]/ {
                if ($1 == "R100" || $1 == "C100") {
                    if (!($3 in dirty)) pure[$3] = $2
                } else {
                    dirty[$3] = 1
                    delete pure[$3]
                }
                next
            }
            NF >= 2 {
                dirty[$2] = 1
                delete pure[$2]
            }
            END {
                for (target in pure) print pure[target] "\t" target
            }
        ' \
        | sort
)"

PURE_RENAME_FILES="$(
    printf '%s' "$PURE_RENAME_PAIRS" \
        | awk -F'\t' 'NF >= 2 { print $2 }'
)"

# Calculada uma única vez: is_pure_rename_file forkava um grep por arquivo e
# list_reviewable_files é consumida por 4 seções.
REVIEWABLE_FILES="$(
    while IFS= read -r reviewable_candidate; do
        [[ -z "$reviewable_candidate" ]] && continue
        if is_pure_rename_file "$reviewable_candidate"; then continue; fi
        printf '%s\n' "$reviewable_candidate"
    done < <(list_unique_reviewed_files)
)"

BRANCH="$(
    git branch --show-current 2>/dev/null \
    || true
)"

REMOTE_URL="$(
    git config --get remote.origin.url \
    || true
)"

GENERATED_AT="$(
    date -u '+%Y-%m-%dT%H:%M:%SZ'
)"

print_review_scope

print_renamed_paths

print_risk_areas

print_changed_files

print_package_references_required

print_smart_diffs
