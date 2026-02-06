import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
    Heart,
    CheckCircle2,
    Minus,
    ShieldAlert,
    XCircle,
    HeartHandshake,
    LucideIcon,
} from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { useIsMobile } from "@/shared/lib/hooks/use-mobile";

export interface RelationPairForDetail {
    member1: string;
    member2: string;
    rank?: number;
    score: number;
    reason: string;
    summary: string;
    type: string;
    /** 연애 궁합 3줄 (summary/reason과 별개) */
    romanceLines?: string[];
}

export type RelationLevelKey = "best" | "good" | "normal" | "caution" | "worst";

export function getRelationLevel(score: number): {
    level: RelationLevelKey;
    color: string;
    Icon: LucideIcon;
    label: string;
    FloatingEmoji: string;
} {
    if (score >= 90)
        return { level: "best", color: "#EC4899", Icon: Heart, label: "최고", FloatingEmoji: "❤️" };
    if (score >= 75)
        return { level: "good", color: "#10B981", Icon: CheckCircle2, label: "좋음", FloatingEmoji: "🍀" };
    if (score >= 60)
        return { level: "normal", color: "#94A3B8", Icon: Minus, label: "보통", FloatingEmoji: "😊" };
    if (score >= 50)
        return { level: "caution", color: "#F59E0B", Icon: ShieldAlert, label: "주의", FloatingEmoji: "⚠️" };
    return { level: "worst", color: "#EF4444", Icon: XCircle, label: "최악", FloatingEmoji: "💀" };
}

/** 연애 궁합: romanceLines(또는 romance_lines) 3줄만 사용. summary/reason은 쓰지 않음 */
function getRomanceAnalysis(pair: RelationPairForDetail & { romance_lines?: string[] }) {
    const { score } = pair;
    const starRating = Math.min(5, Math.max(0, Math.round(score / 20)));
    const raw = pair.romanceLines ?? pair.romance_lines;
    const lines =
        Array.isArray(raw) && raw.length > 0
            ? raw.slice(0, 3).filter((s) => typeof s === "string" && s.trim())
            : [];
    return { starRating, lines };
}

interface RelationDetailCardProps {
    pair: RelationPairForDetail | null;
    /** 클릭된 멤버(오른쪽 노드)의 팔레트 색상 */
    /** 멤버1 프로필 이미지 URL */
    avatar1?: string;
    /** 멤버2 프로필 이미지 URL */
    avatar2?: string;
}

export function RelationDetailCard({ pair, avatar1, avatar2 }: RelationDetailCardProps) {
    const [isRomanceModalOpen, setIsRomanceModalOpen] = useState(false);
    const isMobile = useIsMobile();

    if (!pair) return null;

    const { color, label, FloatingEmoji } = getRelationLevel(pair.score);
    const romance = useMemo(() => getRomanceAnalysis(pair), [pair]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`${isMobile ? 'min-h-[180px] flex-col' : 'min-h-[120px] flex-row items-center'} flex gap-4 ${isMobile ? 'p-3' : 'p-4'} rounded-2xl transition-all bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg shadow-black/5 relative overflow-hidden`}
                role="region"
                aria-label="상세 관계 분석"
            >
                {/* 우측 상단 떠다니는 아이콘 */}
                <motion.div
                    className="absolute top-3 right-3 z-10"
                    animate={{
                        y: [0, -8, 0],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <span 
                        className={`${isMobile ? 'text-2xl' : 'text-3xl'} inline-block`}
                        style={{ 
                            filter: `drop-shadow(0 2px 4px ${color}40)`,
                        }}
                    >
                        {FloatingEmoji}
                    </span>
                </motion.div>
                <div className={`${isMobile ? 'w-full justify-start mb-2' : 'relative h-12 w-20 shrink-0'} flex items-center`} aria-hidden>
                    <div className={`${isMobile ? 'relative h-10 w-10' : 'absolute left-0 top-0 h-12 w-12'} rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-0`}>
                        {avatar1 && avatar1.trim() !== "" ? (
                            <img src={avatar1} alt={pair.member1} className="h-full w-full object-cover" />
                        ) : (
                            <span className={`flex h-full w-full items-center justify-center ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-600`}>
                                {pair.member1[0] ?? "?"}
                            </span>
                        )}
                    </div>
                    <div className={`${isMobile ? 'relative -ml-2 h-10 w-10' : 'absolute left-6 top-0 h-12 w-12'} rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm ${isMobile ? 'z-0' : 'z-10'}`}>
                        {avatar2 && avatar2.trim() !== "" ? (
                            <img src={avatar2} alt={pair.member2} className="h-full w-full object-cover" />
                        ) : (
                            <span className={`flex h-full w-full items-center justify-center ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-600`}>
                                {pair.member2[0] ?? "?"}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-slate-900 font-display ${isMobile ? 'text-sm' : 'text-base'} break-words`}>
                            {pair.member1} ↔ {pair.member2}
                        </span>
                        <span
                            className={`${isMobile ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'} font-semibold rounded-md border shrink-0 whitespace-nowrap`}
                            style={{
                                color: color,
                                borderColor: `${color}40`,
                                backgroundColor: `${color}12`,
                            }}
                        >
                            {label} · {pair.score}점
                        </span>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-slate-800 font-sans leading-relaxed bg-slate-50/80 ${isMobile ? 'py-2 px-2' : 'py-2.5 pr-2.5 pl-0'} rounded-lg min-w-0 break-words whitespace-normal`}>
                        {pair.reason}
                    </p>
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-500 font-sans leading-relaxed break-words whitespace-normal`}>
                        {pair.summary}
                    </p>
                </div>
                <div className={`${isMobile ? 'w-full' : 'shrink-0'} flex items-center ${isMobile ? 'justify-center' : ''}`}>
                    <button
                        type="button"
                        onClick={() => setIsRomanceModalOpen(true)}
                        className={`inline-flex items-center gap-2 ${isMobile ? 'px-3 py-2 text-xs w-full justify-center' : 'px-4 py-2.5 text-sm'} font-semibold bg-pink-50 text-pink-700 border-2 border-pink-200 hover:bg-pink-100 hover:border-pink-300 transition-colors shadow-sm rounded-xl`}
                    >
                        <HeartHandshake className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} aria-hidden />
                        연애 궁합 보기
                    </button>
                </div>
            </motion.div>

            <Modal
                isOpen={isRomanceModalOpen}
                onClose={() => setIsRomanceModalOpen(false)}
                size="md"
                className="bg-white border-2 border-slate-200 shadow-xl"
            >
                <ModalHeader description={<span className="font-hand text-base">{pair.member1} · {pair.member2}님의 연애 궁합은?</span>}>
                    <span className="inline-flex items-center gap-2 font-display">
                        <Heart className="w-5 h-5 text-pink-400 fill-pink-300" aria-hidden />
                        연애 궁합
                    </span>
                </ModalHeader>
                <ModalBody>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        {/* 상단 카드 — 글래스모피즘 + 테두리 */}
                        <div className={`${isMobile ? 'p-2.5 flex-col' : 'p-3 flex-row items-center'} rounded-xl border-2 border-pink-200/80 bg-white/70 backdrop-blur-md shadow-lg shadow-black/5 flex gap-4`}>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-1.5 flex-wrap" aria-label={`궁합 하트 ${romance.starRating}개 만점 5개`}>
                                    <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold text-pink-500 font-sans mr-0.5`}>궁합</span>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Heart
                                            key={i}
                                            className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} shrink-0`}
                                            strokeWidth={2}
                                            fill={i <= romance.starRating ? "currentColor" : "none"}
                                            stroke="currentColor"
                                            style={{
                                                color: i <= romance.starRating ? "#F472B6" : "#FBCFE8",
                                            }}
                                            aria-hidden
                                        />
                                    ))}
                                    <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold text-pink-500 tabular-nums ml-0.5`}>{romance.starRating}/5</span>
                                </div>
                            </div>
                            <div className={`inline-flex items-baseline gap-1 rounded-lg border border-white/80 bg-pink-50/90 backdrop-blur-sm ${isMobile ? 'py-1.5 px-2.5 self-start' : 'py-2 px-3 self-center'} shrink-0 shadow-sm`}>
                                <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-pink-500 tabular-nums font-display`}>{pair.score}</span>
                                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-pink-500`}>점</span>
                            </div>
                        </div>

                        {/* 연애 궁합 3줄만 (summary/reason과 별개) */}
                        <div className="rounded-xl border border-white/80 overflow-hidden bg-pink-50/70 backdrop-blur-md shadow-lg shadow-black/5 px-3 py-3">
                            {romance.lines.length > 0 ? (
                                <p className="text-sm text-gray-700 font-sans leading-relaxed whitespace-pre-line">
                                    {romance.lines.join("\n")}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 font-sans">연애 궁합 내용이 없어요.</p>
                            )}
                        </div>

                    </motion.div>
                </ModalBody>
            </Modal>
        </>
    );
}
