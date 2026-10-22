# Review Checklist

Evaluate **Always**, then **Declaration** and **Contract** whenever the diff changes source code, then every other section whose trigger the diff shows. A section's name is the word before the dash.

The rules of each surface live in its references, and this checklist does not repeat them: read the references the [Routing map](../../SKILL.md#routing-map) names for each changed file, plus [architecture.md](../architecture.md) and [conventions.md](../conventions.md) whenever the diff changes source code, as the diff needs them.

## Always

- **Simplicity of the solution (ask first)** A materially simpler approach that solves the card → finding that states it concretely.
- **Task Scope** A change outside the card → violation. Exempt only while behavior-preserving: lint or format fixes on lines the diff already changes, `TODO`/`FIXME` in touched files, the package updates the card needs, legacy refactors the card asks for. A lint auto-fix applied to untouched code of a shared library goes to its own MR. A card of type analysis or study delivers its analysis (card comment, follow-up card), not an implementation. Otherwise the finding **MUST** name the behavior at risk.
- **Card fulfillment** Every activity and acceptance criterion of the card maps to a `path:line` of the diff. A finding that quotes the criterion: a criterion with no line, a line that contradicts it, or a fix that breaks a criterion an earlier version met. Also a finding: a card description or commit message that claims a change the diff does not contain.
- **Forgiveness (do NOT report)** A defect in legacy code around the change, unless the change caused it.
- **Gate-enforced (do NOT report)** What the project's configured eslint, tsc, prettier, or equivalent gate reports; spend no review effort on it.
- **Out-of-diff action** A change that depends on CI, env/vault, or a consuming repo **MUST** cite or include that action in the MR.
- **Cross-repo Standards** A cross-repo convention or a package `AGENTS.md` rule broken, or a shared library misused → violation. Judge an `@odg/*` dependency at the version or branch this `package.json` links, never the published one.
- **Contextual Flow Bugs** Trace every changed flow to the end state it reaches (alert, status, persisted value, report sent) on each of these paths, and report the first one that ends wrong:
  1. success, and each distinct failure the change can produce;
  2. every retry attempt, **including the last**: what the attempt inherits from the previous one, and what runs before `retrying()` decides ([attemptable-flow.md]($$PROJECT_ROOT/node_modules/@odg/chemical-x/docs/attemptable-flow.md) → *Traps*);
  3. every toggle and every optional infrastructure switched off (see **Toggle must survive being off**);
  4. two executions at once, when state is shared across processes (files, a cache, a database): read-decide-write runs under one lock that covers every reader and writer, and state is published after the decision;
  5. the limits the card names (ceiling, minimum, empty queue, timeout): a redesign is checked at those limits before it is accepted;
  6. each combination of a new compound condition (`isLoggedIn && status === 401`).

  Every flow finding names the end state, not only the first break. **MUST NOT** be cited when a trigger section item names the defect; cite that item.
  - **One owner per terminal report** [attemptable-flow.md]($$PROJECT_ROOT/node_modules/@odg/chemical-x/docs/attemptable-flow.md) → *Hooks* → *One owner per outcome*.
  - **Derived time budgets** Timeouts that must cover each other derive from each other (lock wait ≥ stale threshold ≥ worst case of the critical section), never independent literals explained in a comment.
- **Review-fix code** Code written to apply a review finding is judged like any new code, and these are the ways it usually goes wrong: a comment or docblock that explains the fix to the reviewer; a log, catch, guard or fallback added "to be safe"; a helper or wrapper created only to hold the fix; a strategy change taken from a 💡 ([review.md](../review.md) → *Strategy change*); an acceptance criterion an earlier version met, now broken (**Card fulfillment**).
- **Cross-file trace pass (do last)** Grep each changed shared artifact, config key, and interface field; verify flow and nullability in every consumer. Also: a cast (`as X`) on external data is a consumer, so grep the field name, not only the type.

## Declaration — new or renamed file, class, function, type, constant, export, or docblock

- **Unjustified abstraction** A new indirection (helper, wrapper, extracted type, sub-schema, const map, service) that only forwards, from one call site → violation; test: inlined, the caller is no worse. Includes a body of one `new X(...)`, `env.get(...)`, or call + return, and a one-entry map. Also: a method extracted only to fit `max-statements` (remove what overflowed first); a helper that exists to absorb a union type (standardize the type); a wrapper that only adds a catch (edit the method); an options object for a single optional parameter; `retry({ times: 1 })`; a new enum or constants file for a subject that already has one.
  - **Naming exemption (do NOT report)** A single-call-site extraction whose name spares decoding the body; a name that restates the body is not exempt.
  - **Fake helper** A helper extracting the fields one caller needs, with no parameter for the resource it reads → violation.
- **Code with no consumer** An artifact the diff adds or keeps with no real consumer → violation: event without listener, public method only `tests/` calls, unrequested feature, unreferenced export, unread config key, parameter or field that changes nothing. Wired framework infrastructure is exempt. A shared package's export **MUST NOT** be reported without searching the repos that consume it.
- **Shared-layer first** Logic that serves 2+ consumers, logic with no company-specific rule that other robots will need (process lifecycle, scaling, retry or redundancy logs), or logic whose defect lives in the shared library **MUST** live, or be fixed, in the library, even when this card has a single consumer.
- **Artifact placement (derive, don't inline)** An artifact outside the folder that owns its kind ([architecture.md](../architecture.md) → *Universal spine*), or a hand-written type that a schema would derive ([architecture.md](../architecture.md) → *Validators*) → violation.
- **Layer ownership** A concern leaking across layers (orchestration vs business rule, contract vs implementation, transport vs domain schema) without stated justification → violation.
  - **Base + specialization boundary** A member of a base or extended artifact of any kind used by one specialization only → violation.
- **One reason to change per class** An orchestrator that performs I/O, compares state, or assembles payloads itself → violation, even when only it calls the operation. See [architecture.md](../architecture.md) → *One class, one job*.
- **Duplicated literal/structural definitions** A value, type, or composite (literal, shape, regex, policy, generic, schema) repeated in the diff, so adding a member means editing every copy → violation, unless each site says inline why the meanings differ.
- **Naming coherence** A typo in a symbol or file name, a legacy term in a new namespace, a specialization name in an unrelated namespace, or two names for one domain concept → violation. Also a violation: a boolean prefix that contradicts its value (`is`/`did` for a state or an event that happened, `has` for possession, `should` for a decision: `shouldUseGoodProxy` holding "has a good proxy" is a violation); a noise suffix (`Value`, `Data`, `Info`); sibling functions or config keys for parallel cases with different shapes or name patterns; two names that differ by one word for different concepts (`SEARCH_TIMEOUT` next to `SEARCH_RESULT_TIMEOUT`).
- **Renames and moves** On a rename or a move across config, table, enum, seed, validator, service, or schema, grep old and new symbol, persisted key, and domain term; both alive with one meaning and no documented migration window → violation.
- **Comments and docblocks** A comment (`/** */`, `/* */` or `//`, in `src/` or `tests/`) exists only to state a non-obvious *why* of the code next to it: a constraint, a trap, a decision a reader would otherwise undo. Each of these is a violation, because each one rots or misleads as soon as the code moves:
  - it explains the name: rename the symbol instead (`stale` → `deadOwnerLockMs`), or let named constants carry the arithmetic (`// 600 × 50 ms = 30 s` → `lockWaitMs`, `lockRetryEveryMs`);
  - it repeats the code, the signature, the types, the test name or the test data;
  - it narrates history: a card id (`@task`, `ABC-123`, "Regressão do ABC-999"), what the code did before, why something was removed, the approach that was discarded. That belongs in the commit message and in the card;
  - it describes another class or a library (`proper-lockfile cria o diretório .lock`, how `ConsoleLogger` formats a message): the owner documents itself;
  - it repeats an explanation that already lives elsewhere. The explanation lives once, on the owner of the mechanism, and the other sites carry nothing;
  - it promises what the code does not guarantee ("o fluxo segue", "respeita o timeout") or states an unverified fact ("(4–15 ms)");
  - it survives a change of approach: when the design changes, every *why* written for the old design is rewritten or deleted;
  - it was written to justify the code to a reviewer or to the AI that reviewed it;
  - a comment about a member is `//` above the declaration instead of `/** */` on the member itself;
  - it is not in the project language (`AGENTS.md`; Portuguese when absent).

  Lint-bound (removed from this text when the lint rule ships): card ids in comments; `//` above a member.

## Error — `try`/`catch`/`.catch`, fallback, `??`/`||` default, defensive `if`, retry, log call, unawaited promise

- **Error boundary placement** Violations: a `try`/`catch` per operation, below the unit of work (card, request, message), to continue after a failure; a `catch` that hides the skipped step or drops the original error (a catch that substitutes a value: **Silent fallback**); a rescue nested in the failure handler; distinct failures collapsed into one status.
  - **Silent fallback** A branch that continues without the thing it needed (`?? {}`, a catch that returns `true`/`false`/`[]`/`null`, a lock that proceeds unlocked, a timeout counted as success) is a catch in disguise. It is allowed only when the card asks for that degradation, and then it logs once (**Log content**); a comment or docblock that justifies the degradation is not the card asking for it. Otherwise the failure propagates.
  - **Expected error only** A catch around an operation that may legitimately fail catches that failure's type (`TimeoutError`; a 404 mapped to a domain exception) and rethrows the rest. A broad catch around a whole method, there for one optional call, swallows programming errors.
  - **Capture, then validate** For a request whose failure is part of the flow, capture the outcome first and validate it in sequence outside the catch: `.catch` only hands the error back. **MUST NOT** branch, throw or decide inside the `.catch` callback.
  - **Context in the exception** An unclassified/unknown exception thrown from a raw response that no requester logged (e.g. a browser `waitForResponse`) carries the response text (`await response.text().catch((e) => e)`) or the upstream `Error` instance as `previous` — never `undefined`, and never a plain object on a known domain alert whose requester already logged the response.
  - **retry owns the reaction** [helpers.md]($$PROJECT_ROOT/node_modules/@odg/chemical-x/docs/helpers.md) → *`retry(options)`* → *A reação à falha mora no `when`*.
- **Defensive excess** A guard, branch, or handler for what cannot occur by construction → violation: revalidating what the schema or type guarantees; 2+ branches with the same outcome; parsing an error body to refine a message; a `try`/retry/cache/fallback/retro-compat branch the card never asked for. Also: a fallback to an alternative dependency (`?? this.consoleLogger`), to a required env (`process.env.X || "x"`) or to a required config key (`config.get(key, () => [])`); a guard for a field the producer's validator already requires (read the producer's schema); a re-check of what the dependency's contract guarantees; normalizing an input format with no evidence (log, contract) that it occurs.
- **Duplicate logging** Logging a failure that the called operation or the boundary already logs → violation. Also: a `catch` that continues after a failed `@odg/message` request and logs when `ODGMessage.isMessageError(error)` is true (the requester already logged it; never filter with `isMessage`); a per-attempt success or failure log in `success()`, `failure()` or `retrying()`, which repeats what `BasePage`/`@attemptableFlow` already log (`Step X: Failed Attempt N`) unless the card asks for it; a failure recorded once (a cached failure, a suppression window) logged again on every call that reads the record.
- **Log content** Logs exist to validate the card and to diagnose production; every extra line is noise someone filters out in Graylog/Kibanna. Violations: a Service, Page or Handler logging through `ConsoleLogger`/stdout instead of the injected `Logger` (stdout is only for boot code that runs before the Logger is bound; a class that may run earlier receives a resolver of the Logger); a business log carrying fields the json-log index already identifies (app name, identifier) or detail beyond what the card validates; one event logged with different loggers, messages or keys on different paths, or new keys for a concept the SDK already logs (`stepAttempt`, not a new `paymentAttempt`); a fallback path that continues with no log where the decision is made; a success log that also runs when a `catch` turned the failure into a value. Lint-bound (removed from this text when the lint rule ships): `this.consoleLogger` in Services.

## Config — config, env, toggle, enum, validator, or schema touched; field added as or made optional or nullable

- **Config surface** A new key **MUST** carry a scope comment in `.env.example` and reach every surface that consumes it (deploy manifests, consumer schemas). Config keys hold only the base URL (`*_URL`); URL paths live in code, never in `.env`/config ([configs.md](../configs.md) → *Rules*).
- **External Validators Schema** An external-payload schema **SHOULD** declare only the fields the consumer reads and stay loose. How the schema is written, parsed and typed: [architecture.md](../architecture.md) → *Validators*.
  - **looseObject corollary** In an already loose schema (`looseObject`, `.passthrough()`, `.unknown(true)`, any alias), a required field nothing reads → violation naming the payload that now fails to parse; the fix is deleting it.
- **Optional vs Domain** A field optional (`?`, `.optional()`) because one flow lacks the data, not because the domain allows absence → violation. For an external payload: [architecture.md](../architecture.md) → *Validators* → *Optionality mirrors the producer*.
  - **Type/Nullability Weakening Safety** Anything weakened to optional or nullable **MUST** have every consumer grepped and shown to handle absence.

## Contract — existing symbol's signature, interface, payload, or behavior changed, or symbol removed

- **Contract fidelity** A declared parameter of a changed public method or interface that does not reach behavior or the downstream payload → violation.
  - **Call-site coverage** When the diff changes an artifact's error handling, retry, or validation, grep every `<artifact>.execute()`; a caller left behind → violation naming its `path:line`, unless the diff states why that caller differs.
  - **Illusory generic typing** An explicit generic argument at a call site whose return value is not consumed → violation.
- **Hidden state coupling** Reading hidden state (payload snapshot, mutable singleton field, ambient global, process state) where an argument would suffice → violation. Also: `process.env` or a runtime variable where the Config holds the value; `this.container.get()` in a class that builds payloads; a placeholder written to a shared store so that another reader does not get `undefined`.
- **Naming vs Behavior** A name that does not describe everything the symbol does → violation. Also: a method emptied by the change (a `bind*` that no longer binds) is renamed in the same diff; `toJson()` renders only the object's own state; a payload built from outside arguments gets its own name. Lint-bound (removed from this text when the lint rule ships): a method that returns a value starts with a verb (`get`, `find`, `resolve`).
- **Survivors of a change of direction** After a mid-task change of approach, an artifact built for the old one (code, test, type, exception, enum entry, wiring, alias) that earns nothing now → violation, e.g. a bespoke algorithm deriving what the consumer already receives. Also: comments, tests and guards written for the old approach.
  - **Orphan writer** When the diff removes a method, boot step, or listener, grep each field it alone wrote across `src/` and consuming repos; no writer left with 1+ readers → violation naming the value readers lose.
- **Toggle must survive being off** When a flow starts depending on what an existing toggle (`USE_`, `_ENABLED`, `_DRIVER`, `_TYPE` `OFF`) disables, trace the off branch to its end; one that raises, leaves a name unbound, or skips a later step → violation, fixed by a working off branch or by removing the toggle everywhere.

## Mechanism — hand-rolled retry, polling, wait, loop, parse, format/convert (date, URL, string), cache, conditional throw, or sequential `await`s

- **Library-first / No duplicate conventions** Hand-rolled logic a dependency already provides (`@odg/*`, `zod`, Prisma, JWT) → violation. Before approving, check the `AGENTS.md` of each package a changed line calls — `index.md` lists them under "Package References Required"; 💡 names the library symbol. HTTP status: [conventions.md](../conventions.md) → *HTTP status codes*. Also: a concurrency primitive (lock, mutex, backoff) comes from a mature library even when it is not installed yet (`proper-lockfile`, not `mkdir` + sleep); the attempt limit belongs to `@attemptableFlow`, never a parallel counter.
- **Retry bounds** Every retry or polling loop **MUST** have an explicit limit, and a terminal error (refusal, validation 4xx) **MUST** exit it.
- **Performance optimization** No N+1, no unnecessary loop, cache when real-time is not required, bundle size considered.
  - **Promise.all Independent** Independent async operations awaited one after another → violation.

## Input — external input (HTTP/RPC, scrape, JWT, IPC, query string, env, file) read; HTML rendered; query or prompt built

- **Untrusted input validation** Branching on, coercing (`Boolean(x)`, `!!x`, `if (x)`), persisting, or comparing a value from across a trust boundary before the project's schema library parses it → violation, unless every read is a strict comparison (`=== true`, `typeof x === "number"`). For an external payload the parse rules are [architecture.md](../architecture.md) → *Validators*.
- **Server is the source of truth** Authoritative state (identity, permission, price, ownership) taken from client input instead of a verified token, persisted record, or server computation → violation.
- **Security hygiene** No hardcoded secret. Building a query: no SQL/NoSQL injection; rendering HTML: no XSS/CSRF; building a prompt or sinking model output: injection guard and output sanitization.

## Suppression — lint or type-check suppression added (`eslint-disable*`, `@ts-*`, `skipLibCheck`, build flag), or code under an existing one edited

- **Suppression revisit deadline** Violations: no `TODO [YYYY-MM-DD]: <upstream condition>`, a past date, or a vague or symptom-only reason; a trivially fixable suppression, even dated; several suppressions for one cause instead of one in the narrowest scope; a suppression of a rule whose correct fix is known (`import type` for `import/no-cycle`, the Config for `n/no-process-env`, a log for a silent catch); a whole-file disable; a disable that suppresses nothing; a `TODO` that points to the current card. A value the process manager injects is not config: its `n/no-process-env` suppression names that permanent cause instead of a date ([configs.md](../configs.md) → *Rules*). Also fires when the diff edits code under an existing suppression that the card asks to resolve.

Temporary: each form above leaves this item when a lint rule covers it.
