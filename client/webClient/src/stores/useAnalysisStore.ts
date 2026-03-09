import { create } from "zustand";

interface AnalysisStore {
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisDone: boolean;
  showAnalysisCompleteToast: boolean;
  setIsAnalyzing: (v: boolean) => void;
  setAnalysisError: (v: string | null) => void;
  setAnalysisDone: (v: boolean) => void;
  setShowAnalysisCompleteToast: (v: boolean) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  isAnalyzing: false,
  analysisError: null,
  analysisDone: false,
  showAnalysisCompleteToast: false,
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysisError: (v) => set({ analysisError: v }),
  setAnalysisDone: (v) => set({ analysisDone: v }),
  setShowAnalysisCompleteToast: (v) => set({ showAnalysisCompleteToast: v }),
}));
