// src/queue/aiQueue.ts
import { Queue } from "bullmq";
import { queueOptions } from "../config/redis.js";

/**
 * AI Processing Queue
 * - Handles trade/weekly/monthly summaries
 * - Rate limited to avoid Bytez throttling
 * - Retries for network errors
 */

export const aiQueue = new Queue("ai-processing", {
  connection: queueOptions.connection,

  // Optional but recommended for real production
  defaultJobOptions: {
    attempts: 3,               // retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 2000,             // 2s → 4s → 8s
    },
    removeOnComplete: 50,      // keep last 50 jobs
    removeOnFail: false,
  },

  // prevent Bytez rate-limit
  limiter: {
    max: 5,       // 5 jobs
    duration: 1000 // per second
  }
} as any);
