type SelectorValuesType = Record<string, RegExp | SelectorBasedType | string> | RegExp | string;

interface SelectorBasedType extends Record<string, SelectorValuesType> {
}

export type SelectorType = Record<number | string | symbol, SelectorValuesType>;
