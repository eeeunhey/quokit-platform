import { NextRequest, NextResponse } from 'next/server';

// Next.js 내장 캐시: Redis 없이 1시간 단위 자동 캐싱 (Vercel에서 무료로 동작)
export const revalidate = 3600;

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

// 언어 색상 매핑
const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#F05138',
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const metric = searchParams.get('metric') || 'stars';
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0');
  const lang = searchParams.get('lang') || '';

  // 해당 월의 시작일 ~ 종료일 계산
  const dateFrom = `${year}-${month}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const dateTo = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  try {
    let results: any[] = [];

    if (metric === 'stars' || metric === 'forks') {
      // 별점/포크: GitHub 저장소 검색 (해당 월에 푸시된 + 해당 지표 정렬)
      const langQuery = lang && lang !== 'all' ? `+language:${lang}` : '';
      const sortBy = metric === 'stars' ? 'stars' : 'forks';
      const url = `${GITHUB_API}/search/repositories?q=pushed:${dateFrom}..${dateTo}${langQuery}&sort=${sortBy}&order=desc&per_page=10`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();

      results = (data.items || []).map((repo: any) => ({
        name: repo.full_name,
        desc: repo.description || '설명 없음',
        lang: repo.language || 'Unknown',
        langColor: LANG_COLORS[repo.language] || '#6B7280',
        stars: repo.stargazers_count.toLocaleString(),
        forks: repo.forks_count.toLocaleString(),
        htmlUrl: repo.html_url,
        value: metric === 'stars'
          ? repo.stargazers_count.toLocaleString()
          : repo.forks_count.toLocaleString(),
      }));

    } else if (metric === 'issues') {
      // 신규 이슈: 특정 기간에 생성된 이슈가 많은 저장소
      const langQuery = lang && lang !== 'all' ? `+language:${lang}` : '';
      const url = `${GITHUB_API}/search/issues?q=type:issue+created:${dateFrom}..${dateTo}${langQuery}&sort=created&order=desc&per_page=30`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();

      // 저장소별로 이슈 개수 집계
      const repoMap: Record<string, any> = {};
      for (const item of (data.items || [])) {
        const repoName = item.repository_url.replace('https://api.github.com/repos/', '');
        if (!repoMap[repoName]) {
          repoMap[repoName] = { name: repoName, count: 0, htmlUrl: `https://github.com/${repoName}` };
        }
        repoMap[repoName].count++;
      }

      // 상위 10개 저장소에 추가 정보 보완
      const topRepos = Object.values(repoMap).sort((a: any, b: any) => b.count - a.count).slice(0, 10);
      results = topRepos.map((repo: any) => ({
        name: repo.name,
        desc: '신규 이슈 활동 저장소',
        lang: 'N/A',
        langColor: '#6B7280',
        stars: '-',
        forks: '-',
        htmlUrl: repo.htmlUrl,
        value: repo.count.toLocaleString(),
      }));

    } else if (metric === 'closed') {
      // 해결된 이슈
      const langQuery = lang && lang !== 'all' ? `+language:${lang}` : '';
      const url = `${GITHUB_API}/search/issues?q=type:issue+is:closed+closed:${dateFrom}..${dateTo}${langQuery}&sort=updated&order=desc&per_page=30`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();

      const repoMap: Record<string, any> = {};
      for (const item of (data.items || [])) {
        const repoName = item.repository_url.replace('https://api.github.com/repos/', '');
        if (!repoMap[repoName]) {
          repoMap[repoName] = { name: repoName, count: 0, htmlUrl: `https://github.com/${repoName}` };
        }
        repoMap[repoName].count++;
      }

      const topRepos = Object.values(repoMap).sort((a: any, b: any) => b.count - a.count).slice(0, 10);
      results = topRepos.map((repo: any) => ({
        name: repo.name,
        desc: '이슈 해결 활동 저장소',
        lang: 'N/A',
        langColor: '#6B7280',
        stars: '-',
        forks: '-',
        htmlUrl: repo.htmlUrl,
        value: repo.count.toLocaleString(),
      }));

    } else if (metric === 'merged') {
      // 병합된 PR
      const langQuery = lang && lang !== 'all' ? `+language:${lang}` : '';
      const url = `${GITHUB_API}/search/issues?q=type:pr+is:merged+merged:${dateFrom}..${dateTo}${langQuery}&sort=updated&order=desc&per_page=30`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();

      const repoMap: Record<string, any> = {};
      for (const item of (data.items || [])) {
        const repoName = item.repository_url.replace('https://api.github.com/repos/', '');
        if (!repoMap[repoName]) {
          repoMap[repoName] = { name: repoName, count: 0, htmlUrl: `https://github.com/${repoName}` };
        }
        repoMap[repoName].count++;
      }

      const topRepos = Object.values(repoMap).sort((a: any, b: any) => b.count - a.count).slice(0, 10);
      results = topRepos.map((repo: any) => ({
        name: repo.name,
        desc: 'PR 병합 활동 저장소',
        lang: 'N/A',
        langColor: '#6B7280',
        stars: '-',
        forks: '-',
        htmlUrl: repo.htmlUrl,
        value: repo.count.toLocaleString(),
      }));
    }

    return NextResponse.json({ success: true, data: results, meta: { metric, year, month } });

  } catch (error: any) {
    console.error('[Monthly API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
