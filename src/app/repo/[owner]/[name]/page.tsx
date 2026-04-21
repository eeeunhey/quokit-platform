import { Metadata } from 'next';
import Link from 'next/link';
import { Star, GitFork, ExternalLink, ArrowLeft, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LanguageBadge } from '@/components/ui/LanguageBadge';
import { MarkdownViewer } from '@/components/repo/MarkdownViewer';
import { formatCompactNumber, formatRelativeTime } from '@/lib/utils';
import prisma from '@/lib/db';
import { getRepository, getRepositoryLanguages, getReadme } from '@/lib/github';
import { translateReadme, translateDescription } from '@/lib/gemini';
// ⚠️ summarizeReadme는 제거됨 → 로컬 스크립트(scripts/daily-summary.ts)에서 별도 실행
import { findSimilarRepos } from '@/lib/similarity';

// ===== 데이터 Direct Fetcher (내부 HTTP 호출 제거 → 직접 DB/GitHub 접근) =====
async function getRepoDetail(owner: string, name: string) {
  const fullName = `${owner}/${name}`;
  
  try {
    // 1. DB 우선 조회
    let dbRepo = await prisma.repository.findUnique({
      where: { fullName }
    });

    // 2. DB에 없으면 GitHub API로 가져와서 저장
    if (!dbRepo) {
      const ghRepo = await getRepository(owner, name);
      if (!ghRepo || ghRepo.message === 'Not Found') return null;

      dbRepo = await prisma.repository.create({
        data: {
          githubId: ghRepo.id,
          fullName: ghRepo.full_name,
          name: ghRepo.name,
          ownerLogin: ghRepo.owner.login,
          ownerAvatarUrl: ghRepo.owner.avatar_url,
          description: ghRepo.description,
          htmlUrl: ghRepo.html_url,
          homepage: ghRepo.homepage,
          language: ghRepo.language,
          topics: ghRepo.topics || [],
          starsCount: ghRepo.stargazers_count,
          forksCount: ghRepo.forks_count,
          issuesCount: ghRepo.open_issues_count,
        }
      });
    }

    // 3. 언어 통계 (병렬)
    const langBytes = await getRepositoryLanguages(owner, name);
    let totalBytes = 0;
    const languages = [];
    
    for (const [lang, bytes] of Object.entries((langBytes as Record<string, number>))) {
      totalBytes += bytes;
      languages.push({ name: lang, size: bytes });
    }
    
    const enrichedLanguages = languages.map(l => ({
      ...l,
      percentage: totalBytes > 0 ? Math.round((l.size / totalBytes) * 100) : 0
    })).sort((a, b) => b.size - a.size);

    // 4. description 번역이 없으면 실시간 번역
    if (!dbRepo.descriptionKo && dbRepo.description) {
      const descKo = await translateDescription(dbRepo.description);
      if (descKo) {
        await prisma.repository.update({
          where: { id: dbRepo.id },
          data: { descriptionKo: descKo }
        }).catch(() => {});
        dbRepo = { ...dbRepo, descriptionKo: descKo };
      }
    }

    return {
      ...dbRepo,
      id: Number(dbRepo.id),
      githubId: Number(dbRepo.githubId),
      language_stats: enrichedLanguages
    };
  } catch (error) {
    console.error('[RepoDetail] Error:', error);
    return null;
  }
}

async function getReadmeKo(owner: string, name: string) {
  const fullName = `${owner}/${name}`;
  
  try {
    const repo = await prisma.repository.findUnique({
      where: { fullName },
      select: { id: true }
    });
    if (!repo) return null;

    // 1. DB 캐시 확인
    const cached = await prisma.translationCache.findUnique({
      where: { repoId: repo.id }
    });
    
    if (cached?.readmeKo) {
      return { readme_ko: cached.readmeKo, source: 'database' };
    }

    // 2. 실시간 번역
    const originalReadme = await getReadme(owner, name);
    if (!originalReadme) return { readme_ko: null, source: 'fallback_original' };

    const translated = await translateReadme(originalReadme);
    const finalOutput = translated || originalReadme;
    
    // 3. DB 저장 (fire-and-forget)
    if (translated) {
      prisma.translationCache.create({
        data: {
          repoId: repo.id,
          readmeOriginal: originalReadme,
          readmeKo: translated,
          tokensUsed: 0,
        }
      }).catch(() => {});
    }

    return { readme_ko: finalOutput, source: translated ? 'realtime' : 'fallback_original' };
  } catch (error) {
    console.error('[ReadmeKo] Error:', error);
    return null;
  }
}

async function getSimilarRepos(owner: string, name: string) {
  try {
    return await findSimilarRepos(owner, name);
  } catch {
    return [];
  }
}

// ===== 동적 메타데이터 =====
export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = await getRepoDetail(owner, name);
  const title = repo ? `${repo.fullName} 한국어 분석` : `${owner}/${name}`;
  const desc = repo?.descriptionKo || repo?.description || 'GitHub 레포 상세 분석';
  return {
    title,
    description: desc,
    openGraph: { title, description: desc },
  };
}

// ===== 상세 페이지 =====
export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;

  // 3가지 데이터를 병렬로 가져옴 (직접 DB/GitHub 접근 → HTTP 왕복 제거)
  const [repo, readmeData, similarRepos] = await Promise.all([
    getRepoDetail(owner, name),
    getReadmeKo(owner, name),
    getSimilarRepos(owner, name),
  ]);

  if (!repo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">레포지토리를 찾을 수 없습니다</h1>
        <p className="text-dark-muted mb-8">{owner}/{name} 정보가 아직 수집되지 않았습니다.</p>
        <Link href="/" className="text-brand-400 hover:underline">← 홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">

      {/* 뒤로가기 */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-dark-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 트렌딩 목록으로
      </Link>

      {/* ======= 헤더 섹션 ======= */}
      <header className="glass-card p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* 좌측: 이름 + 설명 */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {repo.language && <LanguageBadge language={repo.language} />}
              {(repo.topics as string[])?.slice(0, 4).map((t: string) => (
                <Badge key={t} variant="default" size="sm">{t}</Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
              {repo.ownerLogin} <span className="text-dark-muted font-normal">/</span> {repo.name}
            </h1>
            <p className="text-dark-text/80 text-lg leading-relaxed">
              {repo.descriptionKo || repo.description || '설명이 제공되지 않았습니다.'}
            </p>
          </div>

          {/* 우측: 통계 + 액션 */}
          <div className="flex flex-col items-end gap-4 shrink-0">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                <span className="font-bold text-lg text-white">{formatCompactNumber(repo.starsCount)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-dark-muted" />
                <span className="text-dark-muted">{formatCompactNumber(repo.forksCount)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-dark-muted" />
                <span className="text-dark-muted text-xs">{formatRelativeTime(repo.lastFetchedAt instanceof Date ? repo.lastFetchedAt.toISOString() : String(repo.lastFetchedAt))}</span>
              </div>
            </div>
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
            >
              GitHub에서 보기 <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 언어 통계 바 */}
        {repo.language_stats && repo.language_stats.length > 0 && (
          <div className="mt-6 pt-6 border-t border-dark-border/50">
            <h3 className="text-xs font-semibold text-dark-muted mb-2 uppercase tracking-wider">Language Breakdown</h3>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-dark-bg gap-0.5">
              {repo.language_stats.slice(0, 6).map((ls: any) => (
                <div
                  key={ls.name}
                  title={`${ls.name}: ${ls.percentage}%`}
                  className="h-full rounded-full first:rounded-l-full last:rounded-r-full transition-all"
                  style={{
                    width: `${Math.max(ls.percentage, 2)}%`,
                    backgroundColor:
                      ls.name === 'TypeScript' ? '#3178c6' :
                      ls.name === 'JavaScript' ? '#f1e05a' :
                      ls.name === 'Python' ? '#3572A5' :
                      ls.name === 'Go' ? '#00ADD8' :
                      ls.name === 'Rust' ? '#dea584' :
                      '#8b949e',
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-dark-muted">
              {repo.language_stats.slice(0, 6).map((ls: any) => (
                <span key={ls.name}>{ls.name} {ls.percentage}%</span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ======= AI 핵심 요약 (summary_ko) ======= */}
      {repo.summaryKo && (
        <section className="glass-card p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> AI 한국어 핵심 요약
          </h2>
          <div className="space-y-2 text-dark-text/90 leading-relaxed">
            {repo.summaryKo.split('\n').filter((s: string) => s.trim()).map((line: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5 shrink-0">•</span>
                <span>{line.replace(/^[•\-]\s*/, '')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======= 한국어 번역 README ======= */}
      <section className="glass-card p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🇰🇷</span> 한국어 번역 README
          </h2>
          {readmeData?.source && (
            <Badge variant={readmeData.source === 'database' ? 'success' : 'primary'} size="sm">
              {readmeData.source === 'database' ? '캐시 히트' 
               : readmeData.source === 'realtime' ? 'AI 실시간 번역' 
               : '원문 표시'}
            </Badge>
          )}
        </div>

        {readmeData?.readme_ko ? (
          <MarkdownViewer content={readmeData.readme_ko} />
        ) : (
          <div className="text-center py-12 text-dark-muted">
            <p className="text-lg mb-2">번역된 README가 아직 준비되지 않았습니다.</p>
            <p className="text-sm">크론 작업이 실행되면 자동으로 번역이 생성됩니다.</p>
            <a href={`${repo.htmlUrl}#readme`} target="_blank" rel="noreferrer"
              className="mt-4 inline-block text-brand-400 hover:underline text-sm">
              원문 README 보기 →
            </a>
          </div>
        )}
      </section>

      {/* ======= 유사 레포지토리 (P1) ======= */}
      {similarRepos.length > 0 && (
        <section className="glass-card p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">🔗</span> 유사한 프로젝트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarRepos.slice(0, 3).map((sr: any) => (
              <Link
                key={sr.full_name}
                href={`/repo/${sr.full_name}`}
                className="p-4 bg-dark-bg/50 rounded-xl border border-dark-border/50 hover:border-brand-500/30 transition-all group"
              >
                <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors mb-1 text-sm truncate">
                  {sr.full_name}
                </h3>
                <p className="text-xs text-dark-muted line-clamp-2 mb-3">
                  {sr.description || '설명 없음'}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-muted">⭐ {formatCompactNumber(sr.stars_count)}</span>
                  <Badge variant="primary" size="sm">
                    유사도 {sr.similarity_score}%
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ======= GitHub 원문 링크 강조 ======= */}
      <div className="text-center py-6 text-dark-muted text-sm">
        <p>이 정보는 AI가 자동으로 분석한 결과입니다. 정확한 내용은 원문을 확인하세요.</p>
        <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline mt-1 inline-block">
          {repo.fullName} GitHub 원문 바로가기 →
        </a>
      </div>
    </div>
  );
}
