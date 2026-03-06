
import { RedisService } from './src/services/redis.ts';

async function testRedis() {
  console.log('Testing Redis Service...');
  
  // 1. Mock Mode
  console.log('\n--- Mock Mode Test ---');
  const mockRedis = new RedisService({});
  await mockRedis.set('test-key', 'mock-value');
  const mockVal = await mockRedis.get('test-key');
  console.log('Mock Value:', mockVal);
  if (mockVal !== 'mock-value') throw new Error('Mock Redis Failed');

  // 2. Real Mode (if env provided)
  const realUrl = process.env.UPSTASH_REDIS_REST_URL;
  const realToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (realUrl && realToken) {
    console.log('\n--- Real Mode Test ---');
    const realRedis = new RedisService({
        UPSTASH_REDIS_REST_URL: realUrl,
        UPSTASH_REDIS_REST_TOKEN: realToken
    });
    await realRedis.set('test-real', 'real-value', 60);
    const realVal = await realRedis.get('test-real');
    console.log('Real Value:', realVal);
    if (realVal !== 'real-value') throw new Error('Real Redis Failed');
  } else {
    console.log('\n--- Real Mode Skipped (No Credentials) ---');
  }
}

testRedis().catch(console.error);
