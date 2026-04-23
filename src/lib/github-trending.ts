import * as cheerio from 'cheerio';

/**
 * GitHub Trending 페이지 HTML 스크래퍼
 * 
 * github.com/trending을 파싱하여 실시간 트렌딩 레포를 가져옵니다.
 * GitHub Search API와 달리, "기존 레포 중 최근 스타가 급증한" 프로젝트를 포착합니다.
 * 
 * 이 모듈은 GitHub API를 사용하지 않으므로 Rate Limit에 영향을 주지 않습니다.
 */

export interface ScrapedTrendingRepo {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  language: string | null;
  languageColor: string | null;
  totalStars: number;
  totalForks: number;
  gainedStars: number;      // "530 stars today" 등에서 추출
  builtBy: { username: string; avatar: string }[];
}

/**
 * github.com/trending 페이지를 스크래핑하여 트렌딩 레포 목록을 반환합니다.
 * 
 * @param since - 'daily' | 'weekly' | 'monthly'
 * @param language - 프로그래밍 언어 필터 (선택, 예: 'python', 'typescript')
 * @returns 스크래핑된 레포 목록 (보통 25개)
 */
export async function scrapeTrendingRepos(
  since: 'daily' | 'weekly' | 'monthly' = 'daily',
  language?: string
): Promise<ScrapedTrendingRepo[]> {
  let url = `https://github.com/trending?since=${since}`;
  if (language && language !== 'all') {
    url += `&spoken_language_code=&language=${encodeURIComponent(language)}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    // Vercel serverless에서 타임아웃 방어
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    console.error(`[Scraper] GitHub trending fetch failed: ${response.status}`);
    return [];
  }

  const html = await response.text();
  return parseTrendingHTML(html);
}

/**
 * GitHub Trending HTML을 파싱하여 레포 목록으로 변환합니다.
 * 
 * GitHub 페이지 구조 변경에 대비하여 각 필드 파싱은 개별 try-catch로 보호됩니다.
 */
function parseTrendingHTML(html: string): ScrapedTrendingRepo[] {
  const $ = cheerio.load(html);
  const repos: ScrapedTrendingRepo[] = [];

  $('article.Box-row').each((_, article) => {
    try {
      const $article = $(article);

      // ─── 1. Owner / Name ───
      const repoLink = $article.find('h2 a, h1 a').first().attr('href')?.trim();
      if (!repoLink) return; // 필수 필드 없으면 스킵

      const parts = repoLink.replace(/^\//, '').split('/');
      if (parts.length < 2) return;

      const owner = parts[0];
      const name = parts[1];

      // ─── 2. Description ───
      const description = $article.find('p').first().text().trim() || '';

      // ─── 3. Language ───
      const langSpan = $article.find('[itemprop="programmingLanguage"]');
      const language = langSpan.length > 0 ? langSpan.text().trim() : null;

      const langColorSpan = $article.find('.repo-language-color, span[style*="background-color"]').first();
      const langStyle = langColorSpan.attr('style') || '';
      const colorMatch = langStyle.match(/background-color:\s*(#[a-fA-F0-9]+)/);
      const languageColor = colorMatch ? colorMatch[1] : null;

      // ─── 4. Stars / Forks (총계) ───
      const links = $article.find('a.Link--muted');
      let totalStars = 0;
      let totalForks = 0;

      links.each((_, link) => {
        const href = $(link).attr('href') || '';
        const text = $(link).text().replace(/,/g, '').trim();
        const num = parseInt(text, 10);
        if (isNaN(num)) return;

        if (href.includes('/stargazers')) {
          totalStars = num;
        } else if (href.includes('/network/members') || href.endsWith('/forks')) {
          totalForks = num;
        }
      });

      // ─── 5. Gained Stars ("530 stars today") ───
      let gainedStars = 0;
      const articleText = $article.text();
      const gainedMatch = articleText.match(/([\d,]+)\s+stars?\s+(today|this\s+week|this\s+month)/i);
      if (gainedMatch) {
        gainedStars = parseInt(gainedMatch[1].replace(/,/g, ''), 10) || 0;
      }

      // ─── 6. Built By (기여자 아바타) ───
      const builtBy: { username: string; avatar: string }[] = [];
      $article.find('a[data-hovercard-type="user"] img, span a img').each((_, img) => {
        const avatar = $(img).attr('src') || '';
        const alt = $(img).attr('alt') || '';
        const username = alt.replace(/^@/, '');
        if (username && avatar) {
          builtBy.push({ username, avatar });
        }
      });

      repos.push({
        owner,
        name,
        fullName: `${owner}/${name}`,
        description,
        language,
        languageColor,
        totalStars,
        totalForks,
        gainedStars,
        builtBy,
      });
    } catch (err) {
      // 개별 레포 파싱 실패는 무시하고 나머지 계속 처리
      console.warn('[Scraper] 개별 레포 파싱 실패:', err);
    }
  });

  return repos;
}
