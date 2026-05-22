import { recommendationQueue } from "../queues/recommendationQueue.js";
import { logger } from "../utils/logger.js";

/**
 * Enqueue recommendation refresh job.
 *
 * Controllers should never call bullmq directly; they call this enqueue helper instead.
 */
export async function enqueueRecommendationRefresh({ userId, limit, source = "api" }) {
  const jobId = `user:${userId}:limit:${limit}:source:${source}`;

  const job = await recommendationQueue.add(
    "refresh",
    {
      userId,
      limit,
      source
    },
    {
      jobId,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000
      },
      // Non-blocking: return immediately after enqueue.
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  );

  logger.info(`[BullMQ] Enqueued recommendation job ${job.id} for user ${userId}`);
  return job;
}

