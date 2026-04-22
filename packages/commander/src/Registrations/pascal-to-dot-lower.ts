/**
 * Converts a PascalCase identifier to dot-separated lowercase segments.
 *
 * @param {string} identifier PascalCase class or symbol name (e.g. ExampleEventListener)
 * @returns {string} Dot-separated lowercase (e.g. example.event.listener)
 */
export function pascalCaseToDotLower(identifier: string): string {
    return identifier
        .split(/(?=[A-Z])/)
        .filter((segment) => segment.length > 0)
        .map((segment) => segment.toLowerCase())
        .join(".");
}

/**
 * Resolves the ContainerName string value for any registration.
 *
 * @param {string | undefined} override Explicit value from registration targets, if any
 * @param {string} containerEnumMember Class name used as the ContainerName member
 * @returns {string} Value for the ContainerName enum entry
 */
export function resolveContainerEnumMemberValue(
    override: string | undefined,
    containerEnumMember: string,
): string {
    if (override !== undefined) {
        return override;
    }

    return pascalCaseToDotLower(containerEnumMember);
}
