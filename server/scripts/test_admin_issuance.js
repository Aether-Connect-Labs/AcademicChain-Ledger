const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://academicchain-ledger.onrender.com';
// Llave de "Sequential Test Uni" que sí tiene ID de universidad
const PARTNER_KEY = 'acp_8ba28e18_5968e84e0579411bbae50897f9c4d447';

const randomString = () => crypto.randomBytes(4).toString('hex');

async function main() {
  try {
    console.log(`\n🚀 Iniciando prueba de emisión REAL...`);
    console.log(`URL: ${BASE_URL}`);
    console.log(`Partner Key: ${PARTNER_KEY.substring(0, 15)}...`);

    // 1. Crear Token Académico (necesario para pasar associationGuard)
    console.log('\n1. Creando Token Académico para la institución...');
    let tokenId;
    try {
      const tokenRes = await axios.post(`${BASE_URL}/api/partner/institution/create-token`, {
        tokenName: `Token Demo ${randomString()}`,
        tokenSymbol: 'DEMO',
        tokenMemo: 'Token de prueba para Dashboard'
      }, {
        headers: { 'x-api-key': PARTNER_KEY }
      });
      console.log('✅ Token creado:', tokenRes.data);
      tokenId = tokenRes.data.data.tokenId;
    } catch (err) {
      console.error('❌ Error creando token:', err.response ? err.response.data : err.message);
      // Si falla, intentamos usar uno que sepamos que existe o fallamos
      return;
    }

    // 2. Emitir Credencial usando el Token creado
    console.log(`\n2. Emitiendo credencial en Token ID: ${tokenId}...`);
    const uniqueHash = crypto.createHash('sha256').update(randomString()).digest('hex');
    const studentName = `Estudiante Panel ${randomString()}`;
    
    const mintPayload = {
      tokenId: tokenId,
      uniqueHash,
      studentName,
      degree: 'Certificado Verificado por Dashboard',
      ipfsURI: 'ipfs://QmPruebaDashboard'
    };
    
    // Solo agregamos recipientAccountId si es válido (no null)
    // mintPayload.recipientAccountId = '0.0.xxxxx'; 

    const mintRes = await axios.post(`${BASE_URL}/api/partner/institution/mint`, mintPayload, {
      headers: { 'x-api-key': PARTNER_KEY }
    });
    console.log('✅ Credencial emitida:', mintRes.data);

    // 3. Verificar listado de emisiones (Dashboard)
    console.log('\n3. Verificando vista de Dashboard (GET /emissions)...');
    const listRes = await axios.get(`${BASE_URL}/api/partner/emissions`, {
      headers: { 'x-api-key': PARTNER_KEY }
    });
    
    console.log(`✅ Emisiones encontradas: ${listRes.data.data.items.length}`);
    if (listRes.data.data.items.length > 0) {
      console.log('📝 Última emisión:', listRes.data.data.items[0]);
    }

  } catch (error) {
    console.error('\n❌ Error general:', error.response ? error.response.data : error.message);
  }
}

main();
