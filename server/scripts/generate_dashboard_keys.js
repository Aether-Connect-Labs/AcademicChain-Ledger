require('dotenv').config();
const mongoose = require('mongoose');
const { generateApiKey } = require('../src/services/partnerService');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/User');

async function main() {
  try {
    console.log('Connecting to DB...');
    await connectDB();
    console.log('Connected to DB');

    // 1. Generate Admin Dashboard Key
    console.log('\n--- Generando Admin Dashboard Key ---');
    const adminKey = await generateApiKey('Dashboard Admin', null, true);
    console.log('NOMBRE: Dashboard Admin');
    console.log('ROL: Admin / CTO');
    console.log('PERMISOS:', adminKey.partner.permissions.join(', '));
    console.log('API KEY:', adminKey.apiKey);

    // 2. Generate Institution Keys
    console.log('\n--- Buscando Instituciones existentes ---');
    const universities = await User.find({ role: 'university' }).limit(2);
    
    if (universities.length > 0) {
      for (const uni of universities) {
        console.log(`\n--- Generando Key para Institución: ${uni.name || uni.universityName || uni.email} ---`);
        const key = await generateApiKey(uni.name || uni.universityName || 'Institución', uni._id, false);
        console.log('API KEY:', key.apiKey);
        console.log('University ID:', uni._id);
      }
    } else {
      console.log('\nNo se encontraron instituciones en la BD, generando para Demo...');
      const uni1Key = await generateApiKey('Universidad Demo 1', 'demo_uni_1', false);
      console.log('Institution 1 API Key:', uni1Key.apiKey);
      
      const uni2Key = await generateApiKey('Universidad Demo 2', 'demo_uni_2', false);
      console.log('Institution 2 API Key:', uni2Key.apiKey);
    }

    console.log('\n--- RESUMEN PARA EL USUARIO ---');
    console.log('Copia estas claves para usarlas en tu Dashboard.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
