import { ProgrammingLanguage } from '@/types';

// 트렌딩 기간 캐시 유효시간 (초 단위)
export const CACHE_TTL = {
  DAILY: 3600,       // 일간: 1시간
  WEEKLY: 21600,     // 주간: 6시간
  MONTHLY: 43200,    // 월간: 12시간
  SIMILAR: 86400,    // 유사 레포: 24시간
  README: 2592000,   // 번역된 README: 30일
};

// 필터링 가능한 언어 목록 및 아이템 색상 매핑
export const LANGUAGE_COLORS: Record<string, string> = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f1e05a',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Swift': '#F05138',
  'Kotlin': '#A97BFF',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'C': '#555555',
  'C#': '#178600',
  'Shell': '#89e051',
  'Jupyter Notebook': '#DA5B0B'
};

// 프론트엔드 언어 필터 상수
export const FILTERABLE_LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'all', label: '전체 언어' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
];
