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
    onTabChange?: (tab: "overall" | "pairs") => void;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({
    groupMembers = [],
    groupAnalysisResult = null,
    onViewRanking,
    onTabChange,
}) => {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            <GroupResult
                groupMembers={groupMembers}
                groupAnalysisResult={groupAnalysisResult}
                onViewRanking={onViewRanking}
                onTabChange={onTabChange}
            />
        </div>
    );
};