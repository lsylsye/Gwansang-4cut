import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { GroupMember } from "@/shared/types";
import type { GroupOhengCombinationResponse } from "@/shared/api/groupOhengApi";
import { Users, UserPlus, ArrowRight } from "lucide-react";

/**
 * 한 명이 나오고 → 다른 한 명씩 선택할 수 있게
 * 1단계: 한 명 선택 (나 / 첫 번째 사람)
 * 2단계: 선택한 사람 + 나머지 중 한 명씩 클릭 → 두 사람 조합 + 관계 표시
 */
interface RelationshipLadderProps {
    groupMembers: GroupMember[];
    ohengResult: GroupOhengCombinationResponse | null;
}

function getPairRelationMessage(
    nameA: string,
    nameB: string,
    ohengResult: GroupOhengCombinationResponse | null
): string {
    if (!ohengResult) return "이 둘의 기운이 궁금하다면 오행 조합을 확인해 보세요.";
    const norm = (a: string, b: string) => [a, b].sort().join("|");
    const key = norm(nameA, nameB);
    const supp = ohengResult.supplement.find(
        (s) => norm(s.fromName, s.toName) === key
    );
    const conf = ohengResult.conflict.find(
        (c) => norm(c.name1, c.name2) === key
    );
    if (supp) return `${supp.fromName}님이 ${supp.toName}님의 ${supp.elementLabel} 기운을 채워 줘요.`;
    if (conf) return `둘 다 ${conf.elementLabel} 기운이라 살짝 상충할 수 있어요.`;
    return "함께 있으면 시너지가 나는 콤비!";
}

export const RelationshipLadder: React.FC<RelationshipLadderProps> = ({
    groupMembers,
    ohengResult,
}) => {
    const n = groupMembers.length;
    const [firstIndex, setFirstIndex] = useState<number | null>(null);
    const [pairResult, setPairResult] = useState<{ first: GroupMember; second: GroupMember } | null>(null);

    if (n < 2) return null;

    const firstPerson = firstIndex !== null ? groupMembers[firstIndex] : null;
    const others = firstIndex !== null ? groupMembers.filter((_, i) => i !== firstIndex) : [];

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 font-display">
                            두 사람 조합 보기
                        </h2>
                        <p className="text-sm text-gray-500">
                            한 명을 고른 뒤, 다른 한 명을 선택하면 두 사람의 관계를 볼 수 있어요.
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {firstIndex === null ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <p className="text-sm font-medium text-gray-600">한 명을 골라보세요</p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {groupMembers.map((m, idx) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setFirstIndex(idx)}
                                        className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-100 bg-gray-50/80 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-300"
                                    >
                                        <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow ring-1 ring-gray-200">
                                            <img
                                                src={m.avatar || "https://via.placeholder.com/56"}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 truncate max-w-full">
                                            {m.name || `멤버 ${idx + 1}`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* 선택된 한 명 */}
                            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-violet-200 bg-violet-50/50 p-4">
                                <p className="text-xs font-medium text-violet-600">선택한 한 명</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-violet-200">
                                        <img
                                            src={firstPerson?.avatar || "https://via.placeholder.com/64"}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-gray-900">
                                            {firstPerson?.name || "멤버"}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setFirstIndex(null)}
                                            className="text-xs text-violet-600 underline hover:no-underline"
                                        >
                                            다시 고르기
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm font-medium text-gray-600">
                                이 사람과 어떤 사람의 조합을 볼까요?
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {others.map((m, idx) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() =>
                                            firstPerson && setPairResult({ first: firstPerson, second: m })
                                        }
                                        className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-100 bg-gray-50/80 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-300"
                                    >
                                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow ring-1 ring-gray-200">
                                            <img
                                                src={m.avatar || "https://via.placeholder.com/56"}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 truncate max-w-full">
                                            {m.name || `멤버`}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <UserPlus className="h-3 w-3" />
                                            조합 보기
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>

            <Modal
                isOpen={pairResult !== null}
                onClose={() => setPairResult(null)}
                size="md"
            >
                {pairResult && (
                    <>
                        <ModalHeader description="두 사람의 조합">
                            <span className="flex items-center gap-2 text-violet-700">
                                <ArrowRight className="h-5 w-5" />
                                {pairResult.first.name || "멤버"} & {pairResult.second.name || "멤버"}
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-violet-100">
                                            <img
                                                src={pairResult.first.avatar || "https://via.placeholder.com/64"}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">
                                            {pairResult.first.name || "멤버"}
                                        </span>
                                    </div>
                                    <ArrowRight className="h-6 w-6 shrink-0 text-violet-400" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-violet-100">
                                            <img
                                                src={pairResult.second.avatar || "https://via.placeholder.com/64"}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">
                                            {pairResult.second.name || "멤버"}
                                        </span>
                                    </div>
                                </div>
                                <p className="rounded-xl bg-violet-50 p-4 text-center text-sm leading-relaxed text-gray-700 border border-violet-100">
                                    {getPairRelationMessage(
                                        pairResult.first.name || "멤버1",
                                        pairResult.second.name || "멤버2",
                                        ohengResult
                                    )}
                                </p>
                            </div>
                        </ModalBody>
                    </>
                )}
            </Modal>
        </>
    );
};
