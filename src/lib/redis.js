import { Redis } from '@upstash/redis';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient = null;

if (REST_URL && REST_TOKEN) {
    // Use global to maintain the client across HMR in dev
    if (!global.upstashRestClient) {
        global.upstashRestClient = new Redis({
            url: REST_URL,
            token: REST_TOKEN,
        });
        console.log('[REDIS] ⚡ Upstash REST client connection established!');
    }
    redisClient = global.upstashRestClient;
} else {
    console.warn('[REDIS] ℹ️  Upstash REST credentials missing. Falling back to memory.');
}

export default redisClient;

