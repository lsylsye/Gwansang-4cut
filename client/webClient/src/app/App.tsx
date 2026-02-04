import React, { useState, useEffect, useRef } from "react";
import "../styles/fonts.css";
import "../styles/theme.css";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { LandingSection } from "@/features/landing/components/LandingSection";
import { UploadSection } from "@/features/upload/components/UploadSection";
import { AnalyzingSection } from "@/features/upload/components/AnalyzingSection";
import { AnalysisSection } from "@/features/personal/AnalysisSection";
import { GroupAnalysisSection } from "@/features/group/GroupAnalysisSection";
import { RankingSection } from "@/features/ranking/components/RankingSection";
import { PhotoBoothSection } from "@/features/photo/components/PhotoBoothSection";
import { TurtleGuide } from "@/shared/components/TurtleGuide";
import { HideTurtleGuideProvider, useHideTurtleGuide } from "@/shared/contexts/HideTurtleGuideContext";
import { Toast } from "@/shared/components/Toast";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { AnimatePresence, motion } from "motion/react";
import { Trophy } from "lucide-react";
import logoImage from "@/assets/film.png";
import {
  AnalyzeMode,
  SajuData,
  GroupMember,
} from "@/shared/types";
import { ANALYSIS_LOADING_MS, DEV_SKIP_ANALYZING_FOR_GROUP } from "@/shared/config/analysis";
import {
  ROUTES,
  getUploadPath,
  getAnalyzingPath,
  getResultPath,
  getPhotoBoothPath,
  isPhotoBoothPath,
  isAnalyzingPath,
  isResultPath,
} from "@/shared/config/routes";
import { 
  analyzeFace, 
  FaceAnalysisApiResponse,
  TotalReview 
} from "@/shared/api/faceAnalysisApi";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<AnalyzeMode>("personal");
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [userTeamName, setUserTeamName] = useState("");
  const [groupScore, setGroupScore] = useState(88);
  const [fromAnalysis, setFromAnalysis] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [frameImageState, setFrameImageState] = useState<string | null>(null);
  const [fromPhotoBoothState, setFromPhotoBoothState] = useState(false);
  
  // API 응답 상태 관리
  const [faceAnalysisResult, setFaceAnalysisResult] = useState<FaceAnalysisApiResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisCompleteToast, setShowAnalysisCompleteToast] = useState(false);
  const [isPhotoBoothCapturing, setIsPhotoBoothCapturing] = useState(false);
  // faceMeshMetadata를 App에서 관리
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<any>(null);
  /** 모임 궁합 API 응답 (members + groupCombination). API 연결 후 결과 화면에서 렌더링용 */
  const [groupAnalysisResult, setGroupAnalysisResult] = useState<{
    success: boolean;
    members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
    groupCombination?: string;
  } | null>(null);
  /** 개인 결과 페이지에서 선택된 탭 (TurtleGuide 탭별 멘트용) */
  const [personalResultTab, setPersonalResultTab] = useState<string | null>(null);
  /** 개인 업로드 페이지에서 사주 정보 입력 단계 표시 여부 (TurtleGuide 멘트용) */
  const [personalUploadSajuStep, setPersonalUploadSajuStep] = useState(false);
  /** 개인 업로드 페이지에서 사진 확인 단계(촬영 후·사주 입력 전) 표시 여부 (TurtleGuide 멘트용) */
  const [personalUploadConfirmStep, setPersonalUploadConfirmStep] = useState(false);
  /** 개인 업로드 페이지에서 카메라 촬영 뷰 표시 여부 (TurtleGuide: 촬영할 때만 삼라만상 멘트) */
  const [personalUploadCameraVisible, setPersonalUploadCameraVisible] = useState(false);
  /** 모임 업로드 페이지에서 실시간 촬영 뷰 표시 여부 (TurtleGuide: 최대 7명 안내) */
  const [groupUploadCameraVisible, setGroupUploadCameraVisible] = useState(false);
  /** 모임 결과 페이지에서 선택된 탭 (TurtleGuide 멘트용: overall | pairs) */
  const [groupResultTab, setGroupResultTab] = useState<"overall" | "pairs" | null>(null);
  const pathnameRef = useRef(location.pathname);

  // 결과 페이지 벗어나면 탭 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.PERSONAL_RESULT) setPersonalResultTab(null);
  }, [location.pathname]);

  // 개인 업로드 페이지 벗어나면 사주/확인/카메라 플래그 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.PERSONAL_UPLOAD) {
      setPersonalUploadSajuStep(false);
      setPersonalUploadConfirmStep(false);
      setPersonalUploadCameraVisible(false);
    }
  }, [location.pathname]);

  // 모임 업로드 페이지 벗어나면 실시간 촬영 플래그 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.GROUP_UPLOAD && location.pathname !== ROUTES.GROUP_UPLOAD_MEMBERS) {
      setGroupUploadCameraVisible(false);
    }
  }, [location.pathname]);

  // 모임 결과 페이지 벗어나면 탭 플래그 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.GROUP_RESULT) setGroupResultTab(null);
  }, [location.pathname]);

  // URL 변경 시 스크롤 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // location.state 변경 감지
  useEffect(() => {
    if (location.state?.frameImage) {
      setFrameImageState(location.state.frameImage);
    }
    if (location.state?.fromPhotoBooth) {
      setFromPhotoBoothState(location.state.fromPhotoBooth);
    }
  }, [location.state]);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // /upload 진입 시 URL의 mode path와 state 동기화
  useEffect(() => {
    if (location.pathname === ROUTES.PERSONAL_UPLOAD) {
      setMode("personal");
    } else if (location.pathname === ROUTES.GROUP_UPLOAD || location.pathname === ROUTES.GROUP_UPLOAD_MEMBERS) {
      setMode("group");
    }
  }, [location.pathname]);

  const handleStart = (selectedMode: AnalyzeMode) => {
    setMode(selectedMode);
    navigate(getUploadPath(selectedMode));
  };

  const handleAnalyze = async (
    capturedImages: string[],
    selectedFeatures: string[],
    sajuData: SajuData,
    members?: GroupMember[],
    metadata?: any,
  ) => {
    setAnalysisDone(false);
    setAnalysisError(null);
    setFaceAnalysisResult(null);
    setImages(capturedImages);
    setFeatures(selectedFeatures);
    setSaju(sajuData);
    // members 있으면 그룹 플로우 (직접 /group/upload 접근 시 mode 지연 대비)
    const isGroupFlow = Boolean(members && members.length > 0);
    if (isGroupFlow && metadata?.success && Array.isArray(metadata?.members)) {
      setGroupAnalysisResult(metadata);
    } else if (!isGroupFlow && metadata) {
      setFaceMeshMetadata(metadata);
    } else if (isGroupFlow) {
      setGroupAnalysisResult(null);
    }
    if (members) {
      setGroupMembers(members);
      setUserTeamName("기운찬 도사님들의 모임");
    }

    // 그룹 모드: [개발용] 바로 /group/result 이동 — 이 분기 없으면 모임 궁합 분석하기 결과창 안 나옴
    if (isGroupFlow && DEV_SKIP_ANALYZING_FOR_GROUP) {
      setAnalysisDone(true);
      setTimeout(() => navigate(ROUTES.GROUP_RESULT), 0);
      return;
    }

    // 개인 모드: /analyzing 이동 후 API 호출
    if (!isGroupFlow) {
      navigate(ROUTES.PERSONAL_ANALYZING);
      setIsAnalyzing(true);
      try {
        if (metadata?.faces && metadata.faces.length > 0) {
          const requestData = {
            timestamp: new Date().toISOString(),
            faces: metadata.faces,
            sajuData: {
              gender: sajuData.gender as "male" | "female",
              calendarType: sajuData.calendarType as "solar" | "lunar",
              birthDate: sajuData.birthDate,
              birthTime: sajuData.birthTime,
              birthTimeUnknown: sajuData.birthTimeUnknown,
            },
          };
          const result = await analyzeFace(requestData);
          if (result.error) {
            setAnalysisError(result.error);
            setIsAnalyzing(false);
            return;
          }
          setFaceAnalysisResult(result);
          setAnalysisDone(true);
          setIsAnalyzing(false);
          // photo booth에 있을 때만 토스트 플래그 켜기 (다른 경로로 이동 시 토스트 안 뜨게)
          if (isPhotoBoothPath(pathnameRef.current)) {
            setShowAnalysisCompleteToast(true);
          }
          if (!isPhotoBoothPath(pathnameRef.current)) {
            navigate(ROUTES.PERSONAL_RESULT);
            setShowAnalysisCompleteToast(false);
          }
        } else {
          setAnalysisError("얼굴 분석 데이터가 없습니다. 다시 촬영해주세요.");
          setIsAnalyzing(false);
        }
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        setIsAnalyzing(false);
      }
      return;
    }

    // 그룹 모드 (DEV_SKIP=false): /analyzing → 타이머 후 /result
    navigate(ROUTES.GROUP_ANALYZING);
    setTimeout(() => {
      setAnalysisDone(true);
      if (isPhotoBoothPath(pathnameRef.current)) {
        setShowAnalysisCompleteToast(true);
      }
      if (isAnalyzingPath(pathnameRef.current)) {
        navigate(ROUTES.GROUP_RESULT);
        setShowAnalysisCompleteToast(false);
      }
    }, ANALYSIS_LOADING_MS);
  };

  const handleViewRanking = (score?: number, name?: string) => {
    if (score !== undefined) setGroupScore(score);
    if (name) setUserTeamName(name);
    setFromAnalysis(true);
    navigate(ROUTES.RANKING);
  };

  const handleRestart = () => {
    setImages([]);
    setFeatures([]);
    setSaju(null);
    setGroupMembers([]);
    setGroupAnalysisResult(null);
    setAnalysisDone(false);
    navigate(ROUTES.HOME);
  };

  const pathname = location.pathname;
  const getGuideMessage = () => {
    switch (pathname) {
      case ROUTES.HOME:
        return "허허, 어서 오시게! \n천기를 읽는 거북도사가 자네를 기다리고 있었다네. \n어떤 관상이 궁금하여 나를 찾아왔는가?";
      case ROUTES.PERSONAL_UPLOAD:
        if (personalUploadSajuStep) return "태어난 시간을 안다면 더 정확하게 \n분석해 줄 수 있다네. 아는 대로 골라 넣어 주시게.";
        if (personalUploadCameraVisible) return "자네의 얼굴에 삼라만상이 담겨 있구먼. \n내 신통한 거울에 얼굴을 비추어 보게나. \n숨겨진 운명을 내가 낱낱이 읽어보리다.";
        return "허허, 개인 관상을 보러오셨구먼. \n깨끗이 잘 나온 사진 하나 건네보시오.";
      case ROUTES.GROUP_UPLOAD:
        if (groupUploadCameraVisible) return "이 거울에는 최대 7명까지 비춰질 수 있네. \n모두가 잘 보이게 모여 보게.";
        return "허허, 모임 궁합을 보러 왔구먼! \n사진을 주거나, 직접 한 자리에 모여 보게. \n자네들 사이의 기운을 내가 한 번 짚어보리다.";
      case ROUTES.GROUP_UPLOAD_MEMBERS:
        return "이제 각 멤버의 이름과 생년월일을 입력해 주게. \n태어난 시간을 안다면 더 정확한 궁합을 알 수 있을 걸세.";
      case ROUTES.PERSONAL_ANALYZING:
        return "기다리는 동안 심심하지 않게 작은 선물을 준비했소. \n아래 버튼으로 가 보시게.";
      case ROUTES.GROUP_ANALYZING:
        return "음... 가만있어 보자... \n천기를 스르지 않고 기운을 읽는 중이니, \n잠시만 정적을 지켜주시게나.";
      case ROUTES.PERSONAL_RESULT: {
        const tab = personalResultTab ?? "physiognomy";
        if (tab === "constitution") return "자네의 체질과 오행을 살펴보는 구간이구먼. \n사주에 맞는 음식과 기운을 내가 짚어 보았네. \n꼭 챙겨 먹게나.";
        if (tab === "future") return "미래의 자네 모습을 그려 보는 구간이야. \n10년에서 50년 후까지, 얼굴이 어떻게 변할지 \n한번 구경해 보시게.";
        if (tab === "ssafy-cut") return "싸피네컷이구먼! \n사진을 찍어서 프레임에 담아 두었나? \n없다면 어서 찍으러 가 보시게.";
        return "허허! 관상이란 타고난 얼굴만 보는 것이 아니오. \n 자네가 걸어온 시간과 마음이 비춰지는 법이지. \n자, 이제 결과를 한 번 보세나.";
      }
      case ROUTES.GROUP_RESULT:
        if (groupResultTab === "pairs") return "원하는 상대를 클릭하면 세부 궁합을\n확인할 수 있다네. 어서 클릭해 보시게.";
        return "오호라, 이 모임의 기운이 보통이 아니구먼.\n모임 전체부터 일대일 궁합까지 정리해 두었네.\n자, 찬찬히 읽어보시게.";
      case ROUTES.RANKING:
        return "허허, 전국 방방곡곡의 인연들이 다 모였구먼! \n자네들의 모임은 과연 몇 번째 기운을 가졌을꼬?";
      case ROUTES.PERSONAL_PHOTO_BOOTH:
      case ROUTES.GROUP_PHOTO_BOOTH:
        return "허허, 사진 네컷을 찍는구먼! \n기다리는 동안 즐거운 추억을 남기게나.";
      default:
        return "";
    }
  };

  const isPhotoBooth = isPhotoBoothPath(pathname);
  const shouldHideHeader = isPhotoBooth && isPhotoBoothCapturing;

  return (
    <Layout>
      <HideTurtleGuideProvider>
      {!shouldHideHeader && (
        <header className="w-full h-16 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div
          className="flex items-center gap-0.5 cursor-pointer"
          onClick={() => navigate(ROUTES.HOME)}
        >
          <img
            src={logoImage}
            alt="Logo"
            className="h-8 object-contain"
          />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">
            관상네컷
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Ranking Button */}
          <button
            onClick={() => {
              setFromAnalysis(false);
              navigate(ROUTES.RANKING);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 transition-all font-bold text-gray-900 text-sm shadow-sm hover:shadow-md border border-gray-200"
          >
            <Trophy className="w-4 h-4" />
            모임 랭킹
          </button>
        </div>
      </header>
      )}

      <main className="flex-grow w-full relative">
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            {pathname === ROUTES.HOME && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <LandingSection onStart={handleStart} />
              </motion.div>
            )}

            {(pathname === ROUTES.PERSONAL_UPLOAD || pathname === ROUTES.GROUP_UPLOAD || pathname === ROUTES.GROUP_UPLOAD_MEMBERS) && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <UploadSection
                  mode={mode}
                  pathname={pathname}
                  onAnalyze={handleAnalyze}
                  onNavigateToMembers={() => navigate(ROUTES.GROUP_UPLOAD_MEMBERS)}
                  onNavigateToUpload={() => navigate(ROUTES.GROUP_UPLOAD)}
                  onSajuInputVisible={setPersonalUploadSajuStep}
                  onPersonalConfirmStepVisible={setPersonalUploadConfirmStep}
                  onPersonalCameraVisible={setPersonalUploadCameraVisible}
                  onGroupCameraVisible={setGroupUploadCameraVisible}
                />
              </motion.div>
            )}

            {(pathname === ROUTES.PERSONAL_ANALYZING || pathname === ROUTES.GROUP_ANALYZING) && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <AnalyzingSection
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisComplete={analysisDone}
                  onRetry={() => {
                    // 재시도: upload 페이지로 돌아가기
                    setAnalysisError(null);
                    navigate(getUploadPath(mode));
                  }}
                />
              </motion.div>
            )}

            {/* 모임 궁합 분석하기 결과창: PERSONAL_RESULT뿐 아니라 GROUP_RESULT도 포함해야 /group/result에서 화면이 렌더됨 (git pull 후 조건이 PERSONAL_RESULT만 있으면 결과창 안 나옴) */}
            {(pathname === ROUTES.PERSONAL_RESULT || pathname === ROUTES.GROUP_RESULT) && (
              <motion.div
                key={pathname === ROUTES.GROUP_RESULT ? "group-result" : "personal-result"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {pathname === ROUTES.GROUP_RESULT ? (
                  <GroupAnalysisSection
                    groupMembers={groupMembers}
                    groupAnalysisResult={groupAnalysisResult}
                    onViewRanking={handleViewRanking}
                    onTabChange={setGroupResultTab}
                  />
                ) : (
                  <AnalysisSection
                    images={images}
                    onRestart={handleRestart}
                    onTabChange={setPersonalResultTab}
                    onNavigateToPhotoBooth={() =>
                      navigate(getPhotoBoothPath(mode), { state: { from: "result" } })
                    }
                    frameImage={frameImageState || location.state?.frameImage}
                    fromPhotoBooth={fromPhotoBoothState || location.state?.fromPhotoBooth}
                    faceAnalysisResult={faceAnalysisResult?.stage1}
                    totalReview={faceAnalysisResult?.totalReview}
                    isLoading={isAnalyzing}
                  />
                )}
              </motion.div>
            )}

            {pathname === ROUTES.RANKING && (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <RankingSection
                  onBack={() => navigate(ROUTES.GROUP_RESULT)}
                  onHome={handleRestart}
                  userScore={groupScore}
                  initialTeamName={userTeamName}
                  fromAnalysis={fromAnalysis}
                />
              </motion.div>
            )}

            {(pathname === ROUTES.PERSONAL_PHOTO_BOOTH || pathname === ROUTES.GROUP_PHOTO_BOOTH) && (
              <motion.div
                key="photo-booth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <PhotoBoothSection
                  mode={mode}
                  analysisDone={analysisDone}
                  onNavigateToResult={() => navigate(getResultPath(mode))}
                  onStepChange={(isCapturing) => setIsPhotoBoothCapturing(isCapturing)}
                  onBack={() => {
                    // analyzing이 완료된 상태면 결과창으로, 진행 중이면 analyzing으로
                    if (analysisDone) {
                      navigate(getResultPath(mode));
                    } else {
                      navigate(getAnalyzingPath(mode));
                    }
                  }}
                  onComplete={(photos) => {
                    // 싸피네컷 완료 → photoBoothSets에 저장
                    const newSet = {
                      id: Date.now().toString(),
                      photos: photos,
                      createdAt: new Date().toISOString(),
                    };
                    const existing = JSON.parse(
                      localStorage.getItem("photoBoothSets") || "[]"
                    );
                    existing.unshift(newSet);
                    const toSave = existing.slice(0, 1);
                    try {
                      localStorage.setItem(
                        "photoBoothSets",
                        JSON.stringify(toSave)
                      );
                    } catch {
                      // QuotaExceededError 등: 저장 실패해도 진행 (갤러리 미반영)
                    }
                    // 싸피네컷 다 찍었을 때: 분석 끝남 → /result, 아니면 → /analyzing
                    if (analysisDone) {
                      navigate(getResultPath(mode));
                    } else {
                      navigate(getAnalyzingPath(mode));
                    }
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Global Floating Turtle Guide (체질 분석 탭에서는 숨김) */}
      <TurtleGuideGate
        pathname={pathname}
        getGuideMessage={getGuideMessage}
        isPhotoBooth={isPhotoBooth}
        photoBoothAction={
          pathname === ROUTES.PERSONAL_ANALYZING
            ? {
                label: "네컷 사진 찍기",
                onClick: () => navigate(getPhotoBoothPath(mode), { state: { from: "analyzing" } }),
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
            const currentPath = pathnameRef.current;
            if (isPhotoBoothPath(currentPath)) {
              navigate(getResultPath(mode));
            } else {
              navigate(getResultPath(mode));
            }
            setShowAnalysisCompleteToast(false);
          }
        }}
        type="success"
        variant="morphism"
        duration={10000}
      />
      </HideTurtleGuideProvider>
    </Layout>
  );
}

function TurtleGuideGate({
  pathname,
  getGuideMessage,
  isPhotoBooth,
  photoBoothAction,
}: {
  pathname: string;
  getGuideMessage: () => string;
  isPhotoBooth: boolean;
  photoBoothAction?: { label: string; onClick: () => void };
}) {
  const { hideTurtleGuide } = useHideTurtleGuide();
  if (isPhotoBooth) return null;
  // /personal/analyzing에서는 토글 닫아둔 상태여도 무조건 TurtleGuide 표시
  if (hideTurtleGuide && pathname !== ROUTES.PERSONAL_ANALYZING) return null;
  return (
    <TurtleGuide
      pathname={pathname}
      message={getGuideMessage()}
      isThinking={isAnalyzingPath(pathname)}
      thinkingMessage={
        pathname === ROUTES.PERSONAL_ANALYZING
          ? "기다리는 동안 심심하지 않게 작은 선물을 준비했소.\n아래 버튼으로 가 보시게."
          : undefined
      }
      actionLabel={photoBoothAction?.label}
      onAction={photoBoothAction?.onClick}
    />
  );
}