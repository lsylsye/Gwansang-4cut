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
        light: { bg: "#FFF8E1", border: "#FFF3E0", text: "#E65100" },
        normal: { bg: "#FFB74D", border: "#FF9800", text: "#FFFFFF" },
        dark: { bg: "#F57C00", border: "#E65100", text: "#FFFFFF" },
        veryDark: { bg: "#E64A19", border: "#BF360C", text: "#FFFFFF" },
    },
    metal: {
        none: { bg: "#F5F5F5", border: "#E0E0E0", text: "#757575" },
        light: { bg: "#FAFAFA", border: "#F5F5F5", text: "#616161" },
        normal: { bg: "#BDBDBD", border: "#9E9E9E", text: "#FFFFFF" },
        dark: { bg: "#757575", border: "#616161", text: "#FFFFFF" },
        veryDark: { bg: "#424242", border: "#212121", text: "#FFFFFF" },
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
    className?: string;
}

export const FiveElementsDisplay: React.FC<FiveElementsDisplayProps> = ({
    counts,
    title = "오행 분포",
    className = "",
}) => {
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
                            <p className="text-brand-green font-bold text-base mb-4">불과 흙이 중심인 체질</p>
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                {OHENG_LABELS.map(({ key, label, colorKey }, index) => {
                                    const count = counts[key];
                                    const strength = getStrength(count);
                                    const colors = OHENG_COLORS[colorKey][strength];
                                    return (
                                        <div
                                            key={key}
                                            ref={buttonRefs[index]}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors duration-200"
                                            style={{
                                                backgroundColor: colors.bg,
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
