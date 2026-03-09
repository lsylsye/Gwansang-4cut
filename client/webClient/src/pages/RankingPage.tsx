import React from "react";
import { motion } from "motion/react";
import { RankingSection, type RankingSectionProps } from "@/features/ranking/components/RankingSection";

/**
 * 랭킹 라우트 전용 페이지 (/ranking).
 */
export function RankingPage(props: RankingSectionProps) {
  return (
    <motion.div
      key="ranking"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full"
    >
      <RankingSection {...props} />
    </motion.div>
  );
}
