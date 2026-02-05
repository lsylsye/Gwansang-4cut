/**
 * 개인 분석 저장 및 공유 API
 */

import { API_BASE_URL } from './config';

// ============================================================
// Types
// ============================================================

/** 저장할 개인 분석 데이터 (실제 전송용) */
export interface PersonalAnalysisSaveRequest {
  jsonData: string; // JSON 문자열로 직렬화된 분석 데이터
}

/** 개인 분석 데이터 구조 (jsonData 안에 들어갈 내용) */
export interface PersonalAnalysisData {
  // 관상 분석 데이터
  faceAnalysis: {
    faceOverview?: string; // 전체 관상 분석 종합 의견
    careerFortune?: string; // 취업운
    common?: any; // 공통 분석 데이터
    faceShape?: any; // 얼굴형 분석
    forehead?: any; // 이마 분석
    eyes?: any; // 눈 분석
    nose?: any; // 코 분석
    mouth?: any; // 입 분석
    chin?: any; // 턱 분석
  };
  // 체질 분석 데이터 ('당신의 체질 풀이' 아래 내용)
  constitutionAnalysis?: {
    phase?: string; // intro, loading, result
    selectedMenuIdx?: number | null;
    // 체질 분석 결과 데이터
    content?: any;
  };
}

/** 개인 분석 조회 응답 (서버 DTO에 맞춤) */
export interface PersonalAnalysisResponse {
  id: string; // UUID
  analysisData: string; // JSON 문자열
  createdAt?: string;
}

// ============================================================
// API Functions
// ============================================================

/**
 * 개인 분석 결과 저장
 * POST /api/db/share/personal
 */
export async function savePersonalAnalysis(
  data: PersonalAnalysisData
): Promise<string> {
  try {
    // 데이터를 JSON 문자열로 변환하여 DTO 형식에 맞춤
    const requestBody: PersonalAnalysisSaveRequest = {
      jsonData: JSON.stringify(data),
    };

    const response = await fetch(`${API_BASE_URL}/share/personal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`개인 분석 저장 실패: ${response.status} - ${errorText}`);
    }

    // UUID 반환
    const uuid = await response.text();
    return uuid.replace(/"/g, ''); // 따옴표 제거
  } catch (error) {
    console.error('❌ 개인 분석 저장 오류:', error);
    throw error;
  }
}

/**
 * 개인 분석 결과 조회
 * GET /api/db/share/personal/{uuid}
 */
export async function getPersonalAnalysis(
  uuid: string
): Promise<PersonalAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/share/personal/${uuid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`개인 분석 조회 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ 개인 분석 조회 오류:', error);
    throw error;
  }
}
