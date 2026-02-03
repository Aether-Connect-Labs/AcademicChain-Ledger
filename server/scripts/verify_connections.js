
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const logger = require('../src/utils/logger');
const xrpService = require('../src/services/xrpService');
const algorandService = require('../src/services/algorandService');
const ipfsService = require('../src/services/ipfsService');
const hederaService = require('../src/services/hederaServices');

async function verifyConnections() {
  console.log('\n🔍 Iniciando Verificación de Conexiones Multi-Chain...\n');

  // 1. Verificar HEDERA (HBAR)
  console.log('--- 1. HEDERA (HBAR) ---');
  try {
    const isHederaEnabled = process.env.HEDERA_ENABLED === 'true' || !!process.env.HEDERA_OPERATOR_ID;
    if (isHederaEnabled) {
      console.log('✅ Configuración detectada (Operator ID presente).');
      // Conectar explícitamente
      await hederaService.connect();
      
      if (hederaService.client) {
         console.log('✅ Cliente Hedera inicializado correctamente.');
         try {
             const balance = await hederaService.getOperatorBalance();
             console.log(`💰 Balance del Operador: ${balance.toString()} HBAR`);
         } catch (e) {
             console.log(`⚠️ No se pudo obtener balance (posiblemente error de red o credenciales): ${e.message}`);
         }
      } else {
         console.log('⚠️ Cliente Hedera no inicializado en el servicio.');
      }
    } else {
      console.log('⚪ Hedera deshabilitado o sin configurar.');
    }
  } catch (error) {
    console.error('❌ Error verificando Hedera:', error.message);
  }

  // 2. Verificar XRPL (XRP)
  console.log('\n--- 2. XRPL (XRP) ---');
  try {
    // Forzar habilitación temporal para prueba si hay credenciales
    if (process.env.XRPL_SEED || process.env.XRPL_SECRET) {
        process.env.XRPL_ENABLED = 'true';
    }
    
    await xrpService.connect();
    if (xrpService.isEnabled()) {
      console.log(`✅ Conectado a XRPL (${xrpService.network})`);
      const address = xrpService.getAddress();
      console.log(`📍 Dirección: ${address}`);
      
      try {
        const balanceInfo = await xrpService.getBalance();
        console.log(`💰 Balance: ${balanceInfo.balance} drops`);
      } catch (e) {
        console.log(`⚠️ Error obteniendo balance: ${e.message}`);
      }
    } else {
      console.log('⚪ XRPL no habilitado o conexión fallida.');
      console.log(`   Config: URL=${process.env.XRPL_NODE_URL || 'Default'}, Enabled=${process.env.XRPL_ENABLED}`);
    }
  } catch (error) {
    console.error('❌ Error verificando XRPL:', error.message);
  }

  // 3. Verificar ALGORAND (ALGO)
  console.log('\n--- 3. ALGORAND (ALGO) ---');
  try {
    if (process.env.ALGORAND_TOKEN || process.env.ALGORAND_MNEMONIC) {
        process.env.ALGORAND_ENABLED = 'true';
    }
    await algorandService.connect();
    if (algorandService.isEnabled()) {
      console.log(`✅ Conectado a Algorand (${algorandService.network})`);
      const address = algorandService.getAddress();
      console.log(`📍 Dirección: ${address}`);
      
      try {
        const balanceInfo = await algorandService.getBalance();
        console.log(`💰 Balance: ${balanceInfo.balanceMicroAlgos} microAlgos`);
      } catch (e) {
        console.log(`⚠️ Error obteniendo balance: ${e.message}`);
      }
    } else {
      console.log('⚪ Algorand no habilitado o conexión fallida.');
    }
  } catch (error) {
    console.error('❌ Error verificando Algorand:', error.message);
  }

  // 4. Verificar IPFS / FILECOIN
  console.log('\n--- 4. IPFS & FILECOIN ---');
  try {
    // Pinata
    console.log('📡 Verificando Pinata (IPFS)...');
    await ipfsService.testConnection();
    
    if (ipfsService.pinata) {
        console.log('✅ Pinata Client Configured.');
    } else {
        console.log('⚪ Pinata no configurado.');
    }

    // Lighthouse (Filecoin)
    console.log('📡 Verificando Lighthouse (Filecoin)...');
    if (process.env.LIGHTHOUSE_API_KEY) {
        console.log('✅ API Key de Lighthouse detectada.');
        // Podríamos intentar subir un texto pequeño de prueba
        try {
            const lighthouse = require('@lighthouse-web3/sdk');
            const balance = await lighthouse.getBalance(process.env.LIGHTHOUSE_API_KEY);
            console.log(`💰 Data Usage: ${JSON.stringify(balance.data)}`);
        } catch (e) {
             console.log(`⚠️ Error verificando Lighthouse: ${e.message}`);
             if (e.code === 'MODULE_NOT_FOUND') console.log('   (Módulo @lighthouse-web3/sdk no instalado)');
        }
    } else {
        console.log('⚪ Lighthouse (Filecoin) no configurado (Falta LIGHTHOUSE_API_KEY).');
    }

  } catch (error) {
    console.error('❌ Error verificando IPFS/Filecoin:', error.message);
  }

  console.log('\n🏁 Verificación completada.');
  process.exit(0);
}

verifyConnections();
