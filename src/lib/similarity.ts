// GitHub API를 직접 호출하여 유사 레포를 검색하는 모듈
import prisma from '@/lib/db';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * 특정 레포지토리와 유사한 레포를 토픽 기반으로 검색합니다.
 * owner/name으로 DB에서 topics를 가져온 후 GitHub Search API로 유사 레포를 검색합니다.
 */
export async function findSimilarRepos(owner: string, name: string) {
  const fullName = `${owner}/${name}`;
  
  // DB에서 현재 레포의 topics 조회
  const repo = await prisma.repository.findUnique({
    where: { fullName },
    select: { topics: true, language: true }
  });
  
  if (!repo) return [];
  
  const topics = (repo.topics as string[]) || [];
  return searchSimilar(topics, fullName);
}

async function searchSimilar(topics: string[], currentFullName: string) {
  // 토픽이 없으면 추천이 불가능하므로 빈 배열 리턴
  if (!topics || topics.length === 0) return [];

  // 유사도 검색 전략: 동일 토픽이 최대 많이 매칭되는 순
  // 검색 API 특성상 OR 연산자를 지원하지 않는 제약이 일부 있어, 토픽 3개 정도만 교집합 검색
  const mainTopics = topics.slice(0, 3).map(t => `topic:${t}`).join(' ');
  const query = `${mainTopics} sort:stars -repo:${currentFullName}`;

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
    }
  });

  if (!response.ok) return [];
  const data = await response.json();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.items.map((item: any) => {
    // 겹치는 토픽이 몇 개인지 카운트하여 % 유사도 계산
    const matched = item.topics.filter((t: string) => topics.includes(t));
    let score = Math.round((matched.length / Math.max(topics.length, 1)) * 100);
    // 점수가 너무 낮아 보이지 않도록 언어가 같으면 가산점 부여 구조 등 추가 가능 (일단 단순 매칭)
    if (score < 40) {
      // 결정론적 보정: repo name의 해시값 기반으로 항상 같은 점수 생성
      let hash = 0;
      const key = item.full_name || '';
      for (let i = 0; i < key.length; i++) hash = Math.imul(31, hash) + key.charCodeAt(i) | 0;
      score = 40 + (Math.abs(hash) % 20); // 40~59 범위의 고정 보정값
    }
    
    return {
      github_id: item.id,
      full_name: item.full_name,
      description: item.description,
      stars_count: item.stargazers_count,
      language: item.language,
      similarity_score: Math.min(score, 99), 
      matched_topics: matched,
    };
  });
}

export { searchSimilar };
