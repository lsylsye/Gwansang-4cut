import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";
import { ResultCharts } from "@/features/personal/stats/components/ResultCharts";

// --- Types ---
interface AnalysisSection {
    id?: string;
    label?: string;
    title: string;
    content: string;
}

interface FaceAnalysisProps {
    image: string;
    scores: any[];
    features: any;
    totalAnalysis: AnalysisSection[];
}

// --- Historical Match Mock Data ---
const HISTORICAL_MATCH = {
    name: "세종대왕",
    desc: "학문을 사랑하고 백성을 위해 헌신한 세종대왕과 비슷한 관상입니다. 지도력과 창의성이 뛰어납니다.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/King_Sejong_statue_Gwanghwamun.jpg/220px-King_Sejong_statue_Gwanghwamun.jpg",
};

// highlightIndex: 0=얼굴형(공통·얼굴형), 1=이마, 2=눈, 3=코, 4=입, 5=턱
const HIGHLIGHT_ORDER = 6;
const HIGHLIGHT_DURATION_MS = 2800;

export const FaceAnalysis: React.FC<FaceAnalysisProps> = ({ image, scores, features, totalAnalysis }) => {
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(true);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);

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

    /** 범위 게이지: value가 어느 구간(segment)에 해당하는지 시각화. customLabel 없으면 "범위 게이지" */
    const renderRangeGauge = (g: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] }, customLabel?: string) => {
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
            <div className="mb-5">
                <p className="text-gray-700 font-semibold mb-2 text-[19px]">{customLabel ?? "범위 게이지"}</p>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[17px]">
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
            </div>
        );
    };

    /** 한 블록(forehead, eyes, nose, mouth, chin) 렌더 — 보고서형: 범위 게이지 / 측정 요약 / 해석 / 제언 */
    const renderBlock = (
        f: { title?: string; valuesLabel?: string; values?: string; criteria?: string; interpretation?: string; adviceLabel?: string; advice?: string; gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] } } | undefined
    ) => {
        if (!f) return null;
        return (
            <div className="space-y-5 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">{f.title}</h4>
                {f.gauge && renderRangeGauge(f.gauge)}
                {(f.values != null && f.values !== "") || (f.criteria != null && f.criteria !== "") ? (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">측정 데이터</h5>
                        <p className="text-gray-700">
                            {f.values != null && f.values !== "" && <>{f.values}</>}
                            {f.criteria != null && f.criteria !== "" && (
                                <>{f.values != null && f.values !== "" ? " 적용 기준은 " : "적용 기준: "}{f.criteria}{f.values != null && f.values !== "" ? "입니다." : "."}</>
                            )}
                        </p>
                    </section>
                ) : null}
                {f.interpretation != null && f.interpretation !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">해석</h5>
                        <p className="text-gray-700">{f.interpretation}</p>
                    </section>
                )}
                {f.advice != null && f.advice !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">종합 및 제언</h5>
                        <p className="text-gray-700">{f.advice}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 이마 전용 확장 블록: 분석 신뢰도, 측정 데이터, 이마 높이 게이지, 판정·한줄요약·핵심의미·강점·주의·경계문장·제언 */
    const renderForeheadBlock = (f: {
        title?: string; gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        analysisTrust?: string; analysisTrustNote?: string;
        measures?: { height?: string; heightRatio?: string; width?: string; widthRatio?: string };
        typeSub?: string; oneLineSummary?: string; coreMeaning?: string; strengths?: string[]; cautions?: string[]; boundarySentence?: string;
        interpretation?: string; advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const strengths = f.strengths || [];
        const cautions = f.cautions || [];
        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🧠 이마 분석 · 사고력과 초년운</h4>

                {(f.analysisTrust || f.analysisTrustNote) && (
                    <section>
                        <p className="text-gray-700">
                            <span className="font-semibold text-brand-green">🎯 분석 신뢰도: {f.analysisTrust || "—"}</span>
                            {f.analysisTrustNote && <span className="text-gray-600"> ({f.analysisTrustNote})</span>}
                        </p>
                    </section>
                )}

                {(m.height || m.heightRatio || m.width || m.widthRatio) && (
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

                {f.typeSub && (
                    <section>
                        <p className="font-bold text-amber-800 text-xl p-3 rounded-xl bg-amber-50 border border-amber-200/80">🏆 판정 유형: {f.typeSub}</p>
                    </section>
                )}

                {f.oneLineSummary && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">✨ 한 줄 요약</h5>
                        <p className="text-gray-700 italic">"{f.oneLineSummary}"</p>
                    </section>
                )}

                {f.coreMeaning && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 이마가 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{f.coreMeaning}</p>
                    </section>
                )}

                {strengths.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-brand-green mb-2 text-xl">🌟 타고난 강점 (이마 기준)</h5>
                        <ul className="list-decimal list-inside text-gray-700 space-y-2">
                            {strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {cautions.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-amber-700 mb-2 text-xl">⚠️ 이마가 높은 사람의 주의 포인트</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cautions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {f.boundarySentence && (
                    <section className="p-4 rounded-xl bg-gray-100 border-l-4 border-amber-500">
                        <p className="text-gray-700 font-medium">📌 관상적 경계 문장</p>
                        <p className="text-gray-800 mt-1">"{f.boundarySentence}"</p>
                    </section>
                )}

                {f.advice != null && f.advice !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">종합 및 제언</h5>
                        <p className="text-gray-700">{f.advice}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 눈 전용 확장 블록: 이마와 유사 플로우 — 분석 신뢰도, Eye Metrics, 좌·우 균형 게이지, 판정, 한줄요약, 핵심의미, 성격·대인 강점, 주의, 제언 */
    const renderEyesBlock = (f: {
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        analysisTrust?: string; analysisTrustNote?: string;
        measures?: { openL?: string; openR?: string; asymmetry?: string; asymmetryCriteria?: string; interDist?: string; widthRatio?: string; symmetry?: string };
        typeSub?: string; oneLineSummary?: string; coreMeaning?: string; strengths?: string[]; cautions?: string[];
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const strengths = f.strengths || [];
        const cautions = f.cautions || [];
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

                {(f.analysisTrust || f.analysisTrustNote) && (
                    <section>
                        <p className="text-gray-700">
                            <span className="font-semibold text-brand-green">🎯 분석 신뢰도: {f.analysisTrust || "—"}</span>
                            {f.analysisTrustNote && <span className="text-gray-600"> ({f.analysisTrustNote})</span>}
                        </p>
                    </section>
                )}

                {measureRows.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 Eye Metrics (눈 개방·대칭·거리)</h5>
                        <p className="text-gray-500 text-[17px] mb-2">측정 데이터 요약</p>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {measureRows.map((r, i) => (
                                <div key={i} className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">{r.label}:</span> {r.value}</div>
                            ))}
                        </div>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "⚖️ 좌·우 눈 균형 게이지 (성향 안정도)")}

                {f.typeSub && (
                    <section>
                        <p className="font-bold text-amber-800 text-xl p-4 rounded-xl bg-amber-50 border border-amber-200/80">🏆 판정 유형: {f.typeSub}</p>
                    </section>
                )}

                {f.oneLineSummary && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">✨ 한 줄 요약</h5>
                        <p className="text-gray-700 italic">"{f.oneLineSummary}"</p>
                    </section>
                )}

                {f.coreMeaning && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 눈이 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{f.coreMeaning}</p>
                    </section>
                )}

                {strengths.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-brand-green mb-2 text-xl">🌟 성격 & 대인관계 강점</h5>
                        <ul className="list-decimal list-inside text-gray-700 space-y-2">
                            {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {cautions.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-amber-700 mb-2 text-xl">⚠️ 주의 포인트</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cautions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {f.advice != null && f.advice !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">종합 및 제언</h5>
                        <p className="text-gray-700">{f.advice}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 코 전용 확장 블록: 이마·눈과 유사 플로우 — 분석 신뢰도, Nose Metrics, 판정 결과, 재물운 게이지, 유형, 한줄요약, 핵심의미, 재물운 강점, 주의, 제언 */
    const renderNoseBlock = (f: {
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        analysisTrust?: string; analysisTrustNote?: string;
        measures?: { length?: string; lengthRatio?: string; width?: string; lengthCriteria?: string };
        judgementResult?: string; typeSub?: string; oneLineSummary?: string; coreMeaning?: string; strengths?: string[]; cautions?: string[];
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const strengths = f.strengths || [];
        const cautions = f.cautions || [];

        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">💰 코 분석 · 재물운 · 축적 능력 · 현실 감각</h4>

                {(f.analysisTrust || f.analysisTrustNote) && (
                    <section>
                        <p className="text-gray-700">
                            <span className="font-semibold text-brand-green">🎯 분석 신뢰도: {f.analysisTrust || "—"}</span>
                            {f.analysisTrustNote && <span className="text-gray-600"> ({f.analysisTrustNote})</span>}
                        </p>
                    </section>
                )}

                {(m.length != null || m.lengthRatio != null || m.width != null || m.lengthCriteria != null) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 Nose Metrics (코 길이·폭 비율)</h5>
                        <p className="text-gray-500 text-[17px] mb-2">측정 데이터</p>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.length != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">코 길이:</span> {m.length}</div>}
                            {m.lengthRatio != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 대비 코 길이 비율:</span> {m.lengthRatio}</div>}
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">코 폭:</span> {m.width}</div>}
                        </div>
                        {m.lengthCriteria != null && (
                            <div className="text-gray-600 text-[17px] mt-3">
                                <p className="font-medium text-gray-700 mb-1">길이 기준</p>
                                <p>{m.lengthCriteria}</p>
                            </div>
                        )}
                    </section>
                )}

                {f.judgementResult && (
                    <section className="p-4 rounded-xl bg-gray-100 border-l-4 border-brand-green">
                        <p className="text-gray-700 font-medium">📌 판정 결과</p>
                        <p className="text-gray-800 mt-1">👉 {f.judgementResult}</p>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "📈 재물운 게이지 (축적 성향)")}

                {f.typeSub && (
                    <section>
                        <p className="font-bold text-amber-800 text-xl p-4 rounded-xl bg-amber-50 border border-amber-200/80">🏆 유형 선언: {f.typeSub}</p>
                    </section>
                )}

                {f.oneLineSummary && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">✨ 한 줄 요약</h5>
                        <p className="text-gray-700 italic">"{f.oneLineSummary}"</p>
                    </section>
                )}

                {f.coreMeaning && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 코가 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{f.coreMeaning}</p>
                    </section>
                )}

                {strengths.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-brand-green mb-2 text-xl">🌟 재물운 강점</h5>
                        <ul className="list-none text-gray-700 space-y-2">
                            {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {cautions.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-amber-700 mb-2 text-xl">⚠️ 주의 포인트</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cautions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {f.advice != null && f.advice !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">종합 및 제언</h5>
                        <p className="text-gray-700">{f.advice}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 입 전용 확장 블록: 분석 신뢰도, Mouth Metrics, 판정, 감정 표현 게이지, 유형, 한줄요약, 핵심의미, 입 기준 강점, 주의, 운용 팁, 흥미 포인트, 종합 요약 표, 한 줄 결론 */
    const renderMouthBlock = (f: {
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        analysisTrust?: string; analysisTrustNote?: string;
        measures?: { width?: string; lipThickness?: string; cornerSlope?: string; cornerCriteria?: string };
        judgementResult?: string; typeSub?: string; oneLineSummary?: string; coreMeaning?: string; strengths?: string[]; cautions?: string[];
        relationTips?: string[]; relationTipsNote?: string; interestingPoint?: string; summaryTable?: { item: string; value: string }[]; oneLineConclusion?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const strengths = f.strengths || [];
        const cautions = f.cautions || [];
        const tips = f.relationTips || [];
        const table = f.summaryTable || [];

        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">💬 입 분석 · 신뢰 · 애정 · 표현 방식</h4>

                {(f.analysisTrust || f.analysisTrustNote) && (
                    <section>
                        <p className="text-gray-700">
                            <span className="font-semibold text-brand-green">🎯 분석 신뢰도: {f.analysisTrust || "—"}</span>
                            {f.analysisTrustNote && <span className="text-gray-600"> ({f.analysisTrustNote})</span>}
                        </p>
                    </section>
                )}

                {(m.width != null || m.lipThickness != null || m.cornerSlope != null || m.cornerCriteria != null) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 Mouth Metrics (입 너비·입술·입꼬리)</h5>
                        <p className="text-gray-500 text-[17px] mb-2">측정 데이터</p>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입 너비:</span> {m.width}</div>}
                            {m.lipThickness != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입술 두께:</span> {m.lipThickness}</div>}
                            {m.cornerSlope != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">입꼬리 기울기:</span> {m.cornerSlope}</div>}
                        </div>
                        {m.cornerCriteria != null && (
                            <div className="text-gray-600 text-[17px] mt-3">
                                <p className="font-medium text-gray-700 mb-1">입꼬리 기준</p>
                                <p>{m.cornerCriteria}</p>
                            </div>
                        )}
                    </section>
                )}

                {f.judgementResult && (
                    <section className="p-4 rounded-xl bg-gray-100 border-l-4 border-brand-green">
                        <p className="text-gray-700 font-medium">📌 판정 결과</p>
                        <p className="text-gray-800 mt-1">👉 {f.judgementResult}</p>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "📉 감정 표현 게이지 (외부 인상)")}

                {f.typeSub && (
                    <section>
                        <p className="font-bold text-amber-800 text-xl p-4 rounded-xl bg-amber-50 border border-amber-200/80">🏆 유형 선언: {f.typeSub}</p>
                    </section>
                )}

                {f.oneLineSummary && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">✨ 한 줄 요약</h5>
                        <p className="text-gray-700 italic">"{f.oneLineSummary}"</p>
                    </section>
                )}

                {f.coreMeaning && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 입이 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{f.coreMeaning}</p>
                    </section>
                )}

                {strengths.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-brand-green mb-2 text-xl">🌟 입 기준 강점</h5>
                        <ul className="list-none text-gray-700 space-y-2">
                            {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {cautions.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-amber-700 mb-2 text-xl">⚠️ 입에서 보이는 주의 포인트</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cautions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {tips.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🧭 입 기준 관계·애정 운용 팁</h5>
                        <ul className="list-none text-gray-700 space-y-1">
                            {tips.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                        {f.relationTipsNote && <p className="text-gray-600 mt-2">👉 {f.relationTipsNote}</p>}
                    </section>
                )}

                {f.interestingPoint && (
                    <section className="p-4 rounded-xl bg-gray-50 border-l-4 border-brand-green/60">
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 흥미로운 관상 포인트</h5>
                        <p className="text-gray-700">{f.interestingPoint}</p>
                    </section>
                )}

                {table.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🧾 입 기준 종합 요약</h5>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-[18px]">
                                <tbody>
                                    {table.map((row, i) => (
                                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                            <td className="py-2.5 px-4 font-medium text-gray-700 w-1/3">{row.item}</td>
                                            <td className="py-2.5 px-4 text-gray-800">{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {f.oneLineConclusion && (
                    <section className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80">
                        <p className="font-semibold text-gray-800 text-xl">💬 한 줄 결론</p>
                        <p className="text-gray-800 mt-1 italic">"{f.oneLineConclusion}"</p>
                    </section>
                )}

                {f.advice != null && f.advice !== "" && !f.oneLineConclusion && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">종합 및 제언</h5>
                        <p className="text-gray-700">{f.advice}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 턱 전용 확장 블록: 분석 신뢰도, Jaw Metrics, 판정, 지구력 게이지, 유형, 한줄요약, 핵심의미, 턱 기준 강점, 주의, 경계문장, 인생 운용 가이드, 흥미 포인트, 제언 */
    const renderChinBlock = (f: {
        gauge?: { value: number; rangeMin: number; rangeMax: number; unit?: string; segments: { label: string; min?: number; max?: number }[] };
        analysisTrust?: string; analysisTrustNote?: string;
        measures?: { length?: string; width?: string; angle?: string; angleCriteria?: string };
        judgementResult?: string; typeSub?: string; oneLineSummary?: string; coreMeaning?: string; strengths?: string[]; cautions?: string[];
        boundarySentence?: string; guide?: string[]; interestingPoint?: string;
        advice?: string;
    } | undefined) => {
        if (!f) return null;
        const m = f.measures || {};
        const strengths = f.strengths || [];
        const cautions = f.cautions || [];
        const guide = f.guide || [];

        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🪨 턱 분석 · 지구력 · 노년 안정도</h4>

                {(f.analysisTrust || f.analysisTrustNote) && (
                    <section>
                        <p className="text-gray-700">
                            <span className="font-semibold text-brand-green">🎯 분석 신뢰도: {f.analysisTrust || "—"}</span>
                            {f.analysisTrustNote && <span className="text-gray-600"> ({f.analysisTrustNote})</span>}
                        </p>
                    </section>
                )}

                {(m.length != null || m.width != null || m.angle != null || m.angleCriteria != null) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 Jaw Metrics (턱 길이·폭·각도)</h5>
                        <p className="text-gray-500 text-[17px] mb-2">측정 데이터</p>
                        <div className="grid grid-cols-2 gap-2 text-[18px]">
                            {m.length != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">턱 길이:</span> {m.length}</div>}
                            {m.width != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">턱 폭:</span> {m.width}</div>}
                            {m.angle != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">턱 각도:</span> {m.angle}</div>}
                        </div>
                        {m.angleCriteria != null && (
                            <div className="text-gray-600 text-[17px] mt-3">
                                <p className="font-medium text-gray-700 mb-1">각도 기준</p>
                                <p>{m.angleCriteria}</p>
                            </div>
                        )}
                    </section>
                )}

                {f.judgementResult && (
                    <section className="p-4 rounded-xl bg-gray-100 border-l-4 border-brand-green">
                        <p className="text-gray-700 font-medium">📌 판정 결과</p>
                        <p className="text-gray-800 mt-1">👉 {f.judgementResult}</p>
                    </section>
                )}

                {f.gauge && renderRangeGauge(f.gauge, "🧱 지구력 게이지 (버티는 힘)")}

                {f.typeSub && (
                    <section>
                        <p className="font-bold text-amber-800 text-xl p-4 rounded-xl bg-amber-50 border border-amber-200/80">🏆 유형 선언: {f.typeSub}</p>
                    </section>
                )}

                {f.oneLineSummary && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">✨ 한 줄 요약</h5>
                        <p className="text-gray-700 italic">"{f.oneLineSummary}"</p>
                    </section>
                )}

                {f.coreMeaning && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 턱이 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{f.coreMeaning}</p>
                    </section>
                )}

                {strengths.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-brand-green mb-2 text-xl">🌟 턱 기준 강점</h5>
                        <ul className="list-none text-gray-700 space-y-2">
                            {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {cautions.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-amber-700 mb-2 text-xl">⚠️ 턱에서 보이는 주의 포인트</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cautions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {f.boundarySentence && (
                    <section className="p-4 rounded-xl bg-gray-100 border-l-4 border-amber-500">
                        <p className="text-gray-700 font-medium">📌 관상적 경계 문장</p>
                        <p className="text-gray-800 mt-1">"{f.boundarySentence}"</p>
                    </section>
                )}

                {guide.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🧭 턱 기준 인생 운용 가이드</h5>
                        <ul className="list-none text-gray-700 space-y-1">
                            {guide.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {f.interestingPoint && (
                    <section className="p-4 rounded-xl bg-gray-50 border-l-4 border-brand-green/60">
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">💡 흥미로운 관상 포인트</h5>
                        <p className="text-gray-700">{f.interestingPoint}</p>
                    </section>
                )}

                {f.advice != null && f.advice !== "" && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">종합 및 제언</h5>
                        <p className="text-gray-700">{f.advice}</p>
                    </section>
                )}
            </div>
        );
    };

    /** 공통·얼굴형: 이마와 유사 플로우 — 측정 → 게이지 → 판정 → 한줄요약 → 핵심의미 → 강점 → 주의 → 성향 → 운용 (사진 품질 체크 없음) */
    const renderCommonAndFaceShape = (_common: any, faceShape: any) => {
        const fs = faceShape || {};
        const strengths = fs.strengths || [];
        const cautions = fs.cautions || [];
        const behavior = fs.patterns?.behavior || [];
        const life = fs.patterns?.life || [];
        const guide = fs.guide || [];
        const gauge = fs.gauge ? { rangeMin: 0, rangeMax: 8, ...fs.gauge } : null;

        return (
            <div className="space-y-6 text-[20px] leading-relaxed">
                <h4 className="font-bold text-gray-800 font-display text-2xl border-b-2 border-brand-green/20 pb-2">🎭 얼굴형 분석 · 그릇의 크기</h4>

                {/* 📐 측정 데이터 */}
                {(fs.measures?.w != null || fs.measures?.h != null || fs.measures?.wh != null) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">📐 측정 데이터</h5>
                        <div className="grid grid-cols-3 gap-2 text-[18px]">
                            {fs.measures?.w != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 너비(W):</span> {fs.measures.w}</div>}
                            {fs.measures?.h != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">얼굴 높이(H):</span> {fs.measures.h}</div>}
                            {fs.measures?.wh != null && <div className="p-3 rounded-lg bg-gray-50"><span className="text-gray-500">W/H 비율:</span> {fs.measures.wh}</div>}
                        </div>
                    </section>
                )}

                {/* 🧭 얼굴형 게이지 */}
                {gauge && gauge.rangeMin != null && gauge.rangeMax != null && renderRangeGauge(gauge, "🧭 얼굴형 게이지 (그릇의 크기)")}

                {/* 🏆 판정 유형 */}
                {(fs.type || fs.typeSub) && (
                    <section>
                        <p className="font-bold text-amber-800 text-xl p-4 rounded-xl bg-amber-50 border border-amber-200/80">🏆 판정 유형: {fs.type || "—"} ({fs.typeSub || "—"})</p>
                    </section>
                )}

                {/* ✨ 한 줄 요약 */}
                {(fs.oneLineSummary || fs.summary) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">✨ 한 줄 요약</h5>
                        <p className="text-gray-700 italic">"{fs.oneLineSummary || fs.summary}"</p>
                    </section>
                )}

                {/* 🔍 얼굴형이 말해주는 핵심 의미 */}
                {(fs.coreMeaning || fs.summary) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🔍 얼굴형이 말해주는 핵심 의미</h5>
                        <p className="text-gray-700">{fs.coreMeaning || fs.summary}</p>
                    </section>
                )}

                {/* 🌟 타고난 강점 */}
                {strengths.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-brand-green mb-2 text-xl">🌟 타고난 강점 (얼굴형 기준)</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {/* ⚠️ 주의 포인트 */}
                {cautions.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-amber-700 mb-2 text-xl">⚠️ 넓은 그릇의 주의 포인트</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cautions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                    </section>
                )}

                {/* 🧠 성향·인생 패턴 */}
                {(behavior.length > 0 || life.length > 0) && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🧠 얼굴형 기반 성향·인생 패턴</h5>
                        <div className="space-y-2 text-gray-700">
                            {behavior.length > 0 && <p>{behavior.join(" ")}</p>}
                            {life.length > 0 && <p>{life.join(" ")}</p>}
                        </div>
                    </section>
                )}

                {/* 🧭 운용 전략 */}
                {guide.length > 0 && (
                    <section>
                        <h5 className="font-semibold text-gray-800 mb-2 text-xl">🧭 얼굴형 운용 전략</h5>
                        <p className="text-gray-700">
                            {guide.map((g: { from?: string; to?: string }, i: number) => (
                                <span key={i}>
                                    {i > 0 && " "}
                                    <span className="text-gray-500">{g.from}</span>보다 <span className="text-brand-green font-medium">{g.to}</span> 방향을 권합니다.
                                </span>
                            ))}
                        </p>
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
        <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-5/12 space-y-8">
                <div className="relative">
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
                </div>
                <GlassCard className="w-full p-8 shadow-clay-sm border-4 border-white rounded-[32px]">
                    <h4 className="font-bold text-gray-800 mb-4 font-display text-2xl">운세 그래프</h4>
                    <ResultCharts data={scores} />
                </GlassCard>
            </div>

            <div className="w-full lg:w-7/12 flex flex-col gap-6">
                {/* 총평 위 인라인 상세해석 박스 — 부위 클릭 시 표시, 총평을 아래로 밀어냄 */}
                <AnimatePresence>
                    {activeFeature && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <GlassCard className="p-6 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50 mb-2">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-xl shadow-clay-xs">🐢</div>
                                        <div>
                                            <h3 className="font-bold text-3xl text-gray-800 font-sans">거북 도사의 상세해석</h3>
                                            <p className="text-lg text-brand-green font-medium">{FEATURE_LABELS[activeFeature] ?? activeFeature}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFeature(null)}
                                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                        aria-label="접기"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="bg-white/80 p-7 rounded-2xl border border-white/80 shadow-inner max-h-[55vh] overflow-y-auto custom-scrollbar space-y-4 font-sans leading-relaxed text-[20px]">
                                    {activeFeature === "commonAndFaceShape" && renderCommonAndFaceShape(features.common, features.faceShape)}
                                    {activeFeature === "forehead" && features.forehead && (features.forehead as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderForeheadBlock(features.forehead)}</div>
                                    )}
                                    {activeFeature === "forehead" && features.forehead && !(features.forehead as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderBlock(features.forehead)}</div>
                                    )}
                                    {activeFeature === "eyes" && features.eyes && (features.eyes as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderEyesBlock(features.eyes)}</div>
                                    )}
                                    {activeFeature === "eyes" && features.eyes && !(features.eyes as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderBlock(features.eyes)}</div>
                                    )}
                                    {activeFeature === "nose" && features.nose && (features.nose as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderNoseBlock(features.nose)}</div>
                                    )}
                                    {activeFeature === "nose" && features.nose && !(features.nose as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderBlock(features.nose)}</div>
                                    )}
                                    {activeFeature === "mouth" && features.mouth && (features.mouth as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderMouthBlock(features.mouth)}</div>
                                    )}
                                    {activeFeature === "mouth" && features.mouth && !(features.mouth as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderBlock(features.mouth)}</div>
                                    )}
                                    {activeFeature === "chin" && features.chin && (features.chin as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderChinBlock(features.chin)}</div>
                                    )}
                                    {activeFeature === "chin" && features.chin && !(features.chin as any).oneLineSummary && (
                                        <div className="text-[20px]">{renderBlock(features.chin)}</div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                <GlassCard className="flex-1 p-10 border-4 border-white rounded-[40px] shadow-clay-md bg-white/40 font-sans">
                    <div className="flex justify-between items-center mb-4 cursor-pointer select-none" onClick={() => setIsDetailOpen(!isDetailOpen)}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center text-2xl shadow-clay-xs">🐢</div>
                            <h3 className="font-bold text-[28px] text-gray-800 font-sans">거북 도사의 총평</h3>
                        </div>
                        {isDetailOpen ? <ChevronUp size={28} className="text-gray-400" /> : <ChevronDown size={28} className="text-gray-400" />}
                    </div>
                    {/* 챕터 버튼 4개: 접기/펼치기와 관계없이 항상 노출 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {totalAnalysis.map((ch, idx) => (
                            <button
                                key={ch.id ?? idx}
                                type="button"
                                onClick={() => setActiveChapterIndex(idx)}
                                className={`px-4 py-2.5 rounded-xl text-[15px] font-semibold font-sans transition-all duration-200 ${
                                    activeChapterIndex === idx
                                        ? "bg-brand-green text-white shadow-clay-xs"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                }`}
                            >
                                {ch.label ?? ch.title}
                            </button>
                        ))}
                    </div>
                    <AnimatePresence>
                        {isDetailOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white/80 p-8 rounded-[32px] border-2 border-white shadow-inner font-sans">
                                    {/* 선택된 챕터만 표시 */}
                                    {totalAnalysis.length > 0 && (() => {
                                        const curr = totalAnalysis[activeChapterIndex] ?? totalAnalysis[0];
                                        return (
                                            <div key={activeChapterIndex} className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                                <div className="flex items-center gap-3 mb-4 ml-1">
                                                    <div className="w-1.5 h-5 bg-brand-green rounded-full shadow-[0_0_8px_rgba(0,137,123,0.3)]" />
                                                    <h4 className="text-2xl font-bold text-gray-800 font-sans tracking-tight">
                                                        {curr.title}
                                                    </h4>
                                                </div>
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-line font-sans text-[21px] pl-4 border-l-2 border-brand-green/10">
                                                    {curr.content}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-4 font-sans">
                                    <div className="bg-brand-green-muted p-4 rounded-2xl shadow-clay-xs border border-white">
                                        <p className="text-base text-brand-green font-bold mb-1">행운의 색상</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-brand-green shadow-inner" />
                                            <span className="text-lg font-bold text-gray-700">에메랄드 그린</span>
                                        </div>
                                    </div>
                                    <div className="bg-brand-orange-muted p-4 rounded-2xl shadow-clay-xs border border-white">
                                        <p className="text-base text-brand-orange-dark font-bold mb-1">행운의 숫자</p>
                                        <span className="text-xl font-bold text-gray-700">4, 8</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>

                {/* 역사적 인물 매칭 */}
                <GlassCard className="p-8 border-4 border-white rounded-[40px] shadow-clay-md bg-gradient-to-br from-amber-50/80 to-white/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-clay-xs">👑</div>
                        <h3 className="font-bold text-[26px] text-gray-800 font-display">닮은 역사적 인물</h3>
                    </div>
                    <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-clay-sm flex-shrink-0">
                            <img 
                                src={HISTORICAL_MATCH.image} 
                                alt={HISTORICAL_MATCH.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-2xl text-amber-800 mb-2 font-display">
                                {HISTORICAL_MATCH.name}
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {HISTORICAL_MATCH.desc}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
