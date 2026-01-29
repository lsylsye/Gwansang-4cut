"use strict";
/**
 * 사주 분석 RAG CLI 메인 모듈
 * 생년월일시 → 사주 계산 → 명리 분석 → RAG 검색 → LLM 해석
 *
 * 사용법:
 *   node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남
 *   node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남 --name "홍길동" --query '재물운'
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rag_1 = require("./rag");
const gms_1 = require("./gms");
const saju_prompt_1 = require("./saju_prompt");
const gms_server_1 = require("./gms_server");
const saju_calculation_1 = require("./saju_calculation");
const saju_myeongri_1 = require("./saju_myeongri");
const redis_client_1 = require("./redis_client");
const redis_search_1 = require("./redis_search");
/**
 * CLI 인자 파싱
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--year" && args[i + 1]) {
            result.year = parseInt(args[++i], 10);
        }
        else if (args[i] === "--month" && args[i + 1]) {
            result.month = parseInt(args[++i], 10);
        }
        else if (args[i] === "--day" && args[i + 1]) {
            result.day = parseInt(args[++i], 10);
        }
        else if (args[i] === "--hour" && args[i + 1]) {
            result.hour = parseInt(args[++i], 10);
        }
        else if (args[i] === "--minute" && args[i + 1]) {
            result.minute = parseInt(args[++i], 10);
        }
        else if (args[i] === "--gender" && args[i + 1]) {
            const gender = args[++i];
            if (gender === "남" || gender === "여") {
                result.gender = gender;
            }
        }
        else if (args[i] === "--name" && args[i + 1]) {
            result.name = args[++i];
        }
        else if (args[i] === "--calendar" && args[i + 1]) {
            const cal = args[++i];
            if (cal === "양력" || cal === "음력") {
                result.calendar = cal;
            }
        }
        else if (args[i] === "--leap" || args[i] === "--isLeapMonth") {
            result.isLeapMonth = true;
        }
        else if (args[i] === "--query" && args[i + 1]) {
            result.query = args[++i];
        }
        else if (args[i] === "--redis") {
            result.useRedis = true;
        }
    }
    return result;
}
/**
 * 생년월일시 입력 검증
 */
function validateBirthInfo(args) {
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
async function main() {
    console.log("🔮 사주 분석 RAG CLI v1.0");
    console.log("━".repeat(55));
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
            console.log("  --redis     Redis RAG 사용 (벡터 검색)");
            process.exit(1);
        }
        // 이름 표시
        if (args.name) {
            console.log(`👤 이름: ${args.name}`);
        }
        const minuteStr = birthInfo.minute !== undefined ? String(birthInfo.minute).padStart(2, '0') : '00';
        console.log(`📅 생년월일시: ${birthInfo.year}-${String(birthInfo.month).padStart(2, '0')}-${String(birthInfo.day).padStart(2, '0')} ${String(birthInfo.hour).padStart(2, '0')}:${minuteStr}`);
        console.log(`👥 성별: ${birthInfo.gender}`);
        console.log(`📆 달력: ${birthInfo.calendar}`);
        if (birthInfo.calendar === '음력' && birthInfo.isLeapMonth) {
            console.log(`📅 윤달: 예`);
        }
        // 2. 사주 계산 (천문적 데이터 레이어)
        console.log("\n🔢 사주 계산 중...");
        const saju = (0, saju_calculation_1.calculateSaju)(birthInfo);
        console.log(`✅ 사주 4주 계산 완료:`);
        console.log(`   - 연주: ${saju.yearPillar}`);
        console.log(`   - 월주: ${saju.monthPillar} (절기: ${saju.solarTerm})`);
        console.log(`   - 일주: ${saju.dayPillar} ⭐ 일간`);
        console.log(`   - 시주: ${saju.hourPillar}`);
        const sajuDataText = (0, saju_calculation_1.formatSajuData)(saju);
        // 3. 명리 관계 계산 (명리 관계 레이어)
        console.log("\n🌿 명리 관계 계산 중...");
        const myeongri = (0, saju_myeongri_1.calculateMyeongri)(saju);
        console.log(`✅ 명리 관계 계산 완료:`);
        console.log(`   - 오행 분포: 목${myeongri.fiveElements.목} 화${myeongri.fiveElements.화} 토${myeongri.fiveElements.토} 금${myeongri.fiveElements.금} 수${myeongri.fiveElements.수}`);
        console.log(`   - 주요 키워드: ${myeongri.keywords.slice(0, 3).join(', ')}...`);
        const myeongriDataText = (0, saju_myeongri_1.formatMyeongriData)(myeongri);
        // 4. RAG 검색 (의미 해석 레이어)
        // 검색 쿼리 결정: --query > 키워드 요약
        let searchQuery;
        if (args.query) {
            searchQuery = args.query;
        }
        else {
            // 일간과 주요 키워드로 검색 쿼리 생성
            const dayElement = myeongri.fiveElements.목 > 0 ? '목' :
                myeongri.fiveElements.화 > 0 ? '화' :
                    myeongri.fiveElements.토 > 0 ? '토' :
                        myeongri.fiveElements.금 > 0 ? '금' : '수';
            searchQuery = (0, saju_prompt_1.summarizeSajuForSearch)(saju.dayStem, dayElement, myeongri.keywords);
        }
        console.log(`\n🔍 RAG 검색 쿼리: "${searchQuery.slice(0, 50)}..."`);
        let relevantChunks;
        let context;
        // Redis RAG 또는 파일 기반 RAG 선택
        const useRedis = args.useRedis || process.env.USE_REDIS_RAG === "true";
        if (useRedis) {
            console.log("📡 Redis 벡터 검색 모드");
            try {
                // Redis 연결 및 RedisSearch 확인
                await (0, redis_client_1.getRedisClient)();
                const hasSearch = await (0, redis_client_1.checkRedisSearch)();
                if (!hasSearch) {
                    throw new Error("RedisSearch 모듈이 없습니다");
                }
                const docCount = await (0, redis_search_1.getIndexedDocCount)();
                if (docCount === 0) {
                    console.warn("⚠️ 인덱싱된 문서가 없습니다. 먼저 인덱싱을 실행하세요:");
                    console.warn("   npx ts-node src/indexer.ts index");
                    throw new Error("인덱싱된 문서 없음");
                }
                console.log(`   인덱싱된 문서: ${docCount}개`);
                // 벡터 검색 수행
                relevantChunks = await (0, redis_search_1.searchByVector)(searchQuery, 8);
                context = (0, redis_search_1.formatSearchContext)(relevantChunks);
                console.log(`📑 ${relevantChunks.length}개의 관련 문서 찾음 (벡터 검색)`);
            }
            catch (error) {
                console.warn(`⚠️ Redis 검색 실패, 파일 기반 검색으로 전환: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                // 폴백: 파일 기반 검색
                const knowledgePath = path.join(process.cwd(), "knowledge");
                const chunks = (0, rag_1.loadKnowledgeBase)(knowledgePath);
                relevantChunks = (0, rag_1.searchChunks)(chunks, searchQuery, 8);
                context = (0, rag_1.formatContext)(relevantChunks);
                console.log(`📑 ${relevantChunks.length}개의 관련 문서 찾음 (파일 검색)`);
            }
        }
        else {
            // 기존 파일 기반 검색
            console.log("📂 파일 기반 검색 모드");
            const knowledgePath = path.join(process.cwd(), "knowledge");
            const chunks = (0, rag_1.loadKnowledgeBase)(knowledgePath);
            relevantChunks = (0, rag_1.searchChunks)(chunks, searchQuery, 8);
            context = (0, rag_1.formatContext)(relevantChunks);
            console.log(`📑 ${relevantChunks.length}개의 관련 문서 찾음`);
        }
        // 5. 서버 사용 여부 확인
        const useServer = process.env.USE_GMS_SERVER === "true";
        let result;
        if (useServer) {
            // 서버를 통한 텍스트 생성
            console.log("\n🌐 서버를 통한 텍스트 생성...");
            // 서버 상태 확인
            const serverConfig = (0, gms_server_1.getServerConfig)();
            const isHealthy = await (0, gms_server_1.checkServerHealth)(serverConfig);
            if (!isHealthy) {
                console.warn(`⚠️ 서버 연결 실패: http://${serverConfig.host}:${serverConfig.port}\n` +
                    `   로컬 API로 전환합니다.`);
                // 로컬 API로 fallback
                const systemPrompt = (0, saju_prompt_1.buildSajuSystemPrompt)(context);
                const userPrompt = (0, saju_prompt_1.buildSajuUserPrompt)(sajuDataText, myeongriDataText, {
                    year: birthInfo.year,
                    month: birthInfo.month,
                    day: birthInfo.day,
                    hour: birthInfo.hour,
                    minute: birthInfo.minute,
                    gender: birthInfo.gender,
                    calendar: birthInfo.calendar,
                    isLeapMonth: birthInfo.isLeapMonth,
                    name: args.name
                }, args.query);
                result = await (0, gms_1.callGmsApi)(systemPrompt, userPrompt);
            }
            else {
                console.log(`✅ 서버 연결 성공: http://${serverConfig.host}:${serverConfig.port}`);
                // 서버로 전송할 데이터 준비
                const serverRequest = {
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
                            const sipSungCounts = {
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
                console.log("\n🤖 서버에서 LLM 해석 생성 중...");
                result = await (0, gms_server_1.callServerSajuGenerate)(serverRequest, serverConfig);
            }
        }
        else {
            // 로컬 API 사용
            console.log("\n🤖 로컬 API로 LLM 해석 생성 중...");
            const systemPrompt = (0, saju_prompt_1.buildSajuSystemPrompt)(context);
            const userPrompt = (0, saju_prompt_1.buildSajuUserPrompt)(sajuDataText, myeongriDataText, {
                year: birthInfo.year,
                month: birthInfo.month,
                day: birthInfo.day,
                hour: birthInfo.hour,
                minute: birthInfo.minute,
                gender: birthInfo.gender,
                calendar: birthInfo.calendar,
                isLeapMonth: birthInfo.isLeapMonth,
                name: args.name
            }, args.query);
            result = await (0, gms_1.callGmsApi)(systemPrompt, userPrompt);
        }
        // 7. 결과 출력
        console.log("\n" + "═".repeat(55));
        console.log("📜 사주 분석 결과");
        if (args.name) {
            console.log(`👤 ${args.name}님의 사주`);
        }
        console.log("═".repeat(55) + "\n");
        console.log(result);
        // 8. 결과를 파일로 저장 (선택)
        if (args.name) {
            const outputDir = path.join(process.cwd(), "output");
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputFile = path.join(outputDir, `saju_${args.name}_${birthInfo.year}${String(birthInfo.month).padStart(2, '0')}${String(birthInfo.day).padStart(2, '0')}.txt`);
            const outputContent = `사주 분석 결과\n${"=".repeat(55)}\n\n${result}`;
            fs.writeFileSync(outputFile, outputContent, "utf-8");
            console.log(`\n💾 결과가 저장되었습니다: ${outputFile}`);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("\n" + error.message);
        }
        else {
            console.error("\n❌ 알 수 없는 오류가 발생했습니다.");
        }
        process.exit(1);
    }
    finally {
        // Redis 연결 정리
        await (0, redis_client_1.closeRedisClient)();
    }
}
main();
//# sourceMappingURL=saju_main.js.map