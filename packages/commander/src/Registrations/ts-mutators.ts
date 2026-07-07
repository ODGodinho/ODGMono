import { InvalidArgumentException } from "@odg/exception";
import {
    type ImportDeclaration,
    Node,
    type ObjectLiteralExpression,
    Project,
    QuoteKind,
    ScriptKind,
    type SourceFile,
} from "ts-morph";

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

    enumDeclaration.addMember({
        name: `"${parameters.memberName}"`,
        initializer: `"${parameters.memberValue ?? parameters.memberName}"`,
    });

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

    iface.addProperty({
        name: parameters.propertyName,
        type: parameters.propertyType,
        hasQuestionToken: false,
    });

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
