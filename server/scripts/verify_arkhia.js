
const axios = require('axios');
require('dotenv').config();

const arkhiaKey = process.env.ARKHIA_API_KEY;
const baseUrl = `https://pool.arkhia.io/hedera/testnet/api/v1`;

console.log('--- Probando Conexión con Arkhia ---');

if (!arkhiaKey) {
    console.error('❌ Error: ARKHIA_API_KEY no encontrada en .env');
    process.exit(1);
}

console.log(`✅ ARKHIA_API_KEY encontrada: ${arkhiaKey.substring(0, 5)}...`);

async function testArkhia() {
    try {
        console.log(`📡 Consultando endpoint: ${baseUrl}/network/nodes`);
        
        const response = await axios.get(`${baseUrl}/network/nodes`, {
            headers: { 'x-api-key': arkhiaKey }
        });

        if (response.status === 200) {
            console.log('✅ Conexión Exitosa con Arkhia!');
            console.log(`📊 Nodos encontrados: ${response.data.nodes ? response.data.nodes.length : 'N/A'}`);
            
            // Probar Topic ID si existe
            const topicId = "0.0.4576394";
            console.log(`\n📡 Verificando Topic ID: ${topicId}`);
            try {
                const topicResponse = await axios.get(`${baseUrl}/topics/${topicId}/messages`, {
                    headers: { 'x-api-key': arkhiaKey }
                });
                console.log('✅ Acceso al Topic HCS verificado');
                console.log(`📨 Mensajes recientes: ${topicResponse.data.messages ? topicResponse.data.messages.length : 0}`);
            } catch (topicError) {
                console.warn('⚠️ No se pudo acceder al Topic (puede que no tenga mensajes o no exista):', topicError.message);
            }

        } else {
            console.error(`❌ Respuesta inesperada: ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Error conectando con Arkhia:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Message: ${error.message}`);
        }
    }
}

testArkhia();
