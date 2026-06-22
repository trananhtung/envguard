# envguard

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

> Validate, coerce, and **type** your environment variables — fail fast with one clear report. **Zero dependencies**, full TypeScript inference.

[![CI](https://github.com/trananhtung/envguard/actions/workflows/ci.yml/badge.svg)](https://github.com/trananhtung/envguard/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@billdaddy/envguard.svg)](https://www.npmjs.com/package/@billdaddy/envguard)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@billdaddy/envguard)](https://bundlephobia.com/package/@billdaddy/envguard)
[![types](https://img.shields.io/npm/types/@billdaddy/envguard.svg)](https://www.npmjs.com/package/@billdaddy/envguard)
[![license](https://img.shields.io/npm/l/@billdaddy/envguard.svg)](./LICENSE)

`process.env` is `string | undefined` — every value, every time. So `PORT` is a
string, a missing `DATABASE_URL` is `undefined` you discover at 3 a.m., and a
typo'd `NODE_ENV` sails straight to production.

`envguard` validates and coerces your environment **once, at startup**, hands you
a fully-typed config object, and — when something's wrong — tells you **everything**
that's wrong in a single message.

```ts
import { parseEnv, str, port, oneOf, bool } from "envguard";

export const env = parseEnv({
  NODE_ENV: oneOf(["development", "production", "test"], { default: "development" }),
  PORT: port({ default: 3000 }),
  DATABASE_URL: str(),
  ENABLE_CACHE: bool({ optional: true }),
});

env.PORT;        // number          (not "3000")
env.NODE_ENV;    // "development" | "production" | "test"
env.DATABASE_URL // string
env.ENABLE_CACHE // boolean | undefined
```

If `DATABASE_URL` is missing and `PORT` is `"-1"`, you get:

```text
EnvError: Invalid environment configuration:
  • PORT: expected a port (1-65535), got "-1"
  • DATABASE_URL: missing required string value
```

## Why envguard?

- **Fail fast, fail loud, fail once.** All issues reported together — no
  whack-a-mole on restart.
- **Real types, inferred.** `port()` → `number`, `oneOf([...])` → a literal union,
  `optional` → `T | undefined`. No casts, no `as`.
- **Zero dependencies.** No `dotenv`, no `zod`, no schema compiler. ~2 kB.
- **Coercion built in.** Numbers, booleans (`yes/no/1/0/on/off`), ports, URLs,
  emails, hosts, JSON, enums.
- **A CLI for CI** — assert required vars exist before a deploy.

## Install

```bash
npm install @billdaddy/envguard
# or: pnpm add @billdaddy/envguard  /  yarn add @billdaddy/envguard
```

> Published as the scoped package `@billdaddy/envguard`. Import as:
> ```ts
> import { parseEnv, str, port } from "@billdaddy/envguard";
> ```

## Validators

| Builder            | Coerces to            | Notes                                            |
| ------------------ | --------------------- | ------------------------------------------------ |
| `str()`            | `string`              | verbatim                                         |
| `num()`            | `number`              | any finite number                                |
| `int()`            | `number`              | integers only                                    |
| `bool()`           | `boolean`             | `true/false/1/0/yes/no/y/n/on/off` (any case)    |
| `port()`           | `number`              | integer 1–65535                                  |
| `url()`            | `string`              | validated, normalised                            |
| `email()`          | `string`              | syntactic check                                  |
| `host()`           | `string`              | host/IP, no scheme or path                       |
| `json()`           | `unknown`             | `JSON.parse`                                      |
| `oneOf([...])`     | union of the literals | preserves the literal union in the type          |

Every builder accepts `{ default, optional, desc }`:

```ts
str({ default: "anonymous" }); // present with a fallback → string
str({ optional: true });       // may be absent → string | undefined
str({ desc: "API base URL" }); // description shown in error reports
```

`default` and `optional` are mutually exclusive in practice: a default already
makes the variable safe to omit.

## API

### `parseEnv(schema, source?) → typed config`

Validate `source` (defaults to `process.env`) and return the typed object.
Throws `EnvError` if anything is invalid.

### `tryParseEnv(schema, source?) → result`

Non-throwing variant:

```ts
const result = tryParseEnv(schema);
if (!result.ok) {
  console.error(result.error.message);
  process.exit(1);
}
const env = result.env;
```

### `EnvError`

```ts
class EnvError extends Error {
  issues: { key: string; message: string }[];
}
```

### `parseDotenv(contents) → record`

A tiny built-in `.env` parser (comments, `export`, quotes) for when you don't
want a separate dependency:

```ts
import { readFileSync } from "node:fs";
import { parseEnv, parseDotenv, str } from "envguard";

const fileEnv = parseDotenv(readFileSync(".env", "utf8"));
const env = parseEnv({ TOKEN: str() }, { ...process.env, ...fileEnv });
```

## CLI

Fail a CI job or container start-up when required variables are missing:

```bash
envguard --require DATABASE_URL,PORT,STRIPE_KEY
envguard -r REDIS_URL,API_KEY --file .env.production
```

```
envguard --require KEY1,KEY2[,...] [--file .env]
  --require, -r <keys>   Variables that must be present
  --file, -f <path>      Also load this .env file
```

Exit code `0` if all present, `1` otherwise.

## Contributors ✨

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome — code, docs, bug reports, ideas, reviews! See the [emoji key](https://allcontributors.org/docs/en/emoji-key) for how each contribution is recognized, and open a PR or issue to get involved.

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/trananhtung"><img src="https://avatars.githubusercontent.com/u/30992229?v=4?s=100" width="100px;" alt="Tung Tran"/><br /><sub><b>Tung Tran</b></sub></a><br /><a href="https://github.com/trananhtung/envguard/commits?author=trananhtung" title="Code">💻</a> <a href="#maintenance-trananhtung" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

[MIT](./LICENSE) © Tung Tran
