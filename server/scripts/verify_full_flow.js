
const mongoose = require('mongoose');
const path = require('path');
// Load .env from server root (parent of scripts folder)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User');
const Partner = require('../src/models/Partner');

async function verifyFullFlow() {
  console.log('🚀 Iniciando verificación de flujo completo (Recarga -> Emisión -> Sincronización)...');

  try {
    // 1. Conexión a Base de Datos
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI no está definido en .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión a MongoDB establecida.');

    // 2. Crear Datos de Prueba
    const testEmail = `test_flow_${Date.now()}@university.com`;
    const testUniversity = await User.create({
      email: testEmail,
      name: 'Test University Flow', // Added required field
      password: 'hashed_password',
      role: 'university',
      universityName: 'Test University Flow',
      credits: 0
    });
    console.log(`✅ Universidad de prueba creada: ${testUniversity.email} (Créditos: ${testUniversity.credits})`);

    const testPartner = await Partner.create({
      universityId: testUniversity._id,
      name: 'Test Partner Dashboard',
      apiKey: `pk_test_${Date.now()}`,
      credits: 0
    });
    console.log(`✅ Partner (Dashboard) de prueba creado vinculado a la universidad. (Créditos: ${testPartner.credits})`);

    // 3. Simular Recarga de Créditos (Lógica de billing.js)
    console.log('\n--- 💳 Simulando Compra de Plan (Recarga) ---');
    const rechargeAmount = 500; // Plan Business
    
    // Actualizar Universidad
    await User.updateOne({ _id: testUniversity._id }, { $inc: { credits: rechargeAmount } });
    // Actualizar Partner (Sincronización)
    await Partner.updateMany({ universityId: testUniversity._id }, { $inc: { credits: rechargeAmount } });

    // Verificar Recarga
    const updatedUni = await User.findById(testUniversity._id);
    const updatedPartner = await Partner.findById(testPartner._id);

    console.log(`User Credits: ${updatedUni.credits} (Esperado: 500)`);
    console.log(`Partner Credits: ${updatedPartner.credits} (Esperado: 500)`);

    if (updatedUni.credits === 500 && updatedPartner.credits === 500) {
      console.log('✅ Sincronización de créditos exitosa.');
    } else {
      console.error('❌ Fallo en la sincronización de créditos.');
    }

    // 4. Simular Emisión de Credencial (Lógica de university.js)
    console.log('\n--- 🎓 Simulando Emisión de Credencial ---');
    
    // Verificación de créditos antes de emitir
    if (updatedUni.credits < 1) {
      console.error('❌ Créditos insuficientes (Inesperado en esta prueba).');
    } else {
      console.log('✅ Verificación de saldo: Suficiente.');
      
      // Deducir Crédito
      await User.updateOne({ _id: testUniversity._id }, { $inc: { credits: -1 } });
      await Partner.updateMany({ universityId: testUniversity._id }, { $inc: { credits: -1 } });
      
      console.log('✅ Crédito deducido por emisión.');
    }

    // Verificar Deducción
    const finalUni = await User.findById(testUniversity._id);
    const finalPartner = await Partner.findById(testPartner._id);

    console.log(`User Credits Final: ${finalUni.credits} (Esperado: 499)`);
    console.log(`Partner Credits Final: ${finalPartner.credits} (Esperado: 499)`);

    if (finalUni.credits === 499 && finalPartner.credits === 499) {
      console.log('✅ Flujo completo verificado: Compra -> Sincronización -> Emisión -> Deducción.');
    } else {
      console.error('❌ Fallo en el flujo de deducción.');
    }

    // 5. Limpieza
    await User.deleteOne({ _id: testUniversity._id });
    await Partner.deleteOne({ _id: testPartner._id });
    console.log('\n🧹 Datos de prueba eliminados.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Conexión cerrada.');
  }
}

verifyFullFlow();
