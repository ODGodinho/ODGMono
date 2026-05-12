#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)"
cd "$ROOT_DIR"

BASE_REF="${REVIEW_BASE:-}"
HEAD_REF="${REVIEW_HEAD:-HEAD}"

CONTEXT_LINES="${REVIEW_CONTEXT_LINES:-1}"
MAX_DIFF_LINES_PER_FILE="${REVIEW_MAX_DIFF_LINES_PER_FILE:-1200}"
MAX_FILES="${REVIEW_MAX_FILES:-200}"

IGNORE_REGEX='(^yarn.lock$|^pnpm-lock.yaml$|^package-lock.json$|^.review/|^dist/|^.next/|^coverage/|^.turbo/|^.git/|^.yarn/|\.snap$|\.min\.)'

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

is_ignored_file() {
    local file="$1"

    if git check-ignore -q "$file"; then
        return 0
    fi

    [[ "$file" =~ $IGNORE_REGEX ]]
}

print_changed_files() {
    print_section "Changed Files"

    printf '| Status | + | - | File |\n'
    printf '| --- | ---: | ---: | --- |\n'

    local count=0

    while IFS=$'\t' read -r added deleted path; do
        [[ -z "${path:-}" ]] && continue

        if is_ignored_file "$path"; then
            continue
        fi

        local status

        status="$(
            git diff \
                --name-status \
                --find-renames \
                --find-copies \
                "$MERGE_BASE" \
                "$HEAD_REF" \
                -- "$path" \
            | awk 'NR==1 {print $1}'
        )"

        printf '| %s | %s | %s | `%s` |\n' \
            "${status:-?}" \
            "$added" \
            "$deleted" \
            "$path"

        count=$((count + 1))

        if (( count >= MAX_FILES )); then
            printf '| ... | ... | ... | Truncated after %s files |\n' "$MAX_FILES"
            break
        fi

    done < <(
        git diff \
            --numstat \
            --find-renames \
            --find-copies \
            "$MERGE_BASE" \
            "$HEAD_REF"
    )

    if (( count == 0 )); then
        printf '_No changed files._\n'
    fi
}

print_risk_areas() {
    print_section "Risk Areas"

    local risks=""

    local changed_files

    changed_files="$(
        git diff \
            --name-only \
            "$MERGE_BASE" \
            "$HEAD_REF"
    )"

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


print_key_diff_excerpts() {
    print_section "Key Diff Excerpts"

    local files

    files="$(
        git diff \
            --name-only \
            "$MERGE_BASE" \
            "$HEAD_REF"
    )"

    local count=0

    while IFS= read -r file; do
        [[ -z "$file" ]] && continue

        if is_ignored_file "$file"; then
            continue
        fi

        printf '### `%s`\n\n' "$file"

        printf '```diff\n'

        git diff \
            --find-renames \
            --find-copies \
            --unified="$CONTEXT_LINES" \
            --no-ext-diff \
            "$MERGE_BASE" \
            "$HEAD_REF" \
            -- "$file" \
            | sed '1,4d' \
            | head -n "$MAX_DIFF_LINES_PER_FILE" \
            || true

        printf '```\n\n'

        count=$((count + 1))

        if (( count >= MAX_FILES )); then
            break
        fi

    done <<< "$files"
}

print_untracked_files() {
    print_section "Untracked Files"

    local found=0

    while IFS= read -r path; do
        [[ -z "$path" ]] && continue

        if is_ignored_file "$path"; then
            continue
        fi

        printf -- '- `%s`\n' "$path"

        found=1

    done < <(
        git ls-files \
            --others \
            --exclude-standard
    )

    if (( found == 0 )); then
        printf '_No untracked files._\n'
    fi
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

print_risk_areas

print_changed_files

print_key_diff_excerpts

print_untracked_files
