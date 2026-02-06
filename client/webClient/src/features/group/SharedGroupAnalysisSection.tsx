import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Users, UserCheck, Loader2, AlertCircle, Trophy, Sparkles, Award, ShieldCheck, MousePointerClick } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { TabNavigation } from "@/shared/components/TabNavigation";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Badge } from "@/shared/ui/core/badge";
import { getGroupAnalysis, type GroupAnalysisData } from "@/shared/api/groupAnalysisApi";
import { ROUTES } from "@/shared/config/routes";
import { CardTitle } from "@/shared/ui/core/card";
import { RelationMapSidebar, type RelationMapMember } from "./result/components/RelationMapSidebar";
import { RelationMapView, type RelationWithLevel } from "./result/components/RelationMapView";
import { RelationDetailCard, getRelationLevel, type RelationPairForDetail } from "./result/components/RelationDetailCard";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";

/**
 * URL pathname에서 UUID 추출
 * /group/share/9beefa5f-10a1-453c-9203-5aa7189bb14e -> 9beefa5f-10a1-453c-9203-5aa7189bb14e
 */
function extractUuidFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/group\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    return match ? match[1] : null;
}

/**
 * 공유 링크로 접속했을 때 보여주는 단체 분석 결과 페이지
 * /group/share/:uuid 형태의 URL로 접근
 * 전체 궁합, 1:1 궁합 탭만 표시 (싸피네컷 제외)
 */
export const SharedGroupAnalysisSection: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // URL에서 UUID 직접 추출 (useParams 대신)
    const uuid = extractUuidFromPath(location.pathname);
    
    const [currentTab, setCurrentTab] = useState<"overall" | "pairs">("overall");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<GroupAnalysisData | null>(null);
    
    // 1:1 궁합 관계맵 상태
    const [selectedMemberForRelation, setSelectedMemberForRelation] = useState<string | null>(null);
    const [selectedPairDetail, setSelectedPairDetail] = useState<RelationPairForDetail | null>(null);

    // 멤버 선택 해제 시 상세창도 닫기
    useEffect(() => {
        if (!selectedMemberForRelation) {
            setSelectedPairDetail(null);
        }
    }, [selectedMemberForRelation]);

    // UUID로 데이터 조회
    useEffect(() => {
        const fetchData = async () => {
            console.log("🔗 단체 분석 공유 페이지 접근, pathname:", location.pathname);
            console.log("🔗 추출된 UUID:", uuid);
            
            if (!uuid) {
                console.error("❌ UUID를 추출할 수 없습니다.");
                setError("잘못된 접근입니다.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                console.log("📡 API 호출 시작:", uuid);
                const response = await getGroupAnalysis(uuid);
                console.log("✅ API 응답:", response);
                
                // analysisData는 JSON 문자열이므로 파싱
                const parsed: GroupAnalysisData = JSON.parse(response.analysisData);
                console.log("✅ 파싱된 데이터:", parsed);
                setAnalysisData(parsed);
            } catch (err) {
                console.error("❌ 단체 분석 결과 조회 실패:", err);
                setError("분석 결과를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [uuid, location.pathname]);

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={48} className="animate-spin text-brand-orange mb-4" />
                <p className="text-gray-600 text-lg">분석 결과를 불러오는 중...</p>
            </div>
        );
    }

    // 에러 상태
    if (error || !analysisData) {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-gray-800 text-lg font-semibold mb-2">
                    {error || "분석 결과를 찾을 수 없습니다."}
                </p>
                <p className="text-gray-500 text-sm mb-6">
                    링크가 만료되었거나 잘못된 주소일 수 있습니다.
                </p>
                <ActionButton
                    variant="orange-primary"
                    onClick={() => navigate(ROUTES.HOME)}
                >
                    홈으로 돌아가기
                </ActionButton>
            </div>
        );
    }

    // 데이터 추출
    const { overallAnalysis, pairsAnalysis, members, score, teamName } = analysisData;
    const personality = overallAnalysis?.personality;
    const compatibility = overallAnalysis?.compatibility;
    const teamwork = overallAnalysis?.teamwork;
    const maintenance = overallAnalysis?.maintenance;
    const membersFromApi = overallAnalysis?.members || [];

    // 타입 정의
    type MemberFromApi = {
        role?: string;
        keywords?: string[];
        description?: string;
        strengths?: string[];
        warnings?: string[];
    };

    type SavedMember = NonNullable<GroupAnalysisData['members']>[number];
    
    type PairAnalysis = NonNullable<GroupAnalysisData['pairsAnalysis']>[number];

    // 멤버 데이터 (저장된 members 사용)
    const membersWithRoles = (members || []).map((m: SavedMember, idx: number) => {
        const apiMember: MemberFromApi | undefined = membersFromApi[idx];
        return {
            id: m.id || idx + 1,
            name: m.name,
            birthDate: m.birthDate || "",
            birthTime: m.birthTime || "",
            gender: m.gender || "male",
            avatar: m.avatar,
            role: apiMember?.role || m.role || "",
            keywords: apiMember?.keywords || m.keywords || [],
            description: apiMember?.description || m.description || "",
            strengths: apiMember?.strengths || m.strengths || [],
            warnings: apiMember?.warnings || m.warnings || [],
        };
    });

    // 1:1 궁합 데이터: 기존 API 응답 + 누락된 nC2 조합 보강
    const completePairs = (() => {
        const names = membersWithRoles.map((m) => m.name);
        const pairKey = (a: string, b: string) => [a, b].sort().join("\0");
        
        // API 응답을 먼저 매핑
        const mappedPairs = (pairsAnalysis || []).map((p: PairAnalysis, idx: number) => ({
            ...p,
            member1: p.name1 || "",
            member2: p.name2 || "",
            rank: idx + 1,
            type: p.score && p.score >= 80 ? "best_friend" : p.score && p.score >= 60 ? "good" : "normal",
            reason: p.summary || "",
        }));
        
        // 기존 쌍 키 Set 생성
        const existingKeys = new Set(mappedPairs.map((p) => pairKey(p.member1, p.member2)));
        const result = [...mappedPairs];
        
        // 누락된 nC2 조합 보강
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const key = pairKey(names[i], names[j]);
                if (!existingKeys.has(key)) {
                    result.push({
                        member1: names[i],
                        member2: names[j],
                        name1: names[i],
                        name2: names[j],
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
    })();

    // 관계 레벨 계산
    const getRelationshipLevel = (score: number) => {
        if (score >= 90) return { level: "best", icon: "❤️", color: "#EF4444", strokeWidth: 4, description: "최고" };
        if (score >= 75) return { level: "good", icon: "✅", color: "#10B981", strokeWidth: 3, description: "좋음" };
        if (score >= 60) return { level: "normal", icon: "➖", color: "#94A3B8", strokeWidth: 2, description: "보통" };
        if (score >= 50) return { level: "caution", icon: "⚠️", color: "#F59E0B", strokeWidth: 2.5, description: "주의" };
        return { level: "worst", icon: "❌", color: "#1F2937", strokeWidth: 3, description: "최악" };
    };

    // 선택된 멤버의 관계 데이터
    const selectedMemberRelations = selectedMemberForRelation 
        ? completePairs
            .filter(pair => pair.member1 === selectedMemberForRelation || pair.member2 === selectedMemberForRelation)
            .map(pair => {
                const otherMember = pair.member1 === selectedMemberForRelation ? pair.member2 : pair.member1;
                const relationLevel = getRelationshipLevel(pair.score || 0);
                return {
                    ...pair,
                    otherMember,
                    relationLevel
                };
            })
        : [];

    // 관계맵 뷰용
    const relationsForMapView: RelationWithLevel[] = selectedMemberRelations.map((r) => ({
        ...r,
        relationLevel: getRelationLevel(r.score || 0),
    }));

    // 관계맵 사이드바/맵용 멤버 리스트
    const relationMapMembers: RelationMapMember[] = membersWithRoles.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        avatar: m.avatar,
    }));

    return (
        <div className="w-full max-w-7xl mx-auto pb-20" id="shared-group-analysis-container">
            {/* 공유 결과 안내 배너 */}
            <div className="mb-6 p-4 bg-gradient-to-r from-brand-orange/10 to-brand-orange/5 rounded-2xl border border-brand-orange/20">
                <p className="text-center text-gray-700 text-sm">
                    🔗 공유된 모임 궁합 분석 결과입니다
                </p>
            </div>

            {/* Tab Navigation - 전체 궁합, 1:1 궁합만 */}
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
                    {/* 전체 궁합 탭 */}
                    {currentTab === "overall" && (
                        <div className="space-y-8">
                            {/* 궁합 점수 */}
                            <GlassCard className="p-8 text-center bg-gradient-to-br from-brand-orange/5 to-brand-yellow/5">
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <Trophy className="w-12 h-12 text-brand-orange" />
                                    <div>
                                        <div className="text-6xl font-bold text-brand-orange">
                                            {compatibility?.score || score || 0}
                                        </div>
                                        <div className="text-gray-500">궁합 점수</div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* 모임 성격 */}
                            {personality && (
                                <GlassCard className="p-6">
                                    <CardTitle className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5 text-brand-orange" />
                                        모임 성격
                                    </CardTitle>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        {personality.title || teamName}
                                    </h3>
                                    {personality.harmony && (
                                        <p className="text-gray-600 mb-4 leading-relaxed">{personality.harmony}</p>
                                    )}
                                    {personality.comprehensive && (
                                        <p className="text-gray-600 leading-relaxed">{personality.comprehensive}</p>
                                    )}
                                </GlassCard>
                            )}

                            {/* 팀워크 지표 */}
                            {teamwork && (
                                <GlassCard className="p-6">
                                    <CardTitle className="flex items-center gap-2 mb-4">
                                        <Award className="w-5 h-5 text-brand-orange" />
                                        팀워크 지표
                                    </CardTitle>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                                            <div className="text-3xl font-bold text-brand-orange">{teamwork.communication || 0}</div>
                                            <div className="text-sm text-gray-500">소통력</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                                            <div className="text-3xl font-bold text-brand-orange">{teamwork.speed || 0}</div>
                                            <div className="text-sm text-gray-500">추진력</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                                            <div className="text-3xl font-bold text-brand-orange">{teamwork.stability || 0}</div>
                                            <div className="text-sm text-gray-500">안정도</div>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}

                            {/* 멤버 역할 */}
                            {membersWithRoles.length > 0 && (
                                <GlassCard className="p-6">
                                    <CardTitle className="flex items-center gap-2 mb-4">
                                        <Users className="w-5 h-5 text-brand-orange" />
                                        멤버 역할
                                    </CardTitle>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {membersWithRoles.map((member) => (
                                            <div key={member.id} className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {member.avatar ? (
                                                        <ImageWithFallback
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center">
                                                            <span className="text-brand-orange font-bold">
                                                                {member.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{member.name}</div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {member.role}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {member.keywords && member.keywords.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {member.keywords.map((kw, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-1 bg-brand-orange/10 text-brand-orange rounded-full">
                                                                {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}

                            {/* 모임 유지 팁 */}
                            {maintenance && (
                                <GlassCard className="p-6">
                                    <CardTitle className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-brand-orange" />
                                        모임 유지 팁
                                    </CardTitle>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {maintenance.do && maintenance.do.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-green-600 mb-2">✅ 이렇게 하세요</h4>
                                                <ul className="space-y-2">
                                                    {maintenance.do.map((item, idx) => (
                                                        <li key={idx} className="text-gray-600 text-sm flex items-start gap-2">
                                                            <span className="text-green-500">•</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {maintenance.dont && maintenance.dont.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-red-600 mb-2">❌ 이건 피하세요</h4>
                                                <ul className="space-y-2">
                                                    {maintenance.dont.map((item, idx) => (
                                                        <li key={idx} className="text-gray-600 text-sm flex items-start gap-2">
                                                            <span className="text-red-500">•</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            )}
                        </div>
                    )}

                    {/* 1:1 궁합 탭 */}
                    {currentTab === "pairs" && (
                        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                            {/* 좌측 사이드바: 멤버 목록 */}
                            <RelationMapSidebar
                                members={relationMapMembers}
                                selectedName={selectedMemberForRelation}
                                onSelect={setSelectedMemberForRelation}
                            />

                            {/* 우측: 관계맵 + 상세 정보 */}
                            <div className="flex-1 flex flex-col gap-6">
                                {/* 관계맵 시각화 */}
                                <GlassCard className="p-6 flex-1">
                                    <CardTitle className="mb-4">1:1 궁합 관계</CardTitle>
                                    {selectedMemberForRelation ? (
                                        <RelationMapView
                                            members={relationMapMembers}
                                            selectedMemberForRelation={selectedMemberForRelation}
                                            relations={relationsForMapView}
                                            selectedPair={selectedPairDetail ? { member1: selectedPairDetail.member1, member2: selectedPairDetail.member2 } : null}
                                            onSelectPair={(pair) => setSelectedPairDetail(pair)}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                            <MousePointerClick size={48} className="mb-4" />
                                            <p>왼쪽에서 멤버를 선택해주세요</p>
                                        </div>
                                    )}
                                </GlassCard>

                                {/* 상세 정보 카드 */}
                                {selectedPairDetail && (
                                    <RelationDetailCard
                                        pair={selectedPairDetail}
                                        onClose={() => setSelectedPairDetail(null)}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 하단 버튼 */}
            <div className="flex flex-wrap justify-center gap-4 mt-16 pb-10">
                <ActionButton
                    variant="secondary"
                    onClick={() => navigate(ROUTES.HOME)}
                    className="flex items-center gap-2"
                >
                    나도 분석받기
                </ActionButton>
            </div>
        </div>
    );
};
