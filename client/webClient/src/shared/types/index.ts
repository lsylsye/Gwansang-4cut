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

export interface HistoryItem {
  id: string;
  type: "personal" | "group";
  date: string;
  timestamp: string;
  thumbnail?: string;

  // Personal data
  images?: string[];

  // Group data
  teamName?: string;
  memberCount?: number;
  score?: number;
}

export interface GroupMember {
  id: number;
  name: string;
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  avatar?: string;
  birthTimeUnknown?: boolean;
}
