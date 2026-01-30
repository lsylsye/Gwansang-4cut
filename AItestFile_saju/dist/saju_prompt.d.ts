/**
 * 사주 프롬프트 생성 모듈
 * 사주 분석용 시스템 프롬프트 및 사용자 프롬프트 구성
 */
/**
 * 시스템 프롬프트 생성
 */
export declare function buildSajuSystemPrompt(context: string): string;
/**
 * 사용자 프롬프트 생성
 */
export declare function buildSajuUserPrompt(sajuDataText: string, myeongriDataText: string, birthInfo: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    gender: "남" | "여";
    calendar: "양력" | "음력";
    isLeapMonth?: boolean;
    name?: string;
}, additionalQuery?: string): string;
/**
 * 사주 데이터 요약 (RAG 검색용)
 */
export declare function summarizeSajuForSearch(dayStem: string, dayElement: string, keywords: string[]): string;
//# sourceMappingURL=saju_prompt.d.ts.map