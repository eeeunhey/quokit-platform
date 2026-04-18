# 📋 GitTrend Korea — 단계별 구현 가이드

> **이 문서는 다른 AI가 "정확히 이 순서대로" 따라 구현하도록 설계된 step-by-step 가이드입니다.**
> **각 단계는 이전 단계에 의존합니다. 순서를 지켜 구현하세요.**

---

## 🎯 전체 구현 순서 요약

```
Phase 1: 기반 구축 (Step 1~5)
  → 프로젝트 초기화 → DB 생성 → 핵심 라이브러리 구현

Phase 2: 백엔드 API (Step 6~10)
  → API Routes 구현 → 크론잡 구현

Phase 3: 프론트엔드 UI (Step 11~18)
  → 기초 컴포넌트 → 페이지 구현

Phase 4: 통합 & 배포 (Step 19~22)
  → 테스트 → 최적화 → 배포
```

---

## Phase 1: 기반 구축

### Step 1: Next.js 프로젝트 생성

```bash
# 1-1. 프로젝트 생성 (정확히 이 명령어 사용)
npx -y create-next-app@latest gittrend-korea \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias

# 1-2. 프로젝트 디렉토리로 이동 (이 이후 모든 명령어는 이 디렉토리에서)
cd gittrend-korea

# 1-3. 필수 패키지 설치 (한 번에)
npm install \
  @supabase/supabase-js \
  @upstash/redis \
  @google/generative-ai \
  react-markdown \
  remark-gfm \
  rehype-highlight \
  date-fns \
  lucide-react \
  clsx

# 1-4. 설치 확인 (에러 없어야 함)
npm run build
```

**예상 결과**: `✓ Compiled successfully` 메시지 출력

**이 단계 완료 체크**:
- [ ] `gittrend-korea/` 폴더 생성됨
- [ ] `src/app/` 폴더 존재
- [ ] `npm run dev` 실행 시 http://localhost:3000 접속 가능

---

### Step 2: 설정 파일 구성

**2-1. `.env.local` 생성** (프로젝트 루트)
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 ".env.example" 섹션 참고
→ 각 환경변수 값을 실제 값으로 채움
```

**2-2. `next.config.ts` 수정**
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "next.config.ts" 섹션의 내용으로 교체
→ images.remotePatterns에 GitHub 도메인 추가
```

**2-3. `tailwind.config.ts` 수정**
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "tailwind.config.ts" 섹션의 내용으로 교체
→ 브랜드 컬러, 다크 모드 색상, 언어 색상, 폰트, 애니메이션 모두 포함
```

**2-4. `vercel.json` 생성** (프로젝트 루트)
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "vercel.json" 섹션 참고
→ 크론잡 2개 설정 (트렌딩 수집 + 번역)
```

**2-5. `src/app/globals.css` 수정**
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "globals.css" 섹션의 내용으로 교체
→ Pretendard + JetBrains Mono 폰트 import
→ CSS 변수, glass-card, skeleton, gradient-text 클래스 정의
```

**이 단계 완료 체크**:
- [ ] `.env.local`에 모든 환경변수 값 입력
- [ ] `npm run dev` 실행 시 에러 없음
- [ ] 브라우저에서 Pretendard 폰트 적용 확인

---

### Step 3: TypeScript 타입 정의

**3-1. `src/types/repository.ts` 생성**
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "2.1 repository.ts" 섹션 참고
→ Repository, TrendingRepository, SimilarRepository, LanguageStat 인터페이스
```

**3-2. `src/types/trending.ts` 생성**
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "2.2 trending.ts" 섹션 참고
→ TrendingPeriod, ProgrammingLanguage, TrendingFilters, TrendingSnapshot 타입
```

**3-3. `src/types/api.ts` 생성**
```
→ 02_IMPLEMENTATION_BLUEPRINT.md의 "2.3 api.ts" 섹션 참고
→ ApiResponse<T>, ReadmeKoResponse 등 API 응답 타입
```

**3-4. `src/types/index.ts` 생성**
```typescript
// 모든 타입을 한 곳에서 re-export
export * from './repository';
export * from './trending';
export * from './api';
```

**이 단계 완료 체크**:
- [ ] `npm run build` 시 타입 에러 없음

---

### Step 4: Supabase 데이터베이스 셋업

**4-1. Supabase 프로젝트 생성**
```
1. https://supabase.com 접속
2. "New Project" 클릭
3. 이름: "gittrend-korea"
4. 리전: "Northeast Asia (Tokyo)" 선택 (한국에서 가장 빠름)
5. 비밀번호 설정 후 생성
```

**4-2. SQL 실행**
```
1. Supabase 대시보드 → "SQL Editor" 클릭
2. "New query" 클릭
3. 03_API_AND_DATABASE.md의 "1.1 테이블 생성" SQL 전체를 복사/붙여넣기
4. "Run" 클릭
5. 에러 없이 완료되는지 확인
```

**4-3. 환경변수 확인**
```
1. Supabase 대시보드 → "Settings" → "API"
2. "Project URL" → NEXT_PUBLIC_SUPABASE_URL에 입력
3. "anon public" 키 → NEXT_PUBLIC_SUPABASE_ANON_KEY에 입력
4. "service_role" 키 → SUPABASE_SERVICE_ROLE_KEY에 입력
```

**이 단계 완료 체크**:
- [ ] Supabase에 4개 테이블 생성됨 (repositories, trending_snapshots, translation_cache, api_usage_log)
- [ ] 인덱스 6개 생성됨
- [ ] RLS 정책 설정됨

---

### Step 5: 핵심 라이브러리 구현

> **이 순서대로 파일을 생성하세요. 각 파일은 이전 파일에 의존할 수 있습니다.**

**생성 순서:**
```
5-1. src/lib/constants.ts        ← 상수 정의 (의존성 없음)
5-2. src/lib/utils.ts            ← 유틸리티 (의존성: constants)
5-3. src/lib/redis.ts            ← Redis 클라이언트 (의존성 없음)
5-4. src/lib/supabase/server.ts  ← Supabase 서버 클라이언트 (의존성 없음)
5-5. src/lib/supabase/client.ts  ← Supabase 브라우저 클라이언트 (의존성 없음)
5-6. src/lib/github.ts           ← GitHub API (의존성: utils, constants)
5-7. src/lib/gemini.ts           ← Gemini 번역 (의존성: constants)
5-8. src/lib/translator.ts       ← 번역 오케스트레이터 (의존성: redis, supabase, gemini)
5-9. src/lib/similarity.ts       ← 유사 레포 (의존성: github, redis, utils)
```

**구현 참고**: 각 파일의 상세 함수 명세는 02_IMPLEMENTATION_BLUEPRINT.md의 "7. 핵심 라이브러리 구현 명세" 참고

**⚠️ 중요: 각 라이브러리 구현 시 반드시 지켜야 할 규칙**

```
1. 모든 외부 API 호출 함수는 try-catch로 감싸야 한다
2. GitHub API 호출 시 Authorization 헤더를 반드시 포함해야 한다
3. Gemini API 호출 실패 시 null을 반환하고 에러 로깅해야 한다
4. Redis 연결 실패 시 캐시 없이 동작해야 한다 (graceful degradation)
5. 모든 함수에 JSDoc 주석을 포함해야 한다
```

**이 단계 완료 체크**:
- [ ] 9개 파일 모두 생성
- [ ] `npm run build` 시 에러 없음
- [ ] 각 파일에서 환경변수 참조 정상

---

## Phase 2: 백엔드 API

### Step 6: 크론잡 — 트렌딩 수집 API

```
파일: src/app/api/cron/fetch-trending/route.ts

구현 참고: 03_API_AND_DATABASE.md의 "2.6 크론잡: 트렌딩 수집" 섹션

핵심 로직:
1. Authorization 헤더 검증 (CRON_SECRET)
2. 3개 기간(daily, weekly, monthly) × GitHub Search API 호출
3. 각 레포를 DB에 upsert (github_id 기준 중복 방지)
4. trending_snapshots에 오늘의 순위 기록
5. 사용량 로깅

테스트 방법:
curl http://localhost:3000/api/cron/fetch-trending \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

**이 단계 완료 체크**:
- [ ] API 호출 시 200 응답
- [ ] Supabase DB에 레포 데이터 저장됨
- [ ] trending_snapshots에 스냅샷 생성됨

---

### Step 7: 크론잡 — 번역 API

```
파일: src/app/api/cron/translate-new/route.ts

구현 참고: 03_API_AND_DATABASE.md의 "2.7 크론잡: 신규 번역" 섹션

핵심 로직:
1. Authorization 검증
2. description_ko IS NULL인 레포 15개 조회 (스타 높은 순)
3. 각 레포마다:
   a. README 원본 가져오기 (GitHub API)
   b. description 번역 (Gemini)
   c. README 번역 (Gemini)
   d. 3줄 요약 생성 (Gemini)
   e. DB + Redis 저장
4. 무료 한도 80% 초과 시 중단

⚠️ 주의: Gemini API는 RPM(분당 15회) 제한이 있으므로
   각 호출 사이에 최소 4초 대기(setTimeout/delay) 필요

테스트: Step 6 실행 후 이 API 호출 → 번역 결과 DB에 저장 확인
```

---

### Step 8: 트렌딩 목록 API

```
파일: src/app/api/trending/route.ts

구현 참고: 03_API_AND_DATABASE.md의 "2.1 GET /api/trending" 섹션

핵심 로직:
1. 쿼리 파라미터 파싱 (period, language, page, per_page)
2. Redis 캐시 확인
3. DB에서 조회 (trending_snapshots JOIN repositories)
4. DB에도 없으면 GitHub API 직접 호출 (폴백)
5. 결과 캐싱 + 반환

테스트:
curl "http://localhost:3000/api/trending?period=daily&language=all"
```

---

### Step 9: 레포 상세 API + README 한글 API

```
파일 1: src/app/api/repos/[owner]/[name]/route.ts
파일 2: src/app/api/repos/[owner]/[name]/readme-ko/route.ts

구현 참고: 03_API_AND_DATABASE.md의 "2.2", "2.3" 섹션

레포 상세 핵심:
1. DB에서 full_name으로 조회
2. 없으면 GitHub API 호출 → DB 저장
3. 언어 통계 포함하여 반환

README 한글 핵심:
1. 3-Layer 캐싱 (Redis → DB → Gemini)
2. 번역 중이면 202 응답
3. 한도 초과 시 원본 제공

테스트:
curl "http://localhost:3000/api/repos/vercel/ai"
curl "http://localhost:3000/api/repos/vercel/ai/readme-ko"
```

---

### Step 10: 유사 레포 API + 검색 API

```
파일 1: src/app/api/repos/[owner]/[name]/similar/route.ts
파일 2: src/app/api/search/route.ts

구현 참고: 03_API_AND_DATABASE.md의 "2.4", "2.5" 섹션

유사 레포 핵심:
1. 소스 레포의 Topics 가져오기
2. GitHub Search API로 같은 Topics 검색
3. 유사도 점수 계산
4. 상위 10개 반환

검색 핵심:
1. 쿼리를 DB에서 LIKE 검색 (description_ko, summary_ko)
2. GitHub Search API에도 검색
3. 중복 제거 후 합침
4. 결과 캐싱

테스트:
curl "http://localhost:3000/api/repos/vercel/ai/similar"
curl "http://localhost:3000/api/search?q=AI+프레임워크"
```

**Phase 2 완료 체크**:
- [ ] 모든 API 엔드포인트가 정상 응답
- [ ] 크론잡 2개 모두 정상 동작
- [ ] 캐싱 동작 확인 (두 번째 호출 시 is_cached: true)
- [ ] Gemini 번역 결과가 자연스러운 한국어인지 확인
- [ ] `npm run build` 성공

---

## Phase 3: 프론트엔드 UI

### Step 11: 기초 UI 컴포넌트 (의존성 없는 것부터)

```
생성 순서:
11-1. src/components/ui/Badge.tsx
11-2. src/components/ui/Button.tsx
11-3. src/components/ui/Card.tsx
11-4. src/components/ui/Skeleton.tsx
11-5. src/components/ui/Tabs.tsx
11-6. src/components/ui/LanguageBadge.tsx
11-7. src/components/ui/StarCount.tsx
11-8. src/components/ui/EmptyState.tsx

구현 참고: 04_FRONTEND_SPECIFICATION.md 각 컴포넌트 섹션

모든 기초 컴포넌트 규칙:
- Props 타입을 명시적으로 정의
- className prop을 받아 clsx로 병합
- Tailwind 클래스 사용
- 접근성(aria 속성) 포함
```

---

### Step 12: 레이아웃 컴포넌트

```
생성 순서:
12-1. src/components/layout/Header.tsx
12-2. src/components/layout/Footer.tsx
12-3. src/components/layout/MobileNav.tsx

구현 참고: 04_FRONTEND_SPECIFICATION.md의 Header, Footer 섹션

Header 구현 후 → src/app/layout.tsx 업데이트:
- Header, Footer import
- Pretendard/JetBrains Mono 폰트 CDN link 태그 추가
- <html lang="ko" className="dark"> 설정
- 메타데이터 설정 (metadata export)
```

---

### Step 13: 검색 컴포넌트

```
13-1. src/hooks/useDebounce.ts
13-2. src/components/search/SearchBar.tsx
13-3. src/components/search/SearchResults.tsx

구현 참고: 04_FRONTEND_SPECIFICATION.md의 SearchBar, useDebounce 섹션
```

---

### Step 14: 트렌딩 컴포넌트

```
생성 순서:
14-1. src/components/trending/MiniStarChart.tsx
14-2. src/components/trending/TrendingCard.tsx   (⭐ 가장 중요!)
14-3. src/components/trending/TrendingFilters.tsx
14-4. src/components/trending/PeriodTabs.tsx
14-5. src/components/trending/TrendingList.tsx

구현 참고: 04_FRONTEND_SPECIFICATION.md의 각 섹션

TrendingCard는 이 프로젝트의 핵심 컴포넌트입니다.
반드시 04_FRONTEND_SPECIFICATION.md의 "2.2 TrendingCard.tsx" 섹션을
완전히 준수하여 구현하세요.
```

---

### Step 15: 레포 상세 컴포넌트

```
생성 순서:
15-1. src/components/repo/LanguageBar.tsx
15-2. src/components/repo/RepoHeader.tsx
15-3. src/components/repo/RepoStats.tsx
15-4. src/components/repo/KoreanSummary.tsx
15-5. src/components/repo/ReadmeViewer.tsx
15-6. src/components/repo/SimilarRepoCard.tsx
15-7. src/components/repo/SimilarRepoList.tsx

구현 참고: 04_FRONTEND_SPECIFICATION.md 각 섹션
```

---

### Step 16: Custom Hooks

```
16-1. src/hooks/useTrending.ts
16-2. src/hooks/useRepo.ts
16-3. src/hooks/useSearch.ts

구현 참고: 04_FRONTEND_SPECIFICATION.md의 "3. Custom Hooks" 섹션
```

---

### Step 17: 메인 페이지 + 트렌딩 페이지

```
17-1. src/app/page.tsx          (메인 = 트렌딩 대시보드)
17-2. src/app/trending/page.tsx (트렌딩 전체 목록)
17-3. src/app/loading.tsx       (루트 로딩 UI)
17-4. src/app/error.tsx         (에러 UI)
17-5. src/app/not-found.tsx     (404 UI)

구현 참고: 04_FRONTEND_SPECIFICATION.md의 "1.2 메인 페이지" 섹션

핵심 구현 사항:
- page.tsx는 서버 컴포넌트 (async function)
- 서버에서 /api/trending 데이터를 fetch
- revalidate = 3600 (ISR)
- 히어로 섹션 + 검색바 + 필터 + 카드 목록
- 상위 3개 카드: 3열 그리드 (데스크톱)
- 나머지: 1열 리스트

⚠️ 서버 컴포넌트에서 API 호출 시:
  - 절대 경로 사용: `${process.env.NEXT_PUBLIC_SITE_URL}/api/trending`
  - 또는 직접 DB/라이브러리 호출 (API Route 거치지 않고)
  - 추천: 서버 컴포넌트에서는 라이브러리 직접 호출이 더 효율적
```

---

### Step 18: 레포 상세 + 검색 페이지

```
18-1. src/app/repo/[owner]/[name]/page.tsx         (레포 한글 상세)
18-2. src/app/repo/[owner]/[name]/similar/page.tsx  (유사 레포 비교)
18-3. src/app/search/page.tsx                       (검색 결과)

구현 참고: 04_FRONTEND_SPECIFICATION.md의 "1.3", "1.4" 섹션

레포 상세 페이지 핵심:
- 서버 컴포넌트에서 기본 정보 fetch (SSR)
- README 한글 번역은 클라이언트에서 fetch (로딩 중 스켈레톤)
- 유사 레포도 클라이언트에서 fetch
- 탭: "한글 README" | "원본 README"
- generateMetadata() 함수로 동적 SEO 메타데이터

검색 페이지 핵심:
- URL의 searchParams에서 q 파라미터 읽기
- 클라이언트 컴포넌트 ('use client')
- 검색 결과를 TrendingCard 컴포넌트로 렌더링
```

**Phase 3 완료 체크**:
- [ ] 메인 페이지에 트렌딩 레포가 카드로 표시됨
- [ ] 일간/주간/월간 탭 전환 동작
- [ ] 언어 필터 동작
- [ ] 카드 클릭 → 레포 상세 페이지 이동
- [ ] 레포 상세 페이지에서 한글 요약 표시
- [ ] 한글 README 탭에서 번역된 README 표시
- [ ] 유사 레포 목록 표시
- [ ] 검색 동작 (한글/영어)
- [ ] 반응형 디자인 (모바일, 태블릿, 데스크톱)
- [ ] 로딩 UI (스켈레톤) 동작
- [ ] 에러 UI 동작
- [ ] 404 페이지 동작
- [ ] `npm run build` 성공

---

## Phase 4: 통합 & 배포

### Step 19: 전체 통합 테스트

```
아래 시나리오를 순서대로 테스트:

1. 초기 데이터 수집
   - /api/cron/fetch-trending 호출
   - DB에 레포 데이터 저장 확인

2. 번역 실행
   - /api/cron/translate-new 호출
   - DB에 한글 번역 저장 확인

3. 메인 페이지 확인
   - http://localhost:3000 접속
   - 트렌딩 카드 표시 확인
   - 한글 설명 표시 확인

4. 필터 테스트
   - 일간/주간/월간 전환
   - 언어 필터 변경

5. 레포 상세 페이지
   - 카드 클릭 → 상세 페이지
   - 한글 요약 표시 확인
   - 한글 README 로딩 확인
   - 유사 레포 표시 확인

6. 검색 테스트
   - 영어 검색: "react"
   - 한글 검색: "리액트"
   - 빈 검색어 방지

7. 반응형 테스트
   - Chrome DevTools → 모바일 모드
   - 카드 1열 표시 확인
   - 헤더 햄버거 메뉴 확인

8. 에러 시나리오
   - 존재하지 않는 레포 URL → 404 확인
   - API 키 제거 → 에러 처리 확인
```

---

### Step 20: SEO 최적화

```
20-1. 각 페이지의 metadata export 확인:
  - title: 각 페이지 고유 제목
  - description: 각 페이지 설명
  - openGraph: og:image, og:title 등
  - twitter: 카드 설정

20-2. public/robots.txt 생성:
  User-agent: *
  Allow: /
  Sitemap: https://YOUR_DOMAIN/sitemap.xml

20-3. src/app/sitemap.ts 생성:
  - 정적 페이지: /, /trending, /search
  - 동적 페이지: /repo/:owner/:name (DB에서 목록 가져오기)

20-4. public/og-image.png 생성:
  - 1200×630px
  - "🔥 깃트렌드 코리아 - GitHub 트렌딩을 한국어로" 텍스트
  - 브랜드 컬러 배경
```

---

### Step 21: 성능 최적화

```
21-1. Next.js Image 최적화:
  - GitHub 아바타 이미지에 next/image 사용
  - width, height 명시
  - loading="lazy"

21-2. 동적 임포트:
  - ReadmeViewer는 dynamic import (SSR 비활성화)
  - import dynamic from 'next/dynamic';
  - const ReadmeViewer = dynamic(() => import('./ReadmeViewer'), { ssr: false });

21-3. 클라이언트 번들 최적화:
  - lucide-react에서 필요한 아이콘만 import
  - ❌ import { Star } from 'lucide-react';
  - ✅ import Star from 'lucide-react/dist/esm/icons/star';
  - 또는 바로 import { Star, GitFork, Eye } from 'lucide-react'; (tree-shaking됨)

21-4. 폰트 최적화:
  - Pretendard CSS는 <link rel="preload"> 적용
```

---

### Step 22: Vercel 배포

```
22-1. GitHub 리포지토리 생성:
  git init
  git add .
  git commit -m "Initial commit: GitTrend Korea MVP"
  git remote add origin https://github.com/YOUR_USERNAME/gittrend-korea.git
  git push -u origin main

22-2. Vercel 프로젝트 생성:
  1. https://vercel.com 접속
  2. "Import Project" → GitHub 레포 선택
  3. Framework: Next.js (자동 감지)
  4. Environment Variables 설정:
     - GITHUB_TOKEN
     - GEMINI_API_KEY
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - UPSTASH_REDIS_REST_URL
     - UPSTASH_REDIS_REST_TOKEN
     - CRON_SECRET
     - NEXT_PUBLIC_SITE_URL (배포 후 Vercel URL로 변경)
  5. "Deploy" 클릭

22-3. 배포 확인:
  - 배포 URL 접속
  - 모든 페이지 동작 확인
  - 크론잡 동작 확인 (Vercel Dashboard → Cron Jobs)

22-4. 커스텀 도메인 (선택):
  - Vercel → Settings → Domains
  - 원하는 도메인 추가 (예: gittrend.kr)
```

---

## ✅ 최종 완료 체크리스트

```
기반:
  □ Next.js 프로젝트 생성 및 설정 완료
  □ 환경변수 모두 설정
  □ Supabase DB 테이블 4개 + 인덱스 + RLS 생성
  □ TypeScript 타입 정의 완료
  □ 핵심 라이브러리 9개 파일 구현

백엔드:
  □ /api/cron/fetch-trending 동작
  □ /api/cron/translate-new 동작
  □ /api/trending 동작 (필터 포함)
  □ /api/repos/:owner/:name 동작
  □ /api/repos/:owner/:name/readme-ko 동작 (3-Layer 캐싱)
  □ /api/repos/:owner/:name/similar 동작
  □ /api/search 동작

프론트엔드:
  □ Header + Footer 레이아웃
  □ 메인 페이지 (히어로 + 검색 + 필터 + 카드 목록)
  □ 트렌딩 카드 (상위 3개 특별 스타일)
  □ 기간/언어 필터
  □ 레포 상세 페이지 (통계 + 요약 + README + 유사 레포)
  □ 한글 README 렌더링 (마크다운)
  □ AI 3줄 한글 요약
  □ 유사 레포 추천 (카드)
  □ 검색 페이지
  □ 404 / 에러 / 로딩 페이지
  □ 반응형 (모바일 + 데스크톱)
  □ 다크 모드 적용

배포:
  □ Vercel 배포 완료
  □ 크론잡 2개 동작 확인
  □ SEO 메타데이터 설정
  □ og-image 설정
```

---

## 🚨 흔한 오류와 해결법

### 오류 1: GitHub API 403 Forbidden
```
원인: API Rate Limit 초과
해결:
  1. GITHUB_TOKEN이 .env.local에 정확히 설정되었는지 확인
  2. 토큰에 public_repo 권한이 있는지 확인
  3. Redis 캐싱이 정상 동작하는지 확인
```

### 오류 2: Gemini API 429 Too Many Requests
```
원인: 무료 한도(15 RPM) 초과
해결:
  1. API 호출 간 4초 이상 delay 추가
  2. 캐싱이 된 결과에 다시 API 호출하지 않는지 확인
  3. 크론잡에서 한 번에 처리하는 레포 수를 줄이기 (15 → 10)
```

### 오류 3: Supabase 연결 실패
```
원인: 환경변수 오류 또는 RLS 정책 문제
해결:
  1. SUPABASE_URL, ANON_KEY가 정확한지 확인
  2. API Routes에서는 SERVICE_ROLE_KEY로 클라이언트 생성
  3. RLS 정책에서 INSERT/UPDATE가 허용되는지 확인
```

### 오류 4: Upstash Redis 오류
```
원인: Redis 연결 실패 또는 한도 초과
해결:
  1. redis.ts에서 graceful degradation 구현
  2. Redis 연결 실패 시 → 캐시 없이 DB 직접 조회
  3. try-catch로 Redis 에러를 잡고 로그만 남기기
```

### 오류 5: Next.js 빌드 에러 "Text content does not match"
```
원인: 서버/클라이언트 렌더링 불일치 (Hydration 에러)
해결:
  1. 날짜/시간 표시는 클라이언트 컴포넌트에서만 렌더링
  2. Math.random() 등 비결정적 값 사용 금지
  3. useEffect에서 동적 콘텐츠 설정
```

### 오류 6: ReadmeViewer에서 마크다운 렌더링 오류
```
원인: react-markdown SSR 호환 문제
해결:
  1. ReadmeViewer를 dynamic import로 SSR 비활성화
  2. rehype-highlight의 CSS를 globals.css에 포함
```

### 오류 7: Vercel Cron Job 실행 안 됨
```
원인: vercel.json 설정 오류 또는 인증 문제
해결:
  1. vercel.json의 crons 설정 확인
  2. API Route에서 Authorization 헤더 검증 코드 확인
  3. Vercel 환경변수에 CRON_SECRET 설정 확인
  4. Vercel Dashboard → Cron Jobs에서 로그 확인
```

### 오류 8: 한글 번역 품질이 낮음
```
원인: Gemini 프롬프트가 부족하거나 텍스트가 너무 김
해결:
  1. 03_API_AND_DATABASE.md의 프롬프트를 정확히 사용
  2. README가 너무 길면 앞 3000자만 번역
  3. 코드 블록을 마커로 치환 후 번역, 이후 복원
```

---

## 📎 참고 문서 매핑

| 구현 주제 | 참고 문서 | 섹션 |
|-----------|----------|------|
| 프로젝트 비전/기능 | 00_PROJECT_PROPOSAL.md | 전체 |
| 무료 전략/비용 | 01_FREE_INFRASTRUCTURE.md | 전체 |
| 파일 구조/타입/설정/상수 | 02_IMPLEMENTATION_BLUEPRINT.md | 1~8 |
| DB 스키마/SQL | 03_API_AND_DATABASE.md | 1 |
| API 명세/응답 | 03_API_AND_DATABASE.md | 2 |
| GitHub API 쿼리 | 03_API_AND_DATABASE.md | 3 |
| Redis 키 설계 | 03_API_AND_DATABASE.md | 4 |
| Gemini 프롬프트 | 03_API_AND_DATABASE.md | 5 |
| 페이지 레이아웃/UX | 04_FRONTEND_SPECIFICATION.md | 1 |
| 컴포넌트 Props/스타일 | 04_FRONTEND_SPECIFICATION.md | 2 |
| Custom Hooks | 04_FRONTEND_SPECIFICATION.md | 3 |
| 구현 순서 | 05_STEP_BY_STEP_GUIDE.md | 전체 (이 문서) |

---

*이 가이드의 22단계를 순서대로 완료하면 GitTrend Korea MVP가 완성됩니다.*
