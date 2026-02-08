import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { Utensils, Sparkles, Download, Upload, X, CheckCircle2 } from "lucide-react";
import { SajuAnalysisResponse } from "@/shared/api/sajuApi";
import { API_ENDPOINTS } from "@/shared/api/config";
import profileImage from "@/assets/profile.png";
import selfieImage from "@/assets/selfie.png";
import turtleImage from "@/assets/turtle.png";
import futureFilmLogoSrc from "@/assets/future_film_logo.svg";
import { FiveElementsDisplay, type OhengCounts } from "./FiveElementsDisplay";
import type { SajuInfo, TotalReview, WelstoryMenuItem, RecommendedMenu } from "@/shared/api/faceAnalysisApi";

/** 한 글자씩 채워지는 타이핑 효과. skipToEnd 시 애니 없이 전체 텍스트 즉시 노출 (복귀 시용) */
function useTypewriter(
    fullText: string,
    options?: { speedMs?: number; onComplete?: () => void; enabled?: boolean; skipToEnd?: boolean }
) {
    const [text, setText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const { speedMs = 70, onComplete, enabled = true, skipToEnd = false } = options ?? {};

    useEffect(() => {
        if (!enabled || !fullText) {
            if (!enabled) {
                setText("");
                setIsComplete(false);
            }
            return;
        }
        if (skipToEnd) {
            setText(fullText);
            setIsComplete(true);
            onComplete?.();
            return;
        }
        setText("");
        setIsComplete(false);
        let i = 0;
        const id = setInterval(() => {
            if (i >= fullText.length) {
                clearInterval(id);
                setText(fullText);
                setIsComplete(true);
                onComplete?.();
                return;
            }
            setText(fullText.slice(0, i + 1));
            i += 1;
        }, speedMs);
        return () => clearInterval(id);
    }, [fullText, enabled, speedMs, skipToEnd]);

    return { text, isComplete };
}

// 체질 분석 게임 단계 (상위에서 상태 유지 시 탭 전환 후 복귀 시 마지막 뷰 유지용)
export type ConstitutionPhase = "intro" | "select" | "result" | "constitution";

// --- 체질 풀이 데이터 (백 연동 시 API 응답으로 교체) ---
export interface ConstitutionSajuSection {
    sub?: string;
    text: string;
}

/** 지금 대운 + 꼭 챙기면 좋은 음식 (마지막 블록) */
export interface ConstitutionDaeunAndFoods {
    title: string;
    body: string;
    /** 꼭 챙기면 좋은 음식 요약 (짧은 리스트) */
    priorityFoods: string[];
}

export interface ConstitutionSajuData {
    type: string;
    head: string;
    /** 일간 설명 한 줄 (예: 丁火) */
    ilganSummary?: string;
    /** 오행 개수 — FiveElementsDisplay에 그대로 전달 */
    oheng: OhengCounts;
    sections: ConstitutionSajuSection[];
    daeunAndFoods: ConstitutionDaeunAndFoods;
}

const CONSTITUTION_DATA = {
    type: "불과 흙이 중심인 체질 (丁火·土多)",
    recommendedMenuIndex: 0,
};

/** 사주 기반 체질 풀이 — 구조화된 데이터 (백에서 동일 shape로 내려주면 그대로 사용) */
const CONSTITUTION_SAJU_DATA: ConstitutionSajuData = {
    type: "불과 흙이 중심인 체질 (丁火·土多)",
    head: "불과 흙이 중심인 체질",
    ilganSummary: "마른  한가운데 호롱불이 빛나고 있는 사주",
    oheng: { wood: 1, fire: 2, earth: 3, metal: 1, water: 1 },
    sections: [
        {
            sub: "전체적인 체질 특성",
            text: "사주를 보면 토(土)가 가장 많고, 그다음이 화(火)입니다. 이는 기본 체질이 열과 건조, 그리고 소화기 중심으로 돌아간다는 뜻입니다. 따라서 건강을 볼 때도 차갑고 축축한 병보다는 열이나 염증, 소화기 질환, 순환 장애, 긴장성 질환 쪽을 먼저 살펴보아야 합니다.",
        },
        {
            sub: "이 체질이 나타내는 건강상 주의점",
            text: "정화 일간은 몸으로 치면 심장과 혈관, 혈압, 자율신경과 연결되며 눈과 머리, 신경계와도 관련이 깊습니다. 스트레스가 쌓이면 불면이나 두근거림, 예민함으로 바로 나타나는 특징이 있습니다. 특히 이 사주는 丁이 두 개(일주와 시주)가 있어 불씨가 하나가 아니라 두 개의 촛불이 동시에 타는 구조입니다. 그래서 평소에는 괜찮다가도 스트레스를 받으면 한 번에 확 무너지는 타입이라고 볼 수 있습니다. 잠은 자는데 개운하지 않거나 긴장하면 심장이 빨리 뛰는 증상, 눈이 쉽게 피로해지거나 속은 더부룩한데 열은 위로 치미는 증상을 겪을 수 있습니다.",
        },
        {
            sub: "토(土)가 많은 사주와 소화기 건강",
            text: "이 사주는 토가 3으로 가장 강합니다. 토는 몸에서 위장과 비장, 장, 면역력, 살과 근육을 의미합니다. 좋은 쪽으로 보자면 기본 체력은 있는 편이며 잘 버티는 몸으로 쉽게 쓰러지는 타입은 아닙니다. 그러나 주의해야 할 점은 소화기에 과부하가 걸리기 쉽고 더부룩함이나 체기가 생기기 쉬우며, 살이 쉽게 붙거나 잘 빠지지 않는 체질일 수 있다는 것입니다. 또한 스트레스를 받으면 위장부터 반응하는 경향이 있습니다. 이 사주는 火에서 土로 기운이 계속 흐르는 구조라 불이 흙을 계속 데우게 되므로 위염이나 역류성 식도염, 장 트러블, 과식 후 컨디션 급저하 같은 패턴이 생기기 쉽습니다.",
        },
        {
            sub: "수(水)가 약한 구조와 회복력",
            text: "수는 딱 1로 매우 약합니다. 수는 몸에서 신장과 방광, 수면, 회복력, 호르몬 밸런스를 담당합니다. 불과 흙은 강한데 이를 식혀주고 조절해 줄 물 기운이 약하다는 것이 핵심입니다. 이로 인해 피로 회복이 느리고 밤에 생각이 많아지며, 자도 자도 피곤하고 물을 적게 마시는 습관이 생길 수 있습니다. 이 사주는 타고난 병보다는 관리를 하지 않으면 점차 쌓이는 병 쪽에 해당한다고 볼 수 있습니다.",
        },
        {
            sub: "건강 관리를 위해 꼭 챙기면 좋은 것들",
            text: "이러한 체질적 특성을 고려할 때 평소 물을 자주 마시는 습관을 들이는 것이 가장 중요합니다. 보리차나 옥수수차, 미역국이나 다시마국처럼 열을 식혀주고 수분을 보충해 주는 음식이 좋습니다. 소화기를 편안하게 해주는 흰죽이나 누룽지, 고구마, 바나나도 도움이 됩니다. 오이와 배추, 토마토, 연근 같은 채소류는 익혀서 먹는 것이 좋으며, 무엇보다 수면 관리와 규칙적인 식사 습관을 유지하는 것이 장기적인 건강을 지키는 데 핵심이 됩니다.",
        },
    ],
    daeunAndFoods: {
        title: "꼭 챙기면 좋은 음식",
        body: "",
        priorityFoods: [
            "물 (자주 마시기)",
            "보리차, 옥수수차, 미역국·다시마국",
            "흰죽, 누룽지, 고구마, 바나나",
            "오이, 배추, 토마토, 연근 (익혀서)",
            "수면 관리, 규칙적인 식사",
        ],
    },
};

const SSABAP_MENUS = [
    {
        name: "닭가슴살 쌈밥",
        desc: "따뜻한 성질의 닭고기",
        image: "https://images.unsplash.com/photo-1747228469031-c5fc60b9d9f9?q=80&w=400&auto=format&fit=crop",
        reason: "소음인은 몸을 따뜻하게 데워주는 보양식이 필수입니다. 닭고기는 기력을 보충하고 소화를 돕는 최고의 궁합입니다."
    },
    {
        name: "강된장 보리밥",
        desc: "구수한 발효 음식",
        image: "https://images.unsplash.com/photo-1764853467738-93ee25b0ad1e?q=80&w=400&auto=format&fit=crop",
        reason: "차가워진 위장을 달래주는 따뜻한 발효 된장은 장운동을 돕고 면역력을 높여줍니다."
    },
    {
        name: "영양 돌솥 비빔밥",
        desc: "열기를 품은 한 끼",
        image: "https://images.unsplash.com/photo-1628441309764-794e7362f6e6?q=80&w=400&auto=format&fit=crop",
        reason: "따뜻한 온기가 유지되는 돌솥에 익힌 채소들은 위장에 무리를 주지 않고 영양을 공급합니다."
    },
    {
        name: "진한 삼계탕",
        desc: "최고의 기력 보충",
        image: "https://images.unsplash.com/photo-1676686997059-fb817ebbb2b5?q=80&w=400&auto=format&fit=crop",
        reason: "기운이 허할 때 먹는 삼계탕은 인삼과 마늘의 열기로 체온을 높이고 혈액순환을 돕습니다."
    },
];

const CAMPUS_LIST = ["부울경", "서울", "대전", "구미", "광주"] as const;
type Campus = typeof CAMPUS_LIST[number];

const CAMPUS_MENUS: Record<Campus, typeof SSABAP_MENUS> = {
    "부울경": SSABAP_MENUS, // Simplified for brevity in this copy, reusing same list as original code did
    "서울": [
        {
            name: "매콤 닭볶음탕",
            desc: "얼얼한 매운맛",
            image: "https://images.unsplash.com/photo-1604908815604-5844f135f772?q=80&w=400&auto=format&fit=crop",
            reason: "서울 캠퍼스 인근 맛집의 시그니처 메뉴입니다. 매운 양념이 식욕을 돋우고 기운을 북돋아줍니다."
        },
        {
            name: "제육볶음 정식",
            desc: "고소한 돼지고기",
            image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?q=80&w=400&auto=format&fit=crop",
            reason: "단백질이 풍부한 제육볶음은 바쁜 개발자들의 체력을 보충해줍니다."
        },
        {
            name: "김치찌개 백반",
            desc: "얼큰한 국물요리",
            image: "https://images.unsplash.com/photo-1618119069294-a66eea07e28c?q=80&w=400&auto=format&fit=crop",
            reason: "속을 풀어주는 뜨거운 김치찌개는 스트레스 해소에 도움이 됩니다."
        },
        {
            name: "불고기 덮밥",
            desc: "달콤짭조름한 맛",
            image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=400&auto=format&fit=crop",
            reason: "바쁜 점심시간에 빠르게 먹을 수 있는 한 그릇 요리입니다."
        },
    ],
    "대전": [
        {
            name: "성심당 빵 세트",
            desc: "대전 명물 베이커리",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop",
            reason: "대전을 대표하는 성심당의 빵은 출출할 때 간편하게 에너지를 충전할 수 있습니다."
        },
        {
            name: "칼국수 정식",
            desc: "쫄깃한 면발",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&auto=format&fit=crop",
            reason: "담백하고 든든한 칼국수는 소화가 잘 되어 오후 졸음을 방지합니다."
        },
        {
            name: "보쌈 정식",
            desc: "부드러운 수육",
            image: "https://images.unsplash.com/photo-1674899933560-c208da2f6f0c?q=80&w=400&auto=format&fit=crop",
            reason: "야채와 함께 먹는 보쌈은 영양 균형이 뛰어난 건강식입니다."
        },
        {
            name: "순두부찌개",
            desc: "부드러운 단백질",
            image: "https://images.unsplash.com/photo-1596040033229-a0b7e0bc1031?q=80&w=400&auto=format&fit=crop",
            reason: "소화가 잘 되는 순두부는 위장이 약한 분들에게 좋습니다."
        },
    ],
    "구미": [
        {
            name: "구미 곱창 정식",
            desc: "고소한 내장 요리",
            image: "https://images.unsplash.com/photo-1670479063750-fb2c533c878f?q=80&w=400&auto=format&fit=crop",
            reason: "구미 지역 특산 곱창은 철분과 단백질이 풍부하여 체력 보충에 탁월합니다."
        },
        {
            name: "쌈밥 정식",
            desc: "신선한 채소",
            image: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?q=80&w=400&auto=format&fit=crop",
            reason: "다양한 야채와 함께하는 쌈밥은 식이섬유가 풍부해 건강에 좋습니다."
        },
        {
            name: "된장찌개 백반",
            desc: "구수한 재래식 된장",
            image: "https://images.unsplash.com/photo-1623428188584-d16f38e62665?q=80&w=400&auto=format&fit=crop",
            reason: "발효 식품인 된장은 장 건강을 개선하고 면역력을 높입니다."
        },
        {
            name: "갈비탕",
            desc: "진한 사골 국물",
            image: "https://images.unsplash.com/photo-1677183123125-093bd839cfaa?q=80&w=400&auto=format&fit=crop",
            reason: "깊은 맛의 갈비탕은 피로 회복과 뼈 건강에 도움을 줍니다."
        },
    ],
    "광주": [
        {
            name: "비빔밥 정식",
            desc: "전주 비빔밥 스타일",
            image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?q=80&w=400&auto=format&fit=crop",
            reason: "호남 지역의 자랑인 비빔밥은 다양한 나물로 영양 균형이 완벽합니다."
        },
        {
            name: "광주식 육회 비빔밥",
            desc: "신선한 생육",
            image: "https://images.unsplash.com/photo-1620791144290-cf4892134c1a?q=80&w=400&auto=format&fit=crop",
            reason: "신선한 육회는 철분과 단백질 공급에 탁월하며 원기 회복에 좋습니다."
        },
        {
            name: "백반 정식",
            desc: "풍성한 반찬",
            image: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?q=80&w=400&auto=format&fit=crop",
            reason: "10가지 이상의 반찬이 나오는 광주 백반은 영양소를 골고루 섭취할 수 있습니다."
        },
        {
            name: "떡갈비 정식",
            desc: "달콤한 양념갈비",
            image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=400&auto=format&fit=crop",
            reason: "부드러운 떡갈비는 소화가 잘 되고 에너지를 빠르게 보충해줍니다."
        },
    ],
};


interface FutureImages {
    current: string | null;
    year_10: string | null;
    year_30: string | null;
    year_50: string | null;
}

/** 사주 기반 체질 풀이 블록 — data는 백에서 받아서 교체 가능 */
const HEALTH_FOODS_SECTION_TITLE = "건강 관리를 위해 꼭 챙기면 좋은 것들";

function ConstitutionSajuBlock({ data }: { data: ConstitutionSajuData }) {
    const { head, oheng, sections, daeunAndFoods } = data;
    const filteredSections = sections.filter((item) => item.sub !== HEALTH_FOODS_SECTION_TITLE);

    return (
        <div className="pt-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>

            <GlassCard className="w-full max-w-4xl mx-auto p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50 mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-brand-green/10 border-2 border-brand-green rounded-xl flex items-center justify-center">🐢</div>
                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">사주 기반 체질 풀이</h3>
                </div>

                <div className="mb-5">
                    <FiveElementsDisplay counts={oheng} title="오행 분포" headLabel={head} />
                </div>

                <div className="space-y-4 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                    {filteredSections.map((item, i) => (
                        <div key={i}>
                            {item.sub != null && <h4 className="text-gray-800 font-bold text-base mb-1.5 font-display">{item.sub}</h4>}
                            <div className="text-gray-700 text-base leading-[1.75] [&_strong]:font-bold [&_strong]:text-gray-800 [&_p:has(strong.total-review-subheading)]:mb-0 [&_p:not(:has(strong.total-review-subheading))]:mb-3 [&_p:last-child]:mb-0">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p>{children}</p>,
                                        strong: ({ children }) => <strong className="font-bold text-gray-800 total-review-subheading">{children}</strong>,
                                    }}
                                >
                                    {String(item.text ?? "").trim()}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}

interface StatsAnalysisProps {
    tab: "constitution" | "future";
    images: string[];
    futureImage?: string | null;
    onFutureImageUpload?: (image: string | null) => void;
    /** 체질 분석 단계 (상위에서 넘기면 탭 전환 후 복귀 시 마지막 뷰 유지) */
    constitutionPhase?: ConstitutionPhase;
    onConstitutionPhaseChange?: (phase: ConstitutionPhase) => void;
    constitutionSelectedMenuIdx?: number | null;
    onConstitutionSelectedMenuIdxChange?: (idx: number | null) => void;
    /** API 오행·체질 풀이 (체질 탭에서 사용) */
    sajuInfo?: SajuInfo | null;
    totalReview?: TotalReview | null;
    /** second(체질·웰스토리) API 로딩 중 → 체질 영역 로딩 UI */
    loadingConstitution?: boolean;
}

// Image 서버 URL은 config.ts에서 import

/** 한글 오행 라벨 */
const OHENG_LABELS: Record<keyof OhengCounts, string> = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };

/** API fiveElements(한글 키) → OhengCounts */
function fiveElementsToOheng(fe: Record<string, number> | undefined): OhengCounts | undefined {
    if (!fe || typeof fe !== "object") return undefined;
    return {
        wood: Number(fe["목"]) || 0,
        fire: Number(fe["화"]) || 0,
        earth: Number(fe["토"]) || 0,
        metal: Number(fe["금"]) || 0,
        water: Number(fe["수"]) || 0,
    };
}

/** 오행 조사: 목·금 → '이', 화·토·수 → '가' */
function ohengParticle(key: keyof OhengCounts): string {
    return key === "wood" || key === "metal" ? "이" : "가";
}
/** 오행 접속: 목·금 → '과', 화·토·수 → '와' */
function ohengConjunction(key: keyof OhengCounts): string {
    return key === "wood" || key === "metal" ? "과" : "와";
}

/** 오행 개수로 가장 많은/적은 오행 키와 체질 요약 문구 */
function getOhengHead(oheng: OhengCounts): { head: string; strongKey: keyof OhengCounts; weakKey: keyof OhengCounts } {
    const entries = (Object.entries(oheng) as [keyof OhengCounts, number][]).sort((a, b) => b[1] - a[1]);
    const strongKey = entries[0][0];
    const weakKey = entries[entries.length - 1][0];
    const top2 = entries.slice(0, 2).filter(([, v]) => v > 0);
    const label = (k: keyof OhengCounts) => OHENG_LABELS[k].replace(/\(.*\)/, "").trim();
    const head = top2.length >= 2 && top2[0][1] === top2[1][1]
        ? `${label(top2[0][0])}${ohengConjunction(top2[0][0])} ${label(top2[1][0])}${ohengParticle(top2[1][0])} 중심인 체질`
        : `${label(strongKey)}${ohengParticle(strongKey)} 중심인 체질`;
    return { head, strongKey, weakKey };
}

export const StatsAnalysis: React.FC<StatsAnalysisProps> = ({
    tab,
    images,
    futureImage = null,
    onFutureImageUpload,
    constitutionPhase: constitutionPhaseProp,
    onConstitutionPhaseChange,
    constitutionSelectedMenuIdx: constitutionSelectedMenuIdxProp,
    onConstitutionSelectedMenuIdxChange,
    sajuInfo = null,
    totalReview = null,
    loadingConstitution = false,
}) => {
    const [internalPhase, setInternalPhase] = useState<ConstitutionPhase>("intro");
    const [internalMenuIdx, setInternalMenuIdx] = useState<number | null>(null);

    const isControlled =
        onConstitutionPhaseChange !== undefined && onConstitutionSelectedMenuIdxChange !== undefined;

    const constitutionPhase = isControlled ? (constitutionPhaseProp ?? "intro") : internalPhase;
    const setConstitutionPhase = isControlled ? onConstitutionPhaseChange! : setInternalPhase;
    const selectedMenuIdx = isControlled ? (constitutionSelectedMenuIdxProp ?? null) : internalMenuIdx;
    const setSelectedMenuIdx = isControlled ? onConstitutionSelectedMenuIdxChange! : setInternalMenuIdx;

    const [selectedCampus, setSelectedCampus] = useState<Campus>("부울경");
    const futureFileInputRef = useRef<HTMLInputElement>(null);
    const futureCanvasRef = useRef<HTMLCanvasElement>(null);

    // 마운트 시점의 체질 phase (다른 탭 갔다가 복귀 시 마운트면 select/result일 수 있음)
    const initialConstitutionPhaseRef = useRef<ConstitutionPhase | null>(null);
    if (tab === "constitution" && initialConstitutionPhaseRef.current === null) {
        initialConstitutionPhaseRef.current = constitutionPhase;
    }

    // 체질 탭을 벗어날 때(다른 탭으로 전환) result였으면 true → 복귀 시에만 타입라이터 스킵
    const hasBeenOnResultViewRef = useRef(false);
    const prevTabRef = useRef(tab);
    useEffect(() => {
        if (prevTabRef.current === "constitution" && tab !== "constitution" && constitutionPhase === "result") {
            hasBeenOnResultViewRef.current = true;
        }
        prevTabRef.current = tab;
    }, [tab, constitutionPhase]);

    // 복귀 시에만 타입라이터 생략: (1) 마운트 시 이미 select/result였거나 (2) result 뷰를 이미 본 적 있음
    const isConstitutionReturning =
        isControlled &&
        (constitutionPhase === "result" || constitutionPhase === "select") &&
        (initialConstitutionPhaseRef.current === "result" ||
            initialConstitutionPhaseRef.current === "select" ||
            hasBeenOnResultViewRef.current);

    // API에서 받은 welstory 메뉴 또는 더미 메뉴 사용
    const welstoryMenus = useMemo(() => {
        const apiMenus = totalReview?.welstoryMenus;
        if (apiMenus && apiMenus.length > 0) {
            // API 메뉴를 프론트엔드 형식으로 변환
            return apiMenus.map((menu) => ({
                name: menu.name,
                desc: menu.desc || "",
                image: menu.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                reason: "", // API에서 reason은 recommendedMenu에만 있음
            }));
        }
        // 폴백: 더미 메뉴
        return CAMPUS_MENUS["부울경"];
    }, [totalReview?.welstoryMenus]);

    // API에서 받은 추천 메뉴 인덱스 또는 기본값
    const apiRecommendedIndex = totalReview?.recommendedMenu?.index ?? 0;
    const apiRecommendedReason = totalReview?.recommendedMenu?.reason ?? "";

    // 현재 사용할 메뉴 목록과 추천 메뉴
    const buulgyeongMenus = welstoryMenus;
    const recommendedMenuIndex = apiRecommendedIndex < buulgyeongMenus.length ? apiRecommendedIndex : 0;
    const recommendedMenu = buulgyeongMenus[recommendedMenuIndex];

    // 거북 도사 인트로 대사 (한 글자씩 타이핑)
    const introLine =
        "옛 선인들은 말했소. '약식동원(藥食同源)'이라고...\n\n음식과 약은 근본이 같고, 사람마다 타고난 체질이 다르다는 뜻이오.\n\n지금부터 당신의 체질에 맞는 오늘의 식단을 찾으러 가보지 않겠소?";
    const { text: introText, isComplete: introTextComplete } = useTypewriter(introLine, {
        enabled: constitutionPhase === "intro",
        speedMs: 60,
        skipToEnd: isConstitutionReturning,
    });

    // 메뉴 선택 단계 멘트 타이핑
    const selectLine = "오늘의 싸밥, 무엇을 먹을지……\n네 마음이 끌리는 것을 하나 골라 보거라.";
    const { text: selectText } = useTypewriter(selectLine, {
        enabled: constitutionPhase === "select",
        speedMs: 60,
        skipToEnd: isConstitutionReturning,
    });

    // 결과 단계 거북 도사 긴 대사 (동적 메시지)
    // API에서 받은 reason 또는 더미 reason 사용
    const recommendedReason = apiRecommendedReason || recommendedMenu.reason || "오늘의 체질에 맞는 메뉴입니다.";
    const resultTurtleMessage =
        constitutionPhase === "result" && selectedMenuIdx !== null
            ? (() => {
                  const userPickedMenu = buulgyeongMenus[selectedMenuIdx];
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

    // 결과 단계 진입 시 거북 도사 대사 카드를 화면 중앙으로 스크롤
    const turtleMessageCardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (constitutionPhase === "result" && selectedMenuIdx !== null && turtleMessageCardRef.current) {
            const t = setTimeout(() => {
                turtleMessageCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            return () => clearTimeout(t);
        }
    }, [constitutionPhase, selectedMenuIdx]);

    // 미래 이미지 생성 관련 상태
    const [futureImages, setFutureImages] = useState<FutureImages>({
        current: null,
        year_10: null,
        year_30: null,
        year_50: null
    });
    const [isGenerating, setIsGenerating] = useState(false); // TODO: 테스트 후 false로 되돌리기
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    const handleFutureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 미리보기용 이미지 설정
        const reader = new FileReader();
        reader.onloadend = () => {
            if (onFutureImageUpload) {
                onFutureImageUpload(reader.result as string);
            }
        };
        reader.readAsDataURL(file);

        // FastAPI 서버에 미래 이미지 생성 요청
        setIsGenerating(true);
        setGenerateError(null);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("model", "gemini-2.5-flash-image");

            const response = await fetch(API_ENDPOINTS.IMAGE_UPLOAD, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setFutureImages({
                    current: data.current?.data_uri || null,
                    year_10: data.year_10?.data_uri || null,
                    year_30: data.year_30?.data_uri || null,
                    year_50: data.year_50?.data_uri || null,
                });
            } else {
                throw new Error(data.message || "이미지 생성 실패");
            }
        } catch (error) {
            console.error("미래 이미지 생성 오류:", error);
            setGenerateError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    // 미래 이미지 초기화
    const handleResetFutureImages = () => {
        setFutureImages({
            current: null,
            year_10: null,
            year_30: null,
            year_50: null
        });
        setGenerateError(null);
        if (onFutureImageUpload) {
            onFutureImageUpload(null);
        }
    };

    const handleDownload = () => {
        if (!futureCanvasRef.current) {
            alert("이미지를 생성할 수 없습니다.");
            return;
        }

        if (!isCanvasReady) {
            alert("이미지가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        try {
            const canvas = futureCanvasRef.current;
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error("Canvas blob 생성 실패");
                    alert("이미지 저장에 실패했습니다.");
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `미래의나_${new Date().getTime()}.png`;
                link.href = url;
                link.click();
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, "image/png", 1.0);
        } catch (error) {
            console.error("이미지 저장 오류:", error);
            alert("이미지 저장에 실패했습니다.");
        }
    };

    // Canvas에 프레임과 이미지 그리기 (프레임 크기 = 콘텐츠 높이 + 하단 20px)
    useEffect(() => {
        if (tab !== "future" || !futureCanvasRef.current || !futureImage) return;

        const canvas = futureCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const paddingTop = 28;
        const gap = 12;
        const paddingLeft = 24;
        const logoPadding = 32; // 로고 상하 패딩

        const loadAndDrawImages = async () => {
            const imagePromises: Promise<HTMLImageElement>[] = [];
            const futureImageList = [
                futureImage,
                futureImages.year_10 || futureImage,
                futureImages.year_30 || futureImage,
                futureImages.year_50 || futureImage,
            ];

            const photoImages: (HTMLImageElement | null)[] = [];
            for (let i = 0; i < 4; i++) {
                const imgSrc = futureImageList[i];
                if (imgSrc) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    const photoPromise = new Promise<HTMLImageElement>((resolve, reject) => {
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = imgSrc;
                    });
                    imagePromises.push(photoPromise);
                    photoImages[i] = img;
                } else {
                    photoImages[i] = null;
                }
            }

            await Promise.all(imagePromises);

            // 첫 번째 이미지 기준 가용 너비 (원본 크기 활용, 최대 600)
            const firstImg = photoImages[0];
            const imageWidth = firstImg
                ? Math.min(firstImg.width, 600)
                : 500;

            // 각 슬롯 높이 = 이미지 비율 유지
            const slotHeights: number[] = [];
            for (let i = 0; i < 4; i++) {
                const img = photoImages[i];
                if (img) {
                    slotHeights[i] = Math.round((imageWidth * img.height) / img.width);
                } else {
                    slotHeights[i] = Math.round(imageWidth * 0.68); // fallback 비율
                }
            }

            const targetWidth = imageWidth + paddingLeft * 2;
            // 로고 너비: 기존 기준의 50%
            const logoDisplayWidth = (targetWidth - 120) * 0.7;
            const totalContentHeight =
                paddingTop +
                slotHeights[0] + gap + slotHeights[1] + gap + slotHeights[2] + gap + slotHeights[3] +
                Math.round((logoDisplayWidth * 93) / 272) + logoPadding * 2;
            const targetHeight = totalContentHeight;

            // 고해상도 렌더링 (로고·전체 선명도) — SVG가 캔버스에 그려질 때 픽셀 깨짐 방지
            const dpr = Math.max(2, window.devicePixelRatio || 2);
            canvas.width = targetWidth * dpr;
            canvas.height = targetHeight * dpr;
            // 표시 크기: 넓이만 360px, 높이는 비율에 맞춰 자동 계산
            canvas.style.width = "360px";
            canvas.style.height = `${360 * (targetHeight / targetWidth)}px`;
            ctx.scale(dpr, dpr);

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            let y = paddingTop;
            for (let i = 0; i < 4; i++) {
                const img = photoImages[i];
                const slotHeight = slotHeights[i];
                if (img) {
                    const x = paddingLeft;
                    const imgAspect = img.width / img.height;
                    const slotAspect = imageWidth / slotHeight;

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, imageWidth, slotHeight);
                    ctx.clip();

                    let drawWidth = imageWidth;
                    let drawHeight = slotHeight;
                    let drawX = x;
                    let drawY = y;

                    if (imgAspect > slotAspect) {
                        drawHeight = slotHeight;
                        drawWidth = drawHeight * imgAspect;
                        drawX = x - (drawWidth - imageWidth) / 2;
                    } else {
                        drawWidth = imageWidth;
                        drawHeight = drawWidth / imgAspect;
                        drawY = y - (drawHeight - slotHeight) / 2;
                    }

                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    ctx.restore();
                }
                y += slotHeight + gap;
            }

            // 프레임 로고 (future_film_logo.svg)
            const logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.src = typeof futureFilmLogoSrc === "string" ? futureFilmLogoSrc : (futureFilmLogoSrc as { default?: string })?.default ?? "";
            await new Promise<void>((resolve, reject) => {
                logoImg.onload = () => resolve();
                logoImg.onerror = () => reject(new Error("Logo load failed"));
            });
            const logoX = (targetWidth - logoDisplayWidth) / 2;
            const logoH = logoDisplayWidth * (logoImg.naturalHeight / logoImg.naturalWidth);
            ctx.drawImage(logoImg, logoX, targetHeight - logoPadding - logoH, logoDisplayWidth, logoH);

            setIsCanvasReady(true);
        };

        loadAndDrawImages().catch((error) => {
            console.error("이미지 로드 오류:", error);
            setIsCanvasReady(false);
        });
    }, [tab, futureImage, futureImages]);

    if (tab === "constitution") {
        const constitutionBlockEarly = totalReview && (
            (totalReview as Record<string, string>)["total_user_saju_information"] ??
            totalReview.constitutionSummary
        );
        if (loadingConstitution && sajuInfo && !constitutionBlockEarly) {
            return (
                <div className="relative min-h-[60vh] flex items-center justify-center px-4">
                    <GlassCard className="w-full max-w-2xl p-8 sm:p-10 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-gray-500 text-sm">체질·웰스토리 분석 중입니다...</p>
                        </div>
                    </GlassCard>
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

                {/* 메뉴 선택: 거북 도사 대화박스 + 부울경 4개 메뉴 */}
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
                                        {selectText.length < selectLine.length && <span className="animate-pulse">|</span>}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            {buulgyeongMenus.map((menu, i) => (
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

                {/* 결과: 위쪽 메뉴 카드 → 중앙 거북 도사 대사 → 체질 풀이 */}
                {constitutionPhase === "result" && selectedMenuIdx !== null && (
                    <div className="space-y-10">
                        {/* 4개 메뉴 카드 (상단에 고정해 두고, 스크롤 시 위쪽에 보이도록) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            {buulgyeongMenus.map((menu, i) => {
                                const isUserChoice = i === selectedMenuIdx;
                                const isTurtleRecommend = i === recommendedMenuIndex;
                                return (
                                    <div key={i} className="relative">
                                        <GlassCard
                                            className={`
                                                p-4 flex flex-col items-center text-center rounded-[32px] border-4 shadow-clay-sm overflow-hidden
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

                        {/* 거북 도사 대사 (한 글자씩 타이핑) — 스크롤 시 화면 중앙에 오도록 ref */}
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

                        {/* 체질 풀이 — API에서 받은 sajuInfo·totalReview로 오행 분포·체질 풀이 표시 (API 없으면 안내만) */}
                        {(() => {
                            const ohengFromApi = sajuInfo ? fiveElementsToOheng(sajuInfo.fiveElements) : null;
                            const oheng: OhengCounts = ohengFromApi ?? { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
                            const constitutionBlock = totalReview && (
                                (totalReview as Record<string, string>)["total_user_saju_information"] ??
                                totalReview.constitutionSummary
                            );
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
                            {/* 사주 있지만 체질 데이터 아직 로딩 중 (2차 API 대기) 또는 loadingConstitution 플래그 */}
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
                            const constitutionData: ConstitutionSajuData = constitutionBlock
                                ? {
                                      type: head,
                                      head,
                                      oheng,
                                      sections: [{ text: constitutionBlock }],
                                      daeunAndFoods: {
                                          title: "건강 관리를 위해 꼭 챙기면 좋은 것들",
                                          body: "",
                                          priorityFoods: [],
                                      },
                                  }
                                : {
                                      ...CONSTITUTION_SAJU_DATA,
                                      oheng,
                                      head,
                                      type: head,
                                  };
                            return <ConstitutionSajuBlock data={constitutionData} />;
                        })()}
                    </div>
                )}

                {/* constitution phase: 인트로/싸밥 추천 없이 바로 체질 풀이만 표시 (공유 페이지용) */}
                {constitutionPhase === "constitution" && (
                    <div className="space-y-6">
                        {(() => {
                            const ohengFromApi = sajuInfo ? fiveElementsToOheng(sajuInfo.fiveElements) : null;
                            const oheng: OhengCounts = ohengFromApi ?? CONSTITUTION_SAJU_DATA.oheng;
                            const constitutionBlock = totalReview && (
                                (totalReview as Record<string, string>)["total_user_saju_information"] ??
                                totalReview.constitutionSummary
                            );
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
                            // 데이터가 없는 경우에도 기본 체질 풀이 표시
                            const constitutionData: ConstitutionSajuData = constitutionBlock
                                ? {
                                      type: head,
                                      head,
                                      oheng,
                                      sections: [{ text: constitutionBlock }],
                                      daeunAndFoods: {
                                          title: "건강 관리를 위해 꼭 챙기면 좋은 것들",
                                          body: "",
                                          priorityFoods: [],
                                      },
                                  }
                                : {
                                      ...CONSTITUTION_SAJU_DATA,
                                      oheng,
                                      head,
                                      type: head,
                                  };
                            return <ConstitutionSajuBlock data={constitutionData} />;
                        })()}
                    </div>
                )}
            </div>
        );
    }

    if (tab === "future") {
        return (
            <div className="flex flex-col items-center">
                {!futureImage ? (
                    <div className="max-w-2xl w-full">
                        <GlassCard className="p-12 border-8 border-white rounded-[48px] shadow-clay-lg bg-white/60 flex flex-col items-center text-center">
                            <button 
                                onClick={() => futureFileInputRef.current?.click()}
                                className="relative group mb-8"
                            >
                                <div className="absolute -inset-4 bg-brand-orange/20 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                                <div className="w-28 h-28 bg-white rounded-[32px] flex flex-col items-center justify-center text-brand-orange shadow-clay-md border-4 border-orange-50 group-hover:border-brand-orange/30 transition-all duration-300 relative overflow-hidden group-hover:shadow-clay-lg group-hover:-translate-y-1 active:translate-y-0 active:shadow-clay-sm">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Upload size={40} className="group-hover:scale-110 transition-transform duration-300" />
                                    <span className="text-[10px] font-bold mt-1 text-brand-orange/60 group-hover:text-brand-orange transition-colors">UPLOAD</span>
                                </div>
                            </button>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2 font-display">미래의 모습을 확인해볼까요?</h4>
                            <p className="text-sm text-brand-orange font-bold mb-8 flex items-center gap-1.5 justify-center bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 shadow-sm">
                                <Sparkles size={14} className="animate-pulse" />
                                10년부터 50년 후 까지의 미래를 그려드립니다
                            </p>
                            
                            {/* Compact Guidance with Examples - Horizontal Layout */}
                            <div className="bg-gray-50/40 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row items-center gap-6 mb-2 w-full max-w-xl">
                                <div className="flex gap-4 shrink-0">
                                    {/* Recommended Example */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-green-200 flex flex-col items-center justify-center overflow-hidden p-0.5">
                                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-green rounded-full flex items-center justify-center z-10 shadow-sm">
                                                <CheckCircle2 size={7} className="text-white" />
                                            </div>
                                            <img 
                                                src={profileImage} 
                                                alt="권장 예시" 
                                                className="w-[95%] h-[95%] object-contain rounded-md"
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-brand-green">여권/증명</span>
                                    </div>

                                    {/* Not Good Example */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-red-100 flex items-center justify-center overflow-hidden p-0.5">
                                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                                                <X size={7} className="text-white" strokeWidth={3} />
                                            </div>
                                            <img 
                                                src={selfieImage} 
                                                alt="잘못된 예시" 
                                                className="w-[95%] h-[95%] object-contain rounded-md opacity-60 grayscale blur-[0.5px]"
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-red-400">잘못된 예시</span>
                                    </div>
                                </div>

                                {/* Running Text Guidance */}
                                <div className="flex-1 text-left space-y-1.5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <p className="text-[12px] text-gray-700 leading-relaxed break-keep">
                                        정확한 관상 분석을 위해 <span className="text-brand-green font-bold">여권 사진이나 증명사진</span>처럼 이목구비가 뚜렷하게 나온 정면 사진을 업로드해 주세요. 배경이 깨끗하고 밝은 곳에서 촬영된 사진이 가장 좋습니다.
                                    </p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed break-keep">
                                        다만, 흐릿한 저화질 사진이나 얼굴 일부가 가려진 사진, 조명이 너무 어두운 야외 사진은 인식이 원활하지 않을 수 있으니 주의해 주세요.
                                    </p>
                                </div>
                            </div>
                            
                            <input
                                type="file"
                                ref={futureFileInputRef}
                                onChange={handleFutureImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </GlassCard>
                    </div>
                ) : isGenerating ? (
                    /* 로딩 상태 UI - 시계바늘 회전 연출 */
                    <div className="max-w-2xl w-full">
                        <GlassCard className="p-12 border-8 border-white rounded-[48px] shadow-clay-lg bg-white/60 flex flex-col items-center text-center">
                            {/* 시계 애니메이션 */}
                            <div className="relative mb-8">
                                {/* 시계 외곽 */}
                                <div className="w-36 h-36 rounded-full bg-white border-4 border-brand-orange/30 shadow-clay-md flex items-center justify-center relative">
                                    {/* 시계 눈금 */}
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-1 h-3 bg-gray-300 rounded-full"
                                            style={{
                                                transform: `rotate(${i * 30}deg) translateY(-60px)`,
                                                transformOrigin: 'center center',
                                            }}
                                        />
                                    ))}
                                    {/* 시계 중심점 */}
                                    <div className="absolute w-3 h-3 bg-brand-orange rounded-full z-20 shadow-sm" />
                                    {/* 시침 (느리게 회전) */}
                                    <div
                                        className="absolute w-1.5 h-10 bg-gray-600 rounded-full origin-bottom animate-spin"
                                        style={{
                                            animationDuration: '12s',
                                            animationTimingFunction: 'linear',
                                            bottom: '50%',
                                        }}
                                    />
                                    {/* 분침 (빠르게 회전) */}
                                    <div
                                        className="absolute w-1 h-14 bg-brand-orange rounded-full origin-bottom animate-spin"
                                        style={{
                                            animationDuration: '2s',
                                            animationTimingFunction: 'linear',
                                            bottom: '50%',
                                        }}
                                    />
                                    {/* 초침 (가장 빠르게 회전) */}
                                    <div
                                        className="absolute w-0.5 h-14 bg-red-500 rounded-full origin-bottom animate-spin"
                                        style={{
                                            animationDuration: '1s',
                                            animationTimingFunction: 'linear',
                                            bottom: '50%',
                                        }}
                                    />
                                </div>
                                {/* 시간 흐름 효과 */}
                                <div className="absolute -inset-4 rounded-full border-2 border-dashed border-brand-orange/20 animate-spin" style={{ animationDuration: '8s' }} />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2 font-display">시간을 달려가는 중...</h4>
                            <p className="text-sm text-gray-500 mb-4">AI가 당신의 10년, 30년, 50년 후 모습을 상상하고 있습니다.</p>
                            {/* 연도 표시 애니메이션 */}
                            <div className="flex items-center gap-3 text-sm font-bold">
                                <span className="text-gray-400">현재</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-brand-orange/60 animate-pulse">+10년</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-brand-orange/40 animate-pulse" style={{ animationDelay: '0.3s' }}>+30년</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-brand-orange/20 animate-pulse" style={{ animationDelay: '0.6s' }}>+50년</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-6">이미지 생성에 1~2분 정도 소요될 수 있습니다.</p>
                        </GlassCard>
                    </div>
                ) : generateError ? (
                    /* 에러 상태 UI */
                    <div className="max-w-2xl w-full">
                        <GlassCard className="p-12 border-8 border-white rounded-[48px] shadow-clay-lg bg-white/60 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <X size={40} className="text-red-500" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2 font-display">이미지 생성에 실패했습니다</h4>
                            <p className="text-sm text-red-500 mb-6">{generateError}</p>
                            <ActionButton variant="secondary" onClick={handleResetFutureImages} className="flex items-center gap-2">
                                <Upload size={18} /> 다시 시도하기
                            </ActionButton>
                        </GlassCard>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {/* Photo Strip Frame - Canvas로 변경 */}
                        <div className="flex flex-col gap-6">
                            {/* Canvas로 프레임과 이미지 렌더링 */}
                            <canvas
                                ref={futureCanvasRef}
                                style={{ width: "360px" }}
                            />
                            <ActionButton
                                variant="secondary"
                                onClick={handleDownload}
                                disabled={!isCanvasReady}
                                className="flex items-center gap-2 bg-white"
                            >
                                <Download size={20} />
                                사진 저장하기
                            </ActionButton>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};
