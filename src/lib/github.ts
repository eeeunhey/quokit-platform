import { TrendingPeriod, ProgrammingLanguage } from '@/types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// GitHub Search 커스텀 헬퍼 
async function githubFetch(endpoint: string, options: RequestInit = {}) {
  const url = `https://api.github.com${endpoint}`;
  
  if (!GITHUB_TOKEN) {
    console.warn('[GitHub] GITHUB_TOKEN이 설정되지 않았습니다.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      // 토큰이 있을 때만 헤더에 추가 (로컬 테스트 예외 상황 방지)
      ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 기간 내에 생성된 레포지토리를 별점 순으로 검색합니다.
 */
export async function fetchTrendingRepositories(period: TrendingPeriod, language: ProgrammingLanguage = 'all') {
  // 기준 날짜 계산 로직 (간소화된 쿼리 빌드)
  const date = new Date();
  if (period === 'daily') date.setDate(date.getDate() - 1);
  else if (period === 'weekly') date.setDate(date.getDate() - 7);
  else if (period === 'monthly') date.setMonth(date.getMonth() - 1);

  const dateString = date.toISOString().split('T')[0];
  let query = `created:>${dateString}`;
  
  if (language !== 'all') {
    query += ` language:${language}`;
  }

  const data = await githubFetch(`/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`);
  return data.items;
}

/**
 * 특정 레포지토리의 상세 정보를 조회합니다.
 */
export async function getRepository(owner: string, name: string) {
  return await githubFetch(`/repos/${owner}/${name}`);
}

/**
 * 특정 레포지토리의 언어 사용량(bytes) 통계를 조회합니다.
 */
export async function getRepositoryLanguages(owner: string, name: string) {
  return await githubFetch(`/repos/${owner}/${name}/languages`);
}

/**
 * 레포지토리의 Raw README 내용을 마크다운으로 가져옵니다.
 */
export async function getReadme(owner: string, name: string): Promise<string | null> {
  try {
    const data = await githubFetch(`/repos/${owner}/${name}/readme`);
    if (!data.content) return null;
    // Base64 디코딩 (utf-8 처리)
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error(`[GitHub] README Fetch Failed (${owner}/${name}):`, error);
    return null;
  }
}
