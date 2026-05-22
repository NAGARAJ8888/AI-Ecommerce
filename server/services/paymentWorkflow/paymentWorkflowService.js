import Payment from "../../models/payment.js";
import Order from "../../models/order.js";
import { applyOrderStatusTransition } from "../orderWorkflow/orderWorkflowService.js";
import {
  PaymentAlreadyProcessedError,
  ProviderEventAlreadyProcessedError,
  PaymentOrderMismatchError,
  PaymentRefundAlreadyProcessedError,
  PaymentInvalidStateError
} from "./paymentErrors.js";

import {
  findPaymentByProviderTransaction,
  findPaymentByProviderEvent,
  tryCreatePaymentWithIdempotency,
  markRefundIdempotent
} from "./paymentIdempotencyService.js";

/**
 * Centralized payment correctness + idempotency foundation (STEP 4).
 *
 * Important:
 * - No distributed locks
 * - Uniqueness is enforced by Mongo unique index on { provider, transactionId }
 * - Duplicate requests are handled by catching duplicate key errors and
 *   returning the existing Payment/order result.
 */

function getDuplicateKeyErrorKind(err) {
  // Mongo duplicate key errors generally contain these codes.
  // Keep tolerant to Mongo versions.
  const code = err?.code;
  const msg = String(err?.message || "");
  if (code === 11000) return "duplicate_key";
  if (/E11000|duplicate key/i.test(msg)) return "duplicate_key";
  return null;
}

function isOrderPaidLike(order) {
  const status = order?.orderStatus;
  // Legacy success status in this codebase is "Delivered".
  return status === "Delivered" || status === "DELIVERED";
}



export async function verifyPaymentAndFinalize({
  provider,
  transactionId,
  providerEventId,
  idempotencyKey,
  userId,
  orderId,
  amount,
  changedBy
}) {
  if (!provider || !transactionId) {
    throw new PaymentInvalidStateError("Missing provider/transactionId", {
      provider,
      transactionId
    });
  }

  // 1) Fast replay check by providerEventId (foundation-level)
  if (providerEventId) {
    const existingByEvent = await findPaymentByProviderEvent({ provider, providerEventId });
    if (existingByEvent) {
      throw new ProviderEventAlreadyProcessedError({
        provider,
        providerEventId,
        paymentId: existingByEvent._id,
        payment: existingByEvent
      });
    }
  }

  // 2) Idempotency check by transactionId
  const existing = await findPaymentByProviderTransaction({ provider, transactionId });
  if (existing) {
    throw new PaymentAlreadyProcessedError({
      provider,
      transactionId,
      paymentId: existing._id,
      payment: existing
    });
  }

  // 3) Correctness checks on order
  const order = await Order.findById(orderId);
  if (!order) throw new PaymentInvalidStateError("Order not found", { orderId });

  // Ownership correctness: payment endpoints are protected; still validate.
  if (order.user?.toString?.() !== userId?.toString?.()) {
    throw new PaymentOrderMismatchError({ orderId });
  }

  if (isOrderPaidLike(order)) {
    // If order is already paid, treat it as duplicate verification.
    throw new PaymentAlreadyProcessedError({
      provider,
      transactionId,
      paymentId: null,
      payment: null,
      details: { reason: "order already paid" }
    });
  }

  if (order.orderStatus === "Cancelled") {
    throw new PaymentInvalidStateError("Cannot finalize payment for cancelled order", {
      orderId
    });
  }

  // 4) Mutations: write Payment first using unique index semantics.
  // If concurrent duplicate request happens, unique index prevents double rows.
  const paymentDoc = {
    user: userId,
    order: order._id,
    amount: amount ?? order.totalPrice,
    provider,
    status: "completed",
    transactionId,
    providerEventId: providerEventId || undefined,
    idempotencyKey: idempotencyKey || undefined
  };

  let created;
  try {
    created = await tryCreatePaymentWithIdempotency({ paymentDoc });
  } catch (err) {
    const kind = getDuplicateKeyErrorKind(err);
    if (kind === "duplicate_key") {
      const existingAfterDup = await findPaymentByProviderTransaction({ provider, transactionId });
      if (existingAfterDup) {
        throw new PaymentAlreadyProcessedError({
          provider,
          transactionId,
          paymentId: existingAfterDup._id,
          payment: existingAfterDup,
          details: { reason: "duplicate key on create" }
        });
      }
    }
    throw err;
  }

  // 5) Centralized order mutation: applyOrderStatusTransition only once.
  // Even with unique index, ordering is still possible in race windows:
  // - payment row creation may succeed but order transition fails.
  // Order transition engine prevents illegal transitions.
  order.paymentInfo = {
    id: transactionId,
    status: "paid",
    provider,
    providerEventId: providerEventId || undefined
  };

  // Legacy behavior: success UI expects Delivered.
  applyOrderStatusTransition({
    order,
    nextStatus: "Delivered",
    changedBy,
    reason: "payment_verified"
  });

  await order.save();

  return created;
}

export async function refundPaymentIdempotent({
  paymentId,
  provider,
  refundId,
  changedBy
}) {
  const p = paymentId ? await Payment.findById(paymentId) : null;

  if (!p) throw new PaymentInvalidStateError("Payment not found", { paymentId });

  if (p.provider !== provider) {
    // Provider mismatch is a correctness issue.
    throw new PaymentOrderMismatchError({ paymentId, orderId: p.order });
  }

  if (p.status === "refunded") {
    // Idempotency: return safely, do NOT re-transition order.
    throw new PaymentRefundAlreadyProcessedError({ paymentId: p._id, payment: p });
  }

  // Process refund (STEP 4: foundation - provider refund call not implemented here)
  await markRefundIdempotent({
    payment: p,
    refundStatus: "refunded",
    refundId,
    changedAt: new Date()
  });


  const order = await Order.findById(p.order);
  if (!order) throw new PaymentInvalidStateError("Order not found for payment", { orderId: p.order });

  // Correctness: refunded means Cancelled in existing order workflow.
  if (order.orderStatus === "Cancelled") {
    // Avoid double order transition.
    return p;
  }

  order.paymentInfo = {
    id: p.transactionId,
    status: "refunded",
    provider: p.provider,
    providerEventId: p.providerEventId
  };

  applyOrderStatusTransition({
    order,
    nextStatus: "Cancelled",
    changedBy,
    reason: "refund_processed"
  });

  await order.save();
  return p;
}

