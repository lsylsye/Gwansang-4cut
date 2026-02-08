/**
 * 관상 분석 API 모듈
 * 비스트리밍 API: 한 번의 호출로 faceAnalysis, sajuInfo, totalReview(관상 3키 + 전체적인 체질 특성 4키) 수신
 */

import { API_ENDPOINTS } from './config';

// ============================================================
// Types
// ============================================================

/** 게이지 세그먼트 */
export interface GaugeSegment {
  label: string;
  min: number;
  max: number;
}

/** 게이지 데이터 */
export interface Gauge {
  value: number;
  rangeMin: number;
  rangeMax: number;
  unit?: string;
  segments: GaugeSegment[];
}

/** 얼굴형 분석 결과 */
export interface FaceShapeAnalysis {
  measures: {
    w: string;
    h: string;
    wh: string;
  };
  gauge: Gauge;
  coreMeaning: string;
  advice: string;
  coreMeaningParts?: string[];
  adviceParts?: string[];
}

/** 이마 분석 결과 */
export interface ForeheadAnalysis {
  measures: {
    height: string;
    heightRatio: string;
    width: string;
    widthRatio: string;
  };
  gauge: Gauge;
  coreMeaning: string;
  advice: string;
  coreMeaningParts?: string[];
  adviceParts?: string[];
}

/** 눈 분석 결과 */
export interface EyesAnalysis {
  measures: {
    openL: string;
    openR: string;
    asymmetry: string;
    asymmetryCriteria: string;
    interDist: string;
    widthRatio: string;
    symmetry: string;
  };
  gauge: Gauge;
  coreMeaning: string;
  advice: string;
  coreMeaningParts?: string[];
  adviceParts?: string[];
}

/** 코 분석 결과 */
export interface NoseAnalysis {
  measures: {
    length: string;
    lengthRatio: string;
    width: string;
    lengthCriteria: string;
  };
  gauge: Gauge;
  coreMeaning: string;
  advice: string;
  coreMeaningParts?: string[];
  adviceParts?: string[];
}

/** 입 분석 결과 */
export interface MouthAnalysis {
  measures: {
    width: string;
    lipThickness: string;
    cornerSlope: string;
    cornerCriteria: string;
  };
  gauge: Gauge;
  coreMeaning: string;
  advice: string;
  coreMeaningParts?: string[];
  adviceParts?: string[];
}

/** 턱 분석 결과 */
export interface ChinAnalysis {
  measures: {
    length: string;
    width: string;
    angle: string;
    angleCriteria: string;
  };
  gauge: Gauge;
  coreMeaning: string;
  advice: string;
  coreMeaningParts?: string[];
  adviceParts?: string[];
}

/** 관상 분석 결과 (모든 부위) */
export interface FaceAnalysisResult {
  faceShape: FaceShapeAnalysis;
  forehead: ForeheadAnalysis;
  eyes: EyesAnalysis;
  nose: NoseAnalysis;
  mouth: MouthAnalysis;
  chin: ChinAnalysis;
}

/** 메타 정보 */
export interface AnalysisMeta {
  headRoll: number;
  qualityNote: string;
  overallSymmetry: number;
}

/** 사주 정보 */
export interface SajuInfo {
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
  fiveElements: Record<string, number>;
}

/** welstory 메뉴 아이템 */
export interface WelstoryMenuItem {
  name: string;
  desc: string;
  image: string;
  rating?: number;
  corner?: string;
  kcal?: string;
}

/** 추천 메뉴 정보 */
export interface RecommendedMenu {
  index: number;
  menu: WelstoryMenuItem;
  reason: string;
}

/** 총평 (LLM 생성) — 관상 3키 + 체질 풀이(같은 LLM 한 번에 생성) */
export interface TotalReview {
  harmony?: string;       // 부위 간의 조화 및 균형 해석 (관상)
  comprehensive?: string; // 종합 운세 해석 (관상)
  improvement?: string;   // 운을 좋게 만드는 방법 제안 (관상)
  /** 전체 관상 종합 의견 */
  faceOverview?: string;
  /** 취업운 (사주 포함) */
  careerFortune?: string;
  /** 1번 블록: 지금까지 당신이 걸어온 길 (사주 기반 인생 회고) */
  lifeReview?: string;
  /** 3번 블록: 이런 사람과 만나면 좋을 것이다. (사주 기반 만남/궁합) */
  meetingCompatibility?: string;
  /** 체질 풀이 전체 (사주 기반 건강/체질 분석) */
  constitutionSummary?: string;
  /** welstory 오늘의 점심 메뉴 (최대 4개) */
  welstoryMenus?: WelstoryMenuItem[];
  /** LLM 추천 메뉴 */
  recommendedMenu?: RecommendedMenu | null;
}

/** 1단계 응답 (Rule-based) */
export interface Stage1Response {
  success: boolean;
  timestamp: string;
  faceIndex: number;
  faceAnalysis: FaceAnalysisResult;
  meta: AnalysisMeta;
  sajuInfo?: SajuInfo;
}

/** 전체 응답 */
export interface FaceAnalysisApiResponse {
  stage1: Stage1Response | null;
  totalReview: TotalReview | null;
  error?: string;
}

// ============================================================
// API Functions
// ============================================================

/**
 * 관상 분석 API 호출 (비스트리밍, 한 번의 호출로 4키 totalReview 수신)
 */
export async function analyzeFace(
  requestData: {
    timestamp?: string;
    faces: Array<{
      faceIndex: number;
      duration?: number;
      landmarks: Array<{ index: number; x: number; y: number; z?: number }>;
    }>;
    sajuData?: {
      gender: 'male' | 'female';
      calendarType: 'solar' | 'lunar';
      birthDate: string;
      birthTime?: string;
      birthTimeUnknown?: boolean;
    };
    model?: string;
    timeout?: number;
  }
): Promise<FaceAnalysisApiResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.FACEMESH_PERSONAL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        timestamp: requestData.timestamp || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`관상 분석 요청 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '관상 분석 실패');
    }

    const result: FaceAnalysisApiResponse = {
      stage1: {
        success: data.success,
        timestamp: data.timestamp,
        faceIndex: data.faceIndex,
        faceAnalysis: data.faceAnalysis,
        meta: data.meta,
        sajuInfo: data.sajuInfo,
      },
      totalReview: data.totalReview || null,
    };

    return result;
  } catch (error) {
    console.error('❌ 관상 분석 API 오류:', error);
    return {
      stage1: null,
      totalReview: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// ============================================================
// 2-Step Personal API (동시 호출: first + second)
// ============================================================

type FaceRequestData = {
  timestamp?: string;
  faces: Array<{
    faceIndex: number;
    duration?: number;
    landmarks: Array<{ index: number; x: number; y: number; z?: number }>;
  }>;
  sajuData?: {
    gender: 'male' | 'female';
    calendarType: 'solar' | 'lunar';
    birthDate: string;
    birthTime?: string;
    birthTimeUnknown?: boolean;
  };
  model?: string;
  timeout?: number;
};

/** 2차 API 응답 타입 (체질 + 웰스토리) */
export interface FaceSecondApiResponse {
  success: boolean;
  timestamp?: string;
  totalReview: Pick<TotalReview, 'constitutionSummary' | 'welstoryMenus' | 'recommendedMenu'>;
  sajuInfo?: SajuInfo;
  error?: string;
}

/** first-remaining API 응답 (인생회고·방향성·만남) */
export interface FaceFirstRemainingApiResponse {
  success: boolean;
  timestamp?: string;
  totalReview: Pick<TotalReview, 'lifeReview' | 'careerFortune' | 'meetingCompatibility'>;
  error?: string;
}

/**
 * 개인관상 총평만 (first-initial). 완료 시 즉시 결과 페이지 표시용.
 */
export async function analyzeFaceFirstInitial(
  requestData: FaceRequestData
): Promise<FaceAnalysisApiResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.FACEMESH_PERSONAL_FIRST_INITIAL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestData, timestamp: requestData.timestamp || new Date().toISOString() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = (data && typeof data.detail === 'string') ? data.detail : `총평 요청 실패: ${response.status}`;
      throw new Error(msg);
    }
    if (!data.success) throw new Error((data.detail ?? data.error) || '총평 분석 실패');
    return {
      stage1: {
        success: data.success,
        timestamp: data.timestamp,
        faceIndex: data.faceIndex,
        faceAnalysis: data.faceAnalysis,
        meta: data.meta,
        sajuInfo: data.sajuInfo,
      },
      totalReview: data.totalReview || null,
    };
  } catch (error) {
    console.error('❌ 총평(first-initial) API 오류:', error);
    return {
      stage1: null,
      totalReview: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 개인관상 나머지 (first-remaining): 인생회고·방향성·만남 3개 LLM.
 * first-initial과 동시 호출, 백그라운드 병합용.
 */
export async function analyzeFaceFirstRemaining(
  requestData: FaceRequestData
): Promise<FaceFirstRemainingApiResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.FACEMESH_PERSONAL_FIRST_REMAINING, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestData, timestamp: requestData.timestamp || new Date().toISOString() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = (data && typeof data.detail === 'string') ? data.detail : `나머지 관상 요청 실패: ${response.status}`;
      throw new Error(msg);
    }
    if (!data.success) throw new Error((data.detail ?? data.error) || '나머지 관상 분석 실패');
    return {
      success: true,
      timestamp: data.timestamp,
      totalReview: data.totalReview ?? {},
    };
  } catch (error) {
    console.error('❌ 나머지 관상(first-remaining) API 오류:', error);
    return {
      success: false,
      totalReview: {},
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 개인관상 1차 (레거시) — 관상(faceOverview) + 취업(careerFortune) + 인생회고 + 만남 4개 LLM.
 * /second와 동시에 호출하여, 먼저 완료되면 즉시 결과 페이지를 표시한다.
 */
export async function analyzeFaceFirst(
  requestData: FaceRequestData
): Promise<FaceAnalysisApiResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.FACEMESH_PERSONAL_FIRST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestData, timestamp: requestData.timestamp || new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`관상 1차 요청 실패: ${response.status} - ${await response.text()}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || '관상 1차 분석 실패');
    return {
      stage1: { success: data.success, timestamp: data.timestamp, faceIndex: data.faceIndex, faceAnalysis: data.faceAnalysis, meta: data.meta, sajuInfo: data.sajuInfo },
      totalReview: data.totalReview || null,
    };
  } catch (error) {
    console.error('❌ 관상 1차 API 오류:', error);
    return { stage1: null, totalReview: null, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

/**
 * 개인관상 2차 — 체질(constitutionSummary) + 웰스토리 메뉴.
 * /first와 동시에 호출. first보다 늦게 완료되어도 프론트에서 state 병합.
 */
export async function analyzeFaceSecond(
  requestData: FaceRequestData
): Promise<FaceSecondApiResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.FACEMESH_PERSONAL_SECOND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestData, timestamp: requestData.timestamp || new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`체질/메뉴 요청 실패: ${response.status} - ${await response.text()}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || '체질/메뉴 분석 실패');
    return { success: true, timestamp: data.timestamp, totalReview: data.totalReview ?? {}, sajuInfo: data.sajuInfo };
  } catch (error) {
    console.error('❌ 체질/메뉴 2차 API 오류:', error);
    return { success: false, totalReview: {}, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

/** 모임 전체 궁합 API 응답 */
export type GroupOverallApiResponse = {
  success: boolean;
  timestamp?: string;
  members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
  overall: unknown;
};

/** 모임 1:1 궁합 API 응답 */
export type GroupPairsApiResponse = {
  success: boolean;
  timestamp?: string;
  members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
  pairs: unknown[];
};

/**
 * 모임 전체 궁합 API 호출 (개인 관상 analyzeFace와 동일한 패턴, 단일 호출)
 */
export async function analyzeGroupOverall(payload: {
  timestamp?: string;
  groupMembers: unknown[];
  [key: string]: unknown;
}): Promise<GroupOverallApiResponse | { success: false; error: string }> {
  try {
    const res = await fetch(API_ENDPOINTS.FACEMESH_GROUP_OVERALL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.detail ?? '전체 궁합 분석에 실패했습니다.' };
    }
    return {
      success: true,
      timestamp: data.timestamp ?? payload.timestamp ?? '',
      members: data.members ?? [],
      overall: data.overall,
    };
  } catch (error) {
    console.error('❌ 모임 전체 궁합 API 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 모임 1:1 궁합 API 호출 (전체 궁합과 병렬 호출용)
 */
export async function analyzeGroupPairs(payload: {
  timestamp?: string;
  groupMembers: unknown[];
  [key: string]: unknown;
}): Promise<GroupPairsApiResponse | { success: false; error: string }> {
  try {
    const res = await fetch(API_ENDPOINTS.FACEMESH_GROUP_PAIRS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.detail ?? '1:1 궁합 분석에 실패했습니다.' };
    }
    const rawPairs = Array.isArray(data.pairs) ? data.pairs : [];
    const pairs = rawPairs.map((p: Record<string, unknown>) => {
      const romance = Array.isArray(p.romanceLines) ? p.romanceLines : Array.isArray((p as { romance_lines?: string[] }).romance_lines) ? (p as { romance_lines: string[] }).romance_lines : undefined;
      return romance !== undefined ? { ...p, romanceLines: romance } : p;
    });
    return {
      success: true,
      timestamp: data.timestamp ?? payload.timestamp ?? '',
      members: data.members ?? [],
      pairs,
    };
  } catch (error) {
    console.error('❌ 모임 1:1 궁합 API 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * FaceAnalysis 컴포넌트용 features 객체로 변환
 * 
 * API 응답 데이터를 FaceAnalysis 컴포넌트에서 사용하는 형식으로 변환
 */
export function transformToFaceAnalysisFeatures(
  faceAnalysis: FaceAnalysisResult,
  meta: AnalysisMeta
): Record<string, any> {
  return {
    // 공통 품질 정보
    common: {
      qualityScore: Math.round(meta.overallSymmetry),
      qualityLabel: meta.qualityNote,
      headRoll: {
        value: meta.headRoll,
        min: -10,
        max: 10,
        unit: '°',
        summary: meta.qualityNote,
      },
      meanings: [],
    },
    
    // 얼굴형
    faceShape: {
      type: '분석 완료',
      typeSub: '',
      gauge: faceAnalysis.faceShape.gauge,
      measures: faceAnalysis.faceShape.measures,
      oneLineSummary: faceAnalysis.faceShape.advice,
      coreMeaning: faceAnalysis.faceShape.coreMeaning,
      advice: faceAnalysis.faceShape.advice,
      coreMeaningParts: faceAnalysis.faceShape.coreMeaningParts,
      adviceParts: faceAnalysis.faceShape.adviceParts,
      strengths: [],
      cautions: [],
      patterns: { behavior: [], life: [] },
      guide: [],
    },
    
    // 이마
    forehead: {
      title: '이마 분석 · 초년운과 판단력',
      measures: faceAnalysis.forehead.measures,
      gauge: faceAnalysis.forehead.gauge,
      coreMeaning: faceAnalysis.forehead.coreMeaning,
      advice: faceAnalysis.forehead.advice,
      coreMeaningParts: faceAnalysis.forehead.coreMeaningParts,
      adviceParts: faceAnalysis.forehead.adviceParts,
    },
    
    // 눈
    eyes: {
      title: '눈 분석 · 성격과 대인관계',
      measures: faceAnalysis.eyes.measures,
      gauge: faceAnalysis.eyes.gauge,
      coreMeaning: faceAnalysis.eyes.coreMeaning,
      advice: faceAnalysis.eyes.advice,
      coreMeaningParts: faceAnalysis.eyes.coreMeaningParts,
      adviceParts: faceAnalysis.eyes.adviceParts,
    },
    
    // 코
    nose: {
      title: '코 분석 · 재물운과 현실감',
      measures: faceAnalysis.nose.measures,
      gauge: faceAnalysis.nose.gauge,
      coreMeaning: faceAnalysis.nose.coreMeaning,
      advice: faceAnalysis.nose.advice,
      coreMeaningParts: faceAnalysis.nose.coreMeaningParts,
      adviceParts: faceAnalysis.nose.adviceParts,
    },
    
    // 입
    mouth: {
      title: '입 분석 · 신뢰와 애정운',
      measures: faceAnalysis.mouth.measures,
      gauge: faceAnalysis.mouth.gauge,
      coreMeaning: faceAnalysis.mouth.coreMeaning,
      advice: faceAnalysis.mouth.advice,
      coreMeaningParts: faceAnalysis.mouth.coreMeaningParts,
      adviceParts: faceAnalysis.mouth.adviceParts,
    },
    
    // 턱
    chin: {
      title: '턱 분석 · 지구력과 노년운',
      measures: faceAnalysis.chin.measures,
      gauge: faceAnalysis.chin.gauge,
      coreMeaning: faceAnalysis.chin.coreMeaning,
      advice: faceAnalysis.chin.advice,
      coreMeaningParts: faceAnalysis.chin.coreMeaningParts,
      adviceParts: faceAnalysis.chin.adviceParts,
    },
  };
}
