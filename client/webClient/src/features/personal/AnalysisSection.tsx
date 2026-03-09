import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Camera, RotateCcw, Download, QrCode, Images, Share2, ImageOff, Loader2, User } from "lucide-react";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { FaceAnalysis } from "./face/components/FaceAnalysis";
import { StatsAnalysis, type ConstitutionPhase } from "./stats/components/StatsAnalysis";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/core/Modal";
import { SajuAnalysisResponse } from "@/services/sajuApi";
import { 
    Stage1Response, 
    TotalReview, 
    transformToFaceAnalysisFeatures 
} from "@/services/faceAnalysisApi";
import { savePersonalAnalysis, type PersonalAnalysisData } from "@/services/personalAnalysisApi";
import { toast } from "sonner";
import { devError } from "@/utils/logger";
import html2canvas from "html2canvas";
import { useHideTurtleGuide } from "@/contexts/HideTurtleGuideContext";
import { useTurtleGuideState } from "@/contexts/TurtleGuideStateContext";
import { TabNavigation } from "@/components/common/TabNavigation";
import { GlassCard } from "@/components/ui/core/GlassCard";

// --- Types ---
export interface AnalysisSectionProps {
    images?: string[];
    onRestart: () => void;
    onNavigateToPhotoBooth?: () => void;
    frameImage?: string;
    fromPhotoBooth?: boolean;
    // 실제 API 결과 데이터 (옵션)
    faceAnalysisResult?: Stage1Response | null;
    totalReview?: TotalReview | null;
    isLoading?: boolean;
    /** first-remaining(인생회고·방향성·만남) 로딩 중 → 관상 탭에서 해당 블록 로딩 UI */
    loadingRemaining?: boolean;
    /** second(체질·웰스토리) 로딩 중 → 체질 탭 로딩 UI */
    loadingConstitution?: boolean;
    /** 분석 시작 시 생성된 UUID (분석하기 버튼 누르면 이미 저장됨) */
    analysisUuid?: string | null;
    /** 링크 공유 시 1차 DB 저장이 끝날 때까지 기다리는 Promise. 없으면 대기 없이 모달 오픈 */
    ensureSavedForShare?: () => Promise<void>;
}

// --- Main Component ---
export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ 
    images = [],
    onRestart,
    onNavigateToPhotoBooth,
    frameImage,
    fromPhotoBooth,
    faceAnalysisResult,
    totalReview: totalReviewProp,
    isLoading = false,
    loadingRemaining = false,
    loadingConstitution = false,
    analysisUuid,
    ensureSavedForShare,
}) => {
    const [currentTab, setCurrentTab] = useState<"physiognomy" | "constitution" | "future" | "ssafy-cut">(
        "physiognomy"
    );
    const { setHideTurtleGuide } = useHideTurtleGuide();
    const { setPersonalResultTab } = useTurtleGuideState();

    // 체질 분석 탭일 때만 플로팅 거북 도사 숨김
    useEffect(() => {
        setHideTurtleGuide(currentTab === "constitution");
        return () => setHideTurtleGuide(false);
    }, [currentTab, setHideTurtleGuide]);

    // 탭 변경 시 TurtleGuide 멘트 갱신
    useEffect(() => {
        setPersonalResultTab(currentTab);
    }, [currentTab, setPersonalResultTab]);

    // API 결과가 있으면 변환하여 사용 (렌더 시점 계산)
    const featuresData =
        faceAnalysisResult?.faceAnalysis && faceAnalysisResult?.meta
            ? transformToFaceAnalysisFeatures(
                faceAnalysisResult.faceAnalysis,
                faceAnalysisResult.meta
            )
            : null;

    // totalReview — 있으면 그대로, 없으면 undefined (FaceAnalysis에서 기본값 사용)
    const totalReviewData = totalReviewProp ?? undefined;

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSavingShare, setIsSavingShare] = useState(false);
    /** 링크 공유하기 클릭 시 1차 DB 저장 대기 중 (로딩 표시용) */
    const [isPreparingShare, setIsPreparingShare] = useState(false);
    const [savedUuid, setSavedUuid] = useState<string | null>(analysisUuid || null);
    const [futureImage, setFutureImage] = useState<string | null>(null);
    const [savedFrameImage, setSavedFrameImage] = useState<string | null>(null);

    // 체질 분석 상태 (다른 탭 갔다 와도 마지막 결과 뷰 유지)
    const [constitutionPhase, setConstitutionPhase] = useState<ConstitutionPhase>("intro");
    const [constitutionSelectedMenuIdx, setConstitutionSelectedMenuIdx] = useState<number | null>(null);

    // localStorage에서 프레임 이미지 로드 (개인 관상용 키만 사용)
    useEffect(() => {
        const loadFrameImage = () => {
            try {
                const saved = localStorage.getItem("photoBoothSets_personal")
                    || localStorage.getItem("photoBoothSets");
                if (saved) {
                    const sets = JSON.parse(saved);
                    if (sets.length > 0 && sets[0].frameImage) {
                        setSavedFrameImage(sets[0].frameImage);
                    }
                }
            } catch (error) {
                devError("Failed to load frame image:", error);
            }
        };
        loadFrameImage();
        
        // frameImage prop이 변경될 때도 업데이트
        if (frameImage) {
            setSavedFrameImage(frameImage);
        }
    }, [frameImage]);

    // fromPhotoBooth가 true이고 frameImage가 있으면 싸피네컷 탭으로 이동
    useEffect(() => {
        if (fromPhotoBooth && (frameImage || savedFrameImage)) {
            setCurrentTab("ssafy-cut");
            // 탭으로 스크롤
            setTimeout(() => {
                const tabElement = document.querySelector('[data-tab="ssafy-cut"]');
                if (tabElement) {
                    tabElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
        }
    }, [fromPhotoBooth, frameImage, savedFrameImage]);

    // 공유 URL 생성 (UUID가 있으면 실제 URL, 없으면 임시)
    const shareUrl = savedUuid 
        ? `${window.location.origin}/personal/${savedUuid}` 
        : `${window.location.origin}/result/temp`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    const handleShare = async () => {
        // 이미 저장된 UUID가 있으면, 1차 DB 저장이 끝날 때까지 잠깐 대기 후 모달 열기 (공유 링크 열었을 때 데이터 보장)
        if (savedUuid) {
            if (ensureSavedForShare) {
                setIsPreparingShare(true);
                try {
                    await ensureSavedForShare();
                } catch (e) {
                    devError('공유 준비(저장 대기) 중 오류:', e);
                } finally {
                    setIsPreparingShare(false);
                }
            }
            setIsShareModalOpen(true);
            return;
        }

        // 저장할 데이터 준비
        setIsSavingShare(true);
        try {
            // 관상 분석 데이터 준비
            const faceAnalysisData: PersonalAnalysisData["faceAnalysis"] = {};
            
            // totalReview에서 faceOverview, careerFortune, lifeReview 가져오기
            if (totalReviewData?.faceOverview) {
                faceAnalysisData.faceOverview = totalReviewData.faceOverview;
            }
            if (totalReviewData?.careerFortune) {
                faceAnalysisData.careerFortune = totalReviewData.careerFortune;
            }
            if (totalReviewData?.lifeReview) {
                faceAnalysisData.lifeReview = totalReviewData.lifeReview;
            }
            if (totalReviewData?.meetingCompatibility) {
                faceAnalysisData.meetingCompatibility = totalReviewData.meetingCompatibility;
            }
            
            // featuresData에서 각 부위별 데이터 가져오기
            if (featuresData) {
                if (featuresData.common) faceAnalysisData.common = featuresData.common;
                if (featuresData.faceShape) faceAnalysisData.faceShape = featuresData.faceShape;
                if (featuresData.forehead) faceAnalysisData.forehead = featuresData.forehead;
                if (featuresData.eyes) faceAnalysisData.eyes = featuresData.eyes;
                if (featuresData.nose) faceAnalysisData.nose = featuresData.nose;
                if (featuresData.mouth) faceAnalysisData.mouth = featuresData.mouth;
                if (featuresData.chin) faceAnalysisData.chin = featuresData.chin;
            }
            

            // 체질 분석 데이터 준비 (체질 풀이에 필요한 sajuInfo와 totalReview 포함)
            const constitutionData: NonNullable<PersonalAnalysisData["constitutionAnalysis"]> = {
                phase: constitutionPhase,
                selectedMenuIdx: constitutionSelectedMenuIdx,
                // 체질 풀이에 필요한 데이터
                sajuInfo: faceAnalysisResult?.sajuInfo || null,
                totalReview: totalReviewData || null,
            };

            // API 호출하여 저장
            const uuid = await savePersonalAnalysis({
                faceAnalysis: faceAnalysisData,
                constitutionAnalysis: constitutionData,
            });

            // UUID 저장
            setSavedUuid(uuid);
            
            // 모달 열기
            setIsShareModalOpen(true);
        } catch (error) {
            toast.error('분석 결과 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSavingShare(false);
        }
    };

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        const element = document.getElementById("analysis-result-container");
        if (!element) {
            setIsDownloading(false);
            return;
        }

        try {
            // --- 캡처 전 스타일 조정 ---
            // 1. 스크롤 영역을 찾아서 강제로 확장
            const scrollArea = element.querySelector(".overflow-y-auto");
            const originalMaxHeight = (scrollArea as HTMLElement)?.style.maxHeight;
            const originalOverflow = (scrollArea as HTMLElement)?.style.overflowY;
            
            if (scrollArea) {
                (scrollArea as HTMLElement).style.maxHeight = "none";
                (scrollArea as HTMLElement).style.overflowY = "visible";
            }

            // 2. 캡처 실행
            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#f8fafc", // 배경색 지정
                scale: 2, // 고해상도
                logging: false,
            });

            // 3. 스타일 원상 복구
            if (scrollArea) {
                (scrollArea as HTMLElement).style.maxHeight = originalMaxHeight;
                (scrollArea as HTMLElement).style.overflowY = originalOverflow;
            }

            // 4. 다운로드
            const link = document.createElement('a');
            link.download = `관상분석결과_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            toast.error("이미지 저장 중 오류가 발생했습니다.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('링크가 복사되었습니다!');
    };

    // 분석 데이터 없음(로딩 완료 후) → 결과 없음 화면 (모임 궁합과 동일)
    if (!isLoading && !featuresData) {
        return (
            <div className="w-full min-w-0 mx-auto box-border pb-20 px-4">
                <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 text-center">
                    <User className="w-16 h-16 text-gray-300 mb-4" aria-hidden />
                    <h2 className="text-xl font-bold text-gray-800 font-display mb-2">결과 없음</h2>
                    <p className="text-gray-500 font-sans text-sm sm:text-base leading-relaxed">
                        분석된 데이터가 없습니다.
                        <br />
                        개인 관상을 다시 분석해 주세요.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto pb-20" id="analysis-result-container">
            {/* Tab Navigation */}
            <TabNavigation
                tabs={[
                    { id: "physiognomy", label: "관상 분석", icon: Brain },
                    { id: "constitution", label: "체질 분석", icon: Heart },
                    { id: "future", label: "미래의 나", icon: Camera },
                    { id: "ssafy-cut", label: "싸피네컷", icon: Images },
                ]}
                activeTab={currentTab}
                onTabChange={(tabId) => {
                    setCurrentTab(tabId as "physiognomy" | "constitution" | "future" | "ssafy-cut");
                }}
                activeColor="green"
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* --- Tab 1: Physiognomy Analysis --- */}
                    {currentTab === "physiognomy" && (
                        featuresData ? (
                            <FaceAnalysis
                                image={images[0] || ""}
                                features={featuresData}
                                totalReview={totalReviewData}
                                loadingRemaining={loadingRemaining}
                            />
                        ) : (
                            <GlassCard className="w-full max-w-2xl mx-auto min-h-[320px] p-10 sm:p-12 border-4 border-white rounded-[32px] shadow-clay-lg bg-white/70 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mb-5">
                                    <Loader2 className="w-8 h-8 text-brand-green animate-spin" strokeWidth={2} />
                                </div>
                                <p className="text-gray-800 text-lg font-semibold font-display mb-1">분석 결과를 불러오는 중...</p>
                                <p className="text-gray-500 text-sm">잠시만 기다려주세요</p>
                                <div className="mt-6 flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <span
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-brand-green/60 animate-pulse"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        />
                                    ))}
                                </div>
                            </GlassCard>
                        )
                    )}

                    {/* --- Tab 2 & 3: Constitution & Future --- */}
                    {(currentTab === "constitution" || currentTab === "future") && (
                        <StatsAnalysis
                            tab={currentTab}
                            images={images}
                            futureImage={futureImage}
                            onFutureImageUpload={setFutureImage}
                            constitutionPhase={constitutionPhase}
                            onConstitutionPhaseChange={setConstitutionPhase}
                            constitutionSelectedMenuIdx={constitutionSelectedMenuIdx}
                            onConstitutionSelectedMenuIdxChange={setConstitutionSelectedMenuIdx}
                            sajuInfo={faceAnalysisResult?.sajuInfo}
                            totalReview={totalReviewData ?? undefined}
                            loadingConstitution={loadingConstitution}
                        />
                    )}

                    {/* --- Tab 4: 싸피네컷 --- */}
                    {currentTab === "ssafy-cut" && (
                        <div className="flex flex-col items-center justify-center px-4">
                            {(frameImage || savedFrameImage) ? (
                                <div className="w-full max-w-4xl space-y-8">
                                    <div className="flex justify-center">
                                        <div className="relative w-full max-w-2xl">
                                            <img
                                                src={frameImage || savedFrameImage || ""}
                                                alt="싸피네컷"
                                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <ActionButton
                                            variant="primary"
                                            onClick={() => {
                                                const link = document.createElement("a");
                                                link.download = "싸피네컷.png";
                                                link.href = frameImage || savedFrameImage || "";
                                                link.click();
                                            }}
                                        >
                                            <Download size={20} className="mr-2" />
                                            이미지 다운로드
                                        </ActionButton>
                                        {onNavigateToPhotoBooth && (
                                            <ActionButton
                                                variant="secondary"
                                                onClick={onNavigateToPhotoBooth}
                                            >
                                                <RotateCcw size={20} className="mr-2" />
                                                다시 찍기
                                            </ActionButton>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <GlassCard className="w-full max-w-2xl mx-auto p-10 sm:p-12 border-4 border-white rounded-[32px] shadow-clay-lg bg-white/70 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <ImageOff className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-gray-600 text-lg font-medium font-sans mb-6">촬영된 사진이 없습니다.</p>
                                    {onNavigateToPhotoBooth && (
                                        <ActionButton
                                            variant="secondary"
                                            onClick={onNavigateToPhotoBooth}
                                            className="flex items-center gap-2"
                                        >
                                            <Images size={20} />
                                            사진 찍기
                                        </ActionButton>
                                    )}
                                </GlassCard>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-16 pb-10 no-capture">
                <ActionButton 
                    variant="primary" 
                    onClick={handleShare} 
                    className="flex items-center gap-2"
                    disabled={isSavingShare || isPreparingShare}
                >
                    {isSavingShare ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> 저장 중...
                        </>
                    ) : isPreparingShare ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> 링크 준비 중...
                        </>
                    ) : (
                        <>
                            <Share2 size={20} /> 링크 공유하기
                        </>
                    )}
                </ActionButton>
            </div>

            {/* QR 공유 모달 */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} size="md">
                <ModalHeader description="QR 코드를 스캔하거나 링크를 공유하세요">
                    결과 공유하기
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-clay-sm border-4 border-brand-green-muted">
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
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};
