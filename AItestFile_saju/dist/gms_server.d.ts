/**
 * GMS 서버 통신 모듈
 * Jupyter Lab GPU 서버와 통신하여 텍스트 생성을 수행합니다.
 */
export interface ServerConfig {
    host: string;
    port: number;
    timeout?: number;
}
export interface SajuRequest {
    saju_data: {
        yearPillar: string;
        monthPillar: string;
        dayPillar: string;
        hourPillar: string;
        yearStem: string;
        yearBranch: string;
        monthStem: string;
        monthBranch: string;
        dayStem: string;
        dayBranch: string;
        hourStem: string;
        hourBranch: string;
        solarTerm: string;
        solarTermDate: string;
    };
    myeongri_data: {
        fiveElements: {
            목: number;
            화: number;
            토: number;
            금: number;
            수: number;
        };
        sipSung: {
            비견: number;
            겁재: number;
            식신: number;
            상관: number;
            편재: number;
            정재: number;
            편관: number;
            정관: number;
            편인: number;
            인수: number;
        };
        twelveFortune: Record<string, string>;
        ganjiRelations: {
            ganCombinations: Array<{
                stem1: string;
                stem2: string;
                resultElement: string;
                description: string;
            }>;
            branchRelations: Array<{
                type: string;
                branch1: string;
                branch2: string;
                description: string;
            }>;
        };
        keywords: string[];
    };
    context: string;
    birth_info: {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute?: number;
        gender: "남" | "여";
        calendar: "양력" | "음력";
        isLeapMonth?: boolean;
        name?: string;
    };
    query?: string;
    model?: string;
    timeout?: number;
}
export interface ServerResponse {
    success: boolean;
    result?: string;
    error?: string;
}
/**
 * 서버 설정 가져오기
 */
export declare function getServerConfig(): ServerConfig;
/**
 * 서버 상태 확인
 */
export declare function checkServerHealth(config?: ServerConfig): Promise<boolean>;
/**
 * 일반 텍스트 생성 (서버 호출)
 */
export declare function callServerGenerate(systemPrompt: string, userPrompt: string, model?: string, timeout?: number, config?: ServerConfig): Promise<string>;
/**
 * 사주 분석 텍스트 생성 (서버 호출)
 */
export declare function callServerSajuGenerate(request: SajuRequest, config?: ServerConfig): Promise<string>;
//# sourceMappingURL=gms_server.d.ts.map