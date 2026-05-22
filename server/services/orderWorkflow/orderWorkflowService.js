import {
  ALL_ALLOWED_ORDER_STATUS_VALUES,
  ORDER_STATUS_ALIASES
} from "./orderStatuses.js";
import { canTransition } from "./transitionRules.js";

/**
 * Normalize stored order status (legacy -> canonical) for transition checks.
 */
export function normalizeOrderStatus(status) {
  if (!status) return status;
  return ORDER_STATUS_ALIASES[status] || status;
}

export function validateOrderStatusValue(status) {
  if (!ALL_ALLOWED_ORDER_STATUS_VALUES.includes(status)) {
    return false;
  }
  return true;
}

/**
 * Build a status history entry (auditability foundation).
 */
export function buildStatusHistoryEntry({ status, changedBy, reason }) {
  return {
    status,
    reason: reason || undefined,
    changedBy: changedBy || undefined,
    changedAt: new Date()
  };
}

/**
 * Apply a status transition with validation + history append.
 *
 * STEP 1 scope: This is a foundation utility.
 * Controllers may call it for status writes, but we keep it flexible.
 */
export function applyOrderStatusTransition({ order, nextStatus, changedBy, reason }) {
  const currentStatus = order?.orderStatus;

  if (!validateOrderStatusValue(nextStatus)) {
    throw new Error(`Invalid order status value: ${nextStatus}`);
  }

  const normalizedFrom = normalizeOrderStatus(currentStatus);
  const normalizedTo = normalizeOrderStatus(nextStatus);

  // Transition validation only when both sides are canonical.
  // If legacy value is present, we avoid hard failures in STEP 1.
  const shouldValidate = Boolean(
    normalizedFrom &&
      normalizedTo &&
      normalizedFrom.startsWith("PENDING") === false // harmless; keep conservative
  );

  // More direct check: if transition engine knows about `normalizedFrom`.
  const engineKnowsFrom = typeof canTransition === "function";

  // STEP 2: enforce transitions centrally.
  // We rely on normalizeOrderStatus(...) so legacy values map to canonical ones.
  // If a transition is not allowed by transitionRules.js, we block it.
  if (engineKnowsFrom && normalizedFrom && normalizedTo) {
    if (!canTransition({ from: normalizedFrom, to: normalizedTo })) {
      throw new Error(`Illegal order transition: ${currentStatus} -> ${nextStatus}`);
    }
  }

  // Avoid duplicate history on same status.
  if (currentStatus !== nextStatus) {
    order.orderStatus = nextStatus;

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.statusHistory.push(
      buildStatusHistoryEntry({
        status: nextStatus,
        changedBy,
        reason
      })
    );
  }

  // deliveredAt foundation: only set when entering legacy Delivered.
  if (nextStatus === "Delivered" || nextStatus === "DELIVERED") {
    order.deliveredAt = order.deliveredAt || new Date();
  }

  return order;
}

