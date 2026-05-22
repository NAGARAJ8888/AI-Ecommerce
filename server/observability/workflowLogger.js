import { logger as baseLogger } from "../utils/logger.js";

/**
 * Centralized workflow/event logs.
 * Keep it lightweight and production-safe.
 */
export function workflowInfo(message, meta = {}) {
  return baseLogger.info(message, meta);
}

export function workflowWarn(message, meta = {}) {
  return baseLogger.warn(message, meta);
}

export function workflowError(message, meta = {}) {
  return baseLogger.error(message, meta);
}

