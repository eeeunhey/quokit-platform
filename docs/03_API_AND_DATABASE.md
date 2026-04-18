# 🗄️ GitTrend Korea — API & 데이터베이스 완전 명세

> **이 문서는 모든 API 엔드포인트와 데이터베이스 스키마를 구현 가능한 수준으로 정의합니다.**

---

## 1. Supabase 데이터베이스 스키마 (SQL)

> **아래 SQL을 Supabase SQL Editor에서 순서대로 실행하세요.**

### 1.1 테이블 생성

```sql
-- ============================================
-- GitTrend Korea Database Schema
-- 실행 환경: Supabase (PostgreSQL 15+)
-- 실행 순서: 이 파일 전체를 한 번에 실행
-- ============================================

-- 1. 레포지토리 테이블 (핵심)
CREATE TABLE IF NOT EXISTS repositories (
    id              SERIAL PRIMARY KEY,
    github_id       BIGINT UNIQUE NOT NULL,
    full_name       VARCHAR(255) UNIQUE NOT NULL,    -- "owner/repo"
    owner           VARCHAR(100) NOT NULL,            -- "vercel"
    name            VARCHAR(200) NOT NULL,            -- "ai"
    description     TEXT,                             -- 영어 원본 설명
    description_ko  TEXT,                             -- 한글 번역 설명
    language        VARCHAR(50),                      -- 주 사용 언어
    stars_count     INTEGER DEFAULT 0,
    forks_count     INTEGER DEFAULT 0,
    watchers_count  INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    topics          JSONB DEFAULT '[]'::jsonb,        -- ["ai", "typescript"]
    homepage_url    VARCHAR(512),
    html_url        VARCHAR(512) NOT NULL,
    readme_raw      TEXT,                             -- README 원본 마크다운
    readme_ko       TEXT,                             -- README 한글 번역
    summary_ko      TEXT,                             -- AI 3줄 한글 요약
    license         VARCHAR(100),                     -- "MIT"
    created_at_github TIMESTAMPTZ,                    -- GitHub 생성일
    pushed_at       TIMESTAMPTZ,                      -- 최근 푸시
    last_synced_at  TIMESTAMPTZ DEFAULT NOW(),        -- 마지막 동기화
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 트렌딩 스냅샷 테이블
-- 매시간 크론잡이 트렌딩 순위를 기록
CREATE TABLE IF NOT EXISTS trending_snapshots (
    id              SERIAL PRIMARY KEY,
    repository_id   INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    rank            INTEGER NOT NULL,                 -- 순위 (1~30)
    period          VARCHAR(10) NOT NULL,             -- 'daily', 'weekly', 'monthly'
    stars_gained    INTEGER DEFAULT 0,                -- 해당 기간 스타 증가량
    language_filter VARCHAR(50) DEFAULT 'all',        -- 어떤 언어 필터에서의 순위인지
    snapshot_date   DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- 같은 날 같은 기간 같은 언어에서 같은 레포는 하나만
    UNIQUE(repository_id, period, language_filter, snapshot_date)
);

-- 3. 번역 캐시 테이블 (Redis 백업용)
-- Redis가 만료되었을 때 DB에서 복구 가능
CREATE TABLE IF NOT EXISTS translation_cache (
    id              SERIAL PRIMARY KEY,
    repo_full_name  VARCHAR(255) NOT NULL,
    cache_type      VARCHAR(20) NOT NULL,             -- 'readme', 'summary', 'description'
    original_text   TEXT,                              -- 원본 (참고용)
    translated_text TEXT NOT NULL,                     -- 번역 결과
    model_used      VARCHAR(50) DEFAULT 'gemini-2.0-flash',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(repo_full_name, cache_type)
);

-- 4. API 사용량 추적 테이블
-- 무료 한도 모니터링용
CREATE TABLE IF NOT EXISTS api_usage_log (
    id              SERIAL PRIMARY KEY,
    service         VARCHAR(20) NOT NULL,             -- 'gemini', 'github'
    endpoint        VARCHAR(255),
    usage_date      DATE DEFAULT CURRENT_DATE,
    request_count   INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(service, usage_date)
);

-- ============================================
-- 인덱스 생성 (검색 성능 최적화)
-- ============================================

-- 트렌딩 조회 최적화
CREATE INDEX IF NOT EXISTS idx_trending_date_period 
    ON trending_snapshots(snapshot_date, period, language_filter);

CREATE INDEX IF NOT EXISTS idx_trending_repo_date 
    ON trending_snapshots(repository_id, snapshot_date DESC);

-- 레포 검색 최적화
CREATE INDEX IF NOT EXISTS idx_repos_full_name 
    ON repositories(full_name);

CREATE INDEX IF NOT EXISTS idx_repos_language 
    ON repositories(language);

CREATE INDEX IF NOT EXISTS idx_repos_stars 
    ON repositories(stars_count DESC);

CREATE INDEX IF NOT EXISTS idx_repos_github_id 
    ON repositories(github_id);

-- Topics JSONB 검색 최적화
CREATE INDEX IF NOT EXISTS idx_repos_topics 
    ON repositories USING GIN(topics);

-- 번역 캐시 검색
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup 
    ON translation_cache(repo_full_name, cache_type);

-- ============================================
-- 자동 updated_at 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_cache_updated_at
    BEFORE UPDATE ON translation_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) 정책
-- 공개 읽기, 서버만 쓰기
-- ============================================

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- 모든 테이블: 누구나 읽기 가능
CREATE POLICY "Public read access" ON repositories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON trending_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read access" ON translation_cache FOR SELECT USING (true);

-- 쓰기는 Service Role만 가능 (API Routes에서 supabaseAdmin 사용)
CREATE POLICY "Service role insert" ON repositories FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON repositories FOR UPDATE USING (true);
CREATE POLICY "Service role insert" ON trending_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert" ON translation_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update" ON translation_cache FOR UPDATE USING (true);
CREATE POLICY "Service role all" ON api_usage_log FOR ALL USING (true);
```

### 1.2 초기 데이터 (옵션)

```sql
-- API 사용량 추적 초기화 (오늘 날짜)
INSERT INTO api_usage_log (service, usage_date, request_count)
VALUES 
    ('gemini', CURRENT_DATE, 0),
    ('github', CURRENT_DATE, 0)
ON CONFLICT (service, usage_date) DO NOTHING;
```

---

## 2. API 엔드포인트 완전 명세

### 2.1 `GET /api/trending` — 트렌딩 레포 목록

```
경로:       /api/trending
메서드:     GET
캐싱:       ISR (revalidate: 3600초 = 1시간)

쿼리 파라미터:
┌──────────┬──────────┬──────────┬──────────────────────────┐
│ 파라미터  │ 타입     │ 기본값   │ 설명                     │
├──────────┼──────────┼──────────┼──────────────────────────┤
│ period   │ string   │ "daily"  │ "daily"|"weekly"|"monthly"│
│ language │ string   │ "all"    │ "python"|"javascript"|...│
│ page     │ number   │ 1        │ 페이지 번호              │
│ per_page │ number   │ 20       │ 한 페이지 레포 수 (최대 30)│
└──────────┴──────────┴──────────┴──────────────────────────┘

처리 흐름:
1. 쿼리 파라미터 파싱 및 유효성 검사
2. Redis 캐시 확인 (키: "trending:{period}:{language}:{page}")
3. 캐시 HIT → 즉시 반환
4. 캐시 MISS → Supabase DB에서 오늘의 스냅샷 조회
5. DB에 데이터 없음 → GitHub Search API 호출하여 트렌딩 수집
6. 결과를 Redis에 저장 (TTL: 3600초)
7. 응답 반환

성공 응답 (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "github_id": 123456,
      "full_name": "vercel/ai",
      "owner": "vercel",
      "name": "ai",
      "description": "Build AI-powered applications with React...",
      "description_ko": "React로 AI 기반 애플리케이션을 구축하세요...",
      "language": "TypeScript",
      "stars_count": 45234,
      "forks_count": 3456,
      "topics": ["ai", "typescript", "react", "nextjs"],
      "stars_gained": 1234,
      "rank": 1,
      "summary_ko": "Vercel AI SDK는 ...",
      "html_url": "https://github.com/vercel/ai"
    }
    // ... 최대 20개
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "per_page": 20,
    "has_next": true
  }
}

에러 응답 (500):
{
  "success": false,
  "error": "Failed to fetch trending repositories",
  "data": []
}
```

### 2.2 `GET /api/repos/[owner]/[name]` — 레포 상세

```
경로:       /api/repos/:owner/:name
메서드:     GET
캐싱:       ISR (revalidate: 86400초 = 24시간)

URL 파라미터:
- owner: 레포 소유자 (예: "vercel")
- name: 레포 이름 (예: "ai")

처리 흐름:
1. DB에서 레포 정보 조회 (full_name = "{owner}/{name}")
2. DB에 있으면 → 반환 (번역된 정보 포함)
3. DB에 없으면:
   a. GitHub API로 레포 정보 가져오기
   b. GitHub API로 언어 통계 가져오기
   c. DB에 저장
   d. (비동기) 번역 큐에 추가
4. 응답 반환

성공 응답 (200):
{
  "success": true,
  "data": {
    "id": 1,
    "github_id": 123456,
    "full_name": "vercel/ai",
    "owner": "vercel",
    "name": "ai",
    "description": "Build AI-powered applications...",
    "description_ko": "AI 기반 애플리케이션을 구축하세요...",
    "language": "TypeScript",
    "stars_count": 45234,
    "forks_count": 3456,
    "watchers_count": 1234,
    "open_issues_count": 45,
    "topics": ["ai", "typescript", "react"],
    "homepage_url": "https://sdk.vercel.ai",
    "html_url": "https://github.com/vercel/ai",
    "summary_ko": "Vercel AI SDK는 ...\n주요 기능은...\n추천 대상은...",
    "license": "Apache-2.0",
    "created_at_github": "2023-04-14T00:00:00Z",
    "pushed_at": "2026-04-18T10:00:00Z",
    "languages": [
      { "language": "TypeScript", "percentage": 78.5, "color": "#3178c6" },
      { "language": "JavaScript", "percentage": 15.2, "color": "#f1e05a" },
      { "language": "CSS", "percentage": 6.3, "color": "#563d7c" }
    ]
  }
}

에러 응답 (404):
{
  "success": false,
  "error": "Repository not found",
  "data": null
}
```

### 2.3 `GET /api/repos/[owner]/[name]/readme-ko` — 한글 README

```
경로:       /api/repos/:owner/:name/readme-ko
메서드:     GET

처리 흐름:
1. Redis 캐시 확인 (키: "readme_ko:{owner}/{name}")
2. HIT → 즉시 반환 (is_cached: true)
3. MISS → DB의 translation_cache 테이블 확인
4. DB HIT → Redis에 저장 후 반환
5. DB MISS:
   a. GitHub API로 원본 README 가져오기
   b. Gemini API로 한글 번역
   c. Gemini API로 3줄 요약 생성
   d. DB에 저장 (translation_cache + repositories)
   e. Redis에 저장 (TTL: 86400)
   f. 반환

성공 응답 (200):
{
  "success": true,
  "data": {
    "readme_ko": "# Vercel AI SDK\n\nVercel AI SDK는 AI 기반 ...",
    "summary_ko": "Vercel AI SDK는 ...\n주요 기능은...\n추천 대상은...",
    "translation_quality": 85,
    "translated_at": "2026-04-18T10:00:00Z",
    "is_cached": false
  }
}

번역 진행 중 응답 (202):
{
  "success": true,
  "data": {
    "readme_ko": null,
    "summary_ko": null,
    "status": "translating",
    "message": "번역 중입니다. 잠시 후 다시 시도하세요."
  }
}

Gemini 한도 초과 시 (200, 원본 반환):
{
  "success": true,
  "data": {
    "readme_ko": null,
    "readme_raw": "# Vercel AI SDK\n\nThe Vercel AI SDK ...",
    "summary_ko": null,
    "status": "limit_exceeded",
    "message": "번역 서비스 일일 한도에 도달했습니다. 원본을 표시합니다."
  }
}
```

### 2.4 `GET /api/repos/[owner]/[name]/similar` — 유사 레포 추천

```
경로:       /api/repos/:owner/:name/similar
메서드:     GET

쿼리 파라미터:
┌──────────┬──────────┬──────────┬──────────────────┐
│ 파라미터  │ 타입     │ 기본값   │ 설명             │
├──────────┼──────────┼──────────┼──────────────────┤
│ limit    │ number   │ 10       │ 추천 레포 수     │
└──────────┴──────────┴──────────┴──────────────────┘

처리 흐름:
1. Redis 캐시 확인 (키: "similar:{owner}/{name}")
2. HIT → 즉시 반환
3. MISS:
   a. DB에서 소스 레포 정보 가져오기
   b. GitHub Search API로 같은 Topics 레포 검색
   c. GitHub Search API로 같은 언어 + 비슷한 스타 수 검색
   d. 두 결과를 합치고 유사도 점수 계산
   e. 점수 높은 순으로 정렬, 소스 레포 제외
   f. Redis에 저장 (TTL: 43200초 = 12시간)
4. 응답 반환

성공 응답 (200):
{
  "success": true,
  "data": [
    {
      "repository": {
        "full_name": "langchain-ai/langchain",
        "description_ko": "LLM 기반 애플리케이션 개발 프레임워크",
        "language": "Python",
        "stars_count": 98000,
        "topics": ["ai", "llm", "python"],
        "html_url": "https://github.com/langchain-ai/langchain"
      },
      "similarity_score": 95,
      "matched_topics": ["ai", "llm"],
      "difference_note": "더 범용적이며 Python 중심, 에이전트 기능 지원"
    }
    // ... 최대 10개
  ]
}
```

### 2.5 `GET /api/search` — 통합 검색

```
경로:       /api/search
메서드:     GET

쿼리 파라미터:
┌──────────┬──────────┬──────────┬──────────────────────────┐
│ 파라미터  │ 타입     │ 기본값   │ 설명                     │
├──────────┼──────────┼──────────┼──────────────────────────┤
│ q        │ string   │ (필수)   │ 검색어 (한글/영어 모두)   │
│ language │ string   │ "all"    │ 언어 필터                │
│ page     │ number   │ 1        │ 페이지 번호              │
│ per_page │ number   │ 20       │ 한 페이지 결과 수         │
└──────────┴──────────┴──────────┴──────────────────────────┘

처리 흐름:
1. 검색어 유효성 검사 (빈 문자열 거부)
2. Redis 캐시 확인 (키: "search:{q}:{language}:{page}")
3. HIT → 즉시 반환
4. MISS:
   a. DB에서 description_ko, summary_ko, topics에 대해 LIKE 검색
   b. GitHub Search API로 검색
   c. 두 결과를 합치고 중복 제거
   d. Redis에 저장 (TTL: 1800초 = 30분)
5. 응답 반환

성공 응답 (200):
{
  "success": true,
  "data": [ /* TrendingRepository[] */ ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 20,
    "has_next": true
  }
}
```

### 2.6 `GET /api/cron/fetch-trending` — 크론잡: 트렌딩 수집

```
경로:       /api/cron/fetch-trending
메서드:     GET
트리거:     Vercel Cron (매 시간)
보안:       Authorization 헤더로 CRON_SECRET 검증

처리 흐름:
1. CRON_SECRET 검증 (일치하지 않으면 401)
2. 3개 기간(daily, weekly, monthly)에 대해 각각:
   a. GitHub Search API로 트렌딩 레포 30개 수집
   b. 각 레포를 repositories 테이블에 upsert
   c. trending_snapshots에 오늘의 스냅샷 저장
3. API 사용량 기록 (api_usage_log)
4. 완료 응답

보안 검증 코드:
if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

성공 응답 (200):
{
  "success": true,
  "message": "Trending data fetched successfully",
  "stats": {
    "daily": { "fetched": 30, "new": 5, "updated": 25 },
    "weekly": { "fetched": 30, "new": 3, "updated": 27 },
    "monthly": { "fetched": 30, "new": 1, "updated": 29 }
  }
}
```

### 2.7 `GET /api/cron/translate-new` — 크론잡: 신규 번역

```
경로:       /api/cron/translate-new
메서드:     GET
트리거:     Vercel Cron (매 3시간)
보안:       Authorization 헤더로 CRON_SECRET 검증

처리 흐름:
1. CRON_SECRET 검증
2. DB에서 description_ko가 NULL인 레포 최대 15개 조회
   (ORDER BY stars_count DESC — 인기 순으로 우선 번역)
3. 각 레포에 대해:
   a. Gemini API 사용량 확인 (80% 초과 시 중단)
   b. GitHub API로 README 가져오기
   c. Gemini API로 description 번역
   d. Gemini API로 README 번역
   e. Gemini API로 3줄 요약 생성
   f. DB 업데이트 (repositories + translation_cache)
   g. Redis 캐시 업데이트
4. API 사용량 기록
5. 완료 응답

성공 응답 (200):
{
  "success": true,
  "message": "Translation completed",
  "stats": {
    "translated": 12,
    "skipped": 3,
    "failed": 0,
    "gemini_usage": "35%"
  }
}
```

---

## 3. GitHub Search API 쿼리 레퍼런스

### 3.1 트렌딩 시뮬레이션 쿼리

```
일간 트렌딩 (전체 언어):
GET /search/repositories?q=created:>2026-04-17&sort=stars&order=desc&per_page=30

일간 트렌딩 (Python만):
GET /search/repositories?q=created:>2026-04-17+language:python&sort=stars&order=desc&per_page=30

주간 트렌딩:
GET /search/repositories?q=created:>2026-04-11&sort=stars&order=desc&per_page=30

월간 트렌딩 (가장 정확한 방식, pushed 기준):
GET /search/repositories?q=pushed:>2026-03-18+stars:>100&sort=stars&order=desc&per_page=30

대안 방식 (stars 범위로 필터):
GET /search/repositories?q=stars:>1000+pushed:>2026-04-11&sort=updated&order=desc&per_page=30
```

### 3.2 유사 레포 검색 쿼리

```
토픽으로 검색:
GET /search/repositories?q=topic:ai+topic:typescript&sort=stars&order=desc&per_page=15

같은 언어 + 비슷한 스타:
GET /search/repositories?q=language:typescript+stars:10000..100000&sort=stars&order=desc&per_page=15
```

### 3.3 인증 헤더

```
모든 GitHub API 요청에 아래 헤더를 포함:

Authorization: Bearer ghp_xxxxxxxxxxxx
Accept: application/vnd.github.v3+json
X-GitHub-Api-Version: 2022-11-28
```

---

## 4. Redis 캐시 키 설계

```
키 패턴                                   TTL(초)    용도
─────────────────────────────────────────────────────────────
trending:{period}:{language}:{page}       3600       트렌딩 목록
repo:{owner}/{name}                       86400      레포 상세
readme_ko:{owner}/{name}                  86400      한글 README
summary_ko:{owner}/{name}                 86400      3줄 요약
desc_ko:{owner}/{name}                    86400      한글 설명
similar:{owner}/{name}                    43200      유사 레포
search:{query}:{language}:{page}          1800       검색 결과
api_usage:gemini:{date}                   86400      Gemini 사용량
api_usage:github:{date}                   3600       GitHub 사용량
```

---

## 5. Gemini 프롬프트 정의

### 5.1 README 번역 프롬프트

```
당신은 전문 기술 번역가입니다. 다음 GitHub 레포지토리의 README 마크다운을 한국어로 번역하세요.

엄격한 규칙:
1. 마크다운 문법(#, ##, *, **, ```, [], (), !, - 등)은 절대 변경하지 마세요. 그대로 유지하세요.
2. 코드 블록(``` ```) 내부의 코드는 절대 번역하지 마세요. 코드는 원본 그대로 유지하세요.
3. 인라인 코드(`code`) 내부도 번역하지 마세요.
4. URL, 링크 경로는 변경하지 마세요.
5. 기술 용어는 한글(영어) 형태로 병기하세요. 예: "의존성(dependencies)"
6. 자연스러운 한국어로 의역하세요. 직역 금지.
7. npm install, pip install 등 설치 명령어는 원본 유지.
8. 변수명, 함수명, 클래스명 등 코드 식별자는 번역하지 마세요.

README 원문:
---
{readme_content}
---
```

### 5.2 3줄 요약 프롬프트

```
당신은 한국 개발자를 위한 기술 큐레이터입니다.
다음 GitHub 레포지토리 정보를 바탕으로 정확히 3줄의 한국어 요약을 작성하세요.

형식 (줄바꿈으로 구분):
1줄: 이 프로젝트가 무엇인지 한 문장으로 설명
2줄: 핵심 기능이나 특징 한 문장
3줄: 어떤 개발자에게 유용한지 한 문장

규칙:
- 각 줄은 반드시 한 문장으로, 30자~60자 사이
- "~입니다", "~합니다" 체 사용
- 기술 용어는 원어 유지 (React, TypeScript 등)
- 과장하지 말고 사실만 기반으로 작성

레포 이름: {full_name}
설명: {description}
주 언어: {language}
스타 수: {stars_count}
토픽: {topics}
README 앞부분 (500자):
{readme_first_500_chars}
```

### 5.3 설명 번역 프롬프트

```
다음 GitHub 레포지토리 설명을 자연스러운 한국어로 번역하세요.
기술 용어는 원어 유지. 한 문장으로 간결하게.

원문: {description}
```

---

*이 문서의 모든 API와 DB 스키마를 구현하면 백엔드가 완성됩니다.*
*다음 문서(04_FRONTEND_SPECIFICATION.md)에서 프론트엔드 컴포넌트를 상세히 정의합니다.*
