import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { getGroupAnalysis, type GroupAnalysisData, type AnalysisStatus } from "@/shared/api/groupAnalysisApi";
import { ROUTES } from "@/shared/config/routes";
import { GroupResult, type GroupAnalysisResultProp } from "./result/components/GroupResult";
import type { GroupMember } from "@/shared/types";

/**
 * URL pathname에서 UUID 추출
 * /group/share/9beefa5f-10a1-453c-9203-5aa7189bb14e -> 9beefa5f-10a1-453c-9203-5aa7189bb14e
 */
function extractUuidFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/group\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    return match ? match[1] : null;
}

/**
 * 저장된 GroupAnalysisData를 GroupResult가 사용하는 GroupAnalysisResultProp 형식으로 변환
 */
function convertToGroupAnalysisResultProp(data: GroupAnalysisData): GroupAnalysisResultProp {
    const { overallAnalysis, pairsAnalysis, members } = data;
    
    return {
        success: true,
        members: (members || []).map((m, idx) => ({
            id: m.id || idx + 1,
            name: m.name,
            sajuInfo: undefined,
        })),
        overall: overallAnalysis ? {
            personality: {
                title: overallAnalysis.personality?.title || "",
                harmony: overallAnalysis.personality?.harmony || "",
                comprehensive: overallAnalysis.personality?.comprehensive || "",
                improvement: overallAnalysis.personality?.improvement || "",
            },
            compatibility: {
                score: overallAnalysis.compatibility?.score || 0,
            },
            teamwork: {
                communication: overallAnalysis.teamwork?.communication || 0,
                speed: overallAnalysis.teamwork?.speed || 0,
                stability: overallAnalysis.teamwork?.stability || 0,
                communicationDetail: overallAnalysis.teamwork?.communicationDetail || "",
                speedDetail: overallAnalysis.teamwork?.speedDetail || "",
                stabilityDetail: overallAnalysis.teamwork?.stabilityDetail || "",
            },
            maintenance: {
                do: overallAnalysis.maintenance?.do,
                dont: overallAnalysis.maintenance?.dont,
                maintenanceCards: overallAnalysis.maintenance?.maintenanceCards,
                problemChild: overallAnalysis.maintenance?.problemChild ? {
                    name: overallAnalysis.maintenance.problemChild.name,
                    whySentence: overallAnalysis.maintenance.problemChild.whySentence,
                    survivalStrategy: overallAnalysis.maintenance.problemChild.survivalStrategy,
                    guidelines: overallAnalysis.maintenance.problemChild.guidelines || [],
                } : undefined,
            },
            members: overallAnalysis.members || [],
        } : undefined,
        pairs: pairsAnalysis?.map((p, idx) => ({
            member1: p.name1 || "",
            member2: p.name2 || "",
            rank: idx + 1,
            score: p.score || 0,
            type: (p.score || 0) >= 80 ? "best_friend" : (p.score || 0) >= 60 ? "good" : "normal",
            reason: p.summary || "",
            summary: p.summary || "",
        })),
    };
}

/**
 * 저장된 members 데이터를 GroupMember 형식으로 변환
 */
function convertToGroupMembers(data: GroupAnalysisData): GroupMember[] {
    return (data.members || []).map((m, idx) => ({
        id: m.id || idx + 1,
        name: m.name,
        birthDate: m.birthDate || "",
        birthTime: m.birthTime || "",
        gender: (m.gender as "male" | "female") || "male",
        avatar: m.avatar,
    }));
}

/**
 * 공유 링크로 접속했을 때 보여주는 단체 분석 결과 페이지
 * /group/share/:uuid 형태의 URL로 접근
 * GroupResult 컴포넌트를 재사용하여 싸피네컷 탭만 숨김
 */
export const SharedGroupAnalysisSection: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // URL에서 UUID 직접 추출 (useParams 대신)
    const uuid = extractUuidFromPath(location.pathname);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<GroupAnalysisData | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);

    // 데이터 조회 함수 (polling용으로 분리)
    const fetchData = useCallback(async () => {
        if (!uuid) {
            console.error("❌ UUID를 추출할 수 없습니다.");
            setError("잘못된 접근입니다.");
            setIsLoading(false);
            return;
        }

        try {
            console.log("📡 API 호출 시작:", uuid);
            const response = await getGroupAnalysis(uuid);
            console.log("✅ API 응답:", response);
            
            setAnalysisStatus(response.status);
            
            // 분석 완료된 경우에만 데이터 파싱
            if (response.status === 'COMPLETED' && response.analysisData) {
                const parsed: GroupAnalysisData = JSON.parse(response.analysisData);
                console.log("✅ 파싱된 데이터:", parsed);
                setAnalysisData(parsed);
            }
        } catch (err) {
            console.error("❌ 단체 분석 결과 조회 실패:", err);
            setError("분석 결과를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [uuid]);

    // UUID로 데이터 조회
    useEffect(() => {
        console.log("🔗 단체 분석 공유 페이지 접근, pathname:", location.pathname);
        console.log("🔗 추출된 UUID:", uuid);
        
        setIsLoading(true);
        fetchData();
    }, [uuid, fetchData, location.pathname]);

    // 분석 중일 때 주기적으로 상태 확인 (polling)
    useEffect(() => {
        if (analysisStatus !== 'ANALYZING') return;

        const pollInterval = setInterval(() => {
            console.log("🔄 분석 상태 확인 중...");
            fetchData();
        }, 3000); // 3초마다 상태 확인

        return () => clearInterval(pollInterval);
    }, [analysisStatus, fetchData]);

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={48} className="animate-spin text-brand-orange mb-4" />
                <p className="text-gray-600 text-lg">분석 결과를 불러오는 중...</p>
            </div>
        );
    }

    // 분석 중 상태 (외부 사용자가 분석 진행 중에 접근한 경우)
    if (analysisStatus === 'ANALYZING') {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <Clock size={48} className="text-brand-orange mb-4 animate-pulse" />
                    <Loader2 size={24} className="absolute -right-2 -bottom-2 animate-spin text-brand-orange" />
                </div>
                <p className="text-gray-800 text-xl font-semibold mb-2 mt-4">
                    모임 궁합 분석 중입니다
                </p>
                <p className="text-gray-500 text-sm mb-6 text-center">
                    잠시만 기다려 주세요.<br />
                    분석이 완료되면 자동으로 결과가 표시됩니다.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span>분석 진행 중...</span>
                </div>
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

    // 데이터 변환
    const groupAnalysisResult = convertToGroupAnalysisResultProp(analysisData);
    const groupMembers = convertToGroupMembers(analysisData);

    return (
        <div className="w-full">
            {/* 공유 결과 안내 배너 */}
            <div className="max-w-7xl mx-auto mb-6 p-4 bg-gradient-to-r from-brand-orange/10 to-brand-orange/5 rounded-2xl border border-brand-orange/20">
                <p className="text-center text-gray-700 text-sm">
                    🔗 공유된 모임 궁합 분석 결과입니다
                </p>
            </div>
            
            {/* GroupResult 컴포넌트 재사용 (싸피네컷 탭 숨김) */}
            <GroupResult
                groupMembers={groupMembers}
                groupAnalysisResult={groupAnalysisResult}
                isAnalyzing={false}
                hideSsafyCut={true}
                analysisUuid={uuid}
                // 공유 페이지에서는 랭킹 등록 불가
                hasRegisteredRanking={true}
            />
        </div>
    );
};
