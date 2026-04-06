import { NextResponse } from 'next/server';
import { cepSchema } from '@/lib/validation';
// Removed static import to fix build issues

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);

		// Extract parameters from query string
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

		try {
			if (useRealScraper) {
				console.log('--- EXECUTING REAL SCRAPER ---');
				const { scrapeCEP } = await import('@/lib/scraper');
				const scraperResult = await scrapeCEP(queryData, captchaConfig);
				if (!scraperResult.success) {
					throw new Error(scraperResult.error || 'Scraper failed without error message');
				}
				responseData = scraperResult.data;
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
					isMock: true
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
