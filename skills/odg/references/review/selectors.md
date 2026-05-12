# Review Selector

## Example selector

```typescript
export const exampleSelector = {
  btn: "input[name='q']",  // ✅ Correct one occurrence of the selector
  input: "input",  // ❌ Generic
  btn: ".btn",  // ❌ Ambiguous
  invalid: "button >> timeout=30000", // ❌ Timeout in Page/Handler
  dynamic: `.button-${Math.random()}`, // ❌ Dynamic use new Str().unicorn()
  user: userIsLoggedIn ? "logout-btn" : "login-btn", // ❌ Conditional not allowed here
  cascade: "div > div > div > button", // ❌ Unstable/fragile
};
```

## Export Example

```typescript
export const googleSearchSelector = { ... }; // ✅ Correct
export googleSearchSelector; // ⚠️ Prefer export const ...
```
