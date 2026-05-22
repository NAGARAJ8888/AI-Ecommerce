
import IORedis from "ioredis";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  connectTimeout: 1000,
  lazyConnect: true
});

export function logQueueConnectionInfo() {
  logger.info(`[BullMQ] Redis URL: ${redisUrl}`);
}

