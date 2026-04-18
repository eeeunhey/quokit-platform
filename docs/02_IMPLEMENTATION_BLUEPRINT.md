# 🏗️ GitTrend Korea — 구현 마스터 블루프린트

> **이 문서는 다른 AI가 프로젝트를 처음부터 끝까지 구현할 수 있도록 작성된 완전한 구현 명세서입니다.**
> **모든 파일, 모든 함수, 모든 타입, 모든 API를 빠짐없이 포함합니다.**

---

## 📋 구현 전 필독 사항

### 이 프로젝트가 무엇인가?
GitHub에서 가장 인기 있는(트렌딩) 레포지토리를 한국어로 번역하여 보여주고, 유사한 레포를 추천하며, 포크 활용 사례를 공유하는 웹 플랫폼입니다.

### 기술 스택 (변경 불가)
| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 15.x |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 3.x |
| DB | Supabase (PostgreSQL) | - |
| 캐시 | Upstash Redis | - |
| 번역 AI | Google Gemini 2.0 Flash | - |
| 패키지 매니저 | npm | - |

### 핵심 설계 원칙
1. **캐시 퍼스트**: 모든 외부 API 호출은 반드시 캐싱을 거쳐야 한다
2. **한국어 퍼스트**: 모든 UI 텍스트는 한국어로 작성
3. **무료 퍼스트**: 모든 서비스는 무료 티어 내에서 동작해야 한다
4. **SEO 퍼스트**: SSR/SSG를 적극 활용하여 검색 노출 극대화

---

## 1. 완전한 프로젝트 파일 구조

```
gittrend-korea/
├── .env.local                          # 환경변수 (절대 커밋 금지)
├── .env.example                        # 환경변수 예시 (커밋용)
├── .gitignore
├── next.config.ts                      # Next.js 설정
├── package.json                        # 의존성
├── tsconfig.json                       # TypeScript 설정
├── tailwind.config.ts                  # Tailwind 설정
├── postcss.config.mjs                  # PostCSS 설정
├── vercel.json                         # Vercel 배포 + 크론잡 설정
├── README.md
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png                    # Open Graph 이미지 (1200×630)
│   └── logo.svg                        # 사이트 로고
│
├── src/
│   ├── app/                            # Next.js App Router 페이지
│   │   ├── layout.tsx                  # 루트 레이아웃 (헤더, 푸터 포함)
│   │   ├── page.tsx                    # 메인 페이지 (= 트렌딩 대시보드)
│   │   ├── globals.css                 # 글로벌 CSS + 디자인 토큰
│   │   ├── loading.tsx                 # 루트 로딩 UI
│   │   ├── error.tsx                   # 루트 에러 UI
│   │   ├── not-found.tsx               # 404 페이지
│   │   │
│   │   ├── trending/
│   │   │   └── page.tsx                # 트렌딩 전체 목록 (필터 포함)
│   │   │
│   │   ├── repo/
│   │   │   └── [owner]/
│   │   │       └── [name]/
│   │   │           ├── page.tsx        # 레포 한글 상세 페이지
│   │   │           └── similar/
│   │   │               └── page.tsx    # 유사 레포 비교 페이지
│   │   │
│   │   ├── showcase/
│   │   │   ├── page.tsx                # 포크 쇼케이스 목록
│   │   │   └── [id]/
│   │   │       └── page.tsx            # 쇼케이스 상세 (Phase 2)
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx                # 검색 결과 페이지
│   │   │
│   │   └── api/                        # API 라우트 (서버사이드)
│   │       ├── trending/
│   │       │   └── route.ts            # GET /api/trending
│   │       ├── repos/
│   │       │   └── [owner]/
│   │       │       └── [name]/
│   │       │           ├── route.ts    # GET /api/repos/:owner/:name
│   │       │           ├── readme-ko/
│   │       │           │   └── route.ts # GET /api/repos/:owner/:name/readme-ko
│   │       │           └── similar/
│   │       │               └── route.ts # GET /api/repos/:owner/:name/similar
│   │       ├── search/
│   │       │   └── route.ts            # GET /api/search?q=검색어
│   │       └── cron/
│   │           ├── fetch-trending/
│   │           │   └── route.ts        # 크론잡: 트렌딩 수집
│   │           └── translate-new/
│   │               └── route.ts        # 크론잡: 신규 레포 번역
│   │
│   ├── components/                     # 재사용 가능한 UI 컴포넌트
│   │   ├── layout/
│   │   │   ├── Header.tsx              # 사이트 헤더 (네비게이션)
│   │   │   ├── Footer.tsx              # 사이트 푸터
│   │   │   └── MobileNav.tsx           # 모바일 햄버거 메뉴
│   │   │
│   │   ├── trending/
│   │   │   ├── TrendingCard.tsx         # 트렌딩 레포 카드
│   │   │   ├── TrendingList.tsx         # 트렌딩 카드 목록
│   │   │   ├── TrendingFilters.tsx      # 기간/언어/카테고리 필터
│   │   │   ├── PeriodTabs.tsx           # 일간/주간/월간 탭
│   │   │   └── MiniStarChart.tsx        # 미니 스타 증가 그래프
│   │   │
│   │   ├── repo/
│   │   │   ├── RepoHeader.tsx           # 레포 이름, 스타, 포크 등 헤더
│   │   │   ├── RepoStats.tsx            # 레포 통계 카드
│   │   │   ├── ReadmeViewer.tsx          # 한글 README 렌더러 (마크다운)
│   │   │   ├── KoreanSummary.tsx         # AI 3줄 한글 요약
│   │   │   ├── SimilarRepoCard.tsx       # 유사 레포 카드
│   │   │   ├── SimilarRepoList.tsx       # 유사 레포 목록
│   │   │   └── LanguageBar.tsx           # 언어 사용 비율 바
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx             # 검색 입력 바
│   │   │   └── SearchResults.tsx         # 검색 결과 목록
│   │   │
│   │   └── ui/                           # 기초 UI 컴포넌트
│   │       ├── Badge.tsx                 # 뱃지 (카테고리, 언어 등)
│   │       ├── Button.tsx                # 버튼
│   │       ├── Card.tsx                  # 카드 컨테이너
│   │       ├── Skeleton.tsx              # 로딩 스켈레톤
│   │       ├── Tabs.tsx                  # 탭 컴포넌트
│   │       ├── LanguageBadge.tsx          # 프로그래밍 언어 뱃지 (색상 포함)
│   │       ├── StarCount.tsx             # 스타 수 표시 (포맷팅 포함)
│   │       └── EmptyState.tsx            # 빈 상태 표시
│   │
│   ├── lib/                              # 핵심 라이브러리/서비스
│   │   ├── github.ts                     # GitHub API 클라이언트
│   │   ├── gemini.ts                     # Gemini 번역 서비스
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Supabase 브라우저 클라이언트
│   │   │   └── server.ts                 # Supabase 서버 클라이언트
│   │   ├── redis.ts                      # Upstash Redis 클라이언트
│   │   ├── similarity.ts                 # 유사 레포 추천 알고리즘
│   │   ├── translator.ts                 # 번역 오케스트레이터 (캐싱 포함)
│   │   ├── constants.ts                  # 상수 정의
│   │   └── utils.ts                      # 유틸리티 함수
│   │
│   ├── hooks/                            # React Custom Hooks
│   │   ├── useTrending.ts                # 트렌딩 데이터 페칭
│   │   ├── useRepo.ts                    # 레포 상세 데이터 페칭
│   │   ├── useSearch.ts                  # 검색 데이터 페칭
│   │   └── useDebounce.ts                # 디바운스 훅
│   │
│   └── types/                            # TypeScript 타입 정의
│       ├── index.ts                      # 메인 타입 export
│       ├── repository.ts                 # 레포지토리 관련 타입
│       ├── trending.ts                   # 트렌딩 관련 타입
│       └── api.ts                        # API 응답 타입
│
└── docs/                                 # 프로젝트 문서
    ├── 00_PROJECT_PROPOSAL.md
    ├── 01_FREE_INFRASTRUCTURE.md
    ├── 02_IMPLEMENTATION_BLUEPRINT.md    # ← 이 문서
    ├── 03_API_AND_DATABASE.md
    ├── 04_FRONTEND_SPECIFICATION.md
    └── 05_STEP_BY_STEP_GUIDE.md
```

---

## 2. 완전한 TypeScript 타입 정의

### 2.1 `src/types/repository.ts`

```typescript
// 레포지토리 기본 정보
export interface Repository {
  id: number;                    // Supabase auto-increment ID
  github_id: number;             // GitHub 레포 ID
  full_name: string;             // "owner/repo-name"
  owner: string;                 // "vercel"
  name: string;                  // "ai"
  description: string | null;    // 원본 영어 설명
  description_ko: string | null; // 한글 번역 설명
  language: string | null;       // 주 사용 언어 ("TypeScript")
  stars_count: number;           // 현재 총 스타 수
  forks_count: number;           // 현재 총 포크 수
  watchers_count: number;        // 현재 총 와처 수
  open_issues_count: number;     // 열린 이슈 수
  topics: string[];              // GitHub 토픽 태그 ["ai", "sdk"]
  homepage_url: string | null;   // 홈페이지 URL
  html_url: string;              // GitHub 레포 URL
  readme_raw: string | null;     // 원본 README 마크다운
  readme_ko: string | null;      // 한글 번역 README
  summary_ko: string | null;     // AI 3줄 한글 요약
  license: string | null;        // 라이선스 ("MIT")
  created_at_github: string;     // GitHub 생성일
  pushed_at: string;             // 최근 푸시 일시
  last_synced_at: string;        // 마지막 동기화 일시
  created_at: string;            // DB 생성일
}

// 트렌딩 카드에 표시되는 간략 정보
export interface TrendingRepository {
  id: number;
  github_id: number;
  full_name: string;
  owner: string;
  name: string;
  description: string | null;
  description_ko: string | null;
  language: string | null;
  stars_count: number;
  forks_count: number;
  topics: string[];
  stars_gained: number;          // 해당 기간 동안 얻은 스타 수
  rank: number;                  // 트렌딩 순위
  summary_ko: string | null;
  html_url: string;
}

// 유사 레포 추천 결과
export interface SimilarRepository {
  repository: TrendingRepository;
  similarity_score: number;      // 0~100
  matched_topics: string[];      // 매칭된 토픽
  difference_note: string;       // 원본과의 차이점 설명 (한글)
}

// 레포 언어 통계
export interface LanguageStat {
  language: string;              // "TypeScript"
  percentage: number;            // 78.5
  color: string;                 // "#3178c6"
}
```

### 2.2 `src/types/trending.ts`

```typescript
// 트렌딩 필터 타입
export type TrendingPeriod = 'daily' | 'weekly' | 'monthly';

export type ProgrammingLanguage = 
  | 'all'        // 전체 언어
  | 'python' 
  | 'javascript' 
  | 'typescript' 
  | 'java' 
  | 'go' 
  | 'rust' 
  | 'cpp'        // C++
  | 'csharp'     // C#
  | 'swift'
  | 'kotlin';

export interface TrendingFilters {
  period: TrendingPeriod;
  language: ProgrammingLanguage;
  page: number;
  per_page: number;              // 기본 20
}

// 트렌딩 스냅샷 (DB 테이블 매핑)
export interface TrendingSnapshot {
  id: number;
  repository_id: number;
  rank: number;
  period: TrendingPeriod;
  stars_gained: number;
  snapshot_date: string;         // "2026-04-18"
  created_at: string;
}
```

### 2.3 `src/types/api.ts`

```typescript
// API 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    per_page: number;
    has_next: boolean;
  };
}

// 트렌딩 API 응답
export type TrendingApiResponse = ApiResponse<TrendingRepository[]>;

// 레포 상세 API 응답
export type RepoDetailApiResponse = ApiResponse<Repository>;

// 유사 레포 API 응답
export type SimilarReposApiResponse = ApiResponse<SimilarRepository[]>;

// 검색 API 응답
export type SearchApiResponse = ApiResponse<TrendingRepository[]>;

// README 한글 번역 응답
export interface ReadmeKoResponse {
  success: boolean;
  data: {
    readme_ko: string;           // 한글 번역된 README 마크다운
    summary_ko: string;          // 3줄 한글 요약
    translation_quality: number; // 번역 품질 점수 (0~100, 자체 추정)
    translated_at: string;       // 번역 일시
    is_cached: boolean;          // 캐시에서 반환되었는지
  };
}
```

---

## 3. 환경변수 정의

### `.env.example` (커밋 가능 — 값 비어있음)

```env
# ============================================
# GitTrend Korea 환경변수
# 이 파일을 .env.local로 복사한 후 값을 채우세요
# ============================================

# GitHub API
# 발급: https://github.com/settings/tokens
# 필요 권한: public_repo (읽기 전용)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Google Gemini API
# 발급: https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
# 프로젝트 생성: https://supabase.com → New Project
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx

# Upstash Redis
# 생성: https://upstash.com → Create Database → Redis
UPSTASH_REDIS_REST_URL=https://xxxx-xxxx-xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxxxx

# 크론잡 보안 키 (임의의 긴 문자열)
CRON_SECRET=your-random-secret-string-here-minimum-32-chars

# 사이트 URL (배포 후 변경)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. 핵심 설정 파일

### `package.json` (필수 의존성)

```json
{
  "name": "gittrend-korea",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@upstash/redis": "^1.34.0",
    "@google/generative-ai": "^0.21.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // GitHub API 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'opengraph.githubassets.com',
      },
    ],
  },
  // 실험적 기능
  experimental: {
    // Server Actions 활성화
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

### `vercel.json` (크론잡 설정)

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-trending",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/translate-new",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 브랜드 컬러
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',   // 메인 브랜드 컬러
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // 다크 모드 배경
        dark: {
          bg: '#0d1117',        // GitHub 다크 배경
          card: '#161b22',      // 카드 배경
          border: '#30363d',    // 테두리
          text: '#e6edf3',      // 기본 텍스트
          muted: '#8b949e',     // 흐린 텍스트
        },
        // 프로그래밍 언어 색상 (GitHub 공식 색상)
        lang: {
          python: '#3572A5',
          javascript: '#f1e05a',
          typescript: '#3178c6',
          java: '#b07219',
          go: '#00ADD8',
          rust: '#dea584',
          cpp: '#f34b7d',
          csharp: '#178600',
          swift: '#F05138',
          kotlin: '#A97BFF',
          ruby: '#701516',
          php: '#4F5D95',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 5. 디자인 시스템 상세

### 5.1 색상 팔레트

```
메인 배경 (다크):     #0d1117
카드 배경 (다크):     #161b22
보더 (다크):          #30363d
기본 텍스트 (다크):    #e6edf3
흐린 텍스트 (다크):    #8b949e

메인 배경 (라이트):    #ffffff
카드 배경 (라이트):    #f6f8fa
보더 (라이트):         #d0d7de
기본 텍스트 (라이트):   #1f2328
흐린 텍스트 (라이트):   #656d76

브랜드 Primary:        #6366f1 (Indigo 500)
브랜드 Hover:          #4f46e5 (Indigo 600)
성공/초록:             #3fb950
경고/노랑:             #d29922
에러/빨강:             #f85149
정보/파랑:             #58a6ff
```

### 5.2 타이포그래피

```
폰트:          Pretendard (한글) + Inter (영어)
CDN:           https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css

제목 (H1):     text-3xl (30px), font-bold, tracking-tight
제목 (H2):     text-2xl (24px), font-semibold
제목 (H3):     text-xl (20px), font-semibold
본문:          text-base (16px), font-normal, leading-relaxed
작은 텍스트:    text-sm (14px), font-normal
캡션:          text-xs (12px), font-medium

코드 폰트:     JetBrains Mono (README 코드 블록용)
```

### 5.3 간격 & 레이아웃

```
페이지 최대 폭:     1280px (max-w-7xl)
콘텐츠 패딩:        px-4 sm:px-6 lg:px-8
카드 패딩:          p-4 sm:p-6
카드 간격:          gap-4 sm:gap-6
카드 모서리:        rounded-lg (8px)
카드 그림자 (다크):  shadow-none, border border-dark-border
카드 그림자 (라이트): shadow-sm
섹션 간격:          space-y-8
```

### 5.4 반응형 브레이크포인트

```
모바일:       < 640px   (기본, 1열)
태블릿:       640px~    (sm:, 1~2열)
데스크톱:     1024px~   (lg:, 2~3열)
와이드:       1280px~   (xl:, 최대폭 제한)
```

---

## 6. 프로그래밍 언어 색상 매핑 (상수)

### `src/lib/constants.ts`

```typescript
// GitHub 공식 언어 색상
// https://github.com/ozh/github-colors 참조
export const LANGUAGE_COLORS: Record<string, string> = {
  'Python': '#3572A5',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Java': '#b07219',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'C++': '#f34b7d',
  'C#': '#178600',
  'C': '#555555',
  'Swift': '#F05138',
  'Kotlin': '#A97BFF',
  'Ruby': '#701516',
  'PHP': '#4F5D95',
  'Dart': '#00B4AB',
  'Scala': '#c22d40',
  'Shell': '#89e051',
  'Lua': '#000080',
  'R': '#198CE7',
  'Elixir': '#6e4a7e',
  'Haskell': '#5e5086',
  'Vue': '#41b883',
  'Svelte': '#ff3e00',
  'Zig': '#ec915c',
  'Jupyter Notebook': '#DA5B0B',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'SCSS': '#c6538c',
};

// 한글 언어 이름 매핑
export const LANGUAGE_NAMES_KO: Record<string, string> = {
  'Python': '파이썬',
  'JavaScript': '자바스크립트',
  'TypeScript': '타입스크립트',
  'Java': '자바',
  'Go': '고',
  'Rust': '러스트',
  'C++': 'C++',
  'C#': 'C#',
  'Swift': '스위프트',
  'Kotlin': '코틀린',
  'Ruby': '루비',
  'all': '전체',
};

// 트렌딩 기간 한글 매핑
export const PERIOD_LABELS: Record<string, string> = {
  daily: '오늘',
  weekly: '이번 주',
  monthly: '이번 달',
};

// 필터용 언어 목록 (프론트엔드 드롭다운에 표시)
export const FILTERABLE_LANGUAGES = [
  { value: 'all', label: '전체 언어' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
] as const;

// 캐시 TTL (초 단위)
export const CACHE_TTL = {
  TRENDING_LIST: 3600,        // 1시간 (트렌딩 목록)
  REPO_DETAIL: 86400,         // 24시간 (레포 상세)
  README_KO: 86400,           // 24시간 (한글 번역)
  SIMILAR_REPOS: 43200,       // 12시간 (유사 레포)
  SEARCH_RESULTS: 1800,       // 30분 (검색 결과)
} as const;

// GitHub API Rate Limit 안전 마진
export const GITHUB_API = {
  BASE_URL: 'https://api.github.com',
  MAX_PER_PAGE: 30,
  TRENDING_FETCH_COUNT: 30,   // 트렌딩에서 가져올 레포 수
} as const;

// Gemini 무료 한도 관리
export const GEMINI_LIMITS = {
  RPM: 15,                    // 분당 최대 요청
  RPD: 1500,                  // 일일 최대 요청
  WARNING_THRESHOLD: 0.8,     // 80%에서 경고
} as const;
```

---

## 7. 핵심 라이브러리 구현 명세

### 7.1 `src/lib/github.ts` — GitHub API 클라이언트

```typescript
/**
 * GitHub API 클라이언트
 * 
 * 역할: GitHub REST API와 통신하여 트렌딩 레포, 레포 상세, README 등을 가져온다.
 * 
 * 사용하는 GitHub API 엔드포인트:
 * - GET /search/repositories — 트렌딩 시뮬레이션 (스타 많은 순 정렬)
 * - GET /repos/:owner/:name — 레포 상세 정보
 * - GET /repos/:owner/:name/readme — README 원본
 * - GET /repos/:owner/:name/languages — 언어 통계
 * 
 * 인증: Bearer 토큰 (GITHUB_TOKEN 환경변수)
 * Rate Limit: 5,000 요청/시간 (인증 시)
 */

// === 함수 목록 ===

/**
 * fetchTrendingRepos(period, language?, page?, perPage?)
 * 
 * - period에 따라 날짜 범위 계산 (daily=1일, weekly=7일, monthly=30일)
 * - GitHub Search API로 해당 기간에 생성/푸시된 레포 중 스타 많은 순 검색
 * - 쿼리 예: "created:>2026-04-17 language:python sort:stars order:desc"
 * - 반환: TrendingRepository[]
 */

/**
 * fetchRepoDetail(owner, name)
 * 
 * - /repos/:owner/:name 호출
 * - 레포 기본 정보(스타, 포크, 이슈, 토픽 등) 반환
 * - 반환: Repository 타입
 */

/**
 * fetchReadme(owner, name)
 * 
 * - /repos/:owner/:name/readme 호출 (Accept: application/vnd.github.raw)
 * - README.md 원본 마크다운 텍스트 반환
 * - 반환: string
 */

/**
 * fetchLanguages(owner, name)
 * 
 * - /repos/:owner/:name/languages 호출
 * - 바이트 수를 퍼센티지로 변환
 * - 반환: LanguageStat[]
 */

/**
 * searchRepos(query, sort?, page?, perPage?)
 * 
 * - /search/repositories?q=... 호출
 * - 한글 검색어도 지원 (영어 키워드 변환은 프론트에서)
 * - 반환: TrendingRepository[]
 */
```

### 7.2 `src/lib/gemini.ts` — Gemini 번역 서비스

```typescript
/**
 * Gemini AI 번역 서비스
 * 
 * 역할: Google Gemini 2.0 Flash를 사용하여 영어 텍스트를 한국어로 번역
 * 
 * 사용 모델: gemini-2.0-flash
 * API: @google/generative-ai 패키지
 * 
 * 무료 한도: 1,500 요청/일, 100만 토큰/일
 */

// === 함수 목록 ===

/**
 * translateReadme(readmeMarkdown: string): Promise<string>
 * 
 * - README 마크다운을 한국어로 번역
 * - 마크다운 문법(코드 블록, 링크 등)은 보존
 * - 기술 용어는 원어를 괄호로 병기: "의존성(dependencies)"
 * - 코드 블록 내부의 코드는 번역하지 않음
 * - 프롬프트 예시:
 *   "다음 GitHub README 마크다운을 한국어로 번역하세요.
 *    규칙:
 *    1. 마크다운 문법(#, *, ```, 링크 등)은 그대로 유지
 *    2. 코드 블록(``` ```) 내부는 번역하지 않음
 *    3. 기술 용어는 한글(영어) 형태로 병기. 예: 의존성(dependencies)
 *    4. 자연스러운 한국어로 번역. 직역 금지.
 *    5. 사용 설정, 설치 방법 등은 원본 명령어 유지
 *    
 *    README 원문:
 *    {readmeMarkdown}"
 */

/**
 * generateSummary(description: string, readmeMarkdown: string): Promise<string>
 * 
 * - 레포의 3줄 한글 요약 생성
 * - 프롬프트 예시:
 *   "다음 GitHub 레포지토리 정보를 바탕으로 한국어 3줄 요약을 작성하세요.
 *    - 1줄: 이 프로젝트가 무엇인지 (한 문장)
 *    - 2줄: 핵심 기능/특징 (한 문장)
 *    - 3줄: 어떤 개발자에게 유용한지 (한 문장)
 *    
 *    설명: {description}
 *    README 앞부분 500자: {readmeMarkdown.slice(0, 500)}"
 * 
 * 반환: "Vercel AI SDK는 Next.js에서 AI 앱을 쉽게 만들 수 있는 도구입니다.\n주요 기능은...\n프론트엔드 개발자에게 추천합니다."
 */

/**
 * translateDescription(description: string): Promise<string>
 * 
 * - 짧은 영어 설명(1~2문장)을 한국어로 번역
 * - 간단하므로 빠르게 처리
 */
```

### 7.3 `src/lib/translator.ts` — 번역 오케스트레이터

```typescript
/**
 * 번역 오케스트레이터
 * 
 * 역할: 3-Layer 캐싱을 적용하여 번역 API 호출을 최소화
 * 
 * 흐름:
 * 1. Redis 캐시 확인 → HIT면 즉시 반환
 * 2. Supabase DB 확인 → HIT면 Redis에 저장 후 반환
 * 3. Gemini API 호출 → 결과를 DB + Redis에 저장 후 반환
 */

// === 함수 목록 ===

/**
 * getTranslatedReadme(owner: string, name: string): Promise<ReadmeKoResponse>
 * 
 * - Redis 키: "readme_ko:{owner}/{name}"
 * - Redis TTL: 86400 (24시간)
 * - DB 컬럼: repositories.readme_ko
 * - 캐시 미스일 때만 Gemini API 호출
 */

/**
 * getTranslatedSummary(owner: string, name: string): Promise<string>
 * 
 * - Redis 키: "summary_ko:{owner}/{name}"
 * - Redis TTL: 86400 (24시간)
 * - DB 컬럼: repositories.summary_ko
 */

/**
 * getTranslatedDescription(owner: string, name: string): Promise<string>
 * 
 * - Redis 키: "desc_ko:{owner}/{name}"
 * - Redis TTL: 86400 (24시간)
 * - DB 컬럼: repositories.description_ko
 */
```

### 7.4 `src/lib/similarity.ts` — 유사 레포 추천 (AI 없이)

```typescript
/**
 * 유사 레포 추천 알고리즘
 * 
 * 역할: AI 임베딩 없이 GitHub Topics + 언어 + 스타 규모로 유사 레포를 추천
 * 비용: $0 (GitHub Search API만 사용)
 * 
 * 알고리즘:
 * 1. 소스 레포의 Topics를 가져옴
 * 2. Topics로 GitHub Search API 검색
 * 3. 결과를 유사도 점수로 정렬
 * 
 * 유사도 점수 계산 (총 100점):
 * - Topics 겹침: 40점 (겹치는 토픽 비율)
 * - 같은 언어: 30점 (주 언어가 같으면)
 * - 스타 규모 유사도: 15점 (비슷한 규모)
 * - Description 키워드 겹침: 15점
 */

// === 함수 목록 ===

/**
 * findSimilarRepos(owner: string, name: string, limit?: number): Promise<SimilarRepository[]>
 * 
 * - limit 기본값: 10
 * - 소스 레포 자신은 결과에서 제외
 * - 유사도 점수 50점 이상만 반환
 * - 캐시: Redis에 12시간 TTL로 캐싱
 */

/**
 * calculateSimilarityScore(source: Repository, candidate: Repository): number
 * 
 * - 내부 함수
 * - 0~100 사이의 점수 반환
 */
```

### 7.5 `src/lib/redis.ts` — Redis 클라이언트

```typescript
/**
 * Upstash Redis 클라이언트
 * 
 * 패키지: @upstash/redis
 * 설정: REST API 방식 (Upstash 전용)
 * 
 * 사용법:
 * import { redis } from '@/lib/redis';
 * await redis.get('key');
 * await redis.setex('key', ttl, value);
 */

// Redis 인스턴스 생성 (싱글톤)
// import { Redis } from '@upstash/redis';
// export const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });
```

### 7.6 `src/lib/supabase/server.ts` — Supabase 서버 클라이언트

```typescript
/**
 * Supabase 서버 사이드 클라이언트
 * 
 * API Routes에서 DB를 직접 조작할 때 사용
 * Service Role Key 사용 (RLS 바이패스)
 * 주의: 클라이언트 사이드에서는 절대 사용 금지
 */

// import { createClient } from '@supabase/supabase-js';
// export const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );
```

### 7.7 `src/lib/utils.ts` — 유틸리티 함수

```typescript
/**
 * 유틸리티 함수 모음
 */

/**
 * formatStarCount(count: number): string
 * - 1000 미만: 그대로 표시 (예: "832")
 * - 1000 이상: K 단위 (예: "1.2K") (소수점 1자리)
 * - 100만 이상: M 단위 (예: "1.5M")
 * 예: 45234 → "45.2K"
 */

/**
 * getRelativeTime(dateString: string): string
 * - "2시간 전", "3일 전", "1주일 전" 등 한국어 상대 시간
 * - date-fns의 formatDistanceToNow 활용, locale: ko
 */

/**
 * extractKeywords(text: string): string[]
 * - 영어 텍스트에서 의미 있는 키워드 추출
 * - 불용어(the, a, an, is, for 등) 제거
 * - 상위 5개 키워드 반환
 * - 유사 레포 검색에 사용
 */

/**
 * cn(...classes: string[]): string
 * - 조건부 CSS 클래스 결합 (clsx 래퍼)
 */

/**
 * getDateRange(period: TrendingPeriod): string
 * - daily → "2026-04-17" (어제)
 * - weekly → "2026-04-11" (7일 전)
 * - monthly → "2026-03-18" (30일 전)
 * - ISO 날짜 문자열 반환 (GitHub API 쿼리용)
 */
```

---

## 8. globals.css 핵심 스타일

```css
/* src/app/globals.css */

/* Pretendard 웹폰트 import */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
/* JetBrains Mono for code */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* 기본 다크모드 */
  :root {
    --background: #0d1117;
    --foreground: #e6edf3;
    --card: #161b22;
    --card-border: #30363d;
    --muted: #8b949e;
    --brand: #6366f1;
    --brand-hover: #4f46e5;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: 'Pretendard', 'Inter', -apple-system, sans-serif;
  }

  /* 스크롤바 스타일링 (다크 테마) */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--background);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--card-border);
    border-radius: 4px;
  }
}

@layer components {
  /* 글래스모피즘 카드 */
  .glass-card {
    @apply rounded-lg border border-dark-border bg-dark-card/80 backdrop-blur-sm
           transition-all duration-200 hover:border-brand-500/50;
  }

  /* 스켈레톤 로딩 애니메이션 */
  .skeleton {
    @apply animate-pulse rounded bg-dark-border;
  }

  /* 그라데이션 텍스트 */
  .gradient-text {
    @apply bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent;
  }
}
```

---

*이 문서는 프로젝트의 전체 구조와 핵심 설계를 정의합니다.*
*다음 문서(03_API_AND_DATABASE.md)에서 API와 DB 스키마를 상세히 정의합니다.*
