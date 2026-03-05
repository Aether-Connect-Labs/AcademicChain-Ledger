
import { PinataService } from './src/services/pinata';
import { SecurityService } from './src/services/security';
import { BlockchainService } from './src/services/blockchain';
import { MongoService } from './src/services/mongo';

// Mock Env for testing
const MOCK_ENV = {
  PINATA_JWT: "placeholder-jwt",
  HEDERA_ACCOUNT_ID: "0.0.12345",
  HEDERA_PRIVATE_KEY: "302e020100300506032b657004220420" + "0".repeat(64), // Mock key
  HEDERA_NETWORK: "testnet",
  MONGO_DATA_API_KEY: "placeholder-mongo-key", // Simulate missing key to trigger mock success
  MONGO_APP_ID: "data-app-id"
};

async function runFullStackVerify() {
  console.log("🚀 Starting Full Stack Verification: PDF -> Pinata -> Hash -> Blockchain -> DB");

  // 1. Mock PDF Data / Smart CV Data
  const certificateData = {
    studentName: "Juan Perez",
    course: "Blockchain Engineering",
    date: new Date().toISOString(),
    institution: "AcademicChain University",
    skills: ["Solidity", "Rust", "Smart Contracts"]
  };
  console.log("📄 Generated Certificate Data:", certificateData);

  // 2. Generate SHA-256 Hash
  const hash = await SecurityService.generateSHA256(certificateData);
  console.log("🔒 Generated SHA-256 Hash:", hash);

  // 3. Upload to Pinata (IPFS)
  const pinata = new PinataService(MOCK_ENV.PINATA_JWT);
  const uploadResult = await pinata.uploadJSON({ ...certificateData, hash });
  console.log("☁️  Uploaded to Pinata:", uploadResult);

  if (!uploadResult.cid) {
    console.error("❌ Pinata Upload Failed");
  }

  // 4. Mint on Blockchain (Hedera)
  const blockchain = new BlockchainService(MOCK_ENV);
  const mintResult = await blockchain.mintOnHedera("0.0.56789", JSON.stringify({ cid: uploadResult.cid, hash }));
  console.log("⛓️  Minted on Hedera:", mintResult);

  // 5. Mint on Multi-Chain (XRP, Algorand)
  const xrpResult = await blockchain.mintOnXRPL("sEd...", { hash });
  console.log("✕  Minted on XRPL:", xrpResult);
  
  const algoResult = await blockchain.mintOnAlgorand("word word...", { hash });
  console.log("🅰️  Minted on Algorand:", algoResult);

  // 6. Save to Database (Mongo + D1 simulation)
  const dbRecord = {
    id: crypto.randomUUID(),
    student: certificateData.studentName,
    hash: hash,
    ipfsCid: uploadResult.cid,
    txHash: mintResult.txHash,
    chains: ['Hedera', 'XRPL', 'Algorand'],
    timestamp: new Date().toISOString(),
    metadata: {
        course: certificateData.course,
        institution: certificateData.institution
    }
  };
  
  const mongoService = new MongoService(MOCK_ENV);
  const mongoResult = await mongoService.saveCertificate(dbRecord);
  
  console.log(`💾 Saved to Database (Mongo Mode: ${mongoResult.mode}):`, dbRecord);

  return {
    success: true,
    steps: {
      hash,
      ipfs: uploadResult,
      blockchain: { hedera: mintResult, xrp: xrpResult, algo: algoResult },
      db: { record: dbRecord, mongoResult }
    }
  };
}

// Run if called directly
// In a real Worker, this would be an endpoint
if (typeof require !== 'undefined' && require.main === module) {
    runFullStackVerify().then(() => console.log("✅ Verification Complete"));
}

export { runFullStackVerify };
