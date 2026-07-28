import { rule as enumKeyValueConventionRule } from "./rules/enum-key-value-convention";
import { rule } from "./rules/no-inconsistent-docblock";

export const index = {
    root: true,
    rules: {
        "no-inconsistent-docblock": rule,
        "enum-key-value-convention": enumKeyValueConventionRule,
    },
};
