import React, { useState, useRef, useEffect } from "react";
import { ConstitutionTab } from "./ConstitutionTab";
import { FutureTab } from "./FutureTab";
import type { ConstitutionPhase } from "../data/constitutionData";
import type { SajuInfo, TotalReview } from "@/services/faceAnalysisApi";

export type { ConstitutionPhase };

export interface StatsAnalysisProps {
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

    // 마운트 시점의 체질 phase (다른 탭 갔다가 복귀 시 마운트면 select/result일 수 있음)
    const initialConstitutionPhaseRef = useRef<ConstitutionPhase | null>(null);
    if (tab === "constitution" && initialConstitutionPhaseRef.current === null) {
        initialConstitutionPhaseRef.current = constitutionPhase;
    }

    // 체질 탭을 벗어날 때 result였으면 복귀 시 타입라이터 스킵
    const hasBeenOnResultViewRef = useRef(false);
    const prevTabRef = useRef(tab);
    useEffect(() => {
        if (prevTabRef.current === "constitution" && tab !== "constitution" && constitutionPhase === "result") {
            hasBeenOnResultViewRef.current = true;
        }
        prevTabRef.current = tab;
    }, [tab, constitutionPhase]);

    const isConstitutionReturning =
        isControlled &&
        (constitutionPhase === "result" || constitutionPhase === "select") &&
        (initialConstitutionPhaseRef.current === "result" ||
            initialConstitutionPhaseRef.current === "select" ||
            hasBeenOnResultViewRef.current);

    if (tab === "constitution") {
        return (
            <ConstitutionTab
                sajuInfo={sajuInfo}
                totalReview={totalReview}
                loadingConstitution={loadingConstitution}
                constitutionPhase={constitutionPhase}
                setConstitutionPhase={setConstitutionPhase}
                selectedMenuIdx={selectedMenuIdx}
                setSelectedMenuIdx={setSelectedMenuIdx}
                isConstitutionReturning={isConstitutionReturning}
            />
        );
    }

    if (tab === "future") {
        return (
            <FutureTab
                futureImage={futureImage}
                onFutureImageUpload={onFutureImageUpload}
            />
        );
    }

    return null;
};
