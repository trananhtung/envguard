import { describe, expect, it, expectTypeOf } from "vitest";
import {
  parseEnv,
  tryParseEnv,
  EnvError,
  str,
  num,
  int,
  bool,
  port,
  url,
  email,
  host,
  json,
  oneOf,
} from "../src/index.js";

describe("parseEnv — happy path", () => {
  it("coerces every built-in type", () => {
    const env = parseEnv(
      {
        NAME: str(),
        COUNT: num(),
        AGE: int(),
        ENABLED: bool(),
        PORT: port(),
        API: url(),
        ADMIN: email(),
        DB_HOST: host(),
        FLAGS: json(),
        MODE: oneOf(["dev", "prod"]),
      },
      {
        NAME: "ada",
        COUNT: "3.14",
        AGE: "36",
        ENABLED: "yes",
        PORT: "8080",
        API: "https://example.com",
        ADMIN: "a@b.com",
        DB_HOST: "localhost",
        FLAGS: '{"x":1}',
        MODE: "prod",
      },
    );

    expect(env.NAME).toBe("ada");
    expect(env.COUNT).toBeCloseTo(3.14);
    expect(env.AGE).toBe(36);
    expect(env.ENABLED).toBe(true);
    expect(env.PORT).toBe(8080);
    expect(env.API).toBe("https://example.com/");
    expect(env.ADMIN).toBe("a@b.com");
    expect(env.DB_HOST).toBe("localhost");
    expect(env.FLAGS).toEqual({ x: 1 });
    expect(env.MODE).toBe("prod");
  });
});

describe("parseEnv — defaults and optionals", () => {
  it("applies defaults when unset or empty", () => {
    const env = parseEnv({ PORT: port({ default: 3000 }) }, {});
    expect(env.PORT).toBe(3000);
  });

  it("treats empty string as unset", () => {
    const env = parseEnv({ PORT: port({ default: 3000 }) }, { PORT: "" });
    expect(env.PORT).toBe(3000);
  });

  it("yields undefined for optional unset vars", () => {
    const env = parseEnv({ DEBUG: bool({ optional: true }) }, {});
    expect(env.DEBUG).toBeUndefined();
  });
});

describe("parseEnv — errors", () => {
  it("collects all problems, not just the first", () => {
    try {
      parseEnv(
        { A: num(), B: port(), C: str() },
        { A: "notnum", B: "99999" }, // C missing
      );
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EnvError);
      const e = err as EnvError;
      expect(e.issues.map((i) => i.key).sort()).toEqual(["A", "B", "C"]);
    }
  });

  it("reports missing required vars", () => {
    const r = tryParseEnv({ TOKEN: str() }, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]?.message).toMatch(/missing required/);
  });

  it("rejects invalid enum values", () => {
    const r = tryParseEnv({ MODE: oneOf(["a", "b"]) }, { MODE: "c" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]?.message).toMatch(/expected one of/);
  });

  it("rejects out-of-range ports", () => {
    const r = tryParseEnv({ PORT: port() }, { PORT: "70000" });
    expect(r.ok).toBe(false);
  });

  it("rejects malformed URLs and emails and JSON", () => {
    expect(tryParseEnv({ U: url() }, { U: "not a url" }).ok).toBe(false);
    expect(tryParseEnv({ E: email() }, { E: "nope" }).ok).toBe(false);
    expect(tryParseEnv({ J: json() }, { J: "{bad" }).ok).toBe(false);
  });
});

describe("bool coercion", () => {
  it.each([
    ["true", true],
    ["1", true],
    ["YES", true],
    ["on", true],
    ["false", false],
    ["0", false],
    ["no", false],
    ["off", false],
  ])("parses %s as %s", (input, expected) => {
    expect(parseEnv({ B: bool() }, { B: input }).B).toBe(expected);
  });
});

describe("type inference", () => {
  it("infers the right output types", () => {
    const env = parseEnv(
      {
        NAME: str(),
        PORT: port({ default: 3000 }),
        MODE: oneOf(["dev", "prod"]),
        DEBUG: bool({ optional: true }),
      },
      { NAME: "x", MODE: "dev" },
    );

    expectTypeOf(env.NAME).toEqualTypeOf<string>();
    expectTypeOf(env.PORT).toEqualTypeOf<number>();
    expectTypeOf(env.MODE).toEqualTypeOf<"dev" | "prod">();
    expectTypeOf(env.DEBUG).toEqualTypeOf<boolean | undefined>();
  });
});
