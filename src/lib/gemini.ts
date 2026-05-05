import translateGoogle from 'translate-google';
import { translate as translateBing } from 'bing-translate-api';

/**
 * 프로덕션 번역 모듈 — 3단계 Fallback 체인
 *
 * 번역 우선순위:
 *   1차: Helsinki-NLP/opus-mt-tc-big-en-ko (Hugging Face Inference API, 무료, 고품질)
 *   2차: Bing Translate (무료, 안정적)
 *   3차: Google Translate (무료, 최후 보루)
 *   4차: 영문 원본 반환 (모두 실패 시)
 *
 * OPUS-MT 특징:
 *   - 영→한 전용 오픈소스 번역 모델 (Apache 2.0 라이선스)
 *   - 기술 문서 번역 품질이 일반 기계번역보다 자연스러움
 *   - Hugging Face 무료 Inference API로 호출 (시간당 수백 요청 가능)
 *   - 긴 텍스트는 문장 단위로 분할하여 번역 품질 극대화
 */

// ──────────────────────────────────────────────
// Hugging Face 설정
// ──────────────────────────────────────────────
const HF_MODEL = 'Helsinki-NLP/opus-mt-tc-big-en-ko';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || ''; // 선택: 토큰이 있으면 Rate Limit 완화

/**
 * 텍스트를 문장 단위로 분할합니다.
 * OPUS-MT는 짧은 입력일수록 번역 품질이 높으므로, 긴 텍스트를 분할하여 번역합니다.
 */
function splitIntoSentences(text: string): string[] {
  // 1. 줄바꿈 기준 1차 분할
  const lines = text.split(/\n+/).filter(l => l.trim().length > 0);

  const sentences: string[] = [];
  for (const line of lines) {
    // 2. 마크다운 헤딩은 그대로 유지 (# 제목)
    if (/^#{1,6}\s/.test(line.trim())) {
      sentences.push(line.trim());
      continue;
    }
    // 3. 문장 단위 분할 (. ! ? 뒤에 공백이나 줄 끝)
    const parts = line.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    // 너무 짧은 조각은 합치기 (최소 15자)
    let buffer = '';
    for (const part of parts) {
      buffer += (buffer ? ' ' : '') + part;
      if (buffer.length >= 15) {
        sentences.push(buffer);
        buffer = '';
      }
    }
    if (buffer) sentences.push(buffer);
  }

  return sentences;
}

/**
 * OPUS-MT 모델을 사용하여 영→한 번역합니다 (Hugging Face Inference API).
 * - 무료, 오픈소스 (Apache 2.0)
 * - 영→한 전용 모델이라 기술 문맥 번역 품질이 높음
 */
async function callOpusMT(text: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (HF_TOKEN) {
      headers['Authorization'] = `Bearer ${HF_TOKEN}`;
    }

    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: text }),
      signal: AbortSignal.timeout(15000), // 15초 타임아웃
    });

    if (!res.ok) {
      // 503 = 모델 로딩 중 (cold start), 429 = Rate Limit 초과
      const status = res.status;
      if (status === 503) {
        console.warn('[OPUS-MT] 모델 로딩 중 (cold start), fallback으로 전환');
      } else if (status === 429) {
        console.warn('[OPUS-MT] Rate Limit 초과, fallback으로 전환');
      } else {
        console.warn(`[OPUS-MT] HTTP ${status} 오류, fallback으로 전환`);
      }
      return null;
    }

    const json = await res.json();

    // Hugging Face 응답 형식: [{ translation_text: "..." }]
    if (Array.isArray(json) && json[0]?.translation_text) {
      return json[0].translation_text;
    }

    // 에러 응답 (모델 로딩 중 등)
    if (json?.error) {
      console.warn(`[OPUS-MT] API 에러: ${json.error}`);
      return null;
    }

    return null;
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      console.warn('[OPUS-MT] 타임아웃 (15초), fallback으로 전환');
    } else {
      console.warn(`[OPUS-MT] 네트워크 오류: ${err?.message || err}`);
    }
    return null;
  }
}

/**
 * OPUS-MT로 긴 텍스트를 문장 분할 후 배치 번역합니다.
 * 각 문장을 개별 번역하여 품질을 높이고, 결과를 합칩니다.
 */
async function callOpusMTBatch(text: string): Promise<string | null> {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return null;

  // 문장이 1개면 바로 번역
  if (sentences.length === 1) {
    return await callOpusMT(sentences[0]);
  }

  // 여러 문장을 순차 번역 (Hugging Face 무료 API Rate Limit 보호)
  const translated: string[] = [];
  for (const sentence of sentences) {
    // 매우 짧은 조각(기호만 남은 것)은 그대로 추가
    if (sentence.trim().length < 5) {
      translated.push(sentence);
      continue;
    }

    const result = await callOpusMT(sentence);
    if (result) {
      translated.push(result);
    } else {
      // OPUS-MT 실패 시 해당 문장은 원문 유지하고, 나머지는 fallback 전환
      // 첫 실패 시 전체를 fallback으로 넘기는 것이 효율적
      return null;
    }

    // Rate Limit 방지: 문장 간 짧은 딜레이 (200ms)
    await new Promise(r => setTimeout(r, 200));
  }

  return translated.join('\n');
}

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
 * 3단계 Fallback 체인: OPUS-MT → Bing → Google → 원문
 *
 * 짧은 텍스트(description 등)는 단일 호출로 처리합니다.
 */
async function callTranslation(text: string): Promise<string> {
  // 1차: OPUS-MT (Hugging Face, 무료 오픈소스)
  const opusResult = await callOpusMT(text);
  if (opusResult) {
    return opusResult;
  }

  // 2차: Bing Translate (무료 기계 번역)
  try {
    const bingRes = await translateBing(text, null, 'ko');
    if (bingRes?.translation) {
      return bingRes.translation;
    }
  } catch (err) {
    console.warn('[Bing Translate Failed], trying Google');
  }

  // 3차: Google Translate (무료, 최후 보루)
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
 * 3단계 Fallback 체인 — 긴 텍스트용 (README 등)
 *
 * OPUS-MT는 문장 분할 배치 번역으로 품질을 극대화합니다.
 * 실패 시 Bing/Google 단일 호출로 전체 텍스트를 번역합니다.
 */
async function callTranslationLong(text: string): Promise<string> {
  // 1차: OPUS-MT 문장 분할 배치 번역 (고품질)
  const opusResult = await callOpusMTBatch(text);
  if (opusResult) {
    return opusResult;
  }

  // 2차: Bing Translate (전체 텍스트 한 번에)
  try {
    const bingRes = await translateBing(text, null, 'ko');
    if (bingRes?.translation) {
      return bingRes.translation;
    }
  } catch (err) {
    console.warn('[Bing Translate Long Failed], trying Google');
  }

  // 3차: Google Translate (전체 텍스트 한 번에)
  try {
    const googleRes = await translateGoogle(text, { to: 'ko' });
    return googleRes;
  } catch (error) {
    console.error('[All Translation Engines Failed (Long)]');
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
 *
 * OPUS-MT 사용 시 문장 단위로 분할하여 번역 품질을 극대화합니다.
 */
export async function translateReadme(readmeText: string): Promise<string | null> {
  const cleaned = cleanReadmeForTranslation(readmeText);
  const truncated = cleaned.substring(0, 1500); 
  
  if (truncated.trim().length < 30) return null;

  const translatedText = await callTranslationLong(truncated);
  if (!translatedText) return null;

  return translatedText + '\n\n---\n\n> ⚡ **요약 번역 제공**: 프로젝트의 빠른 파악을 위해 README의 핵심 내용만 요약 번역되었습니다. 상세한 원문은 GitHub에서 확인하실 수 있습니다.';
}
