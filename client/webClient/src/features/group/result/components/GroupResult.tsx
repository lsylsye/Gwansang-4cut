import React from "react";
import { motion } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Sparkles, Flame, Trophy, Coins, Zap, Utensils, Clock, Share2 } from "lucide-react";

// --- Mock Data (Moved from GroupAnalysisSection) ---
const GROUP_MOCK_DATA = {
    personality: {
        title: "재물운이 가득한 황금빛 모임",
        description: "모두의 기운이 토(土)와 금(金)에 집중되어 재복이 넘치는군요. 함께 사업을 하거나 투자를 한다면 거상(巨상)이 될 기운입니다.",
        keywords: ["#재물운폭발", "#황금시너지", "#부귀영화"]
    },
    compatibility: {
        score: 88,
        comment: "서로의 부족한 점을 채워주는\n환상의 짝꿍들입니다!",
        details: "리더형 관상과 참모형 관상이 적절히 섞여 있어, 무슨 일을 도모하든 성공 확률이 높습니다."
    },
    recommendations: {
        activities: [
            { name: "방탈출 카페", icon: "Brain" },
            { name: "볼링 내기", icon: "Activity" },
            { name: "등산", icon: "Mountain" }
        ],
        foods: [
            { name: "마라탕", icon: "Soup" },
            { name: "삼겹살", icon: "Beef" },
            { name: "치맥", icon: "Beer" }
        ],
        time: "저녁 7시 ~ 10시",
        timeDesc: "에너지가 가장 높게 솟구치는 시간"
    }
};

interface GroupResultProps {
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupResult: React.FC<GroupResultProps> = ({ onViewRanking }) => {
    return (
        <div className="space-y-8">
            {/* 0. Compatibility Score Section (TOP HIGHLIGHT) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="relative"
            >
                <GlassCard className="w-full p-8 md:p-10 bg-gradient-to-br from-white to-orange-50 border-4 border-white shadow-clay-lg overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF8A65] to-[#FF7043]"></div>

                    {/* Horizontal Layout */}
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        {/* Left: Score Circle */}
                        <div className="relative w-40 h-40 md:w-48 md:h-48 shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="#FFF3E0"
                                    strokeWidth="12"
                                />
                                <motion.circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 1000" }}
                                    animate={{ strokeDasharray: `${(GROUP_MOCK_DATA.compatibility.score / 100) * 100 * 6.28}% 1000` }}
                                    transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#FF8A65" />
                                        <stop offset="100%" stopColor="#FF7043" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.5, type: "spring" }}
                                    className="text-5xl md:text-7xl font-black text-gray-900 font-sans tracking-tighter"
                                >
                                    {GROUP_MOCK_DATA.compatibility.score}
                                </motion.span>
                                <span className="text-lg md:text-xl font-bold text-[#FF7043] font-display mt-[-4px]">점</span>
                            </div>
                        </div>

                        {/* Right: Content */}
                        <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 font-display mb-2 leading-snug">
                                    {GROUP_MOCK_DATA.compatibility.comment}
                                </h3>
                                <p className="text-gray-500 font-sans leading-relaxed text-sm md:text-base italic">
                                    "{GROUP_MOCK_DATA.compatibility.details}"
                                </p>
                            </div>

                            {/* Highlighted ranking button with animation */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
                            >
                                <ActionButton
                                    variant="orange-primary"
                                    onClick={() => onViewRanking?.(GROUP_MOCK_DATA.compatibility.score, GROUP_MOCK_DATA.personality.title)}
                                    className="px-8 py-5 text-lg font-bold flex items-center gap-3 mx-auto md:mx-0 shadow-2xl hover:shadow-3xl relative overflow-hidden group"
                                >
                                    {/* Animated background shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        animate={{
                                            x: ['-200%', '200%'],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                        }}
                                    />
                                    <Trophy size={22} className="relative z-10" />
                                    <span className="relative z-10">이 결과로 랭킹 등록하기</span>
                                    <motion.div
                                        animate={{
                                            rotate: [0, 10, -10, 0],
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            repeatDelay: 2,
                                        }}
                                        className="relative z-10"
                                    >
                                        ✨
                                    </motion.div>
                                </ActionButton>
                            </motion.div>
                        </div>
                    </div>

                    {/* Decorative particles */}
                    <div className="absolute top-6 left-6 text-orange-200 animate-pulse-slow"><Sparkles size={32} /></div>
                    <div className="absolute bottom-6 right-6 text-orange-200 animate-pulse-slower"><Flame size={32} /></div>
                </GlassCard>
            </motion.div>

            {/* 3. Group Personality Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <GlassCard className="w-full p-8 border-t-4 border-t-[#FF7043] shadow-pixel-lg">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-32 h-32 rounded-3xl bg-orange-100 flex items-center justify-center shrink-0 shadow-clay-sm relative overflow-hidden group">
                            <Coins className="w-16 h-16 text-[#FF7043] fill-orange-200 relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-transparent opacity-50"></div>
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-2">
                                {GROUP_MOCK_DATA.personality.keywords.map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full border border-orange-100 shadow-clay-xs font-sans">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 font-sans">
                                {GROUP_MOCK_DATA.personality.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed font-hand text-lg whitespace-pre-line bg-white/30 p-4 rounded-2xl border border-white/50">
                                {GROUP_MOCK_DATA.personality.description}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* 4. Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Activity */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <GlassCard className="h-full p-6 flex flex-col items-center text-center hover:bg-white/60 transition-colors shadow-pixel">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 text-blue-600 shadow-clay-xs">
                            <Zap className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-gray-800 mb-4 font-sans">추천 활동</h4>
                        <ul className="space-y-2 w-full">
                            {GROUP_MOCK_DATA.recommendations.activities.map((item, i) => (
                                <li key={i} className="text-gray-600 font-hand text-lg bg-white/50 px-3 py-2 rounded-xl w-full border border-white shadow-clay-xs">
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    </GlassCard>
                </motion.div>

                {/* Food */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <GlassCard className="h-full p-6 flex flex-col items-center text-center hover:bg-white/60 transition-colors shadow-pixel">
                        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 text-green-600 shadow-clay-xs">
                            <Utensils className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-gray-800 mb-4 font-sans">추천 음식</h4>
                        <ul className="space-y-2 w-full">
                            {GROUP_MOCK_DATA.recommendations.foods.map((item, i) => (
                                <li key={i} className="text-gray-600 font-hand text-lg bg-white/50 px-3 py-2 rounded-xl w-full border border-white shadow-clay-xs">
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    </GlassCard>
                </motion.div>

                {/* Time */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <GlassCard className="h-full p-6 flex flex-col items-center text-center hover:bg-white/60 transition-colors shadow-pixel">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 text-purple-600 shadow-clay-xs">
                            <Clock className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-gray-800 mb-4 font-sans">행운의 시간</h4>
                        <div className="bg-white/50 px-4 py-4 rounded-xl w-full flex flex-col gap-2 border border-white shadow-clay-xs">
                            <span className="text-xl font-bold text-purple-700 font-sans">{GROUP_MOCK_DATA.recommendations.time}</span>
                            <span className="text-xs text-gray-500 font-sans opacity-70">{GROUP_MOCK_DATA.recommendations.timeDesc}</span>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 mt-16 pt-10 border-t-4 border-dashed border-gray-100">
                <ActionButton variant="orange-secondary" onClick={() => onViewRanking?.(GROUP_MOCK_DATA.compatibility.score, GROUP_MOCK_DATA.personality.title)} className="flex-1 flex items-center justify-center gap-2 text-base">
                    <Trophy size={20} />
                    전체 랭킹 확인하기
                </ActionButton>
                <ActionButton variant="orange-primary" onClick={() => alert("공유 기능은 준비 중입니다!")} className="flex-1 flex items-center justify-center gap-2 text-base">
                    <Share2 size={20} />
                    결과 공유하기
                </ActionButton>
            </div>
        </div>
    );
};
