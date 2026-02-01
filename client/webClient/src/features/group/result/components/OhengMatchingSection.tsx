import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Zap,
    ChevronDown,
    ChevronUp,
    Heart,
    Swords,
    Sparkles,
    Star,
    BarChart3,
    Lightbulb,
    TreeDeciduous,
    Flame,
    Globe,
    Circle,
    Droplet,
} from "lucide-react";
import { GroupMember } from "@/shared/types";
import type {
    GroupOhengCombinationResponse,
    SupplementPair,
    ConflictPair,
} from "@/shared/api/groupOhengApi";

/** 오행 라벨 */
const OHENG_DISPLAY: Record<string, { label: string; short: string }> = {
    목: { label: "목(木)", short: "목" },
    화: { label: "화(火)", short: "화" },
    토: { label: "토(土)", short: "토" },
    금: { label: "금(金)", short: "금" },
    수: { label: "수(水)", short: "수" },
};

const OHENG_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
    목: TreeDeciduous,
    화: Flame,
    토: Globe,
    금: Circle,
    수: Droplet,
};

function getOhengDisplay(element: string) {
    return OHENG_DISPLAY[element] ?? { label: element, short: element };
}

/** TSX에서 < 가 JSX로 해석되는 것 방지용 문자열 비교 */
function strLess(a: string, b: string): boolean {
    return a < b;
}

function OhengIcon({ element, className = "size-4" }: { element: string; className?: string }) {
    const Icon = OHENG_ICONS[element];
    if (!Icon) return null;
    return <Icon className={className} />;
}

type PairRelation =
    | { type: "supplement"; data: SupplementPair; message: string }
    | { type: "conflict"; data: ConflictPair; message: string }
    | { type: "neutral"; message: string };

function getPairRelation(
    nameA: string,
    nameB: string,
    ohengResult: GroupOhengCombinationResponse | null
): PairRelation {
    if (!ohengResult) {
        return { type: "neutral", message: "두 사람을 선택하면 기운 관계를 볼 수 있어요." };
    }
    const norm = (a: string, b: string) => [a, b].sort().join("|");
    const key = norm(nameA, nameB);
    const supp = ohengResult.supplement.find((s) => norm(s.fromName, s.toName) === key);
    const conf = ohengResult.conflict.find((c) => norm(c.name1, c.name2) === key);
    if (supp) {
        const disp = getOhengDisplay(supp.element);
        return {
            type: "supplement",
            data: supp,
            message: `${supp.fromName}님이 ${supp.toName}님에게 ${disp.label} 기운을 채워줘요`,
        };
    }
    if (conf) {
        const disp = getOhengDisplay(conf.element);
        return {
            type: "conflict",
            data: conf,
            message: `같은 ${disp.label} 기운이라 부딪힐 수 있어요`,
        };
    }
    return { type: "neutral", message: "함께 있으면 시너지가 나는 콤비!" };
}

/** 점수당 배점 상수 */
const POINTS = {
    supplementPerPair: 2,
    perfectMatchBonus: 5,
    conflictPerPair: 2,
    baseScore: 60,
} as const;

export interface ScoreFactor {
    icon: string;
    title: string;
    points: string;
    detail: string;
    tip?: string;
}

type ScoreExplanationResult = {
    totalScore: number;
    positiveFactors: ScoreFactor[];
    negativeFactors: ScoreFactor[];
    oneLineSummary: string;
};

/** 점수 해설 계산 (TSX 파서가 useMemo 내부 < > 를 JSX로 해석하지 않도록 분리) */
function computeScoreExplanation(
    ohengResult: GroupOhengCombinationResponse | null,
    totalMembers: number
): ScoreExplanationResult {
    if (!ohengResult) {
        return { totalScore: 50, positiveFactors: [], negativeFactors: [], oneLineSummary: "오행 조합을 불러오는 중이에요." };
    }
    const positive: ScoreFactor[] = [];
    const negative: ScoreFactor[] = [];
    let positivePoints = 0;
    let negativePoints = 0;

    const pairKey = (a: string, b: string) => [a, b].sort().join("|");
    const supplementPairs = new Set<string>();
    ohengResult.supplement.forEach((s) => supplementPairs.add(pairKey(s.fromName, s.toName)));
    const reversePairs = new Set<string>();
    ohengResult.supplement.forEach((s) => reversePairs.add(pairKey(s.toName, s.fromName)));
    const perfectMatchCount = [...supplementPairs].filter((key) => reversePairs.has(key)).length;
    const pureSupplementCount = Math.max(0, ohengResult.supplement.length - perfectMatchCount);

    if (pureSupplementCount > 0) {
        const pts = pureSupplementCount * POINTS.supplementPerPair;
        positivePoints += pts;
        const byEl = new Map<string, number>();
        ohengResult.supplement.forEach((s) => {
            const isReverse = reversePairs.has(pairKey(s.toName, s.fromName));
            const fromFirst = strLess(s.fromName, s.toName);
            if (!isReverse || fromFirst) {
                byEl.set(s.element, (byEl.get(s.element) ?? 0) + 1);
            }
        });
        const maxEl = [...byEl.entries()].sort((a, b) => b[1] - a[1])[0];
        const elLabel = maxEl ? getOhengDisplay(maxEl[0]).label : "";
        positive.push({
            icon: "💚",
            title: `서로 기운 채워주는 관계 ${pureSupplementCount}쌍 발견!`,
            points: `+${pts}점`,
            detail: elLabel ? `${elLabel} 기운 가진 멤버들이 팀 에너지를 순환시켜요` : "",
            tip: undefined,
        });
    }

    if (perfectMatchCount > 0) {
        const pts = perfectMatchCount * POINTS.perfectMatchBonus;
        positivePoints += pts;
        positive.push({
            icon: "⚡",
            title: `멤버 간 찰떡궁합 조합 ${perfectMatchCount}쌍 존재`,
            points: `+${pts}점`,
            detail: "서로 부족한 기운을 완벽히 보완해요",
            tip: undefined,
        });
    }

    const conflictByEl = new Map<string, ConflictPair[]>();
    ohengResult.conflict.forEach((c) => {
        const list = conflictByEl.get(c.element) ?? [];
        list.push(c);
        conflictByEl.set(c.element, list);
    });
    const maxPairs = (totalMembers * (totalMembers - 1)) / 2;
    const elements = ["목", "화", "토", "금", "수"];
    const sortedConflict = elements
        .filter((el) => conflictByEl.has(el))
        .map((el) => ({ element: el, pairs: conflictByEl.get(el)! }))
        .sort((a, b) => b.pairs.length - a.pairs.length);

    for (const { element, pairs } of sortedConflict) {
        const count = pairs.length;
        const pts = count * POINTS.conflictPerPair;
        negativePoints += pts;
        const disp = getOhengDisplay(element);
        const names = new Set<string>();
        pairs.forEach((p) => {
            names.add(p.name1);
            names.add(p.name2);
        });
        const nameList = Array.from(names);
        const isHighConflict = count >= maxPairs * 0.5 || count >= 10;
        let detail: string;
        if (count >= maxPairs * 0.5) {
            detail = `${totalMembers}명 중 ${nameList.length}명이 ${disp.short} 기운 보유, 의견 충돌 가능성 높음`;
        } else if (nameList.length <= 4) {
            detail = `${nameList.join(", ")}이(가) 비슷한 성향이라 부딪힐 수 있어요`;
        } else {
            detail = `${nameList.slice(0, 2).join(", ")} 외 ${nameList.length - 2}명 사이 소소한 마찰 예상`;
        }
        const tip = isHighConflict
            ? "토론 시 중재자 역할 정하기"
            : count >= 3
              ? "의견이 엇갈릴 때 한쪽만 고집하지 말고 중간 타협 찾기"
              : undefined;
        negative.push({
            icon: element === "토" ? "🌍" : element === "금" ? "⚪" : element === "수" ? "💧" : element === "목" ? "🌳" : "🔥",
            title: `${disp.label} 기운 충돌 ${count}쌍`,
            points: `-${pts}점`,
            detail,
            tip,
        });
    }

    const totalScore = Math.max(0, Math.min(100, POINTS.baseScore + positivePoints - negativePoints));

    let oneLineSummary: string;
    if (positive.length === 0 && negative.length === 0) {
        oneLineSummary = "기운 채워줌·상충이 적어 균형 잡힌 팀이에요!";
    } else if (negative.length > 0 && positive.length > 0) {
        const mainNeg = negative[0];
        oneLineSummary = `기운 순환은 좋지만, ${mainNeg.title.split(" ")[0]} 충돌이 있어 의견 조율이 관건!`;
    } else if (negative.length > 0) {
        oneLineSummary = `${negative[0].title.split(" ")[0]} 충돌이 많아 중재·타협이 중요해요.`;
    } else {
        oneLineSummary = "기운이 잘 순환되는 조합이에요!";
    }

    return {
        totalScore,
        positiveFactors: positive,
        negativeFactors: negative,
        oneLineSummary,
    };
}

/** 점수 해설 생성 — 플러스/마이너스 요인 분리, 인과관계 연결 */
function useScoreExplanation(
    ohengResult: GroupOhengCombinationResponse | null,
    totalMembers: number
): {
    totalScore: number;
    positiveFactors: ScoreFactor[];
    negativeFactors: ScoreFactor[];
    oneLineSummary: string;
} {
    return useMemo(
        () => computeScoreExplanation(ohengResult, totalMembers),
        [ohengResult, totalMembers]
    );
}

/** 가장 많이 기운을 채워주는 사람 (supplement fromName 기준) */
function useBestProvider(ohengResult: GroupOhengCombinationResponse | null): string | null {
    return useMemo(() => {
        if (!ohengResult?.supplement.length) return null;
        const count = new Map<string, number>();
        ohengResult.supplement.forEach((s) => {
            count.set(s.fromName, (count.get(s.fromName) ?? 0) + 1);
        });
        let max = 0;
        let name: string | null = null;
        count.forEach((v, k) => {
            if (v > max) {
                max = v;
                name = k;
            }
        });
        return name;
    }, [ohengResult]);
}

/** 채워줌: 요소별로 그룹, from → to 목록 (표용) */
function useSupplementTable(ohengResult: GroupOhengCombinationResponse | null) {
    return useMemo(() => {
        if (!ohengResult?.supplement.length) return [];
        const byElement = new Map<string, { fromName: string; toNames: string[] }[]>();
        ohengResult.supplement.forEach((s) => {
            const list = byElement.get(s.element) ?? [];
            const existing = list.find((x) => x.fromName === s.fromName);
            if (existing) existing.toNames.push(s.toName);
            else list.push({ fromName: s.fromName, toNames: [s.toName] });
            byElement.set(s.element, list);
        });
        const elements = ["목", "화", "토", "금", "수"];
        return elements
            .filter((el) => byElement.has(el))
            .map((el) => ({
                element: el,
                rows: byElement.get(el)!,
            }));
    }, [ohengResult]);
}

/** 상충: 요소별 개수 + 한줄 요약 (표용) */
function useConflictTable(
    ohengResult: GroupOhengCombinationResponse | null,
    totalMembers: number
) {
    return useMemo(() => {
        if (!ohengResult?.conflict.length) return [];
        const byElement = new Map<string, ConflictPair[]>();
        ohengResult.conflict.forEach((c) => {
            const list = byElement.get(c.element) ?? [];
            list.push(c);
            byElement.set(c.element, list);
        });
        const elements = ["목", "화", "토", "금", "수"];
        const maxPairs = (totalMembers * (totalMembers - 1)) / 2;
        return elements
            .filter((el) => byElement.has(el))
            .map((el) => {
                const pairs = byElement.get(el)!;
                const count = pairs.length;
                const names = new Set<string>();
                pairs.forEach((p) => {
                    names.add(p.name1);
                    names.add(p.name2);
                });
                const nameList = Array.from(names);
                let summary: string;
                if (count >= maxPairs * 0.5) summary = "거의 모든 멤버 해당";
                else if (count >= 5 && nameList.length > 3)
                    summary = `${nameList.slice(0, 3).join(", ")} 외 ${nameList.length - 3}명`;
                else if (nameList.length === 2) summary = `${nameList[0]}-${nameList[1]}`;
                else summary = nameList.slice(0, 5).join(", ") + (nameList.length > 5 ? " 외" : "");
                return {
                    element: el,
                    count,
                    summary,
                };
            })
            .sort((a, b) => b.count - a.count);
    }, [ohengResult, totalMembers]);
}

/** 팀 오행 요약: 요소별 supplement/conflict 개수 (팀 오행 요약 카드용) */
function useTeamOhengSummary(ohengResult: GroupOhengCombinationResponse | null): Array<{ element: string; supplement: number; conflict: number }> {
    return useMemo(() => {
        if (!ohengResult) return [];
        const byEl = new Map<string, { supplement: number; conflict: number }>();
        const elements = ["목", "화", "토", "금", "수"];
        elements.forEach((el) => byEl.set(el, { supplement: 0, conflict: 0 }));
        ohengResult.supplement.forEach((s) => {
            const cur = byEl.get(s.element) ?? { supplement: 0, conflict: 0 };
            byEl.set(s.element, { ...cur, supplement: cur.supplement + 1 });
        });
        ohengResult.conflict.forEach((c) => {
            const cur = byEl.get(c.element) ?? { supplement: 0, conflict: 0 };
            byEl.set(c.element, { ...cur, conflict: cur.conflict + 1 });
        });
        return elements
            .filter((el) => {
                const v = byEl.get(el)!;
                return v.supplement !== 0 || v.conflict !== 0;
            })
            .map((el) => ({
                element: el,
                supplement: byEl.get(el)!.supplement,
                conflict: byEl.get(el)!.conflict,
            }));
    }, [ohengResult]);
}

/** 인사이트 1~2줄 (데이터 기반) */
function useOhengInsight(ohengResult: GroupOhengCombinationResponse | null): string[] {
    return useMemo(() => {
        if (!ohengResult) return [];
        const lines: string[] = [];
        if (ohengResult.conflict.length > 0) {
            const byEl = new Map<string, number>();
            ohengResult.conflict.forEach((c) => {
                byEl.set(c.element, (byEl.get(c.element) ?? 0) + 1);
            });
            const maxEl = [...byEl.entries()].sort((a, b) => b[1] - a[1])[0];
            if (maxEl) {
                const disp = getOhengDisplay(maxEl[0]);
                lines.push(`이 팀은 ${disp.label} 기운이 몰려있어서 의견 충돌이 잦을 수 있어요.`);
            }
        }
        if (ohengResult.supplement.length > 0) {
            const byEl = new Map<string, number>();
            ohengResult.supplement.forEach((s) => {
                byEl.set(s.element, (byEl.get(s.element) ?? 0) + 1);
            });
            const maxEl = [...byEl.entries()].sort((a, b) => b[1] - a[1])[0];
            if (maxEl) {
                const disp = getOhengDisplay(maxEl[0]);
                lines.push(`${disp.label} 멤버들이 팀의 에너지를 순환시켜주고 있어요!`);
            }
        }
        return lines.slice(0, 2);
    }, [ohengResult]);
}

interface OhengMatchingSectionProps {
    groupMembers: GroupMember[];
    ohengResult: GroupOhengCombinationResponse | null;
    ohengLoading: boolean;
    ohengError: string | null;
}

export const OhengMatchingSection: React.FC<OhengMatchingSectionProps> = ({
    groupMembers,
    ohengResult,
    ohengLoading,
    ohengError,
}) => {
    const n = groupMembers.length;
    const [selectedFirst, setSelectedFirst] = useState<GroupMember | null>(null);
    const [selectedSecond, setSelectedSecond] = useState<GroupMember | null>(null);
    const [summaryExpanded, setSummaryExpanded] = useState(false);

    const summaryLines = useTeamOhengSummary(ohengResult);
    const bestProvider = useBestProvider(ohengResult);
    const supplementTable = useSupplementTable(ohengResult);
    const conflictTable = useConflictTable(ohengResult, n);
    const insightLines = useOhengInsight(ohengResult);

    /** 오늘의 추천 조합: supplement가 있는 쌍 중 랜덤 1개 (고정 시드로 당일 동일) */
    const todayRecommend = useMemo(() => {
        if (!ohengResult?.supplement.length) return null;
        const day = Math.floor(Date.now() / 86400000);
        const idx = day % ohengResult.supplement.length;
        const s = ohengResult.supplement[idx];
        return { from: s.fromName, to: s.toName, element: getOhengDisplay(s.element) };
    }, [ohengResult]);

    const pairRelation =
        selectedFirst && selectedSecond
            ? getPairRelation(
                  selectedFirst.name || "멤버1",
                  selectedSecond.name || "멤버2",
                  ohengResult
              )
            : null;

    const name1 = selectedFirst?.name || "멤버1";
    const name2 = selectedSecond?.name || "멤버2";
    const isSupplement = pairRelation?.type === "supplement";
    const isConflict = pairRelation?.type === "conflict";
    const providerName = isSupplement ? (pairRelation.data as SupplementPair).fromName : null;
    const receiverName = isSupplement ? (pairRelation.data as SupplementPair).toName : null;
    const elementForDisplay =
        pairRelation && (pairRelation.type === "supplement" || pairRelation.type === "conflict")
            ? getOhengDisplay(
                  pairRelation.type === "supplement"
                      ? (pairRelation.data as SupplementPair).element
                      : (pairRelation.data as ConflictPair).element
              )
            : null;

    if (n < 2) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="overflow-hidden rounded-lg bg-white shadow-sm sm:rounded-lg"
        >
            {/* 헤더 — Tailwind UI section-headings with_description + with_actions */}
            <div className="border-b border-gray-200 px-4 pb-5 pt-6 sm:px-6 sm:flex sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-violet-600">
                            <Zap className="size-6 text-white" aria-hidden />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                오행 궁합 매칭
                            </h2>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                두 사람을 선택해서 기운이 어떻게 흐르는지 확인해보세요.
                            </p>
                        </div>
                    </div>
                </div>
                {bestProvider && (
                    <div className="mt-4 shrink-0 sm:mt-0 sm:ml-4">
                        <div className="overflow-hidden rounded-lg bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 ring-inset sm:p-5">
                            <p className="truncate text-xs font-medium uppercase tracking-wide text-amber-600">
                                최고의 기운 제공자
                            </p>
                            <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">{bestProvider}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 py-6 sm:px-6">
            {ohengLoading && (
                <div className="text-center py-12">
                    <div className="mx-auto size-12 rounded-full border-2 border-gray-200 border-t-violet-600 animate-spin" aria-hidden />
                    <p className="mt-3 text-sm font-semibold text-gray-900">오행 조합 분석 중</p>
                    <p className="mt-1 text-sm text-gray-500">잠시만 기다려 주세요.</p>
                </div>
            )}
            {!ohengLoading && ohengError && (
                <div className="rounded-md bg-amber-50 p-4 ring-1 ring-amber-100">
                    <div className="flex">
                        <div className="shrink-0">
                            <Sparkles className="size-5 text-amber-500" aria-hidden />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">데이터 일부만 표시돼요</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>{ohengError}</p>
                                <p className="mt-1 text-amber-600">아래는 데모 데이터로 표시됩니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {!ohengLoading && (ohengResult || ohengError) && (
                <>
                    {/* 프로필 선택 — Tailwind UI avatars + small_flat_pill badge */}
                    <div className="mb-6">
                        <p className="mb-3 text-sm font-medium text-gray-500">
                            두 명을 차례로 클릭하면 조합이 표시돼요
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                            {groupMembers.map((m) => {
                                const isFirst = selectedFirst?.id === m.id;
                                const isSecond = selectedSecond?.id === m.id;
                                const isSelected = isFirst || isSecond;
                                return (
                                    <motion.button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            if (!selectedFirst) {
                                                setSelectedFirst(m);
                                                setSelectedSecond(null);
                                            } else if (selectedFirst.id === m.id) {
                                                setSelectedFirst(null);
                                                setSelectedSecond(null);
                                            } else if (!selectedSecond) {
                                                setSelectedSecond(m);
                                            } else {
                                                setSelectedFirst(m);
                                                setSelectedSecond(null);
                                            }
                                        }}
                                        className={`member-card relative flex shrink-0 flex-col items-center gap-2 rounded-lg px-4 py-4 transition-colors select-none touch-none cursor-pointer ring-1 shadow-sm sm:py-5 ${
                                            isSelected
                                                ? "bg-violet-50 ring-violet-200"
                                                : "bg-white ring-gray-200 ring-inset hover:bg-gray-50"
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="relative inline-block">
                                            <img
                                                src={m.avatar || "https://via.placeholder.com/56"}
                                                alt=""
                                                className="size-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                                            />
                                            {isFirst && (
                                                <span className="absolute right-0 bottom-0 block size-5 rounded-full bg-violet-600 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white">
                                                    1
                                                </span>
                                            )}
                                            {isSecond && (
                                                <span className="absolute right-0 bottom-0 block size-5 rounded-full bg-amber-500 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white">
                                                    2
                                                </span>
                                            )}
                                        </span>
                                        <span className="max-w-[80px] truncate text-sm font-semibold text-gray-900">
                                            {m.name || "멤버"}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 두 사람 + 오행 관계 — Tailwind UI card + description-list 스타일 */}
                    <AnimatePresence mode="wait">
                        {selectedFirst && selectedSecond ? (
                            <motion.div
                                key="pair"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 ring-inset"
                            >
                                <div className="px-4 py-6 sm:px-6">
                                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-8">
                                        {/* 프로필 1 — Tailwind UI avatar + flat_pill badge */}
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <img
                                                src={selectedFirst.avatar || "https://via.placeholder.com/80"}
                                                alt=""
                                                className="size-20 rounded-full object-cover ring-2 ring-violet-200 shadow-sm"
                                            />
                                            <p className="text-sm font-semibold text-gray-900">
                                                {selectedFirst.name || "멤버"}
                                            </p>
                                            {isSupplement && providerName === name1 && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    기운 제공자
                                                </span>
                                            )}
                                            {isSupplement && receiverName === name1 && (
                                                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
                                                    기운 수혜자
                                                </span>
                                            )}
                                        </div>

                                        {/* 오행 + 메시지 (중앙) */}
                                        <div className="flex flex-col items-center gap-2">
                                            {elementForDisplay && (
                                                <motion.span
                                                    className="flex items-center justify-center"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <OhengIcon
                                                        element={
                                                            pairRelation?.type === "supplement"
                                                                ? (pairRelation.data as SupplementPair).element
                                                                : (pairRelation!.data as ConflictPair).element
                                                        }
                                                        className="size-10 text-gray-700"
                                                    />
                                                </motion.span>
                                            )}
                                            {elementForDisplay && (
                                                <span
                                                    className="text-sm font-semibold text-gray-900"
                                                    style={{
                                                        color:
                                                            pairRelation?.type === "supplement"
                                                                ? "#059669"
                                                                : pairRelation?.type === "conflict"
                                                                  ? "#d97706"
                                                                  : "#374151",
                                                    }}
                                                >
                                                    {elementForDisplay.label}
                                                </span>
                                            )}
                                            {isSupplement && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    <Heart className="size-3.5" />
                                                    채워줌
                                                </span>
                                            )}
                                            {isConflict && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                                    <Swords className="size-3.5" />
                                                    주의
                                                </span>
                                            )}
                                        </div>

                                        {/* 프로필 2 */}
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <img
                                                src={selectedSecond.avatar || "https://via.placeholder.com/80"}
                                                alt=""
                                                className="size-20 rounded-full object-cover ring-2 ring-amber-200 shadow-sm"
                                            />
                                            <p className="text-sm font-semibold text-gray-900">
                                                {selectedSecond.name || "멤버"}
                                            </p>
                                            {isSupplement && providerName === name2 && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    기운 제공자
                                                </span>
                                            )}
                                            {isSupplement && receiverName === name2 && (
                                                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
                                                    기운 수혜자
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-5 border-t border-gray-100 pt-5">
                                        <p className="text-center text-sm leading-6 text-gray-700">
                                            {pairRelation?.message}
                                        </p>
                                    </div>

                                    {/* 다른 조합 보기 — Tailwind UI secondary button */}
                                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                        <span className="text-sm text-gray-500">다른 조합 보기:</span>
                                        {groupMembers
                                            .filter((m) => m.id !== selectedFirst.id)
                                            .slice(0, 6)
                                            .map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFirst(selectedFirst);
                                                        setSelectedSecond(m);
                                                    }}
                                                    className="inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                                                >
                                                    {m.name || "멤버"}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                            >
                                <Sparkles className="mx-auto size-12 text-gray-400" aria-hidden />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">두 명을 선택해 주세요</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    위에서 두 명을 차례로 클릭하면 오행 관계가 여기에 표시돼요.
                                </p>
                                {todayRecommend && (
                                    <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 ring-1 ring-amber-100">
                                        <Star className="size-4 shrink-0 text-amber-500" />
                                        <span className="text-sm font-medium text-amber-800">
                                            오늘의 추천: {todayRecommend.from} · {todayRecommend.to}{" "}
                                            <OhengIcon element={todayRecommend.element.short} className="inline size-3.5 text-amber-600" />
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 팀 오행 요약 — Tailwind UI card-headings with_description_and_action + stats simple_in_cards */}
                    <div className="summary-card mt-6 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 ring-inset">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
                            <div className="-mt-4 -ml-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
                                <div className="mt-4 ml-4 flex items-center gap-2">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-600">
                                        <BarChart3 className="size-5 text-white" aria-hidden />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">팀 오행 요약</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            기운 채워줌·상충 관계를 한눈에 볼 수 있어요.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 ml-4 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setSummaryExpanded((e) => !e)}
                                        className="relative inline-flex items-center gap-x-1.5 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                                    >
                                        {summaryExpanded ? "접기" : "상세 목록 보기"}
                                        {summaryExpanded ? (
                                            <ChevronUp className="-mr-0.5 size-4" aria-hidden />
                                        ) : (
                                            <ChevronDown className="-mr-0.5 size-4" aria-hidden />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-5 sm:px-6 sm:py-6 space-y-5">
                            {summaryLines.length === 0 && !summaryExpanded && (
                                <p className="text-sm text-gray-500">기운 채워줌·상충이 없어요.</p>
                            )}
                            {summaryLines.length > 0 && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {summaryLines.map(({ element, supplement, conflict }) => (
                                        <span key={element} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700">
                                            <OhengIcon element={element} className="size-4 text-gray-500" />
                                            {supplement + conflict}쌍
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* Tailwind UI stats simple_in_cards — 2열 그리드 */}
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200 ring-inset sm:p-6">
                                    <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Heart className="size-4 shrink-0 text-emerald-500" />
                                        기운 채워줌
                                    </dt>
                                    <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                                        {ohengResult?.supplement.length ?? 0}쌍
                                    </dd>
                                    <ul className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                                        {supplementTable.map(({ element, rows }) => {
                                            const total = rows.reduce((s, r) => s + r.toNames.length, 0);
                                            return (
                                                <li key={element} className="flex items-center gap-2">
                                                    <OhengIcon element={element} className="size-3.5 shrink-0 text-gray-400" />
                                                    {element}: {total}쌍
                                                </li>
                                            );
                                        })}
                                        {supplementTable.length === 0 && (
                                            <li className="text-gray-400">—</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm ring-1 ring-gray-200 ring-inset sm:p-6">
                                    <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Swords className="size-4 shrink-0 text-amber-500" />
                                        같은 기운 상충
                                    </dt>
                                    <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                                        {ohengResult?.conflict.length ?? 0}쌍
                                    </dd>
                                    <ul className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                                        {conflictTable.map(({ element, count, summary }) => (
                                            <li key={element} className="flex items-center gap-2">
                                                <OhengIcon element={element} className="size-3.5 shrink-0 text-gray-400" />
                                                {element}: {count}쌍
                                                {summary === "거의 모든 멤버 해당" && (
                                                    <Zap className="size-3 shrink-0 text-amber-500 inline" />
                                                )}
                                            </li>
                                        ))}
                                        {conflictTable.length === 0 && (
                                            <li className="text-gray-400">—</li>
                                        )}
                                    </ul>
                                </div>
                            </dl>
                        {/* 펼침: 인사이트 + 상세 — Tailwind UI left_aligned_in_card / description-list */}
                        {summaryExpanded && ohengResult && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                                <div className="px-4 py-6 sm:px-6 space-y-6">
                                    {insightLines.length > 0 && (
                                        <div className="rounded-md bg-violet-50 p-4 ring-1 ring-violet-100">
                                            <div className="flex">
                                                <div className="shrink-0">
                                                    <Lightbulb className="size-5 text-violet-500" aria-hidden />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-violet-800">인사이트</h3>
                                                    <div className="mt-2 text-sm leading-6 text-gray-700">
                                                        {insightLines.map((line, i) => (
                                                            <p key={i} className="leading-relaxed">
                                                                {line}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* 좌: 기운 채워줌 상세 — Tailwind UI card + divide-y */}
                                        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 ring-inset">
                                            <div className="px-4 py-4 sm:px-6 border-b border-gray-100">
                                                <h3 className="text-base leading-7 font-semibold text-gray-900 flex items-center gap-2">
                                                    <Heart className="size-4 text-emerald-500" />
                                                    기운 채워줌 ({ohengResult.supplement.length}쌍)
                                                </h3>
                                                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">멤버 → 멤버 관계</p>
                                            </div>
                                            <div className="border-t border-gray-100 divide-y divide-gray-100">
                                                {ohengResult.supplement.length > 0 ? (
                                                    supplementTable.flatMap(({ element, rows }) =>
                                                        rows.map((row, i) => (
                                                            <div
                                                                key={`${element}-${row.fromName}-${i}`}
                                                                className="px-4 py-3 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-3"
                                                            >
                                                                {i === 0 ? (
                                                                    <>
                                                                        <dt className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                                                            <OhengIcon element={element} className="size-3.5 text-emerald-600" />
                                                                            {element}
                                                                        </dt>
                                                                        <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                                                                            {row.fromName} → {row.toNames.join(", ")}
                                                                        </dd>
                                                                    </>
                                                                ) : (
                                                                    <dd className="text-sm leading-6 text-gray-700 sm:col-span-3 sm:mt-0">
                                                                        {row.fromName} → {row.toNames.join(", ")}
                                                                    </dd>
                                                                )}
                                                            </div>
                                                        ))
                                                    )
                                                ) : (
                                                    <p className="px-4 py-6 text-sm text-gray-500 sm:px-6">—</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* 우: 같은 기운 상충 상세 */}
                                        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 ring-inset">
                                            <div className="px-4 py-4 sm:px-6 border-b border-gray-100">
                                                <h3 className="text-base leading-7 font-semibold text-gray-900 flex items-center gap-2">
                                                    <Swords className="size-4 text-amber-500" />
                                                    같은 기운 상충 ({ohengResult.conflict.length}쌍)
                                                </h3>
                                                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">오행별 요약</p>
                                            </div>
                                            <div className="border-t border-gray-100 divide-y divide-gray-100">
                                                {ohengResult.conflict.length > 0 ? (
                                                    conflictTable.map(({ element, count, summary }) => (
                                                        <div key={element} className="px-4 py-4 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-4">
                                                            <dt className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                                                <OhengIcon element={element} className="size-3.5 text-amber-600" />
                                                                {element}
                                                            </dt>
                                                            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0 flex items-center gap-1">
                                                                {count}쌍 · {summary}
                                                                {summary === "거의 모든 멤버 해당" && <Zap className="size-3 shrink-0 text-amber-500" />}
                                                            </dd>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="px-4 py-6 text-sm text-gray-500 sm:px-6">—</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </>
            )}
            </div>
        </motion.section>
    );
};
