import React, { useState, useEffect, useRef, useMemo } from "react";
import "./style/fonts.css";
import "./style/theme.css";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Layout } from "@/layouts/Layout";
import { AppHeader } from "@/layouts/AppHeader";
import { HomePage } from "@/pages/HomePage";
import { UploadPage } from "@/pages/UploadPage";
import { AnalyzingPage } from "@/pages/AnalyzingPage";
import { ResultPage } from "@/pages/ResultPage";
import { SharedPersonalResultPage } from "@/pages/SharedPersonalResultPage";
import { SharedGroupResultPage } from "@/pages/SharedGroupResultPage";
import { RankingPage } from "@/pages/RankingPage";
import { PhotoBoothPage } from "@/pages/PhotoBoothPage";
import { TurtleGuide } from "@/components/common/TurtleGuide";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { HideTurtleGuideProvider, useHideTurtleGuide } from "@/contexts/HideTurtleGuideContext";
import { TurtleGuideStateProvider, useTurtleGuideState } from "@/contexts/TurtleGuideStateContext";
import { AnalysisResultProvider } from "@/contexts/AnalysisResultContext";
import { Toast } from "@/components/common/Toast";
import { Toaster } from "sonner";
import {
  AnalyzeMode,
  SajuData,
  GroupMember,
  AnalysisMetadata,
} from "@/types";
import {
  ROUTES,
  getUploadPath,
  getAnalyzingPath,
  getResultPath,
  isPhotoBoothPath,
  isAnalyzingPath,
  isPersonalSharePath,
  isGroupSharePath,
} from "@/routes/routes";
import { getGuideMessage as getGuideMessageFromConfig } from "@/config/guideMessages";
import { usePersonalAnalysisFlow } from "@/hooks/usePersonalAnalysisFlow";
import { useGroupAnalysisFlow } from "@/hooks/useGroupAnalysisFlow";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [groupScore, setGroupScore] = useState(88);
  const [fromAnalysis, setFromAnalysis] = useState(false);
  /** 모임 결과에서 랭킹 등록 완료 여부 (돌아왔을 때 '랭킹 보기' 버튼 표시용) */
  const [hasRegisteredRanking, setHasRegisteredRanking] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [frameImageState, setFrameImageState] = useState<string | null>(null);
  const [fromPhotoBoothState, setFromPhotoBoothState] = useState(false);
  
  // API 응답 상태 관리 (isAnalyzing, analysisError는 개인/그룹 공유)
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisCompleteToast, setShowAnalysisCompleteToast] = useState(false);
  const [isPhotoBoothCapturing, setIsPhotoBoothCapturing] = useState(false);
  // faceMeshMetadata를 App에서 관리
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<AnalysisMetadata>(null);
  const pathnameRef = useRef(location.pathname);

  /** 개인 관상 분석 플로우 전용 상태·ref·로직 */
  const personalFlow = usePersonalAnalysisFlow({
    setIsAnalyzing,
    setAnalysisError,
    setAnalysisDone,
    setImages,
    setFeatures,
    setSaju,
    setFaceMeshMetadata,
    setShowAnalysisCompleteToast,
    pathnameRef,
  });

  /** 모임 궁합 분석 플로우 전용 상태·ref·로직 */
  const groupFlow = useGroupAnalysisFlow({
    setIsAnalyzing,
    setAnalysisError,
    setAnalysisDone,
    setImages,
    setFeatures,
    setSaju,
    setFaceMeshMetadata,
    setShowAnalysisCompleteToast,
    pathnameRef,
  });

  // pathname 바뀔 때: ref 갱신, 스크롤
  useEffect(() => {
    pathnameRef.current = location.pathname;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // location.state 변경 감지
  useEffect(() => {
    if (location.state?.frameImage) setFrameImageState(location.state.frameImage);
    if (location.state?.fromPhotoBooth) setFromPhotoBoothState(location.state.fromPhotoBooth);
  }, [location.state]);

  const handleStart = (selectedMode: AnalyzeMode) => {
    navigate(getUploadPath(selectedMode));
  };

  const handleAnalyze = async (
    capturedImages: string[],
    selectedFeatures: string[],
    sajuData: SajuData,
    members?: GroupMember[],
    metadata?: AnalysisMetadata,
  ) => {
    const isGroupFlow = Boolean(members && members.length > 0);

    if (!isGroupFlow) {
      await personalFlow.startPersonalAnalysis(
        capturedImages,
        selectedFeatures,
        sajuData,
        metadata
      );
      return;
    }

    await groupFlow.startGroupAnalysis(
      capturedImages,
      selectedFeatures,
      sajuData,
      members!,
      metadata
    );
  };

  const handleViewRanking = (score?: number, _name?: string) => {
    if (score !== undefined) setGroupScore(score);
    groupFlow.setUserTeamName(""); // 랭킹 등록 시 팀명은 빈 칸으로 (분석 결과 문구 안 불러옴)
    setFromAnalysis(true);
    navigate(ROUTES.RANKING);
  };

  /** 이미 랭킹 등록된 상태에서 '랭킹 보기' 클릭 시 — 등록 폼 없이 목록만 표시 */
  const handleViewRankingViewOnly = () => {
    setFromAnalysis(false);
    navigate(ROUTES.RANKING);
  };

  const handleRestart = () => {
    setImages([]);
    setFeatures([]);
    setSaju(null);
    groupFlow.setGroupMembers([]);
    groupFlow.setGroupAnalysisResult(null);
    setAnalysisDone(false);
    setHasRegisteredRanking(false);
    navigate(ROUTES.HOME);
  };

  const pathname = location.pathname;
  const mode: AnalyzeMode =
    pathname === ROUTES.PERSONAL_UPLOAD ? "personal"
    : (pathname === ROUTES.GROUP_UPLOAD || pathname === ROUTES.GROUP_UPLOAD_MEMBERS) ? "group"
    : "personal";
  const photoBoothMode: AnalyzeMode =
    (location.state as { mode?: AnalyzeMode } | null)?.mode ?? "personal";

  /** 결과 페이지용 Context value — App에서 일일이 props로 내려보내지 않고 Provider로 제공 */
  const analysisResultContextValue = useMemo(
    () => ({
      groupProps: {
        groupMembers: groupFlow.groupMembers,
        groupAnalysisResult: groupFlow.groupAnalysisResult,
        isAnalyzing,
        onViewRanking: handleViewRanking,
        onViewRankingViewOnly: handleViewRankingViewOnly,
        hasRegisteredRanking,
        onNavigateToPhotoBooth: () =>
          navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode: "group" } }),
        analysisUuid: groupFlow.currentGroupUuid,
      },
      personalProps: {
        images,
        onRestart: handleRestart,
        onNavigateToPhotoBooth: () =>
          navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode } }),
        frameImage: frameImageState || location.state?.frameImage,
        fromPhotoBooth: fromPhotoBoothState || location.state?.fromPhotoBooth,
        faceAnalysisResult: personalFlow.faceAnalysisResult?.stage1,
        totalReview: personalFlow.faceAnalysisResult?.totalReview,
        isLoading: isAnalyzing,
        loadingRemaining: personalFlow.loadingRemaining,
        loadingConstitution: personalFlow.loadingConstitution,
        analysisUuid: personalFlow.currentPersonalUuid,
        ensureSavedForShare: () => personalFlow.firstSavePromiseRef.current ?? Promise.resolve(),
      },
    }),
    [
      groupFlow.groupMembers,
      groupFlow.groupAnalysisResult,
      groupFlow.currentGroupUuid,
      personalFlow.faceAnalysisResult,
      personalFlow.loadingRemaining,
      personalFlow.loadingConstitution,
      personalFlow.currentPersonalUuid,
      isAnalyzing,
      hasRegisteredRanking,
      images,
      frameImageState,
      fromPhotoBoothState,
      location.state,
      mode,
    ]
  );

  const isPhotoBooth = isPhotoBoothPath(pathname);
  const shouldHideHeader = isPhotoBooth && isPhotoBoothCapturing;

  return (
    <Layout>
      <ErrorBoundary>
      <TurtleGuideStateProvider>
      <HideTurtleGuideProvider>
      {!shouldHideHeader && (
        <AppHeader
          onGoHome={() => navigate(ROUTES.HOME)}
          onGoRanking={() => {
            setFromAnalysis(false);
            navigate(ROUTES.RANKING);
          }}
        />
      )}

      <main className="flex-grow w-full relative">
        <div
          className={`container mx-auto py-8 min-h-[calc(100vh-64px)] ${pathname === ROUTES.GROUP_RESULT ? "px-0" : "px-4"}`}
        >
          <AnalysisResultProvider value={analysisResultContextValue}>
          <Routes>
            <Route path={ROUTES.HOME} element={<HomePage onStart={handleStart} />} />

            <Route
              path={ROUTES.PERSONAL_UPLOAD}
              element={
                <UploadPage
                  mode="personal"
                  pathname={ROUTES.PERSONAL_UPLOAD}
                  onAnalyze={handleAnalyze}
                  isPersonalAnalyzing={isAnalyzing}
                  onNavigateToMembers={(state) => navigate(ROUTES.GROUP_UPLOAD_MEMBERS, { state: state ?? {} })}
                  onNavigateToUpload={() => navigate(ROUTES.GROUP_UPLOAD)}
                />
              }
            />
            <Route
              path={ROUTES.GROUP_UPLOAD}
              element={
                <UploadPage
                  mode="group"
                  pathname={ROUTES.GROUP_UPLOAD}
                  onAnalyze={handleAnalyze}
                  isPersonalAnalyzing={isAnalyzing}
                  onNavigateToMembers={(state) => navigate(ROUTES.GROUP_UPLOAD_MEMBERS, { state: state ?? {} })}
                  onNavigateToUpload={() => navigate(ROUTES.GROUP_UPLOAD)}
                />
              }
            />
            <Route
              path={ROUTES.GROUP_UPLOAD_MEMBERS}
              element={
                <UploadPage
                  mode="group"
                  pathname={ROUTES.GROUP_UPLOAD_MEMBERS}
                  onAnalyze={handleAnalyze}
                  isPersonalAnalyzing={isAnalyzing}
                  onNavigateToMembers={(state) => navigate(ROUTES.GROUP_UPLOAD_MEMBERS, { state: state ?? {} })}
                  onNavigateToUpload={() => navigate(ROUTES.GROUP_UPLOAD)}
                />
              }
            />

            <Route
              path={ROUTES.ANALYZING}
              element={
                <AnalyzingPage
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisComplete={analysisDone}
                  onRetry={() => {
                    setAnalysisError(null);
                    navigate(getUploadPath(mode));
                  }}
                />
              }
            />

            <Route path={ROUTES.PERSONAL_RESULT} element={<ResultPage />} />
            <Route path={ROUTES.GROUP_RESULT} element={<ResultPage />} />

            <Route
              path={ROUTES.RANKING}
              element={
                <RankingPage
                  onBack={() => navigate(ROUTES.GROUP_RESULT)}
                  userScore={groupScore}
                  initialTeamName={groupFlow.userTeamName}
                  fromAnalysis={fromAnalysis}
                  memberNames={groupFlow.groupMembers.map((m) => m.name).filter(Boolean)}
                  onRankingRegistered={() => setHasRegisteredRanking(true)}
                />
              }
            />

            <Route
              path={ROUTES.PERSONAL_SHARE}
              element={
                <SharedPersonalResultPage
                  pathname={pathname}
                  currentPersonalUuid={personalFlow.currentPersonalUuid}
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisDone={analysisDone}
                  faceAnalysisResult={personalFlow.faceAnalysisResult}
                  onRetryAnalyzing={() => {
                    setAnalysisError(null);
                    personalFlow.setCurrentPersonalUuid(null);
                    navigate(getUploadPath("personal"));
                  }}
                  analysisSectionProps={
                    analysisDone && personalFlow.faceAnalysisResult
                      ? {
                          images,
                          onRestart: handleRestart,
                          onNavigateToPhotoBooth: () =>
                            navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode: "personal" } }),
                          frameImage: frameImageState || location.state?.frameImage,
                          fromPhotoBooth: fromPhotoBoothState || location.state?.fromPhotoBooth,
                          faceAnalysisResult: personalFlow.faceAnalysisResult?.stage1,
                          totalReview: personalFlow.faceAnalysisResult?.totalReview,
                          isLoading: false,
                          loadingRemaining: personalFlow.loadingRemaining,
                          loadingConstitution: personalFlow.loadingConstitution,
                          analysisUuid: personalFlow.currentPersonalUuid,
                          ensureSavedForShare: () => personalFlow.firstSavePromiseRef.current ?? Promise.resolve(),
                        }
                      : null
                  }
                />
              }
            />
            <Route
              path={ROUTES.GROUP_SHARE}
              element={
                <SharedGroupResultPage
                  pathname={pathname}
                  currentGroupUuid={groupFlow.currentGroupUuid}
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisDone={analysisDone}
                  groupAnalysisResult={groupFlow.groupAnalysisResult}
                  onRetryAnalyzing={() => {
                    setAnalysisError(null);
                    groupFlow.setCurrentGroupUuid(null);
                    navigate(getUploadPath("group"));
                  }}
                  groupSectionProps={
                    analysisDone && groupFlow.groupAnalysisResult
                      ? {
                          groupMembers: groupFlow.groupMembers,
                          groupAnalysisResult: groupFlow.groupAnalysisResult,
                          isAnalyzing: false,
                          onViewRanking: handleViewRanking,
                          onViewRankingViewOnly: handleViewRankingViewOnly,
                          hasRegisteredRanking,
                          onNavigateToPhotoBooth: () =>
                            navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode: "group" } }),
                          analysisUuid: groupFlow.currentGroupUuid,
                        }
                      : null
                  }
                />
              }
            />

            <Route
              path={ROUTES.PHOTO_BOOTH}
              element={
                <PhotoBoothPage
                  mode={photoBoothMode}
                  analysisDone={analysisDone}
                  onNavigateToResult={() => navigate(getResultPath(photoBoothMode))}
                  onStepChange={(isCapturing) => setIsPhotoBoothCapturing(isCapturing)}
                  onBack={() => {
                    if (analysisDone) {
                      navigate(getResultPath(photoBoothMode));
                    } else {
                      navigate(getAnalyzingPath(photoBoothMode));
                    }
                  }}
                  onComplete={(photos) => {
                    const storageKey =
                      photoBoothMode === "personal"
                        ? "photoBoothSets_personal"
                        : "photoBoothSets_group";
                    const newSet = {
                      id: Date.now().toString(),
                      photos: photos,
                      createdAt: new Date().toISOString(),
                    };
                    const existing = JSON.parse(
                      localStorage.getItem(storageKey) || "[]"
                    );
                    existing.unshift(newSet);
                    const toSave = existing.slice(0, 1);
                    try {
                      localStorage.setItem(storageKey, JSON.stringify(toSave));
                    } catch {
                      // QuotaExceededError 등: 저장 실패해도 진행 (갤러리 미반영)
                    }
                    if (analysisDone) {
                      navigate(getResultPath(photoBoothMode));
                    } else {
                      navigate(getAnalyzingPath(photoBoothMode));
                    }
                  }}
                />
              }
            />
          </Routes>
          </AnalysisResultProvider>
        </div>
      </main>

      {/* Global Floating Turtle Guide (체질 분석 탭에서는 숨김) */}
      <TurtleGuideGate
        pathname={pathname}
        isPhotoBooth={isPhotoBooth}
        isAnalyzing={isAnalyzing}
        photoBoothAction={
          (pathname === ROUTES.ANALYZING || (isAnalyzing && (isPersonalSharePath(pathname) || isGroupSharePath(pathname))))
            ? {
                label: "네컷 사진 찍기",
                onClick: () =>
                  navigate(ROUTES.PHOTO_BOOTH, {
                    state: { from: "analyzing", mode },
                  }),
              }
            : undefined
        }
      />

      {/* 관상 분석 완료 Toast - success 응답 시 photo booth 에서만 표시 */}
      <Toast
        message="관상 분석이 완료되었습니다. 결과를 확인하시겠어요?"
        isOpen={showAnalysisCompleteToast && isPhotoBoothPath(pathname)}
        onClose={() => setShowAnalysisCompleteToast(false)}
        onAction={() => {
          if (analysisDone) {
            navigate(getResultPath(photoBoothMode));
            setShowAnalysisCompleteToast(false);
          }
        }}
        type="success"
        variant="morphism"
        duration={10000}
      />
      </HideTurtleGuideProvider>
      </TurtleGuideStateProvider>
      </ErrorBoundary>
      <Toaster position="top-center" richColors />
    </Layout>
  );
}

function TurtleGuideGate({
  pathname,
  isPhotoBooth,
  isAnalyzing,
  photoBoothAction,
}: {
  pathname: string;
  isPhotoBooth: boolean;
  isAnalyzing?: boolean;
  photoBoothAction?: { label: string; onClick: () => void };
}) {
  const { hideTurtleGuide } = useHideTurtleGuide();
  const turtleState = useTurtleGuideState();
  const isAnalyzingOnSharePath = isAnalyzing && (isPersonalSharePath(pathname) || isGroupSharePath(pathname));

  if (isPhotoBooth) return null;
  if (hideTurtleGuide && pathname !== ROUTES.ANALYZING && !isAnalyzingOnSharePath) return null;

  const message = getGuideMessageFromConfig({
    pathname,
    isAnalyzing: isAnalyzing ?? false,
    personalUploadSajuStep: turtleState.personalUploadSajuStep,
    personalUploadCameraVisible: turtleState.personalUploadCameraVisible,
    groupUploadCameraVisible: turtleState.groupUploadCameraVisible,
    personalResultTab: turtleState.personalResultTab,
    groupResultTab: turtleState.groupResultTab,
  });

  return (
    <TurtleGuide
      pathname={pathname}
      message={message}
      isThinking={isAnalyzingPath(pathname) || isAnalyzingOnSharePath}
      thinkingMessage={
        (pathname === ROUTES.ANALYZING || isAnalyzingOnSharePath)
          ? "기다리는 동안 심심하지 않게 작은 선물을 준비했소.\n아래 버튼으로 가 보시게."
          : undefined
      }
      actionLabel={photoBoothAction?.label}
      onAction={photoBoothAction?.onClick}
      disableAutoClose={pathname === ROUTES.ANALYZING || isAnalyzingOnSharePath}
    />
  );
}
