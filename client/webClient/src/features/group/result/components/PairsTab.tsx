import React from "react";
import { motion } from "motion/react";
import { Loader2, UserCheck, Trophy, AlertTriangle, MousePointerClick } from "lucide-react";
import { CardTitle } from "@/components/ui/core/card";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { Badge } from "@/components/ui/core/badge";
import { RelationMapSidebar, type RelationMapMember } from "./RelationMapSidebar";
import { RelationMapView, type RelationWithLevel } from "./RelationMapView";
import { RelationDetailCard, type RelationPairForDetail } from "./RelationDetailCard";

export interface PairsTabPair {
    member1: string;
    member2: string;
    rank: number;
    score: number;
    reason: string;
    summary: string;
}

export interface PairsTabProps {
    isMobile: boolean;
    isPairsLoading: boolean;
    relationMapMembers: RelationMapMember[];
    selectedMemberForRelation: string | null;
    setSelectedMemberForRelation: (name: string | null) => void;
    relationsForMapView: RelationWithLevel[];
    selectedPairDetail: RelationPairForDetail | null;
    setSelectedPairDetail: (pair: RelationPairForDetail | null) => void;
    bestPairs: PairsTabPair[];
    worstPairs: PairsTabPair[];
}

export const PairsTab: React.FC<PairsTabProps> = ({
    isMobile,
    isPairsLoading,
    relationMapMembers,
    selectedMemberForRelation,
    setSelectedMemberForRelation,
    relationsForMapView,
    selectedPairDetail,
    setSelectedPairDetail,
    bestPairs,
    worstPairs,
}) => {
    if (isPairsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-3 sm:gap-4 text-gray-600">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-brand-orange animate-spin" aria-hidden />
                <p className="text-base sm:text-lg font-medium">1:1 궁합 분석 중...</p>
                <p className="text-xs sm:text-sm text-gray-500">잠시만 기다려 주세요.</p>
            </div>
        );
    }

    if (isMobile) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="space-y-0 w-full max-w-full"
                style={{ paddingTop: "var(--flow-block)", paddingBottom: "var(--flow-block)" }}
            >
                <section className="section-flow">
                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">관계맵</h2>
                    <p className="text-xs text-gray-500 font-sans flow-mb-block w-full">멤버를 선택하면 해당 멤버와의 1:1 궁합을 확인할 수 있어요.</p>
                    <div className="flex flex-col lg:flex-row gap-3 w-full max-w-full">
                        <RelationMapSidebar
                            members={relationMapMembers}
                            selectedName={selectedMemberForRelation}
                            onSelect={setSelectedMemberForRelation}
                        />
                        <div className="flex-1 min-w-0 flex flex-col gap-4">
                            <RelationMapView
                                members={relationMapMembers}
                                selectedMemberForRelation={selectedMemberForRelation}
                                relations={relationsForMapView}
                                selectedPair={selectedPairDetail ? { member1: selectedPairDetail.member1, member2: selectedPairDetail.member2 } : null}
                                onSelectPair={setSelectedPairDetail}
                            />
                            {selectedPairDetail && (
                                <RelationDetailCard
                                    pair={selectedPairDetail}
                                    avatar1={relationMapMembers.find((m) => m.name === selectedPairDetail.member1)?.avatar}
                                    avatar2={relationMapMembers.find((m) => m.name === selectedPairDetail.member2)?.avatar}
                                />
                            )}
                        </div>
                    </div>
                </section>
                <section className="section-flow">
                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">베스트 TOP3</h2>
                    <ul className="flow-col w-full max-w-full">
                        {bestPairs.map((pair) => (
                            <li key={`${pair.member1}-${pair.member2}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 w-full">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-bold text-gray-900 font-display text-sm min-w-0 break-keep">{pair.member1} ↔ {pair.member2}</span>
                                    <span className="text-lg font-extrabold text-sky-600 tabular-nums shrink-0">{pair.score}점</span>
                                </div>
                                <p className="text-xs text-gray-800 font-sans leading-relaxed mb-1 w-full min-w-0 break-words">{pair.reason}</p>
                                <p className="text-[10px] text-gray-600 font-sans w-full min-w-0 break-words">{pair.summary}</p>
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="section-flow">
                    <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">워스트 TOP3</h2>
                    <ul className="flow-col w-full max-w-full">
                        {worstPairs.map((pair) => (
                            <li key={`${pair.member1}-${pair.member2}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 w-full">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-bold text-gray-900 font-display text-sm min-w-0 break-keep">{pair.member1} ↔ {pair.member2}</span>
                                    <span className="text-lg font-extrabold text-slate-600 tabular-nums shrink-0">{pair.score}점</span>
                                </div>
                                <p className="text-xs text-gray-800 font-sans leading-relaxed mb-1 w-full min-w-0 break-words">{pair.reason}</p>
                                <p className="text-[10px] text-gray-600 font-sans w-full min-w-0 break-words">{pair.summary}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="space-y-4 sm:space-y-6 lg:space-y-8"
        >
            <div className="mt-6 sm:mt-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pb-3 sm:pb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">관계맵</h3>
                    {selectedMemberForRelation && (
                        <motion.div
                            className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-50 text-brand-orange rounded-xl text-sm font-medium border border-orange-200 shadow-sm"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.span
                                className="inline-flex"
                                aria-hidden
                                animate={{ y: [0, -3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <MousePointerClick className="w-4 h-4" strokeWidth={2.5} />
                            </motion.span>
                            <span>상대 프로필을 클릭하면 상세 궁합을 확인할 수 있어요.</span>
                        </motion.div>
                    )}
                </div>
                <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                    <RelationMapSidebar
                        members={relationMapMembers}
                        selectedName={selectedMemberForRelation}
                        onSelect={setSelectedMemberForRelation}
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        <RelationMapView
                            members={relationMapMembers}
                            selectedMemberForRelation={selectedMemberForRelation}
                            relations={relationsForMapView}
                            selectedPair={selectedPairDetail ? { member1: selectedPairDetail.member1, member2: selectedPairDetail.member2 } : null}
                            onSelectPair={setSelectedPairDetail}
                        />
                        {selectedPairDetail && (
                            <RelationDetailCard
                                pair={selectedPairDetail}
                                avatar1={relationMapMembers.find((m) => m.name === selectedPairDetail.member1)?.avatar}
                                avatar2={relationMapMembers.find((m) => m.name === selectedPairDetail.member2)?.avatar}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <GlassCard className="border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/30">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-400/30 to-blue-400/20 border-2 border-sky-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                        </div>
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 font-display">베스트 TOP3</CardTitle>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {bestPairs.map((pair, idx) => (
                            <motion.div
                                key={`${pair.member1}-${pair.member2}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.1 }}
                                className="p-3 sm:p-5 bg-gradient-to-br from-sky-50 to-blue-50/80 rounded-xl sm:rounded-2xl border-2 border-sky-200 shadow-sm hover:shadow-md transition-all relative"
                            >
                                <div className="absolute -top-2 -left-2 z-10">
                                    <Badge variant="default" className="text-sm font-bold px-3 py-1 rounded-full shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-blue-50 border-blue-700">
                                        {pair.rank}위
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-14 shrink-0 flex items-center" aria-hidden>
                                            <div className="absolute left-0 top-0 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-0">
                                                {(() => {
                                                    const m1 = relationMapMembers.find(m => m.name === pair.member1);
                                                    return m1?.avatar?.trim() ? (
                                                        <img src={m1.avatar} alt={pair.member1} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{pair.member1[0] ?? "?"}</span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="absolute left-5 top-0 h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-10">
                                                {(() => {
                                                    const m2 = relationMapMembers.find(m => m.name === pair.member2);
                                                    return m2?.avatar?.trim() ? (
                                                        <img src={m2.avatar} alt={pair.member2} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{pair.member2[0] ?? "?"}</span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900 font-display text-base sm:text-lg">{pair.member1} ↔ {pair.member2}</span>
                                    </div>
                                    <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-sky-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-sky-100/50 w-fit">
                                        <span className="text-xl sm:text-2xl font-extrabold text-sky-600 tabular-nums">{pair.score}</span>
                                        <span className="text-xs sm:text-sm font-bold text-sky-500">점</span>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-800 mb-1.5 sm:mb-2 font-sans leading-relaxed min-w-0 break-words">{pair.reason}</p>
                                <p className="text-[10px] sm:text-xs text-gray-600 font-sans leading-relaxed bg-white/60 p-1.5 sm:p-2 rounded-lg min-w-0 break-words">{pair.summary}</p>
                            </motion.div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard className="border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 bg-gradient-to-br from-slate-50/50 via-white to-slate-100/30">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-300/50 to-slate-400/30 border-2 border-slate-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                        </div>
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 font-display">워스트 TOP3</CardTitle>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {worstPairs.map((pair, idx) => (
                            <motion.div
                                key={`${pair.member1}-${pair.member2}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.1 }}
                                className="p-3 sm:p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all relative"
                            >
                                <div className="absolute -top-2 -left-2 z-10">
                                    <Badge variant="default" className="text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md bg-gradient-to-br from-gray-500 to-gray-600 text-gray-50 border-gray-700">
                                        {idx + 1}위
                                    </Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="relative h-9 w-12 sm:h-10 sm:w-14 shrink-0 flex items-center" aria-hidden>
                                            <div className="absolute left-0 top-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-0">
                                                {(() => {
                                                    const m1 = relationMapMembers.find(m => m.name === pair.member1);
                                                    return m1?.avatar?.trim() ? (
                                                        <img src={m1.avatar} alt={pair.member1} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-xs sm:text-sm font-semibold text-slate-600">{pair.member1[0] ?? "?"}</span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="absolute left-4 sm:left-5 top-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm z-10">
                                                {(() => {
                                                    const m2 = relationMapMembers.find(m => m.name === pair.member2);
                                                    return m2?.avatar?.trim() ? (
                                                        <img src={m2.avatar} alt={pair.member2} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-xs sm:text-sm font-semibold text-slate-600">{pair.member2[0] ?? "?"}</span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900 font-display text-base sm:text-lg min-w-0 break-words">{pair.member1} ↔ {pair.member2}</span>
                                    </div>
                                    <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-slate-100 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-slate-200/50 w-fit">
                                        <span className="text-xl sm:text-2xl font-extrabold text-slate-600 tabular-nums">{pair.score}</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-500">점</span>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-800 mb-1.5 sm:mb-2 font-sans leading-relaxed min-w-0 break-words">{pair.reason}</p>
                                <p className="text-[10px] sm:text-xs text-gray-600 font-sans leading-relaxed bg-white/60 p-1.5 sm:p-2 rounded-lg min-w-0 break-words">{pair.summary}</p>
                            </motion.div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );
};
