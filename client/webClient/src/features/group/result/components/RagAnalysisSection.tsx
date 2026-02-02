/**
 * 관상 분석 RAG 섹션 (프론트 UI)
 * - RAG 백엔드 미구현 시 더미 데이터로 UI만 표시
 * - 연결 후 데이터만 교체하면 됨
 */
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Sparkles,
    BarChart3,
    Heart,
    Users,
    Film,
    Share2,
    Copy,
    Check,
    Crown,
    Brain,
    Zap,
    Target,
    AlertTriangle,
} from "lucide-react";
import { GroupMember } from "@/shared/types";

// --- 더미 데이터 타입 (RAG 연결 시 교체) ---
export interface MemberRagAnalysis {
    memberId: number;
    keywords: string[];
    stats: {
        leadership: number;
        friendliness: number;
        creativity: number;
        detail: number;
        decisiveness: number;
    };
    description: string;
    recommendedRole: string;
}

export interface PairRagAnalysis {
    member1Id: number;
    member2Id: number;
    score: number;
    title: string;
    chemistryPoints: { type: "good" | "caution"; text: string; sub?: string }[];
    movieMatch: { title: string; description: string };
}

export interface TeamRagAnalysis {
    titles: { memberId: number; title: string; icon: string }[];
    balanceTip?: string;
    dramaMatch?: { title: string; description: string };
}

const STAT_LABELS: Record<keyof MemberRagAnalysis["stats"], string> = {
    leadership: "리더십",
    friendliness: "친화력",
    creativity: "창의력",
    detail: "꼼꼼함",
    decisiveness: "결단력",
};

// --- 더미 데이터 생성 (RAG 연결 전) ---
function getDummyMemberAnalysis(member: GroupMember): MemberRagAnalysis & { loading: boolean } {
    const seed = member.id * 17 + (member.name?.length ?? 0);
    const stats = {
        leadership: 60 + (seed % 35),
        friendliness: 50 + ((seed + 3) % 40),
        creativity: 40 + ((seed + 7) % 45),
        detail: 70 + ((seed + 11) % 28),
        decisiveness: 55 + ((seed + 13) % 42),
    };
    const keywords = ["믿음직한", "리더상", "카리스마", "깊은눈빛", "차분한"];
    return {
        memberId: member.id,
        keywords: keywords.slice(0, 3 + (seed % 3)).map((k, i) => (i === 0 ? k : keywords[(seed + i) % keywords.length])),
        stats,
        description:
            "눈썹이 진하고 눈매가 깊어 신뢰감을 주는 인상이에요. 이마가 넓어 계획적이고, 턱선이 각져 결단력이 있어요. 다만 입꼬리가 살짝 내려가 피곤해 보일 수 있으니 웃는 연습을 해보세요! 😊",
        recommendedRole: "프로젝트 매니저, 의사결정자",
        loading: false,
    };
}

function getDummyPairAnalysis(
    m1: GroupMember,
    m2: GroupMember
): PairRagAnalysis & { loading: boolean } {
    const score = 70 + ((m1.id + m2.id) % 28);
    return {
        member1Id: m1.id,
        member2Id: m2.id,
        score,
        title: score >= 85 ? "환상의 케미!" : score >= 70 ? "괜찮은 조합!" : "서로 알아가기 좋아요",
        chemistryPoints: [
            { type: "good", text: "서로 다른 강점으로 완벽 보완", sub: `→ ${m1.name}의 결단력 + ${m2.name}의 섬세함 = 최강 조합` },
            { type: "good", text: "눈매 궁합 좋음", sub: "→ 둘 다 눈이 커서 소통이 원활해요" },
            { type: "caution", text: "주의할 점", sub: "→ 둘 다 고집이 세 보이니 양보 연습 필요!" },
        ],
        movieMatch: {
            title: "범죄도시",
            description: "든든한 형과 믿음직한 동생 케미",
        },
        loading: false,
    };
}

function getDummyTeamAnalysis(members: GroupMember[]): TeamRagAnalysis & { loading: boolean } {
    const titleTemplates = [
        { icon: "👑", title: "타고난 리더상" },
        { icon: "🌟", title: "분위기 메이커" },
        { icon: "🧠", title: "두뇌 담당" },
        { icon: "💪", title: "실행력 갑" },
        { icon: "🤝", title: "중재자" },
        { icon: "🎨", title: "창의력 담당" },
        { icon: "🔍", title: "꼼꼼이" },
    ];
    const titles = members.slice(0, 7).map((m, i) => ({
        memberId: m.id,
        title: titleTemplates[i % titleTemplates.length].title,
        icon: titleTemplates[i % titleTemplates.length].icon,
    }));
    return {
        titles,
        balanceTip: "부족한 부분: 창의력 → 브레인스토밍 회의 추천!",
        dramaMatch: { title: "미생", description: "각자의 강점으로 함께 성장하는 팀!" },
        loading: false,
    };
}

// --- 로딩 메시지 (재미 요소) ---
const LOADING_PHRASES = [
    "눈썹의 기운을 읽는 중...",
    "이마의 복을 계산하는 중...",
    "입꼬리의 운세를 해석하는 중...",
    "광대뼈의 리더십을 분석하는 중...",
];

// --- 개인 관상 분석 카드 ---
function MemberAnalysisCard({
    member,
    analysis,
}: {
    member: GroupMember;
    analysis: MemberRagAnalysis;
}) {
    const statEntries = Object.entries(analysis.stats) as [keyof MemberRagAnalysis["stats"], number][];
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 ring-inset"
        >
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-600">
                        <Sparkles className="size-6 text-white" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}의 관상 분석</h3>
                </div>
            </div>
            <div className="space-y-6 p-4 sm:p-6">
                <div className="flex gap-4">
                    <div className="size-24 shrink-0 overflow-hidden rounded-xl ring-2 ring-gray-200">
                        <img
                            src={member.avatar || "https://via.placeholder.com/96"}
                            alt=""
                            className="size-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="mb-2 text-sm font-medium text-gray-500">💫 첫인상 키워드</p>
                        <div className="flex flex-wrap gap-2">
                            {analysis.keywords.map((kw, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800"
                                >
                                    #{kw}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <BarChart3 className="size-4 text-violet-600" />
                        관상 능력치
                    </p>
                    <div className="space-y-3">
                        {statEntries.map(([key, value]) => (
                            <div key={key} className="flex items-center gap-3">
                                <span className="w-20 shrink-0 text-sm text-gray-600">
                                    {STAT_LABELS[key]}
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                    <motion.div
                                        className="h-full rounded-full bg-violet-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ duration: 0.6, delay: 0.1 }}
                                    />
                                </div>
                                <span className="w-10 shrink-0 text-right text-sm font-medium text-gray-700">
                                    {value}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Sparkles className="size-4 text-amber-500" />
                        관상으로 보는 성격
                    </p>
                    <p className="text-sm leading-relaxed text-gray-700">{analysis.description}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-violet-700">
                        <Target className="size-4" />
                        어울리는 역할: {analysis.recommendedRole}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

// --- 두 사람 궁합 카드 ---
function PairAnalysisCard({
    m1,
    m2,
    analysis,
}: {
    m1: GroupMember;
    m2: GroupMember;
    analysis: PairRagAnalysis;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 ring-inset"
        >
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pink-500">
                        <Heart className="size-6 text-white" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{m1.name} & {m2.name} 관상 궁합</h3>
                </div>
            </div>
            <div className="space-y-6 p-4 sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-20 overflow-hidden rounded-xl ring-2 ring-violet-200">
                            <img src={m1.avatar || "https://via.placeholder.com/80"} alt="" className="size-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{m1.name}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl font-bold text-pink-500">{analysis.score}점</span>
                        <span className="text-sm font-medium text-gray-600">&quot;{analysis.title}&quot;</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-20 overflow-hidden rounded-xl ring-2 ring-amber-200">
                            <img src={m2.avatar || "https://via.placeholder.com/80"} alt="" className="size-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{m2.name}</span>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Zap className="size-4 text-amber-500" />
                        케미 포인트
                    </p>
                    <ul className="space-y-2">
                        {analysis.chemistryPoints.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                                {item.type === "good" ? (
                                    <Check className="size-4 shrink-0 text-green-500" />
                                ) : (
                                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                                )}
                                <span>
                                    <span className="font-medium text-gray-800">{item.text}</span>
                                    {item.sub && <span className="block text-gray-600">{item.sub}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-lg border border-gray-100 bg-amber-50/50 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Film className="size-4 text-amber-600" />
                        이 조합을 영화로 표현하면?
                    </p>
                    <p className="text-sm font-medium text-amber-900">🎞️ &quot;{analysis.movieMatch.title}&quot;</p>
                    <p className="text-sm text-gray-700">{analysis.movieMatch.description}</p>
                </div>
            </div>
        </motion.div>
    );
}

// --- 팀 전체 관상 리포트 ---
function TeamAnalysisCard({
    members,
    analysis,
}: {
    members: GroupMember[];
    analysis: TeamRagAnalysis;
}) {
    const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 ring-inset"
        >
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                        <Users className="size-6 text-white" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">우리 팀 관상 리포트</h3>
                </div>
            </div>
            <div className="space-y-6 p-4 sm:p-6">
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Crown className="size-4 text-amber-500" />
                        팀 내 타이틀 부여
                    </p>
                    <ul className="space-y-2">
                        {analysis.titles.map((t) => {
                            const m = memberMap.get(t.memberId);
                            return (
                                <li key={t.memberId} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-gray-700">{t.icon} {t.title}</span>
                                    <span className="font-medium text-gray-900">{m?.name ?? "—"}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {analysis.balanceTip && (
                    <div className="rounded-lg border border-gray-100 bg-violet-50/50 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Brain className="size-4 text-violet-600" />
                            팀 능력치 밸런스
                        </p>
                        <p className="mt-1 text-sm text-gray-700">💡 {analysis.balanceTip}</p>
                    </div>
                )}

                {analysis.dramaMatch && (
                    <div className="rounded-lg border border-gray-100 bg-amber-50/50 p-4">
                        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Film className="size-4 text-amber-600" />
                            우리 팀을 드라마로 표현하면?
                        </p>
                        <p className="text-sm font-medium text-amber-900">📺 &quot;{analysis.dramaMatch.title}&quot;</p>
                        <p className="text-sm text-gray-700">{analysis.dramaMatch.description}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// --- 로딩 UI ---
function RagLoadingState({ progress, phrase }: { progress: number; phrase: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 py-16 px-6"
        >
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-violet-100">
                <Sparkles className="size-8 text-violet-600" />
            </div>
            <p className="mb-2 text-lg font-semibold text-gray-900">🔮 관상 분석 중...</p>
            <div className="mb-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                <motion.div
                    className="h-full rounded-full bg-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <p className="text-sm text-violet-700">&quot;{phrase}&quot;</p>
        </motion.div>
    );
}

// --- 공유 바 ---
function RagShareBar({ onCopyLink }: { onCopyLink: () => void }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        onCopyLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Share2 className="size-4" />
                결과 공유하기
            </span>
            <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
            >
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                {copied ? "복사됨!" : "링크 복사"}
            </button>
        </div>
    );
}

// --- 랜덤 한마디 (분석 완료 시) ---
const COMPLETE_ONE_LINERS = [
    "오늘의 관상운: ⭐⭐⭐⭐☆",
    "관상학적 TMI: 이 팀에 복코 보유자가 있어요!",
    "오늘의 럭키 멤버가 궁금하면 한 명 골라보세요 🍀",
];

// --- 메인 섹션 ---
interface RagAnalysisSectionProps {
    groupMembers: GroupMember[];
}

export const RagAnalysisSection: React.FC<RagAnalysisSectionProps> = ({ groupMembers }) => {
    const [view, setView] = useState<"member" | "pair" | "team">("team");
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [selectedPair, setSelectedPair] = useState<[number, number] | null>(null); // [firstId, secondId] or [id, -1] when only first selected
    const selectedMember = groupMembers.find((m) => m.id === selectedMemberId) ?? null;
    const m1 = selectedPair ? groupMembers.find((m) => m.id === selectedPair[0]) ?? null : null;
    const m2 = selectedPair && selectedPair[1] >= 0 ? groupMembers.find((m) => m.id === selectedPair[1]) ?? null : null;

    const memberAnalysis = selectedMember ? getDummyMemberAnalysis(selectedMember) : null;
    const pairAnalysis = m1 && m2 ? getDummyPairAnalysis(m1, m2) : null;
    const teamAnalysis = getDummyTeamAnalysis(groupMembers);

    const oneLiner = useMemo(
        () => COMPLETE_ONE_LINERS[Math.floor(Math.random() * COMPLETE_ONE_LINERS.length)],
        []
    );

    if (groupMembers.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 ring-inset"
        >
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">🔮 관상 분석 RAG</h2>
                    <div className="flex gap-2">
                        {(["team", "member", "pair"] as const).map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setView(v)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                    view === v
                                        ? "bg-violet-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {v === "team" ? "팀 전체" : v === "member" ? "한 명" : "두 명"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
                {view === "member" && (
                    <>
                        <p className="text-sm text-gray-500">분석할 멤버를 선택하세요</p>
                        <div className="flex flex-wrap gap-2">
                            {groupMembers.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMemberId(m.id)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                                        selectedMemberId === m.id
                                            ? "bg-violet-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            {selectedMember && memberAnalysis && !memberAnalysis.loading && (
                                <MemberAnalysisCard member={selectedMember} analysis={memberAnalysis} />
                            )}
                        </AnimatePresence>
                    </>
                )}

                {view === "pair" && (
                    <>
                        <p className="text-sm text-gray-500">궁합을 볼 두 명을 차례로 선택하세요</p>
                        <div className="flex flex-wrap gap-2">
                            {groupMembers.map((m) => {
                                const isFirst = selectedPair?.[0] === m.id;
                                const isSecond = selectedPair?.[1] === m.id;
                                const isSelected = isFirst || isSecond;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            if (!selectedPair) setSelectedPair([m.id, -1]);
                                            else if (selectedPair[0] === m.id) setSelectedPair(null);
                                            else if (selectedPair[1] < 0) setSelectedPair([selectedPair[0], m.id]);
                                            else setSelectedPair([m.id, -1]);
                                        }}
                                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                                            isSelected ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        {m.name} {isFirst ? "(1)" : isSecond ? "(2)" : ""}
                                    </button>
                                );
                            })}
                        </div>
                        <AnimatePresence mode="wait">
                            {m1 && m2 && pairAnalysis && !pairAnalysis.loading && (
                                <PairAnalysisCard m1={m1} m2={m2} analysis={pairAnalysis} />
                            )}
                        </AnimatePresence>
                    </>
                )}

                {view === "team" && (
                    <>
                        {teamAnalysis && !teamAnalysis.loading && (
                            <TeamAnalysisCard members={groupMembers} analysis={teamAnalysis} />
                        )}
                        <p className="text-center text-sm text-amber-700">{oneLiner}</p>
                    </>
                )}

                <RagShareBar onCopyLink={() => navigator.clipboard.writeText(window.location.href)} />
            </div>
        </motion.section>
    );
};
