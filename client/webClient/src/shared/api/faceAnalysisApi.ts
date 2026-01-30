/**
 * 관상 분석 API 모듈
 * 
 * 2단계 스트리밍 API를 사용하여:
 * 1단계: Rule-based 분석 결과 즉시 수신 (faceAnalysis, sajuInfo, meta)
 * 2단계: LLM 스트리밍 결과 수신 (totalReview)
 */

// AI 서버 URL (환경 변수 또는 기본값) - Flask 서버 (port 8000)
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

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

/** 총평 (LLM 생성) */
export interface TotalReview {
  harmony?: string;       // 부위 간의 조화 및 균형 해석
  comprehensive?: string; // 종합 운세 해석
  improvement?: string;   // 운을 좋게 만드는 방법 제안
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

/** 전체 응답 (1단계 + 2단계) */
export interface FaceAnalysisApiResponse {
  stage1: Stage1Response | null;
  totalReview: TotalReview | null;
  streamingText: string;
  error?: string;
}

/** SSE 이벤트 타입 */
interface SSEEvent {
  stage?: number;
  type?: string;
  data?: any;
  field?: string;
  content?: string;
  error?: string;
}

// ============================================================
// API Functions
// ============================================================

/**
 * 관상 분석 API 호출 (2단계 스트리밍)
 * 
 * @param requestData 요청 데이터 (faces, sajuData 포함)
 * @param onStage1 1단계 결과 콜백 (Rule-based 분석 결과)
 * @param onStreamChunk 스트리밍 청크 콜백 (LLM 응답 텍스트)
 * @param onComplete 완료 콜백 (totalReview)
 * @param onError 에러 콜백
 */
export async function analyzeFaceStreaming(
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
      birthDate: string;  // YYYY-MM-DD
      birthTime?: string; // HH:mm
      birthTimeUnknown?: boolean;
    };
    model?: string;
    timeout?: number;
  },
  onStage1: (data: Stage1Response) => void,
  onStreamChunk: (text: string, field: string) => void,
  onComplete: (totalReview: TotalReview) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${AI_SERVER_URL}/test-api/facemesh/personal/stream`, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // SSE 이벤트 파싱
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 불완전한 마지막 라인 보존

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const event: SSEEvent = JSON.parse(dataStr);

            // 에러 처리
            if (event.error) {
              onError(event.error);
              continue;
            }

            // 1단계: Rule-based 분석 결과
            if (event.stage === 1 && event.type === 'analysis') {
              console.log('📥 1단계 수신: Rule-based 분석 결과');
              onStage1(event.data as Stage1Response);
            }
            
            // 2단계: LLM 스트리밍
            else if (event.stage === 2 && event.type === 'totalReview') {
              if (event.content) {
                onStreamChunk(event.content, event.field || 'unknown');
              }
            }
            
            // 2단계 완료
            else if (event.stage === 2 && event.type === 'complete') {
              console.log('📥 2단계 완료: totalReview');
              onComplete(event.data?.totalReview as TotalReview);
            }
            
            // 전체 완료
            else if (event.type === 'done') {
              console.log('✅ 스트리밍 완료');
            }

          } catch (parseError) {
            console.warn('SSE 파싱 오류:', parseError, dataStr);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ 관상 분석 API 오류:', error);
    onError(error instanceof Error ? error.message : '알 수 없는 오류');
  }
}

/**
 * 관상 분석 API 호출 (비스트리밍 - 기존 방식)
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
    console.log('🔍 관상 분석 시작 (비스트리밍)');

    const response = await fetch(`${AI_SERVER_URL}/test-api/facemesh/personal`, {
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
      streamingText: '',
    };

    console.log('✅ 관상 분석 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 관상 분석 API 오류:', error);
    return {
      stage1: null,
      totalReview: null,
      streamingText: '',
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
      summary: faceAnalysis.faceShape.coreMeaning,
      oneLineSummary: faceAnalysis.faceShape.advice,
      coreMeaning: faceAnalysis.faceShape.coreMeaning,
      advice: faceAnalysis.faceShape.advice,
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
    },
    
    // 눈
    eyes: {
      title: '눈 분석 · 성격과 대인관계',
      measures: faceAnalysis.eyes.measures,
      gauge: faceAnalysis.eyes.gauge,
      coreMeaning: faceAnalysis.eyes.coreMeaning,
      advice: faceAnalysis.eyes.advice,
    },
    
    // 코
    nose: {
      title: '코 분석 · 재물운과 현실감',
      measures: faceAnalysis.nose.measures,
      gauge: faceAnalysis.nose.gauge,
      coreMeaning: faceAnalysis.nose.coreMeaning,
      advice: faceAnalysis.nose.advice,
    },
    
    // 입
    mouth: {
      title: '입 분석 · 신뢰와 애정운',
      measures: faceAnalysis.mouth.measures,
      gauge: faceAnalysis.mouth.gauge,
      coreMeaning: faceAnalysis.mouth.coreMeaning,
      advice: faceAnalysis.mouth.advice,
    },
    
    // 턱
    chin: {
      title: '턱 분석 · 지구력과 노년운',
      measures: faceAnalysis.chin.measures,
      gauge: faceAnalysis.chin.gauge,
      coreMeaning: faceAnalysis.chin.coreMeaning,
      advice: faceAnalysis.chin.advice,
    },
  };
}
