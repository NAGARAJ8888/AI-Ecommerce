import Payment from "../../models/payment.js";

/**
 * STEP 4: Idempotency primitives.
 *
 * We avoid distributed locks by leaning on:
 * - MongoDB unique indexes (provider + transactionId)
 * - safe retry behavior in controllers/workflow service
 */

export async function findPaymentByProviderTransaction({ provider, transactionId }) {
  if (!provider || !transactionId) return null;
  return Payment.findOne({ provider, transactionId });
}

export async function findPaymentById(paymentId) {
  if (!paymentId) return null;
  return Payment.findById(paymentId);
}

/**
 * Idempotency entrypoint for verification.
 *
 * In Step 4 we can only guarantee replay safety for transactionId uniqueness.
 * Provider event tracking is foundation-level and uses providerEventId only
 * if/when it exists.
 */
export async function findPaymentByProviderEvent({ provider, providerEventId }) {
  if (!provider || !providerEventId) return null;
  return Payment.findOne({ provider, providerEventId });
}

export async function tryCreatePaymentWithIdempotency({ paymentDoc }) {
  // Best-effort: attempt creation. If unique constraint trips,
  // caller will fetch existing and return existing result.
  return Payment.create(paymentDoc);
}

export async function markRefundIdempotent({ payment, refundStatus = "refunded", refundId, changedAt }) {
  // Payment model will be the only state store in STEP 4.
  // If payment is already refunded, caller should return idempotent response.
  if (payment.status === refundStatus) return payment;

  payment.status = refundStatus;
  if (refundId) payment.refundId = refundId;
  if (changedAt) payment.refundedAt = changedAt;
  return payment.save();
}

