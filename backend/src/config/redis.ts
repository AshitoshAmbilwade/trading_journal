// src/config/redis.ts
import { RedisOptions } from "ioredis";
import { WorkerOptions, QueueOptions } from "bullmq";

const REDIS_URL = process.env.REDIS_URL?.trim() || "";

/**
 * Build connection info for ioredis / bullmq.
 * Prefer REDIS_URL (e.g. rediss://default:...@host:6379)
 * Fallback to host/port/password if URL not present.
 */
export const redisConnection: RedisOptions | { url: string } = REDIS_URL
  ? // pass URL style which ioredis/bullmq understand
    ({ url: REDIS_URL } as any)
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_USE_TLS === "true" ? {} : undefined,
      maxRetriesPerRequest: null,
    };

export const queueOptions: QueueOptions = {
  connection: redisConnection as any,
};

export const workerOptions: WorkerOptions = {
  connection: redisConnection as any,
  concurrency: Number(process.env.QUEUE_CONCURRENCY || 3),
};
