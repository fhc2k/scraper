import { NextResponse } from 'next/server';
import { cepSchema } from '@/lib/validation';
import applyRateLimit from '@/lib/rateLimit';

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);

		// ── PHASE 5: Rate Limiting & API Key Security ──
		const rateLimit = await applyRateLimit(request, 10, 60000); // 10 reqs per minute
		if (!rateLimit.success) {
			return NextResponse.json({
				success: false,
				message: 'Demasiadas peticiones (Rate Limit). Por favor, intenta de nuevo en un minuto.',
			}, { status: 429 });
		}

		const clientApiKey = request.headers.get('x-api-key') || searchParams.get('api_key');
		const serverApiKey = process.env.API_KEY;

		if (serverApiKey && clientApiKey !== serverApiKey) {
			return NextResponse.json({
				success: false,
				message: 'No autorizado. API Key inválida o faltante.',
			}, { status: 401 });
		}

		const queryData = {
			fecha: searchParams.get('fecha'),
			referencia: searchParams.get('referencia'),
			emisor: searchParams.get('emisor'),
			receptor: searchParams.get('receptor'),
			cuentaBeneficiaria: searchParams.get('cuentaBeneficiaria'),
			monto: searchParams.get('monto'),
		};

		// Optional: per-request CAPTCHA config from the UI
		const captchaConfig = {
			provider: searchParams.get('captchaProvider') || null,
			apiKey: searchParams.get('captchaApiKey') || null,
		};

		// Validate using existing schema
		try {
			await cepSchema.validate(queryData, { abortEarly: false });
		} catch (validationError) {
			return NextResponse.json({
				success: false,
				message: 'Validación fallida',
				errors: validationError.inner.reduce((acc, err) => {
					acc[err.path] = err.message;
					return acc;
				}, {}),
			}, { status: 400 });
		}

		// Toggle for Real Scraper vs Mock
		const useRealScraper = process.env.ENABLE_SCRAPER === 'true';

		let responseData;

		// ── PHASE 3: Cache-First Logic ──
		try {
			const { findExistingCEP } = await import('@/lib/db');
			const cachedResult = await findExistingCEP(queryData);

			if (cachedResult) {
				const SIX_HOURS = 6 * 60 * 60 * 1000;
				const isOld = (Date.now() - new Date(cachedResult.last_sync || 0).getTime()) > SIX_HOURS;

				if (!isOld) {
					console.log('[API] Cache Hit! Returning stored CEP data.');
					cachedResult.syncStatus = 'caché';
					return NextResponse.json({
						success: true,
						message: 'CEP recuperado de la base de datos (Cache Hit)',
						data: cachedResult,
						isCached: true
					}, { status: 200 });
				} else {
					console.log('[API] Cache Expired (> 6 hours). Resyncing with provider...');
					queryData._isResync = true;
				}
			}
		} catch (dbError) {
			console.warn('[API] Database cache check failed or not configured:', dbError.message);
			// Continue without cache if DB is not ready
		}

		const webhookUrl = searchParams.get('webhook_url');

		try {
			if (useRealScraper) {
				if (webhookUrl) {
					console.log(`[API] Webhook requested. Dispatching background worker for ${webhookUrl}`);
					const { cepQueue } = await import('@/lib/queue');

					if (cepQueue) {
						// ── BULLMQ: Enterprise distributed robust queue ──
						await cepQueue.add('scrape-job', { queryData, captchaConfig, webhookUrl }, {
							attempts: 3,
							backoff: { type: 'exponential', delay: 10000 },
							removeOnComplete: true
						});
						console.log(`[BULLMQ] 📥 Job enqueued securely.`);
					} else {
						// ── FALLBACK: Node.js memory fire-and-forget ──
						const { triggerWebhookJob } = await import('@/lib/webhookWorker');
						triggerWebhookJob(queryData, captchaConfig, webhookUrl).catch(console.error);
					}

					return NextResponse.json({
						success: true,
						status: 'processing',
						message: 'La consulta tomará entre 70 y 90 segundos. Los resultados se enviarán al webhook proporcionado.',
						job_id: queryData.referencia
					}, { status: 202 });
				}

				console.log('--- EXECUTING REAL SCRAPER ---');
				const { scrapeCEP } = await import('@/lib/scraper');
				const scraperResult = await scrapeCEP(queryData, captchaConfig);
				if (!scraperResult.success) {
					throw new Error(scraperResult.error || 'Scraper failed without error message');
				}
				responseData = scraperResult.data;
				responseData.syncStatus = queryData._isResync ? 'sincronización' : 'consulta inicial';

				// ── PHASE 3: Save to DB ──
				try {
					const { saveCEP } = await import('@/lib/db');
					await saveCEP({ ...responseData, ...queryData });
				} catch (saveError) {
					console.warn('[API] Failed to save CEP to database:', saveError.message);
				}

			} else {
				// Mock fallback for development
				await new Promise(resolve => setTimeout(resolve, 800));
				responseData = {
					...queryData,
					id_transaccion: Math.random().toString(36).substr(2, 9).toUpperCase(),
					estado: 'LIQUIDADO',
					banco_emisor: 'BBVA MÉXICO',
					banco_receptor: 'BANAMEX',
					clave_rastreo: `CEP${Date.now()}`,
					fecha_validacion: new Date().toISOString(),
					isMock: true,
					syncStatus: queryData._isResync ? 'sincronización' : 'consulta inicial'
				};
			}
		} catch (scraperError) {
			console.error('Processing Error:', scraperError);
			return NextResponse.json({
				success: false,
				message: 'Error al procesar la consulta con Banxico',
				error: scraperError.message
			}, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			message: useRealScraper ? 'CEP recuperado exitosamente' : 'CEP validado (MOCK)',
			data: responseData
		}, { status: 200 });

	} catch (error) {
		console.error('API Error:', error);
		return NextResponse.json({
			success: false,
			message: 'Error interno del servidor',
		}, { status: 500 });
	}
}
