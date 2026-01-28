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
import { HistorySection } from "@/features/history/components/HistorySection";
import { PhotoBoothSection } from "@/features/photo/components/PhotoBoothSection";
import { PhotoGallerySection } from "@/features/photo/components/PhotoGallerySection";
import { TurtleGuide } from "@/shared/components/TurtleGuide";
import { AnimatePresence, motion } from "motion/react";
import { Package } from "lucide-react";
import { Trophy } from "lucide-react";
import logoImage from "@/assets/film.png";
import {
  AnalyzeMode,
  SajuData,
  HistoryItem,
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
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [analysisDone, setAnalysisDone] = useState(false);
  const pathnameRef = useRef(location.pathname);

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

  const handleHistory = () => navigate("/history");

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
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const timestamp = now.toTimeString().split(" ")[0].substring(0, 5);
      setHistoryData((prev) => [
        {
          id: Date.now().toString(),
          type: "group",
          date,
          timestamp,
          teamName: userTeamName,
          memberCount: members?.length || 0,
          score: groupScore,
          thumbnail: capturedImages[0],
        },
        ...prev,
      ]);
      setAnalysisDone(true);
      navigate("/group/result");
      return;
    }

    // ----- [원래] 그룹 포함 모든 모드: /analyzing 이동 → ANALYSIS_LOADING_MS 후 /result (그룹은 위 분기에서 return 시 아래 생략) -----
    navigate(mode === "personal" ? "/personal/analyzing" : "/group/analyzing");

    // 개발: ANALYSIS_LOADING_MS(10초) 후 “분석 완료”. API 연동 시 실제 응답 시점으로 교체.
    setTimeout(() => {
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const timestamp = now.toTimeString().split(" ")[0].substring(0, 5);
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        type: mode,
        date,
        timestamp,
        ...(mode === "personal"
          ? { images: capturedImages }
          : {
              teamName: userTeamName,
              memberCount: members?.length || 0,
              score: groupScore,
              thumbnail: capturedImages[0],
            }),
      };
      setHistoryData((prev) => [newHistoryItem, ...prev]);
      setAnalysisDone(true);
      // 싸피네컷 다 안 찍었는데 분석 끝난 경우: /photo-booth·/photo-gallery에 있으면 /result로 보내지 않음
      if (pathnameRef.current === "/personal/analyzing" || pathnameRef.current === "/group/analyzing") {
        navigate(mode === "personal" ? "/personal/result" : "/group/result");
      }
    }, ANALYSIS_LOADING_MS);
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
      case "/history":
        return "자네의 과거 관상 분석 결과라네. \n어떤 결과가 궁금한가?";
      case "/personal/photo-booth":
      case "/group/photo-booth":
        return "허허, 사진 네컷을 찍는구먼! \n기다리는 동안 즐거운 추억을 남기게나.";
      case "/personal/photo-gallery":
      case "/group/photo-gallery":
        return "찍은 사진들을 모아두었구먼. \n예쁘게 나왔는지 한 번 확인해보게나.";
      default:
        return "";
    }
  };

  return (
    <Layout>
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

          {/* History Section */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
              onClick={handleHistory}
            >
              <Package className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">
                나의 기록
              </span>
            </button>
          </div>
        </div>
      </header>

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
                <AnalysisSection
                  images={images}
                  onRestart={handleRestart}
                  onNavigateToPhotoGallery={() =>
                    navigate("/personal/photo-gallery", { state: { from: "result" } })
                  }
                />
              </motion.div>
            )}

            {pathname === "/group/result" && (
              <motion.div
                key="group-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <GroupAnalysisSection
                  groupMembers={groupMembers}
                  groupImage={images[0]}
                  onRestart={handleRestart}
                  onViewRanking={handleViewRanking}
                />
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

            {pathname === "/history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <HistorySection
                  historyData={historyData}
                  onViewResult={(item: HistoryItem) => {
                    // TODO: Navigate to result page with history data
                    console.log("View result:", item);
                  }}
                  onNewAnalysis={() => navigate("/")}
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
                    if (location.state?.from === "photo-gallery")
                      navigate(mode === "personal" ? "/personal/photo-gallery" : "/group/photo-gallery");
                    else navigate(mode === "personal" ? "/personal/analyzing" : "/group/analyzing");
                  }}
                  onComplete={(photos) => {
                    // 싸피네컷 완료 → photoBoothSets에 저장 → /photo-gallery에서 조회
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

            {(pathname === "/personal/photo-gallery" || pathname === "/group/photo-gallery") && (
              <motion.div
                key="photo-gallery"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <PhotoGallerySection
                  mode={mode}
                  onBack={() => {
                    if (location.state?.from === "result")
                      navigate(mode === "personal" ? "/personal/result" : "/group/result");
                    else navigate(mode === "personal" ? "/personal/analyzing" : "/group/analyzing");
                  }}
                  onNavigateToPhotoBooth={() =>
                    navigate(mode === "personal" ? "/personal/photo-booth" : "/group/photo-booth", { state: { from: "photo-gallery" } })
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Global Floating Turtle Guide */}
      <TurtleGuide
        message={getGuideMessage()}
        isThinking={pathname === "/personal/analyzing" || pathname === "/group/analyzing"}
      />
    </Layout>
  );
}