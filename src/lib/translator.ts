import prisma from '@/lib/db';
import { safeSetCache, safeGetCache } from '@/lib/redis';
import { translateReadme } from '@/lib/gemini';
import { getReadme } from '@/lib/github';

/**
 * 다중 계층 캐싱(Multi-Layer Caching)이 적용된 README 한글 번역 반환.
 * 동작 흐름: Redis 조회 ➜ (없으면) DB 조회 ➜ (없으면) GitHub+Gemini 실시간 번역
 */
export async function getKoreanReadme(repoId: bigint, owner: string, name: string) {
  const cacheKey = `readme_ko:${owner}:${name}`;
  
  // 1. Redis 캐시 계층
  // 레디스에서 꺼낼때 JSON 파싱 에러 등을 막기 위한 간단 문자열 래퍼 사용
  const cachedRedis = await safeGetCache<{text: string}>(cacheKey);
  if (cachedRedis?.text) {
    return { data: cachedRedis.text, source: 'redis' as const };
  }

  // 2. Database 계층
  const cachedDb = await prisma.translationCache.findUnique({
    where: { repoId }
  });

  if (cachedDb?.readmeKo) {
    // DB에는 있는데 Redis에 없었던 상황이므로 Redis 갱신 (30일 TTL)
    await safeSetCache(cacheKey, { text: cachedDb.readmeKo }, 2592000);
    return { data: cachedDb.readmeKo, source: 'database' as const };
  }

  // 3. 실시간 번역 (로딩 지연을 최소화하기 위해 첫 800자만 번역)
  const originalReadme = await getReadme(owner, name);
  if (!originalReadme) return { data: null, source: 'fallback_original' as const };

  const translatedText = await translateReadme(originalReadme);
  const finalOutput = translatedText || originalReadme;
  
  // 성공적으로 가져왔다면 캐시/DB에 저장 (await로 인한 지연 방지를 위해 비동기로 던짐)
  if (translatedText) {
    Promise.all([
      prisma.translationCache.create({
        data: {
          repoId: repoId,
          readmeOriginal: originalReadme,
          readmeKo: translatedText,
          tokensUsed: 0,
        }
      }).catch(),
      safeSetCache(cacheKey, { text: translatedText }, 2592000)
    ]).catch();
  }

  return { data: finalOutput, source: translatedText ? 'gemini' : 'fallback_original' as const };
}
