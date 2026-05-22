import { reconciliationQueue } from "./reconciliationQueue.js";
import { jobInfo } from "../observability/jobLogger.js";

function buildDedupJobId({ paymentId, orderId, scanType, sinceTs }) {
  if (scanType) return `scan:${scanType}:since:${sinceTs}`;
  return `repair:${paymentId || ""}:${orderId || ""}`;
}

/**
 * STEP 9: Central enqueue service.
 *
 * Production-safe rules:
 * - deterministic jobId for dedup
 * - attempts + exponential backoff
 */
export async function enqueueReconciliationRepair({
  paymentId,
  orderId,
  context = {},
  correlation = {},
  scanType,
  sinceTs
}) {
  const jobId = buildDedupJobId({ paymentId, orderId, scanType, sinceTs });

  const job = await reconciliationQueue.add(
    "repair",
    {
      paymentId,
      orderId,
      context,
      correlation,
      scanType,
      sinceTs
    },
    {
      jobId,
      attempts: 7,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  );

  jobInfo("reconciliation_job_enqueued", {
    jobId: job.id,
    paymentId: paymentId || null,
    orderId: orderId || null,
    scanType: scanType || null,
    correlation
  });

  return job;
}

