/**
 * Validators (schema builders) for environment variables.
 *
 * Each builder returns a {@link Spec} describing how to coerce a raw string
 * into a typed value, plus whether the variable is optional / has a default.
 * The generic `Optional` flag is what powers TypeScript's inference of the
 * final config object (optional vars become `T | undefined`).
 */

/** Common options accepted by every validator. */
export interface SpecOptions<T> {
  /** Value used when the variable is unset or empty. Implies the var is present. */
  default?: T;
  /** When `true`, an unset variable yields `undefined` instead of an error. */
  optional?: boolean;
  /** Human-readable description, surfaced in error reports. */
  desc?: string;
}

/** Internal description of a single variable. @typeParam Optional - presence flag for inference. */
export interface Spec<T, Optional extends boolean = boolean> {
  /** Phantom type carrier — never read at runtime. */
  readonly _t?: T;
  readonly optional: Optional;
  readonly hasDefault: boolean;
  readonly defaultValue: T | undefined;
  readonly desc: string | undefined;
  /** Coerce a present, non-empty raw string. Throws `Error` on invalid input. */
  readonly coerce: (raw: string) => T;
  /** Friendly type name used in error messages, e.g. `"number"`. */
  readonly typeName: string;
}

/** A builder function with overloads that track the `optional` flag in the type. */
export interface Validator<T> {
  (opts?: SpecOptions<T> & { optional?: false }): Spec<T, false>;
  (opts: SpecOptions<T> & { optional: true }): Spec<T, true>;
}

function makeValidator<T>(typeName: string, coerce: (raw: string) => T): Validator<T> {
  return ((opts: SpecOptions<T> = {}) => ({
    optional: !!opts.optional,
    hasDefault: Object.prototype.hasOwnProperty.call(opts, "default"),
    defaultValue: opts.default,
    desc: opts.desc,
    coerce,
    typeName,
  })) as Validator<T>;
}

/** A string, used verbatim. */
export const str: Validator<string> = makeValidator("string", (raw) => raw);

/** A finite number (integer or float). */
export const num: Validator<number> = makeValidator("number", (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`expected a number, got "${raw}"`);
  return n;
});

/** A safe integer. */
export const int: Validator<number> = makeValidator("integer", (raw) => {
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error(`expected an integer, got "${raw}"`);
  return n;
});

/** A boolean. Accepts `true/false`, `1/0`, `yes/no`, `y/n`, `on/off` (any case). */
export const bool: Validator<boolean> = makeValidator("boolean", (raw) => {
  const v = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  if (["false", "0", "no", "n", "off"].includes(v)) return false;
  throw new Error(`expected a boolean, got "${raw}"`);
});

/** A TCP port: an integer in 1–65535. */
export const port: Validator<number> = makeValidator("port", (raw) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`expected a port (1-65535), got "${raw}"`);
  }
  return n;
});

/** A valid absolute URL. Returns the normalised string. */
export const url: Validator<string> = makeValidator("url", (raw) => {
  try {
    return new URL(raw).toString();
  } catch {
    throw new Error(`expected a valid URL, got "${raw}"`);
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A syntactically valid email address. */
export const email: Validator<string> = makeValidator("email", (raw) => {
  if (!EMAIL_RE.test(raw)) throw new Error(`expected an email address, got "${raw}"`);
  return raw;
});

/** A non-empty host name or IP (no scheme, no path). */
export const host: Validator<string> = makeValidator("host", (raw) => {
  if (raw.includes("/") || raw.includes(" ") || raw === "") {
    throw new Error(`expected a host name, got "${raw}"`);
  }
  return raw;
});

/** Arbitrary JSON, parsed with `JSON.parse`. */
export const json: Validator<unknown> = makeValidator("json", (raw) => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`expected valid JSON, got "${raw}"`);
  }
});

/** Builder for a value constrained to one of `values`. */
export interface EnumValidator {
  <const V extends readonly string[]>(
    values: V,
    opts?: SpecOptions<V[number]> & { optional?: false },
  ): Spec<V[number], false>;
  <const V extends readonly string[]>(
    values: V,
    opts: SpecOptions<V[number]> & { optional: true },
  ): Spec<V[number], true>;
}

/**
 * A string that must be one of `values`. The literal union is preserved in the
 * inferred type, so `oneOf(["dev", "prod"])` yields `"dev" | "prod"`.
 */
export const oneOf: EnumValidator = (<V extends readonly string[]>(
  values: V,
  opts: SpecOptions<V[number]> = {},
) =>
  makeValidator<V[number]>(`one of ${values.join(" | ")}`, (raw) => {
    if (!values.includes(raw)) {
      throw new Error(`expected one of [${values.join(", ")}], got "${raw}"`);
    }
    return raw as V[number];
  })(opts as SpecOptions<V[number]> & { optional?: false })) as EnumValidator;
