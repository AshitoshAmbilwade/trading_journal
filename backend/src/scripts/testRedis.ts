// src/scripts/testRedis.ts
import path from "node:path";
import dotenv from "dotenv";
import IORedis from "ioredis";

const projectRootEnv = path.resolve(process.cwd(), ".env");
dotenv.config({ path: projectRootEnv });

// extra fallback if running from src/
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const RedisCtor: any = (IORedis as any).default ? (IORedis as any).default : IORedis;

const url = process.env.REDIS_URL?.trim();
let client: any;

if (url) {
  console.log("Using REDIS_URL (string) for connection");
  client = new RedisCtor(url); // <- pass URL directly
} else {
  console.log("No REDIS_URL found, using host/port fallback");
  client = new RedisCtor({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_USE_TLS === "true" ? {} : undefined,
  });
}

client.on("error", (err: any) => {
  console.error("[ioredis] error event:", err && err.message ? err.message : err);
});
client.on("connect", () => console.log("[ioredis] connect event"));
client.on("ready", () => console.log("[ioredis] ready event"));

(async () => {
  try {
    console.log("Working directory:", process.cwd());
    console.log("REDIS_URL present?:", !!url);
    const pong = await client.ping();
    console.log("PING ->", pong);
    await client.set("tj_test_key", "ok");
    const v = await client.get("tj_test_key");
    console.log("SET/GET ->", v);
  } catch (e) {
    console.error("Redis test error:", e);
  } finally {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }
})();
