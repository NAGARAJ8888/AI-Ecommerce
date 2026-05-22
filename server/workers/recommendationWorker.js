import { Worker } from "bullmq";
import { redisConnection } from "../queues/queueConnection.js";
import { getRecommendationsControllerSafe } from "./workerUtils.js";
import Recommendation from "../models/recommendation.js";
import User from "../models/user.js";
import Activity from "../models/activity.js";
import { logger } from "../utils/logger.js";
import { getAIRecommendations, getPersonalizedRecommendations } from "../services/recommendationService.js";

// Minimal, local implementation of generateRecommendations (kept aligned with recommendationController behavior)
async function generateRecommendationsForUser(userId, limit) {
  const user = await User.findById(userId).populate("browsingHistory.product", "category tags price");
  const userActivities = await Activity.find({ user: userId, action: "purchase" }).populate("product", "category tags price");

  let recommendedProducts = [];
  let reason = "Based on your browsing history and preferences";

  try {
    recommendedProducts = await getAIRecommendations(userId, limit);
    reason = "AI-powered personalized recommendations";
  } catch (error) {
    logger.warn("AI recommendations failed in worker, falling back");
    recommendedProducts = await getPersonalizedRecommendations(userId, limit);
  }

  const recommendation = await Recommendation.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      recommendedProducts: recommendedProducts.map(p => p._id),
      reason
    },
    { new: true, upsert: true }
  );

  return recommendation;
}

export function startRecommendationWorker() {
  const worker = new Worker(
    "recommendation.refresh",
    async (job) => {
      const { userId, limit } = job.data || {};

      if (!userId) throw new Error("Missing userId for recommendation refresh job");
      const finalLimit = parseInt(limit) || 10;

      const recommendation = await generateRecommendationsForUser(userId, finalLimit);
      await recommendation.populate("recommendedProducts", "name price images discountPrice ratings slug");

      return {
        userId,
        limit: finalLimit,
        reason: recommendation.reason,
        recommendedProducts: recommendation.recommendedProducts
      };
    },
    {
      connection: redisConnection,
      concurrency: 2,
      // Retry/backoff is configured on enqueue; also set safety retries here.
      // This ensures worker-level resilience if jobs are added elsewhere.
      settings: {
        // Helps with stuck jobs.
        stalledInterval: 30000
      }
    }
  );

  worker.on("completed", (job) => {
    logger.info(`[BullMQ] recommendation job completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[BullMQ] recommendation job failed: ${job?.id} attempts=${job?.attemptsMade}`, err);
  });

  return worker;
}

