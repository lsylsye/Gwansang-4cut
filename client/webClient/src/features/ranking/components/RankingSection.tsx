import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp, Sparkles, CheckCircle, Users, ArrowLeft, Share2, Search, Inbox, AlertCircle } from "lucide-react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Toast } from "@/shared/components/Toast";
import { getRankings, registerRanking } from "@/shared/api/rankingApi";

interface RankingItem {
  id: string | number;
  teamName: string;
  score: number;
  members: number;
  rank: number;
  isUser?: boolean;
  /** 멤버 이름 (인원수 옆에 표시, 우리 팀은 인적 사항에서 불러옴) */
  memberNames?: string[];
}

const CIRCLE_R = 21;

function loadRankings(
  setBase: (items: RankingItem[]) => void,
  setLoading: (v: boolean) => void,
  setError: (v: boolean) => void
) {
  setLoading(true);
  setError(false);
  getRankings()
    .then((data) => {
      const mapped = data
        .map((item, i) => ({
            id: i + 1,
            teamName: item.title,
            score: item.score,
            members: item.numberOfMembers,
            rank: i + 1,
          memberNames: item.memberNames?.map((m) => m.name) ?? [],
        }))
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, rank: index + 1 }));
      setBase(mapped);
    })
    .catch(() => {
      setBase([]);
      setError(true);
    })
    .finally(() => setLoading(false));
}

/** 리스트용 점수 뱃지 — 알약 형태 (원 대신 사용) */
function ScoreBadge({
  score,
  isUser,
  isHighRank,
  className = "",
}: {
  score: number;
  isUser?: boolean;
  isHighRank?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 flex flex-col items-center gap-0.5 ${className}`}
    >
      <div
        className={`
          flex items-center justify-center min-w-[52px] px-3 py-2 rounded-full
          font-black text-base font-sans tabular-nums
          border-2 shadow-sm
          ${isUser
            ? "bg-brand-orange/10 text-brand-orange border-brand-orange/40"
            : isHighRank
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-gray-50 text-gray-700 border-gray-200"
          }
        `}
      >
        <span>{score}</span>
        <span className="text-xs font-semibold ml-0.5 opacity-90">점</span>
      </div>
    </div>
  );
}

/** 원형 점수 표시 (isTop3 또는 isHighRank 시 진한 색) */
function ScoreCircle({
  score,
  isUser,
  isTop3,
  isHighRank,
  size = 48,
  className = "",
}: {
  score: number;
  isUser?: boolean;
  isTop3?: boolean;
  /** 리스트 내 4~10위 등 강조 */
  isHighRank?: boolean;
  size?: number;
  className?: string;
}) {
  const r = (CIRCLE_R / 48) * size;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;

  const strokeColor = isUser ? "var(--brand-orange)" : isTop3 || isHighRank ? "var(--brand-orange)" : "var(--color-gray-200)";
  const textColor = isUser ? "text-brand-orange" : isTop3 || isHighRank ? "text-amber-700" : "text-gray-800";

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-gray-100"
          strokeWidth={Math.max(2, (3 / 48) * size)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={Math.max(2, (3 / 48) * size)}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
        />
      </svg>
      <span className={`text-[10px] font-black font-sans absolute ${textColor}`} style={{ fontSize: `${size * 0.28}px` }}>
        {score}
      </span>
    </div>
  );
}

interface RankingSectionProps {
  onBack: () => void;
  userScore: number;
  initialTeamName: string;
  fromAnalysis?: boolean;
  /** 인적 사항에 등록한 멤버 이름 (우리 팀 카드에 인원수 옆에 표시) */
  memberNames?: string[];
  /** 랭킹 등록 성공 시 호출 (결과 화면에서 '랭킹 보기' 버튼으로 바꿀 때 사용) */
  onRankingRegistered?: () => void;
}

export const RankingSection: React.FC<RankingSectionProps> = ({
  onBack,
  userScore,
  initialTeamName,
  fromAnalysis = false,
  memberNames = [],
  onRankingRegistered,
}) => {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [isFixed, setIsFixed] = useState(false);
  const [baseRankings, setBaseRankings] = useState<RankingItem[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const [rankingsError, setRankingsError] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; type: "success" | "error" }>({
    open: false,
    message: "",
    type: "success",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRankings(setBaseRankings, setRankingsLoading, setRankingsError);
  }, []);

  const names = memberNames.filter(Boolean);
  const normalizedTeamName = teamName.trim() || "우리 팀";
  const userEntry: RankingItem = {
    id: "user",
    teamName: normalizedTeamName,
    score: userScore,
    members: names.length || 4,
    rank: 0,
    isUser: true,
    memberNames: names.length ? names : undefined,
  };
  // 등록 후에는 서버 목록(baseRankings)에 이미 우리 팀이 포함되므로, 중복 제거 후 userEntry 하나만 넣어 한 번만 표시
  const rankings = isFixed
    ? (() => {
        const withoutDuplicate = baseRankings.filter(
          (r) => !(r.teamName === normalizedTeamName && r.score === userScore)
        );
        return [...withoutDuplicate, userEntry]
          .sort((a, b) => b.score - a.score)
          .map((item, index) => ({ ...item, rank: index + 1 }));
      })()
    : baseRankings;

  const top3 = rankings.filter((r) => r.rank <= 3);
  const restRankings = rankings.filter((r) => r.rank > 3 && r.rank <= 20);
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = searchQuery.trim()
    ? rankings.filter((r) => r.teamName.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 px-4 relative">
      {/* 배경 깊이감: TOP3 상단 영역 뒤 은은한 블러/그라데이션 (초록 톤) */}
      <div
        className="absolute top-[140px] left-1/2 -translate-x-1/2 w-[min(100%,900px)] h-72 rounded-full pointer-events-none opacity-70"
        style={{
          background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.04) 50%, transparent 75%)",
          filter: "blur(28px)",
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 font-display tracking-tight drop-shadow-sm">
          관상네컷 모임 랭킹
        </h2>
        <p className="text-gray-600 mt-3 font-hand font-medium text-base md:text-lg">거북도사님이 분석한 최고의 궁합 모임을 확인해보세요!</p>
        {/* 팀명 검색 — 등록 단계가 아닐 때만 표시 (등록 후 또는 그냥 랭킹 확인할 때만) */}
        {(!fromAnalysis || isFixed) && (
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="팀명 검색 — 우리 팀 순위·점수 확인"
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all shadow-sm font-medium text-center sm:text-left"
            />
          </div>
        )}
      </motion.div>

      {/* 팀명 등록 카드 (fromAnalysis && !isFixed) — 3줄 레이아웃, 테두리 비오렌지 */}
      {fromAnalysis && !isFixed && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-14 mb-24 mx-2 sm:mx-4">
          <GlassCard className="p-6 sm:p-8 border-2 border-emerald-200 bg-emerald-50/90 shadow-clay-md">
            <div className="flex flex-col gap-4">
              {/* 1줄: 아이콘 + 제목·부제 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-orange relative shrink-0">
                  <Sparkles className="absolute -top-0.5 -right-0.5 text-yellow-500 animate-pulse" size={12} />
                  <TrendingUp size={24} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 font-display">먼저 우리 팀 이름을 정해주게!</h3>
                  <p className="text-gray-500 font-sans text-sm mt-0.5">
                    궁합 점수 <span className="text-brand-orange font-bold">{userScore}점</span>으로 랭킹에 등록하려네.
                  </p>
                </div>
              </div>
              {/* 2줄: 팀명 입력 + 랭킹에 등록하기 나란히 */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-stretch">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="flex-1 min-w-0 h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-base font-bold font-display text-center sm:text-left focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all shadow-sm"
                  placeholder="팀명을 입력해 주세요"
                />
                <ActionButton
                  variant="primary-soft"
                  onClick={async () => {
                    const names = memberNames.filter(Boolean);
                    const payload = {
                      score: userScore,
                      title: teamName.trim() || "우리 팀",
                      numberOfMembers: names.length || 4,
                      memberNames: (names.length ? names : []).map((name) => ({ name })),
                    };
                    setIsSubmitting(true);
                    try {
                      await registerRanking(payload);
                      setIsFixed(true);
                      onRankingRegistered?.();
                      setToast({ open: true, message: "랭킹에 등록되었어요!", type: "success" });
                      loadRankings(setBaseRankings, setRankingsLoading, setRankingsError);
                    } catch {
                      setToast({ open: true, message: "랭킹 등록에 실패했어요. 다시 시도해 주세요.", type: "error" });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="shrink-0 h-12 px-6 text-base flex items-center justify-center gap-2 !rounded-xl"
                >
                  <CheckCircle size={20} />
                  {isSubmitting ? "등록 중…" : "랭킹에 등록하기"}
                </ActionButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* 검색 중: 결과만 표시 / 검색 전: TOP3 + 4~20 리스트 (등록 단계에서는 검색 결과 비표시) */}
      <div className={`flex flex-col gap-10 transition-opacity duration-300 ${fromAnalysis && !isFixed ? "opacity-40 pointer-events-none" : ""}`}>
        {searchQuery.trim() && (!fromAnalysis || isFixed) ? (
          /* 검색 결과만 — 순위 리스트 영역 재사용 */
          <section className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-4 sm:p-6">
            {searchResults.length === 0 ? (
              <p className="text-center text-gray-500 font-sans py-12">검색 결과가 없습니다.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-sans text-center mb-4">
                  &quot;{searchQuery.trim()}&quot; 검색 결과 {searchResults.length}건
                </p>
                <div className="space-y-2 max-w-2xl mx-auto">
                  {searchResults.map((item) => {
                    const isUser = item.isUser;
                    const showTrophy = item.rank <= 10;
                    return (
                      <GlassCard
                        key={item.id}
                        className={`p-4 flex items-center gap-4 border rounded-xl ${isUser ? "border-brand-orange bg-orange-50/80 ring-2 ring-brand-orange/25" : "border-gray-200 bg-white shadow-sm"}`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-base font-sans ${
                          isUser ? "bg-brand-orange text-white" : showTrophy ? "bg-brand-orange/90 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          {item.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold font-display truncate ${isUser ? "text-brand-orange" : "text-gray-900"}`}>
                            {item.teamName}
                            {isUser && <span className="ml-1 text-xs font-sans bg-brand-orange/25 text-brand-orange font-bold px-1.5 py-0.5 rounded uppercase">YOU</span>}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 font-sans mt-1">
                            <span className="flex items-center gap-1"><Users size={12} /> {item.memberNames?.length ? `${item.members}명 · ${item.memberNames.join(", ")}` : `${item.members}명`}</span>
                          </div>
                        </div>
                        <ScoreBadge score={item.score} isUser={isUser} isHighRank={showTrophy} />
                      </GlassCard>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        ) : rankingsLoading ? (
          <section className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-12 text-center">
            <p className="text-gray-500 font-sans">랭킹을 불러오는 중…</p>
          </section>
        ) : rankingsError ? (
          <section className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-12 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-12 h-12 text-gray-400 shrink-0" />
            <p className="text-gray-500 font-sans">랭킹을 불러오지 못했어요.</p>
          </section>
        ) : rankings.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-12 text-center flex flex-col items-center gap-3">
            <Inbox className="w-12 h-12 text-gray-400 shrink-0" />
            <p className="text-gray-500 font-sans">아직 등록된 랭킹이 없어요.</p>
          </section>
        ) : (
          <>
        {/* 상단: TOP3 전용 섹션 — 좌우 32px 여백 */}
        <section className="relative px-8">
          {/* 왕관 이모지 */}
          <motion.span
            className="absolute right-[12%] top-[-18%] z-20 select-none pointer-events-none opacity-90 rotate-[5deg]"
            style={{ fontSize: "clamp(3.75rem, 7.5vw, 6rem)", lineHeight: 1 }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            aria-hidden
          >
            👑
          </motion.span>

          <div className="relative z-10 rounded-3xl bg-gradient-to-b from-emerald-50/90 to-white shadow-clay-md p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {top3.map((item, index) => {
                const rankNum = item.rank;
                const rankLabel = rankNum === 1 ? "1위" : rankNum === 2 ? "2위" : "3위";
                // 1위 금, 2위 은, 3위 동
                const rankGradient =
                  rankNum === 1
                    ? "from-amber-300 to-yellow-200"
                    : rankNum === 2
                      ? "from-gray-300 to-slate-200"
                      : "from-orange-300 to-amber-200";
                const profileEmoji = rankNum === 1 ? "🏆" : rankNum === 2 ? "🥈" : "🥉";
                const isFirst = rankNum === 1;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex flex-col ${isFirst ? "sm:order-2 sm:z-10" : rankNum === 2 ? "sm:order-1" : "sm:order-3"}`}
                  >
                    <GlassCard
                      className={`relative flex flex-col flex-1 p-4 sm:p-5 overflow-hidden rounded-2xl border-2 shadow-clay-sm ${
                        item.isUser
                          ? "border-orange-300 bg-orange-50/90 ring-2 ring-orange-200/40 sm:scale-[1.02]"
                          : isFirst
                            ? "border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/90 sm:scale-[1.02]"
                            : rankNum === 2
                              ? "border-gray-200/80 bg-gradient-to-br from-white to-gray-50/80"
                              : "border-gray-200/80 bg-gradient-to-br from-white to-orange-50/60"
                      }`}
                      style={isFirst && !item.isUser ? { boxShadow: "0 0 20px rgba(245,158,11,0.22), 0 0 40px rgba(251,191,36,0.12), 0 2px 10px rgba(0,0,0,0.05)" } : item.isUser ? { boxShadow: "0 0 16px rgba(249,115,22,0.2), 0 2px 10px rgba(0,0,0,0.06)" } : undefined}
                    >
                      {/* 1·2·3위 뱃지: 카드 우측 상단에 고정 */}
                      <div className={`absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-gradient-to-br ${rankGradient} border border-white shadow-sm`}>
                        <span className={`text-sm font-black font-sans ${rankNum === 1 ? "text-amber-900" : rankNum === 2 ? "text-gray-700" : "text-orange-900"}`}>{rankLabel}</span>
                      </div>

                      <div className={`relative z-10 flex flex-col flex-1`}>
                      <div className="flex justify-center mt-0.5 mb-2">
                        <div
                          className={`rounded-xl border-2 flex items-center justify-center shadow-sm ${
                            isFirst
                              ? "w-16 h-16 sm:w-20 sm:h-20 text-4xl sm:text-5xl bg-amber-50 border-amber-200"
                              : item.isUser
                                ? "w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl bg-orange-50 border-orange-300"
                                : rankNum === 2
                                  ? "w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl bg-gray-50 border-gray-200"
                                  : "w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl bg-orange-50/80 border-orange-200"
                          }`}
                        >
                          {profileEmoji}
                        </div>
                      </div>

                      {/* 점수 뱃지 — 1위 노란/금, 2·3위 초록 톤 */}
                      <div className="flex justify-center gap-2 mb-2">
                        <span
                          className={`relative inline-flex items-center gap-3 px-4 py-3 rounded-2xl overflow-hidden ${
                            item.isUser
                              ? "bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50/80 border-2 border-orange-300 shadow-sm shadow-orange-200/20"
                              : isFirst
                                ? "bg-gradient-to-br from-amber-200 via-amber-100 to-yellow-50 border-2 border-amber-400/80 shadow-sm shadow-amber-200/20"
                                : rankNum === 2
                                  ? "bg-gradient-to-br from-emerald-100/80 via-white to-emerald-50/50 border-2 border-emerald-300/60 shadow-sm shadow-emerald-100/20"
                                  : "bg-gradient-to-br from-emerald-100/80 via-white to-emerald-50/50 border-2 border-emerald-300/60 shadow-sm shadow-emerald-100/20"
                          }`}
                        >
                          <span className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl pointer-events-none" aria-hidden />
                          <span className="relative z-10 font-black font-sans tabular-nums">
                            <span className={item.isUser ? "text-2xl text-brand-orange" : isFirst ? "text-2xl text-amber-900" : "text-xl text-emerald-800"}>{item.score}</span>
                            <span className={item.isUser ? "text-lg text-orange-600 ml-0.5" : isFirst ? "text-lg text-amber-700 ml-0.5" : "text-lg text-emerald-600 ml-0.5"}>점</span>
                          </span>
                        </span>
                      </div>

                      <h4 className={`font-bold text-gray-900 font-display text-center px-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 ${isFirst ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}>
                        <span className="truncate max-w-full">{item.teamName}</span>
                        {item.isUser && (
                          <span className="shrink-0 text-xs font-sans bg-brand-orange/25 text-brand-orange font-bold px-2 py-0.5 rounded uppercase">
                            우리 팀
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 font-sans text-center mt-1">
                        {item.memberNames?.length
                          ? `${item.members}명 · ${item.memberNames.join(", ")}`
                          : `${item.members}명`}
                      </p>
                      </div>
                      {/* 1위 전용 반짝거리는 효과 — 콘텐츠 위 레이어로 표시 */}
                      {isFirst && (
                        <div
                          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-[15]"
                          aria-hidden
                        >
                          <motion.div
                            className="absolute inset-0 w-[70%]"
                            style={{
                              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                            }}
                            animate={{ x: ["-120%", "220%"] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="absolute inset-0 w-[70%]"
                            style={{
                              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                            }}
                            animate={{ x: ["-120%", "220%"] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
                          />
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 하단: 4~20위 순위 리스트 — 좌우 2열 */}
        <section className="flex flex-col">
          {restRankings.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-8">
              <p className="text-gray-500 font-sans text-center text-base">4~20위가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-3 space-y-2.5">
                {restRankings.slice(0, Math.ceil(restRankings.length / 2)).map((item, index) => {
                const isUser = item.isUser;
                const showTrophy = item.rank <= 10;
                const isFirstAfterTop10 = item.rank === 11;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {isFirstAfterTop10 && (
                      <div className="flex items-center gap-3 py-2 mb-1">
                        <div className="flex-1 h-0.5 bg-gray-300" />
                        <span className="text-xs font-bold text-gray-400 font-sans">TOP 10</span>
                        <div className="flex-1 h-0.5 bg-gray-300" />
                      </div>
                    )}
                    <GlassCard
                      className={`p-3 sm:p-4 flex items-center gap-3 border transition-all rounded-xl ${isUser ? "border-brand-orange bg-orange-50/80 ring-2 ring-brand-orange/25 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]" : "border-gray-200 bg-white shadow-sm hover:shadow-md"}`}
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm font-sans ${
                        isUser ? "bg-brand-orange text-white shadow-clay-xs" : showTrophy ? "bg-brand-orange/90 text-white shadow-clay-xs" : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold font-display truncate text-sm sm:text-base ${isUser ? "text-brand-orange" : "text-gray-900"}`}>
                          {item.teamName}
                          {isUser && <span className="ml-1 text-xs font-sans bg-brand-orange/25 text-brand-orange font-bold px-1.5 py-0.5 rounded uppercase">YOU</span>}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-sans mt-0.5">
                          <span className="flex items-center gap-0.5"><Users size={10} /> {item.memberNames?.length ? `${item.members}명 · ${item.memberNames.join(", ")}` : `${item.members}명`}</span>
                        </div>
                      </div>
                      <ScoreBadge score={item.score} isUser={isUser} isHighRank={showTrophy} />
                    </GlassCard>
                  </motion.div>
                );
              })}
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/90 shadow-md p-3 space-y-2.5">
                {restRankings.slice(Math.ceil(restRankings.length / 2)).map((item, index) => {
                const isUser = item.isUser;
                const showTrophy = item.rank <= 10;
                const isFirstAfterTop10 = item.rank === 11;
                const idx = Math.ceil(restRankings.length / 2) + index;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    {isFirstAfterTop10 && (
                      <div className="flex items-center gap-3 py-2 mb-1">
                        <div className="flex-1 h-0.5 bg-gray-300" />
                        <span className="text-xs font-bold text-gray-400 font-sans">TOP 10</span>
                        <div className="flex-1 h-0.5 bg-gray-300" />
                      </div>
                    )}
                    <GlassCard
                      className={`p-3 sm:p-4 flex items-center gap-3 border transition-all rounded-xl ${isUser ? "border-brand-orange bg-orange-50/80 ring-2 ring-brand-orange/25 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]" : "border-gray-200 bg-white shadow-sm hover:shadow-md"}`}
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm font-sans ${
                        isUser ? "bg-brand-orange text-white shadow-clay-xs" : showTrophy ? "bg-brand-orange/90 text-white shadow-clay-xs" : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold font-display truncate text-sm sm:text-base ${isUser ? "text-brand-orange" : "text-gray-900"}`}>
                          {item.teamName}
                          {isUser && <span className="ml-1 text-xs font-sans bg-brand-orange/25 text-brand-orange font-bold px-1.5 py-0.5 rounded uppercase">YOU</span>}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-sans mt-0.5">
                          <span className="flex items-center gap-0.5"><Users size={10} /> {item.memberNames?.length ? `${item.members}명 · ${item.memberNames.join(", ")}` : `${item.members}명`}</span>
                        </div>
                      </div>
                      <ScoreBadge score={item.score} isUser={isUser} isHighRank={showTrophy} />
                    </GlassCard>
                  </motion.div>
                );
              })}
              </div>
            </div>
          )}
        </section>
          </>
        )}
      </div>

      {/* 하단 버튼 */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-wrap justify-center gap-4">
        {fromAnalysis && (
          <>
            <ActionButton variant="secondary" onClick={onBack} className="px-8 py-4 flex items-center gap-2">
              <ArrowLeft size={18} />
              돌아가기
            </ActionButton>
          </>
        )}
        {isFixed && (
          <ActionButton onClick={() => alert("준비 중입니다!")} className="px-8 py-4 flex items-center gap-2">
            <Share2 size={18} />
            이 랭킹 공유하기
          </ActionButton>
        )}
      </motion.div>

      <Toast
        isOpen={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
};
