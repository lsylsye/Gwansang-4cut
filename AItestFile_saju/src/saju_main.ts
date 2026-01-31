/**
 * 사주 분석 RAG CLI 메인 모듈
 * 생년월일시 → 사주 계산 → 명리 분석 → RAG 검색 → LLM 해석
 * 
 * 사용법:
 *   node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남
 *   node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남 --name "홍길동" --query '재물운'
 *   node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남 --useRedis
 */

import * as fs from "fs";
import * as path from "path";
import { loadKnowledgeBase, searchChunks, formatContext, Chunk } from "./rag";
import { callGmsApi } from "./gms";
import { buildSajuSystemPrompt, buildSajuUserPrompt, summarizeSajuForSearch } from "./saju_prompt";
import { callServerSajuGenerate, checkServerHealth, getServerConfig, SajuRequest } from "./gms_server";
import { calculateSaju, formatSajuData, BirthInfo, SajuData } from "./saju_calculation";
import { calculateMyeongri, formatMyeongriData, MyeongriData } from "./saju_myeongri";
import { getRedisClient, closeRedisClient, checkRedisSearch } from "./redis_client";
import { searchByVector, searchHybrid, formatSearchContext, getIndexedDocCount } from "./redis_search";
import { StepLogger, Spinner, ProgressBar } from "./progress";

/**
 * CLI 인자 파싱
 */
function parseArgs(): {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  gender?: "남" | "여";
  name?: string;
  calendar?: "양력" | "음력";
  isLeapMonth?: boolean;
  query?: string;
  useRedis?: boolean;
} {
  const args = process.argv.slice(2);
  const result: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    gender?: "남" | "여";
    name?: string;
    calendar?: "양력" | "음력";
    isLeapMonth?: boolean;
    query?: string;
    useRedis?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--year" && args[i + 1]) {
      result.year = parseInt(args[++i], 10);
    } else if (args[i] === "--month" && args[i + 1]) {
      result.month = parseInt(args[++i], 10);
    } else if (args[i] === "--day" && args[i + 1]) {
      result.day = parseInt(args[++i], 10);
    } else if (args[i] === "--hour" && args[i + 1]) {
      result.hour = parseInt(args[++i], 10);
    } else if (args[i] === "--minute" && args[i + 1]) {
      result.minute = parseInt(args[++i], 10);
    } else if (args[i] === "--gender" && args[i + 1]) {
      const gender = args[++i];
      if (gender === "남" || gender === "여") {
        result.gender = gender;
      }
    } else if (args[i] === "--name" && args[i + 1]) {
      result.name = args[++i];
    } else if (args[i] === "--calendar" && args[i + 1]) {
      const cal = args[++i];
      if (cal === "양력" || cal === "음력") {
        result.calendar = cal;
      }
    } else if (args[i] === "--leap" || args[i] === "--isLeapMonth") {
      result.isLeapMonth = true;
    } else if (args[i] === "--query" && args[i + 1]) {
      result.query = args[++i];
    } else if (args[i] === "--redis" || args[i] === "--useRedis") {
      result.useRedis = true;
    }
  }

  return result;
}

/**
 * 생년월일시 입력 검증
 */
function validateBirthInfo(args: ReturnType<typeof parseArgs>): BirthInfo | null {
  if (!args.year || !args.month || !args.day || args.hour === undefined || !args.gender) {
    return null;
  }

  if (args.year < 1900 || args.year > 2100) {
    console.error("❌ 연도는 1900~2100 사이여야 합니다.");
    return null;
  }

  if (args.month < 1 || args.month > 12) {
    console.error("❌ 월은 1~12 사이여야 합니다.");
    return null;
  }

  if (args.day < 1 || args.day > 31) {
    console.error("❌ 일은 1~31 사이여야 합니다.");
    return null;
  }

  if (args.hour < 0 || args.hour > 23) {
    console.error("❌ 시간은 0~23 사이여야 합니다.");
    return null;
  }

  if (args.minute !== undefined && (args.minute < 0 || args.minute > 59)) {
    console.error("❌ 분은 0~59 사이여야 합니다.");
    return null;
  }

  return {
    year: args.year,
    month: args.month,
    day: args.day,
    hour: args.hour,
    minute: args.minute,
    gender: args.gender,
    calendar: args.calendar || "양력",
    isLeapMonth: args.isLeapMonth || false
  };
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log("🔮 사주 분석 RAG CLI v1.0");
  console.log("━".repeat(55));

  // 전체 실행 시간 측정 시작
  const totalStartTime = Date.now();
  const stepTimes: { [key: string]: number } = {};
  const logger = new StepLogger(5); // 총 5단계

  try {
    const args = parseArgs();

    // 1. 생년월일시 입력 검증
    const birthInfo = validateBirthInfo(args);
    if (!birthInfo) {
      console.log("\n사용법:");
      console.log("  node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남");
      console.log("  node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --minute 30 --gender 남 --name '홍길동' --query '재물운'");
      console.log("  node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남 --calendar 음력 --leap");
      console.log("\n필수 옵션:");
      console.log("  --year      출생 연도 (YYYY)");
      console.log("  --month     출생 월 (1~12)");
      console.log("  --day       출생 일 (1~31)");
      console.log("  --hour      출생 시간 (0~23)");
      console.log("  --gender    성별 (남/여)");
      console.log("\n선택 옵션:");
      console.log("  --minute    출생 분 (0~59, 기본: 0)");
      console.log("  --name      이름");
      console.log("  --calendar  달력 구분 (양력/음력, 기본: 양력)");
      console.log("  --leap      윤달 여부 (음력 기준)");
      console.log("  --query     추가 질문");
      console.log("  --redis / --useRedis  Redis RAG 사용 (벡터 검색)");
      process.exit(1);
    }

    // 입력 정보 표시
    logger.startStep("입력 정보 확인", "생년월일시 및 기본 정보 검증");
    if (args.name) {
      logger.log(`이름: ${args.name}`);
    }
    const minuteStr = birthInfo.minute !== undefined ? String(birthInfo.minute).padStart(2, '0') : '00';
    logger.log(`생년월일시: ${birthInfo.year}-${String(birthInfo.month).padStart(2, '0')}-${String(birthInfo.day).padStart(2, '0')} ${String(birthInfo.hour).padStart(2, '0')}:${minuteStr}`);
    logger.log(`성별: ${birthInfo.gender}`);
    logger.log(`달력: ${birthInfo.calendar}`);
    if (birthInfo.calendar === '음력' && birthInfo.isLeapMonth) {
      logger.log(`윤달: 예`);
    }
    logger.success("입력 정보 확인 완료");

    // 2. 사주 계산 (천문적 데이터 레이어)
    logger.startStep("사주 계산", "생년월일시를 기반으로 사주 4주 계산");
    const sajuStartTime = Date.now();
    const spinner = new Spinner("천문 데이터 계산 중...");
    spinner.start();
    
    const saju = calculateSaju(birthInfo);
    stepTimes["사주 계산"] = Date.now() - sajuStartTime;
    spinner.stop();
    
    logger.success(`사주 4주 계산 완료 (${stepTimes["사주 계산"]}ms)`);
    logger.log(`연주: ${saju.yearPillar}`, 2);
    logger.log(`월주: ${saju.monthPillar} (절기: ${saju.solarTerm})`, 2);
    logger.log(`일주: ${saju.dayPillar} ⭐ 일간`, 2);
    logger.log(`시주: ${saju.hourPillar}`, 2);

    const sajuDataText = formatSajuData(saju);

    // 3. 명리 관계 계산 (명리 관계 레이어)
    logger.startStep("명리 관계 계산", "오행, 십성, 십이운성 등 명리학 관계 분석");
    const myeongriStartTime = Date.now();
    const spinner2 = new Spinner("명리 관계 분석 중...");
    spinner2.start();
    
    const myeongri = calculateMyeongri(saju);
    stepTimes["명리 계산"] = Date.now() - myeongriStartTime;
    spinner2.stop();
    
    logger.success(`명리 관계 계산 완료 (${stepTimes["명리 계산"]}ms)`);
    logger.log(`오행 분포: 목${myeongri.fiveElements.목} 화${myeongri.fiveElements.화} 토${myeongri.fiveElements.토} 금${myeongri.fiveElements.금} 수${myeongri.fiveElements.수}`, 2);
    logger.log(`주요 키워드: ${myeongri.keywords.slice(0, 5).join(', ')}`, 2);

    const myeongriDataText = formatMyeongriData(myeongri);

    // 4. RAG 검색 (의미 해석 레이어)
    logger.startStep("RAG 검색", "지식베이스에서 관련 문서 검색");
    
    // 검색 쿼리 결정: --query > 키워드 요약
    let searchQuery: string;
    if (args.query) {
      searchQuery = args.query;
      logger.log(`사용자 지정 쿼리: "${searchQuery}"`);
    } else {
      // 일간과 주요 키워드로 검색 쿼리 생성
      const dayElement = myeongri.fiveElements.목 > 0 ? '목' :
                        myeongri.fiveElements.화 > 0 ? '화' :
                        myeongri.fiveElements.토 > 0 ? '토' :
                        myeongri.fiveElements.금 > 0 ? '금' : '수';
      searchQuery = summarizeSajuForSearch(saju.dayStem, dayElement, myeongri.keywords);
      logger.log(`자동 생성 쿼리: "${searchQuery.slice(0, 60)}..."`);
    }

    let relevantChunks: Chunk[];
    let context: string;

    // Redis RAG 또는 파일 기반 RAG 선택
    const useRedis = args.useRedis || process.env.USE_REDIS_RAG === "true";
    const ragStartTime = Date.now();
    
    if (useRedis) {
      logger.log("Redis 벡터 검색 모드 활성화");
      
      try {
        // Redis 연결 및 RedisSearch 확인
        const spinner3 = new Spinner("Redis 연결 중...");
        spinner3.start();
        await getRedisClient();
        spinner3.stop("Redis 연결 완료");
        
        const spinner4 = new Spinner("RedisSearch 모듈 확인 중...");
        spinner4.start();
        const hasSearch = await checkRedisSearch();
        spinner4.stop();
        
        if (!hasSearch) {
          throw new Error("RedisSearch 모듈이 없습니다");
        }
        
        const spinner5 = new Spinner("인덱스 상태 확인 중...");
        spinner5.start();
        const docCount = await getIndexedDocCount();
        spinner5.stop();
        
        if (docCount === 0) {
          logger.warning("인덱싱된 문서가 없습니다. 먼저 인덱싱을 실행하세요:");
          logger.log("   npx ts-node src/indexer.ts index", 2);
          throw new Error("인덱싱된 문서 없음");
        }
        
        logger.log(`인덱싱된 문서: ${docCount}개`, 2);
        
        // 벡터 검색 수행
        const spinner6 = new Spinner("벡터 검색 수행 중...");
        spinner6.start();
        relevantChunks = await searchByVector(searchQuery, 8);
        context = formatSearchContext(relevantChunks);
        stepTimes["RAG 검색 (Redis)"] = Date.now() - ragStartTime;
        spinner6.stop();
        
        logger.success(`${relevantChunks.length}개의 관련 문서 찾음 (벡터 검색, ${stepTimes["RAG 검색 (Redis)"]}ms)`);
        relevantChunks.forEach((chunk, idx) => {
          const score = chunk.score ? ` (유사도: ${((1 - chunk.score) * 100).toFixed(1)}%)` : '';
          logger.log(`${idx + 1}. ${chunk.fileName} - chunk ${chunk.chunkIndex}${score}`, 2);
        });
      } catch (error) {
        logger.warning(`Redis 검색 실패, 파일 기반 검색으로 전환: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        
        // 폴백: 파일 기반 검색
        logger.log("파일 기반 검색으로 전환 중...");
        const knowledgePath = path.join(process.cwd(), "knowledge");
        const spinner7 = new Spinner("지식베이스 로드 중...");
        spinner7.start();
        const chunks = loadKnowledgeBase(knowledgePath);
        spinner7.stop(`지식베이스 로드 완료 (${chunks.length}개 청크)`);
        
        const spinner8 = new Spinner("텍스트 검색 수행 중...");
        spinner8.start();
        relevantChunks = searchChunks(chunks, searchQuery, 8);
        context = formatContext(relevantChunks);
        stepTimes["RAG 검색 (파일)"] = Date.now() - ragStartTime;
        spinner8.stop();
        
        logger.success(`${relevantChunks.length}개의 관련 문서 찾음 (파일 검색, ${stepTimes["RAG 검색 (파일)"]}ms)`);
      }
    } else {
      // 기존 파일 기반 검색
      logger.log("파일 기반 검색 모드");
      const knowledgePath = path.join(process.cwd(), "knowledge");
      const spinner9 = new Spinner("지식베이스 로드 중...");
      spinner9.start();
      const chunks = loadKnowledgeBase(knowledgePath);
      spinner9.stop(`지식베이스 로드 완료 (${chunks.length}개 청크)`);
      
      const spinner10 = new Spinner("텍스트 검색 수행 중...");
      spinner10.start();
      relevantChunks = searchChunks(chunks, searchQuery, 8);
      context = formatContext(relevantChunks);
      stepTimes["RAG 검색 (파일)"] = Date.now() - ragStartTime;
      spinner10.stop();
      
      logger.success(`${relevantChunks.length}개의 관련 문서 찾음 (${stepTimes["RAG 검색 (파일)"]}ms)`);
      relevantChunks.forEach((chunk, idx) => {
        logger.log(`${idx + 1}. ${chunk.fileName} - chunk ${chunk.chunkIndex}`, 2);
      });
    }

    // 5. LLM 해석 생성
    logger.startStep("LLM 해석 생성", "AI를 통한 사주 분석 결과 생성");
    
    const useServer = process.env.USE_GMS_SERVER === "true";
    let result: string;
    const llmStartTime = Date.now();

    if (useServer) {
      logger.log("서버 모드 활성화");
      
      // 서버 상태 확인
      const serverConfig = getServerConfig();
      const spinner11 = new Spinner(`서버 연결 확인 중... (http://${serverConfig.host}:${serverConfig.port})`);
      spinner11.start();
      const isHealthy = await checkServerHealth(serverConfig);
      spinner11.stop();
      
      if (!isHealthy) {
        logger.warning(`서버 연결 실패: http://${serverConfig.host}:${serverConfig.port}`);
        logger.log("로컬 API로 전환합니다.", 2);
        
        // 로컬 API로 fallback
        const spinner12 = new Spinner("프롬프트 생성 중...");
        spinner12.start();
        const systemPrompt = buildSajuSystemPrompt(context);
        const userPrompt = buildSajuUserPrompt(
          sajuDataText,
          myeongriDataText,
          {
            year: birthInfo.year,
            month: birthInfo.month,
            day: birthInfo.day,
            hour: birthInfo.hour,
            minute: birthInfo.minute,
            gender: birthInfo.gender,
            calendar: birthInfo.calendar,
            isLeapMonth: birthInfo.isLeapMonth,
            name: args.name
          },
          args.query
        );
        spinner12.stop();
        
        logger.log("로컬 API 호출 중...", 2);
        const spinner13 = new Spinner("LLM 응답 대기 중...");
        spinner13.start();
        result = await callGmsApi(systemPrompt, userPrompt);
        stepTimes["LLM 해석 (로컬)"] = Date.now() - llmStartTime;
        spinner13.stop();
        
        logger.success(`LLM 해석 생성 완료 (${stepTimes["LLM 해석 (로컬)"]}ms)`);
      } else {
        logger.success(`서버 연결 성공: http://${serverConfig.host}:${serverConfig.port}`);
        
        // 서버로 전송할 데이터 준비
        const spinner14 = new Spinner("요청 데이터 준비 중...");
        spinner14.start();
        const serverRequest: SajuRequest = {
          saju_data: {
            yearPillar: saju.yearPillar,
            monthPillar: saju.monthPillar,
            dayPillar: saju.dayPillar,
            hourPillar: saju.hourPillar,
            yearStem: saju.yearStem,
            yearBranch: saju.yearBranch,
            monthStem: saju.monthStem,
            monthBranch: saju.monthBranch,
            dayStem: saju.dayStem,
            dayBranch: saju.dayBranch,
            hourStem: saju.hourStem,
            hourBranch: saju.hourBranch,
            solarTerm: saju.solarTerm,
            solarTermDate: saju.solarTermDate.toISOString(),
          },
          myeongri_data: {
            fiveElements: myeongri.fiveElements,
            sipSung: (() => {
              // SipSungData에서 십성 개수 계산
              const sipSungCounts: Record<string, number> = {
                비견: 0,
                겁재: 0,
                식신: 0,
                상관: 0,
                편재: 0,
                정재: 0,
                편관: 0,
                정관: 0,
                편인: 0,
                인수: 0,
              };
              
              const sipSungValues = [
                myeongri.sipSung.yearStem,
                myeongri.sipSung.monthStem,
                myeongri.sipSung.hourStem,
                myeongri.sipSung.yearBranch,
                myeongri.sipSung.monthBranch,
                myeongri.sipSung.dayBranch,
                myeongri.sipSung.hourBranch,
              ];
              
              sipSungValues.forEach(sipSung => {
                if (sipSung && sipSung in sipSungCounts) {
                  sipSungCounts[sipSung]++;
                }
              });
              
              return {
                비견: sipSungCounts.비견,
                겁재: sipSungCounts.겁재,
                식신: sipSungCounts.식신,
                상관: sipSungCounts.상관,
                편재: sipSungCounts.편재,
                정재: sipSungCounts.정재,
                편관: sipSungCounts.편관,
                정관: sipSungCounts.정관,
                편인: sipSungCounts.편인,
                인수: sipSungCounts.인수,
              };
            })(),
            twelveFortune: myeongri.twelveFortune,
            ganjiRelations: {
              ganCombinations: myeongri.ganjiRelations.ganCombinations.map(c => ({
                stem1: c.gan1,
                stem2: c.gan2,
                resultElement: c.result,
                description: `${c.gan1}${c.gan2} 합 → ${c.result}`,
              })),
              branchRelations: myeongri.ganjiRelations.branchRelations.map(r => ({
                type: r.type,
                branch1: r.branch1,
                branch2: r.branch2,
                description: r.description,
              })),
            },
            keywords: myeongri.keywords,
          },
          context: context,
          birth_info: {
            year: birthInfo.year,
            month: birthInfo.month,
            day: birthInfo.day,
            hour: birthInfo.hour,
            minute: birthInfo.minute,
            gender: birthInfo.gender,
            calendar: birthInfo.calendar,
            isLeapMonth: birthInfo.isLeapMonth,
            name: args.name,
          },
          query: args.query,
        };
        spinner14.stop();
        
        logger.log("서버로 요청 전송 중...", 2);
        const spinner15 = new Spinner("LLM 응답 대기 중...");
        spinner15.start();
        result = await callServerSajuGenerate(serverRequest, serverConfig);
        stepTimes["LLM 해석 (서버)"] = Date.now() - llmStartTime;
        spinner15.stop();
        
        logger.success(`LLM 해석 생성 완료 (${stepTimes["LLM 해석 (서버)"]}ms)`);
      }
    } else {
      logger.log("로컬 API 모드");
      
      const spinner16 = new Spinner("프롬프트 생성 중...");
      spinner16.start();
      const systemPrompt = buildSajuSystemPrompt(context);
      const userPrompt = buildSajuUserPrompt(
        sajuDataText,
        myeongriDataText,
        {
          year: birthInfo.year,
          month: birthInfo.month,
          day: birthInfo.day,
          hour: birthInfo.hour,
          minute: birthInfo.minute,
          gender: birthInfo.gender,
          calendar: birthInfo.calendar,
          isLeapMonth: birthInfo.isLeapMonth,
          name: args.name
        },
        args.query
      );
      spinner16.stop();
      
      logger.log("로컬 API 호출 중...", 2);
      const spinner17 = new Spinner("LLM 응답 대기 중...");
      spinner17.start();
      result = await callGmsApi(systemPrompt, userPrompt);
      stepTimes["LLM 해석 (로컬)"] = Date.now() - llmStartTime;
      spinner17.stop();
      
      logger.success(`LLM 해석 생성 완료 (${stepTimes["LLM 해석 (로컬)"]}ms)`);
    }

    // 6. 결과 출력
    logger.startStep("결과 출력", "사주 분석 결과 표시");
    console.log("\n" + "═".repeat(55));
    console.log("📜 사주 분석 결과");
    if (args.name) {
      console.log(`👤 ${args.name}님의 사주`);
    }
    console.log("═".repeat(55) + "\n");
    console.log(result);
    
    // 7. 결과를 파일로 저장 (선택)
    if (args.name) {
      logger.log("결과 파일 저장 중...");
      const outputDir = path.join(process.cwd(), "output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputFile = path.join(outputDir, `saju_${args.name}_${birthInfo.year}${String(birthInfo.month).padStart(2, '0')}${String(birthInfo.day).padStart(2, '0')}.txt`);
      const outputContent = `사주 분석 결과\n${"=".repeat(55)}\n\n${result}`;
      fs.writeFileSync(outputFile, outputContent, "utf-8");
      logger.success(`결과 저장 완료: ${outputFile}`);
    }

    // 8. 실행 시간 요약 출력
    const totalTime = Date.now() - totalStartTime;
    console.log("\n" + "═".repeat(55));
    console.log("⏱️  실행 시간 요약");
    console.log("═".repeat(55));
    Object.entries(stepTimes).forEach(([step, time]) => {
      const percentage = ((time / totalTime) * 100).toFixed(1);
      const barLength = Math.floor((time / totalTime) * 20);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      console.log(`   ${step.padEnd(20)} ${bar} ${time}ms (${percentage}%)`);
    });
    console.log(`   ${'─'.repeat(55)}`);
    const totalBar = '█'.repeat(20);
    console.log(`   전체 실행 시간 ${totalBar} ${totalTime}ms (${(totalTime / 1000).toFixed(2)}초)`);
    console.log("═".repeat(55));
  } catch (error) {
    if (error instanceof Error) {
      console.error("\n" + error.message);
    } else {
      console.error("\n❌ 알 수 없는 오류가 발생했습니다.");
    }
    process.exit(1);
  } finally {
    // Redis 연결 정리
    await closeRedisClient();
  }
}

main();
