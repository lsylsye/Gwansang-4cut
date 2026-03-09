import React from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { AnalyzingSection } from "@/features/upload/components/AnalyzingSection";
import { GroupAnalysisSection, type GroupAnalysisSectionProps } from "@/features/group/GroupAnalysisSection";
import { SharedGroupAnalysisSection } from "@/features/group/SharedGroupAnalysisSection";

export interface SharedGroupResultPageProps {
  pathname: string;
  currentGroupUuid: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisDone: boolean;
  groupAnalysisResult: unknown;
  onRetryAnalyzing: () => void;
  /** 분석 완료 후 본인 결과 표시 시 사용. null이면 SharedGroupAnalysisSection 표시 */
  groupSectionProps: GroupAnalysisSectionProps | null;
}

/**
 * 단체 분석 공유 결과 라우트 (/group/share/:uuid).
 * 본인 세션: 분석 중 → AnalyzingSection, 완료 → GroupAnalysisSection, 그 외 → SharedGroupAnalysisSection.
 * 타인 링크: SharedGroupAnalysisSection.
 */
export function SharedGroupResultPage({
  pathname,
  currentGroupUuid,
  isAnalyzing,
  analysisError,
  analysisDone,
  groupAnalysisResult,
  onRetryAnalyzing,
  groupSectionProps,
}: SharedGroupResultPageProps) {
  const { uuid } = useParams<"uuid">();
  const isCurrentUserSession =
    Boolean(currentGroupUuid) && Boolean(uuid) && currentGroupUuid === uuid;

  let content;
  if (!isCurrentUserSession) {
    content = <SharedGroupAnalysisSection />;
  } else if (isAnalyzing) {
    content = (
      <AnalyzingSection
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        analysisComplete={analysisDone}
        onRetry={onRetryAnalyzing}
      />
    );
  } else if (analysisDone && groupAnalysisResult && groupSectionProps) {
    content = <GroupAnalysisSection {...groupSectionProps} />;
  } else {
    content = <SharedGroupAnalysisSection />;
  }

  return (
    <motion.div
      key="shared-group-result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
      {content}
    </motion.div>
  );
}
