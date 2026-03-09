import React from "react";
import ReactMarkdown from "react-markdown";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { FiveElementsDisplay } from "./FiveElementsDisplay";
import type { ConstitutionSajuData } from "../data/constitutionData";

const HEALTH_FOODS_SECTION_TITLE = "건강 관리를 위해 꼭 챙기면 좋은 것들";

/** 사주 기반 체질 풀이 블록 — data는 백에서 받아서 교체 가능 */
export function ConstitutionSajuBlock({ data }: { data: ConstitutionSajuData }) {
    const { head, oheng, sections, daeunAndFoods } = data;
    const filteredSections = sections.filter((item) => item.sub !== HEALTH_FOODS_SECTION_TITLE);

    return (
        <div className="pt-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display text-center">당신의 체질 풀이</h3>

            <GlassCard className="w-full max-w-4xl mx-auto p-6 sm:p-8 border-4 border-white rounded-[32px] shadow-clay-md bg-white/50 mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-brand-green/10 border-2 border-brand-green rounded-xl flex items-center justify-center">🐢</div>
                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800 font-display">사주 기반 체질 풀이</h3>
                </div>

                <div className="mb-5">
                    <FiveElementsDisplay counts={oheng} title="오행 분포" headLabel={head} />
                </div>

                <div className="space-y-4 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                    {filteredSections.map((item, i) => (
                        <div key={i}>
                            {item.sub != null && (
                                <h4 className="text-gray-800 font-bold text-base mb-1.5 font-display">{item.sub}</h4>
                            )}
                            <div className="text-gray-700 text-base leading-[1.75] [&_strong]:font-bold [&_strong]:text-gray-800 [&_p:has(strong.total-review-subheading)]:mb-0 [&_p:not(:has(strong.total-review-subheading))]:mb-3 [&_p:last-child]:mb-0">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p>{children}</p>,
                                        strong: ({ children }) => (
                                            <strong className="font-bold text-gray-800 total-review-subheading">
                                                {children}
                                            </strong>
                                        ),
                                    }}
                                >
                                    {String(item.text ?? "").trim()}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>

                {daeunAndFoods.priorityFoods.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <h4 className="text-gray-800 font-bold text-base mb-2 font-display">{daeunAndFoods.title}</h4>
                        <ul className="space-y-1">
                            {daeunAndFoods.priorityFoods.map((food, i) => (
                                <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                                    <span className="text-brand-green mt-0.5">•</span>
                                    {food}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
