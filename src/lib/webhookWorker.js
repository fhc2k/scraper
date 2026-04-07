/**
 * Worker to execute the scraping process in the background
 * and send the results to a specified webhook URL.
 */

export async function triggerWebhookJob(queryData, captchaConfig, webhookUrl) {
	try {
		console.log(`[WEBHOOK JOB] Starting background worker for: ${webhookUrl}`);

		// Import dynamically to avoid loading Puppeteer unnecessarily if just enqueuing
		const { scrapeCEP } = await import('@/lib/scraper');
		const { saveCEP, generateFingerprint } = await import('@/lib/db');

		let scraperResult;
		let attempt = 1;
		const maxRetries = 3;

		while (attempt <= maxRetries) {
			console.log(`[WEBHOOK JOB] Attempt ${attempt} of ${maxRetries}...`);
			scraperResult = await scrapeCEP(queryData, captchaConfig);
			
			if (scraperResult.success) {
				break;
			}
			
			console.warn(`[WEBHOOK JOB] Attempt ${attempt} failed:`, scraperResult.error);
			attempt++;
			
			if (attempt <= maxRetries) {
				console.log(`[WEBHOOK JOB] Waiting 10s before retry...`);
				await new Promise(r => setTimeout(r, 10000));
			}
		}

		let responseData = {};

		if (!scraperResult.success) {
			console.error(`[WEBHOOK JOB] Scraper failed:`, scraperResult.error);
			responseData = {
				success: false,
				error: scraperResult.error,
				fingerprint: generateFingerprint(queryData)
			};
		} else {
			console.log(`[WEBHOOK JOB] Scraper success. Saving to DB...`);
			responseData = scraperResult.data;
			responseData.syncStatus = queryData._isResync ? 'sincronización' : 'consulta inicial';

			try {
				await saveCEP({ ...responseData, ...queryData });
			} catch (saveError) {
				console.warn('[WEBHOOK JOB] Failed to save CEP to database:', saveError.message);
			}

			responseData = {
				success: true,
				data: responseData
			};
		}

		// Fire the webhook
		console.log(`[WEBHOOK JOB] POSTing results to ${webhookUrl}`);
		const fetchResponse = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(responseData)
		});

		if (!fetchResponse.ok) {
			console.warn(`[WEBHOOK JOB] Client webhook returned non-200 status: ${fetchResponse.status}`);
		} else {
			console.log(`[WEBHOOK JOB] Webhook delivered successfully!`);
		}

	} catch (error) {
		console.error(`[WEBHOOK JOB] FATAL ERROR processing webhook job:`, error);
		// Best effort try to notify the client about the fatal error
		try {
			await fetch(webhookUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					success: false,
					error: 'Internal worker crash while processing CEP'
				})
			});
		} catch (e) {
			// Ignore if webhook server is dead
		}
	}
}
