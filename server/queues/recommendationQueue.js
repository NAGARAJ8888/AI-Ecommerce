import { Queue } from "bullmq";
import { redisConnection } from "./queueConnection.js";

/**
 * Queue for background recommendation refresh jobs.
 */
export const recommendationQueue = new Queue(
  "recommendation.refresh",
  {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 2000
    }
  }
);



