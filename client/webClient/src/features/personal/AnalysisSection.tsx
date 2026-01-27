import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Camera, RotateCcw, Download, QrCode, Images } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { FaceAnalysis } from "./face/components/FaceAnalysis";
import { StatsAnalysis } from "./stats/components/StatsAnalysis";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import html2canvas from "html2canvas";

// --- Types ---
interface AnalysisSectionProps {
    images?: string[];
    onRestart: () => void;
    onNavigateToPhotoGallery?: () => void;
}

// --- Mock Data ---
const MOCK_DATA = {
    scores: [
        { subject: "재물운", A: 85, fullMark: 100 },
        { subject: "애정운", A: 92, fullMark: 100 },
        { subject: "건강운", A: 70, fullMark: 100 },
        { subject: "직업운", A: 88, fullMark: 100 },
        { subject: "사회운", A: 65, fullMark: 100 },
    ],
    features: {
        forehead: {
            title: "넓고 반듯한 이마",
            desc: "초년운이 좋고 지혜롭습니다. 윗사람의 덕을 볼 수 있는 상입니다.",
        },
        eyes: {
            title: "맑고 긴 눈매",
            desc: "통찰력이 뛰어나고 감수성이 풍부합니다. 도화살이 있어 인기가 많을 수 있습니다.",
        },
        nose: {
            title: "도톰한 콧망울",
            desc: "재물복이 들어오는 코입니다. 돈을 모으는 능력이 탁월합니다.",
        },
        mouth: {
            title: "입꼬리가 올라간 입",
            desc: "긍정적인 에너지를 발산하며 말년운이 평안할 관상입니다.",
        },
        chin: {
            title: "둥글고 두툼한 턱",
            desc: "말년운이 좋고 아랫사람의 존경을 받습니다. 부동산 운이 따를 수 있습니다.",
        },
        ears: {
            title: "도톰한 귓불",
            desc: "인내심이 강하고 재복이 따르는 귀입니다. 건강하고 장수할 운명을 타고났습니다.",
        },
    },
    totalAnalysis: [
        {
            title: "전체적인 관상평",
            content: "귀하의 관상은 전체적으로 **오행의 순환이 매우 매끄럽고 조화로운 '수려형'**에 속합니다. 전체적으로 밸런스가 좋아 평생 의식주가 풍족할 길상입니다."
        },
        {
            title: "취업운과 직업적성 (관록궁)",
            content: "이마의 중심부인 '관록궁'이 깨끗하고 빛이 나고 있어, 조직 생활에서의 승진운과 명예운이 매우 따르는 상입니다. \n\n취업을 준비 중이라면 자신의 논리적 사고를 발휘할 수 있는 전문직이나 연구직, 혹은 사람들을 이끄는 관리직군에서 큰 두각을 나타낼 것입니다. 특히 올해는 본인의 역량을 인정해 줄 귀인이 나타날 운세이니 면접이나 중요한 미팅에서 자신감을 가지세요."
        },
        {
            title: "초년운과 지혜 (이마)",
            content: "상정(이마)을 살펴보면, 넓고 기세가 좋아 초년운이 매우 안정적이었음을 알 수 있습니다. 특히 일월각(눈썹 위)의 기운이 뚜렷하여 윗사람이나 부모님의 덕을 많이 입었을 관상입니다."
        },
        {
            title: "중년의 재물운 (코와 눈)",
            content: "코의 기운이 가장 돋보입니다. 콧대가 곧고 콧망울이 도톰하여 재물을 모으는 힘인 '수재운'이 매우 강력합니다. 30대 중반부터 40대 중반 사이에 큰 재정적 성취를 이룰 기회가 반드시 찾아올 것입니다.\n\n다만, 눈매가 깊고 길어 감수성이 풍부한 만큼 결정적인 순간에 감정에 치우치지 않도록 주의가 필요합니다."
        },
        {
            title: "말년의 덕망과 평안 (턱)",
            content: "턱의 선이 둥글고 두툼하게 감싸고 있어, 나이가 들수록 주변에 사람이 모이고 아랫사람들로부터 신뢰와 존경을 받는 리더의 상을 갖추고 있습니다. 말년으로 갈수록 주거 환경이 안정되고 부동산 운이 따를 것입니다."
        },
        {
            title: "거북 도사의 특별 조언",
            content: "당신은 마치 **'천천히 하지만 쉼 없이 바다를 건너는 거북이'**처럼 끈기 있게 목표를 향해 나아가는 대기만성형 인재입니다. 올해는 특히 북동쪽에서 귀인이 나타날 운세이니, 새로운 사람과의 만남을 소홀히 하지 마세요."
        }
    ],
};

// --- Main Component ---
export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ images = [], onRestart, onNavigateToPhotoGallery }) => {
    const [currentTab, setCurrentTab] = useState<"physiognomy" | "constitution" | "future" | "photo-gallery">("physiognomy");
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [futureImage, setFutureImage] = useState<string | null>(null);

    // Mock QR code URL
    const shareUrl = `${window.location.origin}/result/abc123`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    const handleShare = () => {
        setIsShareModalOpen(true);
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
            console.error("다운로드 중 오류 발생:", error);
            alert("이미지 저장 중 오류가 발생했습니다.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('링크가 복사되었습니다!');
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-20" id="analysis-result-container">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-10 no-capture">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl flex gap-1.5 shadow-clay-sm border-4 border-white">
                    {[
                        { id: "physiognomy", label: "관상 분석", icon: Brain },
                        { id: "constitution", label: "체질 분석", icon: Heart },
                        { id: "future", label: "미래의 나", icon: Camera },
                        { id: "photo-gallery", label: "싸피네컷", icon: Images },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === "photo-gallery" && onNavigateToPhotoGallery) {
                                        onNavigateToPhotoGallery();
                                    } else {
                                        setCurrentTab(tab.id as any);
                                    }
                                }}
                                className={`
                            flex items-center gap-2 px-8 py-3.5 rounded-2xl transition-all duration-300 font-bold font-display
                            ${isActive
                                        ? "bg-brand-green text-white shadow-clay-xs scale-105"
                                        : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}
                        `}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

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
                        <FaceAnalysis
                            image={images[0] || ""}
                            scores={MOCK_DATA.scores}
                            features={MOCK_DATA.features}
                            totalAnalysis={MOCK_DATA.totalAnalysis}
                        />
                    )}

                    {/* --- Tab 2 & 3: Constitution & Future --- */}
                    {(currentTab === "constitution" || currentTab === "future") && (
                        <StatsAnalysis 
                            tab={currentTab} 
                            images={images} 
                            futureImage={futureImage}
                            onFutureImageUpload={setFutureImage}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-16 pb-10 no-capture">
                <ActionButton variant="secondary" onClick={onRestart} className="flex items-center gap-2">
                    <RotateCcw size={20} /> 처음으로
                </ActionButton>
                <ActionButton 
                    variant="secondary" 
                    onClick={handleDownload} 
                    className="flex items-center gap-2"
                    disabled={isDownloading}
                >
                    <Download size={20} /> {isDownloading ? "저장 중..." : "결과 다운로드"}
                </ActionButton>
                <ActionButton variant="primary" onClick={handleShare} className="flex items-center gap-2">
                    <QrCode size={20} /> QR로 공유하기
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
                            <ActionButton 
                                variant="primary" 
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
