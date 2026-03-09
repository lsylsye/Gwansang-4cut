import { useState, useRef, useEffect } from "react";
import { devError } from "@/utils/logger";
import type { SajuData, AnalysisMetadata } from "@/types";
import { analyzePersonalImage } from "../utils/groupPhotoFaceDetection";
import { useTurtleGuideState } from "@/contexts/TurtleGuideStateContext";

export interface UsePersonalUploadFlowOptions {
  onAnalyze: (
    images: string[],
    features: string[],
    sajuData: SajuData,
    groupMembers?: undefined,
    faceMeshMetadata?: AnalysisMetadata,
  ) => void;
  /** 상위에서 분석 진행 중이면 true (제출 버튼 비활성) */
  isPersonalAnalyzing?: boolean;
}

/** 개인 촬영 단계 정보 (overlay는 PersonalUpload에서 JSX로 렌더) */
export const PERSONAL_CAPTURE_STEP = {
  id: "front",
  title: "정면 촬영",
  guide: "얼굴 정면을 가이드에 맞춰주세요",
} as const;

export function usePersonalUploadFlow(options: UsePersonalUploadFlowOptions) {
  const { onAnalyze, isPersonalAnalyzing = false } = options;

  const { setPersonalUploadSajuStep, setPersonalUploadCameraVisible } = useTurtleGuideState();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [capturedImages, setCapturedImages] = useState<(string | null)[]>([null]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [sajuData, setSajuData] = useState<SajuData>({
    birthDate: "",
    birthTime: "",
    gender: "male",
    calendarType: "solar",
    birthTimeUnknown: false,
  });
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<AnalysisMetadata>(null);
  const [showSajuInput, setShowSajuInput] = useState(false);
  const [isPersonalUploadAnalyzing, setIsPersonalUploadAnalyzing] = useState(false);
  const [cameFromPersonalFileUpload, setCameFromPersonalFileUpload] = useState(false);
  const [isPersonalUploadModalOpen, setIsPersonalUploadModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setIsPersonalUploadAnalyzing(true);
      (async () => {
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const metadataPromise = analyzePersonalImage(result);
        await Promise.all([metadataPromise, delay(3000)]);
        const metadata = await metadataPromise;
        setCapturedImages([result]);
        setFaceMeshMetadata(metadata);
        setIsCapturing(false);
        setIsPersonalUploadAnalyzing(false);
        setCameFromPersonalFileUpload(true);
      })();
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    if (capturedImages[0] && !showSajuInput) {
      setShowSajuInput(true);
    } else if (showSajuInput) {
      try {
        localStorage.removeItem("photoBoothSets_personal");
      } catch (err) {
        devError("이전 촬영 데이터 삭제 실패:", err);
      }
      onAnalyze(
        capturedImages as string[],
        [],
        sajuData,
        undefined,
        faceMeshMetadata,
      );
    }
  };

  const handleRetake = () => {
    setCapturedImages([null]);
    setFaceMeshMetadata(null);
    setCurrentStep(0);
    setIsCapturing(true);
    setShowSajuInput(false);
    setCameFromPersonalFileUpload(false);
  };

  useEffect(() => {
    setIsScanning(isCapturing);
  }, [isCapturing]);

  useEffect(() => {
    setPersonalUploadSajuStep(showSajuInput);
  }, [showSajuInput, setPersonalUploadSajuStep]);

  useEffect(() => {
    const cameraVisible = currentStep === 0 && !showSajuInput && isCapturing;
    setPersonalUploadCameraVisible(cameraVisible);
  }, [currentStep, showSajuInput, isCapturing, setPersonalUploadCameraVisible]);

  const canProceed =
    capturedImages[0] !== null && (showSajuInput ? sajuData.birthDate !== "" : true);

  return {
    fileInputRef,
    capturedImages,
    setCapturedImages,
    currentStep,
    isCapturing,
    setIsCapturing,
    sajuData,
    setSajuData,
    showSajuInput,
    setShowSajuInput,
    faceMeshMetadata,
    setFaceMeshMetadata,
    isPersonalUploadAnalyzing,
    cameFromPersonalFileUpload,
    isPersonalUploadModalOpen,
    setIsPersonalUploadModalOpen,
    setCameFromPersonalFileUpload,
    isScanning,
    handleFileUpload,
    handleNextStep,
    handleRetake,
    canProceed,
    isPersonalAnalyzing,
  };
}
