import { SajuData } from '@/types';
import { API_ENDPOINTS } from './config';
import { devError } from '@/utils/logger';

export interface SajuAnalysisResponse {
  success: boolean;
  result: string;
  sajuData?: Record<string, unknown>;
  myeongriData?: Record<string, unknown>;
  analysisSections?: AnalysisSection[];
  parsedData?: ParsedSajuData;
}

export interface AnalysisSection {
  title: string;
  content: string;
  type: 'physiognomy' | 'constitution' | 'future';
}

export interface ParsedSajuData {
  fourPillars?: string;         // 사주 4주
  fiveElements?: string;        // 오행 분포
  tenGods?: string;             // 십성 분석
  twelveFortunes?: string;      // 12운성
  heavenlyStemsCombination?: string;  // 천간 합
  earthlyBranchesRelation?: string;   // 지지 관계
  totalAnalysis?: string;       // 종합 해석
  summary?: string;             // 한 줄 요약
  score?: number;               // 사주 점수
  prescriptions?: string[];     // 운세 처방
}


/**
 * LLM 결과를 섹션별로 파싱
 */
function parseLLMResult(result: string): ParsedSajuData {
  const parsed: ParsedSajuData = {};
  
  // 섹션별 패턴 매칭
  const sectionPatterns = [
    { key: 'fourPillars', pattern: /###\s*1\)\s*사주\s*4주[\s\S]*?(?=###\s*2\)|$)/i },
    { key: 'fiveElements', pattern: /###\s*2\)\s*오행\s*분포[\s\S]*?(?=###\s*3\)|$)/i },
    { key: 'tenGods', pattern: /###\s*3\)\s*십성[\s\S]*?(?=###\s*4\)|$)/i },
    { key: 'twelveFortunes', pattern: /###\s*4\)\s*12운성[\s\S]*?(?=###\s*5\)|$)/i },
    { key: 'heavenlyStemsCombination', pattern: /###\s*5\)\s*천간\s*합[\s\S]*?(?=###\s*6\)|$)/i },
    { key: 'earthlyBranchesRelation', pattern: /###\s*6\)\s*지지\s*관계[\s\S]*?(?=###\s*7\)|$)/i },
    { key: 'totalAnalysis', pattern: /###\s*7\)\s*종합\s*해석[\s\S]*?(?=###\s*\[한\s*줄|$)/i },
  ];
  
  for (const { key, pattern } of sectionPatterns) {
    const match = result.match(pattern);
    if (match) {
      (parsed as Record<string, string>)[key] = match[0].trim();
    }
  }
  
  // 한 줄 요약 & 점수 파싱
  const summaryMatch = result.match(/###\s*\[한\s*줄\s*요약[\s\S]*?(?=###\s*운을|$)/i);
  if (summaryMatch) {
    parsed.summary = summaryMatch[0].trim();
    
    // 점수 추출
    const scoreMatch = summaryMatch[0].match(/사주\s*점수[:\s]*(\d+)/i);
    if (scoreMatch) {
      parsed.score = parseInt(scoreMatch[1], 10);
    }
  }
  
  // 처방 파싱
  const prescriptionMatch = result.match(/###\s*운을\s*좋게[\s\S]*/i);
  if (prescriptionMatch) {
    const prescriptions: string[] = [];
    const lines = prescriptionMatch[0].split('\n');
    for (const line of lines) {
      if (line.match(/^\d+\.\s*\*\*/)) {
        prescriptions.push(line.trim());
      }
    }
    if (prescriptions.length > 0) {
      parsed.prescriptions = prescriptions;
    }
  }
  
  return parsed;
}

/**
 * 결과 텍스트를 섹션별로 분배
 */
function distributeAnalysisResult(result: string): AnalysisSection[] {
  const sections: AnalysisSection[] = [];
  const lines = result.split('\n\n');

  let currentTitle: string | null = null;
  let currentContent: string[] = [];
  let currentType: 'physiognomy' | 'constitution' | 'future' = 'physiognomy';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 제목 패턴 감지
    if (trimmed.match(/^#{1,3}\s+.+/) || trimmed.match(/^\*\*.+\*\*$/) || trimmed.endsWith(':')) {
      // 이전 섹션 저장
      if (currentTitle && currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
          type: currentType,
        });
      }

      // 새 섹션 시작
      currentTitle = trimmed
        .replace(/^#{1,3}\s+/, '')
        .replace(/\*\*/g, '')
        .replace(':', '');
      currentContent = [];
      currentType = determineSectionType(currentTitle);
    } else {
      currentContent.push(trimmed);
    }
  }

  // 마지막 섹션 저장
  if (currentTitle && currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
      type: currentType,
    });
  }

  // 섹션이 없으면 전체 결과를 하나의 섹션으로
  if (sections.length === 0) {
    sections.push({
      title: '사주 분석 결과',
      content: result,
      type: 'physiognomy',
    });
  }

  return sections;
}

/**
 * 제목을 기반으로 섹션 타입 결정
 */
function determineSectionType(title: string): 'physiognomy' | 'constitution' | 'future' {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('체질') ||
    lowerTitle.includes('오행') ||
    lowerTitle.includes('건강') ||
    lowerTitle.includes('음양')
  ) {
    return 'constitution';
  } else if (
    lowerTitle.includes('미래') ||
    lowerTitle.includes('운세') ||
    lowerTitle.includes('전망') ||
    lowerTitle.includes('예측')
  ) {
    return 'future';
  } else {
    return 'physiognomy';
  }
}

/**
 * 사주 분석 API 호출 (생년월일시만 전송, Python 서버에서 모든 계산 수행)
 */
export async function analyzeSaju(sajuData: SajuData): Promise<SajuAnalysisResponse> {
  try {
    // 생년월일시 파싱 - 다양한 형식 지원 (YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD)
    const dateParts = sajuData.birthDate.split(/[.\-\/]/);
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    
    let hour = 0;
    let minute = 0;
    if (sajuData.birthTime && !sajuData.birthTimeUnknown) {
      const timeParts = sajuData.birthTime.split(':');
      hour = parseInt(timeParts[0], 10) || 0;
      minute = parseInt(timeParts[1], 10) || 0;
    }

    // Python 서버로 생년월일시만 전송
    const aiRequest = {
      year,
      month,
      day,
      hour,
      minute,
      gender: sajuData.gender === 'male' ? '남' : '여',
      calendar: sajuData.calendarType === 'solar' ? '양력' : '음력',
      isLeapMonth: false,
      useRedis: import.meta.env.VITE_USE_REDIS_RAG === 'true', // 환경변수로 Redis 사용 여부 설정
    };

    const response = await fetch(API_ENDPOINTS.SAJU_ANALYZE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`사주 분석 요청 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '사주 분석 실패');
    }

    // 결과를 섹션별로 분배
    const sections = distributeAnalysisResult(data.result);
    
    // LLM 결과 파싱
    const parsedData = parseLLMResult(data.result);

    const result: SajuAnalysisResponse = {
      success: true,
      result: data.result,
      sajuData: data.sajuData,
      myeongriData: data.myeongriData,
      analysisSections: sections,
      parsedData: parsedData,
    };

    return result;
  } catch (error) {
    devError('❌ 사주 분석 API 호출 오류:', error);
    throw error;
  }
}
