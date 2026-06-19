/**
 * Single source of truth para verbos válidos como prefixo de identificadores boolean.
 * Reusado em rules/typescript/naming-convention.mjs e rules/global/restrict-syntax.mjs.
 */
export const BOOLEAN_PREFIXES = [
    "is",
    "has",
    "can",
    "should",
    "will",
    "did",
    "does",
    "are",
    "do",
];

/** Joined com `|` — uso direto em regex alternation: `"is|has|can|..."`. */
export const BOOLEAN_PREFIXES_PIPE = BOOLEAN_PREFIXES.join("|");

/** Versão UPPER_CASE com underscore para constantes: `["IS_", "HAS_", ...]`. */
export const BOOLEAN_PREFIXES_UPPER = BOOLEAN_PREFIXES.map((prefix) => `${prefix.toUpperCase()}_`);

/** Joined com `|`, UPPER_CASE com underscore: `"IS_|HAS_|CAN_|..."` (mensagens). */
export const BOOLEAN_PREFIXES_UPPER_PIPE = BOOLEAN_PREFIXES_UPPER.join("|");

/** Joined com `|`, UPPER_CASE sem underscore: `"IS|HAS|CAN|..."` (root do regex). */
export const BOOLEAN_PREFIXES_UPPER_PIPE_NO_UNDERSCORE = BOOLEAN_PREFIXES
    .map((prefix) => prefix.toUpperCase())
    .join("|");
