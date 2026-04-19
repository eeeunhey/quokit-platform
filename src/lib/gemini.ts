import translateGoogle from 'translate-google';
import { translate as translateBing } from 'bing-translate-api';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 초기화 (환경 변수에 키가 있을 때만 활성화)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

// 공통 프롬프트 컨텍스트
const SYSTEM_PROMPT = `
당신은 한국의 시니어 오픈소스 프론트엔드/백엔드 개발자이자 기술 블로거입니다.
다음 규칙을 엄격하게 지켜서 기술 문서/설명을 번역하세요:
1. 문체: 부드럽고 전문적인 '~합니다', '~해요' 어투 사용 (존댓말).
2. 직역 금지: 구글 번역기처럼 어색한 직역을 피하고, 한국 개발자들이 일상적으로 쓰는 자연스러운 문장으로 의역할 것. (예: "저장소가 잠금 해제되었습니다" -> "드디어 레포지토리가 공개되었습니다" 등)
3. 고유명사 유지: 프레임워크 이름, 언어(Java, Rust), CLI, UI, API, DB 등 기술 용어는 영어 원문을 유지하거나 자연스럽게 병기.
4. 마크다운 유지: 원본의 마크다운 서식(*bold*, 링크, 줄바꿈)은 절대 임의로 제거하거나 훼손하지 말 것.
`;

/**
 * README 마크다운 텍스트에서 번역 불필요 요소를 제거하고 순수 텍스트를 추출합니다.
 */
function cleanReadmeForTranslation(raw: string): string {
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
 * Gemini AI 무료 티어를 활용하여 번역을 수행합니다. 
 * 쿼터 오버(429) 또는 오류 발생 시, 100% 무료인 기존 translate-google 모듈로 우회(Fallback)합니다.
 */
async function callGeminiTranslation(prompt: string, fallbackText: string): Promise<string> {
  // 1. Gemini AI (모델 사용 불가 시 바로 무료 엔진으로 넘김)
  if (model) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.warn('[Gemini API Fallback] AI Limits reached or No Free Tier:', error.message);
    }
  }

  // 2. Fallback Layer 1: Bing Translate (초정밀 기계 번역, 평생 무료)
  try {
    const bingRes = await translateBing(fallbackText, null, 'ko');
    if (bingRes?.translation) {
      console.log('[Fallback] Translated using Bing API');
      return bingRes.translation;
    }
  } catch (err) {
    console.warn('[Bing Fallback Failed], trying Google');
  }

  // 3. Fallback Layer 2: Google Translate (가장 안정적인 기계 번역, 평생 무료)
  try {
    const googleRes = await translateGoogle(fallbackText, { to: 'ko' });
    console.log('[Fallback] Translated using Google API');
    return googleRes;
  } catch (error) {
    console.error('[All Translation Engines Failed]');
    // 최종 실패 시 영문 원본 반환
    return fallbackText;
  }
}

/**
 * GitHub Repository Description을 한국어로 번역 (가장 자연스러운 제목/한 줄 설명용)
 */
export async function translateDescription(text: string): Promise<string | null> {
  if (!text || text.trim() === '') return null;
  
  const prompt = `
${SYSTEM_PROMPT}

[작업]
다음은 GitHub 레포지토리의 핵심 설명(Description/About)입니다. 짧고, 매력적이며, 자연스러운 한국어로 한 문장~두 문장으로 번역해주세요.

[원문]
${text}
`;
  return await callGeminiTranslation(prompt, text);
}

/**
 * README 요약본 3줄 
 */
export async function summarizeReadme(readmeText: string): Promise<string | null> {
  const cleanReadme = cleanReadmeForTranslation(readmeText).substring(0, 1500);
  if (cleanReadme.length < 20) return null;

  const prompt = `
${SYSTEM_PROMPT}

[작업]
다음 레포지토리의 리드미(README) 서두를 읽고, **이 레포지토리가 정확히 어떤 문제를 해결하는 툴/라이브러리인지** 아주 명확하고 간결한 핵심 1문장으로 요약해 주세요. 이 문장은 사용자가 카드를 보자마자 어떤 레포인지 단숨에 이해하게 돕는 "한국어 제목 역할(헤드라인)"을 할 것입니다.

[원문]
${cleanReadme}

[제약사항]
딱 1문장으로만 답하고, 불릿기호(-) 없이 문자 그대로만 반환하세요.
`;

  return await callGeminiTranslation(prompt, cleanReadme.slice(0, 100)); // fallbacks with first 100 char
}

/**
 * README 전체(실제론 앞부분 800자) 한국어 번역
 */
export async function translateReadme(readmeText: string): Promise<string | null> {
  const cleaned = cleanReadmeForTranslation(readmeText);
  const truncated = cleaned.substring(0, 1500); 
  
  if (truncated.trim().length < 30) return null;

  const prompt = `
${SYSTEM_PROMPT}

[작업]
다음 리드미 서두 원문을 개발자들이 읽기 편한 자연스러운 한국어로 번역해주세요. (최대 1000자)
이것은 모달 창에서 사용자에게 보여질 상세 프리뷰입니다. 오직 "텍스트" 위주로 깔끔하게 구성되어야 합니다. 이미지를 지칭하는 말이나 불필요한 부연설명을 넣지 마세요.

[원문]
${truncated}

`;

  const translatedText = await callGeminiTranslation(prompt, truncated);
  if (!translatedText) return null;

  return translatedText + '\n\n---\n\n> 🚀 **가벼운 미리보기 모드**: 페이지 속도를 위해 핵심 도입부만 AI로 번역되었습니다. 전체 코드는 원문 GitHub에서 확인하세요!';
}
