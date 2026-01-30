import React from "react";
import { motion } from "motion/react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/core/card";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Badge } from "@/shared/ui/core/badge";
import { Trophy, Coins, Zap, Utensils, Clock } from "lucide-react";

const GROUP_MOCK_DATA = {
    personality: {
        title: "재물운이 가득한 황금빛 모임",
        description: "모두의 기운이 토(土)와 금(金)에 집중되어\n재복이 넘치는군요.\n\n함께 사업을 하거나 투자를 한다면\n거상(巨상)이 될 기운입니다.",
        keywords: ["#재물운폭발", "#황금시너지", "#부귀영화"],
    },
    compatibility: {
        score: 88,
        comment: "서로의 부족한 점을 채워주는 환상의 짝꿍들입니다!",
        details: "리더형 관상과 참모형 관상이 적절히 섞여 있어,\n무슨 일을 도모하든 성공 확률이 높습니다.",
    },
    recommendations: {
        activities: [
            { name: "방탈출 카페", icon: Zap },
            { name: "볼링 내기", icon: Zap },
            { name: "등산", icon: Zap },
        ],
        foods: [
            { name: "마라탕", icon: Utensils },
            { name: "삼겹살", icon: Utensils },
            { name: "치맥", icon: Utensils },
        ],
        time: "저녁 7시 ~ 10시",
        timeDesc: "에너지가 가장 높게 솟구치는 시간",
    },
};

interface GroupResultProps {
    groupImage?: string;
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupResult: React.FC<GroupResultProps> = ({ onViewRanking }) => {
    return (
        <div className="space-y-8">
            {/* 궁합 점수 히어로 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <GlassCard className="p-0 overflow-hidden border-orange-200/60 bg-white/80 shadow-lg">
                    <div className="h-1 bg-gradient-to-r from-brand-orange-light via-brand-orange to-brand-orange-vibrant" />
                    <div className="p-6 sm:p-8 md:p-10 text-center">
                        <p className="text-lg sm:text-xl font-semibold text-gray-800 font-display mb-4">
                            {GROUP_MOCK_DATA.compatibility.comment.replace(/\n/g, " ")}
                        </p>
                        <div className="flex flex-col items-center gap-5">
                            <motion.div
                                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-orange-50 to-white flex items-center justify-center ring-2 ring-orange-200/50 shadow-inner"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                            >
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-orange to-brand-orange-vibrant bg-clip-text text-transparent">
                                        {GROUP_MOCK_DATA.compatibility.score}
                                    </span>
                                    <span className="text-lg font-semibold text-brand-orange">점</span>
                                </div>
                            </motion.div>
                            <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line max-w-md">
                                {GROUP_MOCK_DATA.compatibility.details}
                            </p>
                            <ActionButton
                                variant="orange-primary"
                                onClick={() =>
                                    onViewRanking?.(GROUP_MOCK_DATA.compatibility.score, GROUP_MOCK_DATA.personality.title)
                                }
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold"
                            >
                                <Trophy size={18} />
                                이 결과로 랭킹 등록하기
                            </ActionButton>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* 모임 성격 분석 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
                <Card className="border border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Coins className="w-5 h-5 text-brand-orange" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900 font-display">
                                모임 성격 분석
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {GROUP_MOCK_DATA.personality.keywords.map((kw, i) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium"
                                >
                                    {kw}
                                </Badge>
                            ))}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 font-display">
                            {GROUP_MOCK_DATA.personality.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {GROUP_MOCK_DATA.personality.description}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* 추천 활동·음식·시간 - 한 카드로 정리 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            >
                <Card className="border border-gray-100 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            {/* 추천 활동 */}
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 font-display">추천 활동</span>
                                </div>
                                <ul className="space-y-2">
                                    {GROUP_MOCK_DATA.recommendations.activities.map((item, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* 추천 음식 */}
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Utensils className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 font-display">추천 음식</span>
                                </div>
                                <ul className="space-y-2">
                                    {GROUP_MOCK_DATA.recommendations.foods.map((item, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* 행운의 시간 */}
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-violet-600" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 font-display">행운의 시간</span>
                                </div>
                                <p className="text-base font-semibold text-violet-700 font-display">
                                    {GROUP_MOCK_DATA.recommendations.time}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {GROUP_MOCK_DATA.recommendations.timeDesc}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};
