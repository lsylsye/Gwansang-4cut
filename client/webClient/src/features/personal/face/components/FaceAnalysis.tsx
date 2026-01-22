import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Sparkles, ChevronDown, ChevronUp, Brain, Briefcase, Users, Star } from "lucide-react";
import { ResultCharts } from "@/features/personal/stats/components/ResultCharts";

// --- Types ---
interface FaceAnalysisProps {
    image: string;
    scores: any[];
    features: any;
    totalAnalysis: string;
}

// --- Work Compatibility Mock Data ---
const WORK_COMPATIBILITY = {
    bestMatch: {
        type: "분석형 파트너",
        desc: "꼼꼼하고 논리적인 ISTJ, INTJ 유형과 환상의 호흡을 자랑합니다.",
        score: 95,
    },
    worstMatch: {
        type: "즉흥형 파트너",
        desc: "계획 없이 움직이는 ESFP, ESTP 유형과는 템포가 맞지 않을 수 있습니다.",
        score: 45,
    },
    teamRole: "아이디어 제안자",
    teamRoleDesc: "팀 내에서 새로운 방향을 제시하고 창의적인 해결책을 도출하는 역할을 합니다.",
    historicalMatch: {
        name: "세종대왕",
        desc: "학문을 사랑하고 백성을 위해 헌신한 세종대왕과 비슷한 관상입니다. 지도력과 창의성이 뛰어납니다.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/King_Sejong_statue_Gwanghwamun.jpg/220px-King_Sejong_statue_Gwanghwamun.jpg",
    },
};

export const FaceAnalysis: React.FC<FaceAnalysisProps> = ({ image, scores, features, totalAnalysis }) => {
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(true);

    // SVG Paths for Face
    const faceParts = [
        { id: "forehead", label: "이마 (초년운)", cx: 100, cy: 55, d: "M50,60 Q100,25 150,60 Q150,75 100,75 Q50,75 50,60 Z" },
        { id: "eyes", label: "눈 (감수성)", cx: 100, cy: 92, d: "M45,90 Q70,80 95,90 L105,90 Q130,80 155,90 Q150,105 100,105 Q50,105 45,90 Z" },
        { id: "nose", label: "코 (재물운)", cx: 100, cy: 120, d: "M90,105 L110,105 L115,135 L85,135 Z" },
        { id: "mouth", label: "입 (말년운)", cx: 100, cy: 155, d: "M75,150 Q100,145 125,150 Q125,165 100,170 Q75,165 75,150 Z" },
        { id: "chin", label: "턱 (인덕)", cx: 100, cy: 185, d: "M70,180 Q100,210 130,180 Q100,200 70,180 Z" },
        { id: "ears", label: "귀 (장수)", cx: 180, cy: 100, d: "M40,80 Q25,95 40,110 M160,80 Q175,95 160,110 Z" },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-5/12 space-y-8">
                <div className="relative">
                    <GlassCard className="w-full aspect-square flex items-center justify-center p-0 overflow-hidden relative shadow-clay-lg bg-white/40 border-[10px] border-white rounded-[48px] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/5" />

                        {/* 안내 문구 - 카드 내부 상단 */}
                        {!activeFeature && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none"
                            >
                                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-display text-sm text-[#00897B] shadow-clay-xs border-2 border-white flex items-center gap-2 animate-bounce-subtle">
                                    <Sparkles size={16} />
                                    궁금한 부위를 눌러보세요
                                </div>
                            </motion.div>
                        )}

                        {/* Background Face Image with Overlay */}
                        <div className="absolute inset-0">
                            <img
                                src={image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                                alt="Face Analysis"
                                className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-[#00897B]/5 backdrop-blur-[2px]" />
                        </div>

                        <svg viewBox="0 0 200 220" className="h-[85%] w-[85%] relative z-10 drop-shadow-2xl">
                            {/* Face Outline Guide */}
                            <path
                                d="M40,60 Q100,-20 160,60 V140 Q160,220 100,220 Q40,220 40,140 Z"
                                className="fill-white/40 stroke-white stroke-[4] stroke-dasharray-[8,4]"
                            />

                            {faceParts.map((part) => {
                                const isActive = activeFeature === part.id;
                                return (
                                    <motion.g
                                        key={part.id}
                                        onClick={() => setActiveFeature(isActive ? null : part.id)}
                                        className="cursor-pointer"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {/* Hotspot Area */}
                                        <path
                                            d={part.d}
                                            className={`transition-all duration-500 ${isActive
                                                ? "fill-[#00897B]/60 stroke-[#00897B] stroke-2 shadow-[0_0_20px_rgba(0,137,123,0.5)]"
                                                : "fill-white/20 stroke-white/40 hover:fill-[#00897B]/20 hover:stroke-[#00897B]/50"
                                                }`}
                                        />

                                        {/* Pulsing Indicator Dot */}
                                        <motion.circle
                                            cx={part.cx}
                                            cy={part.cy}
                                            r={isActive ? 6 : 4}
                                            initial={{ opacity: 1 }}
                                            animate={isActive ? { r: [6, 8, 6], opacity: [1, 0.6, 1] } : { r: 4, opacity: 1 }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className={`${isActive ? "fill-white" : "fill-[#00897B]"} stroke-white stroke-1 shadow-sm`}
                                        />

                                        {/* Tooltip Label */}
                                        <text
                                            x={part.cx}
                                            y={part.cy - 12}
                                            textAnchor="middle"
                                            className={`text-[9px] font-bold transition-all duration-300 pointer-events-none select-none ${isActive
                                                ? "fill-gray-900 opacity-100 drop-shadow-sm"
                                                : "fill-gray-500 opacity-0 group-hover:opacity-60"
                                                }`}
                                        >
                                            {part.label.split(' ')[0]}
                                        </text>
                                    </motion.g>
                                );
                            })}
                        </svg>

                        <AnimatePresence>
                            {activeFeature && (
                                <>
                                    {/* Backdrop Overlay - 외부 클릭 영역 */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[15]"
                                        onClick={() => setActiveFeature(null)}
                                    />

                                    {/* Feature Card */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                        key={activeFeature}
                                        className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl shadow-clay-md border-4 border-white rounded-[32px] p-6 text-center z-20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="inline-block px-3 py-1 bg-[#E0F2F1] text-[#00897B] rounded-full text-[10px] font-black mb-2 uppercase tracking-wider">
                                            {faceParts.find(p => p.id === activeFeature)?.label}
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-2 text-xl font-display">
                                            {features[activeFeature].title}
                                        </h4>
                                        <p className="text-sm text-gray-600 font-hand leading-relaxed">
                                            {features[activeFeature].desc}
                                        </p>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </GlassCard>
                </div>
                <GlassCard className="w-full p-8 shadow-clay-sm border-4 border-white rounded-[32px]">
                    <h4 className="font-bold text-gray-800 mb-4 font-display">운세 그래프</h4>
                    <ResultCharts data={scores} />
                </GlassCard>
            </div>

            <div className="w-full lg:w-7/12 flex flex-col gap-6">
                {/* 업무 상성 섹션 */}
                <GlassCard className="p-8 border-4 border-white rounded-[40px] shadow-clay-md bg-white/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-[#FF7043] rounded-2xl flex items-center justify-center text-2xl shadow-clay-xs">
                            <Briefcase className="text-white" size={24} />
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800 font-display">업무 상성 분석</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Best Match */}
                        <div className="bg-[#E8F5E9] p-5 rounded-2xl border-2 border-green-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-green-600" />
                                    <span className="font-bold text-green-800">최고의 파트너</span>
                                </div>
                                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    궁합 {WORK_COMPATIBILITY.bestMatch.score}%
                                </span>
                            </div>
                            <p className="font-bold text-lg text-gray-800 mb-1">{WORK_COMPATIBILITY.bestMatch.type}</p>
                            <p className="text-sm text-gray-600">{WORK_COMPATIBILITY.bestMatch.desc}</p>
                        </div>

                        {/* Team Role */}
                        <div className="bg-[#E3F2FD] p-5 rounded-2xl border-2 border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Star size={18} className="text-blue-600" />
                                <span className="font-bold text-blue-800">팀 내 역할</span>
                            </div>
                            <p className="font-bold text-lg text-gray-800 mb-1">{WORK_COMPATIBILITY.teamRole}</p>
                            <p className="text-sm text-gray-600">{WORK_COMPATIBILITY.teamRoleDesc}</p>
                        </div>

                        {/* Worst Match */}
                        <div className="bg-[#FFF3E0] p-5 rounded-2xl border-2 border-orange-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-orange-600" />
                                    <span className="font-bold text-orange-800">주의할 파트너</span>
                                </div>
                                <span className="bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    궁합 {WORK_COMPATIBILITY.worstMatch.score}%
                                </span>
                            </div>
                            <p className="font-bold text-lg text-gray-800 mb-1">{WORK_COMPATIBILITY.worstMatch.type}</p>
                            <p className="text-sm text-gray-600">{WORK_COMPATIBILITY.worstMatch.desc}</p>
                        </div>
                    </div>
                </GlassCard>

                {/* 역사적 인물 매칭 */}
                <GlassCard className="p-8 border-4 border-white rounded-[40px] shadow-clay-md bg-gradient-to-br from-amber-50/80 to-white/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-clay-xs">👑</div>
                        <h3 className="font-bold text-2xl text-gray-800 font-display">닮은 역사적 인물</h3>
                    </div>
                    
                    <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-clay-sm flex-shrink-0">
                            <img 
                                src={WORK_COMPATIBILITY.historicalMatch.image} 
                                alt={WORK_COMPATIBILITY.historicalMatch.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-2xl text-amber-800 mb-2 font-display">
                                {WORK_COMPATIBILITY.historicalMatch.name}
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {WORK_COMPATIBILITY.historicalMatch.desc}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="flex-1 p-10 border-4 border-white rounded-[40px] shadow-clay-md bg-white/40">
                    <div className="flex justify-between items-center mb-8 cursor-pointer select-none" onClick={() => setIsDetailOpen(!isDetailOpen)}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#00897B] rounded-2xl flex items-center justify-center text-2xl shadow-clay-xs">🐢</div>
                            <h3 className="font-bold text-3xl text-gray-800 font-display">거북 도사의 총평</h3>
                        </div>
                        {isDetailOpen ? <ChevronUp size={28} className="text-gray-400" /> : <ChevronDown size={28} className="text-gray-400" />}
                    </div>
                    <AnimatePresence>
                        {isDetailOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="text-gray-800 leading-relaxed whitespace-pre-line font-hand text-xl bg-white/80 p-8 rounded-[32px] border-2 border-white shadow-inner">
                                    {totalAnalysis}
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="bg-[#E0F2F1] p-4 rounded-2xl shadow-clay-xs border border-white">
                                        <p className="text-xs text-[#00897B] font-bold mb-1">행운의 색상</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-[#00897B] shadow-inner" />
                                            <span className="text-sm font-bold text-gray-700">에메랄드 그린</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#FFF3E0] p-4 rounded-2xl shadow-clay-xs border border-white">
                                        <p className="text-xs text-[#E65100] font-bold mb-1">행운의 숫자</p>
                                        <span className="text-xl font-bold text-gray-700">4, 8</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>
            </div>
        </div>
    );
};
