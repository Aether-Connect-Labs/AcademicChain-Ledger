const hedera = require("./services/hederaService");

async function test() {
  try {
    console.log("1. Probando conexión a Hedera...");
    
    // Test de creación de token
    const token = await hedera.createToken({
      name: "Academic Test",
      symbol: "TEST"
    });
    console.log("2. Token creado:", token);
    
    // Test de acuñación NFT
    const nft = await hedera.mintNFT(token.tokenId, {
      student: "Test Student",
      degree: "Test Degree",
      date: new Date().toISOString()
    });
    console.log("3. NFT acuñado:", nft);
    
  } catch (error) {
    console.error("Error en la prueba:", error);
  }
}

test();
