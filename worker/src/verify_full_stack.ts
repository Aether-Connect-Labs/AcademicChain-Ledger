import { PinataService } from './services/pinata';
import { SecurityService } from './services/security';
import { BlockchainService } from './services/blockchain';
import { MongoService } from './services/mongo';

export async function runFullStackVerify(env: any = {}) {
  console.log("🚀 Starting Full Stack Verification: PDF -> Pinata -> Hash -> Blockchain -> DB");

  // Load Env from argument or process (populated by proof_of_work.ts or system)
  const ENV = {
    PINATA_JWT: env.PINATA_JWT || (typeof process !== 'undefined' ? process.env?.PINATA_JWT : undefined),
    HEDERA_ACCOUNT_ID: env.HEDERA_ACCOUNT_ID || (typeof process !== 'undefined' ? process.env?.HEDERA_ACCOUNT_ID : undefined),
    HEDERA_PRIVATE_KEY: env.HEDERA_PRIVATE_KEY || (typeof process !== 'undefined' ? process.env?.HEDERA_PRIVATE_KEY : undefined),
    HEDERA_NETWORK: "testnet",
    XRP_SECRET: env.XRP_SECRET || (typeof process !== 'undefined' ? process.env?.XRP_SECRET : undefined),
    ALGORAND_MNEMONIC: env.ALGORAND_MNEMONIC || (typeof process !== 'undefined' ? process.env?.ALGORAND_MNEMONIC : undefined),
    MONGO_DATA_API_KEY: env.MONGO_API_KEY || (typeof process !== 'undefined' ? process.env?.MONGO_API_KEY : undefined),
    MONGO_APP_ID: env.MONGO_APP_ID || (typeof process !== 'undefined' ? process.env?.MONGO_APP_ID : undefined)
  };

  const isReal = ENV.HEDERA_PRIVATE_KEY && !ENV.HEDERA_PRIVATE_KEY.includes('Mock');
  console.log(`ℹ️  Running in ${isReal ? 'REAL' : 'MOCK/SIMULATION'} Mode`);
  if (isReal) {
      console.log("   (Using provided credentials for Hedera, XRP, Algorand, Pinata)");
  }

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
  const pinata = new PinataService(ENV.PINATA_JWT || 'placeholder');
  const uploadResult = await pinata.uploadJSON({ ...certificateData, hash });
  console.log("☁️  Uploaded to Pinata:", uploadResult);

  if (!uploadResult.cid) {
    console.warn("⚠️ Pinata Upload returned no CID (likely mock mode or error)");
  }

  // 4. Mint on Blockchain (Hedera)
  const blockchain = new BlockchainService(ENV);
  // Pass 'MockTopicID' to trigger new topic creation since we don't have a static one yet
  const mintResult = await blockchain.mintOnHedera("MockTopicID", JSON.stringify({ cid: uploadResult.cid, hash }));
  console.log("⛓️  Minted on Hedera:", mintResult);

  // 5. Mint on Multi-Chain (XRP, Algorand)
  console.log("Starting XRP Minting...");
  let xrpResult;
  try {
      xrpResult = await blockchain.mintOnXRPL(ENV.XRP_SECRET || '', { hash });
  } catch (e) {
      console.error("XRP Minting Crashed:", e);
      xrpResult = { success: false, chain: 'XRPL', error: 'Crashed' };
  }
  console.log("✕  Minted on XRPL:", xrpResult);
  
  console.log("Starting Algorand Minting...");
  let algoResult;
  try {
      algoResult = await blockchain.mintOnAlgorand(ENV.ALGORAND_MNEMONIC || '', { hash });
  } catch (e) {
      console.error("Algorand Minting Crashed:", e);
      algoResult = { success: false, chain: 'Algorand', error: 'Crashed' };
  }
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
  
  const mongoService = new MongoService(ENV);
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
