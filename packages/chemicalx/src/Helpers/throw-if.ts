import type { Exception } from "@odg/exception";

export function throwIf(
    shouldThrow: true,
    exception: () => Exception,
): never;

export function throwIf(
    shouldThrow: false,
    exception: () => Exception,
): void;

export function throwIf(
    shouldThrow: boolean,
    exception: () => Exception,
): never | void;

/**
 * The throw_if function throws the given exception
 * if a given boolean expression evaluates to true:
 *
 * @param {boolean} shouldThrow sleep time in milliseconds
 * @param {() => Exception} exception sleep time in milliseconds
 * @throws {Exception} If given true in condition
 * @returns {never | void}
 */
export function throwIf(shouldThrow: boolean, exception: () => Exception): never | void {
    if (shouldThrow) {
        throw exception();
    }
}
