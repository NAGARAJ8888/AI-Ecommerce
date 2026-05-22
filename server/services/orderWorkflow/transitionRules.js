import { ORDER_STATUSES } from "./orderStatuses.js";

/**
 * Transition validation rules.
 *
 * STEP 1 foundation only: rules exist and are centralized, but we will
 * not aggressively enforce them everywhere yet to avoid breaking APIs.
 */

// NOTE: Some transitions are intentionally conservative.
export const TRANSITION_RULES = Object.freeze({
  // Payment/setup
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.PAYMENT_PENDING, ORDER_STATUSES.CANCELLED],

  [ORDER_STATUSES.PAYMENT_PENDING]: [
    ORDER_STATUSES.PAID,
    ORDER_STATUSES.PAYMENT_FAILED,
    ORDER_STATUSES.CANCELLED
  ],

  [ORDER_STATUSES.PAYMENT_FAILED]: [ORDER_STATUSES.CANCELLED],

  [ORDER_STATUSES.PAID]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],

  // Fulfillment lifecycle
  [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.PACKED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PACKED]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.REFUNDED],

  // Terminal-like states
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.REFUNDED]: []
});

export function canTransition({ from, to }) {
  if (!from || !to) return false;
  const allowedTos = TRANSITION_RULES[from] || [];
  return allowedTos.includes(to);
}

