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
    
    const mintRes = await axios.post(`${BASE_URL}/api/partner/institution/mint`, {
      tokenId: tokenId,
      uniqueHash,
      studentName,
      degree: 'Certificado Verificado por Dashboard',
      ipfsURI: 'ipfs://QmPruebaDashboard',
      recipientAccountId: null // No transferir por ahora para simplificar
    }, {
      headers: { 'x-api-key': PARTNER_KEY }
    });

    console.log('\n✅ ¡EMISIÓN EXITOSA!');
    console.log('Credencial:', mintRes.data);
    console.log('\n👉 AHORA: Ve a tu Dashboard (Emisiones) y deberías ver esta nueva credencial.');

  } catch (error) {
    console.error('\n❌ Error general:', error.response ? error.response.data : error.message);
  }
}

main();
