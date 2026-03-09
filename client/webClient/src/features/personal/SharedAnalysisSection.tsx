import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Brain, Heart, Loader2, AlertCircle, Clock } from "lucide-react";
import { FaceAnalysis } from "./face/components/FaceAnalysis";
import { StatsAnalysis, type ConstitutionPhase } from "./stats/components/StatsAnalysis";
import { TabNavigation } from "@/components/common/TabNavigation";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { getPersonalAnalysis, PersonalAnalysisData, AnalysisStatus } from "@/services/personalAnalysisApi";
import { devLog, devError } from "@/utils/logger";
import { ROUTES } from "@/routes/routes";

/**
 * 공유 링크로 접속했을 때 보여주는 결과 페이지
 * /personal/:uuid 형태의 URL로 접근
 * 관상 분석, 체질 분석 탭만 표시
 */
export const SharedAnalysisSection: React.FC = () => {
    const navigate = useNavigate();
    const { uuid } = useParams<"uuid">();
    
    const [currentTab, setCurrentTab] = useState<"physiognomy" | "constitution">("physiognomy");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<PersonalAnalysisData | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);

    // 체질 분석 상태 - 공유 페이지에서는 바로 체질 풀이 결과만 표시
    const [constitutionPhase, setConstitutionPhase] = useState<ConstitutionPhase>("constitution");
    const [constitutionSelectedMenuIdx, setConstitutionSelectedMenuIdx] = useState<number | null>(null);

    // 데이터 조회 함수 (polling용으로 분리)
    const fetchData = useCallback(async () => {
        if (!uuid) {
            devError("❌ UUID를 추출할 수 없습니다.");
            setError("잘못된 접근입니다.");
            setIsLoading(false);
            return;
        }

        try {
            devLog("📡 API 호출 시작:", uuid);
            const response = await getPersonalAnalysis(uuid);
            devLog("✅ API 응답:", response);
            
            setAnalysisStatus(response.status);
            
            // 분석 완료된 경우에만 데이터 파싱
            if (response.status === 'COMPLETED' && response.analysisData) {
                const parsed: PersonalAnalysisData = JSON.parse(response.analysisData);
                devLog("✅ 파싱된 데이터:", parsed);
                setAnalysisData(parsed);
            }
        } catch (err) {
            devError("❌ 분석 결과 조회 실패:", err);
            setError("분석 결과를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [uuid]);

    // UUID로 데이터 조회
    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [uuid, fetchData]);

    // 분석 중일 때 주기적으로 상태 확인 (polling)
    useEffect(() => {
        if (analysisStatus !== 'ANALYZING') return;

        const pollInterval = setInterval(() => {
            devLog("🔄 분석 상태 확인 중...");
            fetchData();
        }, 3000); // 3초마다 상태 확인

        return () => clearInterval(pollInterval);
    }, [analysisStatus, fetchData]);

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={48} className="animate-spin text-brand-green mb-4" />
                <p className="text-gray-600 text-lg">분석 결과를 불러오는 중...</p>
            </div>
        );
    }

    // 분석 중 상태 (외부 사용자가 분석 진행 중에 접근한 경우)
    if (analysisStatus === 'ANALYZING') {
        return (
            <div className="w-full max-w-7xl mx-auto pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <Clock size={48} className="text-brand-green mb-4 animate-pulse" />
                    <Loader2 size={24} className="absolute -right-2 -bottom-2 animate-spin text-brand-green" />
                </div>
                <p className="text-gray-800 text-xl font-semibold mb-2 mt-4">
                    관상 분석 중입니다
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
                    variant="primary"
                    onClick={() => navigate(ROUTES.HOME)}
                >
                    홈으로 돌아가기
                </ActionButton>
            </div>
        );
    }

    // 관상 분석 데이터를 FaceAnalysis 컴포넌트 형식으로 변환
    const featuresData = analysisData.faceAnalysis ? {
        common: analysisData.faceAnalysis.common,
        faceShape: analysisData.faceAnalysis.faceShape,
        forehead: analysisData.faceAnalysis.forehead,
        eyes: analysisData.faceAnalysis.eyes,
        nose: analysisData.faceAnalysis.nose,
        mouth: analysisData.faceAnalysis.mouth,
        chin: analysisData.faceAnalysis.chin,
    } : null;

    devLog("📊 불러온 featuresData:", featuresData);

    const totalReviewData = analysisData.faceAnalysis?.faceOverview 
        ? { 
            faceOverview: analysisData.faceAnalysis.faceOverview,
            careerFortune: analysisData.faceAnalysis.careerFortune,
            lifeReview: analysisData.faceAnalysis.lifeReview,
            meetingCompatibility: analysisData.faceAnalysis.meetingCompatibility,
          }
        : undefined;

    devLog("📊 불러온 totalReviewData:", totalReviewData);

    // 체질 분석 데이터 (저장된 sajuInfo와 totalReview)
    const constitutionSajuInfo = analysisData.constitutionAnalysis?.sajuInfo || null;
    const constitutionTotalReview = analysisData.constitutionAnalysis?.totalReview || null;

    devLog("📊 불러온 체질 분석 데이터:", { sajuInfo: constitutionSajuInfo, totalReview: constitutionTotalReview });

    return (
        <div className="w-full max-w-7xl mx-auto pb-20" id="shared-analysis-container">
            {/* 공유 결과 안내 배너 */}
            <div className="mb-6 p-4 bg-gradient-to-r from-brand-green/10 to-brand-green/5 rounded-2xl border border-brand-green/20">
                <p className="text-center text-gray-700 text-sm">
                    🔗 공유된 관상 분석 결과입니다
                </p>
            </div>

            {/* Tab Navigation - 관상 분석, 체질 분석만 */}
            <TabNavigation
                tabs={[
                    { id: "physiognomy", label: "관상 분석", icon: Brain },
                    { id: "constitution", label: "체질 분석", icon: Heart },
                ]}
                activeTab={currentTab}
                onTabChange={(tabId) => setCurrentTab(tabId as "physiognomy" | "constitution")}
                activeColor="green"
            />

            {/* 탭 컨텐츠 */}
            <motion.div
                key={currentTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
            >
                {/* 관상 분석 탭 */}
                {currentTab === "physiognomy" && featuresData && (
                    <FaceAnalysis
                        image=""
                        features={featuresData}
                        totalReview={totalReviewData}
                    />
                )}

                {/* 체질 분석 탭 */}
                {currentTab === "constitution" && (
                    <StatsAnalysis
                        tab="constitution"
                        images={[]}
                        constitutionPhase={constitutionPhase}
                        onConstitutionPhaseChange={setConstitutionPhase}
                        constitutionSelectedMenuIdx={constitutionSelectedMenuIdx}
                        onConstitutionSelectedMenuIdxChange={setConstitutionSelectedMenuIdx}
                        sajuInfo={constitutionSajuInfo}
                        totalReview={constitutionTotalReview}
                    />
                )}
            </motion.div>

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
