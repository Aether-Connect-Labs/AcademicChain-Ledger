const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User');

async function verifyPaymentHeart() {
    console.log('❤️ Verificando el Corazón del Sistema de Pagos...');

    // 1. Connect to DB to create a test user
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI missing');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create test user
    const testEmail = `pay_test_${Date.now()}@test.com`;
    const user = await User.create({
        name: 'Payment Tester',
        email: testEmail,
        password: 'hashed',
        role: 'university',
        credits: 0
    });
    console.log(`👤 Usuario de prueba creado: ${user._id} (Créditos: 0)`);

    // 2. Simulate Banxa Webhook
    const port = process.env.PORT || 3001;
    const webhookUrl = `http://localhost:${port}/api/billing/webhook/banxa`;
    
    console.log(`📨 Enviando Webhook simulado a ${webhookUrl}...`);
    
    try {
        const payload = {
            status: 'completed',
            external_reference: user._id.toString(),
            coin_amount: '1000', // 1000 XRP
            tx_hash: 'mock_tx_hash_123'
        };

        const res = await axios.post(webhookUrl, payload);
        
        if (res.status === 200) {
            console.log('✅ Webhook recibido correctamente (200 OK).');
        } else {
            console.error('⚠️ Respuesta inesperada:', res.status);
        }

        // 3. Verify Credits Updated
        const updatedUser = await User.findById(user._id);
        console.log(`💰 Créditos finales del usuario: ${updatedUser.credits}`);
        
        // Logic: 1000 XRP * 1.5 = 1500 Credits
        if (updatedUser.credits === 1500) {
            console.log('✅ Sincronización de créditos exitosa (1000 XRP -> 1500 Créditos).');
        } else {
            console.error(`❌ Discrepancia en créditos. Esperado: 1500, Actual: ${updatedUser.credits}`);
        }

    } catch (error) {
        console.error('❌ Error en prueba de webhook:', error.message);
        if (error.response) console.error('   Data:', error.response.data);
    } finally {
        // Cleanup
        await User.deleteOne({ _id: user._id });
        await mongoose.disconnect();
        console.log('👋 Limpieza completada.');
    }
}

verifyPaymentHeart();
