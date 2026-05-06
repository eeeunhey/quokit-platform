<div align="center">

# 🌿 QUOKIT (쿼킷)

**A GitHub trending curation platform designed for Korean developers.** <br>
*QUOKIT automatically fetches global trending repositories, translates their READMEs into Korean using an AI-driven multi-layer translation pipeline, and provides a clean UI to lower the barrier to open-source exploration.*

<br>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Upstash%20Redis-00E676?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
</p>

<!-- TODO: 나중에 여기에 실제 서비스 캡처 이미지(가로로 긴 비율 추천)를 삽입하세요 -->
<!-- 예시: <img src="이미지링크" alt="QUOKIT 대시보드 스크린샷" width="800" /> -->

<br>

<!-- TODO: 실제 배포된 사이트 주소로 교체하세요 -->
<a href="https://당신의-실제-서비스-주소.com" target="_blank">
  <img src="https://img.shields.io/badge/🚀_서비스_바로가기_Live_Demo-4F46E5?style=for-the-badge" alt="Live Demo" />
</a>

</div>

<br>

---

## 📖 프로젝트 소개 (About)

**QUOKIT은 넓고 방대한 GitHub 생태계에서 누구나 부담 없이 새로운 오픈소스를 발견할 수 있도록 돕는 큐레이션 플랫폼입니다.**

전 세계 개발자들이 주목하는 인기 프로젝트들을 실시간으로 제공합니다. 거창한 리서치 과정이나 깊은 기술 분석이 없어도 됩니다. 텍스트 위주의 길고 복잡한 원문이 주는 진입 장벽을 낮춰, **누구나 호기심만으로 가볍게 최신 기술 흐름을 둘러볼 수 있도록** 기획되었습니다.

> **QUOKIT은 물리학의 ‘쿼크(quark)’에서 영감을 받은 이름입니다.** <br>
> 쿼크가 아주 작지만 중요한 기본 단위이듯, QUOKIT도 하나의 레포를 만나는 경험이 더 넓은 GitHub 관심과 탐색의 시작이 될 수 있다는 의미를 담고 있습니다.

---

## 🚀 아키텍처 및 기술적 강점 (Technical Highlights)

본 프로젝트는 단순한 API 호출을 넘어, **데이터 수집-가공-캐싱-서빙의 전체 파이프라인을 최적화**하는 데 집중했습니다.

### 1. 🤖 3단계 Fallback 번역 파이프라인
영문 README를 한국어로 자연스럽게 제공하기 위해 견고한 번역 체인을 구축했습니다.
- **1차 (HuggingFace OPUS-MT):** 영→한 기술 문서 번역에 특화된 오픈소스 AI 모델 활용 (문장 단위 분할 배치 처리)
- **2차 & 3차 (Bing/Google API):** 1차 모델 로딩(Cold Start) 지연이나 Rate Limit 발생 시 즉시 우회하여 번역 중단을 방지

### 2. ⚡ Multi-Layer 캐싱 전략 (Redis & DB)
잦은 외부 API 호출로 인한 속도 저하를 막기 위해 **Upstash Redis**를 활용한 캐시 레이어를 도입했습니다.
- `Client ➜ Redis(Memory) ➜ Supabase(DB) ➜ GitHub/Translation API` 순으로 접근하여 응답 속도를 극대화했습니다.

### 3. 🕷️ GitHub API 한계 우회 스크래퍼
GitHub Search API로는 잡히지 않는 "실시간 급상승(Trending)" 레포지토리를 포착하기 위해, `cheerio`를 활용하여 `github.com/trending` HTML을 직접 파싱하는 커스텀 스크래퍼를 구현했습니다.

### 4. 🔄 Vercel Cron 기반 자동화 파이프라인
관리자의 개입 없이도 트렌딩 데이터가 매일 갱신되도록 4개의 크론잡(Cron Job)을 설계했습니다.
- 데이터 수집(`fetch-trending`) ➜ 번역 처리(`translate-new`) ➜ 오래된 캐시 정리(`cleanup`)

### 5. 🔍 주제 기반(Topic) 유사 레포 추천 알고리즘
현재 보고 있는 레포지토리의 토픽 교집합을 계산하여, 유사도를 백분율(%)로 분석하고 연관성이 높은 다른 프로젝트를 동적으로 추천합니다. (`similarity.ts`)

### 6. 🛡️ Proxy 기반 Admin 라우트 보안
관리자 전용 대시보드는 Next.js Proxy를 통해 보호됩니다. `Authorization` 헤더 검증 및 세션 쿠키 기반 인증을 적용했으며, 크롤러의 인덱싱(`noindex, nofollow`)을 차단했습니다.

---

## 🎯 핵심 경험 포인트

### 1. 직관적인 트렌딩 오픈소스 피드 (Easy Discovery)
오늘, 이번 주, 이번 달 등 기간별 트렌드를 피드 넘기듯 가볍게 살피며 새로운 개발 관심사를 넓혀보세요.

### 2. 가독성을 극대화한 UI (Quick Scan & Start)
복잡한 기술 문서를 텍스트로 나열하지 않고, 핵심 정보만 추려 카드 형태로 깔끔하게 배치했습니다. 이 저장소가 무얼 하는 곳인지 화면을 열자마자 직관적으로 판단할 수 있습니다.

### 3. 트렌딩 개발자 네트워크 (Live Developer Network)
화려한 코드 이면의 트렌드를 주도하는 인기 개발자들과 만날 수 있습니다. 실시간 API 연동을 통해 그들의 활동 현황과 훌륭한 저장소들을 살피며 생태계에 대한 폭넓은 호기심을 충족시켜 줍니다.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Recharts
- **Backend & Database:** Next.js API Routes, Supabase (PostgreSQL), Prisma ORM
- **Cache & Automation:** Upstash Redis, Vercel Cron
- **Integration:** GitHub REST API, Cheerio (Scraping), HuggingFace Inference API (OPUS-MT), Google/Bing Translate

---

*💡 이 레포지토리는 서비스의 아키텍처와 코드를 공유하기 위해 공개되었습니다. 현재는 서비스 고도화 및 안정적인 운영에 집중하고 있어, 별도의 로컬 실행 환경(Local Setup) 가이드는 제공하지 않습니다. 서비스 이용은 상단의 [🚀 서비스 바로가기] 링크를 통해 웹에서 즉시 경험해 보세요!*
