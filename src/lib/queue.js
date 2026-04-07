import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { triggerWebhookJob } from '@/lib/webhookWorker';

const REDIS_URL = process.env.REDIS_URL;

export let cepQueue = null;
export let cepWorker = null;

if (REDIS_URL) {
    // BullMQ requires maxRetriesPerRequest: null, so we create a dedicated robust connection
    const connection = new IORedis(REDIS_URL, {
        maxRetriesPerRequest: null
    });

    if (!global.cepQueue) {
        global.cepQueue = new Queue('cep-scraping', { connection });
        console.log('[BULLMQ] 🚀 Enterprise Message Queue Initialized');
        
        // Initialize the background worker that constantly listens to the queue
        global.cepWorker = new Worker('cep-scraping', async (job) => {
            console.log(`[BULLMQ] Processing Job ID: ${job.id}`);
            const { queryData, captchaConfig, webhookUrl } = job.data;
            
            // Execute the scraping logic
            await triggerWebhookJob(queryData, captchaConfig, webhookUrl);
            
        }, { connection });

        // Worker error logging
        global.cepWorker.on('failed', (job, err) => {
            console.error(`[BULLMQ] ❌ Job ${job.id} completely failed after retries:`, err.message);
        });
    }

    cepQueue = global.cepQueue;
    cepWorker = global.cepWorker;
} else {
    console.warn('[BULLMQ] ℹ️  No REDIS_URL provided. BullMQ Message Queue gracefully skipped.');
}
