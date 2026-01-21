import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ResultCharts } from "@/features/personal/stats/components/ResultCharts";

interface FaceAnalysisProps {
  image: string;
  scores: any[];
  features: any;
  totalAnalysis: string;
}

export const FaceAnalysis: React.FC<FaceAnalysisProps> = ({ image, scores, features, totalAnalysis }) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  const faceParts = [
    { id: "forehead", label: "이마 (초년운)", cx: 100, cy: 55, d: "M50,60 Q100,25 150,60 Q150,75 100,75 Q50,75 50,60 Z" },
    { id: "eyes", label: "눈 (감수성)", cx: 100, cy: 92, d: "M45,90 Q70,80 95,90 L105,90 Q130,80 155,90 Q150,105 100,105 Q50,105 45,90 Z" },
    { id: "nose", label: "코 (재물운)", cx: 100, cy: 120, d: "M90,105 L110,105 L115,135 L85,135 Z" },
    { id: "mouth", label: "입 (말년운)", cx: 100, cy: 155, d: "M75,150 Q100,145 125,150 Q125,165 100,170 Q75,165 75,150 Z" },
    { id: "chin", label: "턱 (인덕)", cx: 100, cy: 185, d: "M70,180 Q100,210 130,180 Q100,200 70,180 Z" },
    { id: "ears", label: "귀 (장수)", cx: 180, cy: 100, d: "M40,80 Q25,95 40,110 M160,80 Q175,95 160,110 Z" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      <div className="w-full lg:w-5/12 space-y-8">
        <div className="relative">
          <GlassCard className="w-full aspect-square flex items-center justify-center p-0 overflow-hidden relative shadow-clay-lg bg-white/40 border-[10px] border-white rounded-[48px] group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-black/5" />

            {!activeFeature && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none"
              >
                <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-display text-sm text-[#00897B] shadow-clay-xs border-2 border-white flex items-center gap-2 animate-bounce-subtle">
                  <Sparkles size={16} />
                  궁금한 부위를 눌러보세요
                </div>
              </motion.div>
            )}

            <div className="absolute inset-0">
              <img
                src={image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                alt="Face Analysis"
                className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-[#00897B]/5 backdrop-blur-[2px]" />
            </div>

            <svg viewBox="0 0 200 220" className="h-[85%] w-[85%] relative z-10 drop-shadow-2xl">
              <path
                d="M40,60 Q100,-20 160,60 V140 Q160,220 100,220 Q40,220 40,140 Z"
                className="fill-white/40 stroke-white stroke-[4] stroke-dasharray-[8,4]"
              />

              {faceParts.map((part) => {
                const isActive = activeFeature === part.id;

                return (
                  <motion.g
                    key={part.id}
                    onClick={() => setActiveFeature(isActive ? null : part.id)}
                    className="cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                  >
                    <path
                      d={part.d}
                      className={`transition-all duration-500 ${
                        isActive
                          ? "fill-[#00897B]/60 stroke-[#00897B] stroke-2 shadow-[0_0_20px_rgba(0,137,123,0.5)]"
                          : "fill-white/20 stroke-white/40 hover:fill-[#00897B]/20 hover:stroke-[#00897B]/50"
                      }`}
                    />

                    <motion.circle
                      cx={part.cx}
                      cy={part.cy}
                      r={isActive ? 6 : 4}
                      initial={{ opacity: 1 }}
                      animate={isActive ? { r: [6, 8, 6], opacity: [1, 0.6, 1] } : { r: 4, opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`${isActive ? "fill-white" : "fill-[#00897B]"} stroke-white stroke-1 shadow-sm`}
                    />

                    <text
                      x={part.cx}
                      y={part.cy - 12}
                      textAnchor="middle"
                      className={`text-[9px] font-bold transition-all duration-300 pointer-events-none select-none ${
                        isActive ? "fill-gray-900 opacity-100 drop-shadow-sm" : "fill-gray-500 opacity-0 group-hover:opacity-60"
                      }`}
                    >
                      {part.label.split(" ")[0]}
                    </text>
                  </motion.g>
                );
              })}
            </svg>

            <AnimatePresence>
              {activeFeature && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[15]"
                    onClick={() => setActiveFeature(null)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    key={activeFeature}
                    className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl shadow-clay-md border-4 border-white rounded-[32px] p-6 text-center z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-block px-3 py-1 bg-[#E0F2F1] text-[#00897B] rounded-full text-[10px] font-black mb-2 uppercase tracking-wider">
                      {faceParts.find((p) => p.id === activeFeature)?.label}
                    </div>

                    <h4 className="font-bold text-gray-900 mb-2 text-xl font-display">
                      {features?.[activeFeature]?.title ?? ""}
                    </h4>

                    <p className="text-sm text-gray-600 font-hand leading-relaxed">
                      {features?.[activeFeature]?.desc ?? ""}
                    </p>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>

        <GlassCard className="w-full p-8 shadow-clay-sm border-4 border-white rounded-[32px]">
          <h4 className="font-bold text-gray-800 mb-4 font-display">운세 그래프</h4>
          <ResultCharts data={scores} />
        </GlassCard>
      </div>

      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        <GlassCard className="flex-1 p-10 border-4 border-white rounded-[40px] shadow-clay-md bg-white/40">
          <div
            className="flex justify-between items-center mb-8 cursor-pointer select-none"
            onClick={() => setIsDetailOpen(!isDetailOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#00897B] rounded-2xl flex items-center justify-center text-2xl shadow-clay-xs">
                🐢
              </div>
              <h3 className="font-bold text-3xl text-gray-800 font-display">거북 도사의 총평</h3>
            </div>
            {isDetailOpen ? (
              <ChevronUp size={28} className="text-gray-400" />
            ) : (
              <ChevronDown size={28} className="text-gray-400" />
            )}
          </div>

          <AnimatePresence>
            {isDetailOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="text-gray-800 leading-relaxed whitespace-pre-line font-hand text-xl bg-white/80 p-8 rounded-[32px] border-2 border-white shadow-inner">
                  {totalAnalysis}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-[#E0F2F1] p-4 rounded-2xl shadow-clay-xs border border-white">
                    <p className="text-xs text-[#00897B] font-bold mb-1">행운의 색상</p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#00897B] shadow-inner" />
                      <span className="text-sm font-bold text-gray-700">에메랄드 그린</span>
                    </div>
                  </div>

                  <div className="bg-[#FFF3E0] p-4 rounded-2xl shadow-clay-xs border border-white">
                    <p className="text-xs text-[#E65100] font-bold mb-1">행운의 숫자</p>
                    <span className="text-xl font-bold text-gray-700">4, 8</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
};
