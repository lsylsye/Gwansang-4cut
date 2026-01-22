import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Camera, RotateCcw, Share2 } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { FaceAnalysis } from "./face/components/FaceAnalysis";
import { StatsAnalysis } from "./stats/components/StatsAnalysis";

// --- Types ---
interface AnalysisSectionProps {
    images?: string[];
    onRestart: () => void;
}

// --- Mock Data (Should ideally share with children or fetch) ---
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
    totalAnalysis: `전체적으로 **오행의 조화**가 잘 어우러진 얼굴입니다. 
  
  특히 **이마와 코**의 기운이 좋아 30대 이후 재물운이 급상승할 것으로 보입니다. 거북이가 보기에 당신은 꾸준히 노력하면 큰 성취를 이룰 수 있는 '대기만성형' 인재군요!
  
  올해는 새로운 인연을 만날 확률이 높으니 주변을 잘 살펴보세요.`,
};

// --- Main Component ---
export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ images = [], onRestart }) => {
    const [currentTab, setCurrentTab] = useState<"physiognomy" | "constitution" | "future">("physiognomy");

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: '거북이의 눈',
                text: '내 관상 분석 결과를 확인해보세요!',
                url: window.location.href,
            });
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-20">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-10">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl flex gap-1.5 shadow-clay-sm border-4 border-white">
                    {[
                        { id: "physiognomy", label: "관상 분석", icon: Brain },
                        { id: "constitution", label: "체질 분석", icon: Heart },
                        { id: "future", label: "미래의 나", icon: Camera },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentTab(tab.id as any)}
                                className={`
                            flex items-center gap-2 px-8 py-3.5 rounded-2xl transition-all duration-300 font-bold font-display
                            ${isActive
                                        ? "bg-[#00897B] text-white shadow-clay-xs scale-105"
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
                    {/* --- Tab 1: Physiognomy Analysis (Dev A) --- */}
                    {currentTab === "physiognomy" && (
                        <FaceAnalysis
                            image={images[0]}
                            scores={MOCK_DATA.scores}
                            features={MOCK_DATA.features}
                            totalAnalysis={MOCK_DATA.totalAnalysis}
                        />
                    )}

                    {/* --- Tab 2 & 3: Constitution & Future (Dev B) --- */}
                    {(currentTab === "constitution" || currentTab === "future") && (
                        <StatsAnalysis tab={currentTab} images={images} />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex justify-center gap-4 mt-16 pb-10">
                <ActionButton variant="secondary" onClick={onRestart} className="flex items-center gap-2">
                    <RotateCcw size={20} /> 처음으로
                </ActionButton>
                <ActionButton variant="primary" onClick={handleShare} className="flex items-center gap-2">
                    <Share2 size={20} /> 결과 공유하기
                </ActionButton>
            </div>
        </div>
    );
};
