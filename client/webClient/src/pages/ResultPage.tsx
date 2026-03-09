import React from "react";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { GroupAnalysisSection } from "@/features/group/GroupAnalysisSection";
import { AnalysisSection } from "@/features/personal/AnalysisSection";
import { useAnalysisResult } from "@/contexts/AnalysisResultContext";

/**
 * 결과 라우트 전용 페이지 (/personal/result, /group/result).
 * pathname에 따라 개인 결과 또는 그룹 결과 Section을 렌더.
 * groupProps / personalProps는 AnalysisResultContext에서 구독.
 */
export function ResultPage() {
  const { pathname } = useLocation();
  const { groupProps, personalProps } = useAnalysisResult();
  const isGroupResult = pathname === ROUTES.GROUP_RESULT;
  return (
    <motion.div
      key={isGroupResult ? "group-result" : "personal-result"}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
      {isGroupResult ? (
        <GroupAnalysisSection {...groupProps} />
      ) : (
        <AnalysisSection {...personalProps} />
      )}
    </motion.div>
  );
}
