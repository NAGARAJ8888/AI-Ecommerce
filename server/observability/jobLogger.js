import { logger as baseLogger } from "../utils/logger.js";

/**
 * Job/work-queue logs wrapper.
 * Must be resilient when Redis/queues are unavailable; only logs.
 */
export function jobInfo(message, meta = {}) {
  return baseLogger.info(message, meta);
}

export function jobWarn(message, meta = {}) {
  return baseLogger.warn(message, meta);
}

export function jobError(message, meta = {}) {
  return baseLogger.error(message, meta);
}

