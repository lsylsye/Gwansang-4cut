import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import {
    Heart,
    Zap,
    AlertTriangle,
    Swords,
    type LucideIcon,
} from "lucide-react";

export interface Member {
    userId: string;
    name: string;
    profileImage?: string;
}

export interface Relationship {
    member1: string;
    member2: string;
    relationshipType: "보완" | "상생" | "상충" | "상극";
    elementInvolved: string;
    direction: string;
    description: string;
    advice: string;
}

const RELATION_CONFIG: Record<
    "보완" | "상생" | "상충" | "상극",
    { color: string; bg: string; label: string; Icon: LucideIcon }
> = {
    보완: { color: "#22c55e", bg: "bg-emerald-50", label: "채워줌", Icon: Heart },
    상생: { color: "#3b82f6", bg: "bg-blue-50", label: "시너지", Icon: Zap },
    상충: { color: "#f97316", bg: "bg-amber-50", label: "주의", Icon: AlertTriangle },
    상극: { color: "#ef4444", bg: "bg-red-50", label: "충돌", Icon: Swords },
};

const SLOT_HEIGHT = 72;
const LEFT_NODE_X = 0;
const RIGHT_NODE_X = 140;
const SVG_WIDTH = 160;
const SVG_PADDING = 24;

interface Props {
    members: Member[];
    relationships: Relationship[];
}

function findRelationship(
    rels: Relationship[],
    userId1: string,
    userId2: string
): Relationship | undefined {
    return rels.find(
        (r) =>
            (r.member1 === userId1 && r.member2 === userId2) ||
            (r.member1 === userId2 && r.member2 === userId1)
    );
}

export const DestinyStickRelations: React.FC<Props> = ({
    members,
    relationships,
}) => {
    const n = members.length;
    const [selectedUserId, setSelectedUserId] = useState<string | null>(
        members[0]?.userId ?? null
    );
    const [detailRel, setDetailRel] = useState<Relationship | null>(null);

    const selectedIndex = useMemo(
        () => members.findIndex((m) => m.userId === selectedUserId),
        [members, selectedUserId]
    );
    const selectedMember = selectedIndex >= 0 ? members[selectedIndex] : null;
    const others = useMemo(
        () => members.filter((m) => m.userId !== selectedUserId),
        [members, selectedUserId]
    );

    // selectedUserId가 유효하지 않으면 첫 번째 멤버로 설정
    useEffect(() => {
        if (members.length > 0 && (!selectedUserId || !selectedMember)) {
            setSelectedUserId(members[0].userId);
        }
    }, [members, selectedUserId, selectedMember]);

    const svgHeight = Math.max(n * SLOT_HEIGHT, others.length * SLOT_HEIGHT) + SVG_PADDING * 2;

    const lines = useMemo(() => {
        if (!selectedMember) return [];
        const yLeft = SVG_PADDING + selectedIndex * SLOT_HEIGHT + SLOT_HEIGHT / 2;
        return others.map((other, j) => {
            const yRight = SVG_PADDING + j * SLOT_HEIGHT + SLOT_HEIGHT / 2;
            const rel = findRelationship(
                relationships,
                selectedMember.userId,
                other.userId
            );
            const type = rel?.relationshipType ?? "상생";
            const config = RELATION_CONFIG[type];
            const midY = (yLeft + yRight) / 2;
            return {
                key: `${selectedMember.userId}-${other.userId}`,
                d: `M ${LEFT_NODE_X} ${yLeft} C ${RIGHT_NODE_X / 2} ${yLeft}, ${RIGHT_NODE_X / 2} ${yRight}, ${RIGHT_NODE_X} ${yRight}`,
                type,
                config,
                rel,
                other,
                yRight,
                midY,
            };
        });
    }, [selectedMember, selectedIndex, others, relationships]);

    if (n < 2) return null;

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
            >
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <Zap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 font-display">
                            운명의 작대기
                        </h2>
                        <p className="text-sm text-gray-500">
                            한 명을 선택하면 나머지 멤버와의 관계선이 연결돼요.
                        </p>
                    </div>
                </div>

                <div className="flex min-h-[280px] items-stretch gap-0 overflow-x-auto">
                    {/* 왼쪽: 멤버 리스트 */}
                    <div className="flex w-[100px] shrink-0 flex-col sm:w-[112px]">
                        {members.map((m, i) => {
                            const isSelected = m.userId === selectedUserId;
                            return (
                                <button
                                    key={m.userId}
                                    type="button"
                                    onClick={() => setSelectedUserId(m.userId)}
                                    className={`flex flex-col items-center gap-1 border-r-2 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-inset ${
                                        isSelected
                                            ? "border-violet-400 bg-violet-50/80"
                                            : "border-gray-100 bg-gray-50/50 hover:bg-gray-100"
                                    }`}
                                    style={{ minHeight: SLOT_HEIGHT }}
                                >
                                    <div
                                        className={`h-10 w-10 overflow-hidden rounded-full border-2 shadow-sm sm:h-11 sm:w-11 ${
                                            isSelected
                                                ? "border-violet-400 ring-2 ring-violet-200"
                                                : "border-white ring-1 ring-gray-200"
                                        }`}
                                    >
                                        <img
                                            src={
                                                m.profileImage ||
                                                "https://via.placeholder.com/44"
                                            }
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <span
                                        className={`max-w-[80px] truncate text-xs font-medium sm:max-w-[96px] ${
                                            isSelected
                                                ? "text-violet-800"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {m.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 가운데: SVG 관계선 */}
                    <div
                        className="relative shrink-0"
                        style={{ width: SVG_WIDTH, minHeight: svgHeight }}
                    >
                        <svg
                            width={SVG_WIDTH}
                            height={svgHeight}
                            className="overflow-visible"
                        >
                            <defs>
                                {(["보완", "상생", "상충", "상극"] as const).map((t) => (
                                    <marker
                                        key={t}
                                        id={`arrowhead-${t}`}
                                        markerWidth="8"
                                        markerHeight="6"
                                        refX="7"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <path
                                            d="M0,0 L8,3 L0,6 z"
                                            fill={RELATION_CONFIG[t].color}
                                        />
                                    </marker>
                                ))}
                            </defs>
                            {lines.map(({ key, d, config, rel, midY, type: relType }) => (
                                <g key={key}>
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke={config.color}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        markerEnd={`url(#arrowhead-${relType})`}
                                        className="cursor-pointer transition-opacity hover:opacity-90"
                                        onClick={() => rel && setDetailRel(rel)}
                                    />
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke="transparent"
                                        strokeWidth="16"
                                        className="cursor-pointer"
                                        onClick={() => rel && setDetailRel(rel)}
                                    />
                                    <text
                                        x={RIGHT_NODE_X / 2}
                                        y={midY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-[9px] font-semibold"
                                        fill={config.color}
                                        style={{ pointerEvents: "none" }}
                                    >
                                        {config.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* 오른쪽: 나머지 멤버들 */}
                    <div className="flex w-[100px] shrink-0 flex-col sm:w-[112px]">
                        {others.map((other, j) => {
                            const rel = findRelationship(
                                relationships,
                                selectedUserId ?? "",
                                other.userId
                            );
                            const type = rel?.relationshipType ?? "상생";
                            const config = RELATION_CONFIG[type];
                            return (
                                <button
                                    key={other.userId}
                                    type="button"
                                    onClick={() => rel && setDetailRel(rel)}
                                    className="flex flex-col items-center gap-1 border-l-2 border-gray-100 bg-gray-50/50 py-3 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-inset"
                                    style={{ minHeight: SLOT_HEIGHT }}
                                >
                                    <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 sm:h-11 sm:w-11">
                                        <img
                                            src={
                                                other.profileImage ||
                                                "https://via.placeholder.com/44"
                                            }
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <span className="max-w-[80px] truncate text-xs font-medium text-gray-700 sm:max-w-[96px]">
                                        {other.name}
                                    </span>
                                    <span
                                        className="text-[10px] font-medium"
                                        style={{ color: config.color }}
                                    >
                                        {config.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
                    {(["보완", "상생", "상충", "상극"] as const).map((t) => {
                        const { color, label } = RELATION_CONFIG[t];
                        return (
                            <span
                                key={t}
                                className="flex items-center gap-1 rounded-full px-2 py-1 font-medium"
                                style={{ color, backgroundColor: `${color}18` }}
                            >
                                {label}
                            </span>
                        );
                    })}
                </div>
            </motion.section>

            <Modal
                isOpen={detailRel !== null}
                onClose={() => setDetailRel(null)}
                size="md"
            >
                {detailRel && (
                    <>
                        <ModalHeader description={detailRel.elementInvolved}>
                            <span
                                className="flex items-center gap-2 font-semibold"
                                style={{
                                    color: RELATION_CONFIG[detailRel.relationshipType].color,
                                }}
                            >
                                {(() => {
                                    const Icon =
                                        RELATION_CONFIG[detailRel.relationshipType].Icon;
                                    return <Icon className="h-5 w-5" />;
                                })()}
                                {detailRel.relationshipType}
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <p className="text-sm leading-relaxed text-gray-700">
                                    {detailRel.description}
                                </p>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="text-xs font-medium text-gray-500">
                                        조언
                                    </p>
                                    <p className="mt-1 text-sm text-gray-800">
                                        {detailRel.advice}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {detailRel.direction}
                                </p>
                            </div>
                        </ModalBody>
                    </>
                )}
            </Modal>
        </>
    );
};
