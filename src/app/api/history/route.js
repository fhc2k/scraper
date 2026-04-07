import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CepQuery from '@/models/CepQuery';

export async function GET(request) {
	try {
		const clientApiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('api_key');
		const serverApiKey = process.env.API_KEY;

		if (serverApiKey && clientApiKey !== serverApiKey) {
			return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
		}

		await dbConnect();

		// Fetch the 15 most recent successful transactions
		const history = await CepQuery.find()
			.sort({ createdAt: -1 })
			.limit(15)
			.lean();

		return NextResponse.json({
			success: true,
			data: history
		}, { status: 200 });

	} catch (error) {
		console.error('History API Error:', error);
		return NextResponse.json({
			success: false,
			message: 'Error interno del servidor',
		}, { status: 500 });
	}
}
