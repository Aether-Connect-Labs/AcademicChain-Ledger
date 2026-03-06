import { PinataService } from './services/pinata.ts';
import { SecurityService } from './services/security.ts';
import { BlockchainService } from './services/blockchain.ts';
import { MongoService } from './services/mongo.ts';
import { RedisService } from './services/redis.ts';

export async function runFullStackVerify(env: any = {}) {
  console.log("🚀 Starting Full Stack Verification: PDF -> Pinata -> Hash -> Blockchain -> DB");

  // Load Env from argument or process
  const ENV = {
    PINATA_JWT: env.PINATA_JWT || (typeof process !== 'undefined' ? process.env?.PINATA_JWT : undefined),
    HEDERA_ACCOUNT_ID: env.HEDERA_ACCOUNT_ID || (typeof process !== 'undefined' ? process.env?.HEDERA_ACCOUNT_ID : undefined),
    HEDERA_PRIVATE_KEY: env.HEDERA_PRIVATE_KEY || (typeof process !== 'undefined' ? process.env?.HEDERA_PRIVATE_KEY : undefined),
    HEDERA_NETWORK: "testnet",
    XRP_SECRET: env.XRP_SECRET || (typeof process !== 'undefined' ? process.env?.XRP_SECRET : undefined),
    ALGORAND_MNEMONIC: env.ALGORAND_MNEMONIC || (typeof process !== 'undefined' ? process.env?.ALGORAND_MNEMONIC : undefined),
    MONGO_DATA_API_KEY: env.MONGO_API_KEY || (typeof process !== 'undefined' ? process.env?.MONGO_API_KEY : undefined),
    MONGO_APP_ID: env.MONGO_APP_ID || (typeof process !== 'undefined' ? process.env?.MONGO_APP_ID : undefined),
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL || (typeof process !== 'undefined' ? process.env?.UPSTASH_REDIS_REST_URL : undefined),
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN || (typeof process !== 'undefined' ? process.env?.UPSTASH_REDIS_REST_TOKEN : undefined)
  };

  const isReal = ENV.HEDERA_PRIVATE_KEY && !ENV.HEDERA_PRIVATE_KEY.includes('Mock');
  console.log(`ℹ️  Running in ${isReal ? 'REAL' : 'MOCK/SIMULATION'} Mode`);

  // 1. Mock PDF Data
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

  // 4. Instantiate Services
  const blockchain = new BlockchainService(ENV);
  const mongoService = new MongoService(ENV);
  const redis = new RedisService(ENV);

  // ⚡ OpenClaw Strategy: Parallel Execution of Independent Tasks
  console.log("⚡ OpenClaw Strategy: Starting Parallel Independent Tasks...");

  const independentTasks = [
      // Task A: Upload to Pinata (Critical Path)
      (async () => {
          const pinata = new PinataService(ENV.PINATA_JWT || 'placeholder');
          const res = await pinata.uploadJSON({ ...certificateData, hash });
          console.log("☁️  Uploaded to Pinata:", res);
          return { type: 'pinata', result: res };
      })(),
      // Task B: Verify Redis (Side Task)
      (async () => {
          console.log("⚡ Verifying Redis Cache Layer...");
          const cacheKey = `verify:fullstack:${Date.now()}`;
          await redis.set(cacheKey, { status: 'verified', timestamp: Date.now() }, 60);
          const res = await redis.get(cacheKey);
          console.log("   Redis Cache Result:", res ? "HIT (Success)" : "MISS (Failed)");
          return { type: 'redis', result: res ? 'verified' : 'failed' };
      })()
  ];

  const [pinataTask, redisTask] = await Promise.all(independentTasks);
  const uploadResult = pinataTask.result;
  const cacheResult = redisTask.result;

  // 5. Mint on Multi-Chain (Parallelized)
  console.log("⚡ Starting Parallel Multi-Chain Minting (Hedera, XRPL, Algorand)...");
  
  const mintPromises = [
      // Hedera Task
      (async () => {
          try {
             const res = await blockchain.mintOnHedera("MockTopicID", JSON.stringify({ cid: uploadResult.cid, hash }));
             console.log("⛓️  Minted on Hedera:", res);
             return { chain: 'Hedera', result: res };
          } catch (e) {
             console.error("Hedera Minting Failed:", e);
             return { chain: 'Hedera', error: e };
          }
      })(),
      // XRPL Task
      (async () => {
          try {
              const res = await blockchain.mintOnXRPL(ENV.XRP_SECRET || '', { hash });
              console.log("✕  Minted on XRPL:", res);
              return { chain: 'XRPL', result: res };
          } catch (e) {
              console.error("XRP Minting Crashed:", e);
              return { chain: 'XRPL', error: 'Crashed' };
          }
      })(),
      // Algorand Task
      (async () => {
          try {
              const res = await blockchain.mintOnAlgorand(ENV.ALGORAND_MNEMONIC || '', { hash });
              console.log("🅰️  Minted on Algorand:", res);
              return { chain: 'Algorand', result: res };
          } catch (e) {
              console.error("Algorand Minting Crashed:", e);
              return { chain: 'Algorand', error: 'Crashed' };
          }
      })()
  ];

  const results = await Promise.all(mintPromises);
  
  const hederaResult = results.find(r => r.chain === 'Hedera')?.result || { success: false };
  const xrpResult = results.find(r => r.chain === 'XRPL')?.result || { success: false };
  const algoResult = results.find(r => r.chain === 'Algorand')?.result || { success: false };

  // 6. Save to Database (Mongo + D1 simulation)
  const dbRecord = {
    id: crypto.randomUUID(),
    student: certificateData.studentName,
    hash: hash,
    ipfsCid: uploadResult.cid,
    txHash: hederaResult.txHash || 'pending',
    chains: results.filter(r => !r.error && r.result?.success).map(r => r.chain),
    timestamp: new Date().toISOString(),
    metadata: {
        course: certificateData.course,
        institution: certificateData.institution
    }
  };
  
  const mongoResult = await mongoService.saveCertificate(dbRecord);
  console.log(`💾 Saved to Database (Mongo Mode: ${mongoResult.mode}):`, dbRecord);

  return {
    success: true,
    steps: {
      hash,
      ipfs: uploadResult,
      hedera: hederaResult,
      xrp: xrpResult,
      algorand: algoResult,
      mongo: { ...mongoResult, data: dbRecord },
      redis: cacheResult
    }
  };
}
