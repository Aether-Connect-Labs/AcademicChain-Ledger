
import { Redis } from '@upstash/redis/cloudflare'

export class RedisService {
  private redis: Redis | null = null;
  private isMock: boolean = false;
  private mockStore: Map<string, any> = new Map();

  constructor(env: any) {
    const url = env.UPSTASH_REDIS_REST_URL || (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : undefined);
    const token = env.UPSTASH_REDIS_REST_TOKEN || (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : undefined);

    if (url && token && !url.includes('Mock')) {
      this.redis = new Redis({
        url: url,
        token: token,
      });
      console.log('✅ Redis Service Initialized (Real)');
    } else {
      this.isMock = true;
      console.log('⚠️ Redis Service Initialized (Mock Mode)');
    }
  }

  async set(key: string, value: any, ex?: number): Promise<void> {
    if (this.isMock) {
      this.mockStore.set(key, value);
      console.log(`[MockRedis] SET ${key}`);
      return;
    }
    try {
      if (ex) {
        await this.redis!.set(key, value, { ex });
      } else {
        await this.redis!.set(key, value);
      }
    } catch (e) {
      console.error('Redis SET Error:', e);
      // Fallback to mock if real fails? No, better to throw or log.
    }
  }

  async get(key: string): Promise<any> {
    if (this.isMock) {
      const val = this.mockStore.get(key);
      console.log(`[MockRedis] GET ${key} -> ${val ? 'HIT' : 'MISS'}`);
      return val;
    }
    try {
      return await this.redis!.get(key);
    } catch (e) {
      console.error('Redis GET Error:', e);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (this.isMock) {
      this.mockStore.delete(key);
      return;
    }
    try {
      await this.redis!.del(key);
    } catch (e) {
      console.error('Redis DEL Error:', e);
    }
  }
}
