const rateLimitMap = new Map();

export default function applyRateLimit(request, limit = 5, windowMs = 60000) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    if (rateLimitMap.size > 1000) {
        const now = Date.now();
        for (const [key, val] of rateLimitMap.entries()) {
            if (now - val.startTime > windowMs) {
                rateLimitMap.delete(key);
            }
        }
    }

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, {
            count: 1,
            startTime: Date.now()
        });
        return { success: true, remaining: limit - 1, limit };
    }

    const requestData = rateLimitMap.get(ip);
    const now = Date.now();

    // Reset window
    if (now - requestData.startTime > windowMs) {
        requestData.count = 1;
        requestData.startTime = now;
        return { success: true, remaining: limit - 1, limit };
    }

    requestData.count++;

    if (requestData.count > limit) {
        return { success: false, remaining: 0, limit };
    }

    return { success: true, remaining: limit - requestData.count, limit };
}
