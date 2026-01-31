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
