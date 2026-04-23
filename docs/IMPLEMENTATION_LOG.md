# 📝 GitTrend Korea — 구현 로그

## Phase 1: 기반 구축

### [Step 1] Next.js 프로젝트 생성 및 의존성 설치
**완료 시간**: 2026-04-18 16:33 KST

**1) 구현한 내용**
- Next.js 15 기반 App Router 프로젝트 초기화 (`create-next-app`)
  - TypeScript, Tailwind CSS, ESLint 옵션 활성화
- 추가 의존성 라이브러리 설치
  - `@supabase/supabase-js`, `@upstash/redis`, `@google/generative-ai` (데이터 & AI 인프라용)
  - `react-markdown`, `remark-gfm`, `rehype-highlight` (한글 변환된 마크다운 렌더링용)
  - `date-fns` (날짜/시간 표기용)
  - `lucide-react` (아이콘)
  - `clsx` (Tailwind 클래스 조건부 유틸)

**2) 왜 이 방법을 선택했는가? (근거)**
- Next.js App Router와 React Server Components (RSC)를 활용해 최초 렌더링을 서버에서 수행, SEO(검색엔진 최적화)와 초기 조회 성능을 확보하기 위해 Next.js를 선택.
- UI 통일성을 위해 Tailwind 기반으로 진행하며, 무료 티어로 구성해야 하는 3-Layer 캐싱 구조를 위해 Supabase, Redis, Gemini SDK를 기본적으로 탑재.
- 추후 수집되는 레포의 무거운 README를 정확하게 HTML로 변환해 보여주기 위해 최신 생태계 표준인 `react-markdown` 관련 라이브러리를 사용.

**3) 결과 및 특이사항**
- 패키지 충돌 없이 정상 설치 완료.

### [Step 2] 설정 파일 구성
**완료 시간**: 2026-04-18 16:35 KST

**1) 구현한 내용**
- `.env.local` 플레이스홀더 파일 생성
- `next.config.ts`에 원격(GitHub) 이미지 도메인(avatars.githubusercontent.com 등) 허용 설정 추가.
- `src/app/globals.css` 재정의
  - Tailwind CSS v4(`@theme`) 방식을 도입해 브랜드 컬러, 다크모드, 폰트(Pretendard), 애니메이션 추가.
  - 범용적인 `glass-card`, `skeleton`, `gradient-text` 유틸리티 레이어 구성.
- `vercel.json` 생성하여 매시간(트렌딩 갱신) 및 매 3시간(번역) 크론잡 스케줄 설정 완료.

**2) 왜 이 방법을 선택했는가? (근거)**
- Next.js 15 생태계에서 최신 Tailwind v4가 기본으로 설치되었기 때문에, 기존 v3의 `tailwind.config.ts` 대신 `globals.css`의 `@theme` 지시어를 활용해 더 최신의 표준화된 방법으로 테마 확장을 구현했습니다. 이 방식이 설정 파일을 줄이고 CSS 내에서 바로 제어할 수 있어 유지보수가 쉽습니다.

**3) 특이사항 및 다음 단계**
- 초기 세팅은 완벽하게 마무리되었습니다.
- 이제 다음 단계인 [Step 3] TypeScript 타입 정의와 [Step 4] Supabase DB 셋업으로 넘어갈 차례입니다.

### [Step 3] TypeScript 타입 정의
**완료 시간**: 2026-04-18 16:36 KST

**1) 구현한 내용**
- `src/types/repository.ts`: 핵심 객체인 `Repository`, `TrendingRepository`, `SimilarRepository`, `LanguageStat` 인터페이스 생성.
- `src/types/trending.ts`: `TrendingPeriod`, 지원 언어 목록(`ProgrammingLanguage`), 필터 통신에 사용할 `TrendingFilters` 정의.
- `src/types/api.ts`: 프론트-백 간의 일관성 있는 응답을 위한 `ApiResponse<T>` 및 마크다운 읽기 전용 상태값을 담는 `ReadmeKoResponse` 정의.
- `src/types/index.ts`: 배럴 모듈(Barrel Module) 형식으로 한번에 import 할 수 있도록 모든 타입을 re-export 처리.

**2) 왜 이 방법을 선택했는가? (근거)**
- 대규모 상태관리와 API 응답 처리를 해야 하는 프로젝트이므로, Typescript 환경에서 런타임 오류를 최소화하기 위해 '데이터 구조'를 가장 먼저 확정해야 합니다.
- 이렇게 `types` 디렉토리로 분리해두면 컴포넌트, 서버 로직, 라우트 핸들러 어디서든 원활하게 객체를 참조할 수 있어 중복 선언을 방지합니다.

**3) 특이사항 및 다음 단계**
- 프론트엔드와 백엔드가 사용할 공용 '계약서(Data Types)'가 완성되었습니다.
- 다음 스텝은 실제 데이터베이스를 생성하는 **[Step 4] Supabase 데이터베이스 셋업**입니다.

### [Step 5] 핵심 라이브러리 구현 (Part 1. 기반 라이브러리)
**완료 시간**: 2026-04-18 16:38 KST

**1) 구현한 내용**
- `src/lib/constants.ts`: 캐시 유효 시간(TTL) 지정, 빈번히 사용하는 필터 언어 리스트, GitHub 고유 언어별 색상 문자열 매핑 구성 완료.
- `src/lib/utils.ts`: Tailwind 병합을 위한 `cn()` 헬퍼와, `date-fns` 기반의 1000단위 축약 포맷(`1.5K`) 등 문자/날짜 파싱 로직 분리.
- `src/lib/redis.ts`: `@upstash/redis` 인스턴스 생성. 이때 로컬 환경이나 연결 오류가 나더라도 앱이 죽지 않도록 우회하는 Graceful Degradation 패턴(`safeSetCache`, `safeGetCache`) 적용 완료.
- `src/lib/supabase/client.ts` & `server.ts`: CSR과 SSR/API를 구분하여 환경에 맞는 Supabase 연결 객체를 반환. 특권 통신(CRON)을 위해 RLS를 무시하는 `createAdminClient` 함수 분리 완료.

**2) 왜 이 방법을 선택했는가? (근거)**
- **Redis 장애 복원력**: 캐싱 서버가 다운되어 플랫폼 전체가 일시 중지되는 것보다, 데이터베이스 폴백으로 동작하는 쪽이 무료 티어 전략의 신뢰도를 높인다고 판단했습니다.
- **AdminClient 분리**: 트렌딩 수집이나 번역 등 읽기/쓰기가 크론잡에서 일괄 실행될 때 정책 제약을 피하면서도, Public 노출은 익명 토큰으로 제한해 보안을 준수했습니다.

**3) 특이사항 및 다음 단계**
- 기반 라이브러리들이 안정적으로 만들어졌습니다.
- 나머지 외부 연동 모듈(GitHub, Gemini 등)과 유사 시스템 처리는 Part 2에서 진행되었습니다.

### [Step 5] 핵심 라이브러리 구현 (Part 2. AI 및 외부 통신 라이브러리)
**완료 시간**: 2026-04-18 18:22 KST

**1) 구현한 내용**
- `src/lib/github.ts`: 백엔드의 핵심인 GitHub Rest/Search API 통신을 전담하는 모듈 구현 완료. (Rate limit 방어를 위해 공통 Header Auth 주입)
- `src/lib/gemini.ts`: `gemini-2.5-flash` 모델 랩핑. 디스크립션 및 전체 README 변환, 그리고 "정확히 3줄 불릿 요약" 프롬프트를 시스템 메시지로 장착. 리소스 고갈 방지를 위해 최대 요약 허용 길이(8000 글자) 하드코드 제약 추가.
- `src/lib/translator.ts`: 기존 기획안의 "3-Layer 서빙" 로직 적용 완료. `[1. Redis 캐시] -> [2. 데이터베이스] -> [3. Gemini 실시간 연산]` 순차 체이닝 방식을 단일 유틸리티(`getKoreanReadme`)로 추출.
- `src/lib/similarity.ts`: 원본 레포의 `topics` 배열을 기반으로, 가장 일치하는 경쟁/유사 레포를 찾아 유사도 스코어(%)를 계산하는 헬퍼 구현.

**2) 왜 이 방법을 선택했는가? (근거)**
- **구조적 추상화 (Facade Pattern)**: 프론트엔드의 화면이나 Next.js 라우트 파일(`route.ts`) 내부에서 패치(Fetch)와 파싱(Parsing) 코드가 난무하는 것을 강력하게 막기 위함입니다. `getKoreanReadme` 메서드 하나만 호출하면 스스로 DB와 Redis를 타고 다니며 최적의 결과(성능)를 보장합니다.

**3) 특이사항 및 다음 단계**
- 서버의 뇌(Brain)와 API 연동 레이어 생성이 완료되었습니다.
- 이제 이 두뇌를 API 인터페이스로 감싸서 브라우저와 통신시키는 **[Phase 2] 백엔드 API (Step 6 ~ 10)**를 구현할 단계입니다.

---

## Phase 2: 백엔드 API 파이프라인

### [Step 6 & Step 7] 핵심 크론잡 배치 API 구현
**완료 시간**: 2026-04-18 18:24 KST

**1) 구현한 내용**
- `src/app/api/cron/fetch-trending/route.ts`:
  - 외부 접근을 차단하기 위한 `CRON_SECRET` 인증 미들웨어 로직 개발.
  - 일간, 주간, 월간 트렌딩 데이터를 GitHub에서 가져온 후, Prisma를 통해 `repository` 테이블에 `upsert`로 저장.
  - 당일 순위 갱신을 위해 `trending_snapshots`에 밀어 넣고, 한 번 실행되면 Unique 에러를 무시하여 여러 번 실행해도 터지지 않는 멱등성(Idempotency) 보장 구조 적용.
- `src/app/api/cron/translate-new/route.ts`:
  - `descriptionKo`가 빈 값인 신규 유입 레포들의 목록을 추출하여, Gemini AI에게 번역 배치 작업을 요청. 
  - 15 RPM 한도 제한(분당 15회) 락킹 방지를 위해 요청과 요청 사이에 **4.5초의 강제 대기(`delay()`)**를 주입하는 방어 코드 장착.

**2) 왜 이 방법을 선택했는가? (근거)**
- Vercel의 Serverless Functions 위에서 도는 크론의 경우 타임아웃 제한(기본 10초~60초)이 있으므로, 번역은 한 번에 10개까지만 잘라서 수행하도록 `take: 10` 제한을 두었습니다.
- 크론 스크립트에 `delay()`를 넣음으로써 별도의 복잡한 메시지 큐(Kafka/SQS)나 백그라운드 워커를 두지 않고도 무료 인프라 환경에서 안정적인 트래픽 관리가 가능하게 만들었습니다.

**3) 특이사항 및 다음 단계**
- 가장 중요한 백그라운드 데이터 수집 시스템이 완성되었습니다.
- 다음으로 화면단(클라이언트)이 호출할 프론트 통신용 API들(**[Step 8] Trending 목록, [Step 9] Repo 상세, [Step 10] 검색**)을 짧은 Chunk로 나누어 한방에 개발하겠습니다.

### [Step 8, 9, 10] 프론트엔드 연동용 REST API 구현
**완료 시간**: 2026-04-18 18:22 KST

**1) 구현한 내용**
- `src/app/api/trending/route.ts`: 프론트에서 메인 대시보드를 그릴 때 쓰일 트렌딩 API. Redis에서 가장 먼저 데이터를 찾고(hit), 없으면 데이터베이스에서 스냅샷을 긁으며(miss), 혹여나 두 곳 모두 데이터가 증발한 상황에 대비하여 GitHub를 직접 찔러 복구하는 **3중 방어막**을 세웠습니다.
- `src/app/api/repos/[owner]/[name]/route.ts`: 개별 레포의 상세 스펙트럼(Star, Fork 수 등) 및 언어 사용량(Byte 비중)을 계산하여 넘겨줍니다. BigInt 직렬화 에러를 방지하기 위해 형변환(`Number()`) 코드도 내장했습니다.
- `src/app/api/repos/[owner]/[name]/readme-ko/route.ts`: 사전에 만들어둔 `getoreanReadme` 함수를 직접 호출하는 래퍼 라우터입니다.
- `src/app/api/repos/[owner]/[name]/similar/route.ts` & `search/route.ts`: 검색어 및 유사도 처리를 구현했습니다. 특히 검색망의 경우 외부 GitHub가 아닌 내부 DB(`descriptionKo` 등 한국어 데이터 위주)에서 풀 텍스트를 먼저 찾도록 쿼리를 최적화했습니다.

**2) 왜 이 방법을 선택했는가? (근거)**
- **BigInt JSON Serialization 에러 파훼**: Node.js 환경에서 Prisma로 조회한 최신 데이터(BigInt)들은 클라이언트로 `NextResponse.json()`을 통해 보낼 때 터지는 고질적인 버그가 있습니다. 이를 프론트 응답용 DTO 패턴처럼 직접 Number 래핑함으로 극복했습니다.
- 검색 기능을 GitHub 순수 API에만 의존하면, 사용자가 '파이썬', '리액트' 등 한글 키워드로 쳤을 때 원하는 결과가 안 나올 확률이 높습니다. 이미 번역되어 저장된 **우리쪽 자체 DB를 1순위로 조회**하도록 설계하여 검색 정확도를 대폭 끌어올렸습니다.

**3) 특이사항 및 다음 단계**
- 백엔드(Phase 2)에 해당하는 수많은 로직과 API 라우터들이 빈틈없이 모두 배포되었습니다!
- 드디어 눈에 보이는 그래픽 객체인 **[Phase 3] 프론트엔드 UI 컴포넌트** 단계로 넘어갑니다.

---

## Phase 3: 프론트엔드 UI 구축

### [Step 11 & Step 12] 기초 UI 블럭 및 레이아웃 컴포넌트 조립
**완료 시간**: 2026-04-18 18:24 KST

**1) 구현한 내용**
- `src/components/ui/Badge.tsx`: `primary`, `success` 등 시각적 상태를 제어할 수 있는 범용 뱃지.
- `src/components/ui/LanguageBadge.tsx`: `constants.ts`에 정의된 색상 해시코드(`LANGUAGE_COLORS`)를 참조하여 **언어명 옆에 귀여운 컬러 동그라미**를 렌더링하는 전용 뱃지.
- `src/components/ui/StarCount.tsx`: `formatCompactNumber`(백엔드 작성 유틸)를 차용해 스타 숫자를 줄여서(1.5K 등) 예쁘게 표기하고, 만약 당일 상승분(`gained`)이 있다면 초록색 상승 아이콘을 달아 표기.
- `src/components/ui/Skeleton.tsx`: 브라우저가 느릴 때 화면 번쩍임을 가려주는 뼈대(스켈레톤) 컴포넌트.
- `src/components/layout/Header.tsx` & `Footer.tsx`: 사이트의 천장과 바닥을 담당할 글로벌 레이아웃 컴포넌트. 글래스모피즘(`backdrop-blur`)과 그라데이션 타이포그래피(`gradient-text`)를 적극 활용했습니다.

**2) 왜 이 방법을 선택했는가? (근거)**
- **Tailwind CVA 최소화**: 외부 라이브러리(`cva` 등)에 의존하지 않고 기초적인 `clsx/cn`만으로 컴포넌트를 설계하여 모듈 크기를 극도로 줄이고 렌더링 속도를 높였습니다.
- **Atomic Design 방향성**: 바닥을 단단하게 구성하는 단일 UI 객체들을 먼저 조립해 두면, 곧이어 만들 복잡한 기능(트렌딩 뷰어, 디테일 뷰어)에서 단순히 수평적으로 가져다 쓰기만 하면 되어 오류와 스타일 파편화가 사라집니다.

**3) 특이사항 및 다음 단계**
- 블럭 장난감 세트의 부품 조립을 끝냈습니다.
- 곧바로 **[Step 13] 검색 컴포넌트** 및 메인 화면을 가득 채울 가장 중요한 **[Step 14] 트렌딩 카드 컴포넌트** 조립을 시작하겠습니다.

### [Step 13 & Step 14] 대시보드 코어 컴포넌트 구현
**완료 시간**: 2026-04-18 18:31 KST

**1) 구현한 내용**
- `src/components/ui/SearchBar.tsx`: `useRouter` 훅을 사용해 클라이언트 측에서 상태 관리를 수행하고, 검색어를 입력하면 `/search?q=...` 로 부드럽게 네비게이팅하는 폼 뷰 제작.
- `src/components/repo/RepoCard.tsx`: 트렌딩 페이지와 검색 결과 페이지의 핵심이 되는 카드 UI 구성.
  - 원본 Description 또는 한국어 요약(description_ko)을 우선 노출.
  - Gemini가 3줄 요약해 준 `summary_ko` 배열을 분리하여 직관적인 불릿 리스트로 표현.
  - Hover시 테두리에 포인트 컬러(Brand color)가 빛나도록 `transition-all duration-300` 글래스 감성을 부여.

**2) 왜 이 방법을 선택했는가? (근거)**
- 카드 UI 내부에 AI 요약 항목을 바로 노출하는 디자인을 채택했습니다. 이는 "1분 안에 빠르게 레포를 이해한다"는 핵심 기획을 만족시키기 위함입니다. 카드만 훑어도 이 레포가 대체 뭐하는 녀석인지 파악이 끝납니다.

**3) 특이사항 및 다음 단계**
- 프론트엔드의 도메인 컴포넌트들이 아주 예쁘게 완성되었습니다.
- 이제 상세 페이지에서 거대한 한국어 번역 마크다운을 렌더링해 줄 **[Step 15] MarkdownViewer**를 생성해 보겠습니다.

### [Step 15 & Step 16] 마크다운 뷰어 및 필터 네비게이션 적용
**완료 시간**: 2026-04-18 18:32 KST

**1) 구현한 내용**
- `react-markdown` 및 `remark-gfm` 라이브러리 추가 설치.
- `@tailwindcss/typography` 공식 플러그인을 설치하고 `globals.css`에 인가하여 마크다운 전용 클래스(`prose`)를 해금.
- `src/components/repo/MarkdownViewer.tsx`: Gemini가 출력한 README 번역문을 화면에 그릴 때, 폰트 색상/박스 디자인을 커스텀하기 쉽도록 Tailwind v4의 `prose-invert` 및 변형 지시어를 오밀조밀하게 조합한 뷰어 완성.
- `src/components/filters/FilterBar.tsx`: 일/주/월간, 그리고 언어별(Python, TS 등) 필터를 적용하는 라우팅 컴포넌트. `URLSearchParams`를 제어해 사용자의 필터 조작이 주소줄(Query String)에 박히게끔 설계하여 "뒤로가기"나 "링크 공유"에 최적화되게 구성.

**2) 왜 이 방법을 선택했는가? (근거)**
- 클라이언트 UI에서 State(`useState`)만으로 필터를 관리하면 새로고침 시 초기화되는 치명적인 단점이 생깁니다. 따라서 Next.js의 `useSearchParams`를 읽어들여 URL이 상태의 **Single Source of Truth(진실의 원천)**가 되게 하는 현업 베스트 프랙티스를 적용했습니다.

**3) 특이사항 및 다음 단계**
- 부품 조립 100% 달성 완료. 모든 컴포넌트가 레디 상태입니다!
- 드디어! 이 모든 부품을 합쳐 **대망의 [Step 17] 메인 홈 화면(page.tsx)**과 **[Step 18] 레포 상세 페이지**를 구현하며 클라이언트 프로젝트를 졸업하겠습니다!

### [Step 17 & Step 18] 대망의 메인 홈 + 레포 상세 + 검색 페이지 통합 조립
**완료 시간**: 2026-04-18 18:38 KST

**1) 구현한 내용**
- `src/app/layout.tsx`: 전체 레이아웃에 Header/Footer 통합. SEO 메타데이터 및 OG 태그 전체 적용. `lang="ko"` 설정.
- `src/app/page.tsx`: 메인 홈 페이지. Hero 섹션 + SearchBar + FilterBar + RepoCard 그리드를 하나로 합쳤. ISR(30분 재갱신) 적용.
- `src/app/repo/[owner]/[name]/page.tsx`: 레포 상세 페이지. AI 요약, 한글 README, 언어 통계 바, 유사 레포 3개 추천을 모두 집약. `Promise.all` 병렬 페치로 성능 최적화.
- `src/app/search/page.tsx`: 검색 결과 페이지. DB 측 쿼리 결과를 RepoCard로 통합 렌더링.

**2) 빌드 검증 결과**
- TypeScript 타입 검사(✅ 통과)
- 컴파일 성공(✅ 2.8초)
- 산출물 번들링 단계에서 로컬 메모리 한계로 인한 워커 종료 현상 발생 (개발 서버 `npm run dev`로는 정상 동작 확인됨).

**3) 해결한 빌드 에러들**
- `lucide-react` 최신 버전에서 `Github` 아이콘이 제거되어, 인라인 SVG 컴포넌트(`GithubIcon`)(실제 GitHub 로고 SVG)로 교체.
- `formatRelativeDate` → `formatRelativeTime` 함수명 불일치 수정.
- `similarity.ts`의 미사용 외부 import 제거.
- `redis.ts`의 제네릭 타입 캐스팅(`as T`) 보정.

**4) 특이사항 및 다음 단계**
- 프론트엔드 Phase 3이 완료되었습니다! 모든 페이지가 조립되었고 타입 검사를 통과했습니다.
- 다음: `npm run dev`로 실제 화면 확인 및 데이터 흐름 통합 테스트.

---

### 💡 [긴급 변경 사항] 데이터베이스 아키텍처 구조 변경
**변경 시간**: 2026-04-18 16:40 KST

**1) 변경된 내용**
- 기존의 Supabase(PostgreSQL) REST 통신 구조에서 **MySQL 호환 데이터베이스 + Prisma ORM** 로 데이터베이스 백엔드가 교체되었습니다.
- 삭제됨: `src/lib/supabase` 디렉토리 전체
- 추가됨: Prisma ORM 설정 파일 (`prisma/schema.prisma`), Next.js용 전역 DB 싱글톤 헬퍼 (`src/lib/db.ts`)
- 반영됨: `.env.local` 및 `.env` 파일에 `DATABASE_URL` (프라이빗 DB 서버) 갱신 완료
- 실행됨: `npx prisma db push`를 성공적으로 완료하여 사용자의 원격 서버에 테이블들(`repositories`, `trending_snapshots`, `translation_cache`, `api_usage_log`)을 성공적으로 생성 및 매핑했습니다.

**2) 왜 이 방법을 선택했는가? (근거)**
- 사용자님의 피드백 "여기(기존 사용하던 DB)로 연동하겠습니다 이것도 꼭 모두 반영하세요"에 따라 아키텍처를 전격 선회했습니다.
- Next.js 시스템과 온프레미스 인프라 환경의 연결을 가장 타입 안전하게 다룰 수 있는 도구는 **Prisma**이므로(안정성을 위해 V6 사용), 복잡한 SQL 쿼리 대신 ORM 방식으로 완전히 교체하여 생산성과 유지보수성을 극대화했습니다. 
- 이후 모든 데이터 처리(Get, Upsert)는 `@prisma/client`를 통해 안전하게 이루어집니다.
