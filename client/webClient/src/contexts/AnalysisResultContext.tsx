import React, { createContext, useContext } from "react";
import type { GroupAnalysisSectionProps } from "@/features/group/GroupAnalysisSection";
import type { AnalysisSectionProps } from "@/features/personal/AnalysisSection";

export interface AnalysisResultContextValue {
  groupProps: GroupAnalysisSectionProps;
  personalProps: AnalysisSectionProps;
}

const AnalysisResultContext = createContext<AnalysisResultContextValue | null>(null);

export function AnalysisResultProvider({
  value,
  children,
}: {
  value: AnalysisResultContextValue;
  children: React.ReactNode;
}) {
  return (
    <AnalysisResultContext.Provider value={value}>
      {children}
    </AnalysisResultContext.Provider>
  );
}

export function useAnalysisResult(): AnalysisResultContextValue {
  const ctx = useContext(AnalysisResultContext);
  if (!ctx) {
    throw new Error("useAnalysisResult must be used within AnalysisResultProvider");
  }
  return ctx;
}

/** 공유 페이지 등 Provider 밖에서 사용할 수 있을 때; 없으면 null */
export function useAnalysisResultOptional(): AnalysisResultContextValue | null {
  return useContext(AnalysisResultContext);
}
