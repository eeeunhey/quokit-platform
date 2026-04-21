/**
 * 로컬 전용 일일 요약 스크립트
 *
 * 사용법:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/daily-summary.ts
 *   또는
 *   npx tsx scripts/daily-summary.ts
 *
 * 동작:
 *   1. DB에서 summary_ko가 없는 레포지토리를 조회합니다.
 *   2. GitHub API로 README를 가져옵니다.
 *   3. Gemini API로 핵심 1문장 요약을 생성합니다.
 *   4. DB에 summary_ko를 저장합니다.
 *
 * 이 스크립트는 프로덕션 서버에서 실행되지 않습니다.
 * 로컬 PC에서 하루에 한 번 수동으로 실행하세요.
 *
 * 필수 환경변수 (.env 파일에 설정):
 *   - DATABASE_URL: MySQL 연결 문자열
 *   - GEMINI_API_KEY: Google Gemini API 키
 *   - GITHUB_TOKEN: GitHub Personal Access Token (선택, README 가져오기용)
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

const prisma = new PrismaClient();

// Gemini 초기화
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY가 .env에 설정되지 않았습니다.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Rate limit 방지용 딜레이
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GitHub에서 README를 가져옵니다.
 */
async function fetchReadme(owner: string, name: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, { headers });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.content) return null;

    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * README에서 번역/요약에 불필요한 요소를 제거합니다.
 */
function cleanReadme(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Gemini AI로 README 핵심 1문장 요약을 생성합니다.
 */
async function summarizeWithGemini(readmeText: string): Promise<string | null> {
  const cleaned = cleanReadme(readmeText).substring(0, 1500);
  if (cleaned.length < 20) return null;

  const prompt = `
당신은 한국의 시니어 오픈소스 개발자이자 기술 블로거입니다.

[작업]
다음 레포지토리의 리드미(README) 서두를 읽고, **이 레포지토리가 정확히 어떤 문제를 해결하는 툴/라이브러리인지** 아주 명확하고 간결한 핵심 1문장으로 요약해 주세요.

[원문]
${cleaned}

[제약사항]
딱 1문장으로만 답하고, 불릿기호(-) 없이 문자 그대로만 반환하세요.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    console.warn(`  ⚠️ Gemini 오류: ${error.message}`);
    return null;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 일일 요약 스크립트 시작\n');
  console.log(`📅 실행 시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log('─'.repeat(50));

  // summary_ko가 null인 레포 조회 (최대 30개씩 처리)
  const pendingRepos = await prisma.repository.findMany({
    where: { summaryKo: null },
    orderBy: { starsCount: 'desc' },
    take: 30,
  });

  if (pendingRepos.length === 0) {
    console.log('\n✅ 모든 레포가 이미 요약 완료되었습니다!');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📋 요약이 필요한 레포: ${pendingRepos.length}개\n`);

  let successCount = 0;
  let failCount = 0;

  for (const repo of pendingRepos) {
    const [owner, name] = repo.fullName.split('/');
    process.stdout.write(`  ${repo.fullName} ... `);

    try {
      // 1. GitHub에서 README 가져오기
      const readme = await fetchReadme(owner, name);
      if (!readme) {
        console.log('⏭️ README 없음');
        failCount++;
        await delay(1000);
        continue;
      }

      // 2. Gemini로 요약 생성
      const summary = await summarizeWithGemini(readme);
      if (!summary) {
        console.log('⏭️ 요약 생성 실패');
        failCount++;
        await delay(2000);
        continue;
      }

      // 3. DB에 저장
      await prisma.repository.update({
        where: { id: repo.id },
        data: { summaryKo: summary },
      });

      console.log(`✅ "${summary.substring(0, 40)}..."`);
      successCount++;

      // Gemini Rate limit 방지: 2초 대기
      await delay(2000);

    } catch (error: any) {
      console.log(`❌ 오류: ${error.message}`);
      failCount++;
      await delay(2000);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`📊 결과: ✅ ${successCount}개 성공 / ❌ ${failCount}개 실패`);
  console.log(`📊 남은 요약 필요 레포: ${pendingRepos.length - successCount - failCount}개`);

  await prisma.$disconnect();
  console.log('\n🏁 스크립트 종료');
}

main().catch((error) => {
  console.error('💥 치명적 오류:', error);
  prisma.$disconnect();
  process.exit(1);
});
