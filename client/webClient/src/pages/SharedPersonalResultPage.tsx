import React from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { AnalyzingSection } from "@/features/upload/components/AnalyzingSection";
import { AnalysisSection, type AnalysisSectionProps } from "@/features/personal/AnalysisSection";
import { SharedAnalysisSection } from "@/features/personal/SharedAnalysisSection";

export interface SharedPersonalResultPageProps {
  pathname: string;
  currentPersonalUuid: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisDone: boolean;
  faceAnalysisResult: unknown;
  onRetryAnalyzing: () => void;
  /** 분석 완료 후 본인 결과 표시 시 사용. null이면 SharedAnalysisSection 표시 */
  analysisSectionProps: AnalysisSectionProps | null;
}

/**
 * 개인 분석 공유 결과 라우트 (/personal/:uuid).
 * 본인 세션: 분석 중 → AnalyzingSection, 완료 → AnalysisSection, 그 외 → SharedAnalysisSection.
 * 타인 링크: SharedAnalysisSection.
 */
export function SharedPersonalResultPage({
  pathname,
  currentPersonalUuid,
  isAnalyzing,
  analysisError,
  analysisDone,
  faceAnalysisResult,
  onRetryAnalyzing,
  analysisSectionProps,
}: SharedPersonalResultPageProps) {
  const { uuid } = useParams<"uuid">();
  const isCurrentUserSession =
    Boolean(currentPersonalUuid) && Boolean(uuid) && currentPersonalUuid === uuid;

  let content;
  if (!isCurrentUserSession) {
    content = <SharedAnalysisSection />;
  } else if (isAnalyzing) {
    content = (
      <AnalyzingSection
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        analysisComplete={analysisDone}
        onRetry={onRetryAnalyzing}
      />
    );
  } else if (analysisDone && faceAnalysisResult && analysisSectionProps) {
    content = <AnalysisSection {...analysisSectionProps} />;
  } else {
    content = <SharedAnalysisSection />;
  }

  return (
    <motion.div
      key="shared-result"
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
