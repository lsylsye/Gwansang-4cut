import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, TrendingUp, Sparkles, CheckCircle, Medal, Users, ArrowLeft, Crown, ChevronLeft, ChevronRight, Star, Share2, RefreshCw } from "lucide-react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
// @ts-ignore
import { getRandomNickname } from "@woowa-babble/random-nickname";

interface RankingItem {
  id: string | number;
  teamName: string;
  score: number;
  members: number;
  rank: number;
  tag: string;
  isUser?: boolean;
}

const MOCK_RANKINGS: RankingItem[] = [
  { id: 1, teamName: "환상의 짝꿍 팀", score: 98, members: 4, rank: 1, tag: "천생연분" },
  { id: 2, teamName: "마라탕 처돌이들", score: 92, members: 3, rank: 2, tag: "도원결의" },
  { id: 3, teamName: "밤샘 코딩러들", score: 85, members: 5, rank: 3, tag: "동고동락" },
  { id: 4, teamName: "불타는 청춘", score: 79, members: 2, rank: 4, tag: "화끈화끈" },
  { id: 5, teamName: "거북이 친구들", score: 72, members: 6, rank: 5, tag: "장수기원" },
  { id: 6, teamName: "주말 등산러", score: 68, members: 4, rank: 6, tag: "일편단심" },
  { id: 7, teamName: "새벽 러닝크루", score: 65, members: 3, rank: 7, tag: "활력충전" },
  { id: 8, teamName: "독서 모임", score: 62, members: 5, rank: 8, tag: "지혜의샘" },
  { id: 9, teamName: "요리 마스터즈", score: 58, members: 4, rank: 9, tag: "미식가들" },
  { id: 10, teamName: "사진 찍는 사람들", score: 55, members: 6, rank: 10, tag: "순간포착" },
  { id: 11, teamName: "게임 프렌즈", score: 52, members: 4, rank: 11, tag: "원팀원드림" },
  { id: 12, teamName: "여행가는 날", score: 48, members: 5, rank: 12, tag: "여행러버" },
  { id: 13, teamName: "커피 애호가", score: 45, members: 3, rank: 13, tag: "카페인중독" },
  { id: 14, teamName: "헬스 매니아", score: 42, members: 4, rank: 14, tag: "근육신화" },
  { id: 15, teamName: "영화 보는 친구들", score: 38, members: 6, rank: 15, tag: "시네마틱" },
];

// Mock user's team rankings
const MOCK_USER_RANKINGS: RankingItem[] = [
  { id: "user1", teamName: "우리 팀", score: 88, members: 4, rank: 1, tag: "내 모임", isUser: true },
  { id: "user2", teamName: "지난주 모임", score: 76, members: 5, rank: 2, tag: "내 모임" },
  { id: "user3", teamName: "동창 모임", score: 64, members: 6, rank: 3, tag: "내 모임" },
];

// Random team name candidates
// const RANDOM_TEAM_NAMES = [
//   "환상의 짝꿍들",
//   "운명의 동반자",
//   "천생연분 크루",
//   "도원결의 팀",
//   "불타는 우정",
//   "황금빛 인연",
//   "영원한 벗들",
//   "행운의 파트너",
//   "별이 빛나는 모임",
//   "무지개 우정단",
//   "기적의 조합",
//   "찰떡궁합 팀",
//   "비밀의 화원",
//   "드림팀 클럽",
//   "우주 최강 모임",
//   "레전드 친구들",
//   "불패신화 크루",
//   "기운이 넘치는 팀",
//   "빛나는 인연",
//   "특급 우정단",
// ];

interface RankingSectionProps {
  onBack: () => void;
  onHome: () => void;
  userScore: number;
  initialTeamName: string;
  fromAnalysis?: boolean; // 분석 완료 후 랭킹으로 왔는지 여부
}

export const RankingSection: React.FC<RankingSectionProps> = ({
  onBack,
  onHome,
  userScore,
  initialTeamName,
  fromAnalysis = false
}) => {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [isFixed, setIsFixed] = useState(false);
  const [rankings, setRankings] = useState<RankingItem[]>(MOCK_RANKINGS);
  const [userRank, setUserRank] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isFixed) {
      // Calculate user position
      const allRankings = [...MOCK_RANKINGS, {
        id: "user",
        teamName: teamName,
        score: userScore,
        members: 4, // Assume 4 for demo or pass it from props
        rank: 0,
        tag: "우리 팀",
        isUser: true
      }].sort((a, b) => b.score - a.score);

      const rankedWithIndex = allRankings.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      setRankings(rankedWithIndex);
      setUserRank(rankedWithIndex.find(item => item.isUser)?.rank || 0);
    }
  }, [isFixed, teamName, userScore]);

  const handleTabChange = (tab: "all" | "my") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 랜덤 팀 이름 생성 함수
  const handleRandomTeamName = () => {
    // animals, characters, heros, monsters 중 랜덤 선택
    const types = ['animals', 'characters', 'heros', 'monsters'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomNickname = getRandomNickname(randomType);
    setTeamName(randomNickname || '환상의 팀');
  };

  // 현재 보여줄 랭킹 데이터 결정
  const currentRankings = activeTab === "my" ? MOCK_USER_RANKINGS : rankings;
  const totalPages = Math.ceil(currentRankings.length / itemsPerPage);
  const paginatedRankings = currentRankings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-full border-2 border-yellow-100 shadow-sm mb-4">
          <Trophy size={20} className="animate-bounce" />
          <span className="font-bold text-sm font-sans uppercase tracking-widest">Global Ranking</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display">천하제일 궁합 랭킹</h2>
        <p className="text-gray-500 mt-3 font-sans">거북도사가 인증한 전국의 환상적인 모임들을 확인해 보세요</p>
      </motion.div>

      {/* Team Name Registration / Highlight Card */}
      {fromAnalysis && !isFixed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <GlassCard className="p-8 border-4 border-brand-orange/30 bg-orange-50/30 shadow-pixel-lg">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-clay-sm flex items-center justify-center text-brand-orange relative">
                <Sparkles className="absolute -top-2 -right-2 text-yellow-500 animate-pulse" />
                <TrendingUp size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800 font-display">먼저 우리 팀 이름을 정해주게!</h3>
                <p className="text-gray-500 font-sans">궁합 점수 <span className="text-brand-orange font-bold">{userScore}점</span>으로 랭킹에 등록하려네.</p>
              </div>

              <div className="w-full max-w-md space-y-3">
                <div className="relative group flex items-center gap-2">
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="flex-1 px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xl font-bold font-display text-center focus:outline-none focus:border-brand-orange transition-all shadow-clay-xs group-hover:shadow-clay-sm"
                    placeholder="팀명을 입력해 주세요"
                  />
                  <ActionButton
                    variant="secondary"
                    onClick={handleRandomTeamName}
                    className="!p-0 !w-12 !h-12 shrink-0"
                    title="랜덤 이름 생성"
                  >
                    <RefreshCw size={20} />
                  </ActionButton>
                </div>
              </div>

              <ActionButton onClick={() => setIsFixed(true)} className="px-12 py-5 text-xl flex items-center gap-2">
                <CheckCircle size={24} />
                랭킹에 등록하기
              </ActionButton>
            </div>
          </GlassCard>
        </motion.div>
      ) : fromAnalysis && isFixed ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-brand-orange text-white p-6 rounded-3xl shadow-clay-md flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center font-black">
                <span className="text-xs uppercase opacity-70">RANK</span>
                <span className="text-2xl">{userRank}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display leading-tight">{teamName}</h3>
                <p className="text-white/80 font-sans text-sm">상위 {Math.round((userRank / rankings.length) * 100)}%의 기운을 가진 팀이구먼!</p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2">
              <div className="text-right">
                <span className="block text-xs uppercase opacity-70 font-bold">Total Score</span>
                <span className="text-3xl font-black font-sans">{userScore}</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-clay-sm">
                <Trophy size={24} />
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-brand-orange text-white p-6 rounded-3xl shadow-clay-md flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center font-black">
                <span className="text-xs uppercase opacity-70">RANK</span>
                <span className="text-2xl">{userRank}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display leading-tight">{teamName}</h3>
                <p className="text-white/80 font-sans text-sm">상위 {Math.round((userRank / rankings.length) * 100)}%의 기운을 가진 팀이구먼!</p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2">
              <div className="text-right">
                <span className="block text-xs uppercase opacity-70 font-bold">Total Score</span>
                <span className="text-3xl font-black font-sans">{userScore}</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-clay-sm">
                <Trophy size={24} />
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </motion.div>
      )}

      {/* Ranking List */}
      <div className={`space-y-4 transition-opacity duration-500 ${fromAnalysis && !isFixed ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
        {paginatedRankings.map((item, index) => {
          const isTop3 = item.rank <= 3;
          const isUser = item.isUser;

          const rankColors = {
            1: "bg-yellow-50 border-yellow-200 text-yellow-700",
            2: "bg-gray-50 border-gray-200 text-gray-600",
            3: "bg-orange-50 border-orange-200 text-orange-700",
          }[item.rank as 1 | 2 | 3] || "bg-white border-gray-100 text-gray-400";

          const RankIcon = {
            1: Crown,
            2: Medal,
            3: Star,
          }[item.rank as 1 | 2 | 3] || Users;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard
                className={`p-5 flex items-center gap-6 relative overflow-hidden group transition-all 
                  ${isUser ? 'border-2 border-brand-orange bg-orange-50/10 shadow-clay-sm z-20 scale-[1.02]' : 'border-gray-100 shadow-pixel'}`}
              >
                {/* Rank Number */}
                <div className={`w-12 h-12 rounded-xl ${isUser ? 'bg-brand-orange text-white shadow-clay-xs' : rankColors} flex flex-col items-center justify-center shrink-0 relative z-10`}>
                  <span className="text-base font-black font-sans">{item.rank}</span>
                  <RankIcon size={14} className="mt-[-2px]" />
                </div>

                {/* Team Info */}
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`text-lg font-bold font-display tracking-tight ${isUser ? 'text-brand-orange' : 'text-gray-800'}`}>
                      {item.teamName}
                      {isUser && <span className="ml-2 text-xs font-bold font-sans bg-brand-orange/10 px-2 py-0.5 rounded-md uppercase">YOU</span>}
                    </h3>
                    {!isUser && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-lg border border-gray-200 uppercase">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-sans">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {item.members}명
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${isUser ? 'text-brand-orange' : 'text-gray-400'}`}>
                      <TrendingUp size={12} /> {item.score}점
                    </span>
                  </div>
                </div>

                {/* Small Score Circle */}
                <div className="shrink-0 relative z-10">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white shadow-inner relative ${isUser ? 'border-brand-orange/30' : 'border-gray-50'}`}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="21"
                        fill="none"
                        stroke={isUser ? "var(--brand-orange)" : (isTop3 ? "var(--brand-orange)" : "var(--color-gray-200)")}
                        strokeWidth="3"
                        strokeDasharray={`${(item.score / 100) * 131.9} 131.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`text-[10px] font-black font-sans ${isUser ? 'text-brand-orange' : 'text-gray-800'}`}>{item.score}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          <ActionButton
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft size={18} />
          </ActionButton>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === page
                  ? 'bg-brand-orange text-white shadow-clay-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <ActionButton
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <ChevronRight size={18} />
          </ActionButton>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex flex-wrap justify-center gap-4"
      >
        {fromAnalysis && (
          <>
            <ActionButton
              variant="secondary"
              onClick={onBack}
              className="px-8 py-4 flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              돌아가기
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={onHome}
              className="px-8 py-4 flex items-center gap-2"
            >
              처음으로
            </ActionButton>
          </>
        )}
        {isFixed && (
          <ActionButton
            onClick={() => alert("준비 중입니다!")}
            className="px-8 py-4 flex items-center gap-2"
          >
            <Share2 size={18} />
            이 랭킹 공유하기
          </ActionButton>
        )}
      </motion.div>
    </div>
  );
};