import React, { useMemo, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import turtleImage from "@/assets/turtle.png";
import { ConstitutionSajuBlock } from "./ConstitutionSajuBlock";
import type { ConstitutionPhase, ConstitutionSajuData } from "../data/constitutionData";
import { CONSTITUTION_SAJU_DATA } from "../data/constitutionData";
import { CAMPUS_MENUS, type MenuItem } from "../data/campusMenus";
import { fiveElementsToOheng, getOhengHead } from "../utils/ohengUtils";
import { useTypewriter } from "../hooks/useTypewriter";
import type { OhengCounts } from "./FiveElementsDisplay";
import type { SajuInfo, TotalReview } from "@/services/faceAnalysisApi";

export interface ConstitutionTabProps {
    sajuInfo?: SajuInfo | null;
    totalReview?: TotalReview | null;
    loadingConstitution?: boolean;
    constitutionPhase: ConstitutionPhase;
    setConstitutionPhase: (phase: ConstitutionPhase) => void;
    selectedMenuIdx: number | null;
    setSelectedMenuIdx: (idx: number | null) => void;
    isConstitutionReturning: boolean;
}

const INTRO_LINE =
    "옛 선인들은 말했소. '약식동원(藥食同源)'이라고...\n\n음식과 약은 근본이 같고, 사람마다 타고난 체질이 다르다는 뜻이오.\n\n지금부터 당신의 체질에 맞는 오늘의 식단을 찾으러 가보지 않겠소?";
const SELECT_LINE = "오늘의 싸밥, 무엇을 먹을지……\n네 마음이 끌리는 것을 하나 골라 보거라.";

function buildConstitutionData(
    oheng: OhengCounts,
    head: string,
    constitutionBlock: string | undefined | null | false
): ConstitutionSajuData {
    if (constitutionBlock) {
        return {
            type: head,
            head,
            oheng,
            sections: [{ text: String(constitutionBlock) }],
            daeunAndFoods: { title: "건강 관리를 위해 꼭 챙기면 좋은 것들", body: "", priorityFoods: [] },
        };
    }
    return { ...CONSTITUTION_SAJU_DATA, oheng, head, type: head };
}

function ConstitutionLoadingCard() {
    return (
        <GlassCard className="w-full max-w-2xl p-8 sm:p-10 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>
            <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">체질·웰스토리 분석 중입니다...</p>
            </div>
        </GlassCard>
    );
}

export function ConstitutionTab({
    sajuInfo,
    totalReview,
    loadingConstitution = false,
    constitutionPhase,
    setConstitutionPhase,
    selectedMenuIdx,
    setSelectedMenuIdx,
    isConstitutionReturning,
}: ConstitutionTabProps) {
    const menus = useMemo<MenuItem[]>(() => {
        const apiMenus = totalReview?.welstoryMenus;
        if (apiMenus && apiMenus.length > 0) {
            return apiMenus.map((menu) => ({
                name: menu.name,
                desc: menu.desc || "",
                image: menu.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                reason: "",
            }));
        }
        return CAMPUS_MENUS["부울경"];
    }, [totalReview?.welstoryMenus]);

    const apiRecommendedIndex = totalReview?.recommendedMenu?.index ?? 0;
    const apiRecommendedReason = totalReview?.recommendedMenu?.reason ?? "";
    const recommendedMenuIndex = apiRecommendedIndex < menus.length ? apiRecommendedIndex : 0;
    const recommendedMenu = menus[recommendedMenuIndex];

    const { text: introText, isComplete: introTextComplete } = useTypewriter(INTRO_LINE, {
        enabled: constitutionPhase === "intro",
        speedMs: 60,
        skipToEnd: isConstitutionReturning,
    });
    const { text: selectText } = useTypewriter(SELECT_LINE, {
        enabled: constitutionPhase === "select",
        speedMs: 60,
        skipToEnd: isConstitutionReturning,
    });

    const recommendedReason = apiRecommendedReason || recommendedMenu?.reason || "오늘의 체질에 맞는 메뉴입니다.";
    const resultTurtleMessage =
        constitutionPhase === "result" && selectedMenuIdx !== null
            ? (() => {
                  const userPickedMenu = menus[selectedMenuIdx];
                  const isSame = selectedMenuIdx === recommendedMenuIndex;
                  return isSame
                      ? `오늘 너에게 가장 추천하는 메뉴는 「${recommendedMenu.name}」이오.\n\n"${recommendedReason}"`
                      : `네가 고른 ${userPickedMenu.name}도 나쁘지 않다. 다만, 너의 몸에 가장 이로운 것은 다른 것이니……\n\n오늘 너에게 가장 추천하는 메뉴는 「${recommendedMenu.name}」이오.\n\n"${recommendedReason}"`;
              })()
            : "";
    const { text: resultMessageText, isComplete: resultMessageComplete } = useTypewriter(resultTurtleMessage, {
        enabled: constitutionPhase === "result" && selectedMenuIdx !== null,
        speedMs: 50,
        skipToEnd: isConstitutionReturning,
    });

    const turtleMessageCardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (constitutionPhase === "result" && selectedMenuIdx !== null && turtleMessageCardRef.current) {
            const t = setTimeout(() => {
                turtleMessageCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            return () => clearTimeout(t);
        }
    }, [constitutionPhase, selectedMenuIdx]);

    const constitutionBlock = totalReview && (
        (totalReview as Record<string, string>)["total_user_saju_information"] ??
        totalReview.constitutionSummary
    );

    if (loadingConstitution && sajuInfo && !constitutionBlock) {
        return (
            <div className="relative min-h-[60vh] flex items-center justify-center px-4">
                <ConstitutionLoadingCard />
            </div>
        );
    }

    return (
        <div className="relative min-h-[60vh]">
            {/* 인트로: 거북 도사 중앙 + 대사 + 시작하기 */}
            {constitutionPhase === "intro" && (
                <div className="flex flex-col items-center justify-center px-4">
                    <GlassCard className="max-w-2xl w-full p-10 border-8 border-white rounded-[40px] shadow-clay-lg bg-white/70 flex flex-col items-center text-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 mb-8 drop-shadow-2xl animate-[float_4s_ease-in-out_infinite]">
                            <img src={turtleImage} alt="거북 도사" className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-[28px] px-8 py-6 border-4 border-white shadow-clay-sm mb-8 w-full max-w-lg min-h-[4.5rem]">
                            <p className="text-base md:text-lg text-gray-800 font-hand leading-tight break-keep whitespace-pre-line">
                                {introText}
                                {!introTextComplete && <span className="animate-pulse">|</span>}
                            </p>
                        </div>
                        {introTextComplete && (
                            <div className="animate-[fadeInUp_0.5s_ease-out_forwards]">
                                <button
                                    type="button"
                                    onClick={() => setConstitutionPhase("select")}
                                    className="px-10 py-4 text-lg font-bold font-display rounded-2xl bg-brand-green text-white shadow-clay-md border-4 border-white hover:bg-brand-green-deep hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    도사의 추천 받기
                                </button>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {/* 메뉴 선택 */}
            {constitutionPhase === "select" && (
                <div className="space-y-10">
                    <GlassCard className="max-w-2xl mx-auto p-6 md:p-8 border-8 border-white rounded-[32px] shadow-clay-md bg-white/80">
                        <div className="flex gap-4 items-start">
                            <div className="w-16 h-16 shrink-0">
                                <img src={turtleImage} alt="거북 도사" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-h-[3rem]">
                                <p className="text-base md:text-lg text-gray-800 font-hand leading-relaxed whitespace-pre-line">
                                    {selectText}
                                    {selectText.length < SELECT_LINE.length && <span className="animate-pulse">|</span>}
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {menus.map((menu, i) => (
                            <GlassCard
                                key={i}
                                onClick={() => {
                                    setSelectedMenuIdx(i);
                                    setConstitutionPhase("result");
                                }}
                                className="p-4 flex flex-col items-center text-center transition-all cursor-pointer rounded-[32px] border-4 border-white bg-white/60 hover:bg-white hover:border-brand-green/30 hover:scale-[1.02] active:scale-[0.98] shadow-clay-sm"
                            >
                                <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 shadow-inner border-2 border-white/50">
                                    <ImageWithFallback src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-bold text-gray-800 font-display text-sm">{menu.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold">{menu.desc}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* 결과: 메뉴 카드 + 거북 도사 대사 + 체질 풀이 */}
            {constitutionPhase === "result" && selectedMenuIdx !== null && (
                <div className="space-y-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {menus.map((menu, i) => {
                            const isUserChoice = i === selectedMenuIdx;
                            const isTurtleRecommend = i === recommendedMenuIndex;
                            return (
                                <div key={i} className="relative">
                                    <GlassCard
                                        className={`p-4 flex flex-col items-center text-center rounded-[32px] border-4 shadow-clay-sm overflow-hidden
                                            ${isUserChoice ? "border-brand-orange/60 bg-orange-50/40" : ""}
                                            ${isTurtleRecommend ? "border-brand-green ring-2 ring-brand-green/30" : "border-white bg-white/60"}
                                        `}
                                    >
                                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 shadow-inner border-2 border-white/50 relative">
                                            <ImageWithFallback src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                                            {isTurtleRecommend && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-brand-green/85 py-2 flex items-center justify-center">
                                                    <span className="text-white font-bold font-display text-xs md:text-sm text-center drop-shadow-md">
                                                        거북 도사의 오늘 추천
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-800 font-display text-sm">{menu.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold">{menu.desc}</p>
                                        {isUserChoice && (
                                            <div className="mt-2 px-2 py-1 bg-brand-orange/90 text-white text-[10px] font-bold font-display rounded-lg">
                                                네가 고른 메뉴
                                            </div>
                                        )}
                                    </GlassCard>
                                </div>
                            );
                        })}
                    </div>

                    <div ref={turtleMessageCardRef} className="scroll-mt-[35vh]">
                        <GlassCard className="max-w-2xl mx-auto p-6 md:p-8 border-8 border-white rounded-[32px] shadow-clay-md bg-white/80">
                            <div className="flex gap-4 items-start">
                                <div className="w-16 h-16 shrink-0">
                                    <img src={turtleImage} alt="거북 도사" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-h-[6rem]">
                                    <p className="text-base md:text-lg text-gray-800 font-hand leading-relaxed whitespace-pre-line">
                                        {resultMessageText}
                                        {!resultMessageComplete && <span className="animate-pulse">|</span>}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    <ConstitutionBlockSection
                        sajuInfo={sajuInfo}
                        totalReview={totalReview}
                        constitutionBlock={constitutionBlock}
                        loadingConstitution={loadingConstitution}
                        buildConstitutionData={buildConstitutionData}
                    />
                </div>
            )}

            {/* constitution phase: 체질 풀이만 표시 (공유 페이지용) */}
            {constitutionPhase === "constitution" && (
                <div className="space-y-6">
                    <ConstitutionOnlySection
                        sajuInfo={sajuInfo}
                        totalReview={totalReview}
                        constitutionBlock={constitutionBlock}
                        loadingConstitution={loadingConstitution}
                    />
                </div>
            )}
        </div>
    );
}

interface ConstitutionBlockSectionProps {
    sajuInfo?: SajuInfo | null;
    totalReview?: TotalReview | null;
    constitutionBlock: string | undefined | null | false;
    loadingConstitution?: boolean;
    buildConstitutionData: (oheng: OhengCounts, head: string, constitutionBlock: string | undefined | null | false) => ConstitutionSajuData;
}

function ConstitutionBlockSection({ sajuInfo, totalReview, constitutionBlock, loadingConstitution, buildConstitutionData }: ConstitutionBlockSectionProps) {
    const ohengFromApi = sajuInfo ? fiveElementsToOheng(sajuInfo.fiveElements) : null;
    const oheng: OhengCounts = ohengFromApi ?? { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const { head } = getOhengHead(oheng);

    if (!sajuInfo && !constitutionBlock) {
        return (
            <GlassCard className="w-full max-w-4xl mx-auto p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>
                <p className="text-gray-600 text-center">
                    관상 분석을 먼저 진행해 주시면, 입력하신 사주 데이터를 바탕으로 오행 분포와 체질 풀이를 보여드립니다.
                </p>
            </GlassCard>
        );
    }

    if ((loadingConstitution || (sajuInfo && !constitutionBlock)) && sajuInfo) {
        return (
            <GlassCard className="w-full max-w-4xl mx-auto p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>
                <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">체질 분석 중입니다...</p>
                </div>
            </GlassCard>
        );
    }

    return <ConstitutionSajuBlock data={buildConstitutionData(oheng, head, constitutionBlock)} />;
}

interface ConstitutionOnlySectionProps {
    sajuInfo?: SajuInfo | null;
    totalReview?: TotalReview | null;
    constitutionBlock: string | undefined | null | false;
    loadingConstitution?: boolean;
}

function ConstitutionOnlySection({ sajuInfo, totalReview, constitutionBlock, loadingConstitution }: ConstitutionOnlySectionProps) {
    const ohengFromApi = sajuInfo ? fiveElementsToOheng(sajuInfo.fiveElements) : null;
    const oheng: OhengCounts = ohengFromApi ?? CONSTITUTION_SAJU_DATA.oheng;
    const { head } = ohengFromApi ? getOhengHead(oheng) : { head: CONSTITUTION_SAJU_DATA.head };

    if (loadingConstitution && sajuInfo && !constitutionBlock) {
        return (
            <GlassCard className="w-full max-w-4xl mx-auto p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>
                <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">체질 분석 중입니다...</p>
                </div>
            </GlassCard>
        );
    }

    return <ConstitutionSajuBlock data={buildConstitutionData(oheng, head, constitutionBlock)} />;
}
