import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Sparkles, X } from "lucide-react";

// --- Types ---
interface FaceAnalysisProps {
    image: string;
    scores?: any[];  // 선택적으로 변경
    features: any;
    totalReview?: TotalReview; // 거북 도사의 총평 데이터 (백엔드에서 받아옴)
}

// 거북 도사의 총평: 2가지 구성
// 1. 전체 관상 분석 종합 의견
// 2. 취업운
interface TotalReview {
    faceOverview?: string; // 전체 관상 분석 종합 의견
    careerFortune?: string; // 취업운 (사주 포함)
}

// 백엔드 응답이 없을 때 표시할 기본 예시 데이터
const DEFAULT_TOTAL_REVIEW: TotalReview = {
    faceOverview: "이마가 넓고 눈이 균형 잡혀 있으며, 코와 입의 비율이 조화롭습니다. 전체적으로 상중하 삼정(三停)이 고르게 발달해 있어, 초년·중년·말년 운이 안정적으로 흘러갈 가능성이 높습니다. 특히 이마와 턱이 서로 받쳐주는 구조로, 생각한 것을 끝까지 실행하는 힘이 돋보입니다. 당신은 '부드러운 카리스마'를 가진 얼굴입니다. 첫인상은 다소 차분해 보일 수 있으나, 시간이 지날수록 신뢰를 얻는 타입입니다.",
    careerFortune: "올해는 취업운이 상승하는 시기입니다. 관상에서 보이는 안정적인 이마와 균형 잡힌 눈은 면접에서 신뢰감을 주는 인상입니다. 사주의 오행 분포를 보면, 기획·분석·관리 분야에서 두각을 나타낼 수 있으며, 상반기보다 하반기에 더 좋은 기회가 올 가능성이 높습니다. 면접 시에는 차분하고 논리적인 답변을 강조하면 좋겠습니다."
};

// highlightIndex: 0=얼굴형(공통·얼굴형), 1=이마, 2=눈, 3=코, 4=입, 5=턱
const HIGHLIGHT_ORDER = 6;
const HIGHLIGHT_DURATION_MS = 2800;

export const FaceAnalysis: React.FC<FaceAnalysisProps> = ({ image, scores, features, totalReview }) => {
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [highlightIndex, setHighlightIndex] = useState(0);

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

    /** 범위 게이지: value가 어느 구간(segment)에 해당하는지 시각화. 게이지 안에는 구간 기준값(segment min~max)만 표시 */
    const renderRangeGauge = (
        g: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] },
        customLabel?: string
    ) => {
        const { value, rangeMin, rangeMax, unit = "", segments } = g;
        const span = rangeMax - rangeMin || 1;
        const pct = Math.max(0, Math.min(100, ((value - rangeMin) / span) * 100));

        type Seg = { label: string; segMin: number; segMax: number };
        const resolved: Seg[] = segments.map((s, i) => {
            const segMin = s.min ?? (i === 0 ? rangeMin : (segments[i - 1].max ?? rangeMin));
            const segMax = s.max ?? (i === segments.length - 1 ? rangeMax : (segments[i + 1].min ?? rangeMax));
            return { label: s.label, segMin, segMax };
        });
        const activeIdx = resolved.findIndex((r) => value >= r.segMin && value < r.segMax);
        const formatVal = (v: number) => (Math.abs(v) < 0.01 && v !== 0 ? v.toFixed(4) : v % 1 === 0 ? String(v) : v.toFixed(2));

        return (
            <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
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
                <div className="relative h-2.5 mt-2 bg-gray-200 rounded-full">
                    <div className="absolute inset-y-0 left-0 flex" style={{ width: "100%" }}>
                        {resolved.map((r, i) => (
                            <div
                                key={i}
                                className="h-full"
                                style={{ width: `${((r.segMax - r.segMin) / span) * 100}%`, backgroundColor: i === activeIdx ? "rgba(0,137,123,0.35)" : "rgba(0,0,0,0.06)" }}
                            />
                        ))}
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-green border-2 border-white shadow" style={{ left: `max(0%,min(100%,${pct}%))`, marginLeft: "-8px" }} />
                </div>
                <p className="text-[17px] text-gray-600 mt-1.5 font-medium">측정값: {formatVal(value)}{unit}</p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-[15px] font-medium mb-2">기준값 (구간)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[15px]">
                        {resolved.map((r, i) => (
                            <div key={i} className="py-2 px-3 rounded-lg bg-white border border-gray-100">
                                <span className="font-medium text-gray-800">{r.label}:</span>{" "}
                                <span className="text-gray-600">{formatVal(r.segMin)}{unit} ~ {formatVal(r.segMax)}{unit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    /** 한 블록(forehead, eyes, nose, mouth, chin) 렌더 — 측정 데이터 + 게이지(기준값) + 핵심의미 */
    const renderBlock = (
        f: { title?: string; values?: string; criteria?: string; gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] }; interpretation?: string } | undefined
    ) => {
        if (!f) return null;
        const hasMeasureData = (f.values != null && f.values !== "") || (f.criteria != null && f.criteria !== "");
        return (
            <div className="space-y-5 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">{f.title}</h4>
                {hasMeasureData && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <p className="text-gray-700">
                            {f.values != null && f.values !== "" && <>{f.values}</>}
                            {f.criteria != null && f.criteria !== "" && (
                                <>{f.values != null && f.values !== "" ? " 적용 기준: " : ""}{f.criteria}{f.values != null && f.values !== "" ? "." : ""}</>
                            )}
                        </p>
                    </section>
                )}
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

    /** 이마 전용: 측정 데이터 + 게이지(기준값만) + 핵심의미 + 조언 */
    const renderForeheadBlock = (f: {
        measures?: { height?: string; heightRatio?: string; width?: string; widthRatio?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const hasMeasures = m.height || m.heightRatio || m.width || m.widthRatio;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🧠 이마 분석 · 사고력과 초년운</h4>

                {hasMeasures && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.height != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">이마 높이:</span> {m.height}</div>}
                            {m.heightRatio != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 대비 이마 높이 비율:</span> {m.heightRatio}</div>}
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">이마 폭:</span> {m.width}</div>}
                            {m.widthRatio != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 대비 이마 폭 비율:</span> {m.widthRatio}</div>}
                        </div>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "🧭 이마 높이 게이지 (초년운·사고력)")}

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
            </div>
        );
    };

    /** 눈 전용: 측정 데이터 + 게이지(기준값만) + 핵심의미 + 조언 */
    const renderEyesBlock = (f: {
        measures?: { openL?: string; openR?: string; asymmetry?: string; asymmetryCriteria?: string; interDist?: string; widthRatio?: string; symmetry?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const measureRows: { label: string; value: string }[] = [
            m.openL != null && { label: "좌측 눈 개방도", value: m.openL },
            m.openR != null && { label: "우측 눈 개방도", value: m.openR },
            m.asymmetry != null && { label: "개방도 차이", value: m.asymmetry },
            m.asymmetryCriteria != null && { label: "눈 비대칭 기준", value: m.asymmetryCriteria },
            m.interDist != null && { label: "눈 사이 거리", value: m.interDist },
            m.widthRatio != null && { label: "얼굴 폭 대비 비율", value: m.widthRatio },
            m.symmetry != null && { label: "전체 대칭도", value: m.symmetry },
        ].filter(Boolean) as { label: string; value: string }[];
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">👁 눈 분석 · 성격 · 직업운 · 관계 감각</h4>

                {measureRows.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {measureRows.map((r, i) => (
                                <div key={i} className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">{r.label}:</span> {r.value}</div>
                            ))}
                        </div>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "⚖️ 좌·우 눈 균형 게이지 (성향 안정도)")}

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
            </div>
        );
    };

    /** 코 전용: 측정 데이터 + 게이지(기준값만) + 핵심의미 + 조언 */
    const renderNoseBlock = (f: {
        measures?: { length?: string; lengthRatio?: string; width?: string; lengthCriteria?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const hasMeasures = m.length != null || m.lengthRatio != null || m.width != null || m.lengthCriteria != null;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">💰 코 분석 · 재물운 · 축적 능력 · 현실 감각</h4>

                {hasMeasures && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.length != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">코 길이:</span> {m.length}</div>}
                            {m.lengthRatio != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 대비 코 길이 비율:</span> {m.lengthRatio}</div>}
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">코 폭:</span> {m.width}</div>}
                            {m.lengthCriteria != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">길이 기준:</span> {m.lengthCriteria}</div>}
                        </div>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "📈 재물운 게이지 (축적 성향)")}

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
            </div>
        );
    };

    /** 입 전용: 측정 데이터 + 게이지(기준값만) + 핵심의미 + 조언 */
    const renderMouthBlock = (f: {
        measures?: { width?: string; lipThickness?: string; cornerSlope?: string; cornerCriteria?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const hasMeasures = m.width != null || m.lipThickness != null || m.cornerSlope != null || m.cornerCriteria != null;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">💬 입 분석 · 신뢰 · 애정 · 표현 방식</h4>

                {hasMeasures && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입 너비:</span> {m.width}</div>}
                            {m.lipThickness != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입술 두께:</span> {m.lipThickness}</div>}
                            {m.cornerSlope != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입꼬리 기울기:</span> {m.cornerSlope}</div>}
                            {m.cornerCriteria != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입꼬리 기준:</span> {m.cornerCriteria}</div>}
                        </div>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "📉 감정 표현 게이지 (외부 인상)")}

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
            </div>
        );
    };

    /** 턱 전용: 측정 데이터 + 게이지(기준값만) + 핵심의미 + 조언 */
    const renderChinBlock = (f: {
        measures?: { length?: string; width?: string; angle?: string; angleCriteria?: string };
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        coreMeaning?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const hasMeasures = m.length != null || m.width != null || m.angle != null || m.angleCriteria != null;
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🪨 턱 분석 · 지구력 · 노년 안정도</h4>

                {hasMeasures && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.length != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">턱 길이:</span> {m.length}</div>}
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">턱 폭:</span> {m.width}</div>}
                            {m.angle != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">턱 각도:</span> {m.angle}</div>}
                            {m.angleCriteria != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">각도 기준:</span> {m.angleCriteria}</div>}
                        </div>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "🧱 지구력 게이지 (버티는 힘)")}

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
            </div>
        );
    };

    /** 공통·얼굴형: 측정 데이터 + 게이지(기준값만) + 핵심의미 + 조언 */
    const renderCommonAndFaceShape = (_common: any, faceShape: any) => {
        const fs = faceShape || {};
        const gauge = fs.gauge ? { rangeMin: 0, rangeMax: 8, ...fs.gauge } : null;
        const coreMeaning = fs.coreMeaning || fs.summary;
        const advice = fs.advice;
        const hasMeasures = fs.measures?.w != null || fs.measures?.h != null || fs.measures?.wh != null;

        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🎭 얼굴형 분석 · 그릇의 크기</h4>

                {hasMeasures && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-3 gap-2 text-[18px]">
                            {fs.measures?.w != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 너비(W):</span> {fs.measures.w}</div>}
                            {fs.measures?.h != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 높이(H):</span> {fs.measures.h}</div>}
                            {fs.measures?.wh != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">W/H 비율:</span> {fs.measures.wh}</div>}
                        </div>
                    </section>
                )}

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
                        <h3 className="font-bold text-xl sm:text-2xl text-gray-800">거북 도사의 총평</h3>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-5 max-h-[50vh]">
                        {/* 1. 전체 관상 분석 종합 의견 */}
                        {(totalReview?.faceOverview || DEFAULT_TOTAL_REVIEW.faceOverview) && (
                            <section>
                                <h4 className="text-gray-800 font-bold text-base mb-2">1. 전체 관상 분석 종합 의견</h4>
                                <p className="text-gray-700 text-base leading-[1.75]">{totalReview?.faceOverview || DEFAULT_TOTAL_REVIEW.faceOverview}</p>
                            </section>
                        )}

                        {/* 2. 취업운 */}
                        {(totalReview?.careerFortune || DEFAULT_TOTAL_REVIEW.careerFortune) && (
                            <section>
                                <h4 className="text-gray-800 font-bold text-base mb-2">2. 올해의 취업운 💼</h4>
                                <p className="text-gray-700 text-base leading-[1.75] whitespace-pre-line">{totalReview?.careerFortune || DEFAULT_TOTAL_REVIEW.careerFortune}</p>
                            </section>
                        )}
                    </div>

                    <section className="mt-5 pt-4 border-t border-gray-100 flex-shrink-0">
                        <h4 className="text-sm font-bold text-gray-600 mb-1.5">상세</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">이마, 눈, 코, 입, 턱, 얼굴형 중 궁금한 부위를 눌러 부위별 상세해석을 확인해 보세요.</p>
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
                                    {activeFeature === "forehead" && features.forehead && (features.forehead as any).coreMeaning && renderForeheadBlock(features.forehead)}
                                    {activeFeature === "forehead" && features.forehead && !(features.forehead as any).coreMeaning && renderBlock(features.forehead)}
                                    {activeFeature === "eyes" && features.eyes && (features.eyes as any).coreMeaning && renderEyesBlock(features.eyes)}
                                    {activeFeature === "eyes" && features.eyes && !(features.eyes as any).coreMeaning && renderBlock(features.eyes)}
                                    {activeFeature === "nose" && features.nose && (features.nose as any).coreMeaning && renderNoseBlock(features.nose)}
                                    {activeFeature === "nose" && features.nose && !(features.nose as any).coreMeaning && renderBlock(features.nose)}
                                    {activeFeature === "mouth" && features.mouth && (features.mouth as any).coreMeaning && renderMouthBlock(features.mouth)}
                                    {activeFeature === "mouth" && features.mouth && !(features.mouth as any).coreMeaning && renderBlock(features.mouth)}
                                    {activeFeature === "chin" && features.chin && (features.chin as any).coreMeaning && renderChinBlock(features.chin)}
                                    {activeFeature === "chin" && features.chin && !(features.chin as any).coreMeaning && renderBlock(features.chin)}
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
