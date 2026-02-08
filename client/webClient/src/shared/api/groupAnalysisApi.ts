/**
 * 단체 분석 저장 및 공유 API
 */

import { API_BASE_URL } from './config';

// ============================================================
// Types
// ============================================================

/** 저장할 단체 분석 데이터 (실제 전송용) */
export interface GroupAnalysisSaveRequest {
  jsonData: string; // JSON 문자열로 직렬화된 분석 데이터
}

/** 단체 분석 데이터 구조 (jsonData 안에 들어갈 내용) */
export interface GroupAnalysisData {
  // 팀 정보
  teamName?: string;
  memberCount?: number;
  score?: number;
  
  // 멤버 정보
  members?: Array<{
    id?: number;
    name: string;
    birthDate?: string;
    birthTime?: string;
    gender?: string;
    avatar?: string;
    role?: string;
    keywords?: string[];
    description?: string;
    strengths?: string[];
    warnings?: string[];
    fiveElements?: {
      목: number;
      화: number;
      토: number;
      금: number;
      수: number;
    };
  }>;
  
  // 전체 궁합 분석 결과 (overall 탭)
  overallAnalysis?: {
    personality?: {
      title?: string;
      harmony?: string;
      comprehensive?: string;
    };
    compatibility?: {
      score?: number;
    };
    teamwork?: {
      communication?: number;
      speed?: number;
      stability?: number;
      communicationDetail?: string;
      speedDetail?: string;
      stabilityDetail?: string;
    };
    maintenance?: {
      do?: string[];
      dont?: string[];
      maintenanceCards?: Array<{
        label: string;
        title: string;
        description: string;
      }>;
      problemChild?: {
        name: string;
        whySentence?: string;
        survivalStrategy?: string[];
        guidelines?: string[];
      };
      /** 돈을 가장 많이 벌 것 같은 사람 */
      richestPerson?: {
        name: string;
        whySentence?: string;
        detailedReasons?: string[];
      };
      /** 모임의 핵심 인물 */
      keyPerson?: {
        name: string;
        whySentence?: string;
        tips?: string[];
      };
    };
    members?: Array<{
      name: string;
      role: string;
      keywords: string[];
      description: string;
      strengths: string[];
      warnings: string[];
    }>;
  };
  
  // 1:1 궁합 분석 결과 (pairs 탭)
  pairsAnalysis?: Array<{
    name1?: string;
    name2?: string;
    score?: number;
    reason?: string;
    summary?: string;
    strengths?: string[];
    cautions?: string[];
    tips?: string[];
    romanceLines?: string[];
  }>;
}

/** 분석 상태 */
export type AnalysisStatus = 'ANALYZING' | 'COMPLETED';

/** 단체 분석 조회 응답 (서버 DTO에 맞춤) */
export interface GroupAnalysisResponse {
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
 * POST /api/db/share/group/placeholder
 * @returns 생성된 UUID
 */
export async function createGroupAnalysisPlaceholder(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/share/group/placeholder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`단체 분석 placeholder 생성 실패: ${response.status} - ${errorText}`);
    }

    const uuid = await response.text();
    return uuid.replace(/"/g, ''); // 따옴표 제거
  } catch (error) {
    console.error('❌ 단체 분석 placeholder 생성 오류:', error);
    throw error;
  }
}

/**
 * 분석 완료 후 결과 데이터 업데이트
 * PUT /api/db/share/group/{uuid}
 */
export async function updateGroupAnalysis(
  uuid: string,
  data: GroupAnalysisData
): Promise<void> {
  try {
    const requestBody: GroupAnalysisSaveRequest = {
      jsonData: JSON.stringify(data),
    };

    const response = await fetch(`${API_BASE_URL}/share/group/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`단체 분석 업데이트 실패: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ 단체 분석 업데이트 오류:', error);
    throw error;
  }
}

/**
 * 단체 분석 결과 저장 (기존 방식 - 결과와 함께 저장)
 * POST /api/db/share/group
 */
export async function saveGroupAnalysis(
  data: GroupAnalysisData
): Promise<string> {
  try {
    // 데이터를 JSON 문자열로 변환하여 DTO 형식에 맞춤
    const requestBody: GroupAnalysisSaveRequest = {
      jsonData: JSON.stringify(data),
    };

    const response = await fetch(`${API_BASE_URL}/share/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`단체 분석 저장 실패: ${response.status} - ${errorText}`);
    }

    // UUID 반환
    const uuid = await response.text();
    return uuid.replace(/"/g, ''); // 따옴표 제거
  } catch (error) {
    console.error('❌ 단체 분석 저장 오류:', error);
    throw error;
  }
}

/**
 * 단체 분석 결과 조회
 * GET /api/db/share/group/{uuid}
 */
export async function getGroupAnalysis(
  uuid: string
): Promise<GroupAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/share/group/${uuid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`단체 분석 조회 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ 단체 분석 조회 오류:', error);
    throw error;
  }
}
