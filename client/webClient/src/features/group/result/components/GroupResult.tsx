import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Trophy, Users, UserCheck, AlertTriangle, Sparkles, Award, MessageSquare, ShieldCheck, Calendar, ScrollText, MousePointerClick, Share2, Download } from "lucide-react";
import { GroupMember } from "@/shared/types";
import { CardTitle } from "@/shared/ui/core/card";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { TabNavigation } from "@/shared/components/TabNavigation";
import { Badge } from "@/shared/ui/core/badge";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { RelationMapSidebar, type RelationMapMember } from "./RelationMapSidebar";
import { RelationMapView, type RelationWithLevel } from "./RelationMapView";
import { RelationDetailCard, getRelationLevel, type RelationPairForDetail } from "./RelationDetailCard";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";

// --- Mock Data ---
const GROUP_MOCK_DATA = {
    personality: {
        title: "완벽하게 맞지는 않는데, 이상하게 끊어지지도 않는 모임",
        harmony: "허허, 이 다섯 분의 기운을 자세히 살펴보니 참 묘한 조합이구먼. 완벽하게 맞지는 않는데 이상하게 끊어지지도 않는 모임이오. 각자의 역할이 명확하지만, 서로의 공백을 자연스럽게 메워주는 구조라오. 웃음 포인트는 분명 있소. 누군가는 꼭 정리를 해주고, 누군가는 말 안 해도 분위기를 읽고, 대신 감정 쌓이면 말 안 하고 속으로 삭히는 사람도 있소. 이게 바로 이 모임이 오래 가는 비결이구먼. 완벽하지 않아서 오히려 편안한 거요.",
        comprehensive: "이 모임의 구조를 자세히 분석해보니, 각자의 역할이 명확하게 분담되어 있소. 윤환이 방향을 제시하고 리더십을 발휘하며, 경보가 중심을 유지하고 안정감을 제공하오. 승연은 감정 밸런스를 맞추는 역할을 하고, 현우는 완충과 중재로 갈등을 예방하구먼. 정현은 에너지와 활력을 제공해서 모임에 생기를 불어넣소. 이 구조 자체는 굉장히 좋은 편이오. 누구 하나 빠지면 균형이 깨지는 조합이라, 각자의 존재가 모두 소중하구먼. 다만, 서로의 감정을 제대로 표현하지 않으면 작은 불씨가 커질 수 있으니 주의가 필요하오.",
        improvement: "이 모임이 5년 이상 가려면 딱 세 가지만 지키면 되오. 첫째, 농담은 사람 없을 때 하지 말 것. 특히 정현이의 즉흥적인 농담이 때로는 상대방의 마음에 상처를 줄 수 있으니, 분위기를 잘 읽고 말하도록 하오. 둘째, 결정권은 윤환이나 경보 쪽으로 자연스럽게 넘기면 되오. 이 둘은 현실 감각이 뛰어나고 책임감이 있어서 모임의 방향을 잘 잡을 수 있소. 셋째, 너무 자주 보지 말 것. 월 1~2회가 최적이오. 자주 만나면 오히려 피로가 쌓이고, 간격을 두고 만나면 오히려 오래 가는구먼. 이 세 가지만 지켜도 '편한 모임'으로 오래 가는구먼."
    },
    compatibility: {
        score: 88,
    },
    teamwork: {
        communication: 75,
        speed: 80,
        stability: 85,
        communicationDetail: "이 모임의 커뮤니케이션을 보면, 때때로 말이 어긋나거나 서로의 의도를 제대로 파악하지 못하는 경우가 있소. 특히 정현이의 즉흥적인 발언과 승연이나 현우의 숙성된 표현 사이에 타이밍 차이가 있어서 오해가 생기기도 하구먼. 하지만 기본적으로 서로를 이해하려는 마음은 있어서 큰 갈등으로 번지지는 않소.",
        speedDetail: "속도와 추진력 면에서는 이 모임이 꽤 좋은 편이오. 윤환이나 경보 같은 리더십 있는 멤버들이 방향을 제시하면, 나머지 멤버들도 빠르게 따라가는 구조라오. 결정이 필요할 때도 오래 끌지 않고 빠르게 정리하는 편이구먼. 다만, 너무 빠르게 진행되면 승연이나 현우 같은 신중한 멤버들이 부담을 느낄 수 있으니 주의가 필요하오.",
        stabilityDetail: "안정도와 지속성은 이 모임의 가장 큰 강점이구먼. 각자의 역할이 명확하고, 서로의 공백을 자연스럽게 메워주는 구조라서 모임이 오래 갈 수 있는 기반이 잘 갖춰져 있소. 경보와 윤환이 중심을 잡아주고, 승연과 현우가 완충 역할을 하며, 정현이 활력을 제공하는 구조가 안정적이오. 다만, 감정을 제대로 표현하지 않으면 작은 불씨가 커질 수 있으니 주의가 필요하구먼."
    },
    maintenance: {
        do: [
            "농담은 사람 없을 때 하지 말 것",
            "결정권은 윤환이나 경보 쪽으로 자연스럽게",
            "너무 자주 보지 말 것 (월 1~2회가 최적이오)"
        ],
        dont: [
            "고성으로 싸우기",
            "대놓고 충돌하기",
            "말 줄어들 때 방치하기"
        ]
    },
    members: [
        {
            id: 1,
            name: "이승연",
            birthDate: "1999.01.31",
            gender: "female" as const,
            role: "분위기 조율자",
            keywords: ["공기 흐름", "정서 기준점", "감정 밸런스"],
            roleBadge: "🌿",
            description: "말은 세게 안 해도, 표정·톤으로 다 느끼는 타입. 모임에서 은근히 '정서 기준점' 역할",
            strengths: ["공기 흐름을 잘 읽음"],
            warnings: ["마음 상하면 말 안 하고 거리 둠"]
        },
        {
            id: 2,
            name: "이정현",
            birthDate: "2002.02.15",
            gender: "male" as const,
            role: "에너지 담당",
            keywords: ["즉흥적", "솔직함", "활력"],
            roleBadge: "🔥",
            description: "에너지 담당, 말 많을 때 많고 없을 땐 없음. 즉흥적이고 솔직함",
            strengths: ["모임에 활력"],
            warnings: ["농담이 가끔 선 넘음"]
        },
        {
            id: 3,
            name: "표경보",
            birthDate: "1998.10.17",
            gender: "male" as const,
            role: "현실 담당",
            keywords: ["중심축", "책임감", "안정감"],
            roleBadge: "🪨",
            description: "현실 담당, 중심축. 튀지 않지만 없으면 허전. 말 적어도 신뢰감 있음",
            strengths: ["책임감, 안정감"],
            warnings: ["답답하단 말 들을 수 있음"]
        },
        {
            id: 4,
            name: "정현우",
            birthDate: "1999.10.28",
            gender: "male" as const,
            role: "눈치 + 정보 수집형",
            keywords: ["완충", "중재", "계산"],
            roleBadge: "🌊",
            description: "눈치 + 정보 수집형. 겉으론 무난, 속으로 계산 빠름",
            strengths: ["중재 능력"],
            warnings: ["본심 숨기다 오해받기 쉬움"]
        },
        {
            id: 5,
            name: "박윤환",
            birthDate: "1995.09.15",
            gender: "male" as const,
            role: "형·리더 포지션",
            keywords: ["방향 제시", "결단력", "정리"],
            roleBadge: "⚡",
            description: "형·리더 포지션. 말에 무게가 있음. 분위기 정리하거나 방향 제시 역할",
            strengths: ["결단력"],
            warnings: ["본인은 조언인데 상대는 잔소리로 느낄 수 있음"]
        }
    ],
    pairs: [
        { member1: "표경보", member2: "박윤환", rank: 1, score: 95, type: "best", reason: "둘 다 책임감이 있고 현실 감각이 뛰어나서, 함께 있으면 가장 단단하고 안정적인 궁합이에요. 말을 많이 하지 않아도 서로를 잘 이해해요.", summary: "책임감과 중심 역할이 잘 맞아서, 오래 함께해도 믿고 의지할 수 있는 조합이에요." },
        { member1: "이승연", member2: "표경보", rank: 2, score: 92, type: "best", reason: "말을 많이 하지 않아도 서로 편안하게 지낼 수 있는 궁합이에요. 감정 기복이 거의 없어서 오래 함께해도 안정감이 있어요.", summary: "말 없이도 분위기를 잘 읽어 주고받는 타입이라, 함께 있기만 해도 편해요." },
        { member1: "이승연", member2: "박윤환", rank: 3, score: 88, type: "best", reason: "서로 역할이 겹치지 않아서 의지할 수 있는 현실적인 궁합이에요. 한쪽이 방향을 잡아 주면 다른 쪽이 잘 받쳐 주는 편이에요.", summary: "현실 감각과 감정 밸런스가 잘 맞아서, 모임이나 일에서도 시너지가 나요." },
        { member1: "표경보", member2: "정현우", rank: 4, score: 75, type: "normal", reason: "무난하게 잘 맞지만, 깊게 파고들면 서로 다른 스타일이라 거리감이 생길 수 있어요. 갈등은 거의 없어요.", summary: "일상적으로는 편하게 지내지만, 중요한 결정이 있을 때는 대화를 충분히 나누는 게 좋아요." },
        { member1: "이정현", member2: "표경보", rank: 5, score: 72, type: "normal", reason: "에너지가 넘치는 쪽과 안정감이 있는 쪽이 잘 맞아요. 한쪽이 튀면 다른 쪽이 자연스럽게 잡아 주는 구조예요.", summary: "서로의 성향 차이가 오히려 균형을 만들어 줄 수 있어요. 말이 많고 적고의 차이만 감안하면 돼요." },
        { member1: "이승연", member2: "정현우", rank: 6, score: 70, type: "normal", reason: "말은 잘 통하고 눈치도 빠른 편이라 대화는 편해요. 다만 둘 다 결론을 미루는 스타일이라, 중요한 건 정리해서 말하는 게 좋아요.", summary: "눈치로 맞추다 보면 오해가 쌓일 수 있으니, 가끔은 말로 확인하는 습관이 있으면 좋아요." },
        { member1: "정현우", member2: "박윤환", rank: 7, score: 65, type: "unstable", reason: "일적으로는 잘 맞지만 감정적으로는 거리가 있을 수 있어요. 긴장감이 있는 실무 궁합이라, 사적인 대화를 조금씩 늘려 보는 걸 추천해요.", summary: "업무나 모임에서는 시너지가 나지만, 마음을 열 때는 시간이 조금 더 필요해요." },
        { member1: "이정현", member2: "이승연", rank: 8, score: 60, type: "unstable", reason: "처음엔 케미가 좋지만, 자주 만나면 타이밍이 어긋나면서 피로가 쌓일 수 있어요. 적당한 거리를 두는 게 오래 가는 비결이에요.", summary: "서로의 리듬이 다르다는 걸 인정하고, 만남 빈도를 조절하면 관계가 안정돼요." },
        { member1: "이정현", member2: "정현우", rank: 9, score: 55, type: "unstable", reason: "겉보기보다 불안정한 궁합이에요. 말이나 행동이 오해로 쌓이기 쉬우니, 중요한 건 말로 확인하고 넘어가는 게 좋아요.", summary: "직설적으로 말해도 상처받지 않도록, 서로 존중하는 말투를 쓰는 게 좋아요." },
        { member1: "이정현", member2: "박윤환", rank: 10, score: 45, type: "worst", reason: "전체 조합 중에서도 충돌 가능성이 가장 높은 편이에요. 서로의 방식이 정반대라서, 한쪽만 맞추다 보면 불만이 쌓일 수 있어요.", summary: "서로 다르다는 걸 먼저 인정하고, 작은 것부터 맞춰 보는 게 좋아요. 무리하게 이해하려 하기보다 거리를 두는 것도 방법이에요." }
    ]
};

/** 2~7명 원형 다이어그램: 인원수별 각도(라디안) 배열. 맨 위(-π/2)부터 시계방향 */
function getCircleAngles(count: number): number[] {
    const angles: number[] = [];
    for (let i = 0; i < count; i++) {
        angles.push(-Math.PI / 2 + (2 * Math.PI * i) / count);
    }
    return angles;
}

/** 역할 스타일 5종 (인원이 6~7명일 때 인덱스로 순환) */
const ROLE_STYLE_MAP = [
    { gradientId: "leaderGradient", textColor: "#F59E0B", badge: "⚡", shortLabel: "리더" },
    { gradientId: "centerGradient", textColor: "#6B7280", badge: "🪨", shortLabel: "중심" },
    { gradientId: "balanceGradient", textColor: "#10B981", badge: "🌿", shortLabel: "밸런스" },
    { gradientId: "mediatorGradient", textColor: "#2563EB", badge: "🌊", shortLabel: "중재" },
    { gradientId: "energyGradient", textColor: "#EF4444", badge: "🔥", shortLabel: "에너지" },
] as const;

/** 개인별 포지션 카드용 공통 컬러 팔레트 (역할 배지·키워드 태그 멤버별 색상, 주의 카드 amber와 구분) */
const MEMBER_CARD_PALETTE = [
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
    /** 전체 궁합 (personality, compatibility, teamwork, maintenance, members) */
    overall?: {
        personality: { title: string; harmony: string; comprehensive: string; improvement: string };
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
            do: string[];
            dont: string[];
            maintenanceCards?: Array<{ label: string; title: string; description: string }>;
        };
        members: Array<{
            name: string;
            role: string;
            keywords: string[];
            roleBadge: string;
            description: string;
            strengths: string[];
            warnings: string[];
        }>;
    };
    /** 1대1 궁합 목록 */
    pairs?: Array<{
        member1: string;
        member2: string;
        rank: number;
        score: number;
        type: string;
        reason: string;
        summary: string;
    }>;
} | null;

interface GroupResultProps {
    groupMembers?: GroupMember[];
    /** 모임 궁합 API 응답 (members, groupCombination). 있으면 이 데이터로 렌더링 가능 */
    groupAnalysisResult?: GroupAnalysisResultProp;
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupResult: React.FC<GroupResultProps> = ({
    groupMembers = [],
    groupAnalysisResult = null,
    onViewRanking,
}) => {
    const [currentTab, setCurrentTab] = useState<"overall" | "pairs">("overall");
    const [selectedMemberForRelation, setSelectedMemberForRelation] = useState<string | null>(null);
    const [selectedPairDetail, setSelectedPairDetail] = useState<RelationPairForDetail | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    // 멤버 선택 해제 시 상세창도 닫기
    useEffect(() => {
        if (!selectedMemberForRelation) {
            setSelectedPairDetail(null);
        }
    }, [selectedMemberForRelation]);
    
    // 링크 공유 기능
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    const handleShare = () => {
        setIsShareModalOpen(true);
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('링크가 복사되었습니다!');
        }).catch(() => {
            alert('링크 복사에 실패했습니다.');
        });
    };
    
    // API 응답이 있으면 overall/pairs 사용, 없으면 Mock 사용
    const dataSource = useMemo(() => {
        const o = groupAnalysisResult?.overall;
        if (o?.personality && o?.compatibility && o?.teamwork && o?.maintenance && o?.members) {
            return {
                personality: o.personality,
                compatibility: o.compatibility,
                teamwork: o.teamwork,
                maintenance: o.maintenance,
                membersFromApi: o.members,
            };
        }
        return {
            personality: GROUP_MOCK_DATA.personality,
            compatibility: GROUP_MOCK_DATA.compatibility,
            teamwork: GROUP_MOCK_DATA.teamwork,
            maintenance: GROUP_MOCK_DATA.maintenance,
            membersFromApi: GROUP_MOCK_DATA.members as Array<{ name: string; role: string; keywords: string[]; roleBadge: string; description: string; strengths: string[]; warnings: string[] }>,
        };
    }, [groupAnalysisResult]);

    const handleRegisterRanking = () => {
        if (onViewRanking) {
            onViewRanking(dataSource.compatibility.score, dataSource.personality.title);
        }
    };

    // 실제 멤버 데이터와 역할 데이터 매핑 (API overall.members 또는 Mock)
    const membersWithRoles = useMemo(() => {
        if (groupMembers.length === 0) {
            return dataSource.membersFromApi.map((mock, idx) => ({
                id: (mock as { id?: number }).id ?? idx + 1,
                name: mock.name,
                birthDate: (mock as { birthDate?: string }).birthDate ?? "",
                birthTime: "",
                gender: (mock as { gender?: string }).gender ?? "male",
                avatar: undefined,
                role: mock.role,
                keywords: mock.keywords,
                roleBadge: mock.roleBadge,
                description: mock.description,
                strengths: mock.strengths,
                warnings: mock.warnings,
            }));
        }
        return groupMembers.map((member, idx) => {
            const apiMember = dataSource.membersFromApi[idx];
            const roleData = apiMember ?? dataSource.membersFromApi[idx % dataSource.membersFromApi.length];
            return {
                ...member,
                role: roleData.role,
                keywords: roleData.keywords ?? [],
                roleBadge: roleData.roleBadge ?? "🌟",
                description: roleData.description ?? "",
                strengths: roleData.strengths ?? [],
                warnings: roleData.warnings ?? [],
            };
        });
    }, [groupMembers, dataSource]);

    // 1대1 궁합: API pairs 우선, 없으면 Mock
    const mappedPairs = useMemo(() => {
        const apiPairs = groupAnalysisResult?.pairs;
        if (apiPairs && apiPairs.length > 0) return apiPairs;
        if (groupMembers.length === 0) return GROUP_MOCK_DATA.pairs;
        const nameMap = new Map<string, string>();
        GROUP_MOCK_DATA.members.forEach((mock, idx) => {
            if (groupMembers[idx]) nameMap.set(mock.name, groupMembers[idx].name);
        });
        return GROUP_MOCK_DATA.pairs.map((pair) => ({
            ...pair,
            member1: nameMap.get(pair.member1) ?? pair.member1,
            member2: nameMap.get(pair.member2) ?? pair.member2,
        }));
    }, [groupMembers, groupAnalysisResult?.pairs]);

    // 베스트/워스트 TOP3 (실제 데이터만)
    const bestPairs = useMemo(() => mappedPairs.filter(p => p.type === "best").slice(0, 3), [mappedPairs]);
    const worstPairs = useMemo(() => mappedPairs.filter(p => p.type === "worst" || p.rank >= 8).slice(0, 3), [mappedPairs]);

    // 관계맵용: 멤버 수에 맞춰 누락된 1:1 쌍 보강 (7명이면 선택 시 6명 모두 표시)
    const completePairs = useMemo(() => {
        const names = membersWithRoles.map((m) => m.name);
        const pairKey = (a: string, b: string) => [a, b].sort().join("\0");
        const existingKeys = new Set(mappedPairs.map((p) => pairKey(p.member1, p.member2)));
        const result = [...mappedPairs];
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const key = pairKey(names[i], names[j]);
                if (!existingKeys.has(key)) {
                    result.push({
                        member1: names[i],
                        member2: names[j],
                        rank: 0,
                        score: 65,
                        type: "normal",
                        reason: "추가 분석 데이터가 확보되면 궁합이 표시됩니다.",
                        summary: "보통 수준",
                    });
                    existingKeys.add(key);
                }
            }
        }
        return result;
    }, [mappedPairs, membersWithRoles]);

    // 관계 등급 매핑 함수 (점수 기반)
    const getRelationshipLevel = (score: number): { level: "best" | "good" | "normal" | "caution" | "worst", icon: string, color: string, strokeWidth: number, description: string } => {
        if (score >= 90) return { level: "best", icon: "❤️", color: "#EF4444", strokeWidth: 4, description: "최고" };
        if (score >= 75) return { level: "good", icon: "✅", color: "#10B981", strokeWidth: 3, description: "좋음" };
        if (score >= 60) return { level: "normal", icon: "➖", color: "#94A3B8", strokeWidth: 2, description: "보통" };
        if (score >= 50) return { level: "caution", icon: "⚠️", color: "#F59E0B", strokeWidth: 2.5, description: "주의" };
        return { level: "worst", icon: "❌", color: "#1F2937", strokeWidth: 3, description: "최악" };
    };
    
    // 선택된 멤버의 관계 데이터 (completePairs 사용 → 멤버 N명일 때 상대 N-1명 모두 표시)
    const selectedMemberRelations = useMemo(() => {
        if (!selectedMemberForRelation) return [];
        return completePairs
            .filter(pair => pair.member1 === selectedMemberForRelation || pair.member2 === selectedMemberForRelation)
            .map(pair => {
                const otherMember = pair.member1 === selectedMemberForRelation ? pair.member2 : pair.member1;
                const relationLevel = getRelationshipLevel(pair.score);
                return {
                    ...pair,
                    otherMember,
                    relationLevel
                };
            });
    }, [selectedMemberForRelation, completePairs]);

    // 관계맵 뷰용: relationLevel을 Lucide용으로 변환
    const relationsForMapView = useMemo((): RelationWithLevel[] => {
        return selectedMemberRelations.map((r) => ({
            ...r,
            relationLevel: getRelationLevel(r.score),
        }));
    }, [selectedMemberRelations]);

    // 관계맵 사이드바/맵용 멤버 리스트
    const relationMapMembers = useMemo((): RelationMapMember[] => {
        return membersWithRoles.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            avatar: m.avatar,
        }));
    }, [membersWithRoles]);


    return (
        <div className="w-full max-w-7xl mx-auto pb-20">
            {/* Tab Navigation */}
            <TabNavigation
                tabs={[
                    { id: "overall", label: "전체 궁합", icon: Users },
                    { id: "pairs", label: "1:1 궁합", icon: UserCheck },
                ]}
                activeTab={currentTab}
                onTabChange={(tabId) => setCurrentTab(tabId as "overall" | "pairs")}
                activeColor="orange"
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* 전체 궁합 섹션 */}
                    {currentTab === "overall" && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                            className="py-4 space-y-8"
                        >
                            {/* 궁합 점수 및 랭킹 등록 - 컴팩트 가로형: [원형 점수] | [소제목+문구] | [버튼 우측 중앙] */}
                            <GlassCard className="border-4 border-white rounded-2xl shadow-clay-md p-4 sm:p-5 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                                    {/* 1) 가장 왼쪽: 네오모피즘 스타일 점수 뱃지 */}
                                    <div className="inline-flex items-baseline gap-1.5 shrink-0 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-300">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 tabular-nums leading-none">
                                            {dataSource.compatibility.score}
                                        </span>
                                        <span className="text-sm sm:text-base font-bold text-orange-600 leading-none">점</span>
                                    </div>
                                    {/* 2) 점수 우측: 소제목(손글씨) + 결과 문구(타이틀 폰트) */}
                                    <div className="flex-1 min-w-0 space-y-1.5 sm:pl-1">
                                        <p className="text-xs sm:text-sm text-gray-500 font-hand font-medium">
                                            우리 팀을 한마디로 정리하자면?
                                        </p>
                                        <p className="text-base sm:text-lg md:text-xl text-gray-800 font-display font-bold leading-snug">
                                            "{dataSource.personality.title}"
                                        </p>
                                    </div>
                                    {/* 3) 가장 우측 중앙: 랭킹 등록 버튼 */}
                                    <div className="flex items-center justify-start sm:justify-end shrink-0 self-center">
                                        <ActionButton
                                            variant="orange-primary"
                                            onClick={() => onViewRanking?.(dataSource.compatibility.score, dataSource.personality.title)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold shadow-lg hover:scale-105 transition-all"
                                        >
                                            <Trophy size={14} />
                                            이 점수 랭킹 등록하기
                                        </ActionButton>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* 거북 도사의 총평과 팀워크 분석 - 나란히 정렬 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* 거북 도사의 총평 */}
                                <GlassCard className="flex flex-col p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-gradient-to-br from-white/80 to-orange-50/30 h-full">
                                    <div className="flex items-center gap-4 mb-6 pb-4 flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm">
                                            <ScrollText className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">거북 도사의 총평</h3>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
                                        {/* 1. 모임의 조화 및 균형 해석 */}
                                        <section className="bg-white/50 p-4 rounded-2xl border border-gray-200">
                                            <h4 className="text-gray-800 font-bold text-lg mb-3 font-display flex items-center gap-2">
                                                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm text-orange-600 font-bold">1</span>
                                                모임의 조화 및 균형 해석
                                            </h4>
                                            <p className="text-gray-700 text-base leading-[1.8] font-sans">{dataSource.personality.harmony}</p>
                                        </section>

                                        {/* 2. 종합 궁합 해석 */}
                                        <section className="bg-white/50 p-4 rounded-2xl border border-gray-200">
                                            <h4 className="text-gray-800 font-bold text-lg mb-4 font-display flex items-center gap-2">
                                                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm text-orange-600 font-bold">2</span>
                                                종합 궁합 해석
                                            </h4>
                                            
                                            {/* 조직 분석 인포그래픽 - 원형 구조 */}
                                            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50/30 to-orange-50/30 rounded-xl border border-blue-200/50">
                                                <div className="relative w-full aspect-square max-w-md mx-auto">
                                                    <svg className="w-full h-full" viewBox="0 0 400 400">
                                                        <defs>
                                                            {/* 리더 - 노란색/금색 */}
                                                            <linearGradient id="leaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.9" />
                                                                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.7" />
                                                            </linearGradient>
                                                            {/* 중심 - 회색/갈색 */}
                                                            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.8" />
                                                                <stop offset="100%" stopColor="#6B7280" stopOpacity="0.6" />
                                                            </linearGradient>
                                                            {/* 밸런스 - 초록색 */}
                                                            <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
                                                                <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
                                                            </linearGradient>
                                                            {/* 중재 - 파란색 */}
                                                            <linearGradient id="mediatorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                                                                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.6" />
                                                            </linearGradient>
                                                            {/* 에너지 - 빨간색/주황색 */}
                                                            <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#F87171" stopOpacity="0.9" />
                                                                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.7" />
                                                            </linearGradient>
                                                            {/* 연결선용 그라데이션 */}
                                                            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                                                                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.6" />
                                                            </linearGradient>
                                                            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
                                                                <stop offset="100%" stopColor="#FB923C" stopOpacity="0.6" />
                                                            </linearGradient>
                                                        </defs>
                                                        
                                                        {/* 2~7명 동적 원형 다이어그램 */}
                                                        {(() => {
                                                            const centerX = 200;
                                                            const centerY = 200;
                                                            const count = Math.min(7, Math.max(2, membersWithRoles.length));
                                                            const angles = getCircleAngles(count);
                                                            const radius = count >= 6 ? 115 : 120;
                                                            const nodeR = count >= 6 ? 30 : 35;
                                                            const avatarR = count >= 6 ? 26 : 32;
                                                            const keywordRadius = radius + (count >= 6 ? 20 : 25);
                                                            const keywordFontSize = count >= 6 ? 10 : 12;
                                                            const keywordRectW = count >= 6 ? 54 : 62;
                                                            const keywordRectH = count >= 6 ? 18 : 20;
                                                            const displayMembers = membersWithRoles.slice(0, count);
                                                            
                                                            return (
                                                                <>
                                                                    {/* 연결 원형 선 */}
                                                                    <circle
                                                                        cx={String(centerX)}
                                                                        cy={String(centerY)}
                                                                        r={String(radius)}
                                                                        fill="none"
                                                                        stroke="url(#blueGradient)"
                                                                        strokeWidth="2"
                                                                        strokeDasharray="5,5"
                                                                        opacity="0.4"
                                                                    />
                                                                    {/* 멤버 간 연결선 (인접 노드만) */}
                                                                    {angles.map((_, i) => {
                                                                        const nextIdx = (i + 1) % count;
                                                                        const x1 = centerX + radius * Math.cos(angles[i]);
                                                                        const y1 = centerY + radius * Math.sin(angles[i]);
                                                                        const x2 = centerX + radius * Math.cos(angles[nextIdx]);
                                                                        const y2 = centerY + radius * Math.sin(angles[nextIdx]);
                                                                        const useOrange = i % 2 === 0;
                                                                        return (
                                                                            <line
                                                                                key={`line-${i}`}
                                                                                x1={x1}
                                                                                y1={y1}
                                                                                x2={x2}
                                                                                y2={y2}
                                                                                stroke={useOrange ? "url(#orangeGradient)" : "url(#blueGradient)"}
                                                                                strokeWidth="2"
                                                                                opacity="0.5"
                                                                            />
                                                                        );
                                                                    })}
                                                                    {/* 멤버 노드 */}
                                                                    {displayMembers.map((member, idx) => {
                                                                        const angle = angles[idx];
                                                                        const style = ROLE_STYLE_MAP[idx % ROLE_STYLE_MAP.length];
                                                                        const x = centerX + radius * Math.cos(angle);
                                                                        const y = centerY + radius * Math.sin(angle);
                                                                        const keywords = (member.keywords || []).slice(0, 2);
                                                                        const roleLabel = style.shortLabel;
                                                                        
                                                                        return (
                                                                            <g key={member.id ?? idx}>
                                                                                <defs>
                                                                                    <clipPath id={`avatar-clip-diagram-${member.id ?? idx}`}>
                                                                                        <circle cx={x} cy={y} r={avatarR} />
                                                                                    </clipPath>
                                                                                </defs>
                                                                                <circle
                                                                                    cx={x}
                                                                                    cy={y}
                                                                                    r={nodeR}
                                                                                    fill={`url(#${style.gradientId})`}
                                                                                    stroke="white"
                                                                                    strokeWidth="3"
                                                                                    className="drop-shadow-md"
                                                                                />
                                                                                {member.avatar && member.avatar.trim() !== "" ? (
                                                                                    <image
                                                                                        href={member.avatar}
                                                                                        x={x - avatarR}
                                                                                        y={y - avatarR}
                                                                                        width={avatarR * 2}
                                                                                        height={avatarR * 2}
                                                                                        clipPath={`url(#avatar-clip-diagram-${member.id ?? idx})`}
                                                                                        className="pointer-events-none"
                                                                                    />
                                                                                ) : (
                                                                                    <>
                                                                                        <text x={x} y={y - (count >= 6 ? 8 : 10)} textAnchor="middle" fontSize={count >= 6 ? 24 : 28} className="pointer-events-none">
                                                                                            {style.badge}
                                                                                        </text>
                                                                                        <text x={x} y={y + (count >= 6 ? 8 : 10)} textAnchor="middle" fontSize={count >= 6 ? 14 : 16} fontWeight="bold" fill="white" className="pointer-events-none font-display">
                                                                                            {member.name[0] || "?"}
                                                                                        </text>
                                                                                    </>
                                                                                )}
                                                                                <text
                                                                                    x={x}
                                                                                    y={y + nodeR + (count >= 6 ? 22 : 26)}
                                                                                    textAnchor="middle"
                                                                                    fontSize={count >= 6 ? 13 : 14}
                                                                                    fontWeight="bold"
                                                                                    fill={style.textColor}
                                                                                    className="pointer-events-none font-sans"
                                                                                >
                                                                                    {roleLabel}
                                                                                </text>
                                                                                {keywords.map((keyword, kIdx) => {
                                                                                    const keywordAngle = angle + (kIdx - 0.5) * 0.35;
                                                                                    const kx = centerX + keywordRadius * Math.cos(keywordAngle);
                                                                                    const ky = centerY + keywordRadius * Math.sin(keywordAngle);
                                                                                    return (
                                                                                        <g key={kIdx}>
                                                                                            <rect
                                                                                                x={kx - keywordRectW / 2}
                                                                                                y={ky - keywordRectH / 2}
                                                                                                width={keywordRectW}
                                                                                                height={keywordRectH}
                                                                                                rx="6"
                                                                                                fill="white"
                                                                                                stroke={style.textColor}
                                                                                                strokeWidth="1.5"
                                                                                                opacity="0.9"
                                                                                                className="drop-shadow-sm"
                                                                                            />
                                                                                            <text
                                                                                                x={kx}
                                                                                                y={ky + (count >= 6 ? 4 : 5)}
                                                                                                textAnchor="middle"
                                                                                                fontSize={keywordFontSize}
                                                                                                fill={style.textColor}
                                                                                                className="pointer-events-none font-sans font-medium"
                                                                                            >
                                                                                                {keyword.length > 6 ? keyword.slice(0, 5) + "…" : keyword}
                                                                                            </text>
                                                                                        </g>
                                                                                    );
                                                                                })}
                                                                            </g>
                                                                        );
                                                                    })}
                                                                </>
                                                            );
                                                        })()}
                                                        
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-700 text-base leading-[1.8] font-sans mb-3">{dataSource.personality.comprehensive}</p>
                                            
                                            {/* 핵심 포인트 */}
                                            <div className="mt-4 pt-3 border-t border-gray-200">
                                                <div className="text-xs text-gray-600 mb-2 font-sans font-semibold">핵심 포인트</div>
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-sans font-medium">
                                                        ✅ 역할 분담 명확
                                                    </div>
                                                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-sans font-medium">
                                                        ⚖️ 균형 잡힌 구조
                                                    </div>
                                                    <div className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 font-sans font-medium">
                                                        ⚠️ 감정 표현 중요
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </GlassCard>

                                {/* 팀워크 분석 */}
                                <GlassCard className="flex flex-col border-4 border-white rounded-[32px] shadow-clay-md p-6 sm:p-8 bg-gradient-to-br from-white/80 to-orange-50/30 h-full">
                                    <div className="flex items-center gap-4 mb-6 pb-4 flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm">
                                            <Users className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">팀워크 분석</h3>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
                                        {/* 1. 커뮤니케이션 밀도 */}
                                        <section className="bg-white/50 p-4 rounded-2xl border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-gray-800 font-bold text-lg font-display flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm text-orange-600 font-bold">1</span>
                                                    커뮤니케이션 밀도
                                                </h4>
                                                <div className="inline-flex items-baseline gap-1.5 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-100/50">
                                                    <span className="text-2xl font-extrabold text-orange-600 tabular-nums">{dataSource.teamwork.communication}</span>
                                                    <span className="text-sm font-bold text-orange-500">점</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-base font-hand mb-3">"말이 많아서 문제인가, 적어서 문제인가?"</p>
                                            <p className="text-gray-700 text-base leading-[1.8] font-sans">{dataSource.teamwork.communicationDetail}</p>
                                        </section>

                                        {/* 2. 갈등 발생 시 대응력 */}
                                        <section className="bg-white/50 p-4 rounded-2xl border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-gray-800 font-bold text-lg font-display flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm text-orange-600 font-bold">2</span>
                                                    갈등 발생 시 대응력
                                                </h4>
                                                <div className="inline-flex items-baseline gap-1.5 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-100/50">
                                                    <span className="text-2xl font-extrabold text-orange-600 tabular-nums">{dataSource.teamwork.speed}</span>
                                                    <span className="text-sm font-bold text-orange-500">점</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-base font-hand mb-3">"문제가 생겼을 때 이 팀은 어떻게 반응하는가?"</p>
                                            <p className="text-gray-700 text-base leading-[1.8] font-sans">{dataSource.teamwork.speedDetail}</p>
                                        </section>

                                        {/* 3. 의사결정 구조 */}
                                        <section className="bg-white/50 p-4 rounded-2xl border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-gray-800 font-bold text-lg font-display flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm text-orange-600 font-bold">3</span>
                                                    의사결정 구조
                                                </h4>
                                                <div className="inline-flex items-baseline gap-1.5 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-100/50">
                                                    <span className="text-2xl font-extrabold text-orange-600 tabular-nums">{dataSource.teamwork.stability}</span>
                                                    <span className="text-sm font-bold text-orange-500">점</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-base font-hand mb-3">"누가 말하면 정리가 되는가?"</p>
                                            <p className="text-gray-700 text-base leading-[1.8] font-sans">{dataSource.teamwork.stabilityDetail}</p>
                                        </section>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* 2. 개인별 포지션 - 타이틀 아이콘 스타일 통일(팀워크/모임 오래 섹션과 동일) */}
                            <div className="mt-8">
                                <div className="flex items-center gap-4 pb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm">
                                        <Award className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">개인별 포지션</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {membersWithRoles.map((member, idx) => (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.1 }}
                                        >
                                            <div className="p-4 h-full min-h-[280px] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                                                    {member.avatar && member.avatar.trim() !== "" ? (
                                                        <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 relative">
                                                            <ImageWithFallback
                                                                src={member.avatar}
                                                                alt={member.name}
                                                                className="w-full h-full object-cover"
                                                                onError={() => {}}
                                                            />
                                                            <div className="absolute inset-0 w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-lg opacity-0 pointer-events-none image-fallback">
                                                                {member.name[0] || "?"}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-lg border border-slate-200 flex-shrink-0">
                                                            {member.name[0] || "?"}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h4 className="font-bold text-slate-900 text-lg font-display truncate min-w-0">{member.name}</h4>
                                                            {(() => {
                                                                const palette = MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length];
                                                                return (
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <Award className="w-5 h-5 flex-shrink-0 text-orange-600" />
                                                                        <Badge variant="outline" className={`text-xs font-medium px-2.5 py-0.5 rounded-md border ${palette.badge}`}>
                                                                            {member.role}
                                                                        </Badge>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
                                                    {(() => {
                                                        const palette = MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length];
                                                        return member.keywords.map((keyword, kIdx) => (
                                                            <Badge key={kIdx} variant="secondary" className={`text-xs font-medium px-2 py-0.5 rounded-md border ${palette.tag}`}>
                                                                {keyword}
                                                            </Badge>
                                                        ));
                                                    })()}
                                                </div>
                                                <p className="text-sm text-slate-600 font-sans leading-relaxed bg-slate-50/80 p-2.5 rounded-lg line-clamp-2 flex-1 min-h-0">{member.description}</p>
                                                <div className="space-y-1.5 text-sm pt-3 border-t border-slate-100 flex-shrink-0">
                                                    <div className="flex items-center gap-2 bg-emerald-50 rounded-lg border border-emerald-100 py-1.5 px-2.5 min-w-0">
                                                        <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 font-sans flex-shrink-0">장점</span>
                                                        <span className="text-emerald-700/80 flex-shrink-0 mx-0.5 font-sans">·</span>
                                                        <span className="font-hand text-emerald-800 text-sm leading-snug truncate min-w-0">{member.strengths[0]}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-amber-50 rounded-lg border border-amber-100 py-1.5 px-2.5 min-w-0">
                                                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 font-sans flex-shrink-0">주의</span>
                                                        <span className="text-amber-700/80 flex-shrink-0 mx-0.5 font-sans">·</span>
                                                        <span className="font-hand text-amber-900 text-sm leading-snug truncate min-w-0">{member.warnings[0]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                </motion.div>
                                    ))}
                            </div>
                        </div>

                            {/* 모임을 오래 가게 만드는 방법 - 공통 스타일(GlassCard·팀워크 분석 톤) */}
                            <GlassCard className="flex flex-col border-4 border-white rounded-[32px] shadow-clay-md p-6 sm:p-8 bg-gradient-to-br from-white/80 to-orange-50/30 h-full mt-8">
                                <div className="flex items-center gap-4 mb-6 pb-4 flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm">
                                        <Sparkles className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">모임을 오래 가게 만드는 방법</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                                    {(() => {
                                        const cards = dataSource.maintenance.maintenanceCards;
                                        const icons = [MessageSquare, ShieldCheck, Calendar];
                                        const fallbacks = [
                                            { label: "소통", title: "농담은 당사자 앞에서만", description: "분위기를 읽고 말할 때만 유쾌해요." },
                                            { label: "리더십", title: "결정은 함께", description: "현실 감각과 책임감 있는 쪽이 방향을 잡아요." },
                                            { label: "빈도", title: "만남은 월 1~2회", description: "피로 방지 · 오래 가는 비결" },
                                        ];
                                        const list = cards && cards.length >= 3 ? cards.slice(0, 3) : fallbacks;
                                        return list.map((card, i) => {
                                            const Icon = icons[i] ?? Calendar;
                                            return (
                                                <section key={card.label} className="flex items-center gap-3 p-4 min-h-[120px] bg-white/50 rounded-2xl border border-gray-200">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-orange-600 font-sans mb-0.5">{card.label}</p>
                                                        <p className="text-sm font-bold text-gray-800 font-display mb-1">{card.title}</p>
                                                        <p className="text-xs text-gray-600 font-sans leading-snug">{card.description}</p>
                                                    </div>
                                                </section>
                                            );
                                        });
                                    })()}
                                </div>
                            </GlassCard>
            </motion.div>
                    )}

                    {/* 1:1 궁합 섹션 */}
                    {currentTab === "pairs" && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                            className="space-y-8"
                        >

                            {/* 관계맵 - 개인별 포지션 스타일 통일 */}
                            <div className="mt-8">
                                <div className="flex items-center gap-4 pb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm">
                                        <UserCheck className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">관계맵</h3>
                                    {selectedMemberForRelation && (
                                        <motion.div 
                                            className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-50 text-brand-orange rounded-xl text-sm font-medium border border-orange-200 shadow-sm"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <motion.span 
                                                className="inline-flex" 
                                                aria-hidden
                                                animate={{ 
                                                    y: [0, -3, 0],
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            >
                                                <MousePointerClick className="w-4 h-4" strokeWidth={2.5} />
                                            </motion.span>
                                            <span>상대 프로필을 클릭하면 상세 궁합을 확인할 수 있어요.</span>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="flex flex-col lg:flex-row gap-4">
                                        <RelationMapSidebar
                                            members={relationMapMembers}
                                            selectedName={selectedMemberForRelation}
                                            onSelect={setSelectedMemberForRelation}
                                        />
                                        <div className="flex-1 min-w-0 flex flex-col gap-4">
                                            <RelationMapView
                                                members={relationMapMembers}
                                                selectedMemberForRelation={selectedMemberForRelation}
                                                relations={relationsForMapView}
                                                selectedPair={selectedPairDetail ? { member1: selectedPairDetail.member1, member2: selectedPairDetail.member2 } : null}
                                                onSelectPair={setSelectedPairDetail}
                                            />
                                            {selectedPairDetail && (
                                                <RelationDetailCard
                                                    pair={selectedPairDetail}
                                                    avatar1={relationMapMembers.find((m) => m.name === selectedPairDetail.member1)?.avatar}
                                                    avatar2={relationMapMembers.find((m) => m.name === selectedPairDetail.member2)?.avatar}
                                                />
                                            )}
                                        </div>
                                    </div>
                            </div>


                            {/* 베스트/워스트 TOP3 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* 베스트 TOP3 — 파란색 계열(공통 컬러) */}
                                <GlassCard className="border-4 border-white rounded-[32px] shadow-clay-md p-6 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/30">
                                    <div className="flex items-center gap-3 mb-4 pb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-sky-400/30 to-blue-400/20 border-2 border-sky-400 rounded-xl flex items-center justify-center shadow-sm">
                                            <Trophy className="w-6 h-6 text-sky-600" />
                                        </div>
                                        <CardTitle className="text-xl font-bold text-gray-900 font-display">베스트 TOP3</CardTitle>
                                    </div>
                                    <div className="space-y-4">
                                        {bestPairs.map((pair, idx) => (
                                            <motion.div
                                                key={`${pair.member1}-${pair.member2}`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.1 }}
                                                className="p-5 bg-gradient-to-br from-sky-50 to-blue-50/80 rounded-2xl border-2 border-sky-200 shadow-sm hover:shadow-md transition-all relative"
                                            >
                                                {/* 순위 뱃지 */}
                                                <div className="absolute -top-2 -left-2 z-10">
                                                    <Badge 
                                                        variant="default"
                                                        className="text-sm font-bold px-3 py-1 rounded-full shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-blue-50 border-blue-700"
                                                    >
                                                        {pair.rank}위
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-10 w-14 shrink-0 flex items-center" aria-hidden>
                                                            <div className="absolute left-0 top-0 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-0">
                                                                {(() => {
                                                                    const m1 = relationMapMembers.find(m => m.name === pair.member1);
                                                                    return m1?.avatar?.trim() ? (
                                                                        <img src={m1.avatar} alt={pair.member1} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{pair.member1[0] ?? "?"}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="absolute left-5 top-0 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-10">
                                                                {(() => {
                                                                    const m2 = relationMapMembers.find(m => m.name === pair.member2);
                                                                    return m2?.avatar?.trim() ? (
                                                                        <img src={m2.avatar} alt={pair.member2} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{pair.member2[0] ?? "?"}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-gray-900 font-display text-lg">{pair.member1} ↔ {pair.member2}</span>
                                                    </div>
                                                    <div className="inline-flex items-baseline gap-1.5 rounded-2xl bg-sky-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-sky-100/50">
                                                        <span className="text-2xl font-extrabold text-sky-600 tabular-nums">{pair.score}</span>
                                                        <span className="text-sm font-bold text-sky-500">점</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-800 mb-2 font-sans leading-relaxed">{pair.reason}</p>
                                                <p className="text-xs text-gray-600 font-sans leading-relaxed bg-white/60 p-2 rounded-lg">{pair.summary}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlassCard>

                                {/* 워스트 TOP3 — 그레이톤 */}
                                <GlassCard className="border-4 border-white rounded-[32px] shadow-clay-md p-6 bg-gradient-to-br from-slate-50/50 via-white to-slate-100/30">
                                    <div className="flex items-center gap-3 mb-4 pb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-300/50 to-slate-400/30 border-2 border-slate-400 rounded-xl flex items-center justify-center shadow-sm">
                                            <AlertTriangle className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <CardTitle className="text-xl font-bold text-gray-900 font-display">워스트 TOP3</CardTitle>
                                    </div>
                                    <div className="space-y-4">
                                        {worstPairs.map((pair, idx) => (
                                            <motion.div
                                                key={`${pair.member1}-${pair.member2}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.1 }}
                                                className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all relative"
                                            >
                                                {/* 순위 뱃지 */}
                                                <div className="absolute -top-2 -left-2 z-10">
                                                    <Badge 
                                                        variant="default"
                                                        className="text-sm font-bold px-3 py-1 rounded-full shadow-md bg-gradient-to-br from-gray-500 to-gray-600 text-gray-50 border-gray-700"
                                                    >
                                                        {idx + 1}위
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-10 w-14 shrink-0 flex items-center" aria-hidden>
                                                            <div className="absolute left-0 top-0 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-0">
                                                                {(() => {
                                                                    const m1 = relationMapMembers.find(m => m.name === pair.member1);
                                                                    return m1?.avatar?.trim() ? (
                                                                        <img src={m1.avatar} alt={pair.member1} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{pair.member1[0] ?? "?"}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="absolute left-5 top-0 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-10">
                                                                {(() => {
                                                                    const m2 = relationMapMembers.find(m => m.name === pair.member2);
                                                                    return m2?.avatar?.trim() ? (
                                                                        <img src={m2.avatar} alt={pair.member2} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{pair.member2[0] ?? "?"}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-gray-900 font-display text-lg">{pair.member1} ↔ {pair.member2}</span>
                                                    </div>
                                                    <div className="inline-flex items-baseline gap-1.5 rounded-2xl bg-slate-100 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-slate-200/50">
                                                        <span className="text-2xl font-extrabold text-slate-600 tabular-nums">{pair.score}</span>
                                                        <span className="text-sm font-bold text-slate-500">점</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-800 mb-2 font-sans leading-relaxed">{pair.reason}</p>
                                                <p className="text-xs text-gray-600 font-sans leading-relaxed bg-white/60 p-2 rounded-lg">{pair.summary}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </div>

                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
            
            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-16 pb-10 no-capture">
                <ActionButton variant="secondary" onClick={handleShare} className="flex items-center gap-2 bg-white">
                    <Share2 size={20} /> 링크 공유하기
                </ActionButton>
                <ActionButton 
                    variant="orange-primary" 
                    onClick={handleRegisterRanking} 
                    className="flex items-center gap-2"
                >
                    <Trophy size={20} /> 랭킹 등록하기
                </ActionButton>
            </div>
            
            {/* 링크 공유 모달 */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} size="md">
                <ModalHeader description="QR 코드를 스캔하거나 링크를 공유하세요">
                    결과 공유하기
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-clay-sm border-4 border-brand-orange-muted">
                            <img 
                                src={qrCodeUrl} 
                                alt="QR Code" 
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            QR 코드를 스캔하면 결과 페이지로 이동합니다
                        </p>
                        <div className="flex gap-3 w-full">
                            <ActionButton 
                                variant="secondary" 
                                onClick={handleCopyLink}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                링크 복사
                            </ActionButton>
                            <ActionButton 
                                variant="orange-primary" 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = 'qr-code.png';
                                    link.href = qrCodeUrl;
                                    link.click();
                                }}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> QR 저장
                            </ActionButton>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};
