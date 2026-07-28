# Configs

Application config, environments, database, and other service settings.

`{{ OWNER }}_{{ SUBJECT }}_{{ TYPE-AFFIX }}` — e.g. `REDIS_TLS_ENABLED`, `LOGIN_REQUEST_TIMEOUT`.

## Grouping

- **Backing Services**: Group keys under service prefix: `SERVICE_ATTRIBUTE` (e.g. `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).
- **Connection Shape**: Pick **ONE** shape per service and **MUST NOT** mix: single `SERVICE_URL` **OR** discrete `SERVICE_HOST` + `SERVICE_PORT`.
- **App-Wide**: Use `APP_` prefix (`APP_NAME`, `APP_ENV`, `APP_URL`).
- **Third-Party**: Use vendor prefix (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).

## Rules

- **NOT RECOMMENDED** Using `.default()` in configurations zod, as it masks missing required values and complicates debugging of flaky environments.
- **MUST** use Naming Conventions to create the config name.
- **MUST NOT** weaken configuration validation (e.g. changing from required to `.nullish()` or `.optional()`) without tracing and verifying that all runtime consumers of the configuration handle undefined/null values safely.
- **MUST** be encoded as a JSON array string and parsed via a zod `string → JSON.parse → zod.array`. **MUST NOT** parse arrays with `.split()`
- Env values are strings → Booleans **MUST** accept `"true"`/`"false"` (`CustomValidator.zodStringToBoolean()`).
- Durations default to **milliseconds**; non-ms units **MUST** use explicit plural suffixes (`_SECONDS`, `_MINUTES` and others).
- `_URL` **MUST NOT** end with `/` — enforce via `.refine()`.
- Env key carries toggle (`USE_`/`_ENABLED`).
- **MUST NOT** group by environment (`PROD_`/`STAGING_`) or create inverted affixes (`_DISABLED`, `_OFF`, `_NO`).
- `_TOKEN`, `_PASSWORD`, `_SECRET`, `_KEY` **MUST NOT** be logged
- **MUST NOT** merge `_LIMIT`, `_ATTEMPT` with `MIN` / `MAX`
- New key **MUST** land in .env.example; a dead key **MUST** be removed everywhere (enum, validator, .env.example).

## Usage

- Use `this.config.get(ConfigName.X)` to read the config value.
- Use `this.config.get(ConfigName.X, () => "default value")` only when a fallback is intentional.

## Naming Conventions

| Affix | Pos | zod type | Role | Good Examples | Bad Examples |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `USE_` | Prefix | `zod.boolean()` | Activates a top-level application mode, engine, or standalone strategy. | `USE_HEADLESS`, `USE_MOCK_DATA`, `USE_HTTPS`, `USE_CACHE` | `HEADLESS_ENABLED`, `ENABLE_HEADLESS`, `USE_REDIS_TLS` (TLS é sub-opção), `IS_HEADLESS` |
| `_ENABLED` | Suffix | `zod.boolean()` | Enables a sub-feature or optional capability within an existing service/domain | `REDIS_TLS_ENABLED`, `CACHE_COMPRESSION_ENABLED`, `LOG_COLOR_ENABLED`, `HTTP_RETRY_ENABLED` | `USE_REDIS_TLS`, `REDIS_TLS_DISABLE`, `REDIS_TLS_DISABLED`, `REDIS_TLS_ON` |
| `_DRIVER` | Suffix | `zod.enum([...])` | Selects an infrastructure driver or engine implementation / adapter | `SESSION_DRIVER`, `CACHE_DRIVER`, `QUEUE_DRIVER`, `MAIL_DRIVER`, `STORAGE_DRIVER` | `SESSION_TYPE`, `CACHE_ENGINE`, `MAIL_SERVICE`, `QUEUE_PROVIDER` |
| `_TYPE` | Suffix | `zod.enum([...])` | variant of one behavior — same class, different mode | `AUTH_TYPE`, `PAYMENT_TYPE`, `ENCRYPTION_TYPE`, `PARSER_TYPE`, `PROXY_TYPE` | `AUTH_DRIVER`, `PAYMENT_MODE`, `ENCRYPTION_ENGINE`, `PARSER_DRIVER` |
| `_URL` | Suffix | `zod.url()` | full scheme-bearing locator | `REDIS_URL`, `WEBSITE_URL`, `DATABASE_URL`, `API_BASE_URL` | `REDIS_LINK`, `REDIS_URL="http://redis:6379/"` (com `/`), `REDIS_URI` |
| `_HOST` | Suffix | `zod.string()` | host name or IP (`DB_HOST`) | `DB_HOST`, `REDIS_HOST`, `SMTP_HOST`, `RABBITMQ_HOST` | `DB_SERVER`, `DB_IP`, `HOST` (sem dono), `DATABASE_HOSTNAME` |
| `_PORT` | Suffix | `zod.number().int().min(1).max(65535)` | port of a **named** service | `DB_PORT`, `REDIS_PORT`, `HTTP_PORT`, `SMTP_PORT` | `PORT` (sem dono), `LOCAL_PORT`, `MY_PORT`, `DB_PORT_NUMBER` |
| `_PATH` | Suffix | `zod.string()` | filesystem or URL path segment | `LOG_DIRECTORY_PATH`, `UPLOADS_PATH`, `METRICS_PATH`, `STATIC_FILES_PATH` | `LOG_DIRECTORY`, `UPLOADS_LOCATION`, `STATIC_FILES_FOLDER` |
| `_FILE` | Suffix | `zod.string()` | path to a file (incl. a secret file) | `SSL_CERT_FILE`, `LOG_OUTPUT_FILE`, `GCP_CREDENTIALS_FILE`, `ENV_FILE` | `SSL_CERT_PATH` (if file), `LOG_FILENAME`, `GCP_CREDENTIALS` |
| `_TIMEOUT` | Suffix | `zod.number().positive()` | ms to wait before **giving up** | `HTTP_CLIENT_TIMEOUT`, `DB_CONNECT_TIMEOUT`, `SOCKET_TIMEOUT`, `READ_TIMEOUT`, `EXAMPLE_REQUEST_TIMEOUT` | `HTTP_TIMEOUT_MS`, `TIMEOUT` (sem dono), `HTTP_WAIT_TIME` |
| `_TTL` | Suffix | `zod.number()` | ms until a stored value **expires** | `CACHE_TTL`, `SESSION_TTL`, `DNS_CACHE_TTL`, `JWT_TTL` | `CACHE_EXPIRATION`, `CACHE_LIFETIME`, `CACHE_TTL_MS` |
| `_INTERVAL` | Suffix | `zod.number()` | ms **between repetitions** polling/interval | `HEALTHCHECK_INTERVAL`, `POLLING_INTERVAL`, `CRON_INTERVAL`, `METRICS_FLUSH_INTERVAL` | `HEALTHCHECK_PERIOD`, `POLLING_TIME`, `HEALTHCHECK_FREQUENCY` |
| `_DELAY` | Suffix | `zod.number()` | ms to wait **before starting** / between retries | `RETRY_DELAY`, `RECONNECT_DELAY`, `STARTUP_DELAY`, `LOGIN_DELAY` | `RETRY_WAIT`, `RETRY_SLEEP`, `RETRY_PAUSE` |
| `_SECONDS`, `_MINUTES`, `_HOURS`, `_DAYS` | Suffix | `zod.number()` | duration when the unit is **not** ms (unit in the key) **MUST** plural | `JWT_EXPIRATION_SECONDS`, `SESSION_IDLE_MINUTES`, `CLEANUP_INTERVAL_DAYS`, `LOCK_TTL_HOURS` | `JWT_EXPIRATION_SECOND` (singular), `SESSION_MINUTES_TIME`, `CLEANUP_DAYS_VAL` |
| `_TOKEN` | Suffix | `zod.string().min(1)` (or `zod.jwt()`) | auth token or jwt token`.optional()` | `AUTH_TOKEN`, `SLACK_BOT_TOKEN`, `API_BEARER_TOKEN`, `CSRF_TOKEN` | `AUTH_KEY`, `SLACK_TOKEN_VAL`, `AUTH_PASS` |
| `_PASSWORD` | Suffix | `string()` | password of an account the app logs in with (`DB_PASSWORD`) | `DB_PASSWORD`, `REDIS_PASSWORD`, `SMTP_PASSWORD`, `SUDO_PASSWORD` | `DB_PASS`, `DB_PWD`, `DB_SECRET` |
| `_SECRET` | Suffix | `zod.string().min(1)` | shared secret for signing/verifying | `WEBHOOK_SECRET`, `SSO_CLIENT_SECRET`, `JWT_SECRET`, `COOKIE_SECRET` | `WEBHOOK_KEY`, `SSO_SECRET_VAL`, `JWT_HASH` |
| `_PRIVATE_KEY` `_API_KEY` `_ACCESS_KEY_ID` `_CLIENT_ID` | Suffix | `zod.string().min(1)` | credential/API key or public identifier | `SSH_PRIVATE_KEY`, `OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, `GOOGLE_CLIENT_ID` | `SSH_KEY_PRIV`, `OPENAI_KEY`, `AWS_KEY`, `GOOGLE_ID` |
| `MAX_…` `MIN_…` | Prefix | `zod.number()` | upper/lower bound | `DB_MAX_CONNECTIONS`, `MIN_POOL_SIZE`, `MIN_WORKERS` | `DB_CONNECTIONS_MAX`, `POOL_SIZE_MIN`, `RETRIES_MAX` |
| `_LIMIT` | Suffix | `zod.number().positive()` | Maximum threshold or capacity cap for pagination, rate limiting, or queries | `PAGE_LIMIT`, `RATE_LIMIT`, `QUERY_LIMIT` | `PAGE_MAX`, `LIMIT_PAGE`, `RATE_MAX`, `MAX_PAGE_LIMIT` |
| `_SIZE` | Suffix | `zod.number().positive()` | Buffer capacity, memory volume, payload size, or batch chunk quantity | `BATCH_SIZE`, `MAX_PAYLOAD_SIZE`, `(MIN_,MAX_)POOL_SIZE`, `BUFFER_SIZE` | `BATCH_LENGTH`, `PAYLOAD_BYTES`, `SIZE_BATCH`, `POOL_LENGTH` |
| `_ATTEMPT` | Suffix | `zod.number().positive()` | Execution attempt sequence threshold or retry attempt index for operations | `CONNECTION_ATTEMPT`, `LOGIN_ATTEMPT`, `DB_CONNECTION_ATTEMPT`, `WEBHOOK_DELIVERY_ATTEMPT` | `LOGIN_MAX_ATTEMPT`, `MAX_ATTEMPT`, `TRIES_COUNT`, `ATTEMPT_NUM`, `MAX_RETRIES`, `LOGIN_TRIES` |
| `_NAME` | Suffix | `zod.string()` | label/name (`APP_NAME`, `PROXY_NAME`) | `APP_NAME`, `PROXY_NAME`, `CLUSTER_NAME` | `APP_TITLE`, `PROXY_LABEL`, `MY_NAME` |

## How to Create a config

- By default the generated config uses zod.string(). If another type is required, use the command flags or update the validator after scaffolding.

```bash
$$PM odg make:config <configName>
# or
$$PM odg make:config --help
```
