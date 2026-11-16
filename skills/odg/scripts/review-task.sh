#!/usr/bin/env bash
# review-task.sh [--discard] [--delta] <repo-path>:<branch>...
# review-task.sh --local [--delta] [--install] <repo-path>...
#
# Modo MR (padrão): prepara cada repo local na branch pedida e roda review.sh
# em modo commits. Árvore suja interrompe tudo, a menos que --discard seja
# passado. Para cada branch com MR aberta grava <saída>/discussions.md (threads,
# respostas do autor, estado resolvido) só com GETs do `glab api`; sem glab/jq
# ou sem MR, avisa no stderr e segue.
#
# Modo --local: revisa o working tree de cada repo em modo all, na branch em
# que ele está. Sem checkout, sem fetch, sem descartar nada.
#
# --delta (re-revisão, nos dois modos): depois de preparar cada repo, roda review.sh em modo
# delta contra o state da revisão anterior. Repo sem state recebe a revisão completa, com aviso.
#
# Dependências (só repo com package.json na raiz; outra linguagem segue sem install):
# o gerenciador vem do campo `packageManager` do package.json; sem ele, do único
# lockfile da raiz (mais de um lockfile sem `packageManager`: não instala e avisa).
# Yarn é tratado como 2+. O install nunca reescreve o lock e não roda scripts de
# pós-instalação. No modo MR instala depois do checkout; no --local só avisa se o
# node_modules parece atrás do lock, a menos que --install seja passado. Falha de
# install não para a revisão: vira aviso no stderr e na seção Dependencies do index.md.
#
# Ao final imprime, por repo, HEAD, diretório do relatório e se existe AGENTS.md
# raiz, e a lista de AGENTS.md de pacote sem repetir pacote@versão entre repos.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USAGE='uso: review-task.sh [--discard] [--delta] <repo-path>:<branch>... | review-task.sh --local [--delta] [--install] <repo-path>...'
DISCARD=0
LOCAL=0
DELTA=0
INSTALL=0
TARGETS=()
for arg in "$@"; do
    case "$arg" in
        --discard) DISCARD=1 ;;
        --local) LOCAL=1 ;;
        --delta) DELTA=1 ;;
        --install) INSTALL=1 ;;
        -*) printf '%s\n' "$USAGE" >&2; exit 2 ;;
        *) TARGETS+=("$arg") ;;
    esac
done
(( ${#TARGETS[@]} )) || { printf '%s\n' "$USAGE" >&2; exit 2; }
(( LOCAL && DISCARD )) && { printf '%s\n' "$USAGE" >&2; exit 2; }
(( ! LOCAL && INSTALL )) && { printf '%s\n' "$USAGE" >&2; exit 2; }
(( LOCAL )) || INSTALL=1

repo_of() {
    if (( LOCAL )); then printf '%s' "$1"; else printf '%s' "${1%%:*}"; fi
}

branch_of() {
    if (( LOCAL )); then
        git -C "$1" rev-parse --abbrev-ref HEAD
    else
        printf '%s' "${1#*:}"
    fi
}

out_of() {
    printf '.review/%s' "${1//\//-}"
}

# Modo do review.sh, rodado na raiz do repo: delta só com --delta e com o state de uma revisão anterior.
mode_for() {
    local out="$1" full="$2"
    if (( DELTA )); then
        if [[ -f "$out/state" ]]; then
            printf 'delta'
            return
        fi
        printf 'review-task: sem state em %s/%s; revisão completa em %s\n' "$PWD" "$out" "$full" >&2
    fi
    printf '%s' "$full"
}

# Gerenciador de pacotes do repo atual: `packageManager` do package.json; sem ele, o único lockfile.
# Imprime yarn|pnpm|npm|bun, ou nada (com o motivo no stderr) quando não dá para decidir.
package_manager() {
    local pm locks=()
    pm="$(sed -nE 's/.*"packageManager"[[:space:]]*:[[:space:]]*"([a-z]+)@.*/\1/p' package.json | head -n 1)"
    if [[ -z "$pm" ]]; then
        [[ -f yarn.lock ]] && locks+=(yarn)
        [[ -f pnpm-lock.yaml ]] && locks+=(pnpm)
        [[ -f package-lock.json ]] && locks+=(npm)
        [[ -f bun.lock || -f bun.lockb ]] && locks+=(bun)
        if (( ${#locks[@]} != 1 )); then
            printf '%s lockfile(s) na raiz e sem `packageManager` no package.json' "${#locks[@]}" >&2
            return 0
        fi
        pm="${locks[0]}"
    fi
    case "$pm" in
        yarn|pnpm|npm|bun) printf '%s' "$pm" ;;
        *) printf 'packageManager `%s` não suportado' "$pm" >&2 ;;
    esac
}

# Lockfile do gerenciador e o arquivo que o install grava dentro de node_modules.
lock_of() {
    case "$1" in
        yarn) printf 'yarn.lock' ;;
        pnpm) printf 'pnpm-lock.yaml' ;;
        npm) printf 'package-lock.json' ;;
        bun) if [[ -f bun.lock ]]; then printf 'bun.lock'; else printf 'bun.lockb'; fi ;;
    esac
}
marker_of() {
    case "$1" in
        yarn) printf 'node_modules/.yarn-state.yml' ;;
        pnpm) printf 'node_modules/.modules.yaml' ;;
        npm) printf 'node_modules/.package-lock.json' ;;
        bun) printf 'node_modules' ;;
    esac
}

# Prepara as dependências do repo atual e imprime a nota da seção Dependencies do index.md
# (vazia para repo sem package.json). Nunca falha: problema vira aviso no stderr e na nota.
prepare_deps() {
    local out="$1" pm why cmd lock marker
    [[ -f package.json ]] || return 0
    pm="$(package_manager 2> "$out/.pm-why")"
    why="$(cat "$out/.pm-why")"; rm -f "$out/.pm-why"
    if [[ -z "$pm" ]]; then
        printf 'review-task: %s: %s; dependências não instaladas\n' "$PWD" "$why" >&2
        printf 'Not installed: %s. Lint/tsc of 💡 may run against packages that differ from the lockfile.' "$why"
        return 0
    fi
    lock="$(lock_of "$pm")"
    marker="$(marker_of "$pm")"

    if (( ! INSTALL )); then
        if [[ ! -e "$marker" ]]; then
            printf 'review-task: %s: node_modules ausente (%s)\n' "$PWD" "$pm" >&2
            printf '`node_modules` missing (%s): lint/tsc of 💡 cannot run. Rerun with `--install`.' "$pm"
        elif [[ -f "$lock" && "$lock" -nt "$marker" ]]; then
            printf 'review-task: %s: %s mais novo que o último install (%s)\n' "$PWD" "$lock" "$pm" >&2
            printf '`%s` is newer than the last %s install: `node_modules` is likely behind the lockfile, so lint/tsc of 💡 and base errors may come from the environment. Rerun with `--install`.' "$lock" "$pm"
        fi
        return 0
    fi

    case "$pm" in
        yarn) cmd=(yarn install --immutable --mode=skip-build) ;;
        pnpm) cmd=(pnpm install --frozen-lockfile --ignore-scripts) ;;
        npm) cmd=(npm ci --ignore-scripts) ;;
        bun) cmd=(bun install --frozen-lockfile --ignore-scripts) ;;
    esac
    if ! command -v "$pm" > /dev/null 2>&1; then
        printf 'review-task: %s: %s não encontrado; dependências não instaladas\n' "$PWD" "$pm" >&2
        printf 'Not installed: `%s` not found. Lint/tsc of 💡 may run against packages that differ from the lockfile.' "$pm"
        return 0
    fi
    if "${cmd[@]}" > "$out/install.log" 2>&1; then
        printf '`%s` ok: `node_modules` matches the lockfile.' "${cmd[*]}"
    else
        printf 'review-task: %s: `%s` falhou; log em %s/install.log\n' "$PWD" "${cmd[*]}" "$PWD/$out" >&2
        printf '`%s` FAILED (log: `install.log`). `node_modules` may not match the lockfile: lint/tsc of 💡 and base errors may come from the environment, not from the diff.' "${cmd[*]}"
    fi
}

# Grava <out>/discussions.md da MR aberta de <branch>. Só leitura no GitLab.
write_discussions() {
    local branch="$1" out="$2"
    local encoded mrs iid title url author

    if ! command -v glab >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
        printf 'review-task: glab ou jq ausente; %s/discussions.md não foi gravado\n' "$out" >&2
        return 0
    fi

    encoded="$(jq -rn --arg b "$branch" '$b | @uri')"
    if ! mrs="$(glab api --method GET "projects/:id/merge_requests?state=opened&source_branch=$encoded" 2>/dev/null)"; then
        printf 'review-task: glab api falhou para %s; %s/discussions.md não foi gravado\n' "$branch" "$out" >&2
        return 0
    fi

    iid="$(jq -r 'if type == "array" then .[0].iid // empty else empty end' <<< "$mrs" 2>/dev/null || true)"
    if [[ -z "$iid" ]]; then
        printf 'review-task: nenhuma MR aberta para %s; %s/discussions.md não foi gravado\n' "$branch" "$out" >&2
        return 0
    fi
    title="$(jq -r '.[0].title' <<< "$mrs")"
    url="$(jq -r '.[0].web_url' <<< "$mrs")"
    author="$(jq -r '.[0].author.username' <<< "$mrs")"

    {
        printf '# Discussions — !%s %s\n\n%s\n\nAutor da MR: `%s`. Threads abertas primeiro.\n\n' "$iid" "$title" "$url" "$author"
        glab api --method GET --paginate "projects/:id/merge_requests/$iid/discussions?per_page=100" \
            | jq -rs --arg author "$author" '
                def human: [.notes[] | select(.system | not)];
                def where: (.notes[0].position // null) as $p
                    | if $p == null then "geral"
                      else "`\($p.new_path // $p.old_path):\($p.new_line // $p.old_line)`" end;
                def state: [.notes[] | select(.resolvable)] as $r
                    | if ($r | length) == 0 then "comentário"
                      elif all($r[]; .resolved) then "resolved"
                      else "open" end;
                (add // [])
                | map(select((human | length) > 0) | . + { st: state })
                | (map(select(.st != "resolved")) + map(select(.st == "resolved")))
                | .[]
                | "## \(where) — \(if .st == "resolved" then "marcada resolvida no GitLab" else .st end) — thread `\(.id)`\n\n"
                  + ([human[]
                      | "- **\(.author.username)\(if .author.username == $author then " (autor)" else "" end)** \(.created_at[0:10]): "
                        + (.body | gsub("\n"; "\n    "))]
                     | join("\n"))
                  + "\n"'
    } > "$out/discussions.md" || {
        printf 'review-task: falha ao ler as discussões de !%s; %s/discussions.md removido\n' "$iid" "$out" >&2
        rm -f "$out/discussions.md"
    }
}

# 1. valida tudo antes de tocar em qualquer repo
for t in "${TARGETS[@]}"; do
    if (( ! LOCAL )) && [[ "$t" != *:* ]]; then
        printf '%s\n' "$USAGE" >&2
        exit 2
    fi
    repo="$(repo_of "$t")"
    git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { printf '%s: não é um repositório git\n' "$repo" >&2; exit 1; }
    if (( ! LOCAL && ! DISCARD )) && [[ -n "$(git -C "$repo" status --porcelain | grep -v "^?? .review/" || true)" ]]; then
        printf '%s: árvore suja; faça commit/stash ou passe --discard\n' "$repo" >&2
        exit 1
    fi
done

# 2. sincroniza (modo MR) e revisa
SUMMARY=""
OUTS=()
for t in "${TARGETS[@]}"; do
    repo="$(repo_of "$t")"
    branch="$(branch_of "$t")"
    out="$(out_of "$branch")"
    OUTS+=("$repo/$out")
    (
        cd "$repo"
        mkdir -p "$out"
        if (( LOCAL )); then
            REVIEW_DEPS_NOTE="$(prepare_deps "$out")" "$SCRIPT_DIR/review.sh" "$out" "$(mode_for "$out" all)" >/dev/null
        else
            (( DISCARD )) && { git reset -q --hard; git clean -qfd; }
            base="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null || true)"
            git fetch -q origin "$branch" ${base:+"${base#origin/}"}
            git checkout -q --detach "origin/$branch"
            REVIEW_DEPS_NOTE="$(prepare_deps "$out")" "$SCRIPT_DIR/review.sh" "$out" "$(mode_for "$out" commits)" >/dev/null
            write_discussions "$branch" "$out"
        fi
    )
    agents="no root AGENTS.md"
    [[ -f "$repo/AGENTS.md" ]] && agents="root AGENTS.md: $repo/AGENTS.md"
    discussions=""
    [[ -f "$repo/$out/discussions.md" ]] && discussions=" · discussions: \`$repo/$out/discussions.md\`"
    SUMMARY+="$(printf -- '- `%s` @ `%s` → `%s/index.md` — %s%s' "$t" "$(git -C "$repo" rev-parse --short HEAD)" "$repo/$out" "$agents" "$discussions")"$'\n'
done

printf '## Repos\n\n%s\n## Package References Required (once per pkg@version)\n\n' "$SUMMARY"
for i in "${!OUTS[@]}"; do
    repo="$(repo_of "${TARGETS[$i]}")"
    sed -nE 's/^- `(@[^`]+)` — \[AGENTS.md\]\(([^)]+)\).*/\1\t\2/p' "${OUTS[$i]}/index.md" \
        | awk -F'\t' -v r="$repo" '{ print $1 "\t" r "/" $2 }'
done | sort -u -t$'\t' -k1,1 | awk -F'\t' '{ printf "- `%s` — %s\n", $1, $2 }'
