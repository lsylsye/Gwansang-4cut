import React, { useState } from "react";
import { motion } from "motion/react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/core/card";
import { Badge } from "@/shared/ui/core/badge";
import { Trophy, Coins, Zap, Utensils, Clock, QrCode, Download } from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";

// --- Mock Data (Moved from GroupAnalysisSection) ---
const GROUP_MOCK_DATA = {
    personality: {
        title: "재물운이 가득한 황금빛 모임",
        description: "모두의 기운이 토(土)와 금(金)에 집중되어\n재복이 넘치는군요.\n\n함께 사업을 하거나 투자를 한다면\n거상(巨상)이 될 기운입니다.",
        keywords: ["#재물운폭발", "#황금시너지", "#부귀영화"]
    },
    compatibility: {
        score: 88,
        comment: "서로의 부족한 점을 채워주는\n환상의 짝꿍들입니다!",
        details: "리더형 관상과 참모형 관상이 적절히 섞여 있어,\n무슨 일을 도모하든 성공 확률이 높습니다."
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
    groupImage?: string;
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupResult: React.FC<GroupResultProps> = ({ groupImage, onViewRanking }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    // Mock QR code URL
    const shareUrl = `${window.location.origin}/group-result/xyz789`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('링크가 복사되었습니다!');
    };

    return (
        <div className="space-y-6">
            {/* Compatibility Score - with_large_bordered_screenshot: 헤드라인 + 모임 사진 크게 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            >
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white via-orange-50/30 to-orange-50/50">
                    {/* Top accent bar - 왼쪽에서 오른쪽으로 그려지는 애니메이션 */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange-light via-brand-orange to-brand-orange-vibrant origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />

                    <CardContent className="p-8 md:p-12">
                        {/* 1. 헤드라인 - 페이드 + 살짝 위에서 */}
                        <motion.p
                            className="text-3xl font-semibold text-gray-900 font-display text-center"
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        >
                            {GROUP_MOCK_DATA.compatibility.comment.replace(/\n/g, " ")}
                        </motion.p>

                        {/* 2. 왼쪽: 사진 | 오른쪽: 88점 + 상세 설명 */}
                        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                            {/* 왼쪽: 모임 관상 분석 대상 사진 - 페이드 + 스케일 + 좌측에서 */}
                            <motion.div
                                className="relative w-full"
                                initial={{ opacity: 0, scale: 0.96, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="absolute -inset-2 rounded-2xl ring-1 shadow-sm ring-black/5" />
                                <div className="aspect-[17/10] w-full overflow-hidden rounded-xl ring-1 shadow-2xl ring-black/10">
                                    <img
                                        alt="모임 관상 분석 대상"
                                        src={groupImage || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </motion.div>
                            {/* 오른쪽: 88점(원형) + 상세 설명 + 랭킹 등록 버튼 */}
                            <div className="flex flex-col items-center justify-center gap-4">
                                {/* 점수 원 - 스프링 팝업 + 호버 시 살짝 확대 */}
                                <motion.div
                                    className="flex items-center justify-center w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-white to-orange-50/50 shadow-lg ring-2 ring-orange-200/60"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.3 }}
                                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                                >
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-brand-orange to-brand-orange-vibrant bg-clip-text text-transparent">
                                            {GROUP_MOCK_DATA.compatibility.score}
                                        </span>
                                        <span className="text-xl md:text-2xl font-semibold text-brand-orange">점</span>
                                    </div>
                                </motion.div>
                                <motion.p
                                    className="text-lg leading-8 text-gray-600 text-center whitespace-pre-line"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
                                >
                                    {GROUP_MOCK_DATA.compatibility.details}
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.65, ease: "easeOut" }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ActionButton
                                        variant="orange-primary"
                                        onClick={() => onViewRanking?.(GROUP_MOCK_DATA.compatibility.score, GROUP_MOCK_DATA.personality.title)}
                                        className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold shadow-lg hover:shadow-xl"
                                    >
                                        <Trophy size={20} />
                                        이 결과로 랭킹 등록하기
                                    </ActionButton>
                                </motion.div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Group Personality Card - Material Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <motion.div 
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-vibrant flex items-center justify-center shadow-md"
                                whileHover={{ scale: 1.08, rotate: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <Coins className="w-6 h-6 text-white" />
                            </motion.div>
                            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 font-display">
                                모임 성격 분석
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Icon Section */}
                            <motion.div 
                                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shrink-0 shadow-inner border border-orange-100"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 350, damping: 15 }}
                            >
                                <Coins className="w-12 h-12 md:w-14 md:h-14 text-brand-orange" />
                            </motion.div>
                            
                            {/* Content Section */}
                            <div className="flex-1 space-y-4">
                                {/* Keywords with Badge - stagger 등장 */}
                                <motion.div
                                    className="flex flex-wrap gap-2"
                                    variants={{
                                        hidden: {},
                                        show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
                                    }}
                                    initial="hidden"
                                    animate="show"
                                >
                                    {GROUP_MOCK_DATA.personality.keywords.map((kw, i) => (
                                        <motion.span
                                            key={i}
                                            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                                            transition={{ duration: 0.35, ease: "easeOut" }}
                                        >
                                            <Badge 
                                                variant="secondary" 
                                                className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 transition-colors px-3 py-1.5 text-sm font-semibold"
                                            >
                                                {kw}
                                            </Badge>
                                        </motion.span>
                                    ))}
                                </motion.div>
                                
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-display">
                                    {GROUP_MOCK_DATA.personality.title}
                                </h3>
                                
                                <div className="bg-gradient-to-br from-orange-50/50 to-white p-5 rounded-xl border border-orange-100 shadow-sm">
                                    <p className="text-gray-700 leading-relaxed font-sans text-base md:text-lg whitespace-pre-line">
                                        {GROUP_MOCK_DATA.personality.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recommendations Grid - Material Design Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Activity Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <motion.div 
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-5 shadow-sm border border-blue-100"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <Zap className="w-8 h-8 text-blue-600" />
                            </motion.div>
                            <CardTitle className="text-lg font-bold text-gray-900 mb-5 font-display">추천 활동</CardTitle>
                            <ul className="space-y-2.5 w-full">
                                {GROUP_MOCK_DATA.recommendations.activities.map((item, i) => (
                                    <li 
                                        key={i} 
                                        className="text-gray-700 font-sans text-base bg-gradient-to-r from-blue-50/50 to-white px-4 py-3 rounded-lg w-full border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        {item.name}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Food Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <motion.div 
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center mb-5 shadow-sm border border-green-100"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <Utensils className="w-8 h-8 text-green-600" />
                            </motion.div>
                            <CardTitle className="text-lg font-bold text-gray-900 mb-5 font-display">추천 음식</CardTitle>
                            <ul className="space-y-2.5 w-full">
                                {GROUP_MOCK_DATA.recommendations.foods.map((item, i) => (
                                    <li 
                                        key={i} 
                                        className="text-gray-700 font-sans text-base bg-gradient-to-r from-green-50/50 to-white px-4 py-3 rounded-lg w-full border border-green-100 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        {item.name}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Time Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <motion.div 
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mb-5 shadow-sm border border-purple-100"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <Clock className="w-8 h-8 text-purple-600" />
                            </motion.div>
                            <CardTitle className="text-lg font-bold text-gray-900 mb-5 font-display">행운의 시간</CardTitle>
                            <div className="bg-gradient-to-br from-purple-50/50 to-white px-5 py-5 rounded-xl w-full border border-purple-100 shadow-sm">
                                <div className="space-y-2">
                                    <span className="text-2xl font-bold text-purple-700 font-display block">
                                        {GROUP_MOCK_DATA.recommendations.time}
                                    </span>
                                    <span className="text-sm text-gray-600 font-sans block">
                                        {GROUP_MOCK_DATA.recommendations.timeDesc}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Action Buttons - Material Design */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-gray-200"
            >
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton 
                        variant="orange-secondary" 
                        onClick={() => onViewRanking?.(GROUP_MOCK_DATA.compatibility.score, GROUP_MOCK_DATA.personality.title)} 
                        className="w-full flex items-center justify-center gap-2 text-base shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        <Trophy size={20} />
                        전체 랭킹 확인하기
                    </ActionButton>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton 
                        variant="orange-primary" 
                        onClick={() => setIsShareModalOpen(true)} 
                        className="w-full flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <QrCode size={20} />
                        QR로 공유하기
                    </ActionButton>
                </motion.div>
            </motion.div>

            {/* QR 공유 모달 */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} size="md">
                <ModalHeader description="QR 코드를 스캔하거나 링크를 공유하세요">
                    모임 결과 공유하기
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-clay-sm border-4 border-brand-orange-muted">
                            <img 
                                src={qrCodeUrl} 
                                alt="QR Code" 
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            QR 코드를 스캔하면 모임 결과 페이지로 이동합니다
                        </p>
                        <div className="flex gap-3 w-full">
                            <ActionButton 
                                variant="orange-secondary" 
                                onClick={handleCopyLink}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                링크 복사
                            </ActionButton>
                            <ActionButton 
                                variant="orange-primary" 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = 'group-qr-code.png';
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
