const { distributeFunds } = require('../src/services/paymentDistributor');
const logger = require('../src/utils/logger');

async function testDistribution() {
    console.log('\n🧪 Iniciando prueba de Payment Distributor...\n');
    
    // Mock environment for the test
    process.env.COLD_WALLET_ADDRESS = 'rTestColdWallet123';
    
    try {
        const amount = 1000; // 1000 XRP
        const uniId = 'test-university-id';
        
        console.log(`📊 Distribuyendo ${amount} XRP...`);
        await distributeFunds(amount, uniId);
        
        console.log('\n✅ Prueba de distribución exitosa.');
    } catch (error) {
        console.error('\n❌ Error en prueba de distribución:', error);
        process.exit(1);
    }
}

testDistribution();
