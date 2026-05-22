import { enqueueRecommendationRefresh } from "../jobs/enqueueRecommendationRefresh.js";

/**
 * Centralized queue enqueue service for recommendations.
 *
 * Controllers should call into this service and NEVER interact with BullMQ directly.
 */
export const recommendationQueueService = {
  enqueueRefresh: ({ userId, limit, source }) =>
    enqueueRecommendationRefresh({ userId, limit, source })
};

