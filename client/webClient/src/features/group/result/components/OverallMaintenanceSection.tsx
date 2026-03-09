import React from "react";
import { MessageSquare, ShieldCheck, Calendar, Sparkles } from "lucide-react";
import type { GroupResultMaintenance } from "./GroupResultTypes";

const MAINTENANCE_ICONS = [MessageSquare, ShieldCheck, Calendar, Sparkles];

export interface OverallMaintenanceSectionProps {
  maintenance: GroupResultMaintenance | undefined;
  variant: "mobile" | "desktop";
}

export const OverallMaintenanceSection: React.FC<OverallMaintenanceSectionProps> = ({ maintenance, variant }) => {
  const cards = maintenance?.maintenanceCards ?? [];
  const list = Array.isArray(cards) && cards.length > 0 ? cards : [];
  const pc = maintenance?.problemChild;
  const kp = maintenance?.keyPerson;
  const rp = maintenance?.richestPerson;
  const isMobile = variant === "mobile";

  return (
    <>
      {isMobile ? (
        <ul className="flow-col w-full max-w-full">
          {list.map((card: { label: string; title: string; description: string }, i: number) => {
            const Icon = MAINTENANCE_ICONS[i % MAINTENANCE_ICONS.length];
            return (
              <li key={`${card.label}-${i}`} className="flex gap-3 w-full max-w-full">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-orange-600 font-sans">{card.label}</p>
                  <p className="text-sm font-bold text-gray-800 font-display break-keep">{card.title}</p>
                  <p className="text-xs text-gray-600 font-sans leading-snug break-keep">{card.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0">
          {list.map((card: { label: string; title: string; description: string }, i: number) => {
            const Icon = MAINTENANCE_ICONS[i % MAINTENANCE_ICONS.length];
            return (
              <section
                key={`${card.label}-${i}`}
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] bg-white/50 rounded-xl sm:rounded-2xl border border-gray-200"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-orange-600 font-sans mb-0.5">{card.label}</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 font-display mb-0.5 sm:mb-1">{card.title}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 font-sans leading-snug">{card.description}</p>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className={isMobile ? "mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" : "mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4"}>
        {pc?.name && Array.isArray(pc.guidelines) && pc.guidelines.length > 0 && (
          <section className={isMobile ? "p-3 bg-amber-50/80 rounded-xl border border-amber-200" : "p-3 sm:p-4 bg-amber-50/80 rounded-xl sm:rounded-2xl border border-amber-200"}>
            <p className={isMobile ? "text-xs font-bold text-amber-800 font-display mb-2" : "text-sm font-bold text-amber-800 font-display mb-2"}>
              이 모임의 문제아 · {pc.name}
            </p>
            {pc.whySentence?.trim() && (
              <p className="text-xs sm:text-sm text-amber-900 font-sans mb-2 leading-relaxed">
                <span className="font-semibold">선정 이유</span> {pc.whySentence}
              </p>
            )}
            {Array.isArray(pc.survivalStrategy) && pc.survivalStrategy.length > 0 && (
              <>
                <p className="text-xs font-semibold text-amber-700 font-sans mb-1">그 사람의 생존 전략</p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 font-sans mb-2">
                  {pc.survivalStrategy.slice(0, 4).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="text-xs font-semibold text-amber-700 font-sans mb-1">그래서 이렇게 고치면 모임이 오래 가요</p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 font-sans">
              {pc.guidelines.slice(0, 4).map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </section>
        )}
        {kp?.name && (
          <section className={isMobile ? "p-3 bg-violet-50/80 rounded-xl border border-violet-200" : "p-3 sm:p-4 bg-violet-50/80 rounded-xl sm:rounded-2xl border border-violet-200"}>
            <p className={isMobile ? "text-xs font-bold text-violet-800 font-display mb-2" : "text-sm font-bold text-violet-800 font-display mb-2"}>
              ⭐ 모임의 핵심 인물 · {kp.name}
            </p>
            {kp.whySentence?.trim() && (
              <p className="text-xs sm:text-sm text-violet-900 font-sans mb-2 leading-relaxed">
                <span className="font-semibold">선정 이유</span> {kp.whySentence}
              </p>
            )}
            {Array.isArray(kp.tips) && kp.tips.length > 0 && (
              <>
                <p className="text-xs font-semibold text-violet-700 font-sans mb-1">이 사람을 잡아두려면</p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 font-sans">
                  {kp.tips.slice(0, 4).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
        {rp?.name && (
          <section className={isMobile ? "p-3 bg-emerald-50/80 rounded-xl border border-emerald-200" : "p-3 sm:p-4 bg-emerald-50/80 rounded-xl sm:rounded-2xl border border-emerald-200"}>
            <p className={isMobile ? "text-xs font-bold text-emerald-800 font-display mb-2" : "text-sm font-bold text-emerald-800 font-display mb-2"}>
              💰 가장 성공할 것 같은 사람 · {rp.name}
            </p>
            {rp.whySentence?.trim() && (
              <p className="text-xs sm:text-sm text-emerald-900 font-sans mb-2 leading-relaxed">
                <span className="font-semibold">선정 이유</span> {rp.whySentence}
              </p>
            )}
            {Array.isArray(rp.detailedReasons) && rp.detailedReasons.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 font-sans">
                {rp.detailedReasons.slice(0, 4).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  );
};
