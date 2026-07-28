/**
 * Key/value naming conventions for the ODG name-enum SSOTs
 * (skills/odg/references/architecture.md → Wiring contract, Container & Enums rules).
 * Enforced by `@odg/enum-key-value-convention` (packages/eslint-plugin), which reads this
 * as `{ [enumName]: { key, value } }` — an enum not listed here is not checked.
 *
 * - `ContainerName` — key mirrors the registered class name (PascalCase); value is the
 * dot.case transformation of the key (`SearchPage` → `search.page`). This is what
 * `ContainerName` dotted suffixes rely on to stay load-bearing for instance discovery.
 * - `EventName` / `ConfigName` — value is the key verbatim (MIRROR_KEY). `ConfigName` keys
 * are CONST_CASE because they mirror the `.env` variable name they read.
 */
export default {
    rules: {
        "@odg/enum-key-value-convention": [
            "error",
            {
                "ContainerName": { key: "PASCAL_CASE", value: "DOT_CASE" },
                "EventName": { key: "PASCAL_CASE", value: "MIRROR_KEY" },
                "ConfigName": { key: "CONST_CASE", value: "MIRROR_KEY" },
            },
        ],
    },
};
