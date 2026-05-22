import { enqueueReconciliationRepair } from "../../queues/reconciliationQueueService.js";

/**
 * STEP 9 enqueue helper for payment/order reconciliation repair jobs.
 */
export async function enqueuePaymentOrderReconciliation({ paymentId, orderId, context = {}, correlation = {} }) {
  return enqueueReconciliationRepair({
    paymentId,
    orderId,
    context,
    correlation
  });
}


