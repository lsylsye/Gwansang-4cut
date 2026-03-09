import React from "react";
import { motion } from "motion/react";
import { PhotoBoothSection, type PhotoBoothSectionProps } from "@/features/photo/components/PhotoBoothSection";

/**
 * 사진부스 라우트 전용 페이지 (/photo-booth).
 */
export function PhotoBoothPage(props: PhotoBoothSectionProps) {
  return (
    <motion.div
      key="photo-booth"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
      <PhotoBoothSection {...props} />
    </motion.div>
  );
}
