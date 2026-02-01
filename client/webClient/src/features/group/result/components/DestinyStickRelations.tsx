import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import {
    Heart,
    Zap,
    AlertTriangle,
    Swords,
    Sparkles,
    RotateCcw,
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
    {
        color: string;
        bg: string;
        label: string;
        /** 선 위 상시 표시 문구 */
        shortSummary: string;
        /** 관계 공개 시 팝업 문구 */
        revealLabel: string;
        /** 범례 설명 */
        description: string;
        Icon: LucideIcon;
        strokeWidth: number;
        strokeDasharray: string;
        pathStyle: "solid" | "dashed" | "wavy" | "zigzag";
        score: number;
    }
> = {
    보완: {
        color: "#22c55e",
        bg: "bg-emerald-50",
        label: "채워줌",
        shortSummary: "서로 보완",
        revealLabel: "찰떡궁합!",
        description: "기운을 채워 주는 관계",
        Icon: Heart,
        strokeWidth: 4,
        strokeDasharray: "none",
        pathStyle: "solid",
        score: 95,
    },
    상생: {
        color: "#a855f7",
        bg: "bg-violet-50",
        label: "시너지",
        shortSummary: "시너지",
        revealLabel: "시너지 폭발!",
        description: "함께하면 시너지가 나요",
        Icon: Zap,
        strokeWidth: 3,
        strokeDasharray: "10 6",
        pathStyle: "dashed",
        score: 85,
    },
    상충: {
        color: "#f97316",
        bg: "bg-amber-50",
        label: "주의",
        shortSummary: "의견 충돌 주의",
        revealLabel: "조심해서 다뤄요",
        description: "같은 기운이라 부딪힐 수 있어요",
        Icon: AlertTriangle,
        strokeWidth: 2.5,
        strokeDasharray: "4 4",
        pathStyle: "wavy",
        score: 45,
    },
    상극: {
        color: "#ef4444",
        bg: "bg-red-50",
        label: "충돌",
        shortSummary: "충돌",
        revealLabel: "으악! 충돌 위험",
        description: "견해가 다를 수 있어요",
        Icon: Swords,
        strokeWidth: 2,
        strokeDasharray: "6 4",
        pathStyle: "zigzag",
        score: 25,
    },
};

/** 관계선 키 정규화 (정렬해서 유일 키) */
function edgeKey(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join("-");
}

const CX = 200;
const CY = 200;
const RADIUS = 130;
const CENTER_NODE_R = 30;
const CIRCLE_NODE_R = 26;
const ICON_R = 14;
const VIEWBOX = 400;

function ProfileHoverCard({
    hoveredNodeId,
    selectedUserId,
    members,
    circlePositions,
}: {
    hoveredNodeId: string | null;
    selectedUserId: string | null;
    members: Member[];
    circlePositions: { x: number; y: number }[];
}) {
    if (!hoveredNodeId || hoveredNodeId === selectedUserId) return null;
    const m = members.find((mb) => mb.userId === hoveredNodeId);
    if (!m) return null;
    const idx = members.findIndex((mb) => mb.userId === m.userId);
    const pos = circlePositions[idx];
    if (!pos) return null;
    const pctX = (pos.x / 400) * 100;
    const pctY = (pos.y / 400) * 100;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-20 w-40 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
                style={{
                    left: `${pctX}%`,
                    top: `${pctY}%`,
                    transform: `translate(-50%, -120%)`,
                }}
            >
                <div className="flex items-center gap-2">
                    <img
                        src={m.profileImage || "https://via.placeholder.com/40"}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-200"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">클릭하면 중앙에서 관계를 볼 수 있어요</p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

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

/** 두 점을 잇는 곡선/직선 path d 생성 */
function buildPathD(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    style: "solid" | "dashed" | "wavy" | "zigzag"
): string {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len * 12;
    const perpY = dx / len * 12;

    if (style === "solid" || style === "dashed") {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    if (style === "wavy") {
        const c1x = (x1 + midX) / 2 + perpX;
        const c1y = (y1 + midY) / 2 + perpY;
        const c2x = (midX + x2) / 2 - perpX;
        const c2y = (midY + y2) / 2 - perpY;
        return `M ${x1} ${y1} Q ${c1x} ${c1y} ${midX} ${midY} Q ${c2x} ${c2y} ${x2} ${y2}`;
    }
    // zigzag
    const t1x = x1 + dx * 0.33 + perpX;
    const t1y = y1 + dy * 0.33 + perpY;
    const t2x = x1 + dx * 0.66 - perpX;
    const t2y = y1 + dy * 0.66 - perpY;
    return `M ${x1} ${y1} L ${t1x} ${t1y} L ${t2x} ${t2y} L ${x2} ${y2}`;
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
    const [hoveredLineKey, setHoveredLineKey] = useState<string | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [highlightedLegendType, setHighlightedLegendType] = useState<
        "보완" | "상생" | "상충" | "상극" | null
    >(null);
    const [visibleTypes, setVisibleTypes] = useState<Set<"보완" | "상생" | "상충" | "상극">>(
        () => new Set(["보완", "상생", "상충", "상극"])
    );
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }> | null>(null);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState<{ nodePos: { x: number; y: number }; client: { x: number; y: number } } | null>(null);
    /** 드래그로 연결 중인 소스 노드 (이때는 노드 위치 드래그 비활성) */
    const [connectDragSourceId, setConnectDragSourceId] = useState<string | null>(null);
    /** 연결 드래그 중 커서 위치 (SVG 좌표) */
    const [connectPointerPos, setConnectPointerPos] = useState<{ x: number; y: number } | null>(null);
    /** 드롭 가능한 타겟 노드 (호버 중인 다른 멤버) */
    const [dropTargetNodeId, setDropTargetNodeId] = useState<string | null>(null);
    /** 발견한 관계 키 집합 — 여기에 있으면 선 표시 */
    const [discoveredRelationKeys, setDiscoveredRelationKeys] = useState<Set<string>>(() => new Set());
    /** "모든 관계 보기" 토글 시 전체 선 표시 */
    const [showAllRelations, setShowAllRelations] = useState(false);
    /** 공개 대기 중 (0.5초 딜레이 후 실제 추가) */
    const [pendingReveal, setPendingReveal] = useState<{
        key: string;
        type: "보완" | "상생" | "상충" | "상극";
        score: number;
        label: string;
        midX: number;
        midY: number;
    } | null>(null);
    /** 점수 팝업: 선 위 미니 뱃지 + 하단 결과 바 (얼굴 안 가림) */
    const [scorePopup, setScorePopup] = useState<{
        points: number;
        label: string;
        midX: number;
        midY: number;
        type: "보완" | "상생" | "상충" | "상극";
        name1: string;
        name2: string;
    } | null>(null);
    /** 전체 발견 완료 축하 */
    const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
    const graphRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [isListView, setIsListView] = useState(false);

    const selectedMember = useMemo(
        () => members.find((m) => m.userId === selectedUserId) ?? null,
        [members, selectedUserId]
    );
    const others = useMemo(
        () => members.filter((m) => m.userId !== selectedUserId),
        [members, selectedUserId]
    );

    useEffect(() => {
        if (members.length > 0 && (!selectedUserId || !selectedMember)) {
            setSelectedUserId(members[0].userId);
        }
    }, [members, selectedUserId, selectedMember]);

    const resize = useCallback(() => {
        setIsListView(typeof window !== "undefined" && window.innerWidth < 640);
    }, []);
    useEffect(() => {
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [resize]);

    const baseCirclePositions = useMemo(() => {
        return members.map((_, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            return {
                x: CX + RADIUS * Math.cos(angle),
                y: CY + RADIUS * Math.sin(angle),
            };
        });
    }, [n]);

    const circlePositions = useMemo(() => {
        if (!nodePositions) return baseCirclePositions;
        return members.map((m, i) => {
            const custom = nodePositions[m.userId];
            return custom ?? baseCirclePositions[i];
        });
    }, [members, baseCirclePositions, nodePositions]);

    /** 멤버별 SVG 좌표 (중앙 선택자는 CX,CY) */
    const getMemberPos = useCallback(
        (userId: string) => {
            if (userId === selectedUserId) return { x: CX, y: CY };
            const idx = members.findIndex((m) => m.userId === userId);
            return circlePositions[idx] ?? { x: CX, y: CY };
        },
        [selectedUserId, members, circlePositions]
    );

    const resetLayout = useCallback(() => {
        setNodePositions(null);
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }, []);

    const clientToSVG = useCallback((clientX: number, clientY: number) => {
        const svg = svgRef.current;
        if (!svg) return { x: CX, y: CY };
        const rect = svg.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / rect.width * VIEWBOX,
            y: (clientY - rect.top) / rect.height * VIEWBOX,
        };
    }, []);

    /** SVG 좌표 (x,y) 위에 있는 멤버 userId 반환 */
    const hitTestNode = useCallback(
        (x: number, y: number): string | null => {
            for (const m of members) {
                const pos = getMemberPos(m.userId);
                const r = m.userId === selectedUserId ? CENTER_NODE_R + 8 : CIRCLE_NODE_R + 3;
                if (Math.hypot(x - pos.x, y - pos.y) <= r) return m.userId;
            }
            return null;
        },
        [members, selectedUserId, getMemberPos]
    );

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            const svgPos = clientToSVG(e.clientX, e.clientY);
            if (connectDragSourceId) {
                setConnectPointerPos(svgPos);
                setDropTargetNodeId((prev) => {
                    const hit = hitTestNode(svgPos.x, svgPos.y);
                    return hit && hit !== connectDragSourceId ? hit : null;
                });
            } else if (draggingNodeId && dragStart) {
                setNodePositions((prev) => ({
                    ...prev ?? {},
                    [draggingNodeId]: {
                        x: dragStart.nodePos.x + (svgPos.x - dragStart.client.x),
                        y: dragStart.nodePos.y + (svgPos.y - dragStart.client.y),
                    },
                }));
            } else if (isPanning) {
                setTranslate((t) => ({
                    x: t.x + (e.clientX - panStart.x),
                    y: t.y + (e.clientY - panStart.y),
                }));
                setPanStart({ x: e.clientX, y: e.clientY });
            }
        };
        const handlePointerUp = () => {
            if (connectDragSourceId) {
                const target = dropTargetNodeId;
                if (target && target !== connectDragSourceId) {
                    const rel = findRelationship(relationships, connectDragSourceId, target);
                    if (rel) {
                        const key = edgeKey(connectDragSourceId, target);
                        const config = RELATION_CONFIG[rel.relationshipType];
                        const p1 = getMemberPos(connectDragSourceId);
                        const p2 = getMemberPos(target);
                        setPendingReveal({
                            key,
                            type: rel.relationshipType,
                            score: config.score,
                            label: config.revealLabel,
                            midX: (p1.x + p2.x) / 2,
                            midY: (p1.y + p2.y) / 2,
                        });
                    }
                }
                setConnectDragSourceId(null);
                setConnectPointerPos(null);
                setDropTargetNodeId(null);
            }
            setDraggingNodeId(null);
            setDragStart(null);
            setIsPanning(false);
        };
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [
        connectDragSourceId,
        dropTargetNodeId,
        hitTestNode,
        clientToSVG,
        relationships,
        getMemberPos,
        draggingNodeId,
        dragStart,
        isPanning,
        panStart,
    ]);

    useEffect(() => {
        const el = graphRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale((s) => Math.min(2, Math.max(0.5, s + delta)));
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    /** 0.5초 딜레이 후 관계 공개 + 점수 팝업 (멤버 이름 포함) */
    useEffect(() => {
        if (!pendingReveal) return;
        const { key, midX, midY, score, label } = pendingReveal;
        const [id1, id2] = key.split("-");
        const m1 = members.find((m) => m.userId === id1);
        const m2 = members.find((m) => m.userId === id2);
        const name1 = m1?.name ?? "멤버1";
        const name2 = m2?.name ?? "멤버2";
        const t1 = setTimeout(() => {
            setDiscoveredRelationKeys((prev) => new Set([...prev, key]));
            setScorePopup({
                points: score,
                label,
                midX,
                midY,
                type: pendingReveal.type,
                name1,
                name2,
            });
            setPendingReveal(null);
        }, 500);
        const t2 = setTimeout(() => {
            setScorePopup((p) => (p ? null : p));
        }, 2000);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [pendingReveal, members]);

    const totalRelations = relationships.length;
    const discoveredCount = discoveredRelationKeys.size;

    /** 전체 발견 시 축하 */
    useEffect(() => {
        if (totalRelations > 0 && discoveredCount === totalRelations) {
            setShowCompletionCelebration(true);
            const t = setTimeout(() => setShowCompletionCelebration(false), 3000);
            return () => clearTimeout(t);
        }
    }, [discoveredCount, totalRelations]);

    const lines = useMemo(() => {
        if (!selectedMember) return [];
        const centerX = CX;
        const centerY = CY;
        return others.map((other, j) => {
            const idx = members.findIndex((m) => m.userId === other.userId);
            const pos = circlePositions[idx];
            if (!pos) return null;
            const rel = findRelationship(
                relationships,
                selectedMember.userId,
                other.userId
            );
            const type = rel?.relationshipType ?? "상생";
            const config = RELATION_CONFIG[type];
            const midX = (centerX + pos.x) / 2;
            const midY = (centerY + pos.y) / 2;
            const d = buildPathD(
                centerX,
                centerY,
                pos.x,
                pos.y,
                config.pathStyle
            );
            const key = edgeKey(selectedMember.userId, other.userId);
            return {
                key,
                d,
                type,
                config,
                rel,
                other,
                midX,
                midY,
            };
        }).filter((x): x is NonNullable<typeof x> => x != null);
    }, [selectedMember, others, members, circlePositions, relationships]);

    /** 발견했거나 "모두 보기"일 때만 선 표시 + 타입 필터 */
    const visibleLines = useMemo(
        () =>
            lines.filter(
                (l) =>
                    visibleTypes.has(l.type) &&
                    (showAllRelations || discoveredRelationKeys.has(l.key))
            ),
        [lines, visibleTypes, showAllRelations, discoveredRelationKeys]
    );

    const teamScore = useMemo(() => {
        if (relationships.length === 0) return 0;
        const sum = relationships.reduce(
            (acc, r) => acc + RELATION_CONFIG[r.relationshipType].score,
            0
        );
        return Math.round(sum / relationships.length);
    }, [relationships]);

    const relationCountsByType = useMemo(() => {
        const counts = { 보완: 0, 상생: 0, 상충: 0, 상극: 0 };
        relationships.forEach((r) => {
            counts[r.relationshipType]++;
        });
        return counts;
    }, [relationships]);

    /** 발견한 관계만 타입별 개수 */
    const discoveredCountsByType = useMemo(() => {
        const counts = { 보완: 0, 상생: 0, 상충: 0, 상극: 0 };
        discoveredRelationKeys.forEach((key) => {
            const [id1, id2] = key.split("-");
            const rel = findRelationship(relationships, id1, id2);
            if (rel) counts[rel.relationshipType]++;
        });
        return counts;
    }, [discoveredRelationKeys, relationships]);

    const bestCombos = useMemo(() => {
        const good = relationships.filter(
            (r) => r.relationshipType === "보완" || r.relationshipType === "상생"
        );
        return good.slice(0, 2).map((r) => {
            const m1 = members.find((m) => m.userId === r.member1);
            const m2 = members.find((m) => m.userId === r.member2);
            return {
                rel: r,
                m1,
                m2,
                names: [m1?.name ?? "", m2?.name ?? ""].filter(Boolean).join(" & "),
                type: r.relationshipType,
                config: RELATION_CONFIG[r.relationshipType],
            };
        });
    }, [relationships, members]);

    const worstCombos = useMemo(() => {
        const bad = relationships.filter(
            (r) => r.relationshipType === "상극" || r.relationshipType === "상충"
        );
        return bad.slice(0, 2).map((r) => {
            const m1 = members.find((m) => m.userId === r.member1);
            const m2 = members.find((m) => m.userId === r.member2);
            return {
                rel: r,
                m1,
                m2,
                names: [m1?.name ?? "", m2?.name ?? ""].filter(Boolean).join(" & "),
                type: r.relationshipType,
                config: RELATION_CONFIG[r.relationshipType],
            };
        });
    }, [relationships, members]);

    const hoveredRel = useMemo(() => {
        if (!hoveredLineKey) return null;
        const line = lines.find((l) => l.key === hoveredLineKey);
        return line?.rel ?? null;
    }, [hoveredLineKey, lines]);

    if (n < 2) return null;

    if (isListView) {
        return (
            <ListView
                members={members}
                relationships={relationships}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                setDetailRel={setDetailRel}
                teamScore={teamScore}
                bestCombos={bestCombos}
                RELATION_CONFIG={RELATION_CONFIG}
                findRelationship={findRelationship}
            />
        );
    }

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md sm:p-6"
            >
                {/* 헤더: 타이틀 + 팀 궁합 게이지 + 베스트/워스트 */}
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-orange-100">
                            <Sparkles className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 font-display">
                                운명의 작대기
                            </h2>
                            <p className="text-sm text-gray-500">
                                드래그해서 다른 멤버에게 연결! 관계를 발견하면 선이 공개돼요.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* 발견 진행률 + 모두 보기 / 초기화 */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-sm font-bold text-violet-800">
                                    {discoveredCount}/{totalRelations} 발견
                                </span>
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${totalRelations ? (discoveredCount / totalRelations) * 100 : 0}%`,
                                        }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAllRelations((v) => !v)}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                        showAllRelations
                                            ? "border-violet-400 bg-violet-100 text-violet-800"
                                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    모두 보기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDiscoveredRelationKeys(new Set());
                                        setShowAllRelations(false);
                                        setScorePopup(null);
                                        setShowCompletionCelebration(false);
                                    }}
                                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    <RotateCcw size={12} />
                                    초기화
                                </button>
                            </div>
                        </div>
                        {/* 팀 궁합 원형 프로그레스 */}
                        <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="none"
                                        stroke="#f3f4f6"
                                        strokeWidth="3"
                                    />
                                    <motion.circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="none"
                                        stroke="url(#teamScoreGrad)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(teamScore / 100) * 88} 88`}
                                        initial={{ strokeDasharray: "0 88" }}
                                        animate={{ strokeDasharray: `${(teamScore / 100) * 88} 88` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                    <defs>
                                        <linearGradient id="teamScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#a855f7" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
                                    {teamScore}
                                </span>
                            </div>
                            <span className="text-xs font-medium text-gray-500">팀 궁합</span>
                        </div>
                        {/* 베스트 궁합 */}
                        {bestCombos.length > 0 && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 min-w-[140px]">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">베스트 궁합</p>
                                <p className="mt-0.5 truncate text-sm font-bold text-emerald-900">{bestCombos[0].names}</p>
                                <p className="text-xs text-emerald-700">{bestCombos[0].config.shortSummary}</p>
                            </div>
                        )}
                        {/* 워스트 궁합 */}
                        {worstCombos.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 min-w-[140px]">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">주의/워스트</p>
                                <p className="mt-0.5 truncate text-sm font-bold text-amber-900">{worstCombos[0].names}</p>
                                <p className="text-xs text-amber-700">{worstCombos[0].config.shortSummary}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 메인: 네트워크 그래프 + 우측 관계 요약 */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_200px]">
                    {/* 그래프 영역: 배경 + 컨테이너 */}
                    <div
                        ref={graphRef}
                        className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 via-violet-50/30 to-orange-50/20 select-none touch-none"
                        style={{
                            backgroundImage: "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)",
                            backgroundSize: "20px 20px",
                            touchAction: "none",
                        }}
                    >
                        <div className="absolute right-3 top-3 z-10 flex gap-2">
                            <button
                                type="button"
                                onClick={resetLayout}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <RotateCcw size={14} />
                                정렬 초기화
                            </button>
                            <span className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
                                휠: 줌 · 배경 드래그: 이동 · 노드 드래그: 위치 조정
                            </span>
                        </div>
                        <div
                            className="relative mx-auto aspect-square w-full max-w-[420px] p-2 cursor-grab active:cursor-grabbing select-none touch-none"
                            style={{
                                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                                transformOrigin: "50% 50%",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                            }}
                            onPointerDown={(e) => {
                                const target = e.target as Element;
                                if (!target.closest?.("[data-draggable-node]")) {
                                    setIsPanning(true);
                                    setPanStart({ x: e.clientX, y: e.clientY });
                                }
                            }}
                        >
                            <svg
                                ref={svgRef}
                                viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
                                className="h-full w-full overflow-visible"
                            >
                                <defs>
                                    {(["보완", "상생", "상충", "상극"] as const).map((t) => (
                                        <marker
                                            key={t}
                                            id={`arrow-${t}`}
                                            markerWidth="10"
                                            markerHeight="8"
                                            refX="8"
                                            refY="4"
                                            orient="auto"
                                        >
                                            <path d="M0,0 L10,4 L0,8 z" fill={RELATION_CONFIG[t].color} />
                                        </marker>
                                    ))}
                                    <filter id="glow-center">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feFlood floodColor="#a855f7" floodOpacity="0.4" />
                                        <feComposite in2="blur" operator="in" />
                                        <feMerge>
                                            <feMergeNode />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="glow-good">
                                        <feGaussianBlur stdDeviation="1" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* 드래그 연결 중 고무줄 선 */}
                                {connectDragSourceId && (connectPointerPos || dropTargetNodeId) && (() => {
                                    const from = getMemberPos(connectDragSourceId);
                                    const to = dropTargetNodeId
                                        ? getMemberPos(dropTargetNodeId)
                                        : connectPointerPos!;
                                    const rubberD = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
                                    return (
                                        <g style={{ pointerEvents: "none" }}>
                                            <motion.path
                                                d={rubberD}
                                                fill="none"
                                                stroke="#a855f7"
                                                strokeWidth={3}
                                                strokeDasharray="8 6"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                            <path
                                                d={rubberD}
                                                fill="none"
                                                stroke="rgba(168,85,247,0.3)"
                                                strokeWidth={20}
                                                strokeLinecap="round"
                                            />
                                        </g>
                                    );
                                })()}

                                {/* 관계선: 발견된 것만 표시 (또는 모두 보기) */}
                                {visibleLines.map(({ key, d, config, rel, midX, midY, type }) => {
                                    const isHovered = hoveredLineKey === key;
                                    const isGood = type === "보완" || type === "상생";
                                    const legendDim =
                                        highlightedLegendType !== null && highlightedLegendType !== type;
                                    const opacity = legendDim ? 0.3 : isHovered ? 1 : 0.5;
                                    const strokeW = isHovered ? config.strokeWidth + 1.5 : config.strokeWidth;
                                    return (
                                        <g
                                            key={key}
                                            onMouseEnter={() => setHoveredLineKey(key)}
                                            onMouseLeave={() => setHoveredLineKey(null)}
                                            onClick={() => rel && setDetailRel(rel)}
                                            style={{ cursor: rel ? "pointer" : "default" }}
                                        >
                                            <motion.path
                                                d={d}
                                                fill="none"
                                                stroke={config.color}
                                                strokeWidth={strokeW}
                                                strokeDasharray="8 18"
                                                strokeLinecap="round"
                                                initial={{ strokeDashoffset: 26 }}
                                                animate={{ strokeDashoffset: 0 }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                                opacity={0.35}
                                            />
                                            <path
                                                d={d}
                                                fill="none"
                                                stroke={config.color}
                                                strokeWidth={strokeW}
                                                strokeDasharray={
                                                    config.pathStyle === "solid" ? "none" : config.strokeDasharray
                                                }
                                                strokeLinecap="round"
                                                markerEnd={`url(#arrow-${type})`}
                                                opacity={opacity}
                                                filter={isGood && isHovered ? "url(#glow-good)" : undefined}
                                            />
                                            <path
                                                d={d}
                                                fill="none"
                                                stroke="transparent"
                                                strokeWidth="24"
                                                strokeLinecap="round"
                                            />
                                            {/* 선 중간: 아이콘만 (흰 원 배경) — 라벨은 hover 툴팁으로 */}
                                            <g transform={`translate(${midX}, ${midY})`} style={{ pointerEvents: "none" }}>
                                                <motion.g
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <circle r={ICON_R} fill="white" stroke={config.color} strokeWidth="2" />
                                                    <g fill={config.color} transform={`translate(-${ICON_R / 2}, -${ICON_R / 2}) scale(${ICON_R / 24})`}>
                                                        {(() => {
                                                            const Icon = config.Icon;
                                                            return <Icon size={24} />;
                                                        })()}
                                                    </g>
                                                </motion.g>
                                            </g>
                                        </g>
                                    );
                                })}

                                {/* 중앙 선택 멤버 (1.3배 강조 + 글로우, 드래그 연결 가능) */}
                                {selectedMember && (
                                    <motion.g
                                        key={selectedMember.userId}
                                        data-draggable-node
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: connectDragSourceId === selectedMember.userId ? 1.1 : 1,
                                            opacity: 1,
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        style={{ cursor: connectDragSourceId ? "grabbing" : "grab" }}
                                        onClick={(e) => {
                                            if (!connectDragSourceId) setSelectedUserId(selectedMember.userId);
                                        }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            setConnectDragSourceId(selectedMember.userId);
                                            setConnectPointerPos(clientToSVG(e.clientX, e.clientY));
                                        }}
                                        onMouseEnter={() => setHoveredNodeId(selectedMember.userId)}
                                        onMouseLeave={() => setHoveredNodeId(null)}
                                    >
                                        <circle
                                            cx={CX}
                                            cy={CY}
                                            r={CENTER_NODE_R + 8}
                                            fill="none"
                                            stroke="#a855f7"
                                            strokeWidth="2"
                                            opacity="0.5"
                                            filter="url(#glow-center)"
                                        />
                                        <circle
                                            cx={CX}
                                            cy={CY}
                                            r={CENTER_NODE_R + 4}
                                            fill="white"
                                            stroke="#a855f7"
                                            strokeWidth="3"
                                            style={{ filter: "drop-shadow(0 4px 12px rgba(168,85,247,0.4))" }}
                                        />
                                        <circle cx={CX} cy={CY} r={CENTER_NODE_R} fill="url(#centerGrad)" />
                                        <defs>
                                            <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#c4b5fd" />
                                                <stop offset="100%" stopColor="#a855f7" />
                                            </linearGradient>
                                        </defs>
                                        <clipPath id="centerClip">
                                            <circle cx={CX} cy={CY} r={CENTER_NODE_R} />
                                        </clipPath>
                                        <image
                                            href={selectedMember.profileImage || "https://via.placeholder.com/88"}
                                            x={CX - CENTER_NODE_R}
                                            y={CY - CENTER_NODE_R}
                                            width={CENTER_NODE_R * 2}
                                            height={CENTER_NODE_R * 2}
                                            clipPath="url(#centerClip)"
                                            preserveAspectRatio="xMidYMid slice"
                                        />
                                        <text
                                            x={CX}
                                            y={CY + CENTER_NODE_R + 10}
                                            textAnchor="middle"
                                            className="text-[11px] font-bold fill-gray-800"
                                        >
                                            {selectedMember.name}
                                        </text>
                                        <text x={CX} y={CY + CENTER_NODE_R + 20} textAnchor="middle" className="text-[9px] fill-violet-600 font-medium">
                                            선택됨
                                        </text>
                                    </motion.g>
                                )}

                                {/* 원 위 멤버 노드 (드래그 가능) */}
                                {members.map((m, i) => {
                                    if (m.userId === selectedUserId) return null;
                                    const pos = circlePositions[i];
                                    if (!pos) return null;
                                    const isHovered = hoveredNodeId === m.userId;
                                    const isConnectSource = connectDragSourceId === m.userId;
                                    const isDropTarget = dropTargetNodeId === m.userId;
                                    const isConnectable = !!connectDragSourceId && !isConnectSource;
                                    return (
                                        <motion.g
                                            key={m.userId}
                                            data-draggable-node
                                            initial={{ scale: 0 }}
                                            animate={{
                                                scale: isConnectSource ? 1.1 : isDropTarget ? 1.08 : 1,
                                                filter: isDropTarget ? "drop-shadow(0 0 8px rgba(168,85,247,0.8))" : "none",
                                            }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            style={{ cursor: connectDragSourceId ? "grabbing" : "grab" }}
                                            onClick={(e) => {
                                                if (!connectDragSourceId) setSelectedUserId(m.userId);
                                            }}
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                setConnectDragSourceId(m.userId);
                                                setConnectPointerPos(clientToSVG(e.clientX, e.clientY));
                                            }}
                                            onMouseEnter={() => setHoveredNodeId(m.userId)}
                                            onMouseLeave={() => setHoveredNodeId(null)}
                                        >
                                            {isConnectable && (
                                                <motion.circle
                                                    cx={pos.x}
                                                    cy={pos.y}
                                                    r={CIRCLE_NODE_R + 6}
                                                    fill="none"
                                                    stroke="#a855f7"
                                                    strokeWidth={2}
                                                    initial={{ opacity: 0.3 }}
                                                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                                />
                                            )}
                                            <circle
                                                cx={pos.x}
                                                cy={pos.y}
                                                r={CIRCLE_NODE_R + 3}
                                                fill="white"
                                                stroke={isDropTarget ? "#a855f7" : isHovered ? "#a855f7" : "#e5e7eb"}
                                                strokeWidth={isDropTarget ? 3 : isHovered ? 3 : 2}
                                                style={
                                                    isHovered || isConnectSource
                                                        ? { filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.12))" }
                                                        : undefined
                                                }
                                            />
                                            <clipPath id={`clip-${m.userId}`}>
                                                <circle cx={pos.x} cy={pos.y} r={CIRCLE_NODE_R} />
                                            </clipPath>
                                            <image
                                                href={m.profileImage || "https://via.placeholder.com/76"}
                                                x={pos.x - CIRCLE_NODE_R}
                                                y={pos.y - CIRCLE_NODE_R}
                                                width={CIRCLE_NODE_R * 2}
                                                height={CIRCLE_NODE_R * 2}
                                                clipPath={`url(#clip-${m.userId})`}
                                                preserveAspectRatio="xMidYMid slice"
                                            />
                                            <text
                                                x={pos.x}
                                                y={pos.y + CIRCLE_NODE_R + 10}
                                                textAnchor="middle"
                                                className="text-[10px] font-bold fill-gray-800"
                                            >
                                                {m.name}
                                            </text>
                                            <text
                                                x={pos.x}
                                                y={pos.y + CIRCLE_NODE_R + 20}
                                                textAnchor="middle"
                                                className="text-[8px] fill-gray-500 font-medium"
                                            >
                                                드래그·클릭
                                            </text>
                                        </motion.g>
                                    );
                                })}
                            </svg>

                            {/* 발견 중 기대감 (0.5초) */}
                            <AnimatePresence>
                                {pendingReveal && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute z-20 flex flex-col items-center gap-0.5 rounded-xl border-2 border-violet-300 bg-white/95 px-4 py-2 shadow-lg"
                                        style={{
                                            left: `${(pendingReveal.midX / VIEWBOX) * 100}%`,
                                            top: `${(pendingReveal.midY / VIEWBOX) * 100}%`,
                                            transform: "translate(-50%, -50%)",
                                        }}
                                    >
                                        <span className="text-sm font-bold text-violet-600">???</span>
                                        <span className="text-[10px] text-gray-500">발견 중...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* 선 위 미니 뱃지 (얼굴 안 가림) — 작은 원형만 선 중앙 */}
                            <AnimatePresence>
                                {scorePopup && (() => {
                                    const config = RELATION_CONFIG[scorePopup.type];
                                    const isCollision = scorePopup.type === "상극";
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                ...(isCollision
                                                    ? {
                                                          x: [0, -4, 4, -2, 2, 0],
                                                          transition: {
                                                              x: { duration: 0.35 },
                                                              opacity: { duration: 0.2 },
                                                              scale: { type: "spring", stiffness: 400, damping: 25 },
                                                          },
                                                      }
                                                    : {}),
                                            }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="match-badge absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-xs font-black shadow-lg"
                                            style={{
                                                left: `${(scorePopup.midX / VIEWBOX) * 100}%`,
                                                top: `${(scorePopup.midY / VIEWBOX) * 100}%`,
                                                transform: "translate(-50%, -50%)",
                                                borderColor: config.color,
                                                color: config.color,
                                            }}
                                        >
                                            +{scorePopup.points}
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                            {/* 하단 고정 결과 바 — 상세 문구 (얼굴 안 가림) */}
                            <AnimatePresence>
                                {scorePopup && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="match-result-popup absolute bottom-3 left-3 right-3 z-20 rounded-xl border-2 px-3 py-2 text-center shadow-lg"
                                        style={{
                                            borderColor: RELATION_CONFIG[scorePopup.type].color,
                                            backgroundColor: "rgba(255,255,255,0.98)",
                                        }}
                                    >
                                        <span className="text-sm font-bold" style={{ color: RELATION_CONFIG[scorePopup.type].color }}>
                                            {scorePopup.type === "보완" && "💚 "}
                                            {scorePopup.type === "상생" && "💜 "}
                                            {scorePopup.type === "상충" && "🧡 "}
                                            {scorePopup.type === "상극" && "❌ "}
                                            {scorePopup.name1} & {scorePopup.name2}: +{scorePopup.points}점 {scorePopup.label}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* 전체 발견 완료 축하 */}
                            <AnimatePresence>
                                {showCompletionCelebration && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100 px-8 py-6 text-center shadow-2xl"
                                        >
                                            <p className="text-2xl font-black text-amber-800">
                                                팀 완전 분석 완료!
                                            </p>
                                            <p className="mt-2 text-sm text-amber-700">
                                                모든 관계를 발견했어요 🎉
                                            </p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* 선 호버 툴팁 */}
                            <AnimatePresence>
                                {hoveredRel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute left-1/2 top-1/2 z-10 w-[90%] max-w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
                                    >
                                        <p className="text-xs font-medium text-gray-500">{hoveredRel.elementInvolved}</p>
                                        <p className="mt-1 line-clamp-2 text-sm text-gray-800">{hoveredRel.description}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* 프로필 호버 카드 */}
                            <ProfileHoverCard
                                hoveredNodeId={hoveredNodeId}
                                selectedUserId={selectedUserId}
                                members={members}
                                circlePositions={circlePositions}
                            />
                        </div>
                    </div>

                    {/* 우측: 관계 요약 카드 */}
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-bold text-gray-800">📊 관계 요약</p>
                        {(["보완", "상생", "상충", "상극"] as const).map((t) => {
                            const c = RELATION_CONFIG[t];
                            const count = relationCountsByType[t];
                            return (
                                <div
                                    key={t}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                                    style={{ backgroundColor: `${c.color}12` }}
                                >
                                    <span className="flex items-center gap-2 font-medium" style={{ color: c.color }}>
                                        <c.Icon size={16} />
                                        {c.label}
                                    </span>
                                    <span className="font-bold text-gray-800">{count}개</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 하단: 범례 — 💚 채워줌 (발견/전체), 클릭 시 해당 관계 표시/숨김 */}
                <div className="mt-4 flex flex-wrap gap-3">
                    {(["보완", "상생", "상충", "상극"] as const).map((t) => {
                        const c = RELATION_CONFIG[t];
                        const isActive = highlightedLegendType === t;
                        const isVisible = visibleTypes.has(t);
                        const discovered = discoveredCountsByType[t];
                        const total = relationCountsByType[t];
                        return (
                            <motion.button
                                key={t}
                                type="button"
                                onMouseEnter={() => setHighlightedLegendType(t)}
                                onMouseLeave={() => setHighlightedLegendType(null)}
                                onClick={() => {
                                    setVisibleTypes((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(t)) next.delete(t);
                                        else next.add(t);
                                        return next;
                                    });
                                }}
                                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                                    isActive ? "ring-2 ring-offset-2" : ""
                                } ${!isVisible ? "opacity-50" : ""}`}
                                style={{
                                    borderColor: isActive ? c.color : "#e5e7eb",
                                    backgroundColor: `${c.color}10`,
                                    ringColor: c.color,
                                }}
                            >
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${c.color}25` }}
                                >
                                    <c.Icon size={20} style={{ color: c.color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">
                                        {c.label} ({discovered}/{total})
                                    </p>
                                    <p className="text-xs text-gray-500">{c.description}</p>
                                    <p className="mt-0.5 text-[10px] text-gray-400">{isVisible ? "클릭 시 숨김" : "클릭 시 표시"}</p>
                                </div>
                            </motion.button>
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

const SLOT_HEIGHT = 72;
const LEFT_NODE_X = 0;
const RIGHT_NODE_X = 140;
const SVG_WIDTH = 160;
const SVG_PADDING = 24;

function ListView({
    members,
    relationships,
    selectedUserId,
    setSelectedUserId,
    setDetailRel,
    teamScore,
    bestCombos,
    RELATION_CONFIG,
    findRelationship,
}: {
    members: Member[];
    relationships: Relationship[];
    selectedUserId: string | null;
    setSelectedUserId: (id: string) => void;
    setDetailRel: (r: Relationship | null) => void;
    teamScore: number;
    bestCombos: { names: string; type: string; config: (typeof RELATION_CONFIG)["보완"] }[];
    RELATION_CONFIG: typeof RELATION_CONFIG;
    findRelationship: typeof findRelationship;
}) {
    const n = members.length;
    const selectedIndex = members.findIndex((m) => m.userId === selectedUserId);
    const selectedMember = selectedIndex >= 0 ? members[selectedIndex] : null;
    const others = members.filter((m) => m.userId !== selectedUserId);
    const svgHeight =
        Math.max(n * SLOT_HEIGHT, others.length * SLOT_HEIGHT) + SVG_PADDING * 2;

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
                midY,
            };
        });
    }, [selectedMember, selectedIndex, others, relationships, findRelationship]);

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
            >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 font-display">
                            운명의 작대기
                        </h2>
                        <p className="text-sm text-gray-500">
                            한 명을 선택하면 나머지 멤버와의 관계선이 연결돼요.
                        </p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-800">
                        팀 {teamScore}점
                    </span>
                </div>
                {bestCombos.length > 0 && (
                    <p className="mb-3 text-xs text-emerald-700">
                        ✨ 베스트 궁합: {bestCombos[0].names}
                    </p>
                )}

                <div className="flex min-h-[280px] items-stretch gap-0 overflow-x-auto">
                    <div className="flex w-[100px] shrink-0 flex-col sm:w-[112px]">
                        {members.map((m) => {
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
                                        id={`list-arrow-${t}`}
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
                            {lines.map(({ key, d, config, rel, midY, type }) => (
                                <g key={key}>
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke={config.color}
                                        strokeWidth={config.strokeWidth}
                                        strokeDasharray={
                                            config.pathStyle === "solid"
                                                ? "none"
                                                : config.strokeDasharray
                                        }
                                        strokeLinecap="round"
                                        markerEnd={`url(#list-arrow-${type})`}
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

                    <div className="flex w-[100px] shrink-0 flex-col sm:w-[112px]">
                        {others.map((other) => {
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
                        const { color, label, Icon } = RELATION_CONFIG[t];
                        return (
                            <span
                                key={t}
                                className="flex items-center gap-1 rounded-full px-2 py-1 font-medium"
                                style={{ color, backgroundColor: `${color}18` }}
                            >
                                <Icon size={12} />
                                {label}
                            </span>
                        );
                    })}
                </div>
            </motion.section>
        </>
    );
}
