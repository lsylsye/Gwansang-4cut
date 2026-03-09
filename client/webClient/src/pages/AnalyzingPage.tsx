import React from "react";
import { motion } from "motion/react";
import { AnalyzingSection, type AnalyzingSectionProps } from "@/features/upload/components/AnalyzingSection";

/**
 * 분석 중 라우트 전용 페이지 (/analyzing).
 * App에서 라우트별 블록을 페이지 단위로 분리.
 */
export function AnalyzingPage(props: AnalyzingSectionProps) {
  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full"
    >
      <AnalyzingSection {...props} />
    </motion.div>
  );
}
