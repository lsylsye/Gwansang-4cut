import React from "react";
import { motion } from "motion/react";
import { GroupMember } from "@/shared/types";
import { GroupRelations } from "./relations/components/GroupRelations";
import { GroupResult } from "./result/components/GroupResult";

interface GroupAnalysisSectionProps {
    groupMembers?: GroupMember[];
    groupImage?: string;
    onRestart: () => void;
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({ groupMembers = [], onRestart, onViewRanking }) => {
    return (
        <div className="w-full max-w-5xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-display">
                    <span className="text-[#FF7043]">모임 관상</span> 결과
                </h2>
                <p className="text-gray-500 font-sans">천기를 읽어 자네들의 인연을 점수화해 보았네!</p>
            </motion.div>

            <GroupResult onViewRanking={onViewRanking} />

            <div className="mt-8">
                <GroupRelations groupMembers={groupMembers} />
            </div>
        </div>
    );
};