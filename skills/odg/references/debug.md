# Debug — Runtime Workflow

## Scope gate (read first)

| Enters here if… | Does **NOT** enter here if… |
| --- | --- |
| The failure only appears **while the crawler runs**: `TimeoutError`, `waitForSelector` fail, `Cannot read properties of undefined (reading 'execute')`, stuck page, retry loop, unexpected navigation | The failure comes from `tsc`, `eslint`, or the build — nothing ran yet → [diagnostics.md](./diagnostics.md) |
| The fix depends on what the **live DOM** actually contains | The error names a missing enum / interface / barrel entry (`Property 'X' does not exist on type 'ContainerInterface'`, `Cannot find module '@selectors'`) → [diagnostics.md](./diagnostics.md) |
| The user says "rode o debug", "está travando", "não acha o elemento" | The symptom is reproducible without a browser (unit test, wiring, config chain) → [diagnostics.md](./diagnostics.md) |

A compile error is **NOT** a runtime error. The assistant **MUST NOT** boot a browser to explain a `tsc` failure, and **MUST NOT** attribute a runtime symptom to wiring without first inspecting the live page.

Imperative playbook. When the failure is in scope, the agent **MUST** follow Phases 1 -> 3 in order. Each phase has an **Exit criterion** — do not advance until it is satisfied.

## Phase 1 — Boot playwright-cli browser (MUST)

`$$SKILL_DIR/configs/playwright-cli.config.json` is **shared across projects**. The agent **MUST NOT** edit it in place, for any reason, not even temporarily. When any field must change (port, args, headed mode), **copy it to a temp path first** and pass the copy:

```bash
cp $$SKILL_DIR/configs/playwright-cli.config.json /tmp/new-playwright-cli.config.json
# edit /tmp/new-playwright-cli.config.json, never the original
```

1. Run `command -v playwright-cli`. If it is missing, stop and tell the user to install `playwright-cli`.

The script opens `playwright-cli` headed and prints the CDP WebSocket endpoint to stdout, after this not need to attach the browser.

```bash
export CLI_BROWSER_CONNECT_WS=$($$SKILL_DIR/scripts/debug-browser.sh $$SKILL_DIR/configs/playwright-cli.config.json)
# OR
source $$SKILL_DIR/scripts/debug-browser.sh
```

Validate the output:

- Must be non-empty and start with `ws://`.
- If empty, recovery: run `lsof -i :9222` to check if the CDP port is already taken by a stale browser;
  - Use the **copy** created above: change its `cdpPort` field and the `--remote-debugging-port=` argument to a free port, then run `export CLI_BROWSER_CONNECT_WS=$($$SKILL_DIR/scripts/debug-browser.sh /tmp/new-playwright-cli.config.json)`.

**Exit criterion:** `CLI_BROWSER_CONNECT_WS` is exported and looks like `ws://localhost:9222/devtools/browser/<uuid>`.

---

## Phase 2 — Run crawler in background (MUST)

Start it attached to the shared browser, **redirecting logs to a file and returning the shell**, so the logs can be read while the crawler is still running:

```bash
BROWSER_CONNECT=$CLI_BROWSER_CONNECT_WS $$PM dev > /tmp/odg-debug.log 2>&1 &
```

Read the logs while it runs (do **NOT** block on a foreground run):

```bash
tail -n 50 /tmp/odg-debug.log
```

```bash
# Or drive the browser manually instead of running the crawler
playwright-cli goto https://www.google.com
```

**Exit criterion:** the log file contains the failure (stack trace, timeout, or the point where progress stops), and the browser from Phase 1 is sitting on the failing page.

---

## Phase 3 — Inspect DOM via playwright-cli (MUST when Runtime/Selector)

The browser opened in Phase 1 is the **same** one the crawler is using. Invoke the `playwright-cli` skill to inspect the page the crawler is stuck on:

1. **MUST** capture a snapshot (DOM + screenshot) before suggesting any fix.
2. **MUST** verify the failing selector against the live DOM: does the element exist? Is the locator strategy wrong (text vs role vs CSS)?
3. **SHOULD** test 1-2 candidate replacement selectors in the live page before editing source.

The agent **MUST NOT** propose a selector fix without confirming that the candidate matches in the live DOM.

### Symptom → what to check in the live page

| Symptom | Check first |
| --- | --- |
| `waitForSelector` timeout, element "does not exist" | Whether the node is inside an **`iframe`** or a **shadow root** — a top-level locator never sees it. Resolve the frame / host first, then re-test the selector inside it. |
| Selector matches in the snapshot but not at runtime | Element rendered **after** the wait: the crawler raced the page. Look for a stable post-render anchor instead of a fixed delay. |
| Page changed URL on its own; the crawler acts on the old page | A **self-redirect / client-side navigation** invalidated the page handle. Confirm the current URL in the live browser and wait on the destination, not on the origin. |
| Flow stops with no error, download or upload never finishes | Check whether the browser is waiting on a **file dialog or download** that was never consumed; verify the download path and that the event is awaited. |
| Worked at first, then every step fails / bounced to login | **Session expired mid-flow** (cookie or token). Check the live page for a login screen and whether the flow re-authenticates rather than retrying blindly. |
| Retry loop | Runtime cause is almost always dispatch + `RetryAction.Retry`: see [handler.md](./handler.md). |

**Exit criterion:** root cause is identified at file and line level, for example `src/Selectors/LoginSelector.ts:14` — text "Entrar" replaced by "Login" upstream.

---

## Constraints reminder

- `$$SKILL_DIR/configs/playwright-cli.config.json` — shared, **MUST NOT** be edited in place; copy to a temp folder if a change is needed (Phase 1).
- All `$$SKILL_DIR` occurrences above **MUST** be expanded to the absolute skill directory before execution; see the Path convention in `SKILL.md`.
