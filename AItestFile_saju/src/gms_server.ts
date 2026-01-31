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
    solarTermDate: string; // ISO string
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
export function getServerConfig(): ServerConfig {
  const host = process.env.GMS_SERVER_HOST || "localhost";
  const port = parseInt(process.env.GMS_SERVER_PORT || "5000", 10);
  const timeout = parseInt(process.env.GMS_SERVER_TIMEOUT || "600000", 10); // 10분 기본값

  return { host, port, timeout };
}

/**
 * 서버 상태 확인
 */
export async function checkServerHealth(config?: ServerConfig): Promise<boolean> {
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

    const data = (await response.json()) as { status?: string };
    return data.status === "ok";
  } catch (error) {
    return false;
  }
}

/**
 * 일반 텍스트 생성 (서버 호출)
 */
export async function callServerGenerate(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-5-mini",
  timeout: number = 300,
  config?: ServerConfig
): Promise<string> {
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
      const errorData = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        `❌ 서버 오류 ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const data = (await response.json()) as ServerResponse;

    if (!data.success) {
      throw new Error(`❌ 서버 오류: ${data.error || "알 수 없는 오류"}`);
    }

    if (!data.result) {
      throw new Error("❌ 서버가 결과를 반환하지 않았습니다.");
    }

    return data.result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        const timeoutMs = serverConfig.timeout || 600000;
        throw new Error(
          `❌ 요청 타임아웃: ${timeoutMs / 1000}초 내에 응답을 받지 못했습니다.`
        );
      }
      if (error.message.includes("fetch")) {
        throw new Error(
          `❌ 서버 연결 실패: ${url}\n` +
            `   서버가 실행 중인지 확인하세요.\n` +
            `   환경변수: GMS_SERVER_HOST=${serverConfig.host}, GMS_SERVER_PORT=${serverConfig.port}`
        );
      }
      throw error;
    }
    throw new Error("❌ 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 사주 분석 텍스트 생성 (서버 호출)
 */
export async function callServerSajuGenerate(
  request: SajuRequest,
  config?: ServerConfig
): Promise<string> {
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
      const errorData = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        `❌ 서버 오류 ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const data = (await response.json()) as ServerResponse;

    if (!data.success) {
      throw new Error(`❌ 서버 오류: ${data.error || "알 수 없는 오류"}`);
    }

    if (!data.result) {
      throw new Error("❌ 서버가 결과를 반환하지 않았습니다.");
    }

    return data.result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        const timeoutMs = serverConfig.timeout || 600000;
        throw new Error(
          `❌ 요청 타임아웃: ${timeoutMs / 1000}초 내에 응답을 받지 못했습니다.`
        );
      }
      if (error.message.includes("fetch")) {
        throw new Error(
          `❌ 서버 연결 실패: ${url}\n` +
            `   서버가 실행 중인지 확인하세요.\n` +
            `   환경변수: GMS_SERVER_HOST=${serverConfig.host}, GMS_SERVER_PORT=${serverConfig.port}\n` +
            `   Jupyter Lab에서 서버를 시작했는지 확인하세요.`
        );
      }
      throw error;
    }
    throw new Error("❌ 알 수 없는 오류가 발생했습니다.");
  }
}
