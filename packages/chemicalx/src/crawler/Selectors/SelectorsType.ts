type SelectorValuesType = Record<string, RegExp | RegExp[] | SelectorBasedType | string> | RegExp | RegExp[] | string;

interface SelectorBasedType extends Record<string, SelectorValuesType> {
}

export type SelectorType = Record<number | string | symbol, SelectorValuesType>;
