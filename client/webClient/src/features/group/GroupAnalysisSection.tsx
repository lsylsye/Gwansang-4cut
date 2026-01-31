import React from "react";
import { motion } from "motion/react";
import { GroupMember } from "@/shared/types";
import { GroupRelations } from "./relations/components/GroupRelations";
import { GroupResult } from "./result/components/GroupResult";
import { Sparkles } from "lucide-react";

interface GroupAnalysisSectionProps {
    groupMembers?: GroupMember[];
    groupImage?: string;
    onRestart: () => void;
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({ groupMembers = [], groupImage, onViewRanking }) => {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            {/* Header Section with Material Design elevation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center mb-12"
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-3 mb-4"
                >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-vibrant flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-display tracking-tight">
                        <span className="bg-gradient-to-r from-brand-orange to-brand-orange-vibrant bg-clip-text text-transparent">
                            모임 관상
                        </span>
                        <span className="text-gray-900"> 결과</span>
                    </h2>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-gray-600 font-sans max-w-2xl mx-auto"
                >
                    천기를 읽어 자네들의 인연을 점수화해 보았네!
                </motion.p>
            </motion.div>

            <GroupResult groupMembers={groupMembers} groupImage={groupImage} onViewRanking={onViewRanking} />

            {/* Relations Section with spacing */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
            >
                <GroupRelations groupMembers={groupMembers} />
            </motion.div>
        </div>
    );
};