const { Redis: RestRedis } = require('@upstash/redis');
const { Redis: RespRedis } = require('ioredis');
require('dotenv').config();

async function testHybrid() {
    console.log("--- Testing Hybrid Redis Setup ---");

    // 1. Test REST
    const rest = new RestRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    try {
        await rest.set("test_rest", "ok");
        const val = await rest.get("test_rest");
        console.log(`[REST] Set/Get test: ${val === 'ok' ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (e) {
        console.error(`[REST] ERROR: ${e.message}`);
    }

    // 2. Test RESP
    const resp = new RespRedis(process.env.REDIS_URL);
    
    try {
        await resp.set("test_resp", "ok");
        const val = await resp.get("test_resp");
        console.log(`[RESP] Set/Get test: ${val === 'ok' ? '✅ SUCCESS' : '❌ FAILED'}`);
        await resp.quit();
    } catch (e) {
        console.error(`[RESP] ERROR: ${e.message}`);
    }
}

testHybrid();


