import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { triggerWebhookJob } from "@/lib/webhookWorker";

const REDIS_URL = process.env.REDIS_URL;

export let cepQueue = null;
export let cepWorker = null;

if (REDIS_URL) {
    // BullMQ requires maxRetriesPerRequest: null, and a TCP connection (RESP)
    // Upstash RESP requires TLS (rediss://), which ioredis handles automatically if the prefix is right
    const connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
    });

    if (!global.cepQueue) {
        global.cepQueue = new Queue("cep-scraping", { connection });
        console.log("[BULLMQ] 🚀 Hybrid Queue Initialized (via Upstash RESP)");

        // Initialize the background worker
        global.cepWorker = new Worker(
            "cep-scraping",
            async (job) => {
                console.log(`[BULLMQ] Processing Job ID: ${job.id}`);
                const { queryData, captchaConfig, webhookUrl } = job.data;

                await triggerWebhookJob(queryData, captchaConfig, webhookUrl);
            },
            { connection },
        );

        // Worker error logging
        global.cepWorker.on("failed", (job, err) => {
            console.error(
                `[BULLMQ] ❌ Job ${job.id} failed:`,
                err.message,
            );
        });
    }

    cepQueue = global.cepQueue;
    cepWorker = global.cepWorker;
} else {
    console.warn(
        "[BULLMQ] ℹ️  No REDIS_URL provided. BullMQ Message Queue skipped.",
    );
}

