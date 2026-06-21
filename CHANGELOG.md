# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-21

### Added

- `parseEnv` / `tryParseEnv` — validate and coerce environment variables with
  full TypeScript inference, collecting all issues into a single `EnvError`.
- Validators: `str`, `num`, `int`, `bool`, `port`, `url`, `email`, `host`,
  `json`, and `oneOf` (literal-union preserving), each with `default`,
  `optional`, and `desc` options.
- `parseDotenv` — a minimal dependency-free `.env` parser.
- `envguard` CLI to assert required variables exist (with optional `.env` file).
- ESM + CJS builds, types, and CI across Node 18 / 20 / 22.
