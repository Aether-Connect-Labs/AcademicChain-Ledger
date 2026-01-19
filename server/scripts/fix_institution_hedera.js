
require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no definida en .env');
  process.exit(1);
}

const fixUsers = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado.');

    console.log(`🔄 Actualizando usuarios tipo 'university' con Hedera ID: ${HEDERA_ACCOUNT_ID}...`);
    
    const result = await User.updateMany(
      { role: 'university' },
      { $set: { hederaAccountId: HEDERA_ACCOUNT_ID } }
    );

    console.log(`✅ Actualizados ${result.modifiedCount} usuarios.`);
    
    // Verificar
    const users = await User.find({ role: 'university' }).select('email hederaAccountId');
    console.log('📋 Estado actual de universidades:');
    users.forEach(u => console.log(` - ${u.email}: ${u.hederaAccountId}`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado.');
  }
};

fixUsers();
