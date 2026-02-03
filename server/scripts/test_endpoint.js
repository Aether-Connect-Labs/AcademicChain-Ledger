const axios = require('axios');

async function testEndpoint() {
    console.log('\n🧪 Iniciando prueba de Endpoint /create-payment-intent...\n');
    
    // Attempt to detect port, default to 3001 or 5000 (common defaults)
    const port = process.env.PORT || 3001;
    const baseUrl = `http://localhost:${port}`;
    
    console.log(`🌐 Conectando a ${baseUrl}...`);

    try {
        const payload = {
            universityId: 'test-uni-endpoint',
            planId: 'business',
            amountFiat: 450
        };

        const res = await axios.post(`${baseUrl}/api/billing/create-payment-intent`, payload);

        if (res.status === 200 && res.data.success) {
            console.log('✅ Endpoint respondió correctamente:');
            console.log(`   Checkout URL: ${res.data.checkoutUrl}`);
            console.log(`   Transaction ID: ${res.data.transactionId}`);
        } else {
            console.error('⚠️ Respuesta inesperada:', res.status, res.data);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log(`❌ No se pudo conectar a localhost:${port}. El servidor podría estar en otro puerto o apagado.`);
            // Try 5000 just in case
            if (port !== 5000) {
                 console.log('🔄 Intentando puerto 5000...');
                 try {
                    const res2 = await axios.post(`http://localhost:5000/api/billing/create-payment-intent`, {
                        universityId: 'test-uni-endpoint',
                        planId: 'business',
                        amountFiat: 450
                    });
                    if (res2.status === 200) {
                        console.log('✅ Conexión exitosa en puerto 5000.');
                        console.log(`   Checkout URL: ${res2.data.checkoutUrl}`);
                    }
                 } catch (e2) {
                     console.error('❌ También falló en puerto 5000.');
                 }
            }
        } else {
            console.error('❌ Error en la petición:', error.message);
            if (error.response) {
                console.error('   Data:', error.response.data);
            }
        }
    }
}

testEndpoint();
