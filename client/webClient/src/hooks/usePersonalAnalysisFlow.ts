import { useState, useRef, useCallback, type MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";
import type { FaceAnalysisApiResponse, TotalReview } from "@/services/faceAnalysisApi";
import {
  analyzeFaceFirstInitial,
  analyzeFaceFirstRemaining,
  analyzeFaceSecond,
  type FaceRequestData,
} from "@/services/faceAnalysisApi";
import {
  createPersonalAnalysisPlaceholder,
  updatePersonalAnalysis,
  type PersonalAnalysisData,
} from "@/services/personalAnalysisApi";
import { ROUTES, isPhotoBoothPath } from "@/routes/routes";
import type { SajuData } from "@/types";
import { devError, devWarn } from "@/utils/logger";

export interface UsePersonalAnalysisFlowOptions {
  setIsAnalyzing: (v: boolean) => void;
  setAnalysisError: (v: string | null) => void;
  setAnalysisDone: (v: boolean) => void;
  setImages: (v: string[]) => void;
  setFeatures: (v: string[]) => void;
  setSaju: (v: SajuData) => void;
  setFaceMeshMetadata: (v: import("@/types").AnalysisMetadata) => void;
  setShowAnalysisCompleteToast: (v: boolean) => void;
  pathnameRef: MutableRefObject<string>;
}

/**
 * 개인 관상 분석 플로우 전용 상태·ref·로직.
 * isAnalyzing, analysisError는 App과 공유하므로 options로 setter만 받음.
 */
export function usePersonalAnalysisFlow(options: UsePersonalAnalysisFlowOptions) {
  const navigate = useNavigate();
  const {
    setIsAnalyzing,
    setAnalysisError,
    setAnalysisDone,
    setImages,
    setFeatures,
    setSaju,
    setFaceMeshMetadata,
    setShowAnalysisCompleteToast,
    pathnameRef,
  } = options;

  const [faceAnalysisResult, setFaceAnalysisResult] =
    useState<FaceAnalysisApiResponse | null>(null);
  const [loadingRemaining, setLoadingRemaining] = useState(false);
  const [loadingConstitution, setLoadingConstitution] = useState(false);
  const [currentPersonalUuid, setCurrentPersonalUuid] = useState<string | null>(null);

  const personalAnalyzingRef = useRef(false);
  const firstSavePromiseRef = useRef<Promise<void> | null>(null);

  const startPersonalAnalysis = useCallback(
    async (
      capturedImages: string[],
      selectedFeatures: string[],
      sajuData: SajuData,
      metadata?: import("@/types").AnalysisMetadata
    ) => {
      if (personalAnalyzingRef.current) return;
      personalAnalyzingRef.current = true;

      setAnalysisDone(false);
      setAnalysisError(null);
      setFaceAnalysisResult(null);
      setImages(capturedImages);
      setFeatures(selectedFeatures);
      setSaju(sajuData);
      if (metadata) setFaceMeshMetadata(metadata);

      setIsAnalyzing(true);
      try {
        const uuid = await createPersonalAnalysisPlaceholder();
        setCurrentPersonalUuid(uuid);

        navigate(ROUTES.ANALYZING);

        const faces = metadata && "faces" in metadata && Array.isArray(metadata.faces) ? metadata.faces : null;
        if (faces && faces.length > 0) {
          const birthTime = sajuData.birthTimeUnknown
            ? ""
            : (sajuData.birthTime && String(sajuData.birthTime).trim()) || "00:00";
          const requestData: FaceRequestData = {
            timestamp: new Date().toISOString(),
            faces: faces as FaceRequestData["faces"],
            sajuData: {
              gender: sajuData.gender as "male" | "female",
              calendarType: sajuData.calendarType as "solar" | "lunar",
              birthDate: sajuData.birthDate,
              birthTime,
              birthTimeUnknown: sajuData.birthTimeUnknown,
            },
          };

          setLoadingRemaining(true);
          setLoadingConstitution(true);

          const firstInitialPromise = analyzeFaceFirstInitial(requestData);
          const firstRemainingPromise = analyzeFaceFirstRemaining(requestData);
          const secondPromise = analyzeFaceSecond(requestData);

          const initialResult = await firstInitialPromise;
          if (initialResult.error) {
            setAnalysisError(initialResult.error);
            setLoadingRemaining(false);
            setLoadingConstitution(false);
            setIsAnalyzing(false);
            personalAnalyzingRef.current = false;
            return;
          }

          const initialTotalReview: TotalReview = {
            faceOverview: initialResult.totalReview?.faceOverview,
          };
          setFaceAnalysisResult({
            stage1: initialResult.stage1,
            totalReview: initialTotalReview,
          });

          const saveData: PersonalAnalysisData = {
            faceAnalysis: {
              faceShape: initialResult.stage1?.faceAnalysis?.faceShape,
              forehead: initialResult.stage1?.faceAnalysis?.forehead,
              eyes: initialResult.stage1?.faceAnalysis?.eyes,
              nose: initialResult.stage1?.faceAnalysis?.nose,
              mouth: initialResult.stage1?.faceAnalysis?.mouth,
              chin: initialResult.stage1?.faceAnalysis?.chin,
              faceOverview: initialResult.totalReview?.faceOverview,
            },
            constitutionAnalysis: {
              sajuInfo: initialResult.stage1?.sajuInfo,
              totalReview: initialTotalReview,
            },
          };
          const firstSavePromise = updatePersonalAnalysis(uuid, saveData).catch((saveError) => {
            devError("1차(총평) 분석 결과 DB 저장 실패:", saveError);
          });
          firstSavePromiseRef.current = firstSavePromise;

          setAnalysisDone(true);
          setIsAnalyzing(false);
          personalAnalyzingRef.current = false;
          if (isPhotoBoothPath(pathnameRef.current)) {
            setShowAnalysisCompleteToast(true);
          } else {
            navigate(`/personal/${uuid}`);
          }

          firstRemainingPromise
            .then(async (remainingResult) => {
              setLoadingRemaining(false);
              if (!remainingResult.success) {
                devWarn("나머지 관상(first-remaining) 분석 실패:", remainingResult.error);
                return;
              }
              setFaceAnalysisResult((prev: FaceAnalysisApiResponse | null) => {
                if (!prev) return prev;
                const next = {
                  ...prev,
                  totalReview: {
                    ...prev.totalReview,
                    lifeReview: remainingResult.totalReview?.lifeReview,
                    careerFortune: remainingResult.totalReview?.careerFortune,
                    meetingCompatibility: remainingResult.totalReview?.meetingCompatibility,
                  },
                };
                updatePersonalAnalysis(uuid, {
                  faceAnalysis: {
                    faceShape: prev.stage1?.faceAnalysis?.faceShape,
                    forehead: prev.stage1?.faceAnalysis?.forehead,
                    eyes: prev.stage1?.faceAnalysis?.eyes,
                    nose: prev.stage1?.faceAnalysis?.nose,
                    mouth: prev.stage1?.faceAnalysis?.mouth,
                    chin: prev.stage1?.faceAnalysis?.chin,
                    faceOverview: prev.totalReview?.faceOverview,
                    careerFortune: remainingResult.totalReview?.careerFortune,
                    lifeReview: remainingResult.totalReview?.lifeReview,
                    meetingCompatibility: remainingResult.totalReview?.meetingCompatibility,
                  },
                  constitutionAnalysis: {
                    sajuInfo: prev.stage1?.sajuInfo,
                    totalReview: next.totalReview,
                  },
                }).catch((err) => devError("나머지 관상 DB 저장 실패:", err));
                return next;
              });
            })
            .catch((err) => {
              setLoadingRemaining(false);
              devError("나머지 관상 처리 오류:", err);
            });

          secondPromise
            .then(async (secondResult) => {
              setLoadingConstitution(false);
              if (!secondResult.success) {
                devWarn("2차(체질/메뉴) 분석 실패:", secondResult.error);
                return;
              }
              setFaceAnalysisResult((prev: FaceAnalysisApiResponse | null) => {
                if (!prev) return prev;
                const next = {
                  ...prev,
                  totalReview: {
                    ...prev.totalReview,
                    constitutionSummary: secondResult.totalReview?.constitutionSummary,
                    welstoryMenus: secondResult.totalReview?.welstoryMenus,
                    recommendedMenu: secondResult.totalReview?.recommendedMenu,
                  },
                };
                updatePersonalAnalysis(uuid, {
                  faceAnalysis: {
                    faceShape: prev.stage1?.faceAnalysis?.faceShape,
                    forehead: prev.stage1?.faceAnalysis?.forehead,
                    eyes: prev.stage1?.faceAnalysis?.eyes,
                    nose: prev.stage1?.faceAnalysis?.nose,
                    mouth: prev.stage1?.faceAnalysis?.mouth,
                    chin: prev.stage1?.faceAnalysis?.chin,
                    faceOverview: prev.totalReview?.faceOverview,
                    careerFortune: prev.totalReview?.careerFortune,
                    lifeReview: prev.totalReview?.lifeReview,
                    meetingCompatibility: prev.totalReview?.meetingCompatibility,
                  },
                  constitutionAnalysis: {
                    sajuInfo: prev.stage1?.sajuInfo,
                    totalReview: next.totalReview,
                  },
                }).catch((err) => devError("체질/메뉴 DB 저장 실패:", err));
                return next;
              });
            })
            .catch((err) => {
              setLoadingConstitution(false);
              devError("2차 분석 처리 오류:", err);
            });
        } else {
          setAnalysisError("얼굴 분석 데이터가 없습니다. 다시 촬영해주세요.");
          setIsAnalyzing(false);
          personalAnalyzingRef.current = false;
        }
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
        );
        setIsAnalyzing(false);
        personalAnalyzingRef.current = false;
      }
    },
    [
      setIsAnalyzing,
      setAnalysisError,
      setAnalysisDone,
      setImages,
      setFeatures,
      setSaju,
      setFaceMeshMetadata,
      setShowAnalysisCompleteToast,
      pathnameRef,
      navigate,
    ]
  );

  return {
    faceAnalysisResult,
    setFaceAnalysisResult,
    loadingRemaining,
    setLoadingRemaining,
    loadingConstitution,
    setLoadingConstitution,
    currentPersonalUuid,
    setCurrentPersonalUuid,
    personalAnalyzingRef,
    firstSavePromiseRef,
    startPersonalAnalysis,
  };
}
