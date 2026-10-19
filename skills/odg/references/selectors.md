# Selectors

Selectors live in src/Selectors/ as typed constants.

## Rules

- Planning selectors **MUST** be treated as placeholders until the real page is inspected.
- Selectors **MUST** be grouped by semantic meaning, such as `inputs`, `buttons`, `states`, `alerts`, `elements`, and `requests`.
- A selector is read **only** through `this.$s` (the class's own Selector) or `this.$$s` (the barrel of every Selector) — never a CSS/XPath/regex string inline in a Page or Handler. `this.$$s` is not a license for a Page to inspect the next page ([pages.md](./pages.md) → *Pages MUST NOT*).
- A selector or request regex lives in the Selector of the screen/domain that owns it; when the last consumer moves to another screen, the entry moves with it in the same change.
- If one behavior accepts more than one equivalent selector, prefer composing them from the typed selector map instead of hardcoding a new selector string locally.
- **MUST** ensure DOM selectors target a unique occurrence to satisfy framework strict mode requirements. **WHEN** the selector is intentionally used for lists or multi-element interactions, multiple matches are allowed.

## How to Create a Selector

Page + selectors together: `$$PM odg make:page <Name> --selectors`. Selector alone:

```bash
$$PM odg make:selector <Name>
```

## Code Review

**WHEN** you are reviewing selector files, see the reference [review/selectors.md](./review/selectors.md).
