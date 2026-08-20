import { Queue } from "bullmq";
import IORedis from "ioredis";

let queue: Queue | undefined;
let connection: IORedis | undefined;

export function getRedis() {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getGenerationQueue() {
  if (!queue) {
    queue = new Queue(process.env.GENERATION_QUEUE ?? "generation", { connection: getRedis() });
  }
  return queue;
}

export async function enqueueGeneration(jobId: string) {
  await getGenerationQueue().add(
    "generate",
    { jobId },
    {
      jobId,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
}
