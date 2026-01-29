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
    if (location.pathname === "/personal/upload") {
      setMode("personal");
    } else if (location.pathname === "/group/upload") {
      setMode("group");
    }
  }, [location.pathname]);

  const handleStart = (selectedMode: AnalyzeMode) => {
    setMode(selectedMode);
    navigate(`/${selectedMode}/upload`);
  };

  const handleAnalyze = (
    capturedImages: string[],
    selectedFeatures: string[],
    sajuData: SajuData,
    members?: GroupMember[],
  ) => {
    setAnalysisDone(false);
    setImages(capturedImages);
    setFeatures(selectedFeatures);
    setSaju(sajuData);
    if (members) {
      setGroupMembers(members);
      setUserTeamName("기운찬 도사님들의 모임");
    }

    // ----- [개발용] 단체 모드: /analyzing 생략, 바로 /result. DEV_SKIP_ANALYZING_FOR_GROUP=false 시 아래 원래 흐름 사용 -----
    if (mode === "group" && DEV_SKIP_ANALYZING_FOR_GROUP) {
      setTimeout(() => {
        setAnalysisDone(true);
        // 싸피네컷 다 안 찍었는데 분석 끝난 경우: /photo-booth에 있으면 /result로 보내지 않음
        if (pathnameRef.current === "/personal/analyzing" || pathnameRef.current === "/group/analyzing") {
          navigate("/group/result");
        }
      }, ANALYSIS_LOADING_MS);
    }
  };

  const handleViewRanking = (score?: number, name?: string) => {
    if (score !== undefined) setGroupScore(score);
    if (name) setUserTeamName(name);
    setFromAnalysis(true);
    navigate("/ranking");
  };

  const handleRestart = () => {
    setImages([]);
    setFeatures([]);
    setSaju(null);
    setGroupMembers([]);
    setAnalysisDone(false);
    navigate("/");
  };

  const pathname = location.pathname;
  const getGuideMessage = () => {
    switch (pathname) {
      case "/":
        return "허허, 어서 오시게! \n천기를 읽는 거북도사가 자네를 기다리고 있었다네. \n어떤 관상이 궁금하여 나를 찾아왔는가?";
      case "/personal/upload":
        return "자네의 얼굴에 삼라만상이 담겨 있구먼. \n내 신통한 거울에 얼굴을 비추어 보게나. \n숨겨진 운명을 내가 낱낱이 읽어보리다.";
      case "/group/upload":
        return "허허, 모임 관상을 보러 왔구먼! \n사진을 주거나, 직접 한 자리에 모여 보게. \n자네들 사이의 기운을 내가 한 번 짚어보리다.";
      case "/personal/analyzing":
      case "/group/analyzing":
        return "음... 가만있어 보자... \n천기를 스르지 않고 기운을 읽는 중이니, \n잠시만 정적을 지켜주시게나.";
      case "/personal/result":
        return "허허! 역시 내 눈은 틀리지 않았어. \n자네의 관상에 이런 놀라운 기운이 숨어있을 줄이야! \n결과를 한 번 찬찬히 살펴보게나.";
      case "/group/result":
        return "오호라, 이 모임의 궁합이 아주 예사롭지 않구먼! \n서로의 기운이 어떻게 어우러지는지 내가 정리해 보았네. \n궁금하지 않은가?";
      case "/ranking":
        return "허허, 전국 방방곡곡의 인연들이 다 모였구먼! \n자네들의 모임은 과연 몇 번째 기운을 가졌을꼬?";
      case "/personal/photo-booth":
      case "/group/photo-booth":
        return "허허, 사진 네컷을 찍는구먼! \n기다리는 동안 즐거운 추억을 남기게나.";
      default:
        return "";
    }
  };

  const isPhotoBooth = location.pathname === "/photo-booth";

  return (
    <Layout>
      {!isPhotoBooth && (
        <header className="w-full h-16 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div
          className="flex items-center gap-0.5 cursor-pointer"
          onClick={() => navigate("/")}
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
              navigate("/ranking");
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
            {pathname === "/" && (
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

            {(pathname === "/personal/upload" || pathname === "/group/upload") && (
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

            {(pathname === "/personal/analyzing" || pathname === "/group/analyzing") && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <AnalyzingSection
                  onNavigateToPhotoBooth={() =>
                    navigate(mode === "personal" ? "/personal/photo-booth" : "/group/photo-booth", { state: { from: "analyzing" } })
                  }
                />
              </motion.div>
            )}

            {pathname === "/personal/result" && (
              <motion.div
                key="personal-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {mode === "personal" ? (
                  <AnalysisSection
                    images={images}
                    onRestart={handleRestart}
                    onNavigateToPhotoBooth={() =>
                      navigate("/photo-booth", { state: { from: "result" } })
                    }
                    frameImage={frameImageState || location.state?.frameImage}
                    fromPhotoBooth={fromPhotoBoothState || location.state?.fromPhotoBooth}
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

            {pathname === "/ranking" && (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <RankingSection
                  onBack={() => navigate("/group/result")}
                  onHome={handleRestart}
                  userScore={groupScore}
                  initialTeamName={userTeamName}
                  fromAnalysis={fromAnalysis}
                />
              </motion.div>
            )}

            {(pathname === "/personal/photo-booth" || pathname === "/group/photo-booth") && (
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
                  onBack={() => {
                    // analyzing이 완료된 상태면 결과창으로, 진행 중이면 analyzing으로
                    if (analysisDone) {
                      navigate("/result");
                    } else {
                      navigate("/analyzing");
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
                      navigate(mode === "personal" ? "/personal/result" : "/group/result");
                    } else {
                      navigate(mode === "personal" ? "/personal/analyzing" : "/group/analyzing");
                    }
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Global Floating Turtle Guide */}
      {pathname !== "/photo-booth" && (
        <TurtleGuide
          message={getGuideMessage()}
          isThinking={pathname === "/analyzing"}
        />
      )}
    </Layout>
  );
}