/**
 * CAPTCHA Solver Repository (Strategy Pattern)
 *
 * Provides a unified interface for solving CAPTCHAs with multiple providers.
 * Switch providers via the CAPTCHA_PROVIDER env var.
 *
 * Supported providers:
 *   - "2captcha"          → Requires TWOCAPTCHA_API_KEY
 *   - "capmonster"        → Requires CAPMONSTER_API_KEY
 *   - "nextcaptcha"       → Requires NEXTCAPTCHA_API_KEY
 *   - "freecaptchabypass" → Requires FREECAPTCHABYPASS_API_KEY
 *   - "manual"            → No API key needed, user solves in browser
 *
 * Usage:
 *   const solver = createCaptchaSolver();
 *   const text = await solver.solve(base64Image);
 */

// ─── Provider Interface ───────────────────────────────────────

class CaptchaSolverProvider {
    constructor(name) {
        this.name = name;
    }
    /** @returns {Promise<string>} solved text */
    async solve(base64Image) {
        throw new Error(`solve() not implemented for provider: ${this.name}`);
    }
}

// ─── 2Captcha Provider ────────────────────────────────────────

class TwoCaptchaProvider extends CaptchaSolverProvider {
    constructor(apiKey) {
        super("2captcha");
        this.apiKey = apiKey;
    }

    async solve(base64Image) {
        const { Solver } = await import("@2captcha/captcha-solver");
        const solver = new Solver(this.apiKey);

        console.log(`[${this.name}] Sending CAPTCHA...`);
        const result = await solver.imageCaptcha({
            body: base64Image,
            numeric: 0,
            minLen: 4,
            maxLen: 8,
        });

        console.log(`[${this.name}] Solved: "${result.data}"`);
        return result.data;
    }
}

// ─── CapMonster Provider ──────────────────────────────────────

class CapMonsterProvider extends CaptchaSolverProvider {
    constructor(apiKey) {
        super("capmonster");
        this.apiKey = apiKey;
    }

    async solve(base64Image) {
        const {
            CapMonsterCloudClientFactory,
            ClientOptions,
            ImageToTextRequest,
        } = await import("@zennolab_com/capmonstercloud-client");

        const client = CapMonsterCloudClientFactory.Create(
            new ClientOptions({ clientKey: this.apiKey }),
        );

        console.log(`[${this.name}] Sending CAPTCHA...`);
        const request = new ImageToTextRequest({ body: base64Image });
        const result = await client.Solve(request);

        console.log(`[${this.name}] Solved: "${result.text}"`);
        return result.text;
    }
}

// ─── NextCaptcha Provider ─────────────────────────────────────

class NextCaptchaProvider extends CaptchaSolverProvider {
    constructor(apiKey) {
        super("nextcaptcha");
        this.apiKey = apiKey;
    }

    async solve(base64Image) {
        console.log(`[${this.name}] Sending CAPTCHA...`);

        // NextCaptcha uses createTask/getTaskResult REST pattern
        const createRes = await fetch(
            "https://api.nextcaptcha.com/createTask",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientKey: this.apiKey,
                    task: {
                        type: "ImageToTextTask",
                        body: base64Image,
                    },
                }),
            },
        );

        const createData = await createRes.json();
        console.log(
            `[${this.name}] createTask response:`,
            JSON.stringify(createData),
        );

        // Handle errors from the API
        if (createData.errorId && createData.errorId !== 0) {
            throw new Error(
                `NextCaptcha error: ${createData.errorDescription || createData.errorCode || "Unknown"}`,
            );
        }

        // Some APIs return the solution immediately
        if (createData.solution?.text) {
            console.log(
                `[${this.name}] Solved immediately: "${createData.solution.text}"`,
            );
            return createData.solution.text;
        }
        if (createData.status === "ready" && createData.solution) {
            const text =
                createData.solution.text ||
                createData.solution.gRecaptchaResponse ||
                "";
            console.log(`[${this.name}] Solved immediately: "${text}"`);
            return text;
        }

        // Get the task ID (could be "taskId" or "task_id")
        const taskId = createData.taskId || createData.task_id;
        if (!taskId) {
            throw new Error(
                `NextCaptcha: No taskId in response: ${JSON.stringify(createData)}`,
            );
        }

        // Poll for result
        let attempts = 0;
        while (attempts < 30) {
            await new Promise((r) => setTimeout(r, 2000));
            const resultRes = await fetch(
                "https://api.nextcaptcha.com/getTaskResult",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clientKey: this.apiKey, taskId }),
                },
            );
            const result = await resultRes.json();

            if (result.status === "ready") {
                const text = result.solution?.text || "";
                console.log(`[${this.name}] Solved: "${text}"`);
                return text;
            }
            if (result.status === "failed") {
                throw new Error(
                    `NextCaptcha task failed: ${result.errorDescription || "Unknown"}`,
                );
            }
            attempts++;
        }
        throw new Error("NextCaptcha: Timeout waiting for solution");
    }
}

// ─── FreeCaptchaBypass Provider ─────────────────────────────────

class FreeCaptchaBypassProvider extends CaptchaSolverProvider {
    constructor(apiKey) {
        super("freecaptchabypass");
        this.apiKey = apiKey;
    }

    async solve(base64Image) {
        console.log(`[${this.name}] Sending CAPTCHA...`);

        const createRes = await fetch(
            "https://freecaptchabypass.com/createTask",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientKey: this.apiKey,
                    task: {
                        type: "ImageToTextTask",
                        body: base64Image,
                    },
                }),
            },
        );

        const createData = await createRes.json();
        console.log(
            `[${this.name}] createTask response:`,
            JSON.stringify(createData),
        );

        if (createData.errorId && createData.errorId !== 0) {
            throw new Error(
                `FreeCaptchaBypass error: ${createData.errorDescription || createData.errorCode || "Unknown"}`,
            );
        }

        if (createData.solution?.text) {
            return createData.solution.text;
        }

        const taskId = createData.taskId;
        if (!taskId) {
            throw new Error(
                `FreeCaptchaBypass: No taskId in response: ${JSON.stringify(createData)}`,
            );
        }

        // Poll for result
        let attempts = 0;
        while (attempts < 60) {
            console.log(
                `[${this.name}] Polling for solution (attempt ${attempts + 1})...`,
            );
            await new Promise((r) => setTimeout(r, 1000));
            try {
                const resultRes = await fetch(
                    "https://freecaptchabypass.com/getTaskResult",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            clientKey: this.apiKey,
                            taskId,
                        }),
                    },
                );
                const resultData = await resultRes.json();
                console.log(
                    `[${this.name}] getTaskResult response:`,
                    JSON.stringify(resultData),
                );

                if (
                    resultData.status === "ready" ||
                    (resultData.errorId === 0 && resultData.solution?.text)
                ) {
                    const text = resultData.solution?.text || "";
                    console.log(`[${this.name}] Solved: "${text}"`);
                    return text;
                }
                if (resultData.errorId && resultData.errorId !== 0) {
                    throw new Error(
                        `FreeCaptchaBypass task error: ${resultData.errorDescription || resultData.errorCode || "Unknown"}`,
                    );
                }
                if (resultData.status === "failed") {
                    throw new Error(
                        `FreeCaptchaBypass task failed: ${resultData.errorDescription || "Unknown"}`,
                    );
                }
            } catch (err) {
                console.error(`[${this.name}] Polling error: ${err.message}`);
                if (attempts > 5) throw err; // Don't crash immediately on first network hiccup
            }
            attempts++;
        }
        throw new Error("FreeCaptchaBypass timeout waiting for solution");
    }
}

// ─── Manual Provider (no API, user solves in browser) ─────────

class ManualProvider extends CaptchaSolverProvider {
    constructor() {
        super("manual");
    }

    async solve(_base64Image) {
        // This provider doesn't solve anything — it signals the scraper
        // to wait for the user to type the CAPTCHA manually.
        return null;
    }
}

/**
 * Creates the appropriate CAPTCHA solver.
 *
 * Priority:
 * 1. Explicit override from UI ({ provider, apiKey })
 * 2. CAPTCHA_PROVIDER env var
 * 3. Auto-detect based on which API key is present in .env
 * 4. Fallback to manual
 */
export function createCaptchaSolver(override = {}) {
    const providerEnv = process.env.CAPTCHA_PROVIDER?.toLowerCase();
    const twoCaptchaKey = process.env.TWOCAPTCHA_API_KEY;
    const capMonsterKey = process.env.CAPMONSTER_API_KEY;
    const nextCaptchaKey = process.env.NEXTCAPTCHA_API_KEY;
    const fcbKey = process.env.FREECAPTCHABYPASS_API_KEY;

    // ── 1. .env config wins if present ──────────────────────────
    if (providerEnv) {
        if (providerEnv === "manual") return new ManualProvider();
        if (providerEnv === "2captcha" && twoCaptchaKey)
            return new TwoCaptchaProvider(twoCaptchaKey);
        if (providerEnv === "capmonster" && capMonsterKey)
            return new CapMonsterProvider(capMonsterKey);
        if (providerEnv === "nextcaptcha" && nextCaptchaKey)
            return new NextCaptchaProvider(nextCaptchaKey);
        if (providerEnv === "freecaptchabypass" && fcbKey)
            return new FreeCaptchaBypassProvider(fcbKey);
    }

    // ── 2. Fall back to UI override ────────────────────────────
    if (override.provider) {
        if (override.provider === "manual") return new ManualProvider();
        if (override.apiKey) {
            if (override.provider === "2captcha")
                return new TwoCaptchaProvider(override.apiKey);
            if (override.provider === "capmonster")
                return new CapMonsterProvider(override.apiKey);
            if (override.provider === "nextcaptcha")
                return new NextCaptchaProvider(override.apiKey);
            if (override.provider === "freecaptchabypass")
                return new FreeCaptchaBypassProvider(override.apiKey);
        }
    }

    // ── 3. Auto-detect keys if no strict provider was defined ──
    if (nextCaptchaKey) return new NextCaptchaProvider(nextCaptchaKey);
    if (capMonsterKey) return new CapMonsterProvider(capMonsterKey);
    if (twoCaptchaKey) return new TwoCaptchaProvider(twoCaptchaKey);
    if (fcbKey) return new FreeCaptchaBypassProvider(fcbKey);

    return new ManualProvider();
}

/**
 * Helper: Extract CAPTCHA image as base64 from a Puppeteer page.
 * Tries canvas-based extraction first, then falls back to element screenshot.
 */
export async function extractCaptchaImage(page) {
    // Method 1: Canvas-based extraction
    try {
        const base64 = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                const img = document.querySelector("#img_captcha");
                if (!img || !img.src) return reject("CAPTCHA image not found");

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const newImg = new Image();
                newImg.crossOrigin = "anonymous";
                newImg.onload = () => {
                    canvas.width = newImg.width;
                    canvas.height = newImg.height;
                    ctx.drawImage(newImg, 0, 0);
                    const dataUrl = canvas.toDataURL("image/png");
                    resolve(dataUrl.split(",")[1]);
                };
                newImg.onerror = () => reject("Failed to load CAPTCHA image");
                newImg.src = img.src;
            });
        });
        if (base64) return base64;
    } catch (e) {
        console.warn("Canvas extraction failed, using screenshot fallback:", e);
    }

    // Method 2: Element screenshot
    const el = await page.$("#img_captcha");
    if (!el) throw new Error("CAPTCHA element not found");
    return await el.screenshot({ encoding: "base64" });
}
