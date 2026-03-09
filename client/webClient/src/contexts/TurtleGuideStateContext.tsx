import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/routes/routes";

interface TurtleGuideState {
  personalUploadSajuStep: boolean;
  personalUploadCameraVisible: boolean;
  groupUploadCameraVisible: boolean;
  personalResultTab: string | null;
  groupResultTab: "overall" | "pairs" | null;
  setPersonalUploadSajuStep: (v: boolean) => void;
  setPersonalUploadCameraVisible: (v: boolean) => void;
  setGroupUploadCameraVisible: (v: boolean) => void;
  setPersonalResultTab: (v: string | null) => void;
  setGroupResultTab: (v: "overall" | "pairs" | null) => void;
}

const TurtleGuideStateContext = createContext<TurtleGuideState | null>(null);

/** TurtleGuide 멘트 결정에 필요한 페이지별 UI 상태를 전역 관리 */
export function TurtleGuideStateProvider({ children }: { children: React.ReactNode }) {
  const [personalUploadSajuStep, setPersonalUploadSajuStep] = useState(false);
  const [personalUploadCameraVisible, setPersonalUploadCameraVisible] = useState(false);
  const [groupUploadCameraVisible, setGroupUploadCameraVisible] = useState(false);
  const [personalResultTab, setPersonalResultTab] = useState<string | null>(null);
  const [groupResultTab, setGroupResultTab] = useState<"overall" | "pairs" | null>(null);

  const { pathname } = useLocation();

  // 페이지 이탈 시 해당 상태 초기화
  useEffect(() => {
    if (pathname !== ROUTES.PERSONAL_RESULT) setPersonalResultTab(null);
    if (pathname !== ROUTES.GROUP_RESULT) setGroupResultTab(null);
    if (pathname !== ROUTES.PERSONAL_UPLOAD) {
      setPersonalUploadSajuStep(false);
      setPersonalUploadCameraVisible(false);
    }
    if (pathname !== ROUTES.GROUP_UPLOAD && pathname !== ROUTES.GROUP_UPLOAD_MEMBERS) {
      setGroupUploadCameraVisible(false);
    }
  }, [pathname]);

  return (
    <TurtleGuideStateContext.Provider
      value={{
        personalUploadSajuStep,
        setPersonalUploadSajuStep,
        personalUploadCameraVisible,
        setPersonalUploadCameraVisible,
        groupUploadCameraVisible,
        setGroupUploadCameraVisible,
        personalResultTab,
        setPersonalResultTab,
        groupResultTab,
        setGroupResultTab,
      }}
    >
      {children}
    </TurtleGuideStateContext.Provider>
  );
}

export function useTurtleGuideState(): TurtleGuideState {
  return (
    useContext(TurtleGuideStateContext) ?? {
      personalUploadSajuStep: false,
      personalUploadCameraVisible: false,
      groupUploadCameraVisible: false,
      personalResultTab: null,
      groupResultTab: null,
      setPersonalUploadSajuStep: () => {},
      setPersonalUploadCameraVisible: () => {},
      setGroupUploadCameraVisible: () => {},
      setPersonalResultTab: () => {},
      setGroupResultTab: () => {},
    }
  );
}
