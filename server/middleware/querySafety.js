import { AppError } from "./errorMiddleware.js";

const MAX_REGEX_CHARS_FALLBACK = 80;

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

/**
 * STEP 7: querySafety middleware utilities
 * - Removes Mongo operator injection from query params/body.
 * - Caps regex payloads by refusing overly-long strings.
 *
 * Note: This does NOT fully validate schemas; it only strips unsafe patterns.
 */
export function stripMongoOperators(input) {
  if (Array.isArray(input)) {
    return input.map(stripMongoOperators);
  }
  if (!isPlainObject(input)) return input;

  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (k.startsWith("$")) continue; // operator injection
    out[k] = stripMongoOperators(v);
  }
  return out;
}

export function capRegexInputs(input, { maxRegexChars = MAX_REGEX_CHARS_FALLBACK } = {}) {
  if (Array.isArray(input)) return input.map((x) => capRegexInputs(x, { maxRegexChars }));
  if (!isPlainObject(input)) {
    if (typeof input === "string" && input.length > maxRegexChars) return undefined;
    return input;
  }

  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (k === "$regex" && typeof v === "string" && v.length > maxRegexChars) {
      continue;
    }
    if (k === "$options") continue;
    const next = capRegexInputs(v, { maxRegexChars });
    if (next !== undefined) out[k] = next;
  }
  return out;
}

/**
 * Middleware: strips dangerous Mongo operators from req.query and req.body.
 * Applies lightly to avoid breaking legitimate requests.
 */
export function querySafety(req, res, next) {
  try {
    if (req?.query) {
      req.query = stripMongoOperators(req.query);
      req.query = capRegexInputs(req.query);
    }
    if (req?.body && isPlainObject(req.body)) {
      req.body = stripMongoOperators(req.body);
      req.body = capRegexInputs(req.body);
    }
    next();
  } catch (e) {
    next(new AppError("Invalid request payload", 400));
  }
}

