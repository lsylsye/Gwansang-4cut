import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnalyzeMode, SajuData, GroupMember } from "@/types";
import { ConsentModal } from "./ConsentModal";
import { PersonalUpload } from "./PersonalUpload";
import { GroupUpload } from "./GroupUpload";

export interface UploadSectionProps {
  mode: AnalyzeMode;
  pathname?: string;
  onAnalyze: (
    images: string[],
    features: string[],
    sajuData: SajuData,
    groupMembers?: GroupMember[],
    faceMeshMetadata?: import("@/types").AnalysisMetadata,
  ) => void;
  isPersonalAnalyzing?: boolean;
  onNavigateToMembers?: (state?: { initialGroupMembers?: GroupMember[] }) => void;
  onNavigateToUpload?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  mode,
  pathname: pathnameProp = "",
  onAnalyze,
  isPersonalAnalyzing = false,
  onNavigateToMembers,
  onNavigateToUpload,
}) => {
  const location = useLocation();
  const pathname = pathnameProp || location.pathname;

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);

  const handleConsentAgree = () => {
    setHasConsented(true);
    setIsConsentModalOpen(false);
  };

  if (!hasConsented) {
    return (
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => {
          window.location.href = "/";
        }}
        onAgree={handleConsentAgree}
      />
    );
  }

  if (mode === "personal") {
    return (
      <PersonalUpload
        onAnalyze={onAnalyze}
        isPersonalAnalyzing={isPersonalAnalyzing}
      />
    );
  }

  if (mode === "group") {
    return (
      <GroupUpload
        pathname={pathname}
        onAnalyze={onAnalyze}
        onNavigateToMembers={onNavigateToMembers}
        onNavigateToUpload={onNavigateToUpload}
      />
    );
  }

  return null;
};
