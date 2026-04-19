import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * Tailwind CSS 클래스들을 조건부로 병합합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 날짜를 상대적 시간(예: "2시간 전")으로 포맷팅합니다.
 */
export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
  } catch (e) {
    return dateString;
  }
}

/**
 * 날짜를 "YYYY-MM-DD" 형식으로 포맷팅합니다.
 */
export function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'yyyy-MM-dd', { locale: ko });
  } catch (e) {
    return dateString;
  }
}

/**
 * 1000 이상의 숫자를 K, M 단위로 변환합니다.
 */
export function formatCompactNumber(number: number): string {
  if (number < 1000) return number.toString();
  if (number < 1000000) return (number / 1000).toFixed(1) + 'K';
  return (number / 1000000).toFixed(1) + 'M';
}

/**
 * 한국식 숫자 단위 변환 (만, 억)
 * 360000 → 36만 / 1790 → 1,790명 / 32200 → 3.2만
 */
export function formatKoreanNumber(number: number): string {
  if (number < 1000) return number.toLocaleString('ko-KR');
  if (number < 10000) return `${(number / 1000).toFixed(1).replace(/\.0$/, '')}천`;
  if (number < 100000000) {
    const man = number / 10000;
    if (man >= 1000) return `${(man / 10000).toFixed(1).replace(/\.0$/, '')}억`;
    return `${man >= 100 ? Math.round(man) : man.toFixed(1).replace(/\.0$/, '')}만`;
  }
  return `${(number / 100000000).toFixed(1).replace(/\.0$/, '')}억`;
}

/**
 * 커밋 수 한국식 포맷
 * 32200 → "3.2만 커밋"
 */
export function formatKoreanCommits(number: number): string {
  return `${formatKoreanNumber(number)} 커밋`;
}

/**
 * 기여자 수 한국식 포맷
 * 1790 → "1,790명"
 */
export function formatKoreanContributors(number: number): string {
  return `${number.toLocaleString('ko-KR')}명`;
}

/**
 * 일반 텍스트 UI에 노출되지 않도록 마크다운 문법을 깔끔한 평문으로 정리합니다.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italic
    .replace(/__(.*?)__/g, '$1')     // bold
    .replace(/_(.*?)_/g, '$1')       // italic
    .replace(/~~(.*?)~~/g, '$1')     // strikethrough
    .replace(/`(.*?)`/g, '$1')       // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links
    .replace(/!\[(.*?)\]\(.*?\)/g, '')       // images 
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/>\s+/g, '')            // blockquotes
    .trim();
}
