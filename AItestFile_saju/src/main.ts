/**
 * 관상 분석 RAG CLI 메인 모듈
 * MediaPipe 468 랜드마크 기반 분석
 * 
 * 사용법:
 *   node dist/main.js --file ./landmarks.json --query '성격 분석'
 *   node dist/main.js --metrics '{"face_ratio_wh": 0.78, ...}' --query '재물운'
 */

import * as fs from "fs";
import * as path from "path";
import { loadKnowledgeBase, searchChunks, formatContext } from "./rag";
import { callGmsApi } from "./gms";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  MediaPipeFaceData,
  FaceMetricsCalculated,
  calculateMetrics,
  formatMetricsForPrompt,
  summarizeMetricsForSearch,
} from "./metrics";
import { calculateExtendedMetrics } from "./metrics_extended";
import { extractColorData, formatColorDataForPrompt } from "./color";

/**
 * CLI 인자 파싱
 */
function parseArgs(): {
  metrics?: string;
  file?: string;
  image?: string;
  query?: string;
} {
  const args = process.argv.slice(2);
  const result: { metrics?: string; file?: string; image?: string; query?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--metrics" && args[i + 1]) {
      result.metrics = args[++i];
    } else if (args[i] === "--file" && args[i + 1]) {
      result.file = args[++i];
    } else if (args[i] === "--image" && args[i + 1]) {
      result.image = args[++i];
    } else if (args[i] === "--query" && args[i + 1]) {
      result.query = args[++i];
    }
  }

  return result;
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log("🔮 관상 분석 RAG CLI v2.0 (MediaPipe 468 랜드마크 지원)");
  console.log("━".repeat(55));

  try {
    const args = parseArgs();

    // 1. 메트릭 획득
    let calculatedMetrics: FaceMetricsCalculated | null = null;
    let metricsText: string;

    if (args.file) {
      // MediaPipe 랜드마크 파일에서 메트릭 계산
      if (!fs.existsSync(args.file)) {
        throw new Error(`❌ 파일을 찾을 수 없습니다: ${args.file}`);
      }

      try {
        const fileContent = fs.readFileSync(args.file, "utf-8");
        const data: MediaPipeFaceData = JSON.parse(fileContent);

        console.log(`📂 랜드마크 파일 로드: ${args.file}`);

        // MediaPipe 데이터에서 메트릭 계산
        calculatedMetrics = calculateMetrics(data);
        
        // 확장 메트릭 계산 (삼정/오악/조합표용)
        const extendedMetrics = calculateExtendedMetrics(calculatedMetrics, data);
        
        // 색상 데이터 추출 (이미지가 있으면)
        let colorDataText = "";
        if (args.image) {
          console.log(`🎨 이미지에서 색상 데이터 추출 중: ${args.image}`);
          const landmarks = data.faces?.[0]?.landmarks || data.landmarks || [];
          const colorData = await extractColorData(args.image, landmarks);
          colorDataText = "\n\n" + formatColorDataForPrompt(colorData);
        }
        
        metricsText = formatMetricsForPrompt(calculatedMetrics) + colorDataText;

        console.log(`📊 ${calculatedMetrics.raw_landmarks_count}개 랜드마크에서 메트릭 계산 완료`);
        console.log(`   - 얼굴 비율(W/H): ${calculatedMetrics.face_ratio_wh.toFixed(3)}`);
        console.log(`   - head_roll: ${calculatedMetrics.head_roll.toFixed(2)}° ${calculatedMetrics.head_roll_ok ? "✅" : "⚠️"}`);
        console.log(`   - 삼정: 상=${extendedMetrics.upper_section_label}, 중=${extendedMetrics.mid_section_label}, 하=${extendedMetrics.lower_section_label}`);
      } catch (err) {
        throw new Error(`❌ 파일 파싱/계산 실패: ${args.file}\n   ${err}`);
      }
    } else if (args.metrics) {
      // 직접 입력된 메트릭 JSON
      try {
        const rawMetrics = JSON.parse(args.metrics);
        console.log("📊 직접 입력 메트릭 파싱 완료");

        // 간단한 메트릭 텍스트 생성
        metricsText = "## 얼굴 측정 데이터 (직접 입력)\n\n";
        for (const [key, value] of Object.entries(rawMetrics)) {
          if (typeof value === "number") {
            metricsText += `- **${key}**: ${value}\n`;
          }
        }
      } catch {
        throw new Error(
          "❌ --metrics JSON 파싱 실패. 올바른 JSON 형식인지 확인하세요."
        );
      }
    } else {
      console.log("\n사용법:");
      console.log("  node dist/main.js --file ./landmarks.json [--image ./photo.jpg] [--query '질문']");
      console.log("  node dist/main.js --metrics '{\"face_ratio_wh\": 0.78}' [--query '질문']");
      console.log("\n옵션:");
      console.log("  --file    MediaPipe 468 랜드마크 JSON 파일 경로");
      console.log("  --image   원본 이미지 파일 (색상 분석용, 선택)");
      console.log("  --metrics 직접 입력할 메트릭 JSON 문자열");
      console.log("  --query   추가 질문 (선택)");
      process.exit(1);
    }

    // 2. RAG 검색
    const knowledgePath = path.join(process.cwd(), "knowledge");
    const chunks = loadKnowledgeBase(knowledgePath);

    // 검색 쿼리 결정: --query > 메트릭 요약
    let searchQuery: string;
    if (args.query) {
      searchQuery = args.query;
    } else if (calculatedMetrics) {
      searchQuery = summarizeMetricsForSearch(calculatedMetrics);
    } else {
      searchQuery = "관상 분석 성격 재물운 직업운 애정운 건강운";
    }

    console.log(`🔍 검색 쿼리: "${searchQuery.slice(0, 50)}..."`);

    const relevantChunks = searchChunks(chunks, searchQuery, 5);
    console.log(`📑 ${relevantChunks.length}개의 관련 문서 찾음`);

    const context = formatContext(relevantChunks);

    // 3. 프롬프트 생성
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(metricsText, args.query);

    // 4. API 호출
    const result = await callGmsApi(systemPrompt, userPrompt);

    // 5. 결과 출력
    console.log("\n" + "═".repeat(55));
    console.log("📜 관상 분석 결과");
    console.log("═".repeat(55) + "\n");
    console.log(result);
  } catch (error) {
    if (error instanceof Error) {
      console.error("\n" + error.message);
    } else {
      console.error("\n❌ 알 수 없는 오류가 발생했습니다.");
    }
    process.exit(1);
  }
}

main();
