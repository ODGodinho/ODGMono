# Configs

Application configs environments, database or other services configurations.

## Rules

- Configs names live in `src/app/Enums/ConfigName.ts` by default.
- Configs validator/types live in `src/Configs/index.ts` by default.
- **MUST** use CONFIG_NAME in CONST_CASE naming convention.
- **MUST NOT** use `.any()` config validator.
- **NOT RECOMMENDED** Using `.default()` in configurations zod, as it masks missing required values and complicates debugging of flaky environments.
- **MUST NOT** be accessed via `process.env.ANYTHING_ENV` use config class.
- **MUST** use Naming Conventions to create the config name.

## How to usage

- Use `this.config.get(ConfigName.X)` to get the config value.
- Use `this.config.get(ConfigName.X, () => "default value")` to get the config value with default value if not exists

## Naming Conventions

if create one config, use this convention preffix or suffix to create the config name.

| Key       | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| USE\_     | Prefix | zod.boolean() if use enable it's resource |
| TYPE\_    | Prefix | zod.enum()                                |
| \_TIMEOUT | Suffix | zod.number() timeout in milliseconds      |
| \_URL     | Suffix | zod.url() url not end with /              |
| \_PATH    | Suffix | zod.string() path request or folder       |
| \_TOKEN   | Suffix | zod.string() or zod.jwt() private token   |

## How to Create a config

- By default configs is validated with Zod schema, with zod.string(), if need other type use command flag to change.

```bash
yarn odg make:config <configName>
# or
yarn odg make:config --help
```
