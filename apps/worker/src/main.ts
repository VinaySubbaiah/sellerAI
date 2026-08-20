import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processGenerationJob } from "../../api/src/lib/generation-processor.js";
import { logger } from "../../api/src/lib/logger.js";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  process.env.GENERATION_QUEUE ?? "generation",
  async (job) => {
    logger.info({ jobId: job.data.jobId, bullId: job.id }, "worker start");
    await processGenerationJob(job.data.jobId);
  },
  { connection, concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2) },
);

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.data?.jobId, err: err.message }, "worker failed");
});

logger.info("SellerStudio worker listening");
