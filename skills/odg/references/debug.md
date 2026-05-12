# Debug — Runtime Workflow

Imperative playbook. When the user reports an execution failure or asks to debug the crawler, the IA **MUST** follow Phases 0 → 3 in order. Each phase has an **Exit criterion** — do not advance until it is satisfied.

## Trigger

Run this workflow when **any** of the following is true:

- User says (pt or en): "rode o debug", "estou tendo erro na execução", "debug o crawler", "corrija o erro do crawler", "run debug", "crawler is failing", "fix the runtime error", "the crawler is stuck on X".
- Crawler raised a `TimeoutError`, `waitForSelector` failure, or `Cannot read properties of undefined (reading 'execute')` at runtime.
- Crawler is hanging on a page with no progress and no fatal error.
- Crawler is stuck in a retry loop on the same page.

**MUST NOT** use this workflow when the symptom is a `tsc` error only (no runtime) — read [diagnostics.md](./diagnostics.md) directly.

The IA **MUST** use the `playwright-cli` skill for all browser inspection commands during Phase 5.

---

## Phase 1 — Boot playwright-cli browser (MUST)

1. `command -v playwright-cli` — if missing, stop and tell the user to install `@odg/playwright-cli`.

Run the boot script. `$SKILL_DIR` **MUST** be expanded to the absolute skill directory per the "Path convention" in `SKILL.md` — **MUST NOT** be left literal. The script opens `playwright-cli` headed and prints the CDP WebSocket endpoint to stdout:

```bash
export CLI_BROWSER_CONNECT_WS=$($SKILL_DIR/scripts/debug-browser.sh $SKILL_DIR/configs/playwright-cli.config.json)
# OR
source $SKILL_DIR/scripts/debug-browser.sh
```

Validate the output:

- Must be non-empty and start with `ws://`.
- If empty, recovery: run `lsof -i :9222` to check if the CDP port is already taken by a stale browser;
  - COPY `$SKILL_DIR/configs/playwright-cli.config.json` to a temp file (e.g., `/tmp/new-playwright-cli.config.json`), change the `cdpPort` field and the `--remote-debugging-port=` arg to a free port, then execute `export CLI_BROWSER_CONNECT_WS=$($SKILL_DIR/scripts/debug-browser.sh /tmp/new-playwright-cli.config.json)`.

**MUST NOT** run `debug-browser.sh` twice in the same session without first closing the previous instance — port 9222 will stay bound and Phase 1 will fail silently.

**MUST NOT** touch `$SKILL_DIR/configs/playwright-cli.config.json` in place; copy to temp if you must alter viewport/headers.

**Exit criterion:** `CLI_BROWSER_CONNECT_WS` is exported and looks like `ws://localhost:9222/devtools/browser/<uuid>`.

---

## Phase 2 — Run crawler in background (MUST)

Start attached to the shared browser **in the background** so logs can be read while the crawler runs:

```bash
BROWSER_CONNECT=$CLI_BROWSER_CONNECT_WS yarn dev
```

---

## Phase 3 — Inspect DOM via playwright-cli (MUST when Runtime/Selector)

The browser opened in Phase 1 is the **same** one the crawler is using. Invoke the `playwright-cli` skill to inspect the page the crawler is stuck on:

1. **MUST** capture a snapshot (DOM + screenshot) before suggesting any fix.
2. **MUST** verify the failing selector against the live DOM: does the element exist? Is it inside an iframe? Is the locator strategy wrong (text vs role vs CSS)?
3. **SHOULD** test 1–2 candidate replacement selectors in the live page before editing source.

The IA **MUST NOT** propose a selector fix without confirming the candidate matches in the live DOM.

**Exit criterion:** root cause identified at file+line level (e.g., `src/Selectors/LoginSelector.ts:14 — text "Entrar" replaced by "Login" upstream`).

---

## Constraints reminder

- `$SKILL_DIR/scripts/debug-browser.sh` — do not modify; its contract is `export CLI_BROWSER_CONNECT_WS=$(...)` returning a `ws://` URL.
- `$SKILL_DIR/configs/playwright-cli.config.json` — shared, **MUST NOT** be edited in place; copy to temp folder if a change is needed.
- All `$SKILL_DIR` occurrences above **MUST** be expanded to the absolute skill directory before execution (see "Path convention" in `SKILL.md`).
