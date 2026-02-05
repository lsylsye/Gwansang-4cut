import React, { useRef } from "react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { OhengStarChart } from "./OhengStarChart";

/** 오행(목/화/토/금/수) 개수 — 백엔드에서 동일 구조로 내려주면 그대로 사용 */
export interface OhengCounts {
    wood: number;   // 목
    fire: number;   // 화
    earth: number;  // 토
    metal: number;  // 금
    water: number;  // 수
}

/** 오행 없음(0개)일 때만 사용 — 연한 회색 */
const NONE_STYLE = { border: "#E0E0E0", text: "#757575" } as const;

/** 오행별 고정 테두리/글자 색 (개수와 관계없이 1개 이상이면 동일 색상) */
const OHENG_FIXED_COLORS: Record<string, { border: string; text: string }> = {
    wood: { border: "#66BB6A", text: "#2E7D32" },   // 목 - 녹색
    fire: { border: "#EF5350", text: "#C62828" }, // 화 - 빨간색
    earth: { border: "#8D6E63", text: "#5D4037" }, // 토 - 갈색
    metal: { border: "#607D8B", text: "#37474F" }, // 금 - 슬레이트
    water: { border: "#42A5F5", text: "#1565C0" }, // 수 - 파란색
};

const OHENG_LABELS: { key: keyof OhengCounts; label: string; short: string; colorKey: keyof typeof OHENG_FIXED_COLORS }[] = [
    { key: "wood", label: "목(木)", short: "목", colorKey: "wood" },
    { key: "fire", label: "화(火)", short: "화", colorKey: "fire" },
    { key: "earth", label: "토(土)", short: "토", colorKey: "earth" },
    { key: "metal", label: "금(金)", short: "금", colorKey: "metal" },
    { key: "water", label: "수(水)", short: "수", colorKey: "water" },
];

/** 별 차트와 ref 매칭용 고정 순서 인덱스 */
const OHENG_REF_INDEX: Record<keyof OhengCounts, number> = {
    wood: 0, fire: 1, earth: 2, metal: 3, water: 4,
};

interface FiveElementsDisplayProps {
    /** 오행 개수 (백 연동 시 API 응답 그대로 전달) */
    counts: OhengCounts;
    /** 제목 (선택) */
    title?: string;
    /** 체질 요약 문구 (예: "불과 흙이 중심인 체질") — 없으면 counts 기반으로 표시 */
    headLabel?: string;
    className?: string;
}

/** 오행 조사: 목·금 → '이', 화·토·수 → '가' */
function ohengParticle(key: keyof OhengCounts): string {
    return key === "wood" || key === "metal" ? "이" : "가";
}
/** 오행 접속: 목·금 → '과', 화·토·수 → '와' */
function ohengConjunction(key: keyof OhengCounts): string {
    return key === "wood" || key === "metal" ? "과" : "와";
}

function getDefaultHeadLabel(counts: OhengCounts): string {
    const entries = (Object.entries(counts) as [keyof OhengCounts, number][]).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0 || entries[0][1] === 0) return "오행 분포";
    const top2 = entries.filter(([, v]) => v > 0).slice(0, 2);
    const labels: Record<keyof OhengCounts, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
    if (top2.length >= 2 && top2[0][1] === top2[1][1])
        return `${labels[top2[0][0]]}${ohengConjunction(top2[0][0])} ${labels[top2[1][0]]}${ohengParticle(top2[1][0])} 중심인 체질`;
    return `${labels[entries[0][0]]}${ohengParticle(entries[0][0])} 중심인 체질`;
}

export const FiveElementsDisplay: React.FC<FiveElementsDisplayProps> = ({
    counts,
    title = "오행 분포",
    headLabel,
    className = "",
}) => {
    const displayHead = headLabel ?? getDefaultHeadLabel(counts);
    // 각 버튼에 대한 ref 생성
    const buttonRefs = [
        useRef<HTMLDivElement>(null), // 목
        useRef<HTMLDivElement>(null), // 화
        useRef<HTMLDivElement>(null), // 토
        useRef<HTMLDivElement>(null), // 금
        useRef<HTMLDivElement>(null), // 수
    ];

    return (
        <GlassCard
            className={`p-6 sm:p-8 border border-gray-200 rounded-2xl bg-white/60 ${className}`}
        >
            {title && (
                <p className="text-gray-900 font-bold text-lg mb-4 font-display">{title}</p>
            )}
            
            {/* 전체를 감싸는 외곽 박스 */}
            <div className="bg-white/30">
                {/* 왼쪽: 별 그래프, 오른쪽: 오행 버튼들 */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-2 items-start md:items-center">
                    {/* 왼쪽: 오각형 별 그래프 */}
                    <div className="flex-shrink-0 w-full md:w-auto md:min-w-[320px] md:-ml-8">
                        <OhengStarChart counts={counts} buttonRefs={buttonRefs} />
                    </div>
                    
                    {/* 오른쪽: 오행 버튼들 (외곽 박스로 감싸기) */}
                    <div className="flex-1 w-full">
                        <div className="bg-white/40">
                            <p className="text-brand-green font-bold text-base mb-4">{displayHead}</p>
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                {[...OHENG_LABELS]
                                    .sort((a, b) => counts[b.key] - counts[a.key])
                                    .map(({ key, label, colorKey }) => {
                                    const count = counts[key];
                                    const isNone = count === 0;
                                    const colors = isNone ? NONE_STYLE : OHENG_FIXED_COLORS[colorKey];
                                    return (
                                        <div
                                            key={key}
                                            ref={buttonRefs[OHENG_REF_INDEX[key]]}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-[2.5px] bg-transparent transition-colors duration-200"
                                            style={{
                                                borderColor: colors.border,
                                                color: colors.text,
                                            }}
                                        >
                                            <span className="text-sm font-bold">{label}</span>
                                            <span className="text-sm font-bold tabular-nums">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-3 font-hand">
                                목·화·토·금·수 개수로 강한 기운과 약한 기운을 한눈에 볼 수 있어요.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
