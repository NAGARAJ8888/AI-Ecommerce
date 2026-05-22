import Order from "../../models/order.js";
import Payment from "../../models/payment.js";
import { verifyPaymentAndFinalize } from "../paymentWorkflow/paymentWorkflowService.js";
import { workflowInfo, workflowWarn, workflowError } from "../../observability/workflowLogger.js";
import { applyOrderStatusTransition } from "../orderWorkflow/orderWorkflowService.js";

import { ReconciliationRepairFailedError } from "./reconciliationErrors.js";

function orderIsPaid(order) {
  const paymentInfoStatus = order?.paymentInfo?.status;
  const orderStatus = order?.orderStatus;
  return paymentInfoStatus === "paid" || orderStatus === "Delivered" || orderStatus === "DELIVERED";
}

function orderIsCancelled(order) {
  const paymentInfoStatus = order?.paymentInfo?.status;
  const orderStatus = order?.orderStatus;
  return paymentInfoStatus === "refunded" || orderStatus === "Cancelled" || orderStatus === "CANCELLED";
}

export async function reconcilePaymentExistsOrderNotFinalized({ orderId, paymentId, context }) {
  const { provider, transactionId, userId } = context;

  const order = await Order.findById(orderId);
  if (!order) return { action: "skip", reason: "order_not_found" };

  if (orderIsPaid(order) || orderIsCancelled(order)) {
    return { action: "skip", reason: "already_consistent" };
  }

  // Repair: safely finalize order using the existing centralized workflow.
  await verifyPaymentAndFinalize({
    provider,
    transactionId,
    providerEventId: context.providerEventId,
    idempotencyKey: context.idempotencyKey,
    userId,
    orderId,
    amount: undefined,
    changedBy: context.changedBy || userId
  });

  workflowInfo("reconciliation_repaired_payment_exists_order_not_finalized", {
    orderId: orderId?.toString(),
    paymentId: paymentId?.toString(),
    provider
  });

  return { action: "repaired", reason: "order_finalized" };
}

export async function reconcileOrderPaidButPaymentMissing({ orderId, context }) {
  const { provider, transactionId, userId, amount, changedBy } = context;

  const order = await Order.findById(orderId);
  if (!order) return { action: "skip", reason: "order_not_found" };

  if (!order.paymentInfo?.id || order.paymentInfo.status !== "paid") {
    // Minimal STEP 8 scope: only handle cases where order is marked paid with paymentInfo.id.
    return { action: "skip", reason: "not_in_target_case" };
  }

  const existingPayment = await Payment.findOne({ provider, transactionId });
  if (existingPayment) {
    return { action: "skip", reason: "already_consistent" };
  }

  // Repair strategy: create the Payment by running the verification finalizer.
  // verifyPaymentAndFinalize will attempt Payment creation via unique indexes.
  await verifyPaymentAndFinalize({
    provider,
    transactionId,
    providerEventId: context.providerEventId,
    idempotencyKey: context.idempotencyKey,
    userId,
    orderId,
    amount: amount ?? order.totalPrice,
    changedBy: changedBy || userId
  });

  return { action: "repaired", reason: "payment_record_created" };
}

export async function reconcileRefundedPaymentButOrderNotCancelled({ orderId, paymentId, context }) {
  const { provider, userId } = context;

  const order = await Order.findById(orderId);
  if (!order) return { action: "skip", reason: "order_not_found" };

  if (orderIsCancelled(order)) {
    return { action: "skip", reason: "already_consistent" };
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return { action: "skip", reason: "payment_not_found" };
  }

  if (payment.status !== "refunded") {
    return { action: "skip", reason: "payment_not_refunded" };
  }

  // Repair: transition order to Cancelled via workflow enforcement.
  // Use order.paymentInfo mutation only through existing centralized checks.
  order.paymentInfo = {
    id: payment.transactionId,
    status: "refunded"
  };

  applyOrderStatusTransition({
    order,
    nextStatus: "Cancelled",
    changedBy: context.changedBy || userId,
    reason: "reconciliation_refund_processed"
  });

  await order.save();
  return { action: "repaired", reason: "order_cancelled" };
}

