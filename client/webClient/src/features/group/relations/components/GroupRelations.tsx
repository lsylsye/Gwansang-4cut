import React from "react";
import { motion } from "motion/react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Crown, Smile, Zap, HeartCrack, Ghost, User, Coins, Skull } from "lucide-react";
import { GroupMember } from "@/shared/types";

// --- Mock/Constants (Moved from GroupAnalysisSection) ---
const ROLES = [
    { role: "모임의 리더", desc: "추진력이 강하고 결단력이 있습니다.", icon: Crown, color: "text-yellow-500", bg: "bg-yellow-50" },
    { role: "분위기 메이커", desc: "재치있는 입담으로 모임을 즐겁게 합니다.", icon: Smile, color: "text-orange-500", bg: "bg-orange-50" },
    { role: "냉철한 참모", desc: "현실적인 조언으로 모임의 중심을 잡습니다.", icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
    { role: "배려의 아이콘", desc: "세심하게 멤버들을 챙기는 따뜻한 마음.", icon: HeartCrack, color: "text-pink-500", bg: "bg-pink-50" },
    { role: "자유로운 영혼", desc: "어디로 튈지 모르는 4차원 매력의 소유자.", icon: Ghost, color: "text-purple-500", bg: "bg-purple-50" },
];

interface GroupRelationsProps {
    groupMembers: GroupMember[];
}

export const GroupRelations: React.FC<GroupRelationsProps> = ({ groupMembers }) => {
    // Assign random roles for demo purposes (consistent based on index)
    const getMemberRole = (index: number) => ROLES[index % ROLES.length];

    return (
        <div className="space-y-8">
            {/* 1. Role Analysis (Full Width List) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <GlassCard className="w-full p-8 border-2 border-gray-100 shadow-clay-md">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b-2 border-dashed border-gray-100 pb-4 mb-2">
                            <h3 className="text-xl font-bold text-gray-800 font-sans flex items-center gap-2">
                                <span className="text-2xl">👥</span> 멤버별 관상 역할
                            </h3>
                            <div className="px-3 py-1 bg-orange-100 text-[#FF7043] rounded-lg text-xs font-bold font-sans">
                                TOTAL: {groupMembers.length} MEMBERS
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupMembers.map((member, i) => {
                                const role = getMemberRole(i);
                                const RoleIcon = role.icon;
                                return (
                                    <div key={member.id} className="bg-white/40 p-4 rounded-2xl border border-white/50 flex items-center gap-4 shadow-clay-xs hover:shadow-clay-sm transition-all group overflow-hidden relative">
                                        <div className="shrink-0 flex flex-col items-center gap-1.5 relative z-10">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-clay-sm border-2 border-white bg-gray-100 group-hover:scale-105 transition-transform">
                                                <img src={member.avatar || "https://via.placeholder.com/100"} alt="Face" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full border border-gray-100 font-sans">
                                                NO.{i + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-bold text-gray-900 text-lg font-display">{member.name || `멤버 ${i + 1}`}</span>
                                                <div className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm font-sans ${role.bg} ${role.color}`}>
                                                    {role.role}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 leading-relaxed font-sans">{role.desc}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl ${role.bg} flex items-center justify-center shrink-0 shadow-clay-xs group-hover:rotate-12 transition-transform`}>
                                            <RoleIcon className={`w-6 h-6 ${role.color}`} />
                                        </div>
                                        {/* Subtle background decoration */}
                                        <div className={`absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                            <RoleIcon className={`w-20 h-20 ${role.color}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* 2. Special Chemistry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Survivors */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <GlassCard className="h-full p-5 hover:bg-white/60 transition-colors border-l-4 border-l-green-500 shadow-pixel group">
                        <h4 className="font-bold text-gray-800 mb-2 font-sans flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" /> 결국 남는 2인
                        </h4>
                        <p className="text-xs text-gray-500 mb-3 font-hand italic opacity-80">마지막까지 서로를 지켜줄 의리의 콤비</p>
                        <div className="bg-green-50/50 rounded-xl p-3 text-center border border-green-100 shadow-clay-xs group-hover:scale-[1.02] transition-transform">
                            <span className="font-bold text-green-700 text-base font-display">
                                {groupMembers.length >= 2 ? `${groupMembers[0].name}, ${groupMembers[1].name}` : "멤버 부족"}
                            </span>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Money Duo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <GlassCard className="h-full p-5 hover:bg-white/60 transition-colors border-l-4 border-l-yellow-500 shadow-pixel group">
                        <h4 className="font-bold text-gray-800 mb-2 font-sans flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-600" /> 돈 되는 조합
                        </h4>
                        <p className="text-xs text-gray-500 mb-3 font-hand italic opacity-80">함께 사업하면 대박 날 최고의 파트너</p>
                        <div className="bg-yellow-50/50 rounded-xl p-3 text-center border border-yellow-100 shadow-clay-xs group-hover:scale-[1.02] transition-transform">
                            <span className="font-bold text-yellow-700 text-base font-display">
                                {groupMembers.length >= 2 ? `${groupMembers[0].name}, ${groupMembers[groupMembers.length - 1].name}` : "멤버 부족"}
                            </span>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Bad Relationship */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <GlassCard className="h-full p-5 hover:bg-white/60 transition-colors border-l-4 border-l-gray-500 shadow-pixel group">
                        <h4 className="font-bold text-gray-800 mb-2 font-sans flex items-center gap-2">
                            <Skull className="w-4 h-4 text-gray-600" /> 멀어질 인연
                        </h4>
                        <p className="text-xs text-gray-500 mb-3 font-hand italic opacity-80">사소한 오해로 서먹해질 수 있으니 주의</p>
                        <div className="bg-gray-100/50 rounded-xl p-3 text-center flex flex-col gap-1 border border-gray-200 shadow-clay-xs group-hover:scale-[1.02] transition-transform">
                            <span className="font-bold text-gray-700 text-base font-display">
                                {groupMembers.length >= 2 ? `${groupMembers[1].name}` : "해당 없음"}
                            </span>
                            <span className="text-xs text-gray-400 font-bold font-sans">CAUTION: 10월</span>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Romantic Disaster */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <GlassCard className="h-full p-5 hover:bg-white/60 transition-colors border-l-4 border-l-red-500 shadow-pixel group">
                        <h4 className="font-bold text-gray-800 mb-2 font-sans flex items-center gap-2">
                            <HeartCrack className="w-4 h-4 text-red-600" /> 연애 파국 조합
                        </h4>
                        <p className="text-xs text-gray-500 mb-3 font-hand italic opacity-80">절대 엮이면 안 되는 위험한 관계</p>
                        <div className="bg-red-50/50 rounded-xl p-3 text-center border border-red-100 shadow-clay-xs group-hover:scale-[1.02] transition-transform">
                            <span className="font-bold text-red-700 text-base font-display">
                                {groupMembers.length >= 2 ? `${groupMembers[0].name}, ${groupMembers[groupMembers.length > 2 ? 2 : 1].name}` : "해당 없음"}
                            </span>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};
