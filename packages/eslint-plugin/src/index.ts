import { rule as enumKeyValueConventionRule } from "./rules/enum-key-value-convention.ts";
import { rule } from "./rules/no-inconsistent-docblock.ts";

const plugin = {
    root: true,
    rules: {
        "no-inconsistent-docblock": rule,
        "enum-key-value-convention": enumKeyValueConventionRule,
    },
};

export default plugin;
