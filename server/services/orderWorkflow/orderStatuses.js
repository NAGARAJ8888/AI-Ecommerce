/**
 * Central canonical order statuses.
 *
 * IMPORTANT:
 * - STEP 1 keeps backward compatibility by allowing legacy values
 *   currently stored in Mongo (e.g. "Processing", "Shipped", "Delivered", "Cancelled").
 */

export const ORDER_STATUSES = Object.freeze({
  PENDING: "PENDING",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAID: "PAID",

  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",

  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED"
});

// Legacy values currently used in the DB / controllers
export const LEGACY_ORDER_STATUSES = Object.freeze([
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled"
]);

export const ALL_ALLOWED_ORDER_STATUS_VALUES = Object.freeze([
  // Canonical values
  ...Object.values(ORDER_STATUSES),
  // Legacy values
  ...LEGACY_ORDER_STATUSES
]);

export const ORDER_STATUS_ALIASES = Object.freeze({
  // Map legacy to canonical for future workflow rules.
  Processing: ORDER_STATUSES.PROCESSING,
  Shipped: ORDER_STATUSES.SHIPPED,
  Delivered: ORDER_STATUSES.DELIVERED,
  Cancelled: ORDER_STATUSES.CANCELLED
});

