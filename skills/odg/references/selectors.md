# Selectors

Selectors live in `src/Selectors/` as typed constants.

## Rules

- Developers **MUST NOT** write inline CSS, XPath, or regex inside Pages or Handlers.
- Planning selectors **MUST** be treated as placeholders until the real page is inspected.
- Selectors **MUST** be grouped by semantic meaning: `inputs`, `buttons`, `states`, `alerts`, `elements`, `requests`, etc.
- If using a selector from another page, reference via `this.$$s`; if from the current page's own selector, use `this.$s`.
- Every selector used **MUST** be accessed exclusively through `this.$s` or `this.$$s`.
- If one behavior accepts more than one equivalent selector, prefer composing them from the typed selector map instead of hardcoding a new selector string locally.
- **MUST NOT** import Pages or Handlers in Selectors files.
- **MUST**: Ensure DOM selectors target a unique occurrence to satisfy framework strict mode requirements, **WHEN**: Selectors intended for list iterations or multi-element interactions is allowed to target multiple occurrences.

## Naming Conventions

| Element | Name Convention | Description |
| --------- | --------- | --------- |
| Object | {{camelCase}} + `Selector` | `exampleSelector`, `loginSelector` |
| Type | {{PascalCase}} + `Selector` + `Type` | `ExampleSelectorType`, `LoginSelectorType` |
| File | {{PascalCase}}Selector.ts | `ExampleSelector.ts`, `LoginSelector.ts` |

## How to Create a Selector

- If you creating a page with selector, prefer use `yarn odg make:page PageName --selectors`
to create both page and selector together.

```bash
yarn odg make:selector <selectorName>
# or
yarn odg make:selector --help
```

## Code Review

**WHEN** you are reviewing selector files, see the reference [review/selectors.md](./review/selectors.md).
