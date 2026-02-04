import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { User, Users, Calendar, Clock, ArrowRight, Sparkles, Package, TrendingUp, Eye, BarChart3 } from "lucide-react";
import { HistoryItem } from "@/shared/types";

interface HistorySectionProps {
  onViewResult?: (item: HistoryItem) => void;
  onNewAnalysis?: () => void;
  historyData?: HistoryItem[];
}

// Mock data for demonstration
const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "1",
    type: "personal",
    date: "2026-01-15",
    timestamp: "14:30",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    ]
  },
  {
    id: "2",
    type: "group",
    date: "2026-01-12",
    timestamp: "16:45",
    teamName: "기운찬 도사님들의 모임",
    memberCount: 4,
    score: 88,
    thumbnail: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop"
  },
  {
    id: "3",
    type: "personal",
    date: "2026-01-10",
    timestamp: "11:20",
    images: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    ]
  },
  {
    id: "4",
    type: "group",
    date: "2026-01-08",
    timestamp: "19:15",
    teamName: "운수대통 친구들",
    memberCount: 5,
    score: 92,
    thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"
  }
];

export const HistorySection: React.FC<HistorySectionProps> = ({
  onViewResult,
  onNewAnalysis,
  historyData: propHistoryData
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "personal" | "group">("all");
  const historyData = propHistoryData || MOCK_HISTORY;

  const stats = useMemo(() => {
    const personalCount = historyData.filter(i => i.type === "personal").length;
    const groupCount = historyData.filter(i => i.type === "group").length;
    const avgGroupScore = groupCount > 0
      ? Math.round(historyData.filter(i => i.type === "group" && i.score).reduce((acc, i) => acc + (i.score || 0), 0) / groupCount)
      : 0;

    // Get most recent date
    const sortedByDate = [...historyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastAnalysis = sortedByDate[0]?.date || "-";

    return {
      total: historyData.length,
      personal: personalCount,
      group: groupCount,
      avgGroupScore,
      lastAnalysis
    };
  }, [historyData]);

  const filteredHistory = historyData.filter(item => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.timestamp}`);
    const dateB = new Date(`${b.date} ${b.timestamp}`);
    return dateB.getTime() - dateA.getTime();
  });

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full h-full bg-gradient-to-br from-brand-green-muted to-brand-green-light rounded-full flex items-center justify-center shadow-clay-md border-4 border-white"
        >
          <span className="text-6xl">🐢</span>
        </motion.div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center"
        >
          <Package size={16} className="text-brand-yellow-dark" />
        </motion.div>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">
        아직 관상 기록이 없구먼!
      </h3>
      <p className="text-gray-500 text-center mb-8 max-w-md leading-relaxed">
        {activeTab === "personal" && "개인 관상을 본 기록이 없습니다."}
        {activeTab === "group" && "모임 궁합을 본 기록이 없습니다."}
        {activeTab === "all" && "아직 관상을 본 기록이 없습니다."}
        <br />
        거북도사와 함께 운명을 확인해보세요.
      </p>
      <ActionButton
        variant="primary"
        onClick={onNewAnalysis}
      >
        <Sparkles size={18} className="mr-2" />
        새로운 관상 보러가기
      </ActionButton>
    </motion.div>
  );

  const PersonalHistoryCard = ({ item }: { item: HistoryItem }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group cursor-pointer"
      onClick={() => onViewResult?.(item)}
    >
      <GlassCard className="p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-brand-green/30 bg-gradient-to-br from-white to-gray-50/50">
        <div className="flex items-start gap-4">
          {/* Thumbnails */}
          <div className="flex gap-2 shrink-0">
            {item.images?.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className="w-14 h-16 rounded-lg overflow-hidden bg-gray-100 border-2 border-white shadow-sm group-hover:shadow-md transition-shadow"
              >
                <img
                  src={img}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1 bg-gradient-to-r from-brand-green-muted to-brand-green-light text-brand-green rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                <User size={12} />
                개인 관상
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{item.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{item.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 group-hover:bg-brand-green flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
            <ArrowRight size={18} className="text-gray-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  const GroupHistoryCard = ({ item }: { item: HistoryItem }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group cursor-pointer"
      onClick={() => onViewResult?.(item)}
    >
      <GlassCard className="p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-brand-orange/30 bg-gradient-to-br from-white to-orange-50/30">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          {item.thumbnail && (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm shrink-0 group-hover:shadow-md transition-shadow">
              <img
                src={item.thumbnail}
                alt="Group photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1 bg-gradient-to-r from-brand-orange-muted to-brand-orange-lightest text-brand-orange rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                <Users size={12} />
                모임 궁합
              </div>
              {item.score && (
                <div className="px-3 py-1 bg-gradient-to-r from-brand-yellow to-brand-yellow-muted text-brand-yellow-dark rounded-full text-xs font-bold shadow-sm">
                  {item.score}점
                </div>
              )}
            </div>
            <h4 className="font-bold text-gray-900 mb-2 truncate font-display text-base">
              {item.teamName}
            </h4>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{item.memberCount}명</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{item.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{item.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 group-hover:bg-brand-orange flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
            <ArrowRight size={18} className="text-gray-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 font-display flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-green to-brand-green-deepest rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 size={28} className="text-white" />
              </div>
              나의 히스토리
            </h1>
            <p className="text-gray-500 text-base ml-[68px]">
              거북도사와 함께한 관상 분석 기록을 한눈에 확인하세요
            </p>
          </div>
          <ActionButton
            variant="primary"
            onClick={onNewAnalysis}
            className="hidden md:flex"
          >
            <Sparkles size={18} className="mr-2" />
            새로운 관상 분석
          </ActionButton>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-5 bg-gradient-to-br from-white to-blue-50/50 border border-blue-100 shadow-sm hover:shadow-md transition-shadow h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                  <Eye size={20} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1 font-display">{stats.total}</div>
                <div className="text-sm text-gray-600 font-medium">총 분석 횟수</div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <GlassCard className="p-5 bg-gradient-to-br from-white to-teal-50/50 border border-teal-100 shadow-sm hover:shadow-md transition-shadow h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-deepest flex items-center justify-center shadow-sm">
                  <User size={20} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-green mb-1 font-display">{stats.personal}</div>
                <div className="text-sm text-gray-600 font-medium">개인 관상</div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-5 bg-gradient-to-br from-white to-orange-50/50 border border-orange-100 shadow-sm hover:shadow-md transition-shadow h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-deep flex items-center justify-center shadow-sm">
                  <Users size={20} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-orange mb-1 font-display">{stats.group}</div>
                <div className="text-sm text-gray-600 font-medium">모임 궁합</div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <GlassCard className="p-5 bg-gradient-to-br from-white to-yellow-50/50 border border-yellow-100 shadow-sm hover:shadow-md transition-shadow h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-yellow to-brand-yellow-muted flex items-center justify-center shadow-sm">
                  <TrendingUp size={20} className="text-brand-yellow-dark" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-yellow-dark mb-1 font-display">
                  {stats.avgGroupScore > 0 ? stats.avgGroupScore : "-"}
                </div>
                <div className="text-sm text-gray-600 font-medium">평균 모임 점수</div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-5 bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 shadow-sm hover:shadow-md transition-shadow h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
                  <Calendar size={20} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 mb-1 font-display truncate">
                  {stats.lastAnalysis}
                </div>
                <div className="text-sm text-gray-600 font-medium">최근 분석일</div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex gap-3 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit"
      >
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "all"
            ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-md"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          전체 기록
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "personal"
            ? "bg-gradient-to-r from-brand-green to-brand-green-deepest text-white shadow-md"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          <User size={16} />
          개인 관상
        </button>
        <button
          onClick={() => setActiveTab("group")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "group"
            ? "bg-gradient-to-r from-brand-orange to-brand-orange-deep text-white shadow-md"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          <Users size={16} />
          모임 궁합
        </button>
      </motion.div>

      {/* History List */}
      <AnimatePresence mode="wait">
        {filteredHistory.length === 0 ? (
          <EmptyState key="empty" />
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {item.type === "personal" ? (
                  <PersonalHistoryCard item={item} />
                ) : (
                  <GroupHistoryCard item={item} />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile New Analysis Button */}
      <div className="mt-8 md:hidden">
        <ActionButton
          variant="primary"
          onClick={onNewAnalysis}
          className="w-full"
        >
          <Sparkles size={18} className="mr-2" />
          새로운 관상 분석
        </ActionButton>
      </div>
    </div>
  );
};
