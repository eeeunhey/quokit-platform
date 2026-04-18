# 🎨 GitTrend Korea — 프론트엔드 컴포넌트 완전 명세

> **이 문서는 모든 페이지와 컴포넌트의 UI/UX를 구현 가능한 수준으로 정의합니다.**

---

## 1. 페이지별 상세 명세

### 1.1 `src/app/layout.tsx` — 루트 레이아웃

```
역할: 모든 페이지의 공통 레이아웃 (헤더, 푸터 포함)

구조:
<html lang="ko" className="dark">
  <head>
    <!-- Pretendard 폰트 CDN -->
    <!-- JetBrains Mono 폰트 CDN -->
    <!-- 메타 태그 -->
  </head>
  <body>
    <Header />
    <main className="min-h-screen pt-16 pb-8">
      {children}
    </main>
    <Footer />
  </body>
</html>

메타 데이터:
- title: "깃트렌드 코리아 | GitHub 트렌딩을 한국어로"
- description: "GitHub에서 가장 핫한 오픈소스 프로젝트를 한국어로 확인하세요. AI 한글 번역, 유사 레포 추천, 포크 쇼케이스까지."
- Open Graph 이미지: /og-image.png (1200×630)
- favicon: /favicon.ico
- 언어: ko
```

### 1.2 `src/app/page.tsx` — 메인 (트렌딩 대시보드)

```
역할: 사이트 메인 페이지. 트렌딩 레포 목록을 보여준다.
렌더링: SSR + ISR (revalidate: 3600)

레이아웃:
┌─────────────────────────────────────────────────────┐
│  Header (고정)                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 히어로 섹션                                    │  │
│  │ 🔥 GitHub 트렌딩을 한국어로                     │  │
│  │ "매일 업데이트되는 핫한 오픈소스를 확인하세요"     │  │
│  │                                               │  │
│  │ [검색바: "레포지토리 검색..." 🔍]               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 필터 바                                        │  │
│  │ [일간 ✓] [주간] [월간]  |  전체 언어 ▾         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ TrendingCard│ │ TrendingCard│ │ TrendingCard│  │
│  │ 🥇 1위      │ │ 🥈 2위      │ │ 🥉 3위      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ TrendingCard 4위                              │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ TrendingCard 5위                              │   │
│  └──────────────────────────────────────────────┘   │
│  ... (최대 20개)                                     │
│                                                     │
│  [더 보기 →]                                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘

데이터 페칭:
- 서버 컴포넌트에서 /api/trending 호출 (fetch + ISR)
- 초기 데이터: period=daily, language=all, page=1

인터랙션:
- 기간 탭 클릭 → URL 쿼리 파라미터 변경 → 페이지 재렌더링
- 언어 필터 변경 → URL 쿼리 파라미터 변경
- 카드 클릭 → /repo/:owner/:name 페이지로 이동
- 검색바 입력 → Enter 시 /search?q=... 로 이동
- "더 보기" → /trending 페이지로 이동

반응형:
- 모바일: 카드 1열
- 태블릿: 상위 3개 카드만 2열
- 데스크톱: 상위 3개 카드 3열, 나머지 1열
```

### 1.3 `src/app/repo/[owner]/[name]/page.tsx` — 레포 한글 상세

```
역할: 특정 레포의 상세 정보를 한글로 보여준다.
렌더링: SSR + ISR (revalidate: 86400)

레이아웃:
┌─────────────────────────────────────────────────────┐
│  ← 뒤로  |  vercel/ai  |  🔗 GitHub에서 보기        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ RepoHeader                                    │   │
│  │ vercel / ai                                   │   │
│  │ "AI 기반 애플리케이션을 쉽게 만들 수 있는..."   │   │
│  │                                              │   │
│  │ ⭐ 45.2K  🍴 3.4K  👁️ 1.2K  📋 45 이슈       │   │
│  │                                              │   │
│  │ 🏷️ ai · typescript · react · nextjs · sdk    │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ RepoStats (언어 통계)                         │   │
│  │ ████████████████░░░░░ TypeScript 78%          │   │
│  │ ████░░░░░░░░░░░░░░░░ JavaScript 15%          │   │
│  │ █░░░░░░░░░░░░░░░░░░░ CSS 7%                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ KoreanSummary (AI 한글 요약)                   │   │
│  │                                              │   │
│  │ 🤖 AI가 요약했어요                             │   │
│  │                                              │   │
│  │ • Vercel AI SDK는 React에서 AI 앱을 쉽게      │   │
│  │   만들 수 있는 TypeScript 라이브러리입니다.     │   │
│  │ • OpenAI, Anthropic 등 주요 LLM 제공자를       │   │
│  │   통합 지원합니다.                             │   │
│  │ • AI 챗봇을 빠르게 만들고 싶은 프론트엔드       │   │
│  │   개발자에게 추천합니다.                        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ 탭: [📖 한글 README] [📄 원본 README]          │   │
│  │─────────────────────────────────────────────│   │
│  │ ReadmeViewer                                  │   │
│  │                                              │   │
│  │ # Vercel AI SDK                              │   │
│  │                                              │   │
│  │ Vercel AI SDK는 AI 기반 애플리케이션을         │   │
│  │ 구축하기 위한 TypeScript 도구 모음입니다...     │   │
│  │                                              │   │
│  │ (전체 한글 번역 README, 마크다운 렌더링)        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ SimilarRepoList (유사 레포)                    │   │
│  │                                              │   │
│  │ 🔀 비슷한 레포지토리                           │   │
│  │                                              │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │ │langchain │ │llama_idx │ │semantic  │      │   │
│  │ │95% 유사  │ │82% 유사  │ │75% 유사  │      │   │
│  │ │⭐ 98K    │ │⭐ 40K    │ │⭐ 22K    │      │   │
│  │ └──────────┘ └──────────┘ └──────────┘      │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

데이터 페칭:
- 서버 컴포넌트에서 /api/repos/:owner/:name 호출
- 클라이언트에서 /api/repos/:owner/:name/readme-ko 호출 (로딩 동안 스켈레톤)
- 클라이언트에서 /api/repos/:owner/:name/similar 호출

SEO:
- title: "{full_name} - 한글 상세 | 깃트렌드 코리아"
- description: summary_ko 사용 (없으면 description_ko)
- og:image: https://opengraph.githubassets.com/1/{owner}/{name}
```

### 1.4 `src/app/search/page.tsx` — 검색 결과

```
역할: 검색 결과를 보여주는 페이지
렌더링: 클라이언트 컴포넌트 (검색은 실시간)

URL: /search?q=검색어&language=all&page=1

레이아웃:
┌─────────────────────────────────────────────────────┐
│  🔍 "AI 프레임워크" 검색 결과 (23건)                  │
├─────────────────────────────────────────────────────┤
│  [언어 필터: 전체 ▾]                                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ TrendingCard (검색 결과 스타일)                │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ TrendingCard                                  │   │
│  └──────────────────────────────────────────────┘   │
│  ...                                                │
│                                                     │
│  [이전] [1] [2] [3] [다음]                           │
└─────────────────────────────────────────────────────┘

빈 결과:
- 검색어가 없을 때: "검색어를 입력해주세요"
- 결과가 없을 때: "'{검색어}'에 대한 결과가 없습니다"
```

### 1.5 `src/app/trending/page.tsx` — 트렌딩 전체 목록

```
역할: 더 많은 트렌딩 레포를 필터와 함께 보여주는 페이지
렌더링: SSR + ISR

레이아웃: 메인 페이지와 유사하지만,
- 히어로 섹션 없음
- 페이지네이션 포함 (한 페이지 20개)
- 사이드바에 필터 (데스크톱), 상단에 필터 (모바일)
```

---

## 2. 컴포넌트 상세 명세

### 2.1 `Header.tsx` — 사이트 헤더

```typescript
/**
 * 사이트 상단 네비게이션 바
 * 
 * 위치: 페이지 최상단, position: sticky, top: 0
 * 높이: h-16 (64px)
 * 배경: 글래스모피즘 (bg-dark-bg/80 backdrop-blur-lg)
 * 하단선: border-b border-dark-border
 * z-index: z-50
 * 
 * 구성:
 * [🔥 깃트렌드 (로고)]  [트렌딩] [검색]  [GitHub ↗]
 * 
 * 왼쪽: 로고 (🔥 + "깃트렌드" 텍스트, 클릭 → / 이동)
 * 가운데: 네비게이션 링크 (데스크톱만)
 *   - "트렌딩" → /trending
 *   - 활성 링크: text-brand-400 + 밑줄
 * 오른쪽:
 *   - 검색 아이콘 (클릭 → SearchBar 오버레이 오픈)
 *   - GitHub 아이콘 (클릭 → 프로젝트 GitHub 새 탭)
 * 
 * 모바일: 햄버거 메뉴 → MobileNav 드로어
 * 
 * Props: 없음 (서버 컴포넌트)
 */
```

### 2.2 `TrendingCard.tsx` — 트렌딩 레포 카드 ⭐ (가장 중요한 컴포넌트)

```typescript
/**
 * 트렌딩 레포를 보여주는 카드
 * 
 * Props:
 * - repo: TrendingRepository
 * - rank: number (순위, 1부터)
 * - isTop3: boolean (상위 3개는 특별 스타일)
 * 
 * 레이아웃 (isTop3 = false, 일반):
 * ┌──────────────────────────────────────────────┐
 * │ 4   vercel/ai                    ⭐ 45.2K    │
 * │     AI 기반 앱을 쉽게 만들 수 있는 SDK...      │
 * │                                              │
 * │     📈 +1,234   [TypeScript]  [ai] [react]   │
 * │                                              │
 * │     🤖 "Vercel AI SDK는 React에서..."         │
 * └──────────────────────────────────────────────┘
 * 
 * 레이아웃 (isTop3 = true, 상위 3개):
 * ┌──────────────────────────────────────────────┐
 * │ 🥇                                           │
 * │                                              │
 * │ vercel/ai                                    │
 * │ ⭐ 45.2K  📈 +1,234 today                    │
 * │                                              │
 * │ AI 기반 앱을 쉽게 만들 수 있는 TypeScript SDK  │
 * │                                              │
 * │ [TypeScript] [ai] [react] [nextjs]           │
 * │                                              │
 * │ 🤖 "Vercel AI SDK는 React에서 AI 앱을..."    │
 * │                                              │
 * │ [📖 한글 상세보기]                             │
 * └──────────────────────────────────────────────┘
 * 
 * 스타일:
 * - 카드: glass-card 스타일 (반투명 + border + hover 효과)
 * - 순위 1: 🥇 + border-yellow-500/30 강조
 * - 순위 2: 🥈 + border-gray-400/30
 * - 순위 3: 🥉 + border-amber-700/30
 * - 순위 4+: 숫자 표시 + 기본 border
 * - Hover: border-brand-500/50 + translate-y(-2px) 애니메이션
 * - 스타 증가량: 초록색 (+숫자) 텍스트
 * - 언어 뱃지: LanguageBadge 컴포넌트 사용 (색상 점 포함)
 * - 토픽: Badge 컴포넌트 사용
 * - 한글 요약: 있으면 아래에 작은 텍스트로 표시
 * 
 * 클릭: 전체 카드가 Link → /repo/:owner/:name
 * 
 * 애니메이션:
 * - 카드 진입: fadeIn + slideUp (각 카드 50ms 딜레이)
 * - Hover: scale(1.01) + shadow 증가
 */
```

### 2.3 `TrendingFilters.tsx` — 필터 바

```typescript
/**
 * 트렌딩 기간 + 언어 필터
 * 
 * Props:
 * - currentPeriod: TrendingPeriod
 * - currentLanguage: ProgrammingLanguage
 * - onPeriodChange: (period: TrendingPeriod) => void
 * - onLanguageChange: (language: ProgrammingLanguage) => void
 * 
 * 레이아웃:
 * ┌──────────────────────────────────────────────┐
 * │ [오늘 ✓] [이번 주] [이번 달]  |  전체 언어 ▾  │
 * └──────────────────────────────────────────────┘
 * 
 * 기간 탭:
 * - 3개 버튼: "오늘"(daily), "이번 주"(weekly), "이번 달"(monthly)
 * - 선택된 탭: bg-brand-500 text-white
 * - 미선택: bg-transparent text-dark-muted hover:text-dark-text
 * 
 * 언어 드롭다운:
 * - FILTERABLE_LANGUAGES 상수에서 가져옴
 * - select 요소 또는 커스텀 드롭다운
 * - 선택 시 onLanguageChange 호출
 * 
 * 동작: URL searchParams를 업데이트하여 서버 컴포넌트 재렌더링
 * - /trending?period=weekly&language=python
 * - 클라이언트 컴포넌트 ('use client')
 * - useRouter().push() 또는 useSearchParams() 활용
 */
```

### 2.4 `SearchBar.tsx` — 검색 바

```typescript
/**
 * 검색 입력 바
 * 
 * Props:
 * - defaultValue?: string (초기 검색어)
 * - size?: 'large' | 'normal' (히어로용 vs 일반용)
 * - autoFocus?: boolean
 * 
 * 레이아웃:
 * ┌──────────────────────────────────────────┐
 * │ 🔍  레포지토리를 검색하세요...        →   │
 * └──────────────────────────────────────────┘
 * 
 * 스타일:
 * - large: h-14, text-lg, 히어로 섹션용, max-w-2xl
 * - normal: h-10, text-base, 일반 사용
 * - bg-dark-card, border-dark-border
 * - 포커스: border-brand-500, ring-2 ring-brand-500/20
 * - 왼쪽 아이콘: Search (lucide-react)
 * - 오른쪽: Enter 시 → 아이콘 표시
 * 
 * 동작:
 * - 타이핑 시 debounce 300ms
 * - Enter 키 → /search?q={입력값} 으로 라우팅
 * - 한글/영어 모두 지원
 * - 빈 입력 시 제출 방지
 * - 'use client' 컴포넌트
 */
```

### 2.5 `ReadmeViewer.tsx` — README 렌더러

```typescript
/**
 * 마크다운 README를 렌더링하는 뷰어
 * 
 * Props:
 * - content: string (마크다운 텍스트)
 * - isLoading?: boolean (로딩 중이면 스켈레톤 표시)
 * 
 * 사용 패키지:
 * - react-markdown: 마크다운 → React 변환
 * - remark-gfm: GitHub Flavored Markdown 지원 (테이블, 체크박스 등)
 * - rehype-highlight: 코드 블록 구문 강조
 * 
 * 스타일:
 * - 프로즈 스타일 (읽기 쉬운 타이포그래피)
 * - 제목: text-dark-text, font-bold, 적절한 margin
 * - 코드 블록: bg-[#1a1b26], rounded-lg, overflow-x-auto, font-mono
 * - 인라인 코드: bg-dark-border/50, px-1.5 py-0.5, rounded, font-mono
 * - 링크: text-brand-400, hover:underline
 * - 리스트: 적절한 들여쓰기, 불릿/숫자
 * - 테이블: border, 줄무늬 배경
 * - 이미지: max-w-full, rounded-lg
 * - 인용문: border-l-4 border-brand-500, 이텔릭
 */
```

### 2.6 `KoreanSummary.tsx` — AI 한글 요약

```typescript
/**
 * AI가 생성한 3줄 한글 요약 카드
 * 
 * Props:
 * - summary: string | null (줄바꿈으로 구분된 3줄)
 * - isLoading?: boolean
 * 
 * 레이아웃:
 * ┌──────────────────────────────────────────────┐
 * │ 🤖 AI가 요약했어요                    💡     │
 * │ ─────────────────────────────────────────    │
 * │ • 첫 번째 줄 요약                            │
 * │ • 두 번째 줄 요약                            │
 * │ • 세 번째 줄 요약                            │
 * └──────────────────────────────────────────────┘
 * 
 * 스타일:
 * - 배경: bg-brand-500/5 (살짝 보라빛)
 * - 보더: border border-brand-500/20
 * - rounded-lg, p-6
 * - 헤더: 🤖 이모지 + "AI가 요약했어요" 텍스트
 * - 각 줄: "•" 불릿 + 텍스트
 * 
 * summary가 null일 때:
 * - "요약을 준비하고 있어요..." 텍스트 표시
 * - 스켈레톤 애니메이션
 */
```

### 2.7 `SimilarRepoCard.tsx` — 유사 레포 카드

```typescript
/**
 * 유사 레포 1개를 보여주는 컴팩트 카드
 * 
 * Props:
 * - similar: SimilarRepository
 * 
 * 레이아웃:
 * ┌──────────────────────────────────────┐
 * │ langchain-ai/langchain               │
 * │ 🟢 95% 유사                          │
 * │ "LLM 기반 앱 개발 프레임워크"         │
 * │ ⭐ 98K  [Python]                     │
 * │ 매칭: ai, llm                        │
 * └──────────────────────────────────────┘
 * 
 * 스타일:
 * - glass-card 스타일
 * - 유사도 색상: 80%+ 🟢, 60%+ 🟡, 50%+ 🟠
 * - 크기: 가로 약 280px (데스크톱에서 3열 배치)
 * - 클릭: /repo/:owner/:name 으로 이동
 */
```

### 2.8 `RepoStats.tsx` — 레포 통계

```typescript
/**
 * 레포 상세 페이지의 통계 정보 (스타, 포크, 이슈 등)
 * 
 * Props:
 * - repo: Repository
 * 
 * 레이아웃:
 * ┌──────────────────────────────────────────────┐
 * │ ⭐ 45,234     🍴 3,456     👁️ 1,234         │
 * │ Stars         Forks        Watchers          │
 * │                                              │
 * │ 📋 45 open   📅 2시간 전   📜 Apache-2.0     │
 * │ Issues        최근 커밋     라이선스           │
 * └──────────────────────────────────────────────┘
 * 
 * 스타일:
 * - 6개 통계를 2행 3열(데스크톱) 또는 3행 2열(모바일)로 표시
 * - 각 통계: 아이콘 + 큰 숫자 + 레이블
 * - 숫자: text-xl font-bold
 * - 레이블: text-sm text-dark-muted
 */
```

### 2.9 `LanguageBar.tsx` — 언어 비율 바

```typescript
/**
 * GitHub 스타일 언어 사용 비율 바
 * 
 * Props:
 * - languages: LanguageStat[]
 * 
 * 레이아웃:
 * ████████████████████░░░░░░░░░ (전체 폭 컬러바)
 * ● TypeScript 78%  ● JavaScript 15%  ● CSS 7%
 * 
 * 스타일:
 * - 전체 바: h-2 rounded-full overflow-hidden
 * - 각 세그먼트: 해당 언어 색상 (LANGUAGE_COLORS 맵 사용)
 * - 아래 레전드: 색상 동그라미 + 언어명 + 퍼센트
 */
```

### 2.10 `LanguageBadge.tsx` — 언어 뱃지

```typescript
/**
 * 프로그래밍 언어 이름 + 색상 점이 있는 뱃지
 * 
 * Props:
 * - language: string ("TypeScript")
 * 
 * 렌더링:
 * [● TypeScript]
 * 
 * - ● 은 해당 언어 색상의 둥근 점 (w-3 h-3 rounded-full)
 * - 색상: LANGUAGE_COLORS[language] ?? '#8b949e'
 * - 텍스트: text-sm text-dark-muted
 */
```

### 2.11 `Badge.tsx` — 범용 뱃지

```typescript
/**
 * 토픽, 카테고리 등에 사용하는 범용 뱃지
 * 
 * Props:
 * - text: string
 * - variant?: 'default' | 'primary' | 'success' | 'warning'
 * - size?: 'sm' | 'md'
 * 
 * 스타일:
 * - default: bg-dark-border/50 text-dark-muted
 * - primary: bg-brand-500/10 text-brand-400
 * - 크기 sm: text-xs px-2 py-0.5
 * - 크기 md: text-sm px-3 py-1
 * - rounded-full
 */
```

### 2.12 `Skeleton.tsx` — 로딩 스켈레톤

```typescript
/**
 * 로딩 중 표시하는 스켈레톤 UI
 * 
 * Props:
 * - className?: string (추가 스타일)
 * 
 * 스켈레톤 변형:
 * - Skeleton.Text: 한 줄 텍스트 (h-4 rounded)
 * - Skeleton.Title: 제목 (h-6 rounded w-3/4)
 * - Skeleton.Card: 전체 카드 모양
 * - Skeleton.Avatar: 원형 (h-10 w-10 rounded-full)
 * 
 * 애니메이션: animate-pulse (bg-dark-border)
 */
```

### 2.13 `StarCount.tsx` — 스타 수 포맷팅

```typescript
/**
 * 스타 수를 포맷팅하여 표시
 * 
 * Props:
 * - count: number
 * - showIcon?: boolean (⭐ 아이콘 표시 여부)
 * - gained?: number (증가량, 있으면 초록색으로 표시)
 * 
 * 렌더링:
 * ⭐ 45.2K  📈 +1,234
 * 
 * - 1000 미만: 그대로 ("832")
 * - 1000 이상: K ("1.2K")
 * - 100만 이상: M ("1.5M")
 * - gained: 초록색 (+숫자) 표시, Arrow-up 아이콘
 */
```

### 2.14 `Footer.tsx` — 사이트 푸터

```typescript
/**
 * 사이트 하단 푸터
 * 
 * 레이아웃:
 * ┌──────────────────────────────────────────────┐
 * │  🔥 깃트렌드 코리아                           │
 * │  GitHub 트렌딩을 한국어로                      │
 * │                                              │
 * │  [GitHub] [문의하기]                           │
 * │                                              │
 * │  © 2026 GitTrend Korea. Not affiliated with  │
 * │  GitHub, Inc.                                │
 * └──────────────────────────────────────────────┘
 * 
 * 스타일:
 * - border-t border-dark-border
 * - py-8
 * - text-dark-muted text-sm
 * - 가운데 정렬
 */
```

### 2.15 `MiniStarChart.tsx` — 미니 스타 그래프

```typescript
/**
 * 트렌딩 카드 내부의 작은 스타 변화 그래프
 * 
 * Props:
 * - gained: number (해당 기간 스타 증가량)
 * 
 * 이것은 간단한 구현입니다:
 * - 단순히 📈 +{gained} 텍스트로 표시
 * - gained > 1000: text-green-400 font-bold
 * - gained > 500: text-green-400
 * - gained > 100: text-green-500/70
 * - gained < 100: text-dark-muted
 * 
 * (Phase 2에서 실제 SVG 차트로 업그레이드 가능)
 */
```

---

## 3. Custom Hooks 명세

### 3.1 `useTrending.ts`

```typescript
/**
 * 트렌딩 데이터를 가져오는 클라이언트 훅
 * 
 * 사용처: 클라이언트에서 필터 변경 시 동적 데이터 로딩
 * (서버 컴포넌트에서 초기 데이터를 받고, 필터 변경 시 이 훅 사용)
 * 
 * 파라미터:
 * - filters: TrendingFilters
 * 
 * 반환:
 * - data: TrendingRepository[] | undefined
 * - isLoading: boolean
 * - error: Error | null
 * - meta: { total, page, per_page, has_next } | null
 * 
 * 내부 구현:
 * - fetch(`/api/trending?period=${filters.period}&language=${filters.language}&page=${filters.page}`)
 * - SWR 패턴 또는 단순 useState + useEffect
 * - 캐시: 브라우저 메모리 (같은 필터 재요청 방지)
 */
```

### 3.2 `useRepo.ts`

```typescript
/**
 * 레포 상세 데이터를 가져오는 클라이언트 훅
 * 
 * 파라미터:
 * - owner: string
 * - name: string
 * 
 * 반환:
 * - repo: Repository | undefined
 * - readmeKo: string | null (한글 README)
 * - summaryKo: string | null (3줄 요약)
 * - isLoadingReadme: boolean
 * - error: Error | null
 */
```

### 3.3 `useDebounce.ts`

```typescript
/**
 * 값의 변경을 지연시키는 디바운스 훅
 * 
 * 파라미터:
 * - value: T (디바운스할 값)
 * - delay: number (밀리초, 기본 300)
 * 
 * 반환:
 * - debouncedValue: T
 * 
 * 사용처: SearchBar의 입력 디바운스
 */
```

---

## 4. loading.tsx & error.tsx 명세

### 4.1 `src/app/loading.tsx`

```
루트 로딩 UI
- 화면 중앙에 로고 + 스피너
- "불러오는 중..." 텍스트
- 스켈레톤 카드 3개 표시
```

### 4.2 `src/app/error.tsx`

```
에러 바운더리 UI
- "문제가 발생했습니다" 메시지
- "다시 시도" 버튼 (reset() 호출)
- 에러 메시지 표시 (개발 모드에서만)
- 'use client' 필수
```

### 4.3 `src/app/not-found.tsx`

```
404 페이지
- "페이지를 찾을 수 없습니다"
- "홈으로 돌아가기" 버튼
- 재미있는 이모지 또는 일러스트
```

---

*이 문서의 모든 컴포넌트를 구현하면 프론트엔드가 완성됩니다.*
*다음 문서(05_STEP_BY_STEP_GUIDE.md)에서 정확한 구현 순서를 안내합니다.*
