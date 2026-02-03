import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Heart, ShieldAlert } from "lucide-react";
import type { RelationMapMember } from "./RelationMapSidebar";
import { getRelationLevel, type RelationPairForDetail } from "./RelationDetailCard";
import { useIsMobile } from "@/shared/lib/hooks/use-mobile";

export interface RelationWithLevel extends RelationPairForDetail {
    otherMember: string;
    relationLevel: ReturnType<typeof getRelationLevel>;
}

interface RelationMapViewProps {
    members: RelationMapMember[];
    selectedMemberForRelation: string | null;
    relations: RelationWithLevel[];
    selectedPair: { member1: string; member2: string } | null;
    onSelectPair: (pair: RelationPairForDetail | null) => void;
}

// 모바일/데스크톱에 따른 상수 조정
const getMapConstants = (isMobile: boolean) => {
    if (isMobile) {
        return {
            LEFT_X: 50,
            RIGHT_X: 280,
            VIEW_WIDTH: 320,
            VIEW_HEIGHT: 300,
            CENTER_Y: 150,
            SPAN_Y: 200,
            NODE_R: 20,
            STROKE_W: 1.5,
            STROKE_W_HIGHLIGHT: 3,
        };
    }
    return {
        LEFT_X: 80,
        RIGHT_X: 560,
        VIEW_WIDTH: 640,
        VIEW_HEIGHT: 400,
        CENTER_Y: 200,
        SPAN_Y: 280,
        NODE_R: 28,
        STROKE_W: 2,
        STROKE_W_HIGHLIGHT: 4,
    };
};

const LEFT_NODE_COLOR = "#F97316"; // 선택된 멤버 고정 색(오렌지)

/** 빈 상태 전용 — 연한 브랜드 오렌지 브리딩 배경 (멤버 선택 시에는 사용하지 않음) */
function RelationMapEmptyContainer({ children, isMobile }: { children: ReactNode; isMobile: boolean }) {
    return (
        <motion.div
            className={`w-full ${isMobile ? 'h-[300px]' : 'h-[380px]'} rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`}
        >
            {children}
        </motion.div>
    );
}

/** 오른쪽 노드들 균등·가운데 배치용 (total명을 SPAN_Y 구간에 중앙 정렬) */
function getRightY(index: number, total: number, centerY: number, spanY: number) {
    if (total <= 1) return centerY;
    return centerY - spanY / 2 + (index * (spanY / Math.max(total - 1, 1)));
}

export function RelationMapView({
    members,
    selectedMemberForRelation,
    relations,
    selectedPair,
    onSelectPair,
}: RelationMapViewProps) {
    const isMobile = useIsMobile();
    const constants = getMapConstants(isMobile);
    const selectedIdx = members.findIndex((m) => m.name === selectedMemberForRelation);

    if (!selectedMemberForRelation || selectedIdx === -1) {
        return (
            <RelationMapEmptyContainer isMobile={isMobile}>
                <div className="w-full h-full flex items-center justify-center p-4">
                    <motion.p
                        className="text-sm font-medium font-display text-center leading-snug text-[var(--brand-orange)]"
                        animate={{ opacity: [1, 0.35, 1] }}
                        transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        좌측에서 멤버를 선택하면 일대일 관계를 확인할 수 있습니다.
                    </motion.p>
                </div>
            </RelationMapEmptyContainer>
        );
    }

    const selectedMember = members[selectedIdx];
    const leftY = constants.CENTER_Y; // 선택 멤버는 항상 왼쪽 가운데

    return (
        <div className={`w-full ${isMobile ? 'h-[300px]' : 'h-[380px]'} rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative`}>
            <div className="relative w-full h-full overflow-hidden">
                <svg
                className="w-full h-full"
                viewBox={`0 0 ${constants.VIEW_WIDTH} ${constants.VIEW_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* 노드 이너 섀도우(오목감)용 radial gradient */}
                    <radialGradient id="nodeInnerShadow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                        <stop offset="70%" stopColor="rgba(0,0,0,0)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
                    </radialGradient>
                    {relations.map((r) => (
                        <marker
                            key={`arrow-${r.member1}-${r.member2}`}
                            id={`arrow-${r.member1}-${r.member2}`}
                            markerWidth="8"
                            markerHeight="8"
                            refX="7"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L0,6 L8,3 z" fill={r.relationLevel.color} />
                        </marker>
                    ))}
                </defs>

                {/* 관계선 + 중앙 클릭 가능 아이콘 */}
                {relations.map((relation, relIdx) => {
                    const otherIdx = members.findIndex((m) => m.name === relation.otherMember);
                    if (otherIdx === -1) return null;

                    const rightY = getRightY(relIdx, relations.length, constants.CENTER_Y, constants.SPAN_Y);
                    const isWorst = relation.relationLevel.level === "worst";
                    const pathD = `M ${constants.LEFT_X + constants.NODE_R} ${leftY} L ${constants.RIGHT_X - constants.NODE_R} ${rightY}`;

                    const midX = (constants.LEFT_X + constants.RIGHT_X) / 2;
                    const midY = (leftY + rightY) / 2;
                    const isSelected =
                        selectedPair &&
                        ((selectedPair.member1 === relation.member1 && selectedPair.member2 === relation.member2) ||
                            (selectedPair.member1 === relation.member2 && selectedPair.member2 === relation.member1));
                    const lineStroke = relation.relationLevel.color;
                    const lineOpacity = isSelected ? 1 : 0.2;
                    const lineWidth = isSelected ? constants.STROKE_W_HIGHLIGHT : constants.STROKE_W;

                    return (
                        <g key={`relation-${relation.member1}-${relation.member2}`}>
                            {/* 배경 글로우 효과 (선택된 관계만) */}
                            {isSelected && (
                                <motion.path
                                    d={pathD}
                                    stroke={lineStroke}
                                    strokeWidth={lineWidth + 6}
                                    strokeDasharray={isWorst ? "6,3" : "none"}
                                    fill="none"
                                    opacity={0.2}
                                    filter="url(#glow-strong)"
                                    className="pointer-events-none"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: 1,
                                        opacity: 0.2,
                                    }}
                                    transition={{ duration: 0.3, delay: relIdx * 0.05, ease: "easeOut" }}
                                />
                            )}
                            {/* 관계선 메인 */}
                            <motion.path
                                d={pathD}
                                stroke={lineStroke}
                                strokeWidth={lineWidth}
                                strokeDasharray={isWorst ? "6,3" : "none"}
                                fill="none"
                                opacity={lineOpacity}
                                filter={isSelected ? "url(#glow)" : "none"}
                                strokeLinecap="round"
                                className="pointer-events-none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: lineOpacity,
                                    strokeWidth: lineWidth,
                                    stroke: lineStroke,
                                }}
                                transition={{ duration: 0.3, delay: relIdx * 0.05, ease: "easeOut" }}
                            />
                            {/* 화살표가 있는 관계선 */}
                            <motion.path
                                d={pathD}
                                stroke={lineStroke}
                                strokeWidth={lineWidth}
                                strokeDasharray={isWorst ? "6,3" : "none"}
                                fill="none"
                                opacity={lineOpacity}
                                markerEnd={`url(#arrow-${relation.member1}-${relation.member2})`}
                                filter={isSelected ? "url(#glow)" : "none"}
                                strokeLinecap="round"
                                className="pointer-events-none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: lineOpacity,
                                    strokeWidth: lineWidth,
                                    stroke: lineStroke,
                                }}
                                transition={{ duration: 0.3, delay: relIdx * 0.05, ease: "easeOut" }}
                            />
                            {/* 중앙 클릭 영역: 원 + 점수 */}
                            <g
                                className="cursor-pointer"
                                onClick={() =>
                                    onSelectPair(
                                        isSelected
                                            ? null
                                            : {
                                                  member1: relation.member1,
                                                  member2: relation.member2,
                                                  score: relation.score,
                                                  reason: relation.reason,
                                                  summary: relation.summary,
                                                  type: relation.type,
                                              }
                                    )
                                }
                            >
                                <circle
                                    cx={midX}
                                    cy={midY}
                                    r={isMobile ? 14 : 18}
                                    fill="white"
                                    stroke={lineStroke}
                                    strokeWidth={isSelected ? (isMobile ? 2.5 : 3) : (isMobile ? 1.5 : 2)}
                                    className="hover:opacity-90 transition-all duration-200"
                                />
                                <text
                                    x={midX}
                                    y={midY + (isMobile ? 3 : 4)}
                                    textAnchor="middle"
                                    fontSize={isMobile ? "9" : "11"}
                                    fontWeight="bold"
                                    fill={lineStroke}
                                    className="pointer-events-none"
                                >
                                    {relation.score}
                                </text>
                            </g>
                        </g>
                    );
                })}

                {/* 왼쪽: 선택된 멤버 노드 (해당 멤버 팔레트 색상) */}
                <g>
                    <title>{selectedMember.name}</title>
                    <defs>
                        <clipPath id={`clip-selected-rm-${selectedMember.id}`}>
                            <circle cx={constants.LEFT_X} cy={leftY} r={constants.NODE_R} />
                        </clipPath>
                    </defs>
                    {/* 외곽 글로우 효과 */}
                    <circle
                        cx={constants.LEFT_X}
                        cy={leftY}
                        r={constants.NODE_R + (isMobile ? 8 : 12)}
                        fill="url(#nodeGlow)"
                        opacity="0.6"
                    />
                    {/* 점선 테두리 */}
                    <motion.circle
                        cx={constants.LEFT_X}
                        cy={leftY}
                        r={constants.NODE_R + (isMobile ? 4 : 6)}
                        fill="none"
                        stroke={LEFT_NODE_COLOR}
                        strokeWidth={isMobile ? 1.5 : 2}
                        strokeDasharray="4,4"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                    {/* 노드 배경 */}
                    <circle
                        cx={constants.LEFT_X}
                        cy={leftY}
                        r={constants.NODE_R}
                        fill="white"
                        stroke={LEFT_NODE_COLOR}
                        strokeWidth={isMobile ? 2 : 2.5}
                        style={{ filter: "drop-shadow(0 2px 4px rgba(255,112,67,0.3))" }}
                    />
                    {selectedMember.avatar && selectedMember.avatar.trim() !== "" ? (
                        <image
                            href={selectedMember.avatar}
                            x={constants.LEFT_X - constants.NODE_R}
                            y={leftY - constants.NODE_R}
                            width={constants.NODE_R * 2}
                            height={constants.NODE_R * 2}
                            clipPath={`url(#clip-selected-rm-${selectedMember.id})`}
                        />
                    ) : (
                        <text
                            x={constants.LEFT_X}
                            y={leftY + (isMobile ? 3 : 4)}
                            textAnchor="middle"
                            fontSize={isMobile ? "12" : "14"}
                            fontWeight="bold"
                            fill={LEFT_NODE_COLOR}
                        >
                            {selectedMember.name[0] ?? "?"}
                        </text>
                    )}
                    {/* 이너 섀도우(오목감) - 가장자리만 은은하게 */}
                    <circle cx={constants.LEFT_X} cy={leftY} r={constants.NODE_R} fill="url(#nodeInnerShadow)" />
                    <foreignObject
                        x={constants.LEFT_X - (isMobile ? 40 : 50)}
                        y={leftY + constants.NODE_R + (isMobile ? 4 : 6)}
                        width={isMobile ? 80 : 100}
                        height={isMobile ? 18 : 22}
                        className="pointer-events-none overflow-visible"
                    >
                        <div className="flex w-full justify-center">
                            <span
                                className={`inline-flex w-max items-center px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-700 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold font-sans whitespace-nowrap`}
                            >
                                {selectedMember.name}
                            </span>
                        </div>
                    </foreignObject>
                </g>

                {/* 오른쪽: 다른 멤버 노드 (클릭 시 scale·굵은 테두리·상세 카드) */}
                {relations.map((relation, relIdx) => {
                    const otherIdx = members.findIndex((m) => m.name === relation.otherMember);
                    if (otherIdx === -1) return null;
                    const member = members[otherIdx];
                    const rightY = getRightY(relIdx, relations.length, constants.CENTER_Y, constants.SPAN_Y);
                    const tooltipText = `${member.name} ${relation.score}점 — 클릭하면 상세 분석`;
                    const isSelected =
                        selectedPair &&
                        ((selectedPair.member1 === relation.member1 && selectedPair.member2 === relation.member2) ||
                            (selectedPair.member1 === relation.member2 && selectedPair.member2 === relation.member1));
                    const nodeStroke = relation.relationLevel.color;
                    const nodeStrokeWidth = isSelected ? (isMobile ? 3 : 4) : (isMobile ? 1.5 : 2);

                    const pairForDetail = {
                        member1: relation.member1,
                        member2: relation.member2,
                        score: relation.score,
                        reason: relation.reason,
                        summary: relation.summary,
                        type: relation.type,
                    };

                    return (
                        <g
                            key={`right-${member.id}`}
                            transform={`translate(${constants.RIGHT_X}, ${rightY})`}
                            className="cursor-pointer"
                            onClick={() => onSelectPair(isSelected ? null : pairForDetail)}
                            style={{ cursor: "pointer" }}
                        >
                            <title>{tooltipText}</title>
                            <defs>
                                <clipPath id={`clip-right-rm-${member.id}`}>
                                    <circle cx={0} cy={0} r={constants.NODE_R} />
                                </clipPath>
                            </defs>
                            <motion.g
                                animate={{ scale: isSelected ? 1.15 : 1 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                                {/* 클릭 영역 확대 (휴대성) */}
                                <circle cx={0} cy={0} r={constants.NODE_R + (isMobile ? 6 : 8)} fill="transparent" className="pointer-events-auto" />
                                {/* 선택된 노드 글로우 효과 */}
                                {isSelected && (
                                    <circle
                                        cx={0}
                                        cy={0}
                                        r={constants.NODE_R + 4}
                                        fill={nodeStroke}
                                        opacity="0.15"
                                        style={{ filter: "blur(4px)" }}
                                    />
                                )}
                                {/* 노드 배경 */}
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={constants.NODE_R}
                                    fill="white"
                                    stroke={nodeStroke}
                                    strokeWidth={nodeStrokeWidth}
                                    style={{ 
                                        filter: isSelected 
                                            ? `drop-shadow(0 4px 8px ${nodeStroke}40)` 
                                            : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                                    }}
                                />
                                {member.avatar && member.avatar.trim() !== "" ? (
                                    <image
                                        href={member.avatar}
                                        x={-constants.NODE_R}
                                        y={-constants.NODE_R}
                                        width={constants.NODE_R * 2}
                                        height={constants.NODE_R * 2}
                                        clipPath={`url(#clip-right-rm-${member.id})`}
                                    />
                                ) : (
                                    <text
                                        x={0}
                                        y={isMobile ? 3 : 4}
                                        textAnchor="middle"
                                        fontSize={isMobile ? "12" : "14"}
                                        fontWeight="bold"
                                        fill={nodeStroke}
                                    >
                                        {member.name[0] ?? "?"}
                                    </text>
                                )}
                                <circle cx={0} cy={0} r={constants.NODE_R} fill="url(#nodeInnerShadow)" />
                            </motion.g>
                        </g>
                    );
                })}

                {/* 오른쪽 노드 이름 — 태그 스타일(폰트 영역만큼 너비), 프로필 원 왼쪽에 배치 */}
                {relations.map((relation, relIdx) => {
                    const member = members.find((m) => m.name === relation.otherMember);
                    if (!member) return null;
                    const rightY = getRightY(relIdx, relations.length, constants.CENTER_Y, constants.SPAN_Y);
                    const tagH = isMobile ? 18 : 22;
                    const tagWidth = isMobile ? 80 : 100;
                    return (
                        <foreignObject
                            key={`name-right-${member.id}`}
                            x={constants.RIGHT_X - constants.NODE_R - 4 - tagWidth}
                            y={rightY - tagH / 2}
                            width={tagWidth}
                            height={tagH}
                            className="pointer-events-none overflow-visible"
                        >
                            <span
                                className={`inline-flex w-max ml-auto items-center justify-end px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-700 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold font-sans whitespace-nowrap`}
                            >
                                {member.name}
                            </span>
                        </foreignObject>
                    );
                })}
                </svg>
            </div>
            
            {/* 범례 */}
            <div className={`absolute ${isMobile ? 'top-2 left-2' : 'top-3 left-3'} bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md ${isMobile ? 'p-1.5' : 'p-2'} z-20`}>
                <div className={`flex ${isMobile ? 'flex-col gap-1.5' : 'flex-row gap-3'} flex-wrap`}>
                    {/* 최고 */}
                    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <Heart className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#EC4899] fill-[#EC4899] shrink-0`} strokeWidth={2.5} />
                        <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-slate-700 font-sans whitespace-nowrap`}>최고</span>
                    </div>
                    {/* 좋음 */}
                    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-[#10B981] shrink-0`} style={{ boxShadow: '0 0 4px rgba(16,185,129,0.5)' }} />
                        <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-slate-700 font-sans whitespace-nowrap`}>좋음</span>
                    </div>
                    {/* 보통 */}
                    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-[#94A3B8] shrink-0`} />
                        <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-slate-700 font-sans whitespace-nowrap`}>보통</span>
                    </div>
                    {/* 주의 */}
                    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-[#F59E0B] shrink-0`} style={{ boxShadow: '0 0 4px rgba(245,158,11,0.5)' }} />
                        <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-slate-700 font-sans whitespace-nowrap`}>주의</span>
                    </div>
                    {/* 최악 */}
                    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        <ShieldAlert className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#EF4444] fill-[#EF4444] shrink-0`} strokeWidth={2.5} />
                        <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-slate-700 font-sans whitespace-nowrap`}>최악</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
