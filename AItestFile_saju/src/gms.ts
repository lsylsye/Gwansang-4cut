/**
 * GMS (GPT Model Service) API 호출 모듈
 * OpenAI 호환 Responses API 사용
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: Array<{ type: "input_text"; text: string }>;
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
    content?: Array<{ type: string; text?: string }>;
    text?: string;
    message?: { content?: string };
  }>;
  choices?: Array<{
    message?: { content?: string };
    text?: string;
  }>;
  error?: { message: string };
  [key: string]: unknown; // 추가 필드 허용
}

/**
 * 환경변수에서 설정 로드
 */
export function getConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.GMS_KEY;
  const baseUrl =
    process.env.GMS_BASE_URL || "https://gms.ssafy.io/gmsapi/api.openai.com/v1/responses";

  if (!apiKey) {
    throw new Error(
      "❌ GMS_KEY 환경변수가 설정되지 않았습니다.\n" +
        "   다음 명령으로 설정하세요:\n" +
        '   Windows: set GMS_KEY="your-api-key"\n' +
        '   Linux/Mac: export GMS_KEY="your-api-key"'
    );
  }

  return { apiKey, baseUrl };
}

/**
 * API 응답에서 텍스트 추출 (robust 처리)
 */
function extractOutputText(response: ApiResponse): string {
  // 디버그: 응답 구조 출력
  console.log("📥 API 응답 구조:", JSON.stringify(response, null, 2).slice(0, 500) + "...");

  // 1) output_text가 있으면 사용 (Responses API)
  if (response.output_text) {
    return response.output_text;
  }

  // 2) output 배열 순회 (Responses API)
  if (response.output && Array.isArray(response.output)) {
    const texts: string[] = [];

    for (const item of response.output) {
      // 직접 text 필드가 있는 경우
      if (item.text) {
        texts.push(item.text);
      }
      // message.content가 있는 경우
      if (item.message?.content) {
        texts.push(item.message.content);
      }
      // content 배열이 있는 경우
      if (item.content && Array.isArray(item.content)) {
        for (const contentItem of item.content) {
          if (contentItem.text) {
            texts.push(contentItem.text);
          }
        }
      }
    }

    if (texts.length > 0) {
      return texts.join("\n");
    }
  }

  // 3) choices 배열 (Chat Completions API 호환)
  if (response.choices && Array.isArray(response.choices)) {
    const texts: string[] = [];

    for (const choice of response.choices) {
      if (choice.message?.content) {
        texts.push(choice.message.content);
      }
      if (choice.text) {
        texts.push(choice.text);
      }
    }

    if (texts.length > 0) {
      return texts.join("\n");
    }
  }

  // 4) 최후의 수단: 응답 객체에서 텍스트 찾기
  const responseStr = JSON.stringify(response);
  console.error("⚠️ 알 수 없는 응답 형식:", responseStr.slice(0, 1000));
  
  throw new Error("❌ API 응답에서 출력 텍스트를 찾을 수 없습니다.\n   응답 형식을 확인하세요.");
}

/**
 * GMS API 호출
 * 환경변수 USE_PYTHON_GMS=true로 설정하면 Python 스크립트를 사용 (Jupyter Lab GPU 서버용)
 */
export async function callGmsApi(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Python 사용 옵션 확인
  if (process.env.USE_PYTHON_GMS === "true") {
    try {
      const { callGmsApiPython } = await import("./gms_python");
      return await callGmsApiPython(systemPrompt, userPrompt);
    } catch (error) {
      console.warn("⚠️ Python 스크립트 호출 실패, TypeScript 버전으로 전환:", error);
      // TypeScript 버전으로 fallback
    }
  }
  
  const { apiKey, baseUrl } = getConfig();

  const requestBody: ApiRequest = {
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }],
      },
    ],
    // Note: temperature는 gpt-5-mini에서 지원되지 않음
  };

  console.log(`\n🔗 API 호출: ${baseUrl}`);
  console.log(`📤 모델: gpt-5-mini`);

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `❌ HTTP 에러 ${response.status}: ${response.statusText}\n` +
          `   상세: ${errorText}`
      );
    }

    const data = (await response.json()) as ApiResponse;

    if (data.error) {
      throw new Error(`❌ API 에러: ${data.error.message}`);
    }

    return extractOutputText(data);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "❌ 네트워크 오류: API 서버에 연결할 수 없습니다.\n" +
          `   URL: ${baseUrl}\n` +
          "   인터넷 연결 및 GMS_BASE_URL 설정을 확인하세요."
      );
    }
    throw error;
  }
}
