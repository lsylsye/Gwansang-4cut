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

type Strength = "veryDark" | "dark" | "normal" | "light" | "none";

/** 오행별 색상 (톤다운된 버전 - 채도 낮춤) */
const OHENG_COLORS: Record<string, Record<Strength, { bg: string; border: string; text: string }>> = {
    wood: {
        none: { bg: "#F5F5F5", border: "#E0E0E0", text: "#757575" }, // 연한 회색
        light: { bg: "#F1F8F4", border: "#E8F5E9", text: "#4A7C59" },
        normal: { bg: "#81C784", border: "#66BB6A", text: "#FFFFFF" },
        dark: { bg: "#4CAF50", border: "#388E3C", text: "#FFFFFF" },
        veryDark: { bg: "#2E7D32", border: "#1B5E20", text: "#FFFFFF" },
    },
    fire: {
        none: { bg: "#F5F5F5", border: "#E0E0E0", text: "#757575" },
        light: { bg: "#FCE4EC", border: "#FFEBEE", text: "#AD1457" },
        normal: { bg: "#E57373", border: "#EF5350", text: "#FFFFFF" },
        dark: { bg: "#D32F2F", border: "#C62828", text: "#FFFFFF" },
        veryDark: { bg: "#C2185B", border: "#B71C1C", text: "#FFFFFF" },
    },
    earth: {
        none: { bg: "#F5F5F5", border: "#E0E0E0", text: "#757575" },
        light: { bg: "#EFEBE9", border: "#BCAAA4", text: "#6D4C41" },
        normal: { bg: "#A1887F", border: "#8D6E63", text: "#FFFFFF" },
        dark: { bg: "#6D4C41", border: "#5D4037", text: "#FFFFFF" },
        veryDark: { bg: "#4E342E", border: "#3E2723", text: "#FFFFFF" },
    },
    metal: {
        none: { bg: "#F5F5F5", border: "#E0E0E0", text: "#757575" },
        light: { bg: "#ECEFF1", border: "#90A4AE", text: "#546E7A" },
        normal: { bg: "#78909C", border: "#607D8B", text: "#FFFFFF" },
        dark: { bg: "#546E7A", border: "#455A64", text: "#FFFFFF" },
        veryDark: { bg: "#37474F", border: "#263238", text: "#FFFFFF" },
    },
    water: {
        none: { bg: "#F5F5F5", border: "#E0E0E0", text: "#757575" },
        light: { bg: "#E1F5FE", border: "#E3F2FD", text: "#0277BD" },
        normal: { bg: "#64B5F6", border: "#42A5F5", text: "#FFFFFF" },
        dark: { bg: "#1976D2", border: "#1565C0", text: "#FFFFFF" },
        veryDark: { bg: "#0D47A1", border: "#0A3D7A", text: "#FFFFFF" },
    },
};

function getStrength(count: number): Strength {
    if (count === 0) return "none";
    if (count >= 5) return "veryDark";
    if (count >= 3) return "dark";
    if (count === 2) return "normal";
    return "light"; // count === 1
}

const strengthLabel: Record<Strength, string> = {
    veryDark: "매우 진함",
    dark: "진함",
    normal: "기본",
    light: "밝음",
    none: "없음",
};

const OHENG_LABELS: { key: keyof OhengCounts; label: string; short: string; colorKey: keyof typeof OHENG_COLORS }[] = [
    { key: "wood", label: "목(木)", short: "목", colorKey: "wood" },
    { key: "fire", label: "화(火)", short: "화", colorKey: "fire" },
    { key: "earth", label: "토(土)", short: "토", colorKey: "earth" },
    { key: "metal", label: "금(金)", short: "금", colorKey: "metal" },
    { key: "water", label: "수(水)", short: "수", colorKey: "water" },
];

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
                                {OHENG_LABELS.map(({ key, label, colorKey }, index) => {
                                    const count = counts[key];
                                    const strength = getStrength(count);
                                    const colors = OHENG_COLORS[colorKey][strength];
                                    return (
                                        <div
                                            key={key}
                                            ref={buttonRefs[index]}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-[2.5px] bg-transparent transition-colors duration-200"
                                            style={{
                                                borderColor: colors.border,
                                                color: colors.border,
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
