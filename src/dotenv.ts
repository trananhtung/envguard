/**
 * A minimal, dependency-free `.env` parser — just enough for the CLI and tests.
 * Not a full dotenv replacement; it covers the common `KEY=VALUE` shapes.
 */

/**
 * Parse the contents of a `.env` file into a plain record.
 *
 * Supports comments (`#`), blank lines, optional `export ` prefixes, and single
 * or double quoted values (with `\n` expansion inside double quotes).
 */
export function parseDotenv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const withoutExport = line.startsWith("export ") ? line.slice(7) : line;
    const eq = withoutExport.indexOf("=");
    if (eq === -1) continue;

    const key = withoutExport.slice(0, eq).trim();
    if (key === "") continue;

    let value = withoutExport.slice(eq + 1).trim();

    if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
      value = value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    } else if (value.length >= 2 && value[0] === "'" && value[value.length - 1] === "'") {
      value = value.slice(1, -1);
    } else {
      // Strip trailing inline comment for unquoted values.
      const hash = value.indexOf(" #");
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    out[key] = value;
  }

  return out;
}
