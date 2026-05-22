import Payment from "../../models/payment.js";
import Order from "../../models/order.js";
import { workflowInfo, workflowWarn, workflowError } from "../../observability/workflowLogger.js";
import { ReconciliationSkippedError, ReconciliationRepairFailedError } from "./reconciliationErrors.js";
import {
  reconcilePaymentExistsOrderNotFinalized,
  reconcileOrderPaidButPaymentMissing,
  reconcileRefundedPaymentButOrderNotCancelled
} from "./repairStrategies.js";

/**
 * STEP 8: Payment/Order reconciliation foundation.
 *
 * Scope (minimal + safe):
 * 1) Payment exists but Order not finalized correctly
 * 2) Order marked paid but Payment record missing
 * 3) Refunded Payment but Order not cancelled
 *
 * This service is idempotent/retry-safe by relying on existing uniqueness + workflow enforcement.
 */

function normalizeContext(meta = {}) {
  return {
    provider: meta.provider,
    transactionId: meta.transactionId,
    providerEventId: meta.providerEventId,
    idempotencyKey: meta.idempotencyKey,
    userId: meta.userId,
    amount: meta.amount,
    changedBy: meta.changedBy
  };
}

function safeProviderTransaction(provider, transactionId) {
  return { provider, transactionId };
}

export async function reconcilePaymentOrderConsistency({ paymentId, orderId, context = {}, correlation }) {
  const ctx = normalizeContext({ ...context, ...(correlation || {}) });
  const { provider, transactionId, userId } = ctx;

  const runMeta = {
    paymentId: paymentId?.toString?.(),
    orderId: orderId?.toString?.(),
    provider,
    transactionId
  };

  workflowInfo("reconciliation_attempt", runMeta);

  try {
    // Decide repair route based on what we know.
    // If we have a paymentId, use it as source of truth for refunded-status repairs.
    // If we have an orderId, use it for paid-status repairs.

    if (paymentId && orderId) {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new ReconciliationRepairFailedError({ message: "Payment not found for reconciliation", details: { paymentId } });
      }

      // Case 3: refunded payment but order not cancelled
      const resRefund = await reconcileRefundedPaymentButOrderNotCancelled({
        orderId,
        paymentId,
        context: { ...ctx, provider: payment.provider, userId: payment.user }
      });

      if (resRefund.action === "repaired" || resRefund.action === "skip") {
        workflowInfo("reconciliation_result", { ...runMeta, scenario: "refunded_payment" , action: resRefund.action, reason: resRefund.reason});
        return { ...resRefund };
      }
    }

    if (orderId && paymentId) {
      // Case 1: payment exists but order not finalized
      const payment = await Payment.findById(paymentId);
      if (payment && payment.status === "completed") {
        const res1 = await reconcilePaymentExistsOrderNotFinalized({
          orderId,
          paymentId,
          context: {
            ...ctx,
            provider: payment.provider,
            transactionId: payment.transactionId,
            userId: payment.user?.toString?.() || ctx.userId,
            changedBy: ctx.changedBy || userId
          }
        });

        workflowInfo("reconciliation_result", { ...runMeta, scenario: "payment_exists_order_not_finalized", action: res1.action, reason: res1.reason });
        return { ...res1 };
      }
    }

    if (orderId) {
      // Case 2: order marked paid but payment missing
      // We need provider + transactionId from order.paymentInfo.id.
      const order = await Order.findById(orderId);
      if (!order) {
        throw new ReconciliationRepairFailedError({ message: "Order not found for reconciliation", details: { orderId } });
      }

      const paymentInfo = order.paymentInfo || {};
      const txId = paymentInfo.id;

      if (paymentInfo.status === "paid" && txId) {
        // provider is not stored in order.paymentInfo currently; use context.provider if passed.
        // If not passed, we cannot safely create the payment (provider required for uniqueness).
        if (!ctx.provider) {
          workflowWarn("reconciliation_skipped_provider_missing", { orderId: order._id?.toString?.(), reason: "provider_required_for_payment_creation" });
          throw new ReconciliationSkippedError({ reason: "provider_missing" });
        }

        const res2 = await reconcileOrderPaidButPaymentMissing({
          orderId,
          context: {
            ...ctx,
            provider: ctx.provider,
            transactionId: txId,
            userId: order.user?.toString?.() || ctx.userId,
            amount: order.totalPrice,
            changedBy: ctx.changedBy
          }
        });

        workflowInfo("reconciliation_result", { ...runMeta, scenario: "order_marked_paid_payment_missing", action: res2.action, reason: res2.reason });
        return res2;
      }
    }

    workflowWarn("reconciliation_no_op", { ...runMeta, reason: "no_target_case_detected" });
    throw new ReconciliationSkippedError({ reason: "no_target_case_detected" });
  } catch (err) {
    if (err instanceof ReconciliationSkippedError) {
      workflowInfo("reconciliation_skipped", { ...runMeta, reason: err.details?.reason || "skipped" });
      return { action: "skip", reason: err.details?.reason || "skipped" };
    }

    workflowError("reconciliation_failed", { ...runMeta, error: err?.message });
    throw err instanceof ReconciliationRepairFailedError ? err : new ReconciliationRepairFailedError({ message: err?.message, details: { ...runMeta } });
  }
}

/**
 * Job-compatible entrypoint.
 * A queue worker will call this with a payload.
 */
export async function reconcilePaymentOrderConsistencyJob(payload) {
  const { paymentId, orderId, context, correlation } = payload || {};
  return reconcilePaymentOrderConsistency({ paymentId, orderId, context, correlation });
}



