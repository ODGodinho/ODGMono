import { InvalidArgumentException } from "@odg/exception";
import {
    type EnumDeclaration,
    type ImportDeclaration,
    type InterfaceDeclaration,
    Node,
    type ObjectLiteralExpression,
    Project,
    QuoteKind,
    ScriptKind,
    type SourceFile,
    SyntaxKind,
} from "ts-morph";

import type { BarrelLineInterface } from "./types.ts";

function createProject(): Project {
    return new Project({
        manipulationSettings: {
            quoteKind: QuoteKind.Double,
            useTrailingCommas: true,
        },
        skipAddingFilesFromTsConfig: true,
    });
}

function addSourceFile(project: Project, filePath: string): SourceFile {
    return project.addSourceFileAtPathIfExists(filePath)
        ?? project.createSourceFile(filePath, "", { scriptKind: ScriptKind.TS, overwrite: false });
}

/**
 * Collapses duplicate commas that ts-morph can emit when appending enum members
 * (e.g. after trailing commas and section comments).
 *
 * @param {string} source Full source text
 * @returns {string} Source with adjacent duplicate commas normalized
 */
function collapseAdjacentDuplicateCommas(source: string): string {
    let result = source;
    let previous = "";

    while (result !== previous) {
        previous = result;
        result = result.replaceAll(/,\s*,/g, ",");
    }

    return result;
}

function didAppendNamedImport(importDeclaration: ImportDeclaration, name: string): boolean {
    const hasNamed = importDeclaration.getNamedImports().some((named) => named.getName() === name);

    if (hasNamed) {
        return false;
    }

    importDeclaration.addNamedImport({ name });

    return true;
}

function didMutateNamedImport(
    sourceFile: SourceFile,
    moduleSpecifier: string,
    name: string,
    isTypeOnly: boolean,
): boolean {
    const importDeclaration = sourceFile.getImportDeclarations().find(
        (declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier
            && declaration.isTypeOnly() === isTypeOnly,
    );

    if (importDeclaration) {
        return didAppendNamedImport(importDeclaration, name);
    }

    sourceFile.addImportDeclaration({
        isTypeOnly,
        namedImports: [ { name } ],
        moduleSpecifier,
    });

    return true;
}

async function didCommitNamedImport(parameters: {
    filePath: string;
    moduleSpecifier: string;
    name: string;
}, isTypeOnly: boolean): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.filePath);

    if (!didMutateNamedImport(sourceFile, parameters.moduleSpecifier, parameters.name, isTypeOnly)) {
        return false;
    }

    await sourceFile.save();

    return true;
}

function resolveZodObjectLiteral(
    parameters: {
        filePath: string;
        constName: string;
    },
    sourceFile: SourceFile,
): ObjectLiteralExpression {
    const variableDeclaration = sourceFile
        .getVariableDeclarations()
        .find((declaration) => declaration.getName() === parameters.constName);

    if (!variableDeclaration) {
        throw new InvalidArgumentException(`Const "${parameters.constName}" not found in ${parameters.filePath}`);
    }

    const initializer = variableDeclaration.getInitializer();

    if (!initializer || !Node.isCallExpression(initializer)) {
        throw new InvalidArgumentException(`"${parameters.constName}" initializer is not a call expression`);
    }

    const [ firstArgument ] = initializer.getArguments();

    if (!Node.isObjectLiteralExpression(firstArgument)) {
        throw new InvalidArgumentException(`"${parameters.constName}" first argument is not an object literal`);
    }

    return firstArgument;
}

function isLineComment(member: Node): boolean {
    return member.getKind() === SyntaxKind.SingleLineCommentTrivia;
}

/**
 * Inserts `line` after the last member of the `// <section>` block (the member right before the
 * next comment, or the last one), with its indentation. Text, not ts-morph `insertMember`: that one
 * counts comments in its index and drops the blank line before the next section comment.
 *
 * @param {SourceFile} sourceFile File being edited
 * @param {Node[]} members Members of the declaration, comments included
 * @param {string | undefined} section Section name, as in `// Services`
 * @param {string} line Line to insert, without indentation
 * @returns {boolean} Whether it was inserted; `false` when there is no such section
 */
function didInsertInSection(
    sourceFile: SourceFile,
    members: Node[],
    section: string | undefined,
    line: string,
): boolean {
    const start = members.findIndex((member) => isLineComment(member) && member.getText().trim() === `// ${section}`);

    if (section === undefined || start === -1) {
        return false;
    }

    const next = members.findIndex((member, index) => index > start && isLineComment(member));
    const anchor = members[(next === -1 ? members.length : next) - 1];
    const text = sourceFile.getFullText();
    const lineEnd = text.indexOf("\n", anchor.getEnd());
    const indent = text.slice(text.lastIndexOf("\n", anchor.getStart()) + 1, anchor.getStart());

    sourceFile.replaceWithText(`${text.slice(0, lineEnd)}\n${indent}${line}${text.slice(lineEnd)}`);

    return true;
}

function addEnumMember(
    sourceFile: SourceFile,
    enumDeclaration: EnumDeclaration,
    member: { name: string; initializer: string },
    section: string | undefined,
): void {
    const line = `${member.name} = ${member.initializer},`;

    if (!didInsertInSection(sourceFile, enumDeclaration.getMembersWithComments(), section, line)) {
        enumDeclaration.addMember(member);
    }
}

function addInterfaceProperty(
    sourceFile: SourceFile,
    iface: InterfaceDeclaration,
    property: { name: string; type: string },
    section: string | undefined,
): void {
    const line = `${property.name}: ${property.type};`;

    if (!didInsertInSection(sourceFile, iface.getMembersWithComments(), section, line)) {
        iface.addProperty({ ...property, hasQuestionToken: false });
    }
}

function hasObjectPropertyByNamePrefix(
    objectLiteral: ObjectLiteralExpression,
    propertyName: string,
): boolean {
    return objectLiteral.getProperties().some((property) => property.getText().startsWith(propertyName));
}

export async function didEnsureEnumMember(parameters: {
    filePath: string;
    enumName: string;
    memberName: string;
    memberValue?: string;

    /** Appends inside `// <section>` instead of at the end; falls back to the end when it is missing. */
    section?: string;
}): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.filePath);

    const enumDeclaration = sourceFile.getEnum(parameters.enumName);

    if (!enumDeclaration) {
        throw new InvalidArgumentException(`Enum "${parameters.enumName}" not found in ${parameters.filePath}`);
    }

    const hasMember = enumDeclaration.getMembers().some((member) => {
        const memberName = member.getName().replaceAll("\"", "");

        return memberName === parameters.memberName;
    });

    if (hasMember) {
        return false;
    }

    addEnumMember(sourceFile, enumDeclaration, {
        name: `"${parameters.memberName}"`,
        initializer: `"${parameters.memberValue ?? parameters.memberName}"`,
    }, parameters.section);

    sourceFile.replaceWithText(collapseAdjacentDuplicateCommas(sourceFile.getFullText()));
    await sourceFile.save();

    return true;
}

export async function didEnsureBarrelExport(parameters: {
    barrelPath: string;
    relativeExportPath: string;
}): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.barrelPath);

    const normalized = parameters.relativeExportPath.startsWith("./")
        ? parameters.relativeExportPath
        : `./${parameters.relativeExportPath}`;

    const hasExport = sourceFile.getExportDeclarations()
        .some((declaration) => declaration.getModuleSpecifierValue() === normalized);

    if (hasExport) {
        return false;
    }

    sourceFile.addExportDeclaration({
        moduleSpecifier: normalized,
        isTypeOnly: false,
    });

    await sourceFile.save();

    return true;
}

export async function didEnsureTopLevelStatements(parameters: {
    filePath: string;
    statements: string[];
}): Promise<boolean> {
    if (parameters.statements.length === 0) {
        return false;
    }

    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.filePath);

    const text = sourceFile.getFullText();
    const toAdd = parameters.statements.filter((statement) => !text.includes(statement));

    if (toAdd.length === 0) {
        return false;
    }

    sourceFile.insertStatements(0, `${toAdd.join("\n")}\n`);
    await sourceFile.save();

    return true;
}

export async function didEnsureInterfaceProperty(parameters: {
    filePath: string;
    interfaceName: string;
    propertyName: string;
    propertyType: string;

    /** Appends inside `// <section>` instead of at the end; falls back to the end when it is missing. */
    section?: string;
}): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.filePath);

    const iface = sourceFile.getInterface(parameters.interfaceName);

    if (!iface) {
        throw new InvalidArgumentException(`Interface "${parameters.interfaceName}" not found in ${parameters.filePath}`);
    }

    const hasProperties = iface.getProperties().some((property) => property.getName() === parameters.propertyName);

    if (hasProperties) {
        return false;
    }

    addInterfaceProperty(sourceFile, iface, {
        name: parameters.propertyName,
        type: parameters.propertyType,
    }, parameters.section);

    await sourceFile.save();

    return true;
}

/**
 * Ensures `line` exists in the barrel, separated from the previous export by a blank line — the
 * style of an ODG API barrel (`export * from "./X.js";`, `export * as x from "./x.js";`,
 * `export type * from "./X.js";`). Creates the barrel when missing.
 *
 * @param {BarrelLineInterface} parameters Barrel path and the exact line
 * @returns {Promise<boolean>} Whether the line was added
 */
export async function didEnsureBarrelLine(parameters: BarrelLineInterface): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.barrelPath);
    const existing = sourceFile.getFullText().trimEnd();

    if (existing.split("\n").some((line) => line.trim() === parameters.line)) {
        return false;
    }

    sourceFile.replaceWithText(existing.length === 0 ? `${parameters.line}\n` : `${existing}\n\n${parameters.line}\n`);
    await sourceFile.save();

    return true;
}

export async function didEnsureEnvironmentExampleLines(parameters: {
    filePath: string;
    lines: string[];
}): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.filePath);

    /**
     * This file can be non-TS; we treat it as raw text but keep a single write path.
     */
    const existing = sourceFile.getFullText();
    const missing = parameters.lines.filter((line) => !existing.includes(line));

    if (missing.length === 0) {
        return false;
    }

    const insertNewline = existing.endsWith("\n") || existing.length === 0 ? "" : "\n";

    sourceFile.replaceWithText(`${existing}${insertNewline}${missing.join("\n")}\n`);
    await sourceFile.save();

    return true;
}

export async function didEnsureZodObjectEntry(parameters: {
    filePath: string;
    constName: string;
    propertyName: string;
    propertyValue: string;
}): Promise<boolean> {
    const project = createProject();
    const sourceFile = addSourceFile(project, parameters.filePath);

    const zodObjectLiteral = resolveZodObjectLiteral(parameters, sourceFile);

    if (hasObjectPropertyByNamePrefix(zodObjectLiteral, parameters.propertyName)) {
        return false;
    }

    zodObjectLiteral.addPropertyAssignment({
        name: parameters.propertyName,
        initializer: parameters.propertyValue,
    });

    await sourceFile.save();

    return true;
}

export async function didEnsureTypeNamedImport(parameters: {
    filePath: string;
    moduleSpecifier: string;
    name: string;
}): Promise<boolean> {
    return didCommitNamedImport(parameters, true);
}

export async function didEnsureValueNamedImport(parameters: {
    filePath: string;
    moduleSpecifier: string;
    name: string;
}): Promise<boolean> {
    return didCommitNamedImport(parameters, false);
}
