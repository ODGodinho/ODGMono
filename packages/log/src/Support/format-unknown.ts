/**
 * Readable placeholder for values `JSON.stringify` would otherwise silently
 * drop (functions, `undefined`, symbols) or throw on (`BigInt`).
 *
 * @param {unknown} value Value to describe
 * @returns {string | undefined} Placeholder, or `undefined` if `value` is JSON-safe as-is
 */
function describeNonJsonValue(value: unknown): string | undefined {
    if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
    if (typeof value === "bigint") return `${value}n`;
    if (typeof value === "symbol") return value.toString();
    if (typeof value === "undefined") return "[undefined]";

    return undefined;
}

/**
 * `JSON.stringify` replacer using {@link describeNonJsonValue}, so nested
 * occurrences are kept instead of silently lost from the output.
 *
 * @param {string} _key Property key, unused
 * @param {unknown} value Property value being serialized
 * @returns {unknown}
 */
function keepNonJsonValues(_key: string, value: unknown): unknown {
    return describeNonJsonValue(value) ?? value;
}

/**
 * Stringify an unknown value without depending on `node:util`, so this
 * package stays usable in non-Node runtimes (e.g. bundled for the browser).
 *
 * @param {unknown} value Value to stringify
 * @returns {string}
 */
export function formatUnknown(value: unknown): string {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack ?? value.message;

    const placeholder = describeNonJsonValue(value);

    if (placeholder !== undefined) return placeholder;

    try {
        return JSON.stringify(value, keepNonJsonValues);
    } catch {
        return String(value);
    }
}
