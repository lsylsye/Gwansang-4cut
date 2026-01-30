import React, { useState, useEffect, useRef, useCallback } from "react";
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
  // faceMeshMetadata를 App에서 관리
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<any>(null);
  const pathnameRef = useRef(location.pathname);

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
    } else if (location.pathname === ROUTES.GROUP_UPLOAD) {
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
    metadata?: any,  // faceMeshMetadata 추가
  ) => {
    setAnalysisDone(false);
    setAnalysisError(null);
    setFaceAnalysisResult(null);
    setImages(capturedImages);
    setFeatures(selectedFeatures);
    setSaju(sajuData);
    if (metadata) {
      setFaceMeshMetadata(metadata);
    }
    if (members) {
      setGroupMembers(members);
      setUserTeamName("기운찬 도사님들의 모임");
    }

    // 개인 모드: /analyzing으로 이동 후 API 호출
    if (mode === "personal") {
      navigate(ROUTES.PERSONAL_ANALYZING);
      setIsAnalyzing(true);
      
      try {
        // faceMeshMetadata가 있으면 API 호출
        console.log("📋 받은 metadata:", metadata);
        console.log("📋 faces 배열:", metadata?.faces);
        console.log("📋 첫 번째 얼굴 landmarks 수:", metadata?.faces?.[0]?.landmarks?.length);
        
        if (metadata?.faces && metadata.faces.length > 0) {
          console.log("🚀 관상 분석 API 호출 시작...");
          
          const requestData = {
            timestamp: new Date().toISOString(),
            faces: metadata.faces,
            sajuData: {
              gender: sajuData.gender as 'male' | 'female',
              calendarType: sajuData.calendarType as 'solar' | 'lunar',
              birthDate: sajuData.birthDate,
              birthTime: sajuData.birthTime,
              birthTimeUnknown: sajuData.birthTimeUnknown,
            },
          };
          
          console.log("📤 API 요청 데이터:", JSON.stringify(requestData, null, 2).substring(0, 500));
          
          const result = await analyzeFace(requestData);
          
          if (result.error) {
            console.error("❌ API 오류:", result.error);
            setAnalysisError(result.error);
            setIsAnalyzing(false);
            // 에러 시 result 페이지로 이동하지 않음
            return;
          }
          
          console.log("✅ 관상 분석 완료:", result);
          setFaceAnalysisResult(result);
          setAnalysisDone(true);
          setIsAnalyzing(false);
          
          // 분석 완료 후 result 페이지로 이동
          const currentPath = pathnameRef.current;
          const isPhotoBooth = isPhotoBoothPath(currentPath);
          if (!isPhotoBooth) {
            console.log("✅ /personal/result로 이동");
            navigate(ROUTES.PERSONAL_RESULT);
          } else {
            console.log("⚠️ photo-booth에 있어서 자동 이동하지 않음:", currentPath);
          }
        } else {
          // metadata가 없으면 에러 처리
          console.error("❌ 랜드마크 데이터가 없습니다.");
          setAnalysisError("얼굴 분석 데이터가 없습니다. 다시 촬영해주세요.");
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error("❌ 분석 중 오류:", error);
        setAnalysisError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        setIsAnalyzing(false);
      }
    }

    // ----- [개발용] 단체 모드: /analyzing 생략, 바로 /result. DEV_SKIP_ANALYZING_FOR_GROUP=false 시 아래 원래 흐름 사용 -----
    if (mode === "group" && DEV_SKIP_ANALYZING_FOR_GROUP) {
      setAnalysisDone(true);
      navigate(ROUTES.GROUP_RESULT);
      return;
    }

    // ----- 원래 흐름: /analyzing 이동 → ANALYSIS_LOADING_MS 후 /result -----
    navigate(mode === "personal" ? ROUTES.PERSONAL_ANALYZING : ROUTES.GROUP_ANALYZING);
    setTimeout(() => {
      setAnalysisDone(true);
      const currentPath = pathnameRef.current;
      if (mode === "personal") {
        if (!isPhotoBoothPath(currentPath)) {
          navigate(ROUTES.PERSONAL_RESULT);
        }
      } else {
        if (isAnalyzingPath(currentPath)) {
          navigate(ROUTES.GROUP_RESULT);
        }
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
    setAnalysisDone(false);
    navigate(ROUTES.HOME);
  };

  const pathname = location.pathname;
  const getGuideMessage = () => {
    switch (pathname) {
      case ROUTES.HOME:
        return "허허, 어서 오시게! \n천기를 읽는 거북도사가 자네를 기다리고 있었다네. \n어떤 관상이 궁금하여 나를 찾아왔는가?";
      case ROUTES.PERSONAL_UPLOAD:
        return "자네의 얼굴에 삼라만상이 담겨 있구먼. \n내 신통한 거울에 얼굴을 비추어 보게나. \n숨겨진 운명을 내가 낱낱이 읽어보리다.";
      case ROUTES.GROUP_UPLOAD:
        return "허허, 모임 관상을 보러 왔구먼! \n사진을 주거나, 직접 한 자리에 모여 보게. \n자네들 사이의 기운을 내가 한 번 짚어보리다.";
      case ROUTES.PERSONAL_ANALYZING:
      case ROUTES.GROUP_ANALYZING:
        return "음... 가만있어 보자... \n천기를 스르지 않고 기운을 읽는 중이니, \n잠시만 정적을 지켜주시게나.";
      case ROUTES.PERSONAL_RESULT:
        return "허허! 역시 내 눈은 틀리지 않았어. \n자네의 관상에 이런 놀라운 기운이 숨어있을 줄이야! \n결과를 한 번 찬찬히 살펴보게나.";
      case ROUTES.GROUP_RESULT:
        return "오호라, 이 모임의 궁합이 아주 예사롭지 않구먼! \n서로의 기운이 어떻게 어우러지는지 내가 정리해 보았네. \n궁금하지 않은가?";
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

  return (
    <Layout>
      <HideTurtleGuideProvider>
      {(!isPhotoBooth || !isPhotoBoothShooting) && (
        <header className="w-full h-14 sm:h-16 px-3 sm:px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div
          className="flex items-center gap-0.5 cursor-pointer"
          onClick={() => navigate(ROUTES.HOME)}
        >
          <img
            src={logoImage}
            alt="Logo"
            className="h-6 sm:h-8 object-contain"
          />
          <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight font-display">
            관상네컷
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ranking Button */}
          <button
            onClick={() => {
              setFromAnalysis(false);
              navigate(ROUTES.RANKING);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white hover:bg-gray-50 transition-all font-bold text-gray-900 text-xs sm:text-sm shadow-sm hover:shadow-md border border-gray-200"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">모임 랭킹</span>
            <span className="xs:hidden">랭킹</span>
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

            {(pathname === ROUTES.PERSONAL_UPLOAD || pathname === ROUTES.GROUP_UPLOAD) && (
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
                  onAnalyze={handleAnalyze}
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
                  onNavigateToPhotoBooth={() =>
                    navigate(getPhotoBoothPath(mode), { state: { from: "analyzing" } })
                  }
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
                    groupImage={images[0]}
                    onRestart={handleRestart}
                    onViewRanking={handleViewRanking}
                  />
                ) : (
                  <AnalysisSection
                    images={images}
                    onRestart={handleRestart}
                    onNavigateToPhotoBooth={() =>
                      navigate(getPhotoBoothPath(mode), { state: { from: "result" } })
                    }
                    frameImage={frameImageState || location.state?.frameImage}
                    fromPhotoBooth={fromPhotoBoothState || location.state?.fromPhotoBooth}
                    faceAnalysisResult={faceAnalysisResult?.stage1}
                    totalReview={faceAnalysisResult?.totalReview}
                    isLoading={isAnalyzing}
                  />
                ) : (
                  <GroupAnalysisSection
                    groupMembers={groupMembers}
                    groupImage={images[0]}
                    onRestart={handleRestart}
                    onViewRanking={handleViewRanking}
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
                  onStepChange={(step) => setIsPhotoBoothShooting(step === "shooting")}
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
      />
      </HideTurtleGuideProvider>
    </Layout>
  );
}

function TurtleGuideGate({
  pathname,
  getGuideMessage,
  isPhotoBooth,
}: {
  pathname: string;
  getGuideMessage: () => string;
  isPhotoBooth: boolean;
}) {
  const { hideTurtleGuide } = useHideTurtleGuide();
  if (isPhotoBooth || hideTurtleGuide) return null;
  return (
    <TurtleGuide
      message={getGuideMessage()}
      isThinking={isAnalyzingPath(pathname)}
    />
  );
}