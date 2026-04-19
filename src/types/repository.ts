export interface LanguageStat {
  name: string;      // e.g., "TypeScript"
  size: number;      // 바이트 수
  percentage: number;// 0~100 (이름/전체크기)
}

export interface Repository {
  id: number;
  github_id: number;
  full_name: string;        // 예: "vercel/ai"
  name: string;             // 예: "ai"
  owner_login: string;      // 예: "vercel"
  owner_avatar_url: string; 
  description: string | null;
  description_ko: string | null;     // AI 한글 번역 설명
  summary_ko: string | null;         // AI 3줄 요약 설명
  html_url: string;
  homepage: string | null;
  language: string | null;           // 주 사용 언어
  topics: string[];                  // GitHub 토픽
  stars_count: number;
  forks_count: number;
  issues_count: number;
  open_graph_image_url: string | null;
  last_fetched_at: string;           // ISO 날짜 문자열
  created_at: string;                // ISO 날짜 문자열
}

export interface TrendingRepository extends Repository {
  rank: number;
  gained_stars: number; // 선택된 기간(일/주/월) 동안 얻은 스타 수
}

export interface SimilarRepository {
  id: number;
  github_id: number;
  full_name: string;
  description: string | null;
  description_ko: string | null;
  stars_count: number;
  language: string | null;
  similarity_score: number; // 0~100 (100% 형태)
  matched_topics: string[];
}
