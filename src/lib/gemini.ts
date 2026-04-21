import translateGoogle from 'translate-google';
import { translate as translateBing } from 'bing-translate-api';

/**
 * 프로덕션 번역 모듈 (Bing/Google 무료 기계번역 전용)
 *
 * ⚠️ Gemini API는 프로덕션에서 사용하지 않습니다.
 *    AI 요약(summarizeReadme)은 로컬 스크립트(scripts/daily-summary.ts)에서만 실행합니다.
 *
 * 번역 우선순위:
 *   1차: Bing Translate (무료, 정밀)
 *   2차: Google Translate (무료, 안정적)
 *   3차: 영문 원본 반환 (모두 실패 시)
 */

/**
 * README 마크다운 텍스트에서 번역 불필요 요소를 제거하고 순수 텍스트를 추출합니다.
 */
export function cleanReadmeForTranslation(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거 (번역 불필요)
    .replace(/<[^>]+>/g, '') // 모든 HTML 태그 적극 제거 (배지, img 태그 등)
    .replace(/!\[.*?\]\(.*?\)/g, '') // 모든 마크다운 이미지 강제 제거
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크의 URL은 버리고 텍스트만 추출
    .replace(/https?:\/\/[^\s)]+/g, '') // 덧붙은 평문 URL 쓰레기값 제거
    .replace(/\n{3,}/g, '\n\n') // 다중 공백 압축
    .trim();
}

/**
 * Bing → Google 순서로 번역을 시도합니다.
 * 모두 실패 시 영문 원본을 반환합니다.
 */
async function callTranslation(text: string): Promise<string> {
  // 1. Bing Translate (초정밀 기계 번역, 평생 무료)
  try {
    const bingRes = await translateBing(text, null, 'ko');
    if (bingRes?.translation) {
      return bingRes.translation;
    }
  } catch (err) {
    console.warn('[Bing Translate Failed], trying Google');
  }

  // 2. Google Translate (가장 안정적인 기계 번역, 평생 무료)
  try {
    const googleRes = await translateGoogle(text, { to: 'ko' });
    return googleRes;
  } catch (error) {
    console.error('[All Translation Engines Failed]');
    // 최종 실패 시 영문 원본 반환
    return text;
  }
}

/**
 * GitHub Repository Description을 한국어로 번역 (짧은 한 줄 설명용)
 */
export async function translateDescription(text: string): Promise<string | null> {
  if (!text || text.trim() === '') return null;
  return await callTranslation(text);
}

/**
 * README 전체(앞부분 1500자) 한국어 번역
 */
export async function translateReadme(readmeText: string): Promise<string | null> {
  const cleaned = cleanReadmeForTranslation(readmeText);
  const truncated = cleaned.substring(0, 1500); 
  
  if (truncated.trim().length < 30) return null;

  const translatedText = await callTranslation(truncated);
  if (!translatedText) return null;

  return translatedText + '\n\n---\n\n> 🚀 **가벼운 미리보기 모드**: 페이지 속도를 위해 핵심 도입부만 번역되었습니다. 전체 코드는 원문 GitHub에서 확인하세요!';
}
