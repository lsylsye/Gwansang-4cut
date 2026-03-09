import React from "react";
import { motion } from "motion/react";
import { Trophy, Users, Award, AlertTriangle, ScrollText, Sparkles } from "lucide-react";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { Badge } from "@/components/ui/core/badge";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { MEMBER_CARD_PALETTE } from "./GroupResultTypes";
import { OverallDiagramSection } from "./OverallDiagramSection";
import { OverallMaintenanceSection } from "./OverallMaintenanceSection";
import type { GroupResultDataSource } from "./GroupResultTypes";
import type { MemberWithRole } from "./GroupResultTypes";

export interface OverallTabDesktopProps {
  dataSource: GroupResultDataSource;
  membersWithRoles: MemberWithRole[];
  onRankingClick: () => void;
  hasRegisteredRanking: boolean;
}

export const OverallTabDesktop: React.FC<OverallTabDesktopProps> = ({
  dataSource,
  membersWithRoles,
  onRankingClick,
  hasRegisteredRanking,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
    className="py-3 sm:py-4 space-y-4 sm:space-y-8"
  >
    <GlassCard className="border-2 sm:border-4 border-white rounded-2xl shadow-clay-md p-4 sm:p-5 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="inline-flex items-baseline gap-1.5 shrink-0 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-300">
          <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 tabular-nums leading-none">
            {typeof dataSource.compatibility?.score === "number" ? dataSource.compatibility.score : "-"}
          </span>
          <span className="text-sm sm:text-base font-bold text-orange-600 leading-none">점</span>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 sm:pl-1">
          <p className="text-xs sm:text-sm text-gray-500 font-hand font-medium">우리 팀을 한마디로 정리하자면?</p>
          <p className="text-base sm:text-lg md:text-xl text-gray-800 font-display font-bold leading-snug">"{dataSource.personality.title}"</p>
        </div>
        <div className="flex items-center justify-start sm:justify-end shrink-0 self-center">
          <ActionButton
            variant="orange-primary"
            onClick={onRankingClick}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold shadow-lg hover:scale-105 transition-all"
          >
            <Trophy size={14} />
            {hasRegisteredRanking ? "랭킹 보기" : "이 점수 랭킹 등록하기"}
          </ActionButton>
        </div>
      </div>
    </GlassCard>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      <GlassCard className="flex flex-col p-4 sm:p-6 lg:p-8 border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md bg-gradient-to-br from-white/80 to-orange-50/30 h-full">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">거북도사의 총평</h3>
        </div>
        <div className="flex-1 min-h-0 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[50vh] sm:max-h-[600px]">
          <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
            <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-2 sm:mb-3 font-display flex items-center gap-2">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">1</span>
              모임의 조화 및 균형 해석
            </h4>
            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans min-w-0 break-words">{dataSource.personality.harmony}</p>
          </section>
          <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
            <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4 font-display flex items-center gap-2">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">2</span>
              종합 궁합 해석
            </h4>
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50/30 to-orange-50/30 rounded-xl border border-blue-200/50">
              <OverallDiagramSection membersWithRoles={membersWithRoles} showKeywords idPrefix="desktop" maxWidthClass="max-w-[280px] sm:max-w-md" />
            </div>
            <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans mb-2 sm:mb-3 min-w-0 break-words">{dataSource.personality.comprehensive}</p>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1.5 sm:mb-2 font-sans font-semibold">핵심 포인트</div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-200 rounded-lg text-[10px] sm:text-xs text-green-700 font-sans font-medium">✅ 역할 분담 명확</div>
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] sm:text-xs text-blue-700 font-sans font-medium">⚖️ 균형 잡힌 구조</div>
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] sm:text-xs text-yellow-700 font-sans font-medium">⚠️ 감정 표현 중요</div>
              </div>
            </div>
          </section>
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white/80 to-orange-50/30 h-full">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">팀워크 분석</h3>
        </div>
        <div className="flex-1 min-h-0 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[50vh] sm:max-h-[600px]">
          <TeamworkBlock index={1} title="커뮤니케이션 밀도" quote="말이 많아서 문제인가요, 적어서 문제인가요?" score={dataSource.teamwork.communication} detail={dataSource.teamwork.communicationDetail} />
          <TeamworkBlock index={2} title="갈등 발생 시 대응력" quote="문제가 생겼을 때 이 팀은 어떻게 반응하나요?" score={dataSource.teamwork.speed} detail={dataSource.teamwork.speedDetail} />
          <TeamworkBlock index={3} title="의사결정 구조" quote="누가 말하면 정리가 되나요?" score={dataSource.teamwork.stability} detail={dataSource.teamwork.stabilityDetail} />
        </div>
      </GlassCard>
    </div>

    <div className="mt-6 sm:mt-8">
      <div className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
        <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">개인별 포지션</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {membersWithRoles.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.1 }}
          >
            <div className="p-3 sm:p-4 h-full min-h-[240px] sm:min-h-[280px] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 flex-shrink-0">
                {member.avatar && member.avatar.trim() !== "" ? (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 relative">
                    <ImageWithFallback src={member.avatar} alt={member.name} className="w-full h-full object-cover" onError={() => {}} />
                    <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-base sm:text-lg opacity-0 pointer-events-none image-fallback">
                      {member.name[0] || "?"}
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-base sm:text-lg border border-slate-200 flex-shrink-0">
                    {member.name[0] || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <h4 className="font-bold text-slate-900 text-lg font-display break-words">{member.name}</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Award className="w-5 h-5 flex-shrink-0 text-orange-600" />
                    <Badge variant="outline" className={`text-xs font-medium px-2.5 py-0.5 rounded-md border ${MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length].badge}`}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
                {(member.keywords ?? []).map((keyword, kIdx) => (
                  <Badge key={kIdx} variant="secondary" className={`text-xs font-medium px-2 py-0.5 rounded-md border ${MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length].tag}`}>
                    {keyword}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-slate-600 font-sans leading-relaxed bg-slate-50/80 p-2.5 rounded-lg line-clamp-3 flex-1 min-h-0">{member.description}</p>
              <div className="space-y-1.5 text-sm pt-3 border-t border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2 bg-emerald-50 rounded-lg border border-emerald-100 py-1.5 px-2.5 min-w-0">
                  <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 font-sans flex-shrink-0">장점</span>
                  <span className="text-emerald-700/80 flex-shrink-0 mx-0.5 font-sans">·</span>
                  <span className="font-hand text-emerald-800 text-sm leading-snug break-words min-w-0">{member.strengths?.[0] ?? ""}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-50 rounded-lg border border-amber-100 py-1 sm:py-1.5 px-2 sm:px-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-amber-600 font-sans flex-shrink-0">주의</span>
                  <span className="text-amber-700/80 flex-shrink-0 mx-0.5 font-sans">·</span>
                  <span className="font-hand text-amber-900 text-sm leading-snug break-words min-w-0">{member.warnings?.[0] ?? ""}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    <GlassCard className="flex flex-col border-2 sm:border-4 border-white rounded-2xl sm:rounded-[32px] shadow-clay-md p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white/80 to-orange-50/30 h-full mt-6 sm:mt-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-200 to-orange-100 border-2 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
        <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-800 font-display">모임을 오래 가게 만드는 방법</h3>
      </div>
      <OverallMaintenanceSection maintenance={dataSource.maintenance} variant="desktop" />
    </GlassCard>
  </motion.div>
);

function TeamworkBlock({
  index,
  title,
  quote,
  score,
  detail,
}: {
  index: number;
  title: string;
  quote: string;
  score: number;
  detail: string;
}) {
  return (
    <section className="bg-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <h4 className="text-gray-800 font-bold text-base sm:text-lg font-display flex items-center gap-2">
          <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs sm:text-sm text-orange-600 font-bold shrink-0">
            {index}
          </span>
          {title}
        </h4>
        <div className="inline-flex items-baseline gap-1.5 rounded-xl sm:rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2 px-3 sm:py-2.5 sm:px-4 border border-orange-100/50 w-fit">
          <span className="text-xl sm:text-2xl font-extrabold text-orange-600 tabular-nums">{score}</span>
          <span className="text-xs sm:text-sm font-bold text-orange-500">점</span>
        </div>
      </div>
      <p className="text-gray-600 text-sm sm:text-base font-hand mb-2 sm:mb-3">"{quote}"</p>
      <p className="text-gray-700 text-sm sm:text-base leading-[1.8] font-sans min-w-0 break-words">{detail}</p>
    </section>
  );
}
