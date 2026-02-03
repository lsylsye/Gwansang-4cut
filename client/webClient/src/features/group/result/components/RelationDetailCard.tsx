import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
    Heart,
    CheckCircle2,
    Minus,
    ShieldAlert,
    XCircle,
    HeartHandshake,
    AlertCircle,
    LucideIcon,
} from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { Badge } from "@/shared/ui/core/badge";
import { Button } from "@/shared/ui/core/button";
import { useIsMobile } from "@/shared/lib/hooks/use-mobile";

export interface RelationPairForDetail {
    member1: string;
    member2: string;
    score: number;
    reason: string;
    summary: string;
    type: string;
}

export type RelationLevelKey = "best" | "good" | "normal" | "caution" | "worst";

export function getRelationLevel(score: number): {
    level: RelationLevelKey;
    color: string;
    Icon: LucideIcon;
    label: string;
} {
    if (score >= 90)
        return { level: "best", color: "#EC4899", Icon: Heart, label: "최고" };
    if (score >= 75)
        return { level: "good", color: "#10B981", Icon: CheckCircle2, label: "좋음" };
    if (score >= 60)
        return { level: "normal", color: "#94A3B8", Icon: Minus, label: "보통" };
    if (score >= 50)
        return { level: "caution", color: "#F59E0B", Icon: ShieldAlert, label: "주의" };
    return { level: "worst", color: "#EF4444", Icon: XCircle, label: "최악" };
}

/** 연애 궁합 점수별 목업 — 타이틀·소제목·장점·주의 (상세) */
function getRomanceAnalysis(pair: RelationPairForDetail) {
    const { score } = pair;
    const level = score >= 90 ? "best" : score >= 75 ? "good" : score >= 60 ? "normal" : score >= 50 ? "caution" : "worst";
    const titles: Record<string, string> = {
        best: "최고의 시너지 궁합",
        good: "좋은 시너지 궁합",
        normal: "보통 궁합",
        caution: "주의가 필요한 궁합",
        worst: "신중한 접근이 필요한 궁합",
    };
    const subtitles: Record<string, string> = {
        best: "연애·결혼까지 갈 가능성이 높은 조합이에요.",
        good: "서로 맞춰 가면 오래 갈 수 있는 조합이에요.",
        normal: "거리감을 맞추면 안정적인 관계가 될 수 있어요.",
        caution: "성향 차이를 인정하고 소통하면 개선돼요.",
        worst: "서로를 이해하려는 노력이 필요해요.",
    };
    const starRating = Math.min(5, Math.round(score / 20));
    const strengths: Record<string, string[]> = {
        best: [
            "말 없이도 서로를 잘 읽어 주고, 편안함을 주는 조합이에요.",
            "감정 기복이 적어서 오래 함께해도 안정감이 있어요.",
            "서로의 주관이 달라도 존중으로 이어져 갈등이 적어요.",
            "연인·부부로서 역할이 겹치지 않아 부담이 적어요.",
        ],
        good: [
            "한쪽이 튀면 다른 쪽이 잡아 주는 식의 균형이 잘 맞아요.",
            "감정 표현 방식이 비슷해 오해가 적은 편이에요.",
            "장기적으로 신뢰를 쌓기 좋은 성향 조합이에요.",
            "일상에서 작은 배려만 해도 관계가 유지돼요.",
        ],
        normal: [
            "적당한 거리감과 친밀감을 유지하기 좋은 조합이에요.",
            "갈등이 생겨도 대화로 풀어 나갈 여지가 있어요.",
            "서로 성장할 수 있는 여지가 있어요.",
            "만남 빈도와 깊이를 맞춰 보는 게 좋아요.",
        ],
        caution: [
            "감정 표현 방식이 달라 오해가 생길 수 있어요.",
            "말투나 해석 차이로 작은 불씨가 커질 수 있으니 소통을 자주 해요.",
            "고집이 부딪힐 수 있으니 상대 입장을 경청하는 습관이 좋아요.",
            "감정이 격해지기 전에 잠시 거리를 두는 것도 방법이에요.",
        ],
        worst: [
            "성향 차이가 커서 서로 이해하려는 노력이 필요해요.",
            "감정이 쌓이기 전에 말로 풀어 보는 게 좋아요.",
            "강한 주관이 충돌할 수 있으니 결론은 천천히 내려요.",
            "단기보다 장기 관점에서 관계를 바라보는 게 좋아요.",
        ],
    };
    const warnings: Record<string, string[]> = {
        best: ["과한 기대는 부담이 될 수 있으니 서로 여유를 주세요."],
        good: ["바쁠 때 소홀해지지 않도록 작은 연락이라도 이어 가세요."],
        normal: ["일방적 판단보다는 대화로 확인하는 습관이 좋아요."],
        caution: ["고집 부리지 말고 상대 입장을 먼저 들어 보세요.", "감정이 격해지기 전에 휴식 시간을 갖는 걸 추천해요."],
        worst: ["성급한 결론보다는 시간을 두고 관찰해 보세요.", "감정 표현 방식을 서로 말로 맞춰 보세요."],
    };
    return {
        title: titles[level],
        subtitle: subtitles[level],
        starRating,
        strengthText: strengths[level],
        warningText: warnings[level],
    };
}

interface RelationDetailCardProps {
    pair: RelationPairForDetail | null;
    /** 클릭된 멤버(오른쪽 노드)의 팔레트 색상 */
    accentColor?: string;
    /** 왼쪽(선택된) 멤버의 팔레트 색상 — 그라데이션 등에 사용 */
    secondAccentColor?: string;
    /** 멤버1 프로필 이미지 URL */
    avatar1?: string;
    /** 멤버2 프로필 이미지 URL */
    avatar2?: string;
}

export function RelationDetailCard({ pair, accentColor, secondAccentColor, avatar1, avatar2 }: RelationDetailCardProps) {
    const [isRomanceModalOpen, setIsRomanceModalOpen] = useState(false);
    const isMobile = useIsMobile();

    if (!pair) return null;

    const { color, label } = getRelationLevel(pair.score);
    const highlightColor = accentColor ?? color;
    const romance = useMemo(() => getRomanceAnalysis(pair), [pair]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`${isMobile ? 'min-h-[180px] flex-col' : 'min-h-[120px] flex-row items-center'} flex gap-4 ${isMobile ? 'p-3' : 'p-4'} rounded-2xl transition-all bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg shadow-black/5`}
                role="region"
                aria-label="상세 관계 분석"
            >
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
                                color: highlightColor,
                                borderColor: `${highlightColor}40`,
                                backgroundColor: `${highlightColor}12`,
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
                                <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-800 font-display leading-tight`}>{romance.title}</h4>
                                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-hand leading-snug`}>{romance.subtitle}</p>
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

                        {/* 장점 카드 — 글래스모피즘 */}
                        <div className="rounded-xl border border-white/80 overflow-hidden bg-emerald-50/70 backdrop-blur-md shadow-lg shadow-black/5">
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-200/60 bg-emerald-100/60 backdrop-blur-sm">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                                <span className="text-sm font-bold text-emerald-800 font-display">장점</span>
                            </div>
                            <ul className="px-3 py-2.5 space-y-1 text-sm text-gray-700 font-sans leading-relaxed list-disc pl-5">
                                {romance.strengthText.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>

                        {/* 주의 카드 — 글래스모피즘 */}
                        <div className="rounded-xl border border-white/80 overflow-hidden bg-amber-50/70 backdrop-blur-md shadow-lg shadow-black/5">
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200/60 bg-amber-100/60 backdrop-blur-sm">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                                <span className="text-sm font-bold text-amber-800 font-display">주의</span>
                            </div>
                            <ul className="px-3 py-2.5 space-y-1 text-sm text-gray-700 font-sans leading-relaxed list-disc pl-5">
                                {romance.warningText.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>

                    </motion.div>
                </ModalBody>
            </Modal>
        </>
    );
}
