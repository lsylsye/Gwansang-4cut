import React from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { Badge } from "@/components/ui/core/badge";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { MEMBER_CARD_PALETTE } from "./GroupResultTypes";
import { OverallDiagramSection } from "./OverallDiagramSection";
import { OverallMaintenanceSection } from "./OverallMaintenanceSection";
import type { GroupResultDataSource } from "./GroupResultTypes";
import type { MemberWithRole } from "./GroupResultTypes";

export interface OverallTabMobileProps {
  dataSource: GroupResultDataSource;
  membersWithRoles: MemberWithRole[];
  onRankingClick: () => void;
  hasRegisteredRanking: boolean;
}

export const OverallTabMobile: React.FC<OverallTabMobileProps> = ({
  dataSource,
  membersWithRoles,
  onRankingClick,
  hasRegisteredRanking,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
    className="space-y-0 w-full max-w-full"
    style={{ paddingTop: "var(--flow-block)", paddingBottom: "var(--flow-block)" }}
  >
    <section className="section-flow">
      <h2 className="text-base font-bold text-gray-800 font-display flow-mb-title w-full">우리 팀 궁합</h2>
      <div className="flex flex-col flow-gap-y w-full max-w-full">
        <div className="inline-flex items-baseline gap-1.5 shrink-0 rounded-2xl bg-orange-50 shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.9)] py-2.5 px-4 border border-orange-300 w-fit">
          <span className="text-2xl font-extrabold text-orange-600 tabular-nums leading-none">
            {typeof dataSource.compatibility?.score === "number" ? dataSource.compatibility.score : "-"}
          </span>
          <span className="text-sm font-bold text-orange-600 leading-none">점</span>
        </div>
        <p className="text-xs text-gray-500 font-hand font-medium w-full">우리 팀을 한마디로 정리하자면?</p>
        <p className="text-base text-gray-800 font-display font-bold leading-snug w-full break-keep">"{dataSource.personality.title}"</p>
        <ActionButton
          variant="orange-primary"
          onClick={onRankingClick}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold w-fit"
        >
          <Trophy size={14} />
          {hasRegisteredRanking ? "랭킹 보기" : "이 점수 랭킹 등록하기"}
        </ActionButton>
      </div>
    </section>
    <section className="section-flow">
      <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">거북도사의 총평</h2>
      <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title mt-4 w-full">1. 모임의 조화 및 균형 해석</h3>
      <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.personality.harmony}</p>
      <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title mt-4 w-full">2. 종합 궁합 해석</h3>
      <div className="flow-mb-block p-3 bg-gray-50 rounded-xl border border-gray-200 w-full max-w-full">
        <OverallDiagramSection membersWithRoles={membersWithRoles} showKeywords={false} idPrefix="mobile" maxWidthClass="max-w-[min(260px,100%)]" />
      </div>
      <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.personality.comprehensive}</p>
      <p className="text-xs font-semibold text-gray-600 flow-mb-title w-full">핵심 포인트</p>
      <div className="flex flex-wrap flow-gap-y w-full max-w-full">
        <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] text-green-700 font-medium">✅ 역할 분담 명확</span>
        <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700 font-medium">⚖️ 균형 잡힌 구조</span>
        <span className="px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-700 font-medium">⚠️ 감정 표현 중요</span>
      </div>
    </section>
    <section className="section-flow">
      <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">팀워크 분석</h2>
      <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title w-full">1. 커뮤니케이션 밀도</h3>
      <p className="text-xs text-gray-500 font-hand flow-mb-title w-full">"말이 많아서 문제인가요, 적어서 문제인가요?"</p>
      <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.teamwork.communicationDetail}</p>
      <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title w-full">2. 갈등 발생 시 대응력</h3>
      <p className="text-xs text-gray-500 font-hand flow-mb-title w-full">"문제가 생겼을 때 이 팀은 어떻게 반응하나요?"</p>
      <p className="text-sm text-gray-700 leading-[1.8] font-sans flow-mb-block w-full break-keep">{dataSource.teamwork.speedDetail}</p>
      <h3 className="text-sm font-bold text-gray-700 font-display flow-mb-title w-full">3. 의사결정 구조</h3>
      <p className="text-xs text-gray-500 font-hand flow-mb-title w-full">"누가 말하면 정리가 되나요?"</p>
      <p className="text-sm text-gray-700 leading-[1.8] font-sans w-full break-keep">{dataSource.teamwork.stabilityDetail}</p>
    </section>
    <section className="section-flow">
      <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">개인별 포지션</h2>
      <ul className="flow-col w-full max-w-full">
        {membersWithRoles.map((member, idx) => {
          const palette = MEMBER_CARD_PALETTE[idx % MEMBER_CARD_PALETTE.length];
          return (
            <li key={member.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                {member.avatar && member.avatar.trim() !== "" ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <ImageWithFallback src={member.avatar} alt={member.name} className="w-full h-full object-cover" onError={() => {}} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm border border-slate-200 shrink-0">{member.name[0] || "?"}</div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 text-sm font-display">{member.name}</span>
                  <Badge variant="outline" className={`ml-1.5 text-[10px] font-medium px-2 py-0.5 rounded border ${palette.badge}`}>{member.role ?? ""}</Badge>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-sans leading-relaxed mb-2">{member.description ?? ""}</p>
              <p className="text-[10px] text-emerald-700 font-sans"><span className="font-semibold">장점</span> {member.strengths?.[0] ?? ""}</p>
              <p className="text-[10px] text-amber-700 font-sans"><span className="font-semibold">주의</span> {member.warnings?.[0] ?? ""}</p>
            </li>
          );
        })}
      </ul>
    </section>
    <section className="section-flow">
      <h2 className="text-base font-bold text-gray-800 font-display flow-mb-block w-full">모임을 오래 가게 만드는 방법</h2>
      <OverallMaintenanceSection maintenance={dataSource.maintenance} variant="mobile" />
    </section>
  </motion.div>
);
