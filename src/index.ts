/**
 * envguard — validate, coerce, and type your environment variables.
 * Zero dependencies, full TypeScript inference.
 *
 * @packageDocumentation
 */

export {
  parseEnv,
  tryParseEnv,
  EnvError,
  type Schema,
  type Infer,
  type EnvIssue,
  type EnvSource,
  type TryResult,
} from "./parse.js";

export {
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
  type Spec,
  type SpecOptions,
  type Validator,
  type EnumValidator,
} from "./validators.js";

export { parseDotenv } from "./dotenv.js";
