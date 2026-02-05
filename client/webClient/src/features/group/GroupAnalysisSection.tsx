import React from "react";
import { GroupMember } from "@/shared/types";
import { GroupResult } from "./result/components/GroupResult";

/** 모임 궁합 API 응답 (members + groupCombination). 프론트 렌더링용 */
export type GroupAnalysisResult = {
    success: boolean;
    members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
    groupCombination?: string;
} | null;

interface GroupAnalysisSectionProps {
    groupMembers?: GroupMember[];
    /** 모임 궁합 API 응답. 연결 후 결과 화면에서 데이터 렌더링에 사용 */
    groupAnalysisResult?: GroupAnalysisResult;
    onViewRanking?: (score: number, defaultName: string) => void;
    /** 탭 변경 시 TurtleGuide 멘트용 */
    onTabChange?: (tab: "overall" | "pairs" | "ssafy-cut") => void;
    /** 싸피네컷(네컷) 페이지로 이동 (개인 결과처럼 결과 페이지에서 진입용) */
    onNavigateToPhotoBooth?: () => void;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({
    groupMembers = [],
    groupAnalysisResult = null,
    onViewRanking,
    onTabChange,
    onNavigateToPhotoBooth,
}) => {
    return (
        <div className="w-full min-w-0">
            <GroupResult
                groupMembers={groupMembers}
                groupAnalysisResult={groupAnalysisResult}
                onViewRanking={onViewRanking}
                onTabChange={onTabChange}
                onNavigateToPhotoBooth={onNavigateToPhotoBooth}
            />
        </div>
    );
};