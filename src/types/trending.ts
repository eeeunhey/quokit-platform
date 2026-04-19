export type TrendingPeriod = 'daily' | 'weekly' | 'monthly';

// 지원하는 언어 필터 목록 (자주 쓰이는 언어 + 전체)
export type ProgrammingLanguage = 
  | 'all'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'c++'
  | 'go'
  | 'rust'
  | 'swift'
  | 'kotlin'
  | 'php'
  | 'ruby';

export interface TrendingFilters {
  period: TrendingPeriod;
  language: ProgrammingLanguage;
  page: number;      // 기본값 1
  per_page: number;  // 기본값 20
}

export interface TrendingSnapshot {
  id: number;
  period: TrendingPeriod;
  language: string; // 'all' 또는 특정 언어
  snapshot_date: string; // ISO 날짜 문자열
  repo_id: number; // repositories 테이블의 FK
  current_rank: number;
  gained_stars: number;
  created_at: string;
}
