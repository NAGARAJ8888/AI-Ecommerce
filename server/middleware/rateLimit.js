import { AppError } from "./errorMiddleware.js";

// In-memory, per-process rate limiting foundation (STEP 7).
// Production note: for multi-instance deployments, use Redis-based rate limiting later.

const DEFAULTS = {
  windowMs: 60_000,
  max: 30,
  message: "Too many requests, please retry later",
  statusCode: 429
};

const buckets = new Map();

function keyFor(req) {
  const ip = req.ip || req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim();
  return `${req.method}:${req.baseUrl || ""}:${ip || "unknown"}`;
}

function cleanupBucket(key, now) {
  const bucket = buckets.get(key);
  if (!bucket) return;
  if (bucket.resetAt <= now) buckets.delete(key);
}

export function rateLimit({ windowMs = DEFAULTS.windowMs, max = DEFAULTS.max, message, statusCode } = {}) {
  const conf = { ...DEFAULTS, windowMs, max, message, statusCode };

  return (req, res, next) => {
    const now = Date.now();
    const key = keyFor(req);
    cleanupBucket(key, now);

    const bucket = buckets.get(key) || { count: 0, resetAt: now + conf.windowMs };

    // reset if window elapsed
    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + conf.windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > conf.max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("retry-after", retryAfterSec);
      return res.status(conf.statusCode).json({
        success: false,
        message: conf.message,
        retryAfter: retryAfterSec
      });
    }

    return next();
  };
}

export function rateLimitByRoute() {
  // Lightweight helper: apply in app to known high-risk routes.
  // Keep conservative defaults to avoid breaking normal frontend.
  return {
    auth: rateLimit({ max: 60, windowMs: 60_000 }),
    payment: rateLimit({ max: 20, windowMs: 60_000 }),
    webhook: rateLimit({ max: 10, windowMs: 60_000 })
  };
}

