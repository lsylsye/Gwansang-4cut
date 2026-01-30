import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { GroupMember } from "@/shared/types";
import { GroupRelations } from "./relations/components/GroupRelations";
import { GroupResult } from "./result/components/GroupResult";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Separator } from "@/shared/ui/core/separator";
import { Sparkles, Trophy, QrCode, Download } from "lucide-react";

const MOCK_SCORE = 88;
const MOCK_PERSONALITY_TITLE = "재물운이 가득한 황금빛 모임";

interface GroupAnalysisSectionProps {
    groupMembers?: GroupMember[];
    groupImage?: string;
    onRestart: () => void;
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({
    groupMembers = [],
    groupImage,
    onViewRanking,
}) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const shareUrl = `${window.location.origin}/group-result/xyz789`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert("링크가 복사되었습니다!");
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-20">
            {/* 헤더 */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center mb-10"
            >
                <div className="inline-flex items-center gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-vibrant flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display tracking-tight">
                        <span className="bg-gradient-to-r from-brand-orange to-brand-orange-vibrant bg-clip-text text-transparent">
                            모임 관상
                        </span>
                        <span className="text-gray-900"> 결과</span>
                    </h1>
                </div>
                <p className="text-sm text-gray-500 font-sans max-w-md mx-auto">
                    천기를 읽어 자네들의 인연을 점수화해 보았네!
                </p>
            </motion.div>

            <GroupResult groupImage={groupImage} onViewRanking={onViewRanking} />

            <Separator className="my-10 bg-gray-200" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                <GroupRelations groupMembers={groupMembers} />
            </motion.div>

            <Separator className="my-10 bg-gray-200" />

            {/* 전체 랭킹 / QR 공유 */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
            >
                <GlassCard className="p-5 sm:p-6 border-orange-200/40">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <ActionButton
                            variant="orange-secondary"
                            onClick={() => onViewRanking?.(MOCK_SCORE, MOCK_PERSONALITY_TITLE)}
                            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3"
                        >
                            <Trophy size={18} />
                            전체 랭킹 확인하기
                        </ActionButton>
                        <ActionButton
                            variant="orange-primary"
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3"
                        >
                            <QrCode size={18} />
                            QR로 공유하기
                        </ActionButton>
                    </div>
                </GlassCard>
            </motion.div>

            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} size="md">
                <ModalHeader description="QR 코드를 스캔하거나 링크를 공유하세요">
                    모임 결과 공유하기
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col items-center gap-5">
                        <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 shadow-sm">
                            <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44" />
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            QR 코드를 스캔하면 모임 결과 페이지로 이동합니다
                        </p>
                        <div className="flex gap-3 w-full">
                            <ActionButton
                                variant="orange-secondary"
                                onClick={handleCopyLink}
                                className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
                            >
                                링크 복사
                            </ActionButton>
                            <ActionButton
                                variant="orange-primary"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.download = "group-qr-code.png";
                                    link.href = qrCodeUrl;
                                    link.click();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
                            >
                                <Download size={16} /> QR 저장
                            </ActionButton>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};
