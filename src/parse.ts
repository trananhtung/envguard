import type { Spec } from "./validators.js";

/** A mapping of variable name → {@link Spec}. */
export type Schema = Record<string, Spec<unknown, boolean>>;

/** The typed config object inferred from a {@link Schema}. */
export type Infer<S extends Schema> = {
  [K in keyof S]: S[K] extends Spec<infer T, infer Optional>
    ? Optional extends true
      ? T | undefined
      : T
    : never;
};

/** A single validation problem. */
export interface EnvIssue {
  /** The variable name. */
  key: string;
  /** What went wrong. */
  message: string;
}

/** Error thrown by {@link parseEnv} when one or more variables are invalid. */
export class EnvError extends Error {
  /** Every problem found, not just the first. */
  readonly issues: EnvIssue[];

  constructor(issues: EnvIssue[]) {
    const body = issues.map((i) => `  • ${i.key}: ${i.message}`).join("\n");
    super(`Invalid environment configuration:\n${body}`);
    this.name = "EnvError";
    this.issues = issues;
  }
}

/** Source of raw values; defaults to `process.env`. */
export type EnvSource = Record<string, string | undefined>;

function defaultSource(): EnvSource {
  return typeof process !== "undefined" && process.env ? process.env : {};
}

function validate<S extends Schema>(
  schema: S,
  source: EnvSource,
): { ok: true; env: Infer<S> } | { ok: false; issues: EnvIssue[] } {
  const out: Record<string, unknown> = {};
  const issues: EnvIssue[] = [];

  for (const key of Object.keys(schema)) {
    const spec = schema[key]!;
    const raw = source[key];

    if (raw === undefined || raw === "") {
      if (spec.hasDefault) {
        out[key] = spec.defaultValue;
      } else if (spec.optional) {
        out[key] = undefined;
      } else {
        issues.push({ key, message: `missing required ${spec.typeName} value` });
      }
      continue;
    }

    try {
      out[key] = spec.coerce(raw);
    } catch (err) {
      issues.push({ key, message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, env: out as Infer<S> };
}

/**
 * Validate and coerce environment variables against a `schema`.
 *
 * All problems are collected and reported together — you see every missing or
 * malformed variable at once, not one per restart.
 *
 * @example
 * ```ts
 * import { parseEnv, str, port, oneOf, bool } from "envguard";
 *
 * export const env = parseEnv({
 *   NODE_ENV: oneOf(["development", "production", "test"], { default: "development" }),
 *   PORT: port({ default: 3000 }),
 *   DATABASE_URL: str(),
 *   DEBUG: bool({ optional: true }),
 * });
 * // env.PORT is number, env.NODE_ENV is the literal union, env.DEBUG is boolean | undefined
 * ```
 *
 * @throws {EnvError} if any variable is missing or invalid.
 */
export function parseEnv<S extends Schema>(schema: S, source: EnvSource = defaultSource()): Infer<S> {
  const result = validate(schema, source);
  if (!result.ok) throw new EnvError(result.issues);
  return result.env;
}

/** Result of {@link tryParseEnv}. */
export type TryResult<S extends Schema> =
  | { ok: true; env: Infer<S> }
  | { ok: false; issues: EnvIssue[]; error: EnvError };

/**
 * Like {@link parseEnv}, but returns a result object instead of throwing.
 */
export function tryParseEnv<S extends Schema>(
  schema: S,
  source: EnvSource = defaultSource(),
): TryResult<S> {
  const result = validate(schema, source);
  if (result.ok) return { ok: true, env: result.env };
  return { ok: false, issues: result.issues, error: new EnvError(result.issues) };
}
