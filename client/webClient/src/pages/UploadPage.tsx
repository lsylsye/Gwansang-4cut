import React from "react";
import { motion } from "motion/react";
import { UploadSection, type UploadSectionProps } from "@/features/upload/components/UploadSection";

/**
 * 업로드 라우트 전용 페이지 (개인/그룹 업로드, 그룹 멤버 입력).
 * App에서 라우트별 블록을 페이지 단위로 분리.
 */
export function UploadPage(props: UploadSectionProps) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
      <UploadSection {...props} />
    </motion.div>
  );
}
