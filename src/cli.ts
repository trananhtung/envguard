#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseDotenv } from "./dotenv.js";

const HELP = `envguard — fail fast when required environment variables are missing

Usage:
  envguard --require KEY1,KEY2[,...] [--file .env]

Options:
  --require, -r <keys>   Comma-separated list of variables that must be present
  --file, -f <path>      Also load this .env file (merged over process.env)
  --help, -h             Show this help

Exit codes: 0 = all present, 1 = one or more missing.

Examples:
  envguard --require DATABASE_URL,PORT
  envguard -r STRIPE_KEY,REDIS_URL -f .env.production`;

function main(argv: string[]): number {
  const args = argv.slice();
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    process.stdout.write(HELP + "\n");
    return args.length === 0 ? 1 : 0;
  }

  const getOpt = (long: string, short: string): string | undefined => {
    const i = args.findIndex((a) => a === long || a === short);
    return i === -1 ? undefined : args[i + 1];
  };

  const requireRaw = getOpt("--require", "-r");
  if (!requireRaw) {
    process.stderr.write("envguard: --require <keys> is required\n");
    return 1;
  }
  const keys = requireRaw.split(",").map((k) => k.trim()).filter(Boolean);

  const source: Record<string, string | undefined> = { ...process.env };
  const file = getOpt("--file", "-f");
  if (file) {
    try {
      Object.assign(source, parseDotenv(readFileSync(file, "utf8")));
    } catch (err) {
      process.stderr.write(`envguard: cannot read ${file}: ${(err as Error).message}\n`);
      return 1;
    }
  }

  const missing = keys.filter((k) => source[k] === undefined || source[k] === "");
  if (missing.length > 0) {
    process.stderr.write(`envguard: missing required variable(s):\n`);
    for (const k of missing) process.stderr.write(`  • ${k}\n`);
    return 1;
  }

  process.stdout.write(`envguard: all ${keys.length} required variable(s) present\n`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
