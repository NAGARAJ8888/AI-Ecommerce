import { Queue } from "bullmq";
import { redisConnection } from "./queueConnection.js";

/**
 * BullMQ queue for payment/order reconciliation.
 *
 * STEP 9: production-safe incremental recovery mechanism.
 */
export const reconciliationQueue = new Queue("reconciliation.paymentOrder", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000
  }
});

