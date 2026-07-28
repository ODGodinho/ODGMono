# Debug — Runtime Workflow

Imperative playbook. When the user reports an execution failure or asks to debug the crawler, the agent **MUST** follow Phases 1 -> 3 in order. Each phase has an **Exit criterion** — do not advance until it is satisfied.

## Phase 1 — Boot playwright-cli browser (MUST)

1. Run `command -v playwright-cli`. If it is missing, stop and tell the user to install `playwright-cli`.

The script opens `playwright-cli` headed and prints the CDP WebSocket endpoint to stdout, after this not need to attach the browser.

```bash
export CLI_BROWSER_CONNECT_WS=$($$SKILL_DIR/scripts/debug-browser.sh $$SKILL_DIR/configs/playwright-cli.config.json)
# OR
source $$SKILL_DIR/scripts/debug-browser.sh
```

Validate the output:

- Must be non-empty and start with `ws://`.
- If empty, recovery: run lsof -i :9222 to check if the CDP port is already taken by a stale browser;
  - Copy `$$SKILL_DIR/configs/playwright-cli.config.json` to a temp file such as `/tmp/new-playwright-cli.config.json`, change the `cdpPort` field and the `--remote-debugging-port=` argument to a free port, then execute `export CLI_BROWSER_CONNECT_WS=$($$SKILL_DIR/scripts/debug-browser.sh /tmp/new-playwright-cli.config.json)`.

**Exit criterion:** `CLI_BROWSER_CONNECT_WS` is exported and looks like `ws://localhost:9222/devtools/browser/<uuid>`.

---

## Phase 2 — Run crawler in background (MUST)

Start attached to the shared browser **in the background** so logs can be read while the crawler runs:

```bash
BROWSER_CONNECT=$CLI_BROWSER_CONNECT_WS $$PM dev

# Or start playwright-cli commands if manual debugger
playwright-cli goto https://www.google.com
```

---

## Phase 3 — Inspect DOM via playwright-cli (MUST when Runtime/Selector)

The browser opened in Phase 1 is the **same** one the crawler is using. Invoke the `playwright-cli` skill to inspect the page the crawler is stuck on:

1. **MUST** capture a snapshot (DOM + screenshot) before suggesting any fix.
2. **MUST** verify the failing selector against the live DOM: does the element exist? Is it inside an iframe? Is the locator strategy wrong (text vs role vs CSS)?
3. **SHOULD** test 1-2 candidate replacement selectors in the live page before editing source.

The agent **MUST NOT** propose a selector fix without confirming that the candidate matches in the live DOM.

**Exit criterion:** root cause is identified at file and line level, for example `src/Selectors/LoginSelector.ts:14` — text "Entrar" replaced by "Login" upstream.

---

## Constraints reminder

- `$$SKILL_DIR/configs/playwright-cli.config.json` — shared, **MUST NOT** be edited in place; copy to a temp folder if a change is needed.
- All `$$SKILL_DIR` occurrences above **MUST** be expanded to the absolute skill directory before execution; see the Path convention in `SKILL.md`.
