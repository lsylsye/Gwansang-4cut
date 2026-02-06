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
    /** 분석 진행 중 여부. true이면 결과 미도착 시 로딩 표시 */
    isAnalyzing?: boolean;
    onViewRanking?: (score: number, defaultName: string) => void;
    /** 이미 랭킹 등록된 상태에서 '랭킹 보기' 클릭 시 (등록 폼 없이 목록만) */
    onViewRankingViewOnly?: () => void;
    /** 랭킹 등록 완료 여부 (버튼 문구: '랭킹 보기' vs '랭킹 등록하기') */
    hasRegisteredRanking?: boolean;
    /** 탭 변경 시 TurtleGuide 멘트용 */
    onTabChange?: (tab: "overall" | "pairs" | "ssafy-cut") => void;
    /** 싸피네컷(네컷) 페이지로 이동 (개인 결과처럼 결과 페이지에서 진입용) */
    onNavigateToPhotoBooth?: () => void;
    /** 분석 시작 시 생성된 UUID (분석하기 버튼 누르면 이미 저장됨) */
    analysisUuid?: string | null;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({
    groupMembers = [],
    groupAnalysisResult = null,
    isAnalyzing = false,
    onViewRanking,
    onViewRankingViewOnly,
    hasRegisteredRanking = false,
    onTabChange,
    onNavigateToPhotoBooth,
    analysisUuid,
}) => {
    return (
        <div className="w-full min-w-0">
            <GroupResult
                groupMembers={groupMembers}
                groupAnalysisResult={groupAnalysisResult}
                isAnalyzing={isAnalyzing}
                onViewRanking={onViewRanking}
                onViewRankingViewOnly={onViewRankingViewOnly}
                hasRegisteredRanking={hasRegisteredRanking}
                onTabChange={onTabChange}
                onNavigateToPhotoBooth={onNavigateToPhotoBooth}
                analysisUuid={analysisUuid}
            />
        </div>
    );
};