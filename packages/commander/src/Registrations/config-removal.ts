import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ignoredFolders = new Set([
    ".git",
    ".review",
    ".vitest",
    "cache",
    "coverage",
    "dist",
    "node_modules",
    "out",
]);

const scannedFile = /(?:\.(?:cjs|cts|json|md|mjs|mts|toml|ts|tsx|yaml|yml)|\.env[\w.]*)$/u;
const wordCharacter = /\w/u;
const exportPrefix = /^export\s+/u;

async function listFiles(folder: string): Promise<string[]> {
    const entries = await readdir(folder, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
        if (entry.isDirectory()) {
            return ignoredFolders.has(entry.name) ? [] : listFiles(join(folder, entry.name));
        }

        return scannedFile.test(entry.name) ? [ join(folder, entry.name) ] : [];
    }));

    return nested.flat();
}

function isBlank(line: string | undefined): boolean {
    return (line ?? "").trim() === "";
}

function isDeclarationOf(line: string, key: string): boolean {
    const declaration = line.trim().replace(exportPrefix, "");

    return declaration.startsWith(key) && declaration.slice(key.length).trimStart().startsWith("=");
}

/*
 * First line of what goes with the variable at `index`: the `#` block above it, only when nothing
 * but a blank line (or the end of the file) follows, since then it describes this key alone. When
 * another variable follows, the block is the header of a group and stays.
 */
function blockStart(lines: string[], index: number): number {
    let start = index;

    while (isBlank(lines.at(index + 1)) && start > 0 && lines[start - 1].startsWith("#")) {
        start -= 1;
    }

    return start;
}

export interface FoundLineInterface {

    /** Path relative to the scanned root. */
    file: string;
    line: number;
    text: string;
}

// Whether `word` is in `text` as a whole word: `DB_HOST` is not in `DB_HOST_REPLICA`.
export function hasWord(text: string, word: string): boolean {
    let index = text.indexOf(word);

    while (index !== -1) {
        if (!wordCharacter.test(text.charAt(index - 1)) && !wordCharacter.test(text.charAt(index + word.length))) {
            return true;
        }

        index = text.indexOf(word, index + 1);
    }

    return false;
}

/*
 * Lines of the project that match, so a removal can say what still reads or mentions a key. Build
 * output and dependencies are not looked at, nor the files in `skip`, the ones the caller edits.
 */
export async function findProjectLines(parameters: {
    root: string;
    skip: string[];
    matches(text: string): boolean;
}): Promise<FoundLineInterface[]> {
    const root = resolve(parameters.root);
    const skipped = new Set(parameters.skip.map((path) => resolve(path)));
    const files = await listFiles(root);
    const contents = await Promise.all(files
        .filter((file) => !skipped.has(file))
        .map(async (file) => ({ file: relative(root, file), text: await readFile(file, "utf8") })));

    return contents.flatMap(({ file, text }) => text.split("\n").flatMap((line, index) => parameters.matches(line)
        ? [ { file, line: index + 1, text: line.trim() } ]
        : []));
}

/*
 * Removes `KEY=...` (or `export KEY = ...`) from a dotenv file, with the comment that is only about
 * it (see `blockStart`), and the blank line that separated the removed block. A missing file or
 * variable is a no-op.
 */
export async function didRemoveEnvironmentVariable(parameters: {
    filePath: string;
    key: string;
}): Promise<boolean> {
    const text = await readFile(parameters.filePath, "utf8").catch(() => "");
    const lines = text.split("\n");
    const index = lines.findIndex((line) => isDeclarationOf(line, parameters.key));

    if (index === -1) {
        return false;
    }

    const start = blockStart(lines, index);

    lines.splice(start, index - start + 1);

    if (isBlank(lines.at(start)) && (start === 0 || isBlank(lines[start - 1]))) {
        lines.splice(Math.max(start - 1, 0), 1);
    }

    await writeFile(parameters.filePath, lines.join("\n"), "utf8");

    return true;
}
