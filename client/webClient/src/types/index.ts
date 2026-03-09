export type AnalyzeMode = "personal" | "group";

export interface SajuData {
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
  birthTimeUnknown?: boolean;
}

export interface UserProfile {
  name: string;
  profileImage?: string;
}

/** 히스토리 아이템 타입 (개인/단체 공통) */
export interface HistoryItem {
  id: string;
  type: "personal" | "group";
  date: string;
  timestamp: string;
  // 개인 관상용
  images?: string[];
  // 단체 궁합용
  teamName?: string;
  memberCount?: number;
  score?: number;
  thumbnail?: string;
}


/** 오행 분포 (사주 4주 기준 목·화·토·금·수 개수) */
export interface FiveElements {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
}

export interface GroupMember {
  id: number;
  name: string;
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  avatar?: string;
  birthTimeUnknown?: boolean;
  /** 모임 오행 조합(RAG)용 — 백엔드에서 내려주거나, 없으면 데모용으로 생성 */
  fiveElements?: FiveElements;
}

/** 개인/그룹 분석 API 페이로드에 포함되는 메타데이터 (페이스메시·타임스탬프·groupMembers 등) */
export type AnalysisMetadata = Record<string, unknown> | null;
