#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)"
cd "$ROOT_DIR"

BASE_REF="${REVIEW_BASE:-}"
HEAD_REF="${REVIEW_HEAD:-HEAD}"

CONTEXT_LINES="${REVIEW_CONTEXT_LINES:-1}"
MAX_DIFF_LINES_PER_FILE="${REVIEW_MAX_DIFF_LINES_PER_FILE:-1200}"
MAX_FILES="${REVIEW_MAX_FILES:-200}"

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

diff_numstat_for_file() {
    local scope="$1"
    local file="$2"

    case "$scope" in
        worktree)
            git diff \
                --numstat \
                --find-renames \
                --find-copies \
                -- "$file"
            ;;
        staged)
            git diff \
                --cached \
                --numstat \
                --find-renames \
                --find-copies \
                -- "$file"
            ;;
        commits)
            git diff \
                --numstat \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "$file"
            ;;
    esac
}

diff_name_status_for_file() {
    local scope="$1"
    local file="$1"

    file="$2"

    case "$scope" in
        worktree)
            git diff \
                --name-status \
                --find-renames \
                --find-copies \
                -- "$file"
            ;;
        staged)
            git diff \
                --cached \
                --name-status \
                --find-renames \
                --find-copies \
                -- "$file"
            ;;
        commits)
            git diff \
                --name-status \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "$file"
            ;;
    esac
}

diff_patch_for_file() {
    local scope="$1"
    local file="$1"

    file="$2"

    case "$scope" in
        worktree)
            git diff \
                --find-renames \
                --find-copies \
                --unified="$CONTEXT_LINES" \
                --no-ext-diff \
                -- "$file"
            ;;
        staged)
            git diff \
                --cached \
                --find-renames \
                --find-copies \
                --unified="$CONTEXT_LINES" \
                --no-ext-diff \
                -- "$file"
            ;;
        commits)
            git diff \
                --find-renames \
                --find-copies \
                --unified="$CONTEXT_LINES" \
                --no-ext-diff \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "$file"
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
    done < <(list_unique_reviewed_files)

    if (( count == 0 )); then
        printf '_No changed files._\n'
    fi
}

print_risk_areas() {
    print_section "Risk Areas"

    local risks=""

    local changed_files

    changed_files="$(list_reviewed_files | awk 'NF && !seen[$0]++')"

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

    diff_text=$(git diff -- "$file" 2>/dev/null || true)

    if [[ -z "$diff_text" ]]; then
        diff_text=$(git diff "$MERGE_BASE" "$HEAD_REF" -- "$file" 2>/dev/null || true)
    fi

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
        [[ -f "node_modules/$pkg/agents.md" ]] || continue
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
        done < <(list_unique_reviewed_files) | sort -u
    )"

    if [[ -z "$packages" ]]; then
        printf '_No registered packages touched by the diff._\n'
        return
    fi

    printf 'The agent **MUST** read each `agents.md` below before emitting findings:\n\n'

    while IFS= read -r pkg; do
        [[ -z "$pkg" ]] && continue
        printf -- '- `%s` — [agents.md](node_modules/%s/agents.md)\n' "$pkg" "$pkg"
    done <<< "$packages"
}

print_smart_diffs() {
    print_section "Code Changes (Diffs)"
    local file

    while IFS= read -r file; do
        [[ -z "$file" ]] && continue

        # Filtros de segurança que já implementamos
        if is_ignored_file "$file"; then continue; fi
        if [[ -d "$file" ]]; then continue; fi

        printf '### `%s`\n' "$file"

        # REGRA 1: Se for arquivo novo, NÃO manda o diff (para poupar tokens). Força o READ.
        if is_untracked_file "$file" || ! git ls-tree -r "$MERGE_BASE" "$file" >/dev/null 2>&1; then
            printf '> _NEW FILE CREATED_\n\n'
            continue
        fi

        # REGRA 2: Se for arquivo modificado, manda o diff unificado padrão (com 3 linhas de contexto)
        local diff_output
        # Tenta pegar as mudanças locais primeiro, se falhar/vazio, pega a diferença de commits
        diff_output=$(git diff -- "$file" 2>/dev/null | sed '1,4d' || true)

        if [[ -z "$diff_output" ]]; then
            diff_output=$(git diff "$MERGE_BASE" "$HEAD_REF" -- "$file" 2>/dev/null | sed '1,4d' || true)
        fi

        if [[ -z "$diff_output" ]]; then
            printf '> _Only metadata changes_\n\n'
        else
            # Imprime o diff envelopado para a IA entender que é um código de comparação
            printf '```diff\n%s\n```\n\n' "$diff_output"
        fi

    done < <(list_unique_reviewed_files)
}

BASE_REF="$(choose_base_ref)"

MERGE_BASE="$(
    git merge-base "$BASE_REF" "$HEAD_REF" \
    2>/dev/null \
    || git rev-parse "$BASE_REF"
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

print_risk_areas

print_changed_files

print_package_references_required

print_smart_diffs