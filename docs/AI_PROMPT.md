# 🚀 GitTrend Korea — AI 구현 의뢰 마스터 프롬프트

> **이 파일을 다른 AI에게 전달하세요. 이 프롬프트와 함께 같은 폴더의 문서들을 참고하여 구현을 요청합니다.**

---

## 다른 AI에게 보내는 프롬프트 (복사/붙여넣기용)

아래 내용을 다른 AI에게 붙여넣으세요:

---

### 프롬프트 시작 ▼

```
너는 시니어 풀스택 개발자이다.
나는 "GitTrend Korea (깃트렌드 코리아)" 라는 웹 프로젝트를 만들고 싶다.
GitHub에서 가장 핫한(트렌딩) 레포지토리를 한국어로 번역해서 보여주고,
유사 레포를 추천하는 사이트이다.

이 프로젝트의 완전한 기획서와 구현 명세서가 docs/ 폴더에 있다.
아래 6개 문서를 모두 읽고, 문서의 지시를 정확히 따라 구현하라.

문서 목록 (읽는 순서):
1. docs/00_PROJECT_PROPOSAL.md — 프로젝트 비전과 기능 요약
2. docs/01_FREE_INFRASTRUCTURE.md — 100% 무료 인프라 전략
3. docs/02_IMPLEMENTATION_BLUEPRINT.md — 파일 구조, 타입, 설정, 디자인 시스템, 라이브러리 명세
4. docs/03_API_AND_DATABASE.md — DB 스키마(SQL), 모든 API 명세, Gemini 프롬프트
5. docs/04_FRONTEND_SPECIFICATION.md — 모든 페이지 레이아웃, 모든 컴포넌트 Props/스타일/동작
6. docs/05_STEP_BY_STEP_GUIDE.md — 22단계 구현 순서 (이 순서를 반드시 따라라)

구현 규칙:
1. 05_STEP_BY_STEP_GUIDE.md의 Step 1~22를 순서대로 구현하라.
2. 기술 스택을 변경하지 마라 (Next.js 15, TypeScript, Tailwind, Supabase, Upstash, Gemini).
3. 파일 구조를 02_IMPLEMENTATION_BLUEPRINT.md의 구조와 동일하게 만들어라.
4. 모든 외부 API 호출은 반드시 try-catch + 캐싱을 적용하라.
5. UI는 다크 모드 기본이며, 한국어를 우선으로 표시하라.
6. 모든 컴포넌트는 04_FRONTEND_SPECIFICATION.md의 명세를 정확히 따라라.
7. DB SQL은 03_API_AND_DATABASE.md의 스키마를 그대로 사용하라.
8. Gemini 번역 프롬프트는 03_API_AND_DATABASE.md의 정의를 정확히 사용하라.
9. 비용은 $0이어야 한다. 유료 서비스를 사용하지 마라.
10. 각 단계를 완료할 때마다 해당 단계의 체크리스트를 확인해달라.

시작하라. Step 1부터 순서대로 구현하라.
```

### 프롬프트 끝 ▲

---

## 📁 문서 구조

```
gittrend-korea/
└── docs/
    ├── 00_PROJECT_PROPOSAL.md          ← 왜 만드는지 (비전)
    ├── 01_FREE_INFRASTRUCTURE.md       ← 무료 전략
    ├── 02_IMPLEMENTATION_BLUEPRINT.md  ← 어떻게 만드는지 (설계)
    ├── 03_API_AND_DATABASE.md          ← 백엔드 상세
    ├── 04_FRONTEND_SPECIFICATION.md    ← 프론트엔드 상세
    ├── 05_STEP_BY_STEP_GUIDE.md        ← 만드는 순서
    └── AI_PROMPT.md                    ← 이 파일 (프롬프트)
```

## 💡 팁: 문서가 너무 길어서 한 번에 전달이 어려울 경우

### 방법 A: 단계별 전달
```
1차: 00 + 01 + 02 를 전달하고 "이 문서를 읽고 프로젝트 구조를 이해하라"
2차: 03 을 전달하고 "이 DB 스키마와 API를 구현하라"  
3차: 04 를 전달하고 "이 컴포넌트들을 구현하라"
4차: 05 를 전달하고 "이 순서대로 통합하고 배포하라"
```

### 방법 B: 핵심만 전달
```
02 (블루프린트) + 05 (단계별 가이드) 만 먼저 전달
나머지는 구현 중 필요할 때 전달
```

### 방법 C: ZIP으로 전달
```
docs/ 폴더 전체를 ZIP으로 압축하여 업로드
→ "이 문서들을 모두 읽고 구현하라" 한 줄로 요청
```
