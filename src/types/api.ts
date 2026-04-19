export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    has_next?: boolean;
    is_cached?: boolean; // 캐시 적중 여부 로깅
  };
}

export interface ReadmeKoResponse {
  readme_ko: string;
  source: 'database' | 'redis' | 'gemini' | 'github';
  status: 'completed' | 'processing' | 'fallback_original';
}
