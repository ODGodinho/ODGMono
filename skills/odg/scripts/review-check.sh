#!/usr/bin/env bash
# review-check.sh < saida-da-revisao.md
#
# Valida a seção "GitLab Comments" contra o formato de references/review.md.
# Imprime uma linha por reprovação e sai 1; sem reprovação, sai 0.
# Os nomes citáveis vêm do checklist.md em tempo de execução: negrito no
# início de um item de lista, sem o parêntese final.
set -uo pipefail

CHECKLIST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/references/review/checklist.md"
if [[ ! -f "$CHECKLIST" ]]; then
    printf 'review-check: checklist não encontrado: %s\n' "$CHECKLIST" >&2
    exit 2
fi

NAMES="$(sed -nE 's/^[[:space:]]*- (\[ \] )?\*\*([^*]+)\*\*.*/\2/p' "$CHECKLIST" | sed -E 's/ \([^)]*\)$//')"
BANNED='confirmar com|decidir (entre|com)|avaliar se|ver com o time|alinhar com'
HEADING='^#+[[:space:]]*GitLab Comments'

INPUT="$(cat)"
OFFSET="$(grep -nE "$HEADING" <<< "$INPUT" | awk -F: 'NR == 1 { print $1 }')"
if [[ -z "$OFFSET" ]]; then
    printf 'seção "GitLab Comments" ausente\n'
    exit 1
fi
SECTION="$(awk -v h="$HEADING" '$0 ~ h { on = 1; next } on && /^#+ / { exit } on' <<< "$INPUT")"

FAILS=0
BLOCKS=0
head=""
body=""
start=0

fail() {
    printf '%s\n' "$1"
    FAILS=$((FAILS + 1))
}

trim() {
    local s="$1"
    s="${s#"${s%%[![:space:]]*}"}"
    printf '%s' "${s%"${s##*[![:space:]]}"}"
}

check_citation() {
    local where="$1" cite="$2"
    local name rest src valid=0 known=1
    local -a sources=()

    name="$(trim "${cite%%|*}")"
    if [[ "$name" != "Agent Found" ]] && ! grep -Fxq -- "$name" <<< "$NAMES"; then
        fail "$where: \"$name\" não é item em negrito do checklist.md nem Agent Found"
        known=0
    fi

    rest=""
    [[ "$cite" == *"|"* ]] && rest="${cite#*|}"
    IFS='|' read -ra sources <<< "$rest"
    for src in "${sources[@]+"${sources[@]}"}"; do
        src="$(trim "$src")"
        [[ "$src" =~ ^[^[:space:]]+:[0-9]+(-[0-9]+)?$ ]] || continue
        valid=$((valid + 1))
    done
}

check_block() {
    [[ -z "$head" ]] && return
    BLOCKS=$((BLOCKS + 1))

    local where="linha $((OFFSET + start))"
    local all="$head"$'\n'"$body"
    local icons cite tip

    icons="$(grep -oE '❌|⚠|💬' <<< "$all" | wc -l | tr -d ' ')"
    (( icons == 0 )) && fail "$where: sem ícone ❌/⚠️/💬"
    (( icons > 1 )) && fail "$where: $icons ícones no bloco; um achado por bloco"

    cite="$(sed -nE 's/.*\(([^()]*)\)[`[:space:]]*$/\1/p' <<< "$head")"
    if [[ -z "$cite" ]]; then
        if [[ "$head" == *"("*"("* ]]; then
            fail "$where: parênteses aninhados na citação; cite o nome do item sem o parêntese final"
        else
            fail "$where: sem citação (Nome da regra)"
        fi
    else
        check_citation "$where" "$cite"
    fi

    if [[ "$all" == *"💡"* ]]; then
        tip="${all#*💡}"
        if [[ -z "$(trim "${tip//\`/}")" ]]; then
            fail "$where: 💡 vazio"
        elif grep -Eiq "$BANNED" <<< "$tip"; then
            fail "$where: 💡 genérico ($(grep -Eio "$BANNED" <<< "$tip" | awk 'NR == 1'))"
        fi
    elif [[ "$all" != *"Decisão:"* ]]; then
        fail "$where: 💡 ausente e sem \"Decisão:\""
    fi
}

lineno=0
while IFS= read -r line; do
    lineno=$((lineno + 1))
    if [[ "$line" == '- `'* ]]; then
        check_block
        head="$line"
        body=""
        start=$lineno
    elif [[ -n "$head" && ( -z "$line" || "$line" =~ ^[[:space:]] ) ]]; then
        body+="$line"$'\n'
    else
        check_block
        head=""
    fi
done <<< "$SECTION"
check_block

footer="$(grep -E '^_Emitted [0-9]+ comments?\._$' <<< "$SECTION" | tail -n 1)"
if (( BLOCKS == 0 )); then
    grep -q 'No issues found' <<< "$SECTION" || fail "GitLab Comments sem blocos e sem \"No issues found.\""
elif [[ -z "$footer" ]]; then
    fail "footer _Emitted N comments._ ausente"
else
    n="$(sed -E 's/^_Emitted ([0-9]+) .*/\1/' <<< "$footer")"
    (( n == BLOCKS )) || fail "footer: N=$n, mas há $BLOCKS blocos"
fi

(( FAILS == 0 ))
