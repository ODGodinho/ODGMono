#!/usr/bin/env bash
# check-skill.sh
#
# Confere a skill odg antes de um commit que a altere:
#   - todo ponteiro `[arquivo](caminho) → *Seção*` chega a um arquivo que tem a seção;
#   - todo link relativo aponta para um arquivo que existe;
#   - nenhum nome citável do review/checklist.md se repete (o review-check.sh depende disso).
# Ponteiros para docs de um pacote @odg/* deste monorepo são conferidos no código-fonte do
# pacote (packages/<pasta>).
# Imprime uma linha por problema e sai 1; sem problema, sai 0.
set -uo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(git -C "$SKILL_DIR" rev-parse --show-toplevel 2> /dev/null || true)"

node - "$SKILL_DIR" "$REPO_DIR" << 'JS'
const fs = require("node:fs");
const path = require("node:path");

const [skill, repo] = process.argv.slice(2);
const problems = [];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);

    return entry.name.endsWith(".md") ? [full] : [];
});
const plain = (text) => text.replace(/[`*\\]/g, "").trim()
    .replace(/\.$/, "")
    .toLowerCase();
const hasSection = (text, name) => {
    const wanted = plain(name);

    return text.split("\n").some((line) => {
        const bare = plain(line).replace(/^#+\s*/, "")
            .replace(/^-\s*/, "");
        if (bare.startsWith(wanted) || (/^\s*#/.test(line) && bare.includes(wanted))) return true;

        return [...line.matchAll(/\*\*([^*]+)\*\*/g)].some((match) => plain(match[1]).includes(wanted));
    });
};

/* Packages of this monorepo: npm name → folder. */
const packages = new Map();
if (repo && fs.existsSync(path.join(repo, "packages"))) {
    for (const dir of fs.readdirSync(path.join(repo, "packages"))) {
        const manifest = path.join(repo, "packages", dir, "package.json");
        if (fs.existsSync(manifest)) packages.set(JSON.parse(fs.readFileSync(manifest, "utf8")).name, dir);
    }
}

const POINTER = /\[[^\]]*\]\(([^)\s]+)\)((?:\s*→\s*\*[^*]+\*)+)/g;
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
for (const file of walk(skill)) {
    const where = path.relative(skill, file);
    fs.readFileSync(file, "utf8").split("\n")
        .forEach((line, index) => {
            const at = `${where}:${index + 1}`;
            for (const [, target] of line.matchAll(LINK)) {
                if (/^(https?:|#|\$\$|mailto:)/.test(target)) continue;
                const resolved = path.resolve(path.dirname(file), target.split("#")[0]);
                if (!fs.existsSync(resolved)) problems.push(`${at}: link para ${target}, que não existe`);
            }
            for (const [, target, chain] of line.matchAll(POINTER)) {
                const sections = [...chain.matchAll(/\*([^*]+)\*/g)].map((match) => match[1]);
                const external = /^\$\$PROJECT_ROOT\/node_modules\/(@[^/]+\/[^/]+)\/(.+)$/.exec(target);
                if (external) {
                    const [, name, relative] = external;
                    if (!packages.has(name)) continue;
                    const source = path.join(repo, "packages", packages.get(name), relative);
                    const sourceText = fs.existsSync(source) ? fs.readFileSync(source, "utf8") : null;
                    const missing = sections.filter((section) => !sourceText || !hasSection(sourceText, section));
                    const absent = missing.join("*, *");
                    if (missing.length > 0) problems.push(`${at}: ${name}/${relative} não tem *${absent}*`);
                    continue;
                }
                if (/^(https?:|\$\$)/.test(target)) continue;
                const resolved = path.resolve(path.dirname(file), target.split("#")[0]);
                if (!fs.existsSync(resolved)) continue;
                const text = fs.readFileSync(resolved, "utf8");
                const missing = sections.filter((section) => !hasSection(text, section));
                if (missing.length > 0) problems.push(`${at}: ${target} não tem *${missing.join("*, *")}*`);
            }
        });
}

const checklist = path.join(skill, "references", "review", "checklist.md");
const names = fs.readFileSync(checklist, "utf8").split("\n")
    .flatMap((line) => {
        const match = /^\s*- (?:\[ \] )?\*\*([^*]+)\*\*/.exec(line);

        return match ? [match[1].replace(/ \([^)]*\)$/, "")] : [];
    });
const seen = new Set();
for (const name of names) {
    if (seen.has(name)) problems.push(`review/checklist.md: o nome citável "${name}" aparece mais de uma vez`);
    seen.add(name);
}

for (const problem of problems) console.log(problem);
process.exit(problems.length > 0 ? 1 : 0);
JS
