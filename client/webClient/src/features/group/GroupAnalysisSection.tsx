import React from "react";
import { GroupMember } from "@/shared/types";
import { GroupResult } from "./result/components/GroupResult";

interface GroupAnalysisSectionProps {
    groupMembers?: GroupMember[];
    onViewRanking?: (score: number, defaultName: string) => void;
}

export const GroupAnalysisSection: React.FC<GroupAnalysisSectionProps> = ({ groupMembers = [], onViewRanking }) => {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            <GroupResult groupMembers={groupMembers} onViewRanking={onViewRanking} />
        </div>
    );
};