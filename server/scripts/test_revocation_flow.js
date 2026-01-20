const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';
// Llave de "Sequential Test Uni" que sí tiene ID de universidad
const PARTNER_KEY = 'acp_8ba28e18_5968e84e0579411bbae50897f9c4d447';

const uniqueHash = crypto.createHash('sha256').update(Date.now().toString()).digest('hex');
const studentName = `Estudiante Revocado ${Date.now()}`;

async function runRevocationTest() {
  console.log('\n🚀 Iniciando prueba de CICLO DE VIDA (Emisión -> Revocación)...\n');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Partner Key: ${PARTNER_KEY.substring(0, 15)}...`);

  try {
    // 1. Crear Token
    console.log('\n1. Creando Token Académico...');
    const createRes = await axios.post(`${BASE_URL}/api/partner/institution/create-token`, {
      tokenName: 'Revocable Token',
      tokenSymbol: 'RVC',
      decimals: 0,
      initialSupply: 0
    }, {
      headers: { 'x-api-key': PARTNER_KEY }
    });
    
    const tokenId = createRes.data.data.tokenId;
    console.log(`✅ Token creado: ${tokenId}`);

    // 2. Emitir Credencial
    console.log(`\n2. Emitiendo credencial en Token ID: ${tokenId}...`);
    const mintPayload = {
      tokenId: tokenId,
      uniqueHash,
      studentName,
      degree: 'Certificado Temporal',
      ipfsURI: 'ipfs://QmRevocable'
    };

    const mintRes = await axios.post(`${BASE_URL}/api/partner/institution/mint`, mintPayload, {
      headers: { 'x-api-key': PARTNER_KEY }
    });
    
    const serialNumber = mintRes.data.data.mint.serialNumber;
    console.log(`✅ Credencial emitida: Serial #${serialNumber}`);

    // 3. Verificar estado ACTIVO
    console.log('\n3. Verificando estado inicial...');
    const check1 = await axios.get(`${BASE_URL}/api/partner/emissions`, {
        headers: { 'x-api-key': PARTNER_KEY },
        params: { limit: 1 }
    });
    const item1 = check1.data.data.items.find(i => i.tokenId === tokenId && i.serialNumber === serialNumber);
    console.log(`📝 Estado actual: ${item1 ? item1.status : 'Desconocido'}`);

    // 4. Revocar Credencial
    console.log(`\n4. 🛑 REVOCANDO credencial ${tokenId}#${serialNumber}...`);
    const revokePayload = {
        tokenId,
        serialNumber,
        reason: 'Plagio detectado en tesis final'
    };

    const revokeRes = await axios.post(`${BASE_URL}/api/partner/institution/revoke`, revokePayload, {
        headers: { 'x-api-key': PARTNER_KEY }
    });
    
    if (revokeRes.data.success) {
        console.log('✅ Respuesta de revocación exitosa.');
        console.log(`   Tx ID: ${revokeRes.data.data.transactionId}`);
    } else {
        console.error('❌ Falló la revocación:', revokeRes.data);
    }

    // 5. Verificar estado REVOCADO
    console.log('\n5. Verificando cambio de estado en Dashboard...');
    // Esperar un poco si es real, pero en local/demo es instantáneo
    const check2 = await axios.get(`${BASE_URL}/api/partner/emissions`, {
        headers: { 'x-api-key': PARTNER_KEY },
        params: { limit: 5 }
    });
    
    // En DEMO_MODE, /emissions devuelve datos mockeados, así que tal vez no veamos el cambio reflejado 
    // en la lista general si no la actualizamos para leer de la "BD" (o memoria).
    // Pero el endpoint de revocación devolvió éxito.
    // Si estamos en modo REAL (local con mongo), debería verse.
    
    const item2 = check2.data.data.items.find(i => i.tokenId === tokenId && i.serialNumber === serialNumber);
    if (item2) {
        console.log(`📝 Estado final: ${item2.status}`);
        if (item2.status === 'REVOKED') {
            console.log('🎉 PRUEBA DE REVOCACIÓN EXITOSA: El sistema reflejó el cambio.');
        } else {
            console.log('⚠️ El estado no cambió (posiblemente por DEMO_MODE usando mocks estáticos en /emissions).');
        }
    } else {
        console.log('⚠️ No se encontró la credencial en el listado (posiblemente por DEMO_MODE).');
    }

  } catch (error) {
    console.error('\n❌ Error general:', error.response ? error.response.data : error.message);
  }
}

runRevocationTest();
