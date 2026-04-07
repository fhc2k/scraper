import http from 'http';

// Create a fake "Client B2B Server" listening on port 4000
const server = http.createServer((req, res) => {
    if (req.url === '/mi-webhook-receptor' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            console.log('\n\n===========================================');
            console.log('[CLIENTE B2B] ¡EL WEBHOOK HA LLEGADO!');
            console.log('Hora:', new Date().toLocaleTimeString());

            try {
                const data = JSON.parse(body);
                console.log('Éxito:', data.success);
                console.log('Data recibida en el webhook:', data);
            } catch (e) {
                console.log('Cuerpo raw:', body);
            }
            console.log('===========================================\n\n');

            res.writeHead(200);
            res.end('OK');

            // Apagando servidor de prueba
            setTimeout(() => process.exit(0), 1000);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(4000, async () => {
    console.log('✅ Servidor de prueba (Cliente B2B) escuchando en puerto 4000');

    // We use a query that probably is NOT cached to force the scraper
    // Alternatively, even if cached, it should trigger the webhook immediately!
    const query = new URLSearchParams({
        fecha: '13-08-2024',
        referencia: '130824',
        monto: '7500.00',
        cuentaBeneficiaria: '012180015509748685',
        emisor: '40012',
        receptor: '40002',
        webhook_url: 'http://localhost:4000/mi-webhook-receptor'
    });

    const apiUrl = `http://localhost:3000/api/cep?${query.toString()}`;

    console.log('🚀 Lanzando petición a tu API Scraper con Webhook...');
    console.log(`URL a llamar: ${apiUrl}\n`);

    try {
        const apiRes = await fetch(apiUrl);
        const json = await apiRes.json();

        console.log('🕒 [RESPUESTA INMEDIATA DE TU API]:');
        console.log('Status HTTP:', apiRes.status);
        console.log('Respuesta:', JSON.stringify(json, null, 2));
        console.log('\n😴 Nuestro código de prueba ahora se queda esperando pasivamente a que llegue el Webhook (puede tardar de 0s a 60s dependiendo del caché)...');
    } catch (e) {
        console.error('Error al llamar a tu API:', e.message);
        process.exit(1);
    }
});
