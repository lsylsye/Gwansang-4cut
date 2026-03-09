/**
 * 개인 분석 저장 및 공유 API
 */

import { API_BASE_URL } from './config';
import { devError } from '@/utils/logger';

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
    lifeReview?: string; // 1번 블록: 지금까지 당신이 걸어온 길
    meetingCompatibility?: string; // 3번 블록: 이런 사람과 만나면 좋을 것이다.
    common?: unknown;
    faceShape?: unknown;
    forehead?: unknown;
    eyes?: unknown;
    nose?: unknown;
    mouth?: unknown;
    chin?: unknown;
  };
  // 체질 분석 데이터 ('당신의 체질 풀이' 아래 내용)
  constitutionAnalysis?: {
    phase?: string;
    selectedMenuIdx?: number | null;
    content?: unknown;
    sajuInfo?: unknown;
    totalReview?: unknown;
  };
}

/** 분석 상태 */
export type AnalysisStatus = 'ANALYZING' | 'COMPLETED';

/** 개인 분석 조회 응답 (서버 DTO에 맞춤) */
export interface PersonalAnalysisResponse {
  id: string; // UUID
  analysisData: string; // JSON 문자열
  status: AnalysisStatus; // 분석 상태
  createdAt?: string;
}

// ============================================================
// API Functions
// ============================================================

/**
 * 분석 시작 시 placeholder 생성 (ANALYZING 상태)
 * POST /api/db/share/personal/placeholder
 * @returns 생성된 UUID
 */
export async function createPersonalAnalysisPlaceholder(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/share/personal/placeholder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`개인 분석 placeholder 생성 실패: ${response.status} - ${errorText}`);
    }

    const uuid = await response.text();
    return uuid.replace(/"/g, ''); // 따옴표 제거
  } catch (error) {
    devError('❌ 개인 분석 placeholder 생성 오류:', error);
    throw error;
  }
}

/**
 * 분석 완료 후 결과 데이터 업데이트
 * PUT /api/db/share/personal/{uuid}
 */
export async function updatePersonalAnalysis(
  uuid: string,
  data: PersonalAnalysisData
): Promise<void> {
  try {
    const requestBody: PersonalAnalysisSaveRequest = {
      jsonData: JSON.stringify(data),
    };

    const response = await fetch(`${API_BASE_URL}/share/personal/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`개인 분석 업데이트 실패: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    devError('❌ 개인 분석 업데이트 오류:', error);
    throw error;
  }
}

/**
 * 개인 분석 결과 저장 (기존 방식 - 결과와 함께 저장)
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
    devError('❌ 개인 분석 저장 오류:', error);
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
    devError('❌ 개인 분석 조회 오류:', error);
    throw error;
  }
}
