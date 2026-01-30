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

export interface GroupMember {
  id: number;
  name: string;
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  avatar?: string;
  birthTimeUnknown?: boolean;
}
