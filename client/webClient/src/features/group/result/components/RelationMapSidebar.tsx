import { motion } from "motion/react";
import { Badge } from "@/components/ui/core/badge";
import { useIsMobile } from "@/hooks/use-mobile";

export interface RelationMapMember {
    id: number;
    name: string;
    role: string;
    avatar?: string;
}

/** 개인별 포지션 MEMBER_CARD_PALETTE.badge와 동일 (역할 태그 색상·스타일 통일) */
const ROLE_BADGE_PALETTE = [
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-orange-50 text-orange-800 border-orange-200",
    "bg-sky-50 text-sky-800 border-sky-200",
    "bg-indigo-50 text-indigo-800 border-indigo-200",
    "bg-violet-50 text-violet-800 border-violet-200",
    "bg-pink-50 text-pink-800 border-pink-200",
    "bg-rose-50 text-rose-800 border-rose-200",
];

/** 멤버별 고유 강조색 (Hex) — 선택 시 프로필 테두리·연결선·상세 카드에 사용 */
export const MEMBER_PALETTE_HEX = [
    "#059669", "#EA580C", "#0284C7", "#4F46E5", "#7C3AED", "#DB2777", "#E11D48",
] as const; // emerald, orange, sky, indigo, violet, pink, rose

interface RelationMapSidebarProps {
    members: RelationMapMember[];
    selectedName: string | null;
    onSelect: (name: string | null) => void;
}

export function RelationMapSidebar({ members, selectedName, onSelect }: RelationMapSidebarProps) {
    const isMobile = useIsMobile();
    return (
        <aside className={`${isMobile ? 'w-full' : 'w-56'} shrink-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${isMobile ? 'max-h-[200px]' : 'max-h-[380px]'}`}>
            <div className="px-3 py-2 border-b border-slate-100 flex-shrink-0">
                <h4 className="text-xs font-semibold text-slate-600 font-sans">멤버 선택</h4>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
                {members.map((member, idx) => {
                    const isSelected = selectedName === member.name;
                    return (
                        <motion.button
                            key={member.id ?? idx}
                            type="button"
                            onClick={() => onSelect(isSelected ? null : member.name)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                                isSelected
                                    ? "bg-orange-50 border-orange-200 shadow-sm"
                                    : "border-slate-200 bg-white hover:bg-emerald-50/80 hover:border-emerald-200 hover:shadow-md"
                            }`}
                            whileHover={!isSelected ? { scale: 1.02, y: -2 } : undefined}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-2">
                                {member.avatar && member.avatar.trim() !== "" ? (
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 flex-shrink-0">
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                                        {member.name[0] ?? "?"}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 font-display text-sm truncate">
                                        {member.name}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-md border truncate max-w-full ${ROLE_BADGE_PALETTE[idx % ROLE_BADGE_PALETTE.length]}`}
                                    >
                                        {member.role}
                                    </Badge>
                                </div>
                                {isSelected && (
                                    <span className="text-brand-orange text-sm font-bold shrink-0">✓</span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </aside>
    );
}
