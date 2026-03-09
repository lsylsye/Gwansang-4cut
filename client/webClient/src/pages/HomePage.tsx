import React from "react";
import { motion } from "motion/react";
import { LandingSection } from "@/features/landing/components/LandingSection";
import type { AnalyzeMode } from "@/types";

interface HomePageProps {
  onStart: (mode: AnalyzeMode) => void;
}

/**
 * 홈(랜딩) 라우트 전용 페이지.
 * App에서 라우트별 블록을 페이지 단위로 분리한 첫 번째 단계.
 */
export function HomePage({ onStart }: HomePageProps) {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
      <LandingSection onStart={onStart} />
    </motion.div>
  );
}
