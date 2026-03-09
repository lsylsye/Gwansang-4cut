import React, { useState, useEffect } from "react";
import { devLog } from "@/utils/logger";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/display/hover-card";
import { Sparkles, X, ChevronDown, Loader2 } from "lucide-react";

// --- Types ---
/** 부위별 feature 블록 (coreMeaning 있으면 전용 블록 렌더) */
interface FeatureBlock {
    coreMeaning?: unknown;
    [key: string]: unknown;
}

interface FaceAnalysisProps {
    image: string;
    scores?: unknown[];
    features: Record<string, unknown>;
    totalReview?: TotalReview; // 거북 도사의 총평 데이터 (백엔드에서 받아옴)
    /** first-remaining(인생회고·방향성·만남) 로딩 중일 때 해당 블록에 스피너 표시 */
    loadingRemaining?: boolean;
}

// 거북 도사의 총평: 2가지 구성
// 1. 관상+사주 종합 총평 (이 사람은 어떤 사람인가)
// 2. 취업운
interface TotalReview {
    faceOverview?: string; // 총평 (관상+사주)
    careerFortune?: string; // 2번 블록: 당신의 앞으로의 길, 같이 고민해보지 않겠소?
    lifeReview?: string; // 1번 블록: 지금까지 당신이 걸어온 길
    meetingCompatibility?: string; // 3번 블록: 그대에게 맞는 사람, 조심할 연애
}

// 백엔드 응답이 없을 때 표시할 기본 예시 데이터
const DEFAULT_TOTAL_REVIEW: TotalReview = {
    faceOverview: "시작은 누구보다 빠르지만 마무리에 약한 사람이오.\n\n큰 눈에 담긴 감수성과 타고난 열정이 만나니, 사람을 처음 만나면 금세 마음을 여는 편이나 그만큼 쉽게 지치기도 하오. 코에서 드러나는 신중함이 이를 잡아주니, 한 템포 늦추면 오히려 그대의 강점이 빛나리라.",
    careerFortune: "올해는 취업운이 상승하는 시기이오. 관상에서 보이는 안정적인 이마와 균형 잡힌 눈은 면접에서 신뢰감을 주는 인상이오. 사주의 오행 분포를 보면, 기획·분석·관리 분야에서 두각을 나타낼 수 있으며, 상반기보다 하반기에 더 좋은 기회가 올 가능성이 높소.",
    lifeReview: "",
    meetingCompatibility: ""
};

// highlightIndex: 0=얼굴형(공통·얼굴형), 1=이마, 2=눈, 3=코, 4=입, 5=턱
const HIGHLIGHT_ORDER = 6;
const HIGHLIGHT_DURATION_MS = 2800;

/** 오형이란? 호버 카드에 표시할 설명 (하드코딩) */
const OHEUNG_INFO = (
    <div className="text-left text-sm text-gray-700 space-y-3 max-w-[320px]">
        <p className="font-semibold text-gray-800">오형이란?</p>
        <p>
            얼굴의 &apos;모양&apos;이 아니라, 얼굴에서 가장 강하게 드러나는 <strong>기운의 방향</strong>이오.
            어디가 눈에 들어오는가, 얼굴의 힘이 어디로 흐르는가가 오형이오.
        </p>
        <table className="w-full text-xs border-collapse">
            <thead>
                <tr className="border-b border-gray-200">
                    <th className="py-1 pr-2 text-left font-semibold">오형</th>
                    <th className="py-1 pr-2 text-left font-semibold">핵심 인상</th>
                    <th className="py-1 text-left font-semibold">한마디</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-gray-100"><td className="py-1 pr-2">목형</td><td className="py-1 pr-2">위로 뻗는다</td><td className="py-1">성장</td></tr>
                <tr className="border-b border-gray-100"><td className="py-1 pr-2">화형</td><td className="py-1 pr-2">위가 강하다</td><td className="py-1">발산</td></tr>
                <tr className="border-b border-gray-100"><td className="py-1 pr-2">토형</td><td className="py-1 pr-2">가운데가 단단</td><td className="py-1">안정</td></tr>
                <tr className="border-b border-gray-100"><td className="py-1 pr-2">금형</td><td className="py-1 pr-2">옆으로 퍼진다</td><td className="py-1">표출</td></tr>
                <tr className="border-b border-gray-100"><td className="py-1 pr-2">수형</td><td className="py-1 pr-2">아래로 모인다</td><td className="py-1">저장</td></tr>
            </tbody>
        </table>
        <p className="text-gray-600">
            하나만 나오는 얼굴은 드물고, 대부분 주형+부형으로 조합되어 그 사람의 성격과 운의 방향을 나타내오.
        </p>
    </div>
);

// --- 3개 블록 아코디언 (상세 자리: 삶 / 방향성 / 만남) ---
interface ThreeBlocksAccordionProps {
    totalReview?: TotalReview | null;
    defaultTotalReview: TotalReview;
    loadingRemaining?: boolean;
}

const BLOCK_TITLES: Record<1 | 2 | 3, string> = {
    1: "지금까지 당신이 걸어온 길",
    2: "당신의 앞으로의 길, 같이 고민해보지 않겠소?",
    3: "그대에게 맞는 사람, 조심할 연애",
};

function ThreeBlocksAccordion({ totalReview, defaultTotalReview, loadingRemaining }: ThreeBlocksAccordionProps) {
    const [expanded, setExpanded] = useState<Set<1 | 2 | 3>>(new Set());

    const toggle = (id: 1 | 2 | 3) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // 로딩 여부는 실제 API 응답(totalReview)만으로 판단. default 더미는 로딩 시 표시하지 않음
    const hasLifeReview = Boolean(totalReview?.lifeReview?.trim());
    const hasCareerFortune = Boolean(totalReview?.careerFortune?.trim());
    const hasMeeting = Boolean(totalReview?.meetingCompatibility?.trim());
    const showLoading1 = loadingRemaining && !hasLifeReview;
    const showLoading2 = loadingRemaining && !hasCareerFortune;
    const showLoading3 = loadingRemaining && !hasMeeting;

    const lifeReviewText = totalReview?.lifeReview ?? defaultTotalReview.lifeReview ?? "";
    const careerText = totalReview?.careerFortune ?? defaultTotalReview.careerFortune ?? "";
    const meetingText = totalReview?.meetingCompatibility ?? defaultTotalReview.meetingCompatibility ?? "";

    return (
        <div className="space-y-2">
            {([1, 2, 3] as const).map((id) => {
                const isOpen = expanded.has(id);
                return (
                    <div
                        key={id}
                        className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => toggle(id)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-bold text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-sm sm:text-base">{BLOCK_TITLES[id]}</span>
                            <ChevronDown
                                className={`w-5 h-5 flex-shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 pt-1 border-t border-gray-200/80">
                                        {id === 1 && (
                                            <>
                                                {showLoading1 ? (
                                                    <div className="flex items-center gap-2 py-4 text-gray-500">
                                                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                                                        <span className="text-sm">풀이를 생성하고 있오...</span>
                                                    </div>
                                                ) : hasLifeReview ? (
                                                    <div className="text-gray-700 text-base leading-[1.75] max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 [&_strong]:font-bold [&_strong]:text-gray-800">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ children }) => <p>{children}</p>,
                                                                strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                                                            }}
                                                        >
                                                            {lifeReviewText.trim()}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">준비 중이오. 곧 풀이를 채워 넣으리라.</p>
                                                )}
                                            </>
                                        )}
                                        {id === 2 && (
                                            <>
                                                {showLoading2 ? (
                                                    <div className="flex items-center gap-2 py-4 text-gray-500">
                                                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                                                        <span className="text-sm">풀이를 생성하고 있오...</span>
                                                    </div>
                                                ) : hasCareerFortune ? (
                                                    <div className="text-gray-700 text-base leading-[1.75] max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 [&_strong]:font-bold [&_strong]:text-gray-800">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ children }) => <p>{children}</p>,
                                                                strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                                                            }}
                                                        >
                                                            {careerText.trim()}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">준비 중이오. 곧 풀이를 채워 넣으리라.</p>
                                                )}
                                            </>
                                        )}
                                        {id === 3 && (
                                            <>
                                                {showLoading3 ? (
                                                    <div className="flex items-center gap-2 py-4 text-gray-500">
                                                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                                                        <span className="text-sm">풀이를 생성하고 있오...</span>
                                                    </div>
                                                ) : hasMeeting ? (
                                                    <div className="text-gray-700 text-base leading-[1.75] max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 [&_strong]:font-bold [&_strong]:text-gray-800">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ children }) => <p>{children}</p>,
                                                                strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                                                            }}
                                                        >
                                                            {meetingText.trim()}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">준비 중이오. 곧 풀이를 채워 넣으리라.</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

export const FaceAnalysis: React.FC<FaceAnalysisProps> = ({ image, scores, features, totalReview, loadingRemaining }) => {
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [highlightIndex, setHighlightIndex] = useState(0);

    // 디버깅용 로그
    useEffect(() => {
        devLog("🎭 FaceAnalysis 렌더링");
        devLog("  - features:", features);
        devLog("  - totalReview:", totalReview);
    }, [features, totalReview]);

    // 순차 하이라이트: 아무 것도 선택되지 않았을 때만 부위를 바꿔 가며 테두리 빛 표시
    useEffect(() => {
        if (activeFeature !== null) return;
        const id = setInterval(() => {
            setHighlightIndex((i) => (i + 1) % HIGHLIGHT_ORDER);
        }, HIGHLIGHT_DURATION_MS);
        return () => clearInterval(id);
    }, [activeFeature]);

    const FEATURE_LABELS: Record<string, string> = {
        commonAndFaceShape: "공통·얼굴형",
        forehead: "이마",
        eyes: "눈",
        nose: "코",
        mouth: "입",
        chin: "턱/하관",
    };

    /** 범위 게이지: value가 어느 구간(segment)에 해당하는지 시각화 */
    const renderRangeGauge = (
        g: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] },
        customLabel?: string
    ) => {
        const { value, rangeMin, rangeMax, unit = "", segments } = g;
        const span = rangeMax - rangeMin || 1;
        const pctRaw = Math.max(0, Math.min(100, ((value - rangeMin) / span) * 100));
        const pct = 6 + (94 - 6) * (pctRaw / 100);

        type Seg = { label: string; segMin: number; segMax: number };
        const resolved: Seg[] = segments.map((s, i) => {
            const segMin = s.min ?? (i === 0 ? rangeMin : (segments[i - 1].max ?? rangeMin));
            const segMax = s.max ?? (i === segments.length - 1 ? rangeMax : (segments[i + 1].min ?? rangeMax));
            return { label: s.label, segMin, segMax };
        });
        const activeIdx = resolved.findIndex((r) => value >= r.segMin && value < r.segMax);
        const formatVal = (v: number) => (Math.abs(v) < 0.01 && v !== 0 ? v.toFixed(4) : v % 1 === 0 ? String(v) : v.toFixed(2));

        return (
            <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50/50 overflow-visible">
                <p className="text-gray-700 font-semibold mb-2 text-[19px]">{customLabel ?? "범위 게이지"}</p>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[17px] bg-white">
                    {resolved.map((r, i) => (
                        <div
                            key={i}
                            className={`py-2.5 text-center font-medium min-w-0 ${i === activeIdx ? "bg-brand-green/25 text-brand-green border-l-2 border-brand-green" : "bg-gray-100 text-gray-500"}`}
                            style={{ flex: Math.max(0.15, (r.segMax - r.segMin) / span) }}
                        >
                            {r.label}
                            {i === activeIdx && (
                                <span className="block text-lg mt-0.5 font-bold">{formatVal(value)}{unit}</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="relative h-3 mt-2 bg-gray-200 rounded-full overflow-visible">
                    <div className="absolute inset-y-0 left-0 flex rounded-full overflow-hidden" style={{ width: "100%" }}>
                        {resolved.map((r, i) => (
                            <div
                                key={i}
                                className="h-full"
                                style={{ width: `${((r.segMax - r.segMin) / span) * 100}%`, backgroundColor: i === activeIdx ? "rgba(0,137,123,0.35)" : "rgba(0,0,0,0.06)" }}
                            />
                        ))}
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-green border-2 border-white shadow" style={{ left: `${pct}%`, marginLeft: "-10px" }} />
                </div>
                <div className="mt-2 flex min-w-0 text-[15px] text-gray-600">
                    {resolved.map((r, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 text-center min-w-0 px-0.5"
                            style={{ flex: Math.max(0.15, (r.segMax - r.segMin) / span) }}
                        >
                            {formatVal(r.segMin)}{unit} ~ {formatVal(r.segMax)}{unit}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /** 파트별 블록: 파트명 + (라벨: 측정값) + 핵심의미 + 조언. measureEntries로 라벨과 키 지정 */
    type PartSpec = { partName: string; measureKeys?: string[]; measureLabels?: Record<string, string> };
    const renderPartBlocks = (
        f: {
            measures?: Record<string, string>;
            coreMeaningParts?: string[];
            adviceParts?: string[];
        },
        partSpecs: PartSpec[]
    ) => {
        if (!f?.coreMeaningParts?.length) return null;
        const parts = f.coreMeaningParts;
        const adviceParts = f.adviceParts ?? [];
        const measures = f.measures ?? {};
        return (
            <div className="space-y-5">
                {partSpecs.map((spec, i) => {
                    const core = parts[i];
                    const advice = adviceParts[i];
                    if (!core && !advice) return null;
                    const entries = (spec.measureKeys ?? []).map((k) => {
                        const v = (measures as Record<string, string>)[k];
                        return v != null && v !== "" ? { label: (spec.measureLabels ?? {})[k] ?? k, value: v } : null;
                    }).filter(Boolean) as { label: string; value: string }[];
                    return (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white space-y-2">
                            <h5 className="font-semibold text-gray-800 text-lg">{spec.partName}</h5>
                            {entries.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {entries.map((e, j) => (
                                        <span key={j} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[15px]">
                                            <span className="text-gray-500">{e.label}:</span> {e.value}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {core && <p className="text-gray-700 text-base leading-relaxed">{core}</p>}
                            {advice && (
                                <p className="text-gray-600 text-[15px] leading-relaxed border-l-2 border-brand-green/30 pl-3">
                                    💡 {advice}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    /** 한 블록(forehead, eyes, nose, mouth, chin) 렌더 — 게이지 + 핵심의미 (측정 데이터 섹션 없음) */
    const renderBlock = (
        f: { title?: string; values?: string; criteria?: string; gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] }; interpretation?: string } | undefined
    ) => {
        if (!f) return null;
        return (
            <div className="space-y-5 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">{f.title}</h4>
                {f.gauge && renderRangeGauge(f.gauge, "범위 게이지")}
                {f.interpretation != null && f.interpretation !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 핵심 의미</h5>
                        <p className="text-gray-700">{f.interpretation}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 이마 전용: 게이지 먼저, 그 아래 파트 블록(세로 비중·이마 폭·좌우 대칭). 측정 키는 백엔드 반환값(U1~U3, R_F1~R_F3, F_width, R_FW, Asym, dominant) 및 API 호환(heightRatio 등) 모두 수용 */
    const foreheadPartSpecs: PartSpec[] = [
        { partName: "세로 비중", measureKeys: ["R_F1", "R_F2", "R_F3", "dominant", "heightRatio"], measureLabels: { R_F1: "상부 비율", R_F2: "중앙 비율", R_F3: "하부 비율", dominant: "우세 구간", heightRatio: "얼굴 대비 이마 높이 비율" } },
        { partName: "이마 폭", measureKeys: ["F_width", "R_FW", "width", "widthRatio"], measureLabels: { F_width: "이마 폭", R_FW: "얼굴 대비 이마 폭 비율", width: "이마 폭", widthRatio: "얼굴 대비 이마 폭 비율" } },
        { partName: "좌우 대칭", measureKeys: ["Asym"], measureLabels: { Asym: "좌우 비대칭도" } },
    ];
    const renderForeheadBlock = (f: {
        measures?: Record<string, string> & { height?: string; heightRatio?: string; width?: string; widthRatio?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
        coreMeaningParts?: string[];
        adviceParts?: string[];
    } | undefined) => {
        if (!f) return null;
        const useParts = (f as { coreMeaningParts?: string[] }).coreMeaningParts?.length;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🧠 이마 분석 · 사고력과 초년운</h4>

                {f.gauge && renderRangeGauge(f.gauge, "🧭 이마 높이 게이지 (초년운·사고력)")}

                {useParts ? renderPartBlocks(f, foreheadPartSpecs) : (
                    <>
                        {f.coreMeaning && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 이마가 말해주는 핵심 의미</h5>
                                <p className="text-gray-700">{f.coreMeaning}</p>
                            </section>
                        )}
                        {f.advice && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 조언</h5>
                                <p className="text-gray-700">{f.advice}</p>
                            </section>
                        )}
                    </>
                )}
            </div>
        );
    };

    /** 눈 전용: 게이지 먼저, 그 아래 파트 블록(개방도·비대칭·눈 사이) 또는 통합 핵심의미/조언 */
    const eyesPartSpecs: PartSpec[] = [
        { partName: "개방도", measureKeys: ["openL", "openR"], measureLabels: { openL: "좌측 눈 개방도", openR: "우측 눈 개방도" } },
        { partName: "비대칭", measureKeys: ["asymmetry", "asymmetryCriteria"], measureLabels: { asymmetry: "개방도 차이", asymmetryCriteria: "눈 비대칭 기준" } },
        { partName: "눈 사이", measureKeys: ["interDist"], measureLabels: { interDist: "눈 사이 거리" } },
    ];
    const renderEyesBlock = (f: {
        measures?: { openL?: string; openR?: string; asymmetry?: string; asymmetryCriteria?: string; interDist?: string; widthRatio?: string; symmetry?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
        coreMeaningParts?: string[];
        adviceParts?: string[];
    } | undefined) => {
        if (!f) return null;
        const useParts = (f as { coreMeaningParts?: string[] }).coreMeaningParts?.length;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">👁 눈 분석 · 성격 · 직업운 · 관계 감각</h4>

                {f.gauge && renderRangeGauge(f.gauge, "⚖️ 좌·우 눈 균형 게이지 (성향 안정도)")}

                {useParts ? renderPartBlocks(f, eyesPartSpecs) : (
                    <>
                        {f.coreMeaning && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 눈이 말해주는 핵심 의미</h5>
                                <p className="text-gray-700">{f.coreMeaning}</p>
                            </section>
                        )}
                        {f.advice && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 조언</h5>
                                <p className="text-gray-700">{f.advice}</p>
                            </section>
                        )}
                    </>
                )}
            </div>
        );
    };

    /** 코 전용: 게이지 먼저, 그 아래 파트 블록(길이·폭·형상·기울기) 또는 통합 핵심의미/조언 */
    const nosePartSpecs: PartSpec[] = [
        { partName: "길이 비율", measureKeys: ["length_ratio", "lengthRatio", "lengthCriteria"], measureLabels: { length_ratio: "얼굴 대비 코 길이 비율", lengthRatio: "얼굴 대비 코 길이 비율", lengthCriteria: "길이 기준" } },
        { partName: "폭 비율", measureKeys: ["nose_width_ratio", "width", "widthCriteria"], measureLabels: { nose_width_ratio: "코 폭 비율", width: "코 폭", widthCriteria: "폭 기준" } },
        { partName: "형상 비율", measureKeys: ["nose_shape_ratio", "shapeCriteria"], measureLabels: { nose_shape_ratio: "형상 비율", shapeCriteria: "형상 기준" } },
        { partName: "기울기", measureKeys: ["nose_shift_ratio"], measureLabels: { nose_shift_ratio: "중심선 기울기" } },
    ];
    const renderNoseBlock = (f: {
        measures?: Record<string, string> & { length?: string; lengthRatio?: string; width?: string; lengthCriteria?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
        coreMeaningParts?: string[];
        adviceParts?: string[];
    } | undefined) => {
        if (!f) return null;
        const useParts = (f as { coreMeaningParts?: string[] }).coreMeaningParts?.length;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">💰 코 분석 · 재물운 · 축적 능력 · 현실 감각</h4>

                {f.gauge && renderRangeGauge(f.gauge, "📈 재물운 게이지 (축적 성향)")}

                {useParts ? renderPartBlocks(f, nosePartSpecs) : (
                    <>
                        {f.coreMeaning && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 코가 말해주는 핵심 의미</h5>
                                <p className="text-gray-700">{f.coreMeaning}</p>
                            </section>
                        )}
                        {f.advice && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 조언</h5>
                                <p className="text-gray-700">{f.advice}</p>
                            </section>
                        )}
                    </>
                )}
            </div>
        );
    };

    /** 입 전용: 게이지 먼저, 그 아래 파트 블록(입꼬리·입술·입 폭) 또는 통합 핵심의미/조언 */
    const mouthPartSpecs: PartSpec[] = [
        { partName: "입꼬리 기울기", measureKeys: ["cornerSlope", "cornerCriteria"], measureLabels: { cornerSlope: "입꼬리 기울기", cornerCriteria: "입꼬리 기준" } },
        { partName: "입술 두께", measureKeys: ["lipThickness"], measureLabels: { lipThickness: "입술 두께" } },
        { partName: "입 폭", measureKeys: ["width", "mouth_width_ratio"], measureLabels: { width: "입 너비", mouth_width_ratio: "얼굴 대비 입 폭 비율" } },
    ];
    const renderMouthBlock = (f: {
        measures?: { width?: string; lipThickness?: string; cornerSlope?: string; cornerCriteria?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
        coreMeaningParts?: string[];
        adviceParts?: string[];
    } | undefined) => {
        if (!f) return null;
        const useParts = (f as { coreMeaningParts?: string[] }).coreMeaningParts?.length;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">💬 입 분석 · 신뢰 · 애정 · 표현 방식</h4>

                {f.gauge && renderRangeGauge(f.gauge, "📉 감정 표현 게이지 (외부 인상)")}

                {useParts ? renderPartBlocks(f, mouthPartSpecs) : (
                    <>
                        {f.coreMeaning && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 입이 말해주는 핵심 의미</h5>
                                <p className="text-gray-700">{f.coreMeaning}</p>
                            </section>
                        )}
                        {f.advice && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 조언</h5>
                                <p className="text-gray-700">{f.advice}</p>
                            </section>
                        )}
                    </>
                )}
            </div>
        );
    };

    /** 턱 전용: 게이지 먼저, 그 아래 파트 블록(각도·길이·깊이·안정성) */
    const chinPartSpecs: PartSpec[] = [
        { partName: "각도(성향)", measureKeys: ["angle", "angleCriteria"], measureLabels: { angle: "턱 각도", angleCriteria: "각도 기준" } },
        { partName: "길이", measureKeys: ["chin_ratio", "chin_length", "length"], measureLabels: { chin_ratio: "턱 길이 비율", chin_length: "턱 길이", length: "턱 길이" } },
        { partName: "깊이", measureKeys: ["chin_depth_ratio", "chin_depth"], measureLabels: { chin_depth_ratio: "턱 깊이 비율", chin_depth: "턱 깊이" } },
        { partName: "안정성", measureKeys: ["support_asym"], measureLabels: { support_asym: "좌우 지지 대칭" } },
    ];
    const renderChinBlock = (f: {
        measures?: Record<string, string> & { length?: string; width?: string; angle?: string; angleCriteria?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
        coreMeaningParts?: string[];
        adviceParts?: string[];
    } | undefined) => {
        if (!f) return null;
        const useParts = (f as { coreMeaningParts?: string[] }).coreMeaningParts?.length;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🪨 턱 분석 · 지구력 · 노년 안정도</h4>

                {f.gauge && renderRangeGauge(f.gauge, "🧱 지구력 게이지 (버티는 힘)")}

                {useParts ? renderPartBlocks(f, chinPartSpecs) : (
                    <>
                        {f.coreMeaning && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 턱이 말해주는 핵심 의미</h5>
                                <p className="text-gray-700">{f.coreMeaning}</p>
                            </section>
                        )}
                        {f.advice && (
                            <section>
                                <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 조언</h5>
                                <p className="text-gray-700">{f.advice}</p>
                            </section>
                        )}
                    </>
                )}
            </div>
        );
    };

    /** 공통·얼굴형: 게이지 + 핵심의미 + 조언 (측정 데이터 섹션 없음, 파트 블록에서 라벨과 함께 표시) */
    const renderCommonAndFaceShape = (_common: unknown, faceShape: unknown) => {
        const fs = faceShape || {};
        const gauge = fs.gauge ? { rangeMin: 0, rangeMax: 8, ...fs.gauge } : null;
        const coreMeaning = fs.coreMeaning || fs.summary;
        const advice = fs.advice;

        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🎭 얼굴형 분석 · 그릇의 크기</h4>

                {gauge && gauge.rangeMin != null && gauge.rangeMax != null && renderRangeGauge(gauge, "🧭 얼굴형 게이지 (그릇의 크기)")}

                {coreMeaning && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 얼굴형이 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{coreMeaning}</p>
                    </section>
                )}

                {advice && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 조언</h5>
                        <p className="text-gray-700">{advice}</p>
                    </section>
                )}
            </div>
        );
    };

    // SVG Paths for Face (귀 제외: 이마·눈·코·입·턱)
    const faceParts = [
        { id: "forehead", label: "이마 (초년운)", cx: 100, cy: 55, d: "M50,60 Q100,25 150,60 Q150,75 100,75 Q50,75 50,60 Z" },
        { id: "eyes", label: "눈 (감수성)", cx: 100, cy: 92, d: "M45,90 Q70,80 95,90 L105,90 Q130,80 155,90 Q150,105 100,105 Q50,105 45,90 Z" },
        { id: "nose", label: "코 (재물운)", cx: 100, cy: 120, d: "M90,105 L110,105 L115,135 L85,135 Z" },
        { id: "mouth", label: "입 (말년운)", cx: 100, cy: 155, d: "M75,150 Q100,145 125,150 Q125,165 100,170 Q75,165 75,150 Z" },
        { id: "chin", label: "턱 (인덕)", cx: 100, cy: 185, d: "M70,180 Q100,210 130,180 Q100,200 70,180 Z" },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto w-full">
            {/* 텍스트 영역 lg:w-1/2 — 총평·사주·관상 상시 노출 (상세해석은 부위 클릭 시 모달) */}
            <div className="w-full lg:w-1/2 min-w-0 flex flex-col gap-6">
                <GlassCard className="w-full min-w-0 flex flex-col p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-brand-green/10 border-2 border-brand-green rounded-xl flex items-center justify-center">🐢</div>
                        <h3 className="font-bold text-xl sm:text-2xl text-gray-800">거북 도사의 풀이</h3>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-4 max-h-[50vh]">
                        {/* 1. 관상+사주 종합 총평 — 이 사람은 어떤 사람인가 */}
                        {(totalReview?.faceOverview || DEFAULT_TOTAL_REVIEW.faceOverview) && (
                            <section className="total-review-content rounded-xl bg-gray-100 border border-gray-200 p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/80">
                                    <h4 className="text-gray-800 font-bold text-base">🐢 거북 도사의 총평</h4>
                                </div>
                                {(() => {
                                    const raw = (totalReview?.faceOverview || DEFAULT_TOTAL_REVIEW.faceOverview).trim();
                                    // 첫 문단(한줄요약)과 나머지(풀이)를 분리
                                    const parts = raw.split(/\n\s*\n/);
                                    const hookLine = parts[0] || "";
                                    const bodyLines = parts.slice(1).join("\n\n");
                                    return (
                                        <div className="text-gray-700 text-base leading-[1.75]">
                                            {/* 한줄요약 — 사주 기반 임팩트 */}
                                            {hookLine && (
                                                <p className="text-lg font-bold text-gray-900 mb-3">{hookLine}</p>
                                            )}
                                            {/* 소제목 + 호버 (고정) */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-bold text-gray-800">관상과 사주로 본 그대</span>
                                                <HoverCard openDelay={200} closeDelay={100}>
                                                    <HoverCardTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="text-xs text-brand-green hover:text-brand-green/80 underline underline-offset-2 cursor-help focus:outline-none"
                                                            aria-label="부위별 상세 보기"
                                                        >
                                                            부위별 상세 보기
                                                        </button>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent side="bottom" align="start" className="w-auto max-w-[260px] p-3">
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            오른쪽 얼굴 그림에서 <strong className="text-brand-green">궁금한 부위를 직접 클릭</strong>하면, 해당 부위의 상세 분석과 수치를 확인할 수 있어요.
                                                        </p>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            </div>
                                            {/* 풀이 본문 */}
                                            {bodyLines && (
                                                <div className="[&_p]:mb-3 [&_p:last-child]:mb-0">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p>{children}</p>,
                                                        }}
                                                    >
                                                        {bodyLines}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                    </div>

                    {/* 3개 블록 — 1열 3행 토글 (상세 자리) */}
                    <section className="mt-5 pt-4 border-t border-gray-100 flex-shrink-0">
                        <ThreeBlocksAccordion
                            totalReview={totalReview}
                            defaultTotalReview={DEFAULT_TOTAL_REVIEW}
                            loadingRemaining={loadingRemaining}
                        />
                    </section>
                </GlassCard>
            </div>

            {/* 궁금한 부위(얼굴) lg:w-1/2 — 상세해석은 upper depth로 이 영역을 가림 */}
            <div className="w-full lg:w-1/2 min-w-0 relative">
                <GlassCard className="w-full aspect-square flex items-center justify-center p-0 overflow-hidden relative shadow-clay-lg bg-white/40 border-[10px] border-white rounded-[48px] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/5" />

                        {/* 안내 문구 - 카드 내부 상단 */}
                        {!activeFeature && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none"
                            >
                                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-display text-sm text-brand-green shadow-clay-xs border-2 border-white flex items-center gap-2 animate-bounce-subtle">
                                    <Sparkles size={16} />
                                    궁금한 부위를 눌러보세요
                                </div>
                            </motion.div>
                        )}

                        {/* Background Face Image with Overlay */}
                        <div className="absolute inset-0">
                            <img
                                src={image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                                alt="Face Analysis"
                                className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-brand-green/5 backdrop-blur-[2px]" />
                        </div>

                        <svg viewBox="0 0 200 220" className="h-[85%] w-[85%] relative z-10 drop-shadow-2xl">
                            <defs>
                                <filter id="face-stroke-glow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Face Outline Guide — 공통·얼굴형: 외곽 테두리 클릭 시 활성화 */}
                            <motion.g
                                className="cursor-pointer group/outline"
                                onClick={() => setActiveFeature(activeFeature === "commonAndFaceShape" ? null : "commonAndFaceShape")}
                            >
                                <path
                                    d="M40,60 Q100,-20 160,60 V140 Q160,220 100,220 Q40,220 40,140 Z"
                                    style={{ pointerEvents: "stroke" } as React.CSSProperties}
                                    className={`transition-all duration-300
                                        ${activeFeature === "commonAndFaceShape"
                                            ? "fill-brand-green/40 stroke-brand-green stroke-[6]"
                                            : activeFeature === null && highlightIndex === 0
                                                ? "fill-brand-green/40 stroke-white stroke-[5] stroke-dasharray-[8,4] group-hover/outline:fill-brand-green/15 group-hover/outline:stroke-brand-green group-hover/outline:stroke-[6]"
                                                : "fill-white/40 stroke-white stroke-[5] stroke-dasharray-[8,4] group-hover/outline:fill-brand-green/15 group-hover/outline:stroke-brand-green group-hover/outline:stroke-[6]"
                                        }`}
                                />
                                {/* 테두리 따라 도는 빛 — 형광 톤 + 긴 호, 순차 하이라이트 시 */}
                                {activeFeature === null && highlightIndex === 0 && (
                                    <motion.path
                                        d="M40,60 Q100,-20 160,60 V140 Q160,220 100,220 Q40,220 40,140 Z"
                                        fill="none"
                                        className="stroke-[3.5]"
                                        pathLength={1}
                                        strokeDasharray="0.28 0.72"
                                        filter="url(#face-stroke-glow)"
                                        initial={{ strokeDashoffset: 0 }}
                                        animate={{ strokeDashoffset: [0, -1] }}
                                        transition={{ duration: 2.8, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                                        style={{ pointerEvents: "none", stroke: "#6efcd4" }}
                                    />
                                )}
                                {/* 라벨 — 선택 또는 호버/순차 하이라이트 시 표시 */}
                                <text
                                    x={100}
                                    y={28}
                                    textAnchor="middle"
                                    className={`text-[9px] font-bold pointer-events-none select-none transition-opacity
                                        ${activeFeature === "commonAndFaceShape"
                                            ? "fill-gray-900 opacity-100 drop-shadow-sm"
                                            : activeFeature === null && highlightIndex === 0
                                                ? "fill-gray-600 opacity-90"
                                                : "fill-gray-600 opacity-0 group-hover/outline:opacity-90"
                                        }`}
                                >
                                    공통·얼굴형
                                </text>
                            </motion.g>

                            {faceParts.map((part, idx) => {
                                const isActive = activeFeature === part.id;
                                const isHighlighted = activeFeature === null && highlightIndex === idx + 1;
                                return (
                                    <motion.g
                                        key={part.id}
                                        onClick={() => setActiveFeature(isActive ? null : part.id)}
                                        className="cursor-pointer group/part"
                                    >
                                        {/* Hotspot Area — 호버/하이라이트 시 채움, 테두리 강조 */}
                                        <path
                                            d={part.d}
                                            className={`transition-all duration-300 ${isActive
                                                ? "fill-brand-green/60 stroke-brand-green stroke-[2.5] shadow-[0_0_20px_rgba(0,137,123,0.5)]"
                                                : isHighlighted
                                                    ? "fill-brand-green/50 stroke-white/40 stroke-[2.5]"
                                                    : "fill-white/20 stroke-white/40 hover:fill-brand-green/35 hover:stroke-brand-green hover:stroke-[2.5]"
                                                }`}
                                        />
                                        {/* 테두리 따라 도는 빛 — 형광 톤 + 긴 호, 순차 하이라이트 시 */}
                                        {isHighlighted && (
                                            <motion.path
                                                d={part.d}
                                                fill="none"
                                                className="stroke-[2.5]"
                                                pathLength={1}
                                                strokeDasharray="0.28 0.72"
                                                filter="url(#face-stroke-glow)"
                                                initial={{ strokeDashoffset: 0 }}
                                                animate={{ strokeDashoffset: [0, -1] }}
                                                transition={{ duration: 2.8, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                                                style={{ pointerEvents: "none", stroke: "#6efcd4" }}
                                            />
                                        )}

                                        {/* Pulsing Indicator Dot */}
                                        <motion.circle
                                            cx={part.cx}
                                            cy={part.cy}
                                            r={isActive ? 6 : 4}
                                            initial={{ opacity: 1 }}
                                            animate={isActive ? { scale: [1, 1.25, 1], opacity: [1, 0.6, 1] } : { scale: 1, opacity: 1 }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className={`${isActive ? "fill-white" : "fill-brand-green"} stroke-white stroke-1 shadow-sm`}
                                        />

                                        {/* 라벨 — 선택, 순차 하이라이트, 호버 시 표시 */}
                                        <text
                                            x={part.cx}
                                            y={part.cy - 12}
                                            textAnchor="middle"
                                            className={`text-[9px] font-bold transition-all duration-300 pointer-events-none select-none
                                                ${isActive
                                                    ? "fill-gray-900 opacity-100 drop-shadow-sm"
                                                    : isHighlighted
                                                        ? "fill-gray-600 opacity-90"
                                                        : "fill-gray-500 opacity-0 group-hover/part:opacity-90"
                                                }`}
                                        >
                                            {FEATURE_LABELS[part.id] ?? part.label.split(" ")[0]}
                                        </text>
                                    </motion.g>
                                );
                            })}
                        </svg>

                </GlassCard>

                {/* 상세해석 overlay — 궁금한 부위 영역을 upper depth로 가림, 부드럽게 등장/퇴장 */}
                <AnimatePresence>
                    {activeFeature && (
                        <motion.div
                            key="detail-overlay"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 z-20 flex flex-col"
                        >
                            <GlassCard className="flex-1 min-h-0 flex flex-col p-4 sm:p-5 border-2 border-white rounded-2xl shadow-clay-lg bg-white/95 overflow-hidden">
                                <div className="flex justify-between items-start gap-3 mb-3 flex-shrink-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-base flex-shrink-0">🐢</div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-lg text-gray-800">거북 도사의 상세해석</h3>
                                            <p className="text-brand-green font-bold text-sm truncate">{FEATURE_LABELS[activeFeature] ?? activeFeature}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFeature(null)}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                                        aria-label="닫기"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="detail-card-content flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 text-base leading-relaxed [&_>div]:text-base [&_h4]:text-base [&_h4]:font-bold [&_h4]:border-b [&_h4]:border-brand-green/20 [&_h4]:pb-1.5 [&_h4]:mt-4 [&_h4]:first:mt-0 [&_h5]:text-base [&_h5]:font-bold [&_h5]:mt-3 [&_h5]:mb-1.5 [&_p]:leading-[1.7] [&_p]:text-base [&_ul]:space-y-1 [&_ul]:pl-4 [&_li]:text-gray-700">
                                    {activeFeature === "commonAndFaceShape" && renderCommonAndFaceShape(features.common, features.faceShape)}
                                    {activeFeature === "forehead" && features.forehead && (features.forehead as FeatureBlock).coreMeaning && renderForeheadBlock(features.forehead)}
                                    {activeFeature === "forehead" && features.forehead && !(features.forehead as FeatureBlock).coreMeaning && renderBlock(features.forehead)}
                                    {activeFeature === "eyes" && features.eyes && (features.eyes as FeatureBlock).coreMeaning && renderEyesBlock(features.eyes)}
                                    {activeFeature === "eyes" && features.eyes && !(features.eyes as FeatureBlock).coreMeaning && renderBlock(features.eyes)}
                                    {activeFeature === "nose" && features.nose && (features.nose as FeatureBlock).coreMeaning && renderNoseBlock(features.nose)}
                                    {activeFeature === "nose" && features.nose && !(features.nose as FeatureBlock).coreMeaning && renderBlock(features.nose)}
                                    {activeFeature === "mouth" && features.mouth && (features.mouth as FeatureBlock).coreMeaning && renderMouthBlock(features.mouth)}
                                    {activeFeature === "mouth" && features.mouth && !(features.mouth as FeatureBlock).coreMeaning && renderBlock(features.mouth)}
                                    {activeFeature === "chin" && features.chin && (features.chin as FeatureBlock).coreMeaning && renderChinBlock(features.chin)}
                                    {activeFeature === "chin" && features.chin && !(features.chin as FeatureBlock).coreMeaning && renderBlock(features.chin)}
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
