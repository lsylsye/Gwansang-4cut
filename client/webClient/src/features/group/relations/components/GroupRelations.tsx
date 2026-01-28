import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/core/card";
import { Badge } from "@/shared/ui/core/badge";
import { Crown, Smile, Zap, HeartCrack, Ghost, User, Coins, Skull, Users } from "lucide-react";
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
        <div className="space-y-6">
            {/* Role Analysis - Tailwind UI Large Images Style */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            >
                {/* Header Section - 통일된 배경과 정렬 */}
                <div className="bg-white rounded-2xl p-6 md:p-8 mb-12 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-vibrant flex items-center justify-center shadow-md shrink-0">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-display">
                                멤버별 관상 역할
                            </h2>
                        </div>
                        <Badge 
                            variant="secondary" 
                            className="bg-brand-orange/10 text-brand-orange border-brand-orange/20 font-semibold text-sm px-4 py-1.5 shrink-0"
                        >
                            총 {groupMembers.length}명
                        </Badge>
                    </div>
                    <p className="text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 font-sans">
                        각 멤버의 관상에서 드러나는 고유한 역할과 특성을 분석했습니다.
                    </p>
                </div>

                {/* Members Grid - Tailwind UI Style */}
                <ul
                    role="list"
                    className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {groupMembers.map((member, i) => {
                        const role = getMemberRole(i);
                        const RoleIcon = role.icon;
                        return (
                            <motion.li
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                                className="group"
                            >
                                {/* Large Image */}
                                <div className="relative overflow-hidden rounded-2xl aspect-[3/2] w-full mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <img
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        src={member.avatar || "https://via.placeholder.com/400x300"}
                                        alt={member.name || `멤버 ${i + 1}`}
                                    />
                                    {/* Role Icon Overlay */}
                                    <div className={`absolute top-4 right-4 w-12 h-12 rounded-xl ${role.bg} flex items-center justify-center shadow-lg backdrop-blur-sm bg-opacity-90`}>
                                        <RoleIcon className={`w-6 h-6 ${role.color}`} />
                                    </div>
                                </div>

                                {/* Member Info Card - 이름부터 설명까지 전체 배경 */}
                                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                                    <CardContent className="p-6">
                                        {/* Name */}
                                        <h3 className="text-xl font-bold leading-8 tracking-tight text-gray-900 font-display mb-3">
                                            {member.name || `멤버 ${i + 1}`}
                                        </h3>

                                        {/* Role Badge */}
                                        <div className="mb-4">
                                            <Badge
                                                variant="secondary"
                                                className={`${role.bg} ${role.color} border-0 text-sm font-semibold px-3 py-1.5`}
                                            >
                                                {role.role}
                                            </Badge>
                                        </div>

                                        {/* Description */}
                                        <p className="text-base leading-7 text-gray-700 font-sans">
                                            {role.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.li>
                        );
                    })}
                </ul>
            </motion.div>

            {/* Special Chemistry Grid - Material Design Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Survivors Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-l-green-500">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                                <CardTitle className="text-sm font-bold text-gray-900 font-display">
                                    결국 남는 2인
                                </CardTitle>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 font-sans leading-relaxed">
                                마지막까지 서로를 지켜줄 의리의 콤비
                            </p>
                            <div className="bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg p-3 border border-green-100 shadow-sm">
                                <span className="font-bold text-green-700 text-sm font-display block text-center">
                                    {groupMembers.length >= 2 ? `${groupMembers[0].name}, ${groupMembers[1].name}` : "멤버 부족"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Money Duo Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-l-yellow-500">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <Coins className="w-4 h-4 text-yellow-600" />
                                </div>
                                <CardTitle className="text-sm font-bold text-gray-900 font-display">
                                    돈 되는 조합
                                </CardTitle>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 font-sans leading-relaxed">
                                함께 사업하면 대박 날 최고의 파트너
                            </p>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-50/50 rounded-lg p-3 border border-yellow-100 shadow-sm">
                                <span className="font-bold text-yellow-700 text-sm font-display block text-center">
                                    {groupMembers.length >= 2 ? `${groupMembers[0].name}, ${groupMembers[groupMembers.length - 1].name}` : "멤버 부족"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Bad Relationship Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-l-gray-500">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Skull className="w-4 h-4 text-gray-600" />
                                </div>
                                <CardTitle className="text-sm font-bold text-gray-900 font-display">
                                    멀어질 인연
                                </CardTitle>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 font-sans leading-relaxed">
                                사소한 오해로 서먹해질 수 있으니 주의
                            </p>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg p-3 border border-gray-200 shadow-sm space-y-1">
                                <span className="font-bold text-gray-700 text-sm font-display block text-center">
                                    {groupMembers.length >= 2 ? `${groupMembers[1].name}` : "해당 없음"}
                                </span>
                                <Badge variant="outline" className="w-full justify-center text-[10px] py-0.5 border-gray-300 text-gray-500">
                                    주의: 10월
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Romantic Disaster Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
                >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-l-4 border-l-red-500">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                    <HeartCrack className="w-4 h-4 text-red-600" />
                                </div>
                                <CardTitle className="text-sm font-bold text-gray-900 font-display">
                                    연애 파국 조합
                                </CardTitle>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 font-sans leading-relaxed">
                                절대 엮이면 안 되는 위험한 관계
                            </p>
                            <div className="bg-gradient-to-br from-red-50 to-red-50/50 rounded-lg p-3 border border-red-100 shadow-sm">
                                <span className="font-bold text-red-700 text-sm font-display block text-center">
                                    {groupMembers.length >= 2 ? `${groupMembers[0].name}, ${groupMembers[groupMembers.length > 2 ? 2 : 1].name}` : "해당 없음"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};
