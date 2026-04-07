import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let redisClient = null;

if (REDIS_URL) {
    // We use global to prevent memory leaks in Next.js during local development (HMR)
    if (!global.redisClient) {
        global.redisClient = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times >= 3) return null; // Don't retry indefinitely
                return Math.min(times * 50, 2000);
            }
        });
        console.log('[REDIS] 🚀 Enterprise Redis connection established!');
    }
    redisClient = global.redisClient;
} else {
    // This is expected and safe! 
    console.warn('[REDIS] ℹ️  No REDIS_URL provided. App is gracefully falling back to Memory & MongoDB.');
}

export default redisClient;
