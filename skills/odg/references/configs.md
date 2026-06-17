# Configs

Application config, environments, database, and other service settings.

## Rules

- Configs names live in `src/app/Enums/ConfigName.ts` by default.
- Configs validator/types live in `src/Configs/index.ts` by default.
- **MUST** use CONFIG_NAME in CONST_CASE naming convention.
- **MUST NOT** use `.any()` config validator.
- **NOT RECOMMENDED** Using `.default()` in configurations zod, as it masks missing required values and complicates debugging of flaky environments.
- **MUST NOT** be accessed via `process.env.ANYTHING_ENV` use config class.
- **MUST** use Naming Conventions to create the config name.
- **MUST NOT** weaken configuration validation (e.g. changing from required to `.nullish()` or `.optional()`) without tracing and verifying that all runtime consumers of the configuration handle undefined/null values safely.
- **MUST** be encoded as a JSON array string and parsed via a zod `string → JSON.parse → zod.array`. **MUST NOT** parse arrays with `.split()`

## Usage

- Use `this.config.get(ConfigName.X)` to read the config value.
- Use `this.config.get(ConfigName.X, () => "default value")` only when a fallback is intentional.

## Naming Conventions

If you create a config key, use the following prefixes or suffixes.

| Key       | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| USE\_     | Prefix | zod.boolean() if use enable it's resource |
| TYPE\_    | Prefix | zod.enum()                                |
| \_TIMEOUT | Suffix | zod.number() timeout in milliseconds      |
| \_URL     | Suffix | zod.url() url not end with /              |
| \_PATH    | Suffix | zod.string() path request or folder       |
| \_TOKEN   | Suffix | zod.string() or zod.jwt() private token   |

## How to Create a config

- By default the generated config uses zod.string(). If another type is required, use the command flags or update the validator after scaffolding.

```bash
yarn odg make:config <configName>
# or
yarn odg make:config --help
```
