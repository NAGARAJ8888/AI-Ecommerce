import { Worker } from "bullmq";
import { redisConnection } from "../queues/queueConnection.js";
import { jobError, jobInfo, jobWarn } from "../observability/jobLogger.js";
import { workflowInfo, workflowWarn, workflowError } from "../observability/workflowLogger.js";
import { reconcilePaymentOrderConsistencyJob } from "../services/reconciliation/paymentOrderReconciliationService.js";
import { ReconciliationRepairFailedError } from "../services/reconciliation/reconciliationErrors.js";

function extractCorrelation(job) {
  const { correlation } = job?.data || {};
  return correlation || {};
}

/**
 * STEP 9: reconciliation worker
 *
 * - retries: configured on enqueue + worker-level safety
 * - exponential backoff: configured on enqueue
 * - dedup: deterministic jobId from enqueue service
 */
export function startReconciliationWorker() {
  const worker = new Worker(
    "reconciliation.paymentOrder",
    async (job) => {
      const { paymentId, orderId, context, correlation, scanType, sinceTs } = job.data || {};

      const retryAttempt = job?.attemptsMade || 0;
      const correlationMeta = extractCorrelation(job);

      const runMeta = {
        requestId: correlationMeta.requestId,
        correlation: correlationMeta,
        retryAttempt,
        scanType: scanType || null,
        sinceTs: sinceTs || null,
        paymentId: paymentId || null,
        orderId: orderId || null
      };

      workflowInfo("reconciliation_started", runMeta);
      jobInfo("reconciliation_job_started", runMeta);

      // correlation/requestId are best-effort for logs; pass through to service.
      const result = await reconcilePaymentOrderConsistencyJob({
        paymentId,
        orderId,
        context: context || {},
        correlation: {
          ...correlationMeta,
          requestId: correlationMeta.requestId || correlationMeta.request_id
        }
      });

      // Determine mismatch detection signals
      if (result?.action === "repaired") {
        workflowInfo("reconciliation_repair_applied", {
          ...runMeta,
          scenario: result?.scenario,
          reason: result?.reason,
          action: result?.action
        });
      } else if (result?.action === "skip") {
        workflowInfo("reconciliation_repair_skipped", {
          ...runMeta,
          reason: result?.reason,
          action: result?.action
        });
      } else {
        workflowInfo("reconciliation_detected_mismatch", {
          ...runMeta,
          action: result?.action,
          reason: result?.reason
        });
      }

      return result;
    },
    {
      connection: redisConnection,
      concurrency: 2,
      settings: {
        stalledInterval: 30000
      }
    }
  );

  worker.on("completed", (job, res) => {
    workflowInfo("reconciliation_job_completed", {
      orderId: job?.data?.orderId || null,
      paymentId: job?.data?.paymentId || null,
      jobId: job?.id,
      resultAction: res?.action || null
    });
  });

  worker.on("failed", (job, err) => {
    const retryAttempt = job?.attemptsMade || 0;
    const meta = {
      jobId: job?.id,
      orderId: job?.data?.orderId || null,
      paymentId: job?.data?.paymentId || null,
      retryAttempt,
      error: err?.message
    };

    if (job?.attemptsMade >= (job?.opts?.attempts || 0) && err instanceof ReconciliationRepairFailedError) {
      workflowError("reconciliation_permanent_failure", meta);
    } else {
      workflowError("reconciliation_failed", meta);
    }

    jobError("reconciliation_job_failed", meta);
  });

  return worker;
}

