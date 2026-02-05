import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Trophy, Users, UserCheck, AlertTriangle, Sparkles, Award, MessageSquare, ShieldCheck, Calendar, ScrollText, MousePointerClick, Share2, Download, Loader2, Images } from "lucide-react";
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
import { saveGroupAnalysis, type GroupAnalysisData } from "@/shared/api/groupAnalysisApi";
import { useIsMobile } from "@/shared/lib/hooks/use-mobile";

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
            do?: string[];
            dont?: string[];
            maintenanceCards?: Array<{ label: string; title: string; description: string }>;
            /** 문제아 한 명 + 선정 이유 한 줄 + 생존 전략 2~4가지 + 모임이 오래 가려면 고칠 점 3~4가지 */
            problemChild?: { name: string; whySentence?: string; survivalStrategy?: string[]; guidelines: string[] };
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
    /** 1대1 궁합 목록 */
    pairs?: Array<{
        member1: string;
        member2: string;
        rank: number;
        score: number;
        type: string;
        reason: string;
        summary: string;
        /** 연애 궁합 3줄 (API: romanceLines 또는 romance_lines) */
        romanceLines?: string[];
    }>;
} | null;

interface GroupResultProps {
    groupMembers?: GroupMember[];
    /** 모임 궁합 API 응답 (members, groupCombination). 있으면 이 데이터로 렌더링 가능 */
    groupAnalysisResult?: GroupAnalysisResultProp;
    /** 분석 진행 중 여부. true이고 overall 미도착 시 로딩 표시(더미 미사용) */
    isAnalyzing?: boolean;
    onViewRanking?: (score: number, defaultName: string) => void;
    /** 이미 랭킹 등록된 상태에서 '랭킹 보기' 클릭 시 (등록 폼 없이 목록만) */
    onViewRankingViewOnly?: () => void;
    /** 랭킹 등록 완료 여부 (버튼 문구: '랭킹 보기' vs '랭킹 등록하기') */
    hasRegisteredRanking?: boolean;
    /** 탭 변경 시 TurtleGuide 멘트용 (App에서 구독) */
    onTabChange?: (tab: "overall" | "pairs" | "ssafy-cut") => void;
    /** 싸피네컷(네컷) 페이지로 이동 (개인 결과처럼 결과 페이지에서 진입용) */
    onNavigateToPhotoBooth?: () => void;
}

export const GroupResult: React.FC<GroupResultProps> = ({
    groupMembers = [],
    groupAnalysisResult = null,
    isAnalyzing = false,
    onViewRanking,
    onViewRankingViewOnly,
    hasRegisteredRanking = false,
    onTabChange,
    onNavigateToPhotoBooth,
}) => {
    const [currentTab, setCurrentTab] = useState<"overall" | "pairs" | "ssafy-cut">("overall");
    const [selectedMemberForRelation, setSelectedMemberForRelation] = useState<string | null>(null);
    const [selectedPairDetail, setSelectedPairDetail] = useState<RelationPairForDetail | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const isMobile = useIsMobile();

    const hasOverall = Boolean(
        groupAnalysisResult?.overall &&
        (groupAnalysisResult.overall as { personality?: unknown; compatibility?: unknown; teamwork?: unknown; maintenance?: unknown; members?: unknown[] }).personality &&
        (groupAnalysisResult.overall as { members?: unknown[] }).members
    );

    if (!hasOverall && isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
                <Loader2 className="w-12 h-12 text-brand-orange animate-spin" aria-hidden />
                <p className="text-base font-medium text-gray-700">모임 궁합 분석 중...</p>
                <p className="text-sm text-gray-500">잠시만 기다려 주세요.</p>
            </div>
        );
    }
    if (!hasOverall) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
                <AlertTriangle className="w-12 h-12 text-amber-500" aria-hidden />
                <p className="text-base font-medium text-gray-700">결과가 아직 없어요.</p>
                <p className="text-sm text-gray-500">모임 궁합 분석을 먼저 진행해 주세요.</p>
            </div>
        );
    }
    /** 모임 궁합용 싸피네컷 저장 이미지 (photoBoothSets_group) */
    const [savedGroupFrameImage, setSavedGroupFrameImage] = useState<string | null>(null);
    /** 저장 중 로딩 상태 */
    const [isSavingShare, setIsSavingShare] = useState(false);
    /** 저장된 UUID */
    const [savedUuid, setSavedUuid] = useState<string | null>(null);

    // 모임용 싸피네컷 저장 이미지 로드
    useEffect(() => {
        try {
            const saved = localStorage.getItem("photoBoothSets_group");
            if (saved) {
                const sets = JSON.parse(saved);
                if (sets.length > 0 && sets[0].frameImage) {
                    setSavedGroupFrameImage(sets[0].frameImage);
                }
            }
        } catch (error) {
            console.error("Failed to load group frame image:", error);
        }
    }, [currentTab]);
    // 멤버 선택 해제 시 상세창도 닫기
    useEffect(() => {
        if (!selectedMemberForRelation) {
            setSelectedPairDetail(null);
        }
    }, [selectedMemberForRelation]);

    // 탭 변경 시 상위(App)에 알려 TurtleGuide 멘트 갱신
    useEffect(() => {
        onTabChange?.(currentTab);
    }, [currentTab, onTabChange]);
    
    // 링크 공유 기능 (저장 후 UUID로 공유 URL 생성)
    const shareUrl = savedUuid 
        ? `${window.location.origin}/group/share/${savedUuid}`
        : `${window.location.origin}${window.location.pathname}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    
    const handleShare = async () => {
        if (isSavingShare) return;
        
        // 이미 저장된 UUID가 있으면 바로 모달 열기
        if (savedUuid) {
            setIsShareModalOpen(true);
            return;
        }
        
        setIsSavingShare(true);
        
        try {
            // 저장할 데이터 구성 (싸피네컷 제외)
            const saveData: GroupAnalysisData = {
                teamName: dataSource.personality?.title || '모임 궁합 분석',
                memberCount: groupMembers.length || membersWithRoles.length,
                score: dataSource.compatibility?.score,
                members: membersWithRoles.map((m) => ({
                    id: m.id,
                    name: m.name,
                    birthDate: m.birthDate,
                    birthTime: m.birthTime,
                    gender: m.gender as string,
                    avatar: m.avatar,
                    role: m.role,
                    keywords: m.keywords,
                    description: m.description,
                    strengths: m.strengths,
                    warnings: m.warnings,
                })),
                overallAnalysis: {
                    personality: dataSource.personality,
                    compatibility: dataSource.compatibility,
                    teamwork: dataSource.teamwork,
                    maintenance: dataSource.maintenance,
                    members: dataSource.membersFromApi,
                },
                pairsAnalysis: completePairs.map((p) => ({
                    name1: p.member1,
                    name2: p.member2,
                    score: p.score,
                    summary: p.summary,
                    strengths: p.strengths,
                    cautions: p.cautions,
                    tips: p.tips,
                })),
            };
            
            console.log('📦 저장할 단체 분석 데이터:', saveData);
            
            // API 호출하여 저장
            const uuid = await saveGroupAnalysis(saveData);
            
            // UUID 저장
            setSavedUuid(uuid);
            
            // 모달 열기
            setIsShareModalOpen(true);
        } catch (error) {
            console.error('단체 분석 결과 저장 실패:', error);
            alert('분석 결과 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSavingShare(false);
        }
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('링크가 복사되었습니다!');
        }).catch(() => {
            alert('링크 복사에 실패했습니다.');
        });
    };
    
    // API 응답이 있으면 overall 사용, 없으면 null (결과 없음 화면 표시)
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
        return null;
    }, [groupAnalysisResult]);

    const handleRegisterRanking = () => {
        if (dataSource && onViewRanking) {
            onViewRanking(Number(dataSource.compatibility?.score) || 0, dataSource.personality.title);
        }
    };

    /** 랭킹 버튼 클릭: 이미 등록됐으면 '랭킹 보기', 아니면 '랭킹 등록하기' 플로우 */
    const handleRankingButtonClick = () => {
        if (hasRegisteredRanking) {
            onViewRankingViewOnly?.();
        } else {
            handleRegisterRanking();
        }
    };

    // 실제 멤버 데이터와 역할 데이터 매핑 (API overall.members만 사용)
    const membersWithRoles = useMemo(() => {
        if (!dataSource?.membersFromApi?.length) return [];
        if (groupMembers.length === 0) {
            return dataSource.membersFromApi.map((m, idx) => ({
                id: (m as { id?: number }).id ?? idx + 1,
                name: m.name,
                birthDate: (m as { birthDate?: string }).birthDate ?? "",
                birthTime: "",
                gender: (m as { gender?: string }).gender ?? "male",
                avatar: undefined,
                role: m.role,
                keywords: m.keywords ?? [],
                description: m.description ?? "",
                strengths: m.strengths ?? [],
                warnings: m.warnings ?? [],
            }));
        }
        return groupMembers.map((member, idx) => {
            const apiMember = dataSource.membersFromApi[idx];
            const roleData = apiMember ?? dataSource.membersFromApi[idx % dataSource.membersFromApi.length];
            return {
                ...member,
                role: roleData.role,
                keywords: roleData.keywords ?? [],
                description: roleData.description ?? "",
                strengths: roleData.strengths ?? [],
                warnings: roleData.warnings ?? [],
            };
        });
    }, [groupMembers, dataSource]);

    // 1대1 궁합: API pairs만 사용 (없으면 빈 배열)
    const mappedPairs = useMemo(() => {
        const apiPairs = groupAnalysisResult?.pairs;
        if (apiPairs && Array.isArray(apiPairs) && apiPairs.length > 0) return apiPairs;
        return [];
    }, [groupAnalysisResult?.pairs]);

    // 베스트/워스트 TOP3: 2명(1쌍)·3명(3쌍)은 50점 기준, 4명 이상은 점수 등수대로
    const THRESHOLD = 50;
    const bestPairs = useMemo(() => {
        if (mappedPairs.length <= 3) {
            return mappedPairs.filter(p => (p.score ?? 0) >= THRESHOLD).slice(0, 3);
        }
        return [...mappedPairs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
    }, [mappedPairs]);
    const worstPairs = useMemo(() => {
        if (mappedPairs.length <= 3) {
            return mappedPairs.filter(p => (p.score ?? 0) < THRESHOLD).slice(0, 3);
        }
        return [...mappedPairs].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3);
    }, [mappedPairs]);

    // 관계맵용: 멤버 수에 맞춰 누락된 1:1 쌍 보강 (7명이면 선택 시 6명 모두 표시)
    const completePairs = useMemo((): RelationPairForDetail[] => {
        const names = membersWithRoles.map((m) => m.name);
        const pairKey = (a: string, b: string) => [a, b].sort().join("\0");
        const existingKeys = new Set(mappedPairs.map((p) => pairKey(p.member1, p.member2)));
        const result: RelationPairForDetail[] = [...mappedPairs];
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

    // 분석 데이터 없음 → 결과 없음 화면
    if (!dataSource) {
        return (
            <div
                className="w-full min-w-0 mx-auto box-border"
                style={{
                    maxWidth: "var(--content-max-width)",
                    paddingLeft: "var(--content-px)",
                    paddingRight: "var(--content-px)",
                    paddingBottom: "var(--content-pb)",
                }}
            >
                <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-4 text-center">
                    <Users className="w-16 h-16 text-gray-300 mb-4" aria-hidden />
                    <h2 className="text-xl font-bold text-gray-800 font-display mb-2">결과 없음</h2>
                    <p className="text-gray-500 font-sans text-sm sm:text-base leading-relaxed">
                        분석된 데이터가 없습니다.
                        <br />
                        모임 궁합을 다시 분석해 주세요.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full min-w-0 mx-auto box-border"
            style={{
                maxWidth: "var(--content-max-width)",
                paddingLeft: "var(--content-px)",
                paddingRight: "var(--content-px)",
                paddingBottom: "var(--content-pb)",
            }}
        >
            {/* Tab Navigation - 탭과 콘텐츠 모두 동일한 패딩 안에서 전체 너비 사용 */}
            <TabNavigation
                tabs={[
                    { id: "overall", label: "전체 궁합", icon: Users },
                    { id: "pairs", label: "1:1 궁합", icon: UserCheck },
                    { id: "ssafy-cut", label: "싸피네컷", icon: Images },
                ]}
                activeTab={currentTab}
                onTabChange={(tabId) => setCurrentTab(tabId as "overall" | "pairs" | "ssafy-cut")}
                activeColor="orange"
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="w-full min-w-0"
                >
                    {/* 전체 궁합 섹션 */}
                    {currentTab === "overall" && (
                        isMobile ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                                className="space-y-0 w-full max-w-full"
                                style={{ paddingTop: "var(--flow-block)", paddingBottom: "var(--flow-block)" }}
                            >
                                {/* 모바일: 소제목 → 본문 → 컴포넌트 문서형 (대시보드 카드 없음), 텍스트가 너비에 맞게 채워짐 */}
                                <section className="section-flow">
                                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-title w-full">우리 팀 궁합</h2>
                                    <div className="flex flex-col flow-gap-y w-full max-w-full">
                                        <div className="inline-flex items-baseline gap-1.5 shrink-0 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-300 w-fit">
                                            <span className="text-2xl font-extrabold text-orange-600 tabular-nums leading-none">
                                                {typeof dataSource.compatibility?.score === "number" ? dataSource.compatibility.score : "-"}
                                            </span>
                                            <span className="text-sm font-bold text-orange-600 leading-none">점</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-hand font-medium w-full">우리 팀을 한마디로 정리하자면?</p>
                                        <p className="text-base text-gray-800 font-display font-bold leading-snug w-full break-keep">"{dataSource.personality.title}"</p>
                                        <ActionButton
                                            variant="orange-primary"
                                            onClick={handleRankingButtonClick}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold w-fit"
                                        >
                                            <Trophy size={14} />
                                            {hasRegisteredRanking ? "랭킹 보기" : "이 점수 랭킹 등록하기"}
                                        </ActionButton>
                                    </div>
                                </section>
                                <section className="section-flow">
                                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">거북도사의 총평</h2>
                                    <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title mt-4 w-full">1. 모임의 조화 및 균형 해석</h3>
                                    <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.personality.harmony}</p>
                                    <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title mt-4 w-full">2. 종합 궁합 해석</h3>
                                    <div className="flow-mb-block p-3 bg-gray-50 rounded-xl border border-gray-200 w-full max-w-full">
                                        <div className="relative w-full aspect-square max-w-[min(260px,100%)] mx-auto">
                                            <svg className="w-full h-full" viewBox="0 0 400 400">
                                                <defs>
                                                    <linearGradient id="leaderGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D" stopOpacity="0.9" /><stop offset="100%" stopColor="#F59E0B" stopOpacity="0.7" /></linearGradient>
                                                    <linearGradient id="centerGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.8" /><stop offset="100%" stopColor="#6B7280" stopOpacity="0.6" /></linearGradient>
                                                    <linearGradient id="balanceGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34D399" stopOpacity="0.8" /><stop offset="100%" stopColor="#10B981" stopOpacity="0.6" /></linearGradient>
                                                    <linearGradient id="mediatorGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" /><stop offset="100%" stopColor="#2563EB" stopOpacity="0.6" /></linearGradient>
                                                    <linearGradient id="energyGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F87171" stopOpacity="0.9" /><stop offset="100%" stopColor="#EF4444" stopOpacity="0.7" /></linearGradient>
                                                    <linearGradient id="blueGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" /><stop offset="100%" stopColor="#60A5FA" stopOpacity="0.6" /></linearGradient>
                                                    <linearGradient id="orangeGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F97316" stopOpacity="0.8" /><stop offset="100%" stopColor="#FB923C" stopOpacity="0.6" /></linearGradient>
                                                </defs>
                                                {(() => {
                                                    const centerX = 200, centerY = 200, count = Math.min(7, Math.max(2, membersWithRoles.length)), angles = getCircleAngles(count), radius = count >= 6 ? 115 : 120, nodeR = count >= 6 ? 30 : 35, avatarR = count >= 6 ? 26 : 32, displayMembers = membersWithRoles.slice(0, count);
                                                    const gradientMap: Record<string, string> = { leaderGradient: "leaderGradientMobile", centerGradient: "centerGradientMobile", balanceGradient: "balanceGradientMobile", mediatorGradient: "mediatorGradientMobile", energyGradient: "energyGradientMobile" };
                                                    return (
                                                        <>
                                                            <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="url(#blueGradientMobile)" strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
                                                            {angles.map((_, i) => {
                                                                const nextIdx = (i + 1) % count;
                                                                const x1 = centerX + radius * Math.cos(angles[i]), y1 = centerY + radius * Math.sin(angles[i]);
                                                                const x2 = centerX + radius * Math.cos(angles[nextIdx]), y2 = centerY + radius * Math.sin(angles[nextIdx]);
                                                                return <line key={`ml-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? "url(#orangeGradientMobile)" : "url(#blueGradientMobile)"} strokeWidth="2" opacity="0.5" />;
                                                            })}
                                                            {displayMembers.map((member, idx) => {
                                                                const angle = angles[idx], style = ROLE_STYLE_MAP[idx % ROLE_STYLE_MAP.length], x = centerX + radius * Math.cos(angle), y = centerY + radius * Math.sin(angle), gradId = gradientMap[style.gradientId] ?? style.gradientId;
                                                                return (
                                                                    <g key={member.id ?? idx}>
                                                                        <defs><clipPath id={`avatar-clip-m-${member.id ?? idx}`}><circle cx={x} cy={y} r={avatarR} /></clipPath></defs>
                                                                        <circle cx={x} cy={y} r={nodeR} fill={`url(#${gradId})`} stroke="white" strokeWidth="3" className="drop-shadow-md" />
                                                                        {member.avatar && member.avatar.trim() !== "" ? (
                                                                            <image href={member.avatar} x={x - avatarR} y={y - avatarR} width={avatarR * 2} height={avatarR * 2} clipPath={`url(#avatar-clip-m-${member.id ?? idx})`} className="pointer-events-none" />
                                                                        ) : (
                                                                            <><text x={x} y={y - (count >= 6 ? 8 : 10)} textAnchor="middle" fontSize={count >= 6 ? 24 : 28}>{style.badge}</text><text x={x} y={y + (count >= 6 ? 8 : 10)} textAnchor="middle" fontSize={count >= 6 ? 14 : 16} fontWeight="bold" fill="white" className="font-display">{member.name[0] || "?"}</text></>
                                                                        )}
                                                                        <text x={x} y={y + nodeR + (count >= 6 ? 22 : 26)} textAnchor="middle" fontSize={count >= 6 ? 13 : 14} fontWeight="bold" fill={style.textColor} className="font-sans">{style.shortLabel}</text>
                                                                    </g>
                                                                );
                                                            })}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.personality.comprehensive}</p>
                                    <p className="text-xs font-semibold text-gray-600 flow-mb-title w-full">핵심 포인트</p>
                                    <div className="flex flex-wrap flow-gap-y w-full max-w-full">
                                        <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] text-green-700 font-medium">✅ 역할 분담 명확</span>
                                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700 font-medium">⚖️ 균형 잡힌 구조</span>
                                        <span className="px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-700 font-medium">⚠️ 감정 표현 중요</span>
                                    </div>
                                </section>
                                <section className="section-flow">
                                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">팀워크 분석</h2>
                                    <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title w-full">1. 커뮤니케이션 밀도</h3>
                                    <p className="text-xs text-gray-500 font-hand flow-mb-title w-full">"말이 많아서 문제인가, 적어서 문제인가?"</p>
                                    <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.teamwork.communicationDetail}</p>
                                    <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title w-full">2. 갈등 발생 시 대응력</h3>
                                    <p className="text-xs text-gray-500 font-hand flow-mb-title w-full">"문제가 생겼을 때 이 팀은 어떻게 반응하는가?"</p>
                                    <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.teamwork.speedDetail}</p>
                                    <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title w-full">3. 의사결정 구조</h3>
                                    <p className="text-xs text-gray-500 font-hand flow-mb-title w-full">"누가 말하면 정리가 되는가?"</p>
                                    <p className="text-sm text-gray-700 leading-[1.8] font-sans w-full break-keep">{dataSource.teamwork.stabilityDetail}</p>
                                </section>
                                <section className="section-flow">
                                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">개인별 포지션</h2>
                                    <ul className="flow-col w-full max-w-full">
                                        {membersWithRoles.map((member, idx) => {
                                            const palette = MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length];
                                            return (
                                                <li key={member.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {member.avatar && member.avatar.trim() !== "" ? (
                                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                                                <ImageWithFallback src={member.avatar} alt={member.name} className="w-full h-full object-cover" onError={() => {}} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm border border-slate-200 shrink-0">{member.name[0] || "?"}</div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <span className="font-bold text-slate-900 text-sm font-display">{member.name}</span>
                                                            <Badge variant="outline" className={`ml-1.5 text-[10px] font-medium px-2 py-0.5 rounded border ${palette.badge}`}>{member.role}</Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 font-sans leading-relaxed mb-2">{member.description}</p>
                                                    <p className="text-[10px] text-emerald-700 font-sans"><span className="font-semibold">장점</span> {member.strengths[0]}</p>
                                                    <p className="text-[10px] text-amber-700 font-sans"><span className="font-semibold">주의</span> {member.warnings[0]}</p>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                                <section className="section-flow">
                                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">모임을 오래 가게 만드는 방법</h2>
                                    {(() => {
                                        const cards = dataSource.maintenance?.maintenanceCards ?? [];
                                        const icons = [MessageSquare, ShieldCheck, Calendar, Sparkles];
                                        const list = Array.isArray(cards) && cards.length > 0 ? cards : [];
                                        return (
                                            <>
                                                <ul className="flow-col w-full max-w-full">
                                                {list.map((card: { label: string; title: string; description: string }, i: number) => {
                                                    const Icon = icons[i % icons.length];
                                                    return (
                                                        <li key={`${card.label}-${i}`} className="flex gap-3 w-full max-w-full">
                                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-orange-600" /></div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] font-semibold text-orange-600 font-sans">{card.label}</p>
                                                                <p className="text-sm font-bold text-gray-800 font-display break-keep">{card.title}</p>
                                                                <p className="text-xs text-gray-600 font-sans leading-snug break-keep">{card.description}</p>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                                </ul>
                                                {(() => {
                                        const pc = dataSource.maintenance?.problemChild;
                                        if (!pc?.name || !Array.isArray(pc.guidelines) || pc.guidelines.length === 0) return null;
                                        return (
                                            <div className="mt-4 p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                                                <p className="text-xs font-bold text-amber-800 font-display mb-2">이 모임의 문제아 · {pc.name}</p>
                                                {pc.whySentence && pc.whySentence.trim() && (
                                                    <p className="text-xs text-amber-900 font-sans mb-2 leading-relaxed"><span className="font-semibold">선정 이유</span> {pc.whySentence}</p>
                                                )}
                                                {Array.isArray(pc.survivalStrategy) && pc.survivalStrategy.length > 0 && (
                                                    <>
                                                        <p className="text-[10px] font-semibold text-amber-700 font-sans mb-1">그 사람의 생존 전략</p>
                                                        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700 font-sans mb-2">
                                                            {pc.survivalStrategy.slice(0, 4).map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                                <p className="text-[10px] font-semibold text-amber-700 font-sans mb-1">그래서 이렇게 고치면 모임이 오래 가요</p>
                                                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700 font-sans">
                                                    {pc.guidelines.slice(0, 4).map((g, i) => (
                                                        <li key={i}>{g}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })()}
                                            </>
                                        );
                                    })()}
                                </section>
                            </motion.div>
                        ) : (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                            className="py-3 sm:py-4 space-y-4 sm:space-y-8"
                        >
                            {/* 궁합 점수 및 랭킹 등록 - 컴팩트 가로형: [원형 점수] | [소제목+문구] | [버튼 우측 중앙] */}
                            <GlassCard className="border-2 sm:border-4 border-white rounded-2xl shadow-clay-md p-4 sm:p-5 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                                    {/* 1) 가장 왼쪽: 네오모피즘 스타일 점수 뱃지 */}
                                    <div className="inline-flex items-baseline gap-1.5 shrink-0 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-300">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 tabular-nums leading-none">
                                            {typeof dataSource.compatibility?.score === "number"
                                                ? dataSource.compatibility.score
                                                : "-"}
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
                                    {/* 3) 가장 우측 중앙: 랭킹 등록/보기 버튼 */}
                                    <div className="flex items-center justify-start sm:justify-end shrink-0 self-center">
                                        <ActionButton
                                            variant="orange-primary"
                                            onClick={handleRankingButtonClick}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold shadow-lg hover:scale-105 transition-all"
                                        >
                                            <Trophy size={14} />
                                            {hasRegisteredRanking ? "랭킹 보기" : "이 점수 랭킹 등록하기"}
                                        </ActionButton>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* 거북 도사의 총평과 팀워크 분석 - 나란히 정렬 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                                {/* 거북 도사의 총평 */}
                                <GlassCard className="flex flex-col p-4 sm:p-6 lg:p-8 border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md bg-gradient-to-br from-white/80 to-orange-50/30 h-full">
                                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                        </div>
                                        <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">거북도사의 총평</h3>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[50vh] sm:max-h-[600px]">
                                        {/* 1. 모임의 조화 및 균형 해석 */}
                                        <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
                                            <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-2 sm:mb-3 font-display flex items-center gap-2">
                                                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">1</span>
                                                모임의 조화 및 균형 해석
                                            </h4>
                                            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans min-w-0 break-words">{dataSource.personality.harmony}</p>
                                        </section>

                                        {/* 2. 종합 궁합 해석 */}
                                        <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
                                            <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4 font-display flex items-center gap-2">
                                                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">2</span>
                                                종합 궁합 해석
                                            </h4>
                                            
                                            {/* 조직 분석 인포그래픽 - 원형 구조 */}
                                            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50/30 to-orange-50/30 rounded-xl border border-blue-200/50">
                                                <div className="relative w-full aspect-square max-w-[280px] sm:max-w-md mx-auto">
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
                                            
                                            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans mb-2 sm:mb-3 min-w-0 break-words">{dataSource.personality.comprehensive}</p>
                                            
                                            {/* 핵심 포인트 */}
                                            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
                                                <div className="text-xs text-gray-600 mb-1.5 sm:mb-2 font-sans font-semibold">핵심 포인트</div>
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-200 rounded-lg text-[10px] sm:text-xs text-green-700 font-sans font-medium">
                                                        ✅ 역할 분담 명확
                                                    </div>
                                                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] sm:text-xs text-blue-700 font-sans font-medium">
                                                        ⚖️ 균형 잡힌 구조
                                                    </div>
                                                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] sm:text-xs text-yellow-700 font-sans font-medium">
                                                        ⚠️ 감정 표현 중요
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </GlassCard>

                                {/* 팀워크 분석 */}
                                <GlassCard className="flex flex-col border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white/80 to-orange-50/30 h-full">
                                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                        </div>
                                        <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">팀워크 분석</h3>
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[50vh] sm:max-h-[600px]">
                                        {/* 1. 커뮤니케이션 밀도 */}
                                        <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h4 className="text-gray-800 font-bold text-base sm:text-lg font-display flex items-center gap-2">
                                                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">1</span>
                                                    커뮤니케이션 밀도
                                                </h4>
                                                <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-orange-100/50 w-fit">
                                                    <span className="text-xl sm:text-2xl font-extrabold text-orange-600 tabular-nums">{dataSource.teamwork.communication}</span>
                                                    <span className="text-xs sm:text-sm font-bold text-orange-500">점</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm sm:text-base font-hand mb-2 sm:mb-3">"말이 많아서 문제인가, 적어서 문제인가?"</p>
                                            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans min-w-0 break-words">{dataSource.teamwork.communicationDetail}</p>
                                        </section>

                                        {/* 2. 갈등 발생 시 대응력 */}
                                        <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h4 className="text-gray-800 font-bold text-base sm:text-lg font-display flex items-center gap-2">
                                                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">2</span>
                                                    갈등 발생 시 대응력
                                                </h4>
                                                <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-orange-100/50 w-fit">
                                                    <span className="text-xl sm:text-2xl font-extrabold text-orange-600 tabular-nums">{dataSource.teamwork.speed}</span>
                                                    <span className="text-xs sm:text-sm font-bold text-orange-500">점</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm sm:text-base font-hand mb-2 sm:mb-3">"문제가 생겼을 때 이 팀은 어떻게 반응하는가?"</p>
                                            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans min-w-0 break-words">{dataSource.teamwork.speedDetail}</p>
                                        </section>

                                        {/* 3. 의사결정 구조 */}
                                        <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h4 className="text-gray-800 font-bold text-base sm:text-lg font-display flex items-center gap-2">
                                                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">3</span>
                                                    의사결정 구조
                                                </h4>
                                                <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-orange-100/50 w-fit">
                                                    <span className="text-xl sm:text-2xl font-extrabold text-orange-600 tabular-nums">{dataSource.teamwork.stability}</span>
                                                    <span className="text-xs sm:text-sm font-bold text-orange-500">점</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm sm:text-base font-hand mb-2 sm:mb-3">"누가 말하면 정리가 되는가?"</p>
                                            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans min-w-0 break-words">{dataSource.teamwork.stabilityDetail}</p>
                                        </section>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* 2. 개인별 포지션 - 타이틀 아이콘 스타일 통일(팀워크/모임 오래 섹션과 동일) */}
                            <div className="mt-6 sm:mt-8">
                                <div className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">개인별 포지션</h3>
                                </div>
                                {/* 반응형: 좁은 화면에서는 1열로 쌓아 카드 여유 확보, 넓은 화면에서만 2~3열 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                                    {membersWithRoles.map((member, idx) => (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.1 }}
                                        >
                                            <div className="p-3 sm:p-4 h-full min-h-[240px] sm:min-h-[280px] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                                <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 flex-shrink-0">
                                                    {member.avatar && member.avatar.trim() !== "" ? (
                                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 relative">
                                                            <ImageWithFallback
                                                                src={member.avatar}
                                                                alt={member.name}
                                                                className="w-full h-full object-cover"
                                                                onError={() => {}}
                                                            />
                                                            <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-base sm:text-lg opacity-0 pointer-events-none image-fallback">
                                                                {member.name[0] || "?"}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-base sm:text-lg border border-slate-200 flex-shrink-0">
                                                            {member.name[0] || "?"}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                        <h4 className="font-bold text-slate-900 text-lg font-display break-words">{member.name}</h4>
                                                        {(() => {
                                                            const palette = MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length];
                                                            return (
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <Award className="w-5 h-5 flex-shrink-0 text-orange-600" />
                                                                    <Badge variant="outline" className={`text-xs font-medium px-2.5 py-0.5 rounded-md border break-words text-left ${palette.badge}`}>
                                                                        {member.role}
                                                                    </Badge>
                                                                </div>
                                                            );
                                                        })()}
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
                                                <p className="text-sm text-slate-600 font-sans leading-relaxed bg-slate-50/80 p-2.5 rounded-lg line-clamp-3 flex-1 min-h-0">{member.description}</p>
                                                <div className="space-y-1.5 text-sm pt-3 border-t border-slate-100 flex-shrink-0">
                                                    <div className="flex items-center gap-2 bg-emerald-50 rounded-lg border border-emerald-100 py-1.5 px-2.5 min-w-0">
                                                        <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 font-sans flex-shrink-0">장점</span>
                                                        <span className="text-emerald-700/80 flex-shrink-0 mx-0.5 font-sans">·</span>
                                                        <span className="font-hand text-emerald-800 text-sm leading-snug break-words min-w-0">{member.strengths[0]}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-50 rounded-lg border border-amber-100 py-1 sm:py-1.5 px-2 sm:px-2.5 min-w-0">
                                                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                                                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-amber-600 font-sans flex-shrink-0">주의</span>
                                                        <span className="text-amber-700/80 flex-shrink-0 mx-0.5 font-sans">·</span>
                                                        <span className="font-hand text-amber-900 text-sm leading-snug break-words min-w-0">{member.warnings[0]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                </motion.div>
                                    ))}
                            </div>
                        </div>

                            {/* 모임을 오래 가게 만드는 방법 - 공통 스타일(GlassCard·팀워크 분석 톤) */}
                            <GlassCard className="flex flex-col border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white/80 to-orange-50/30 h-full mt-6 sm:mt-8">
                                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">모임을 오래 가게 만드는 방법</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0">
                                    {(() => {
                                        const cards = dataSource.maintenance?.maintenanceCards ?? [];
                                        const icons = [MessageSquare, ShieldCheck, Calendar, Sparkles];
                                        const list = Array.isArray(cards) && cards.length > 0 ? cards : [];
                                        return list.map((card: { label: string; title: string; description: string }, i: number) => {
                                            const Icon = icons[i % icons.length];
                                            return (
                                                <section key={`${card.label}-${i}`} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] bg-white/50 rounded-xl sm:rounded-2xl border border-gray-200">
                                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] sm:text-xs font-semibold text-orange-600 font-sans mb-0.5">{card.label}</p>
                                                        <p className="text-xs sm:text-sm font-bold text-gray-800 font-display mb-0.5 sm:mb-1">{card.title}</p>
                                                        <p className="text-[10px] sm:text-xs text-gray-600 font-sans leading-snug">{card.description}</p>
                                                    </div>
                                                </section>
                                            );
                                        });
                                    })()}
                                </div>
                                {(() => {
                                    const pc = dataSource.maintenance?.problemChild;
                                    if (!pc?.name || !Array.isArray(pc.guidelines) || pc.guidelines.length === 0) return null;
                                    return (
                                        <div className="mt-4 sm:mt-6">
                                            <section className="p-3 sm:p-4 bg-amber-50/80 rounded-xl sm:rounded-2xl border border-amber-200">
                                                <p className="text-sm font-bold text-amber-800 font-display mb-2">이 모임의 문제아 · {pc.name}</p>
                                                {pc.whySentence && pc.whySentence.trim() && (
                                                    <p className="text-xs sm:text-sm text-amber-900 font-sans mb-2 leading-relaxed"><span className="font-semibold">선정 이유</span> {pc.whySentence}</p>
                                                )}
                                                {Array.isArray(pc.survivalStrategy) && pc.survivalStrategy.length > 0 && (
                                                    <>
                                                        <p className="text-xs font-semibold text-amber-700 font-sans mb-1">그 사람의 생존 전략</p>
                                                        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 font-sans mb-2">
                                                            {pc.survivalStrategy.slice(0, 4).map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                                <p className="text-xs font-semibold text-amber-700 font-sans mb-1">그래서 이렇게 고치면 모임이 오래 가요</p>
                                                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 font-sans">
                                                    {pc.guidelines.slice(0, 4).map((g, i) => (
                                                        <li key={i}>{g}</li>
                                                    ))}
                                                </ul>
                                            </section>
                                        </div>
                                    );
                                })()}
                            </GlassCard>
            </motion.div>
                        )
                    )}

                    {/* 1:1 궁합 섹션 */}
                    {currentTab === "pairs" && (
                        isMobile ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                                className="space-y-0 w-full max-w-full"
                                style={{ paddingTop: "var(--flow-block)", paddingBottom: "var(--flow-block)" }}
                            >
                                {/* 모바일: 소제목 → 본문/컴포넌트 문서형 */}
                                {groupAnalysisResult?.overall != null && groupAnalysisResult?.pairs === undefined ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-600">
                                        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" aria-hidden />
                                        <p className="text-base font-medium">1:1 궁합 분석 중...</p>
                                        <p className="text-xs text-gray-500">잠시만 기다려 주세요.</p>
                                    </div>
                                ) : (
                                    <>
                                        <section className="section-flow">
                                            <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">관계맵</h2>
                                            <p className="text-xs text-gray-500 font-sans flow-mb-block w-full">멤버를 선택하면 해당 멤버와의 1:1 궁합을 확인할 수 있어요.</p>
                                            <div className="flex flex-col lg:flex-row gap-3 w-full max-w-full">
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
                                        </section>
                                        <section className="section-flow">
                                            <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">베스트 TOP3</h2>
                                            <ul className="flow-col w-full max-w-full">
                                                {bestPairs.map((pair, idx) => (
                                                    <li key={`${pair.member1}-${pair.member2}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 w-full">
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <span className="font-bold text-gray-900 font-display text-sm min-w-0 break-keep">{pair.member1} ↔ {pair.member2}</span>
                                                            <span className="text-lg font-extrabold text-sky-600 tabular-nums shrink-0">{pair.score}점</span>
                                                        </div>
                                                        <p className="text-xs text-gray-800 font-sans leading-relaxed mb-1 w-full min-w-0 break-words">{pair.reason}</p>
                                                        <p className="text-[10px] text-gray-600 font-sans w-full min-w-0 break-words">{pair.summary}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                        <section className="section-flow">
                                            <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">워스트 TOP3</h2>
                                            <ul className="flow-col w-full max-w-full">
                                                {worstPairs.map((pair, idx) => (
                                                    <li key={`${pair.member1}-${pair.member2}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 w-full">
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <span className="font-bold text-gray-900 font-display text-sm min-w-0 break-keep">{pair.member1} ↔ {pair.member2}</span>
                                                            <span className="text-lg font-extrabold text-slate-600 tabular-nums shrink-0">{pair.score}점</span>
                                                        </div>
                                                        <p className="text-xs text-gray-800 font-sans leading-relaxed mb-1 w-full min-w-0 break-words">{pair.reason}</p>
                                                        <p className="text-[10px] text-gray-600 font-sans w-full min-w-0 break-words">{pair.summary}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    </>
                                )}
                            </motion.div>
                        ) : (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                            className="space-y-4 sm:space-y-6 lg:space-y-8"
                        >
                            {/* API 분리 시: 전체 궁합은 왔고 1:1은 아직 로딩 중 */}
                            {groupAnalysisResult?.overall != null && groupAnalysisResult?.pairs === undefined ? (
                                <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-3 sm:gap-4 text-gray-600">
                                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-brand-orange animate-spin" aria-hidden />
                                    <p className="text-base sm:text-lg font-medium">1:1 궁합 분석 중...</p>
                                    <p className="text-xs sm:text-sm text-gray-500">잠시만 기다려 주세요.</p>
                                </div>
                            ) : (
                        <>
                            {/* 관계맵 - 개인별 포지션 스타일 통일 */}
                            <div className="mt-6 sm:mt-8">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pb-3 sm:pb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                        <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">관계맵</h3>
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
                                <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                                {/* 베스트 TOP3 — 파란색 계열(공통 컬러) */}
                                <GlassCard className="border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/30">
                                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-400/30 to-blue-400/20 border-2 border-sky-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 font-display">베스트 TOP3</CardTitle>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        {bestPairs.map((pair, idx) => (
                                            <motion.div
                                                key={`${pair.member1}-${pair.member2}`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.1 }}
                                                className="p-3 sm:p-5 bg-gradient-to-br from-sky-50 to-blue-50/80 rounded-xl sm:rounded-2xl border-2 border-sky-200 shadow-sm hover:shadow-md transition-all relative"
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
                                                        <span className="font-bold text-gray-900 font-display text-base sm:text-lg">{pair.member1} ↔ {pair.member2}</span>
                                                    </div>
                                                    <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-sky-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-sky-100/50 w-fit">
                                                        <span className="text-xl sm:text-2xl font-extrabold text-sky-600 tabular-nums">{pair.score}</span>
                                                        <span className="text-xs sm:text-sm font-bold text-sky-500">점</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-800 mb-1.5 sm:mb-2 font-sans leading-relaxed min-w-0 break-words">{pair.reason}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-600 font-sans leading-relaxed bg-white/60 p-1.5 sm:p-2 rounded-lg min-w-0 break-words">{pair.summary}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlassCard>

                                {/* 워스트 TOP3 — 그레이톤 */}
                                <GlassCard className="border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 bg-gradient-to-br from-slate-50/50 via-white to-slate-100/30">
                                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-300/50 to-slate-400/30 border-2 border-slate-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 font-display">워스트 TOP3</CardTitle>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        {worstPairs.map((pair, idx) => (
                                            <motion.div
                                                key={`${pair.member1}-${pair.member2}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.1 }}
                                                className="p-3 sm:p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all relative"
                                            >
                                                {/* 순위 뱃지 */}
                                                <div className="absolute -top-2 -left-2 z-10">
                                                    <Badge 
                                                        variant="default"
                                                        className="text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md bg-gradient-to-br from-gray-500 to-gray-600 text-gray-50 border-gray-700"
                                                    >
                                                        {idx + 1}위
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                        <div className="relative h-9 w-12 sm:h-10 sm:w-14 shrink-0 flex items-center" aria-hidden>
                                                            <div className="absolute left-0 top-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-0">
                                                                {(() => {
                                                                    const m1 = relationMapMembers.find(m => m.name === pair.member1);
                                                                    return m1?.avatar?.trim() ? (
                                                                        <img src={m1.avatar} alt={pair.member1} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-full w-full items-center justify-center text-xs sm:text-sm font-semibold text-slate-600">{pair.member1[0] ?? "?"}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="absolute left-4 sm:left-5 top-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-10">
                                                                {(() => {
                                                                    const m2 = relationMapMembers.find(m => m.name === pair.member2);
                                                                    return m2?.avatar?.trim() ? (
                                                                        <img src={m2.avatar} alt={pair.member2} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex h-full w-full items-center justify-center text-xs sm:text-sm font-semibold text-slate-600">{pair.member2[0] ?? "?"}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-gray-900 font-display text-base sm:text-lg min-w-0 break-words">{pair.member1} ↔ {pair.member2}</span>
                                                    </div>
                                                    <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-slate-100 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-slate-200/50 w-fit">
                                                        <span className="text-xl sm:text-2xl font-extrabold text-slate-600 tabular-nums">{pair.score}</span>
                                                        <span className="text-xs sm:text-sm font-bold text-slate-500">점</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-800 mb-1.5 sm:mb-2 font-sans leading-relaxed min-w-0 break-words">{pair.reason}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-600 font-sans leading-relaxed bg-white/60 p-1.5 sm:p-2 rounded-lg min-w-0 break-words">{pair.summary}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </div>

                        </>
                            )}
                        </motion.div>
                        )
                    )}

                    {/* 싸피네컷 탭 — 모임용 저장 이미지 표시 또는 네컷 페이지 진입 */}
                    {currentTab === "ssafy-cut" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="py-4"
                        >
                            {savedGroupFrameImage ? (
                                <div className="w-full max-w-4xl space-y-8 mx-auto">
                                    <div className="flex justify-center">
                                        <div className="relative w-full max-w-2xl">
                                            <img
                                                src={savedGroupFrameImage}
                                                alt="싸피네컷"
                                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <ActionButton
                                            variant="orange-primary"
                                            onClick={() => {
                                                const link = document.createElement("a");
                                                link.download = "싸피네컷.png";
                                                link.href = savedGroupFrameImage;
                                                link.click();
                                            }}
                                        >
                                            <Download size={20} className="mr-2" />
                                            이미지 다운로드
                                        </ActionButton>
                                        {onNavigateToPhotoBooth && (
                                            <ActionButton
                                                variant="orange-secondary"
                                                onClick={onNavigateToPhotoBooth}
                                            >
                                                <Images size={20} className="mr-2" />
                                                다시 찍기
                                            </ActionButton>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <GlassCard className="w-full max-w-2xl mx-auto p-10 sm:p-12 border-4 border-white rounded-[32px] shadow-clay-lg bg-white/70 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                                        <Images className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 font-display mb-2">싸피네컷</h3>
                                    <p className="text-gray-600 text-base font-sans mb-8">모임과 함께 네컷 사진을 찍어 보세요.</p>
                                    {onNavigateToPhotoBooth && (
                                        <ActionButton
                                            variant="orange-primary"
                                            onClick={onNavigateToPhotoBooth}
                                            className="flex items-center gap-2"
                                        >
                                            <Images size={20} />
                                            싸피네컷 찍으러 가기
                                        </ActionButton>
                                    )}
                                </GlassCard>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
            
            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 lg:mt-16 pb-6 sm:pb-10 no-capture">
                <ActionButton 
                    variant="secondary" 
                    onClick={handleShare} 
                    disabled={isSavingShare}
                    className="flex items-center gap-2 bg-white"
                >
                    {isSavingShare ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> 저장 중...
                        </>
                    ) : (
                        <>
                            <Share2 size={20} /> 결과 저장 & 공유
                        </>
                    )}
                </ActionButton>
                <ActionButton 
                    variant="orange-primary" 
                    onClick={handleRankingButtonClick} 
                    className="flex items-center gap-2"
                >
                    <Trophy size={20} /> {hasRegisteredRanking ? "랭킹 보기" : "랭킹 등록하기"}
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
