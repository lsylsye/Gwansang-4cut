import type { GroupMember } from "@/types";

/** 2~7명 원형 다이어그램: 인원수별 각도(라디안) 배열. 맨 위(-π/2)부터 시계방향 */
export function getCircleAngles(count: number): number[] {
    const angles: number[] = [];
    for (let i = 0; i < count; i++) {
        angles.push(-Math.PI / 2 + (2 * Math.PI * i) / count);
    }
    return angles;
}

/** 역할 스타일 5종 (인원이 6~7명일 때 인덱스로 순환) */
export const ROLE_STYLE_MAP = [
    { gradientId: "leaderGradient", textColor: "#F59E0B", badge: "⚡", shortLabel: "리더" },
    { gradientId: "centerGradient", textColor: "#6B7280", badge: "🪨", shortLabel: "중심" },
    { gradientId: "balanceGradient", textColor: "#10B981", badge: "🌿", shortLabel: "밸런스" },
    { gradientId: "mediatorGradient", textColor: "#2563EB", badge: "🌊", shortLabel: "중재" },
    { gradientId: "energyGradient", textColor: "#EF4444", badge: "🔥", shortLabel: "에너지" },
] as const;

/** 개인별 포지션 카드용 공통 컬러 팔레트 */
export const MEMBER_CARD_PALETTE = [
    { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", tag: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "text-emerald-600" },
    { badge: "bg-orange-50 text-orange-800 border-orange-200", tag: "bg-orange-50 text-orange-700 border-orange-200", icon: "text-orange-600" },
    { badge: "bg-sky-50 text-sky-800 border-sky-200", tag: "bg-sky-50 text-sky-700 border-sky-200", icon: "text-sky-600" },
    { badge: "bg-indigo-50 text-indigo-800 border-indigo-200", tag: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "text-indigo-600" },
    { badge: "bg-violet-50 text-violet-800 border-violet-200", tag: "bg-violet-50 text-violet-700 border-violet-200", icon: "text-violet-600" },
    { badge: "bg-pink-50 text-pink-800 border-pink-200", tag: "bg-pink-50 text-pink-700 border-pink-200", icon: "text-pink-600" },
    { badge: "bg-rose-50 text-rose-800 border-rose-200", tag: "bg-rose-50 text-rose-700 border-rose-200", icon: "text-rose-600" },
] as const;

/** 모임 궁합 API 응답. overall + pairs 로 전체 화면 데이터 채움 */
export type GroupAnalysisResultProp = {
    success: boolean;
    members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
    groupCombination?: string;
    overall?: {
        personality: { title: string; harmony: string; comprehensive: string };
        compatibility: { score: number };
        teamwork: {
            communication: number;
            speed: number;
            stability: number;
            communicationDetail: string;
            speedDetail: string;
            stabilityDetail: string;
        };
        maintenance: {
            do?: string[];
            dont?: string[];
            maintenanceCards?: Array<{ label: string; title: string; description: string }>;
            problemChild?: { name: string; whySentence?: string; survivalStrategy?: string[]; guidelines: string[] };
            richestPerson?: { name: string; whySentence?: string; detailedReasons?: string[] };
            keyPerson?: { name: string; whySentence?: string; tips?: string[] };
        };
        members: Array<{
            name: string;
            role: string;
            keywords: string[];
            description: string;
            strengths: string[];
            warnings: string[];
        }>;
    };
    pairs?: Array<{
        member1: string;
        member2: string;
        rank: number;
        score: number;
        type: string;
        reason: string;
        summary: string;
        romanceLines?: string[];
        strengths?: string[];
        cautions?: string[];
        tips?: string[];
    }>;
} | null;

/** 전체 궁합 maintenance 블록 타입 */
export interface GroupResultMaintenance {
    do?: string[];
    dont?: string[];
    maintenanceCards?: Array<{ label: string; title: string; description: string }>;
    problemChild?: { name: string; whySentence?: string; survivalStrategy?: string[]; guidelines: string[] };
    richestPerson?: { name: string; whySentence?: string; detailedReasons?: string[] };
    keyPerson?: { name: string; whySentence?: string; tips?: string[] };
}

/** GroupResult 전체 궁합 데이터 소스 (overall에서 파생) */
export interface GroupResultDataSource {
    personality: { title: string; harmony: string; comprehensive: string };
    compatibility: { score: number };
    teamwork: {
        communication: number;
        speed: number;
        stability: number;
        communicationDetail: string;
        speedDetail: string;
        stabilityDetail: string;
    };
    maintenance?: GroupResultMaintenance;
    membersFromApi: Array<{
        name: string;
        role: string;
        keywords: string[];
        description: string;
        strengths: string[];
        warnings: string[];
    }>;
}

export type MemberWithRole = GroupMember & {
    role?: string;
    keywords?: string[];
    description?: string;
    strengths?: string[];
    warnings?: string[];
};

export interface GroupResultProps {
    groupMembers?: GroupMember[];
    groupAnalysisResult?: GroupAnalysisResultProp;
    isAnalyzing?: boolean;
    onViewRanking?: (score: number, defaultName: string) => void;
    onViewRankingViewOnly?: () => void;
    hasRegisteredRanking?: boolean;
    onNavigateToPhotoBooth?: () => void;
    analysisUuid?: string | null;
    hideSsafyCut?: boolean;
}
