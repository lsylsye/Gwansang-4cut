import React, { useState } from "react";
import "../styles/fonts.css";
import "../styles/theme.css";
import { Layout } from "./layout/Layout";
import { LandingSection } from "@/features/landing/components/LandingSection";
import { UploadSection } from "@/features/upload/components/UploadSection";
import { AnalysisSection } from "@/features/personal/AnalysisSection";
import { GroupAnalysisSection } from "@/features/group/GroupAnalysisSection";
import { RankingSection } from "@/features/ranking/components/RankingSection";
import { HistorySection } from "@/features/history/components/HistorySection";
import { TurtleGuide } from "@/shared/components/TurtleGuide";
import { AnimatePresence, motion } from "motion/react";
import { LogIn, User, LogOut, Package } from "lucide-react";
import { Trophy } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import logoImage from "@/assets/film.png";
import {
  AnalyzeMode,
  SajuData,
  UserProfile,
  HistoryItem,
  GroupMember,
} from "@/shared/types";


type Step =
  | "intro"
  | "upload"
  | "analyzing"
  | "result"
  | "ranking"
  | "history";

export default function App() {
  const [step, setStep] = useState<Step>("intro");
  const [mode, setMode] = useState<AnalyzeMode>("personal");
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [groupMembers, setGroupMembers] = useState<
    GroupMember[]
  >([]);
  const [userTeamName, setUserTeamName] = useState("");
  const [groupScore, setGroupScore] = useState(88);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [fromAnalysis, setFromAnalysis] = useState(false); // 분석 결과에서 랭킹으로 왔는지 여부
  const [historyData, setHistoryData] = useState<HistoryItem[]>(
    [],
  );

  const handleKakaoLogin = () => {
    // TODO: Implement actual Kakao login logic
    // For now, mock login
    setIsLoggedIn(true);
    setUserProfile({
      name: "거북이",
      profileImage: undefined, // Kakao will provide this
    });
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setShowProfileMenu(false);
  };

  const handleStart = (selectedMode: AnalyzeMode) => {
    setMode(selectedMode);
    setStep("upload");
  };

  const handleAnalyze = (
    capturedImages: string[],
    selectedFeatures: string[],
    sajuData: SajuData,
    members?: GroupMember[],
  ) => {
    setImages(capturedImages);
    setFeatures(selectedFeatures);
    setSaju(sajuData);
    if (members) {
      setGroupMembers(members);
      // Default placeholder, will be updated by result data
      setUserTeamName("기운찬 도사님들의 모임");
    }
    setStep("analyzing");
    setTimeout(() => {
      setStep("result");

      // 히스토리에 저장 (로그인 상태일 때만)
      if (isLoggedIn) {
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const timestamp = now
          .toTimeString()
          .split(" ")[0]
          .substring(0, 5);

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
      }
    }, 3000);
  };

  const handleViewRanking = (score?: number, name?: string) => {
    if (score !== undefined) setGroupScore(score);
    if (name) setUserTeamName(name);
    setStep("ranking");
    setFromAnalysis(true); // 분석 결과에서 랭킹으로 왔음을 표시
  };

  const handleRestart = () => {
    setImages([]);
    setFeatures([]);
    setSaju(null);
    setGroupMembers([]);
    setStep("intro");
  };

  const handleHistory = () => {
    setStep("history");
    setShowProfileMenu(false);
  };

  // Determine guide message based on step
  const getGuideMessage = () => {
    switch (step) {
      case "intro":
        return "허허, 어서 오시게! \n천기를 읽는 거북도사가 자네를 기다리고 있었다네. \n어떤 관상이 궁금하여 나를 찾아왔는가?";
      case "upload":
        return mode === "personal"
          ? "자네의 얼굴에 삼라만상이 담겨 있구먼. \n내 신통한 거울에 얼굴을 비추어 보게나. \n숨겨진 운명을 내가 낱낱이 읽어보리다."
          : "허허, 무리들의 합을 보러 왔구먼! \n사진을 주거나, 직접 한 자리에 모여 보게. \n자네들 사이의 기운을 내가 한 번 짚어보리다.";
      case "analyzing":
        return "음... 가만있어 보자... \n천기를 스르지 않고 기운을 읽는 중이니, \n잠시만 정적을 지켜주시게나.";
      case "result":
        return mode === "personal"
          ? "허허! 역시 내 눈은 틀리지 않았어. \n자네의 관상에 이런 놀라운 기운이 숨어있을 줄이야! \n결과를 한 번 찬찬히 살펴보게나."
          : "오호라, 이 모임의 궁합이 아주 예사롭지 않구먼! \n서로의 기운이 어떻게 어우러지는지 내가 정리해 보았네. \n궁금하지 않은가?";
      case "ranking":
        return "허허, 전국 방방곡곡의 인연들이 다 모였구먼! \n자네들의 모임은 과연 몇 번째 기운을 가졌을꼬?";
      case "history":
        return "자네의 과거 관상 분석 결과라네. \n어떤 결과가 궁금한가?";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <header className="w-full h-16 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div
          className="flex items-center gap-0.5 cursor-pointer"
          onClick={() => setStep("intro")}
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
              setStep("ranking");
              setFromAnalysis(false); // 헤더에서 직접 랭킹 페이지로 이동
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 transition-all font-bold text-gray-900 text-sm shadow-sm hover:shadow-md border border-gray-200"
          >
            <Trophy className="w-4 h-4" />
            모임 랭킹
          </button>

          {/* Login/Profile Section */}
          <div className="relative">
            {isLoggedIn ? (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                  onClick={() =>
                    setShowProfileMenu(!showProfileMenu)
                  }
                >
                  {userProfile?.profileImage ? (
                    <img
                      src={userProfile.profileImage}
                      alt="Profile"
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#00897B] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-900">
                    {userProfile?.name}
                  </span>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() =>
                          setShowProfileMenu(false)
                        }
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
                      >
                        <button
                          className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          onClick={handleHistory}
                        >
                          <Package className="w-4 h-4" />
                          나의 히스토리
                        </button>
                        <div className="h-px bg-gray-100" />
                        <button
                          className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4" />
                          로그아웃
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button
                onClick={handleKakaoLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FEE500] hover:bg-[#FDD835] transition-all font-bold text-[#000000] text-sm shadow-sm hover:shadow-md"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.658 1.759 4.99 4.398 6.367-.191.706-.623 2.453-.719 2.846-.111.457.168.452.351.328.145-.098 2.193-1.505 3.154-2.167.517.072 1.048.109 1.591.109 5.523 0 9.775-3.477 9.775-7.483C22 6.477 17.523 3 12 3z" />
                </svg>
                카카오 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full relative">
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            {step === "intro" && (
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

            {step === "upload" && (
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

            {step === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-[60vh] flex flex-col items-center justify-center text-center"
              >
                <div className="mb-8 relative">
                  <div className="absolute inset-0 bg-[#00897B] blur-3xl opacity-20 rounded-full animate-pulse"></div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4 relative z-10 font-display">
                    분석 중...
                  </h2>
                  <p className="text-gray-500 text-lg relative z-10">
                    {mode === "personal"
                      ? "당신의 운명을 읽고 있습니다."
                      : "모임의 기운을 읽고 있습니다."}
                  </p>
                </div>
              </motion.div>
            )}

            {step === "result" && (
              <motion.div
                key="result"
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

            {step === "ranking" && (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <RankingSection
                  onBack={() => setStep("result")}
                  onHome={handleRestart}
                  userScore={groupScore}
                  initialTeamName={userTeamName}
                  fromAnalysis={fromAnalysis}
                  isLoggedIn={isLoggedIn}
                />
              </motion.div>
            )}

            {step === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <HistorySection
                  isLoggedIn={isLoggedIn}
                  historyData={historyData}
                  onViewResult={(item: HistoryItem) => {
                    // TODO: Navigate to result page with history data
                    console.log("View result:", item);
                  }}
                  onNewAnalysis={() => setStep("intro")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Global Floating Turtle Guide */}
      <TurtleGuide
        message={getGuideMessage()}
        isThinking={step === "analyzing"}
      />
    </Layout>
  );
}