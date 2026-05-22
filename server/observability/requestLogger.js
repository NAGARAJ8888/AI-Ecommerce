import { randomUUID } from "crypto";
import { logger as baseLogger } from "../utils/logger.js";

const REQUEST_ID_HEADER = "x-request-id";

function getOrCreateRequestId(req) {
  // Prefer incoming request id for traceability.
  const incoming = req.headers?.[REQUEST_ID_HEADER] || req.headers?.[REQUEST_ID_HEADER.toLowerCase()];
  if (typeof incoming === "string" && incoming.trim().length > 0) return incoming;
  return randomUUID();
}

/**
 * Express middleware:
 * - adds req.requestId
 * - attaches logger child context
 * - logs start/end with duration + status
 */
export function requestLogger(req, res, next) {
  const requestId = getOrCreateRequestId(req);
  req.requestId = requestId;

  // Attach correlation id to response too.
  res.setHeader(REQUEST_ID_HEADER, requestId);

  // Best-effort: add logger context without breaking existing usage.
  req.logger = baseLogger.child({ requestId });

  const start = Date.now();
  req.logger.info("request_start", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    req.logger.info("request_end", {
      statusCode: res.statusCode,
      durationMs
    });
  });

  res.on("close", () => {
    // close may happen before finish; no-op for now.
  });

  next();
}

export function getRequestId(req) {
  return req?.requestId;
}

