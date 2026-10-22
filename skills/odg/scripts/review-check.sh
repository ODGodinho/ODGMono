#!/usr/bin/env bash
# review-check.sh [--apply] < saida-da-revisao.md
#
# Valida a seção "GitLab Comments" contra o formato de references/review.md.
# Imprime uma linha por reprovação e sai 1; sem reprovação, sai 0.
# Os nomes citáveis vêm, em tempo de execução, do checklist.md (negrito no
# início de um item de lista, sem o parêntese final) ou do .md que uma fonte da
# citação aponta: referência da skill, AGENTS.md ou doc de pacote (título, ou
# negrito no início de item ou parágrafo). Agent Found não aponta .md.
#
# --apply: com o formato aprovado, aplica cada bloco ```suggestion e cada bloco
# ```diff (💡 de vários arquivos) numa cópia temporária do working tree e roda o eslint e o tsc do projeto nela, uma vez
# para todos os achados. Imprime só o que os 💡 introduzem (diferença contra a
# mesma cópia antes de aplicar). O working tree, o índice e as refs não mudam.
set -uo pipefail

APPLY=0
case "${1:-}" in
    --apply) APPLY=1 ;;
    "") ;;
    *)
        printf 'uso: review-check.sh [--apply] < output.md\n' >&2
        exit 2
        ;;
esac

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2> /dev/null || pwd)"
CHECKLIST="$SKILL_ROOT/references/review/checklist.md"
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

# Nomes que um .md dá às suas regras: títulos, e negritos no início de item ou parágrafo.
rule_names() {
    sed -nE 's/^#+[[:space:]]+//p; s/^[[:space:]]*(- |[0-9]+\. )?\*\*([^*]+)\*\*.*/\2/p' "$1" \
        | sed -E 's/[`*]//g; s/[[:space:]]+\([^)]*\)$//; s/[.:][[:space:]]*$//'
}

# Arquivo .md que uma fonte aponta: referência da skill (pelo caminho dentro de
# references/ ou só pelo nome) ou documento do projeto, a partir da raiz do repositório.
cited_doc() {
    local file="$1" rest found
    [[ "$file" == *.md ]] || return 1
    rest="${file#\$\$SKILL_DIR/}"
    rest="${rest#references/}"
    if [[ -f "$SKILL_ROOT/references/$rest" ]]; then
        printf '%s' "$SKILL_ROOT/references/$rest"
        return 0
    fi
    if [[ "$rest" != */* ]]; then
        found="$(find "$SKILL_ROOT/references" -type f -name "$rest" | awk 'NR == 1')"
        if [[ -n "$found" ]]; then
            printf '%s' "$found"
            return 0
        fi
    fi
    [[ -f "$PROJECT_ROOT/$file" ]] || return 1
    printf '%s' "$PROJECT_ROOT/$file"
}

check_citation() {
    local where="$1" cite="$2"
    local name key rest src doc names docs=""
    local -a sources=()

    name="$(trim "${cite%%|*}")"
    rest=""
    [[ "$cite" == *"|"* ]] && rest="${cite#*|}"
    IFS='|' read -ra sources <<< "$rest"
    for src in "${sources[@]+"${sources[@]}"}"; do
        src="$(trim "$src")"
        [[ "$src" =~ ^([^[:space:]]+):[0-9]+(-[0-9]+)?$ ]] || continue
        doc="$(cited_doc "${BASH_REMATCH[1]}")" && docs+="$doc"$'\n'
    done

    if [[ "$name" == "Agent Found" ]]; then
        [[ -z "$docs" ]] && return
        fail "$where: Agent Found aponta uma regra escrita num .md; cite pelo nome dela (título ou negrito)"
        return
    fi
    grep -Fxq -- "$name" <<< "$NAMES" && return
    key="$(sed -E 's/[.:][[:space:]]*$//' <<< "$name")"
    while IFS= read -r doc; do
        [[ -n "$doc" ]] || continue
        names="$(rule_names "$doc")"
        grep -Fxq -- "$key" <<< "$names" && return
    done <<< "$docs"
    fail "$where: \"$name\" não é item do checklist.md, título ou negrito do .md da fonte, nem Agent Found"
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

# Monta em $1/tree a árvore que a revisão viu (working tree, sem tocá-lo) e roda
# a checagem dos blocos ```suggestion e ```diff nela.
apply_suggestions() {
    local tmp="$1" root snap

    if ! root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
        printf 'review-check: --apply fora de um repositório git; 💡 não validados\n' >&2
        return 0
    fi
    if ! command -v node > /dev/null \
        || [[ ! -e "$root/node_modules/.bin/eslint" && ! -e "$root/node_modules/.bin/tsc" ]]; then
        printf 'review-check: --apply sem node ou sem node_modules/.bin (eslint, tsc); 💡 não validados\n' >&2
        return 0
    fi

    mkdir -p "$tmp/tree"
    printf '%s\n' "$SECTION" > "$tmp/section.md"

    # `stash create` grava um commit solto com o working tree; não muda refs, índice nem arquivos.
    snap="$(git -C "$root" stash create 2> /dev/null)"
    if ! git -C "$root" archive "${snap:-HEAD}" | tar -x -C "$tmp/tree"; then
        printf 'review-check: não foi possível copiar a árvore revisada; 💡 não validados\n' >&2
        return 0
    fi
    (cd "$root" && git ls-files --others --exclude-standard -z) | while IFS= read -r -d '' file; do
        mkdir -p "$tmp/tree/$(dirname "$file")"
        cp -p "$root/$file" "$tmp/tree/$file"
    done
    (cd "$root" && find . -name node_modules -type d -prune) | while IFS= read -r modules; do
        mkdir -p "$tmp/tree/$(dirname "${modules#./}")"
        ln -s "$root/${modules#./}" "$tmp/tree/${modules#./}"
    done

    node - "$tmp" << 'JS'
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const tmp = process.argv[2];
const tree = fs.realpathSync(path.join(tmp, "tree"));
const section = fs.readFileSync(path.join(tmp, "section.md"), "utf8").split("\n");
const problems = [];

/* 1. Each ```suggestion and ```diff block, with the `path:LINE` anchor of the finding that holds it. */
const suggestions = [];
const patches = [];
let anchor = null;
for (let index = 0; index < section.length; index += 1) {
    const head = /^- `([^`:]+):(\d+)/.exec(section[index]);
    if (head) {
        anchor = { file: head[1], line: Number(head[2]) };
        continue;
    }
    const open = /^(\s*)```(?:suggestion(?::-(\d+)\+(\d+))?|(diff))\s*$/.exec(section[index]);
    if (!open || !anchor) continue;
    const body = [];
    let end = index + 1;
    while (end < section.length && !/^\s*```\s*$/.test(section[end])) {
        const lead = section[end].search(/\S|$/);
        body.push(section[end].slice(Math.min(open[1].length, lead)));
        end += 1;
    }
    const where = `${anchor.file}:${anchor.line}`;
    if (open[4]) {
        patches.push({ where, body });
    } else {
        suggestions.push({
            ...anchor,
            where,
            from: anchor.line - Number(open[2] ?? 0),
            to: anchor.line + Number(open[3] ?? 0),
            body,
        });
    }
    index = end;
}
if (suggestions.length === 0 && patches.length === 0) process.exit(0);

/* A ```diff block holds one section per file (`--- a/x` + `+++ b/x`). Each section is applied on its
   own: `git apply --recount` would read the next file's `---` header as a removed line. A 💡 often
   brings no context after the change; `--unidiff-zero` stops git from anchoring such a hunk at EOF. */
const fileSections = (body) => {
    const lines = [...body];
    while (lines.length > 0 && lines.at(-1).trim() === "") lines.pop();
    const sections = [];
    lines.forEach((line, index) => {
        if (/^--- /.test(line) && /^\+\+\+ /.test(lines[index + 1] ?? "")) {
            const source = line.slice(4).trim();
            const target = lines[index + 1].slice(4).trim();
            const removed = target === "/dev/null";
            sections.push({ file: (removed ? source : target).replace(/^[ab]\//, ""), removed, lines: [] });
        }
        sections.at(-1)?.lines.push(line === "" ? " " : line);
    });

    return sections;
};

/* 2. Validate anchors and overlaps; keep what can be applied. */
const byFile = new Map();
for (const item of suggestions) {
    const full = path.join(tree, item.file);
    if (!fs.existsSync(full)) {
        problems.push(`💡 \`${item.where}\` — o arquivo não existe na árvore revisada`);
        continue;
    }
    const text = fs.readFileSync(full, "utf8");
    const length = text === "" ? 0 : text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
    if (item.from < 1 || item.to > length) {
        const range = `${item.from}-${item.to}`;
        problems.push(`💡 \`${item.where}\` — o bloco cobre as linhas ${range}, fora do arquivo (${length} linhas)`);
        continue;
    }
    if (!byFile.has(item.file)) byFile.set(item.file, []);
    byFile.get(item.file).push(item);
}
for (const [file, list] of byFile) {
    list.sort((a, b) => a.from - b.from);
    const kept = [];
    for (const item of list) {
        const previous = kept.at(-1);
        if (previous && item.from <= previous.to) {
            problems.push(`💡 \`${item.where}\` — sobrepõe o 💡 de \`${previous.where}\`; um bloco por trecho`);
            continue;
        }
        kept.push(item);
    }
    byFile.set(file, kept);
}
for (const patch of patches) {
    patch.sections = fileSections(patch.body);
    if (patch.sections.length > 0) continue;
    problems.push(`💡 \`${patch.where}\` — bloco diff sem cabeçalho \`--- a/arquivo\` e \`+++ b/arquivo\``);
}
const patchedFiles = patches.flatMap((patch) => patch.sections
    .filter((part) => !part.removed)
    .map((part) => part.file));
const files = [...new Set([...byFile.keys(), ...patchedFiles])];
const existing = () => files.filter((file) => fs.existsSync(path.join(tree, file)));

const bin = (name) => {
    const file = path.join(tree, "node_modules", ".bin", name);
    return fs.existsSync(file) ? file : null;
};
const run = (command, args) => {
    try {
        const options = { cwd: tree, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] };

        return { out: execFileSync(command, args, options), failed: false };
    } catch (error) {
        const detail = String(error.stderr ?? error.message).split("\n")[0];

        return { out: String(error.stdout ?? ""), failed: !error.stdout, detail };
    }
};
const eslint = bin("eslint");
const touchesTypeScript = files.some((file) => /\.[cm]?tsx?$/.test(file));
const tsc = fs.existsSync(path.join(tree, "tsconfig.json")) && touchesTypeScript ? bin("tsc") : null;

const lint = () => {
    const targets = existing();
    if (!eslint || targets.length === 0) return [];
    const result = run(eslint, ["--no-warn-ignored", "--format", "json", ...targets]);
    try {
        return JSON.parse(result.out).flatMap((entry) => entry.messages.map((message) => ({
            file: path.relative(tree, entry.filePath),
            line: message.line ?? 0,
            key: `eslint ${message.ruleId ?? "parse"}: ${message.message}`,
        })));
    } catch {
        const reason = result.detail ?? "saída inválida";
        problems.push(`review-check: o eslint não rodou (${reason}); 💡 sem checagem de lint`);
        return null;
    }
};
const typecheck = () => {
    if (!tsc) return [];
    const result = run(tsc, ["--noEmit", "--pretty", "false", "-p", "tsconfig.json"]);
    return result.out.split("\n").flatMap((text) => {
        const match = /^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/.exec(text);
        if (!match) return [];

        return [{ file: path.normalize(match[1]), line: Number(match[2]), key: `tsc ${match[3]}: ${match[4]}` }];
    });
};

/* 3. Baseline, apply bottom-up, measure again. */
const lintBefore = lint();
const tscBefore = typecheck();
const spans = [];
for (const [file, list] of byFile) {
    const full = path.join(tree, file);
    const lines = fs.readFileSync(full, "utf8").split("\n");
    let shift = 0;
    for (const item of list) {
        const removed = item.to - item.from + 1;
        const from = item.from + shift;
        spans.push({ file, from, to: from + Math.max(item.body.length, 1) - 1, where: item.where });
        shift += item.body.length - removed;
    }
    for (const item of [...list].reverse()) lines.splice(item.from - 1, item.to - item.from + 1, ...item.body);
    fs.writeFileSync(full, lines.join("\n"));
}
const owners = [];
for (const patch of patches) {
    for (const part of patch.sections) {
        const input = `${part.lines.join("\n")}\n`;
        const options = { cwd: tree, input, encoding: "utf8" };
        const result = spawnSync("git", ["apply", "--recount", "--unidiff-zero", "--whitespace=nowarn", "-"], options);
        if (result.status === 0) {
            owners.push({ file: part.file, where: patch.where });
            continue;
        }
        const detail = String(result.stderr || result.error?.message || "").trim().split("\n")[0];
        problems.push(`💡 \`${patch.where}\` — o diff não aplica em \`${part.file}\` (${detail})`);
    }
}
const lintAfter = lint();
const tscAfter = typecheck();

/* 4. Report only what the 💡 introduced: after minus before, per file and message. */
const introduced = (before, after) => {
    if (before === null || after === null) return [];
    const count = new Map();
    for (const item of before) count.set(`${item.file}|${item.key}`, (count.get(`${item.file}|${item.key}`) ?? 0) + 1);
    return after.filter((item) => {
        const key = `${item.file}|${item.key}`;
        const left = count.get(key) ?? 0;
        if (left > 0) {
            count.set(key, left - 1);
            return false;
        }
        return true;
    });
};
for (const item of [...introduced(lintBefore, lintAfter), ...introduced(tscBefore, tscAfter)]) {
    const sameFile = (candidate) => candidate.file === item.file;
    const inSpan = (candidate) => sameFile(candidate) && item.line >= candidate.from && item.line <= candidate.to;
    const span = spans.find(inSpan)
        ?? owners.find(sameFile)
        ?? spans.find(sameFile);
    const where = span ? span.where : item.file;
    problems.push(`💡 \`${where}\` — ${item.key} (linha ${item.line} depois de aplicar)`);
}

for (const problem of problems) console.log(problem);
process.exit(problems.length > 0 ? 1 : 0);
JS
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

(( FAILS == 0 )) || exit 1
(( APPLY == 1 )) || exit 0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
apply_suggestions "$TMP_DIR"
