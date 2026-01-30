"use strict";
/**
 * GMS 서버 통신 모듈
 * Jupyter Lab GPU 서버와 통신하여 텍스트 생성을 수행합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerConfig = getServerConfig;
exports.checkServerHealth = checkServerHealth;
exports.callServerGenerate = callServerGenerate;
exports.callServerSajuGenerate = callServerSajuGenerate;
/**
 * 서버 설정 가져오기
 */
function getServerConfig() {
    const host = process.env.GMS_SERVER_HOST || "localhost";
    const port = parseInt(process.env.GMS_SERVER_PORT || "5000", 10);
    const timeout = parseInt(process.env.GMS_SERVER_TIMEOUT || "600000", 10); // 10분 기본값
    return { host, port, timeout };
}
/**
 * 서버 상태 확인
 */
async function checkServerHealth(config) {
    const serverConfig = config || getServerConfig();
    const url = `http://${serverConfig.host}:${serverConfig.port}/health`;
    try {
        const response = await fetch(url, {
            method: "GET",
            signal: AbortSignal.timeout(5000), // 5초 타임아웃
        });
        if (!response.ok) {
            return false;
        }
        const data = (await response.json());
        return data.status === "ok";
    }
    catch (error) {
        return false;
    }
}
/**
 * 일반 텍스트 생성 (서버 호출)
 */
async function callServerGenerate(systemPrompt, userPrompt, model = "gpt-5-mini", timeout = 300, config) {
    const serverConfig = config || getServerConfig();
    const url = `http://${serverConfig.host}:${serverConfig.port}/api/generate`;
    const requestBody = {
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        model: model,
        timeout: timeout,
    };
    try {
        const controller = new AbortController();
        const timeoutMs = serverConfig.timeout || 600000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({})));
            throw new Error(`❌ 서버 오류 ${response.status}: ${errorData.error || response.statusText}`);
        }
        const data = (await response.json());
        if (!data.success) {
            throw new Error(`❌ 서버 오류: ${data.error || "알 수 없는 오류"}`);
        }
        if (!data.result) {
            throw new Error("❌ 서버가 결과를 반환하지 않았습니다.");
        }
        return data.result;
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === "AbortError") {
                const timeoutMs = serverConfig.timeout || 600000;
                throw new Error(`❌ 요청 타임아웃: ${timeoutMs / 1000}초 내에 응답을 받지 못했습니다.`);
            }
            if (error.message.includes("fetch")) {
                throw new Error(`❌ 서버 연결 실패: ${url}\n` +
                    `   서버가 실행 중인지 확인하세요.\n` +
                    `   환경변수: GMS_SERVER_HOST=${serverConfig.host}, GMS_SERVER_PORT=${serverConfig.port}`);
            }
            throw error;
        }
        throw new Error("❌ 알 수 없는 오류가 발생했습니다.");
    }
}
/**
 * 사주 분석 텍스트 생성 (서버 호출)
 */
async function callServerSajuGenerate(request, config) {
    const serverConfig = config || getServerConfig();
    const url = `http://${serverConfig.host}:${serverConfig.port}/api/saju/generate`;
    try {
        const controller = new AbortController();
        const timeoutMs = serverConfig.timeout || 600000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        console.log(`\n🌐 서버 연결: ${url}`);
        console.log(`📤 요청 전송 중...`);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({})));
            throw new Error(`❌ 서버 오류 ${response.status}: ${errorData.error || response.statusText}`);
        }
        const data = (await response.json());
        if (!data.success) {
            throw new Error(`❌ 서버 오류: ${data.error || "알 수 없는 오류"}`);
        }
        if (!data.result) {
            throw new Error("❌ 서버가 결과를 반환하지 않았습니다.");
        }
        return data.result;
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === "AbortError") {
                const timeoutMs = serverConfig.timeout || 600000;
                throw new Error(`❌ 요청 타임아웃: ${timeoutMs / 1000}초 내에 응답을 받지 못했습니다.`);
            }
            if (error.message.includes("fetch")) {
                throw new Error(`❌ 서버 연결 실패: ${url}\n` +
                    `   서버가 실행 중인지 확인하세요.\n` +
                    `   환경변수: GMS_SERVER_HOST=${serverConfig.host}, GMS_SERVER_PORT=${serverConfig.port}\n` +
                    `   Jupyter Lab에서 서버를 시작했는지 확인하세요.`);
            }
            throw error;
        }
        throw new Error("❌ 알 수 없는 오류가 발생했습니다.");
    }
}
//# sourceMappingURL=gms_server.js.map