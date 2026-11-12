/* eslint-disable jsdoc/type-formatting -- Conflict rules */
import { InvalidArgumentException } from "#exceptions";

import type { CloneableInterface } from "../Interfaces/index.ts";

/**
 * Arr Class Helper
 *
 * @template {unknown[]} Type - The array type. Use `Type[number]` to reference the element type.
 * @class Arr
 * @implements {CloneableInterface}
 */
export class Arr<Type extends unknown[]> implements CloneableInterface {

    /** How many values one `Uint32Array` sample can take: 2^32. */
    private static readonly sampleRange = 4_294_967_296;

    public constructor(
        private readonly subject: Type,
    ) {
    }

    public clone(): Arr<Array<Type[number]>> {
        return new Arr([ ...this.subject ]);
    }

    /**
     * Returns random element(s) from the array.
     *
     * @param {number} length The number of elements to return.
     * @throws {InvalidArgumentException} If length is invalid or exceeds array length.
     * @returns {Array<Type[number]>} Return undefined if array is empty
     */
    public random(length: number = 1): Array<Type[number]> {
        if (this.subject.length === 0) {
            throw new InvalidArgumentException(
                "Cannot get random element(s) from an empty array",
            );
        }

        if (Number.isNaN(length) || length < 1 || length > this.subject.length) {
            throw new InvalidArgumentException(
                `Argument #1 (length) must be between 1 and ${this.subject.length}`,
            );
        }

        const indices = Array.from({ length: this.subject.length }, (_unused, index) => index);

        for (let index = indices.length - 1; index > indices.length - length - 1; index--) {
            const randomIndex = this.randomBelow(index + 1);

            [ indices[randomIndex], indices[index] ] = [ indices[index], indices[randomIndex] ];
        }

        return indices.slice(-length).map((index) => this.subject[index]);
    }

    /**
     * Get Array Class Properties
     *
     * @memberof Arr
     * @returns {Type}
     */
    public toArray(): Type {
        return this.subject;
    }

    /**
     * A uniform random integer in `[0, limit)`, drawn from the Web Crypto API so the class runs
     * wherever the global `crypto` exists (Node, Bun, browsers, React Native with a polyfill). A
     * sample at or above the last whole multiple of `limit` is drawn again: folding it with `%`
     * would favour the low values.
     *
     * @param {number} limit Exclusive upper bound, at least 1
     * @returns {number}
     */
    private randomBelow(limit: number): number {
        const unbiasedCeiling = Arr.sampleRange - Arr.sampleRange % limit;
        const [ sample ] = crypto.getRandomValues(new Uint32Array(1));

        return sample < unbiasedCeiling ? sample % limit : this.randomBelow(limit);
    }

}
