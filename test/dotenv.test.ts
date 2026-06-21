import { describe, expect, it } from "vitest";
import { parseDotenv } from "../src/dotenv.js";

describe("parseDotenv", () => {
  it("parses simple KEY=VALUE pairs", () => {
    expect(parseDotenv("A=1\nB=two")).toEqual({ A: "1", B: "two" });
  });

  it("ignores comments and blank lines", () => {
    expect(parseDotenv("# comment\n\nA=1\n  # indented\nB=2")).toEqual({ A: "1", B: "2" });
  });

  it("strips the export prefix", () => {
    expect(parseDotenv("export TOKEN=abc")).toEqual({ TOKEN: "abc" });
  });

  it("handles double-quoted values with escapes", () => {
    expect(parseDotenv('MSG="hello\\nworld"')).toEqual({ MSG: "hello\nworld" });
  });

  it("handles single-quoted values literally", () => {
    expect(parseDotenv("MSG='a b c'")).toEqual({ MSG: "a b c" });
  });

  it("strips inline comments from unquoted values", () => {
    expect(parseDotenv("PORT=3000 # the port")).toEqual({ PORT: "3000" });
  });

  it("keeps '#' inside quoted values", () => {
    expect(parseDotenv('PASS="a#b"')).toEqual({ PASS: "a#b" });
  });
});
