# GitTrend Korea MVP Phase 1: 설계 및 구현 초안

본 문서는 "한국어 오픈소스 트렌드 큐레이션 플랫폼" MVP 버전을 위한 전체 아키텍처 및 상세 구현 초안입니다. 4주 MVP라는 제약사항 내에서 P0 핵심 요구사항을 서버리스 친화적으로 구현하는 데 초점을 맞추었습니다.

---

## 1. 전체 프로젝트 폴더 구조

Next.js 15 App Router 환경의 구조입니다. 불필요한 레이어를 줄이고 직관적인 구조를 지향합니다.

```text
gittrend-korea/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 전역 레이아웃 (헤더, 푸터)
│   │   ├── page.tsx           # 홈 (트렌딩 리스트)
│   │   ├── weekly/
│   │   │   └── page.tsx       # 주간 요약 페이지
│   │   ├── repo/[owner]/[name]/
│   │   │   └── page.tsx       # 레포 상세 페이지
│   │   └── api/
│   │       ├── cron/
│   │       │   ├── collect/route.ts  # GitHub 정보 수집 크론
│   │       │   └── summary/route.ts  # Gemini 요약 생성 크론
│   │       ├── repos/route.ts        # 홈 목록 API
│   │       ├── repos/[id]/route.ts   # 상세 API
│   │       └── weekly/route.ts       # 주간 API
│   ├── components/
│   │   ├── ui/                # 아토믹 UI (Badge, Card 등)
│   │   ├── layout/            # Header, Footer
│   │   ├── repo/              # RepoCard, DetailViewer 등 도메인 컴포넌트
│   │   └── filters/           # 카테고리 필터 등
│   ├── lib/
│   │   ├── supabase/          # Supabase DB 클라이언트
│   │   ├── github.ts          # GitHub API 유틸
│   │   ├── gemini.ts          # Gemini 프롬프트 및 API 유틸
│   │   ├── category.ts        # 카테고리 분류기
│   │   └── similarity.ts      # 규칙 기반 유사 레포 추출기
│   └── types/
│       └── index.ts           # 공통 TS 인터페이스
├── database/
│   └── init.sql               # Supabase 스키마
├── .env.example
├── tailwind.config.ts
└── next.config.ts
```

---

## 2. DB 스키마 SQL (Supabase용)

```sql
-- database/init.sql
-- UUID 확장을 활성화합니다.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. repos 테이블
CREATE TABLE repos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL UNIQUE,
  github_url TEXT NOT NULL,
  description TEXT,
  readme_excerpt TEXT,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  watchers INT,
  open_issues INT,
  language TEXT,
  license TEXT,
  topics JSONB DEFAULT '[]'::JSONB,
  avatar_url TEXT,
  homepage_url TEXT,
  created_at_github TIMESTAMP,
  pushed_at_github TIMESTAMP,
  updated_at_github TIMESTAMP,
  category TEXT NOT NULL DEFAULT 'Other',
  trending_score NUMERIC DEFAULT 0,
  collected_at TIMESTAMP DEFAULT now(),
  slug_owner TEXT NOT NULL,
  slug_name TEXT NOT NULL
);

CREATE INDEX idx_repos_stars ON repos(stars DESC);
CREATE INDEX idx_repos_category ON repos(category);
CREATE UNIQUE INDEX idx_repos_slug ON repos(slug_owner, slug_name);

-- 2. repo_summaries 테이블
CREATE TABLE repo_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  summary_ko TEXT NOT NULL,
  why_trending_ko TEXT,
  use_case_ko TEXT,
  recommended_for_ko TEXT,
  difficulty_level TEXT,
  caution_note_ko TEXT,
  generated_at TIMESTAMP DEFAULT now(),
  model_name TEXT DEFAULT 'gemini-2.5-flash',
  UNIQUE(repo_id)
);

-- 3. weekly_digests 테이블
CREATE TABLE weekly_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_key TEXT UNIQUE NOT NULL, -- ex) '2026-W16'
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary_ko TEXT,
  repo_ids JSONB DEFAULT '[]'::JSONB,
  generated_at TIMESTAMP DEFAULT now()
);

-- RLS (Row Level Security) - MVP에서는 기본적으로 Read-only 허용
ALTER TABLE repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on repos" ON repos FOR SELECT USING (true);
ALTER TABLE repo_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on repo_summaries" ON repo_summaries FOR SELECT USING (true);
ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on weekly_digests" ON weekly_digests FOR SELECT USING (true);
```

---

## 3. 환경변수 (`.env.example`)

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-cron # 보안 로직용

# GitHub API
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxx # 한도 증가용

# Gemini API
GEMINI_API_KEY=AIzaSyXxxxxxxxxxxxxxx

# Cron Security (Vercel Cron용 Auth Secret)
CRON_SECRET=your-random-secret-string
```

---

## 4. 핵심 타입 정의 (`src/types/index.ts`)

```typescript
export type Category = 'AI' | 'Frontend' | 'Backend' | 'Infra' | 'Productivity' | 'Other';

export interface Repository {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  github_url: string;
  description: string | null;
  readme_excerpt: string | null;
  stars: number;
  forks: number;
  language: string | null;
  license: string | null;
  topics: string[];
  category: Category;
  updated_at_github: string;
}

export interface RepoSummary {
  id: string;
  repo_id: string;
  summary_ko: string;
  why_trending_ko: string | null;
  use_case_ko: string | null;
  recommended_for_ko: string | null;
  difficulty_level: string | null;
  caution_note_ko: string | null;
  generated_at: string;
}

export interface UnifiedRepoData extends Repository {
  summary: RepoSummary | null;
}
```

---

## 5. GitHub 수집 유틸 설계 (`src/lib/github.ts`)

```typescript
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Search API 기반 Trending. (크롤링 대신 API로 대체 구축)
export async function fetchTrendingFromSearch(language?: string) {
  const date = new Date();
  date.setDate(date.getDate() - 3); // 3일 이내 생성 또는 푸시된 별 많은 레포
  const dateString = date.toISOString().split('T')[0];
  
  let q = `created:>${dateString} sort:stars-desc`;
  if (language) q += ` language:${language}`;

  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=30`, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!res.ok) throw new Error('GitHub API Error');
  const data = await res.json();
  return data.items;
}

export async function fetchReadmeExcerpt(owner: string, name: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3.raw'
    }
  });
  
  if (!res.ok) return '';
  const text = await res.text();
  return text.substring(0, 3000); // Excerpt만 발췌
}
```

---

## 6. Gemini 요약 생성 유틸 설계 (`src/lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateRepoSummary(description: string, topics: string[], readmeExcerpt: string) {
  const prompt = `
  당신은 시니어 개발자 멘토입니다. 아래 GitHub 프로젝트 정보를 분석하여 한국어 개발자들을 위한 리포트를 마크다운 없이 JSON 형식으로 작성하세요.
  
  Description: ${description}
  Topics: ${topics.join(', ')}
  README(부분): ${readmeExcerpt}
  
  요구사항 (절대 JSON 형식만 출력):
  {
    "summary_ko": "프로젝트의 핵심 목적 2~3줄 요약",
    "why_trending_ko": "왜 지금 사람들의 주목을 받는지 1줄 설명",
    "use_case_ko": "어떤 실무 프로젝트에 쓸 수 있는지 예시 1개",
    "recommended_for_ko": "주니어, 실무자, 리더 중 누구에게 추천하며 그 이유",
    "difficulty_level": "입문, 중급, 실무 중 택 1",
    "caution_note_ko": "이 프로젝트 도입 전 주의할 점 1줄"
  }
  `;

  const result = await model.generateContent(prompt);
  let text = result.response.text();
  // 마크다운 코드블록 제거 로직 등 추가 필요
  text = text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}
```

---

## 7. 카테고리 분류 유틸 (`src/lib/category.ts`)

```typescript
import { Category } from '@/types';

// 단순히 룰 기반 (Topic & Keyword)
export function categorizeRepo(topics: string[], language: string, description: string): Category {
  const text = `${topics.join(' ')} ${language} ${description}`.toLowerCase();
  
  if (text.includes('llm') || text.includes('ai') || text.includes('gpt') || text.includes('machine-learning')) {
    return 'AI';
  }
  if (text.includes('react') || text.includes('vue') || text.includes('frontend') || text.includes('css')) {
    return 'Frontend';
  }
  if (text.includes('api') || text.includes('backend') || text.includes('database') || text.includes('go')) {
    return 'Backend';
  }
  if (text.includes('k8s') || text.includes('docker') || text.includes('infra') || text.includes('devops')) {
    return 'Infra';
  }
  if (text.includes('cli') || text.includes('tool') || text.includes('productivity') || text.includes('nvim')) {
    return 'Productivity';
  }
  
  return 'Other';
}
```

---

## 8. 홈 페이지 구현 (`src/app/page.tsx`)

```tsx
// MVP: 서버 컴포넌트로 데이터 직접 Fetch (빠른 렌더링, SEO 친화적)
import { createClient } from '@/lib/supabase/server';
import RepoCard from '@/components/repo/RepoCard';

export default async function HomePage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient();
  let query = supabase.from('repos').select('*, summary:repo_summaries(*)').order('stars', { ascending: false }).limit(20);

  if (searchParams.category && searchParams.category !== 'All') {
    query = query.eq('category', searchParams.category);
  }

  const { data: repos } = await query;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">🔥 GitTrend Korea</h1>
        <p className="text-slate-400 mt-2">전 세계에서 지금 뜨는 오픈소스를 1분 만에 파악하세요</p>
      </header>

      {/* 카테고리 필터 (간단한 Link 조합) */}
      <nav className="flex gap-2 justify-center mb-8 flex-wrap">
        {['All', 'AI', 'Frontend', 'Backend', 'Infra', 'Productivity'].map(cat => (
          <a key={cat} href={cat === 'All' ? '/' : `/?category=${cat}`} 
             className={`px-4 py-1.5 rounded-full text-sm border ${searchParams.category === cat ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
            {cat}
          </a>
        ))}
      </nav>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {repos?.map(repo => (
           <RepoCard key={repo.id} repo={repo} />
        ))}
      </section>
    </main>
  );
}
```

---

## 9. 상세 페이지 구현 (`src/app/repo/[owner]/[name]/page.tsx`)

```tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function RepoDetailPage({ params }: { params: { owner: string, name: string } }) {
  const supabase = createClient();
  const { data: repo } = await supabase
    .from('repos')
    .select('*, summary:repo_summaries(*)')
    .eq('slug_owner', params.owner)
    .eq('slug_name', params.name)
    .single();

  if (!repo) notFound();

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="border-b border-slate-800 pb-8 mb-8">
        <div className="flex gap-2 items-center mb-4">
          <span className="px-2 py-1 bg-slate-800 text-xs rounded text-slate-300">{repo.category}</span>
          <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">{repo.language}</span>
          <span className="flex items-center gap-1 text-slate-400 text-sm">⭐ {repo.stars}</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{repo.owner} / {repo.name}</h1>
        <a href={repo.github_url} target="_blank" className="text-indigo-400 hover:underline">View on GitHub ↗</a>
      </div>

      {/* AI Summary Section */}
      {repo.summary ? (
        <article className="space-y-8">
          <section className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <h2 className="text-xl font-semibold mb-3 text-white">📝 한글 핵심 요약</h2>
            <p className="text-slate-300 leading-relaxed">{repo.summary.summary_ko}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="p-5 bg-slate-900 rounded-lg border border-slate-800">
              <h3 className="text-sm font-bold text-indigo-400 mb-2">🔥 왜 지금 뜨는가?</h3>
              <p className="text-sm text-slate-300">{repo.summary.why_trending_ko}</p>
            </section>
            
            <section className="p-5 bg-slate-900 rounded-lg border border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 mb-2">🎯 실무 사용 예시</h3>
              <p className="text-sm text-slate-300">{repo.summary.use_case_ko}</p>
            </section>
            
            <section className="p-5 bg-slate-900 rounded-lg border border-slate-800">
              <h3 className="text-sm font-bold text-green-400 mb-2">👨‍💻 추천 대상</h3>
              <p className="text-sm text-slate-300">난이도: {repo.summary.difficulty_level} <br/> {repo.summary.recommended_for_ko}</p>
            </section>

            <section className="p-5 bg-slate-900 rounded-lg border border-slate-800">
              <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ 주의할 점</h3>
              <p className="text-sm text-slate-300">{repo.summary.caution_note_ko}</p>
            </section>
          </div>
        </article>
      ) : (
        <div className="text-slate-500">요약 정보가 아직 생성되지 않았습니다.</div>
      )}
    </main>
  );
}
```

---

## 10. 주간 페이지 구현 (`src/app/weekly/page.tsx`)

```tsx
import { createClient } from '@/lib/supabase/server';

// /weekly 페이지는 MVP 기준 최신 1주의 weekly_digests를 로드
export default async function WeeklyPage() {
  const supabase = createClient();
  const { data: digests } = await supabase
    .from('weekly_digests')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(5); // 카테고리별로 5개

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">주간 트렌드 요약 🗓️</h1>
      <p className="text-slate-400 mb-10">이번 주 카테고리별 핵심 오픈소스를 팀원들과 공유하세요.</p>

      <div className="space-y-12">
        {digests?.map((digest) => (
          <section key={digest.id}>
            <h2 className="text-2xl font-bold border-b border-slate-800 pb-2 mb-4 text-indigo-300">
              {digest.category}
            </h2>
            <div className="p-6 bg-slate-800/20 rounded-xl">
              <h3 className="font-semibold text-lg mb-2">{digest.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {digest.summary_ko}
              </p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
```

---

## 11. 유사 레포 추천 유틸 (간단 버전) (`src/lib/similarity.ts`)

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getSimilarRepos(repoId: string, currentCategory: string, currentTopics: string[]) {
  const supabase = createClient();
  // MVP 방식: 동일 카테고리 내에서 랜덤하게 뽑거나, stars가 높은 순으로 3개. 
  // P1 이므로 PostgreSQL 내장 쿼리로 공통 Topic이 많은 순서 정렬은 로직이 복잡하므로 JS Layer에서 Fallback 처리
  
  const { data: repos } = await supabase
    .from('repos')
    .select('id, owner, name, description, stars')
    .eq('category', currentCategory)
    .neq('id', repoId)
    .order('stars', { ascending: false })
    .limit(15);
    
  if (!repos) return [];

  // JS 로직: 토픽 교집합 크기로 Sort (MVP 수준)
  const sorted = repos.sort(() => 0.5 - Math.random()); // 단순화: 일단 랜덤 후 정렬. 
  return sorted.slice(0, 3).map(r => ({ ...r, simliarity_reason: '동일한 기술 생태계를 사용함' }));
}
```

---

## 12. Next.js Route Handlers (백그라운드 크론잡)

```typescript
// src/app/api/cron/collect/route.ts
import { NextResponse } from 'next/server';
import { fetchTrendingFromSearch, fetchReadmeExcerpt } from '@/lib/github';
import { categorizeRepo } from '@/lib/category';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  const items = await fetchTrendingFromSearch();
  
  for (const item of items) {
    const readme = await fetchReadmeExcerpt(item.owner.login, item.name);
    const category = categorizeRepo(item.topics, item.language, item.description || '');
    
    await supabase.from('repos').upsert({
      owner: item.owner.login,
      name: item.name,
      full_name: item.full_name,
      github_url: item.html_url,
      description: item.description,
      readme_excerpt: readme,
      stars: item.stargazers_count,
      language: item.language,
      topics: item.topics,
      category,
      slug_owner: item.owner.login.toLowerCase(),
      slug_name: item.name.toLowerCase()
    }, { onConflict: 'full_name' });
  }
  
  return NextResponse.json({ success: true, count: items.length });
}
```

```typescript
// src/app/api/cron/summary/route.ts
import { NextResponse } from 'next/server';
import { generateRepoSummary } from '@/lib/gemini';
// supabase init 동일

export async function GET(req: Request) {
  // 인증 체크 로직...
  
  // repo_summaries 에 없는 레디 레포 3건 조회 (타임아웃 방지)
  let { data: repos } = await supabase
    .from('repos')
    .select('id, description, topics, readme_excerpt')
    .not('id', 'in', `(select repo_id from repo_summaries)`)
    .limit(3);

  if (!repos) return NextResponse.json({ success: true, count: 0 });

  for (const repo of repos) {
    const summary = await generateRepoSummary(repo.description, repo.topics, repo.readme_excerpt);
    
    await supabase.from('repo_summaries').insert({
      repo_id: repo.id,
      summary_ko: summary.summary_ko,
      why_trending_ko: summary.why_trending_ko,
      use_case_ko: summary.use_case_ko,
      recommended_for_ko: summary.recommended_for_ko,
      difficulty_level: summary.difficulty_level,
      caution_note_ko: summary.caution_note_ko
    });
  }
  
  return NextResponse.json({ success: true, processed: repos.length });
}
```

---

## 13. 샘플 더미 데이터 (SQL Insert)

개발 단계 UI 테스트용 더미 데이터입니다. DB 설정 후 바로 실행 가능합니다.

```sql
INSERT INTO repos (id, owner, name, full_name, github_url, description, stars, language, category, slug_owner, slug_name)
VALUES 
('d1111111-1111-1111-1111-111111111111', 'vercel', 'next.js', 'vercel/next.js', 'https://github.com/vercel/next.js', 'The React Framework', 120000, 'TypeScript', 'Frontend', 'vercel', 'next.js');

INSERT INTO repo_summaries (repo_id, summary_ko, why_trending_ko, use_case_ko, recommended_for_ko, difficulty_level, caution_note_ko)
VALUES 
('d1111111-1111-1111-1111-111111111111', 'React 기반의 풀스택 웹 애플리케이션 프레임워크입니다. SSR, 라우팅 등을 기본 지원합니다.', 'App Router와 Server Action 도입으로 생태계의 표준이 됨', 'SEO가 중요한 기업형 랜딩 페이지나 SaaS 구축', '실무자 (빠른 프로덕트 배포가 필요한 팀)', '실무', 'App Router 러닝 커브가 상당하므로 작은 토이프로젝트엔 오버스펙일 수 있음');
```

---

## 14. 실행 방법

**1. 패키지 설치**
```bash
npm install
npm install @supabase/supabase-js @google/generative-ai
npm install lucide-react clsx tailwind-merge
```

**2. 환경변수 설정**
`.env.example` 파일을 복사하여 `.env.local` 생성 후 토큰 주입

**3. DB 스키마 런칭**
Supabase 대시보드의 SQL Editor에 `database/init.sql` 내용 복사 후 RUN

**4. 더미 수집 크론 수동 실행**
초기 데이터 확보를 위해 브라우저나 Postman에서 아래 경로 접속
- `http://localhost:3000/api/cron/collect` (수집)
- `http://localhost:3000/api/cron/summary` (AI 요약)
*(보안을 위해 로컬 개발 시에는 Auth Check 임시 해제 요망)*

**5. 프론트엔드 실행**
```bash
npm run dev
```
접속 URL: `http://localhost:3000`

---

## 15. 향후 확장 포인트 (P2 고려 설계)

향후 P2 확장을 고려하여 아키텍처는 아래와 같은 future-ready 상태를 보장합니다.

1. **사용자 로그인 및 개인화 (Auth)**
   - Supabase Auth를 얹기 좋은 상태입니다. `users` 테이블 추가 및 RLS(Row Level Security) 강화를 통해 1시간 이내에 로그인 레이어를 씌울 수 있습니다.
2. **벡터DB (Qdrant) 연동**
   - 레포 정보와 AI Summary를 임베딩 벡터로 뽑아 Qdrant에 저장하면, 단순 토픽 비교 방식에서 👉 `의미론적(Semantic) 유사 레포 추천`으로 즉시 진화 가능합니다.
3. **포크 쇼케이스 게시판**
   - `repos(fk) - showcases(글)` 관계형 테이블을 만들어, "이 레포를 가지고 내가 이렇게 만들었다"는 개발자 뽐내기 커뮤니티로 확장이 가능합니다.
4. **뉴스레터 자동화**
   - `weekly_digests` 테이블을 이미 설계 해두었으므로, 주간마다 해당 Row를 읽어 Mailchimp/Resend API로 뿌리는 Lambda/Route만 추가하면 됩니다.
