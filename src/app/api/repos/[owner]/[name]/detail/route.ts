import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { safeGetCache, safeSetCache } from '@/lib/redis';
import { CACHE_TTL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const resolvedParams = await params;
  const { owner, name } = resolvedParams;
  const fullName = `${owner}/${name}`;
  const cacheKey = `modal_detail_v2:${fullName}`;

  try {
    const cached = await safeGetCache<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    // 보안: 백엔드에서만 사용
    const TOKEN = process.env.GITHUB_WEBHOOK_SECRET || process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_DISPLAY_TOKEN || '';
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'QUOK-IT-Backend',
    };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

    // 1) 병렬로 GitHub API 호출
    const [repoRes, contribRes, commitRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${fullName}`, { headers }).catch(() => null),
      fetch(`https://api.github.com/repos/${fullName}/contributors?per_page=1&anon=true`, { headers }).catch(() => null),
      fetch(`https://api.github.com/repos/${fullName}/commits?per_page=1`, { headers }).catch(() => null)
    ]);

    let repoData: any = {};
    if (repoRes && repoRes.ok) repoData = await repoRes.json();

    let contributors_count = 0;
    if (contribRes && contribRes.ok) {
      const linkHeader = contribRes.headers.get('Link') || '';
      const match = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
      contributors_count = match ? parseInt(match[1]) : (await contribRes.json()).length || 1;
    }

    let last_commit_at: string | null = null;
    let last_commit_message: string | null = null;
    if (commitRes && commitRes.ok) {
      const commits = await commitRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        last_commit_at = commits[0].commit?.author?.date || null;
        last_commit_message = commits[0].commit?.message?.split('\n')[0] || null;
      }
    }

    // 2) DB에서 README 번역본 가져오기
    let readme_ko: string | null = null;
    let readme_original: string | null = null;
    
    const dbRepo = await prisma.repository.findUnique({
      where: { fullName },
      include: { translationCache: true }
    });

    if (dbRepo?.translationCache) {
      readme_ko = dbRepo.translationCache.readmeKo;
      readme_original = dbRepo.translationCache.readmeOriginal;
    }

    const responseData = {
      contributors_count,
      last_commit_at,
      last_commit_message,
      license_name: repoData.license?.spdx_id || repoData.license?.name || null,
      created_at: repoData.created_at || dbRepo?.createdAt || new Date().toISOString(),
      pushed_at: repoData.pushed_at || null,
      open_issues_count: repoData.open_issues_count || 0,
      watchers_count: repoData.watchers_count || 0,
      default_branch: repoData.default_branch || 'main',
      readme_ko,
      readme_original,
    };

    await safeSetCache(cacheKey, responseData, 3600); // 1시간 캐싱
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('[Modal Proxy Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
