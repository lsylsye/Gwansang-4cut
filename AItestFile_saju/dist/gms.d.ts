/**
 * GMS (GPT Model Service) API 호출 모듈
 * OpenAI 호환 Responses API 사용
 */
export interface Message {
    role: "system" | "user" | "assistant";
    content: Array<{
        type: "input_text";
        text: string;
    }>;
}
export interface ApiRequest {
    model: string;
    input: Message[];
    temperature?: number;
}
export interface ApiResponse {
    output_text?: string;
    output?: Array<{
        type: string;
        content?: Array<{
            type: string;
            text?: string;
        }>;
        text?: string;
        message?: {
            content?: string;
        };
    }>;
    choices?: Array<{
        message?: {
            content?: string;
        };
        text?: string;
    }>;
    error?: {
        message: string;
    };
    [key: string]: unknown;
}
/**
 * 환경변수에서 설정 로드
 */
export declare function getConfig(): {
    apiKey: string;
    baseUrl: string;
};
/**
 * GMS API 호출
 * 환경변수 USE_PYTHON_GMS=true로 설정하면 Python 스크립트를 사용 (Jupyter Lab GPU 서버용)
 */
export declare function callGmsApi(systemPrompt: string, userPrompt: string): Promise<string>;
//# sourceMappingURL=gms.d.ts.map