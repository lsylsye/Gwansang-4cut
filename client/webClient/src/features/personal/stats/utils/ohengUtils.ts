import type { OhengCounts } from "../components/FiveElementsDisplay";

/** 한글 오행 라벨 */
export const OHENG_LABELS: Record<keyof OhengCounts, string> = {
    wood: "목(木)",
    fire: "화(火)",
    earth: "토(土)",
    metal: "금(金)",
    water: "수(水)",
};

/** API fiveElements(한글 키) → OhengCounts */
export function fiveElementsToOheng(fe: Record<string, number> | undefined): OhengCounts | undefined {
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
export function ohengParticle(key: keyof OhengCounts): string {
    return key === "wood" || key === "metal" ? "이" : "가";
}

/** 오행 접속: 목·금 → '과', 화·토·수 → '와' */
export function ohengConjunction(key: keyof OhengCounts): string {
    return key === "wood" || key === "metal" ? "과" : "와";
}

/** 오행 개수로 가장 많은/적은 오행 키와 체질 요약 문구 */
export function getOhengHead(oheng: OhengCounts): {
    head: string;
    strongKey: keyof OhengCounts;
    weakKey: keyof OhengCounts;
} {
    const entries = (Object.entries(oheng) as [keyof OhengCounts, number][]).sort((a, b) => b[1] - a[1]);
    const strongKey = entries[0][0];
    const weakKey = entries[entries.length - 1][0];
    const top2 = entries.slice(0, 2).filter(([, v]) => v > 0);
    const label = (k: keyof OhengCounts) => OHENG_LABELS[k].replace(/\(.*\)/, "").trim();
    const head =
        top2.length >= 2 && top2[0][1] === top2[1][1]
            ? `${label(top2[0][0])}${ohengConjunction(top2[0][0])} ${label(top2[1][0])}${ohengParticle(top2[1][0])} 중심인 체질`
            : `${label(strongKey)}${ohengParticle(strongKey)} 중심인 체질`;
    return { head, strongKey, weakKey };
}
