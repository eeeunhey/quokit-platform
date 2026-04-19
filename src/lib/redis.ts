import { Redis } from '@upstash/redis';

// 환경변수에 값이 없을 경우를 대비 (CI/CD 환경 또는 로컬에서 Redis 없을 때 죽지 않도록)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const redis = (redisUrl && redisToken) 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

/**
 * 안심하고 캐시를 세팅합니다. Redis 인스턴스가 없으면 넘깁니다. (Graceful degradation)
 */
export async function safeSetCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  if (!redis) {
    console.warn('[Redis] Redis client not initialized. Skipping cache set.');
    return;
  }
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('[Redis Error] Failed to set cache:', error);
  }
}

/**
 * 안심하고 캐시를 가져옵니다. (Graceful degradation)
 */
export async function safeGetCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return (typeof data === 'string' ? JSON.parse(data) : data) as T;
  } catch (error) {
    console.error('[Redis Error] Failed to get cache:', error);
    return null;
  }
}
