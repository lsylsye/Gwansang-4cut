import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { Trophy, Users, UserCheck, AlertTriangle, Share2, Download, Loader2, Images } from "lucide-react";
import { GroupMember } from "@/types";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { TabNavigation } from "@/components/common/TabNavigation";
import { type RelationMapMember } from "./RelationMapSidebar";
import { type RelationWithLevel } from "./RelationMapView";
import { getRelationLevel, type RelationPairForDetail } from "./RelationDetailCard";
import { saveGroupAnalysis, type GroupAnalysisData } from "@/services/groupAnalysisApi";
import { toast } from "sonner";
import { devLog, devError } from "@/utils/logger";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTurtleGuideState } from "@/contexts/TurtleGuideStateContext";
import { type GroupResultProps } from "./GroupResultTypes";
import { GroupResultShareModal } from "./GroupResultShareModal";
import { OverallTab } from "./OverallTab";
import { PairsTab } from "./PairsTab";

export type { GroupAnalysisResultProp } from "./GroupResultTypes";

export const GroupResult: React.FC<GroupResultProps> = ({
    groupMembers = [],
    groupAnalysisResult = null,
    isAnalyzing = false,
    onViewRanking,
    onViewRankingViewOnly,
    hasRegisteredRanking = false,
    onNavigateToPhotoBooth,
    analysisUuid,
    hideSsafyCut = false,
}) => {
    const [currentTab, setCurrentTab] = useState<"overall" | "pairs" | "ssafy-cut">("overall");
    const { setGroupResultTab } = useTurtleGuideState();
    const [selectedMemberForRelation, setSelectedMemberForRelation] = useState<string | null>(null);
    const [selectedPairDetail, setSelectedPairDetail] = useState<RelationPairForDetail | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const isMobile = useIsMobile();
    /** 모임 궁합용 싸피네컷 저장 이미지 (photoBoothSets_group) */
    const [savedGroupFrameImage, setSavedGroupFrameImage] = useState<string | null>(null);
    /** 저장 중 로딩 상태 */
    const [isSavingShare, setIsSavingShare] = useState(false);
    /** 저장된 UUID (analysisUuid가 있으면 그것을 사용) */
    const [savedUuid, setSavedUuid] = useState<string | null>(analysisUuid ?? null);
    
    // analysisUuid가 변경되면 savedUuid 업데이트
    useEffect(() => {
        if (analysisUuid) {
            setSavedUuid(analysisUuid);
        }
    }, [analysisUuid]);

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
            devError("Failed to load group frame image:", error);
        }
    }, [currentTab]);
    // 멤버 선택 해제 시 상세창도 닫기
    useEffect(() => {
        if (!selectedMemberForRelation) {
            setSelectedPairDetail(null);
        }
    }, [selectedMemberForRelation]);

    // 탭 변경 시 TurtleGuide 멘트 갱신
    useEffect(() => {
        if (currentTab !== "ssafy-cut") setGroupResultTab(currentTab);
    }, [currentTab, setGroupResultTab]);

    const hasOverall = Boolean(
        groupAnalysisResult?.overall &&
        (groupAnalysisResult.overall as { personality?: unknown; compatibility?: unknown; teamwork?: unknown; maintenance?: unknown; members?: unknown[] }).personality &&
        (groupAnalysisResult.overall as { members?: unknown[] }).members
    );
    
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
                members: membersWithRoles.map((m) => {
                    // groupMembers에서 fiveElements 가져오기 (이름 기반 매칭)
                    const originalMember = groupMembers.find(gm => gm.name === m.name);
                    return {
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
                        fiveElements: originalMember?.fiveElements,
                    };
                }),
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
                    reason: p.reason,
                    summary: p.summary,
                    strengths: p.strengths,
                    cautions: p.cautions,
                    tips: p.tips,
                    romanceLines: p.romanceLines || [],
                })),
            };
            
            devLog('📦 저장할 단체 분석 데이터:', saveData);
            
            // API 호출하여 저장
            const uuid = await saveGroupAnalysis(saveData);
            
            // UUID 저장
            setSavedUuid(uuid);
            
            // 모달 열기
            setIsShareModalOpen(true);
        } catch (error) {
            devError('단체 분석 결과 저장 실패:', error);
            toast.error('분석 결과 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSavingShare(false);
        }
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            toast.success('링크가 복사되었습니다!');
        }).catch(() => {
            toast.error('링크 복사에 실패했습니다.');
        });
    };
    
    // API 응답이 있으면 overall 사용, 없으면 null (위→아래로 계산)
    const o = groupAnalysisResult?.overall;
    const dataSource =
        o?.personality && o?.compatibility && o?.teamwork && o?.maintenance && o?.members
            ? {
                personality: o.personality,
                compatibility: o.compatibility,
                teamwork: o.teamwork,
                maintenance: o.maintenance,
                membersFromApi: o.members,
            }
            : null;

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

    // 1대1 궁합: API pairs만 사용 (없으면 빈 배열)
    const apiPairs = groupAnalysisResult?.pairs;
    const mappedPairs =
        apiPairs && Array.isArray(apiPairs) && apiPairs.length > 0 ? apiPairs : [];

    // 실제 멤버 데이터와 역할 데이터 매핑 (API overall.members와 이름 기반 매칭)
    let membersWithRoles: Array<GroupMember & { role?: string; keywords?: string[]; description?: string; strengths?: string[]; warnings?: string[] }>;
    if (!dataSource?.membersFromApi?.length) {
        membersWithRoles = [];
    } else if (groupMembers.length === 0) {
        membersWithRoles = dataSource.membersFromApi.map((m, idx) => ({
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
        })) as typeof membersWithRoles;
    } else {
        membersWithRoles = groupMembers.map((member) => {
            const apiMember = dataSource.membersFromApi.find(api => api.name === member.name);
            const roleData = apiMember ?? dataSource.membersFromApi[0];
            return {
                ...member,
                role: roleData.role,
                keywords: roleData.keywords ?? [],
                description: roleData.description ?? "",
                strengths: roleData.strengths ?? [],
                warnings: roleData.warnings ?? [],
            };
        });
    }

    // 베스트/워스트 TOP3: 2명(1쌍)·3명(3쌍)은 50점 기준, 4명 이상은 점수 등수대로
    const THRESHOLD = 50;
    const bestPairs =
        mappedPairs.length <= 3
            ? mappedPairs.filter(p => (p.score ?? 0) >= THRESHOLD).slice(0, 3)
            : [...mappedPairs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
    const worstPairs =
        mappedPairs.length <= 3
            ? mappedPairs.filter(p => (p.score ?? 0) < THRESHOLD).slice(0, 3)
            : [...mappedPairs].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3);

    // 관계맵용: 멤버 수에 맞춰 누락된 1:1 쌍 보강
    const names = membersWithRoles.map((m) => m.name);
    const pairKey = (a: string, b: string) => [a, b].sort().join("\0");
    const existingKeys = new Set(mappedPairs.map((p) => pairKey(p.member1, p.member2)));
    const completePairs: RelationPairForDetail[] = [...mappedPairs];
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const key = pairKey(names[i], names[j]);
            if (!existingKeys.has(key)) {
                completePairs.push({
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

    // 관계 등급 매핑 함수 (점수 기반)
    const getRelationshipLevel = (score: number): { level: "best" | "good" | "normal" | "caution" | "worst", icon: string, color: string, strokeWidth: number, description: string } => {
        if (score >= 90) return { level: "best", icon: "❤️", color: "#EF4444", strokeWidth: 4, description: "최고" };
        if (score >= 75) return { level: "good", icon: "✅", color: "#10B981", strokeWidth: 3, description: "좋음" };
        if (score >= 60) return { level: "normal", icon: "➖", color: "#94A3B8", strokeWidth: 2, description: "보통" };
        if (score >= 50) return { level: "caution", icon: "⚠️", color: "#F59E0B", strokeWidth: 2.5, description: "주의" };
        return { level: "worst", icon: "❌", color: "#1F2937", strokeWidth: 3, description: "최악" };
    };
    
    // 선택된 멤버의 관계 데이터 (멤버 N명일 때 상대 N-1명 모두 표시)
    const selectedMemberRelations = !selectedMemberForRelation
        ? []
        : completePairs
            .filter(pair => pair.member1 === selectedMemberForRelation || pair.member2 === selectedMemberForRelation)
            .map(pair => {
                const otherMember = pair.member1 === selectedMemberForRelation ? pair.member2 : pair.member1;
                return {
                    ...pair,
                    otherMember,
                    relationLevel: getRelationshipLevel(pair.score),
                };
            });

    // 관계맵 뷰용: relationLevel을 Lucide용으로 변환
    const relationsForMapView: RelationWithLevel[] = selectedMemberRelations.map((r) => ({
        ...r,
        relationLevel: getRelationLevel(r.score),
    }));

    // 관계맵 사이드바/맵용 멤버 리스트
    const relationMapMembers: RelationMapMember[] = membersWithRoles.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role ?? "",
        avatar: m.avatar,
    }));

    // 훅 규칙: 모든 훅 호출 후에만 early return (로딩/결과 없음)
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
                    ...(!hideSsafyCut ? [{ id: "ssafy-cut", label: "싸피네컷", icon: Images }] : []),
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
                        <OverallTab
                            dataSource={dataSource}
                            membersWithRoles={membersWithRoles}
                            onRankingClick={handleRankingButtonClick}
                            hasRegisteredRanking={hasRegisteredRanking}
                            isMobile={isMobile}
                        />
                    )}

                    {currentTab === "pairs" && (
                        <PairsTab
                            isMobile={isMobile}
                            isPairsLoading={groupAnalysisResult?.overall != null && groupAnalysisResult?.pairs === undefined}
                            relationMapMembers={relationMapMembers}
                            selectedMemberForRelation={selectedMemberForRelation}
                            setSelectedMemberForRelation={setSelectedMemberForRelation}
                            relationsForMapView={relationsForMapView}
                            selectedPairDetail={selectedPairDetail}
                            setSelectedPairDetail={setSelectedPairDetail}
                            bestPairs={bestPairs}
                            worstPairs={worstPairs}
                        />
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
            
            <GroupResultShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={shareUrl}
                qrCodeUrl={qrCodeUrl}
                onCopyLink={handleCopyLink}
            />
        </div>
    );
};
