import React, { useState } from "react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { ImageWithFallback } from "@/shared/components/figma/ImageWithFallback";
import { Heart, AlertTriangle, Utensils, Snowflake, Brain, Sparkles, Clock, TrendingUp, Download, Camera } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Constants (Moved from AnalysisSection) ---
const CONSTITUTION_DATA = {
    type: "소음인 (수분 부족형)",
    desc: "몸이 차고 소화기관이 약한 편입니다. 기운이 안으로 갈무리되는 성질을 가지고 있어 세심하고 꼼꼼하지만, 스트레스를 받으면 소화력이 급격히 떨어질 수 있습니다.",
    badFoods: ["돼지고기", "밀가루", "찬 우유", "빙수", "생맥주"],
    goodFoods: ["닭고기", "마늘", "생강차", "따뜻한 쌀밥", "대추차"],
    symptoms: ["손발이 차고 추위를 잘 탐", "소화불량이 잦음", "생각이 많고 예민함"],
    habits: "한 번에 과식하기보다 소량씩 자주 식사하고, 차가운 물보다는 미지근한 물을 즐기세요.",
    vulnerable: ["위장 (소화기)", "신장 (배설기)"],
};

const SSABAP_MENUS = [
    {
        name: "닭가슴살 쌈밥",
        desc: "따뜻한 성질의 닭고기",
        image: "https://images.unsplash.com/photo-1747228469031-c5fc60b9d9f9?q=80&w=400&auto=format&fit=crop",
        reason: "소음인은 몸을 따뜻하게 데워주는 보양식이 필수입니다. 닭고기는 기력을 보충하고 소화를 돕는 최고의 궁합입니다."
    },
    {
        name: "강된장 보리밥",
        desc: "구수한 발효 음식",
        image: "https://images.unsplash.com/photo-1764853467738-93ee25b0ad1e?q=80&w=400&auto=format&fit=crop",
        reason: "차가워진 위장을 달래주는 따뜻한 발효 된장은 장운동을 돕고 면역력을 높여줍니다."
    },
    {
        name: "영양 돌솥 비빔밥",
        desc: "열기를 품은 한 끼",
        image: "https://images.unsplash.com/photo-1628441309764-794e7362f6e6?q=80&w=400&auto=format&fit=crop",
        reason: "따뜻한 온기가 유지되는 돌솥에 익힌 채소들은 위장에 무리를 주지 않고 영양을 공급합니다."
    },
    {
        name: "진한 삼계탕",
        desc: "최고의 기력 보충",
        image: "https://images.unsplash.com/photo-1676686997059-fb817ebbb2b5?q=80&w=400&auto=format&fit=crop",
        reason: "기운이 허할 때 먹는 삼계탕은 인삼과 마늘의 열기로 체온을 높이고 혈액순환을 돕습니다."
    },
];

const CAMPUS_LIST = ["부울경", "서울", "대전", "구미", "광주"] as const;
type Campus = typeof CAMPUS_LIST[number];

const CAMPUS_MENUS: Record<Campus, typeof SSABAP_MENUS> = {
    "부울경": SSABAP_MENUS, // Simplified for brevity in this copy, reusing same list as original code did
    "서울": [
        {
            name: "매콤 닭볶음탕",
            desc: "얼얼한 매운맛",
            image: "https://images.unsplash.com/photo-1604908815604-5844f135f772?q=80&w=400&auto=format&fit=crop",
            reason: "서울 캠퍼스 인근 맛집의 시그니처 메뉴입니다. 매운 양념이 식욕을 돋우고 기운을 북돋아줍니다."
        },
        {
            name: "제육볶음 정식",
            desc: "고소한 돼지고기",
            image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?q=80&w=400&auto=format&fit=crop",
            reason: "단백질이 풍부한 제육볶음은 바쁜 개발자들의 체력을 보충해줍니다."
        },
        {
            name: "김치찌개 백반",
            desc: "얼큰한 국물요리",
            image: "https://images.unsplash.com/photo-1618119069294-a66eea07e28c?q=80&w=400&auto=format&fit=crop",
            reason: "속을 풀어주는 뜨거운 김치찌개는 스트레스 해소에 도움이 됩니다."
        },
        {
            name: "불고기 덮밥",
            desc: "달콤짭조름한 맛",
            image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=400&auto=format&fit=crop",
            reason: "바쁜 점심시간에 빠르게 먹을 수 있는 한 그릇 요리입니다."
        },
    ],
    "대전": [
        {
            name: "성심당 빵 세트",
            desc: "대전 명물 베이커리",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop",
            reason: "대전을 대표하는 성심당의 빵은 출출할 때 간편하게 에너지를 충전할 수 있습니다."
        },
        {
            name: "칼국수 정식",
            desc: "쫄깃한 면발",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&auto=format&fit=crop",
            reason: "담백하고 든든한 칼국수는 소화가 잘 되어 오후 졸음을 방지합니다."
        },
        {
            name: "보쌈 정식",
            desc: "부드러운 수육",
            image: "https://images.unsplash.com/photo-1674899933560-c208da2f6f0c?q=80&w=400&auto=format&fit=crop",
            reason: "야채와 함께 먹는 보쌈은 영양 균형이 뛰어난 건강식입니다."
        },
        {
            name: "순두부찌개",
            desc: "부드러운 단백질",
            image: "https://images.unsplash.com/photo-1596040033229-a0b7e0bc1031?q=80&w=400&auto=format&fit=crop",
            reason: "소화가 잘 되는 순두부는 위장이 약한 분들에게 좋습니다."
        },
    ],
    "구미": [
        {
            name: "구미 곱창 정식",
            desc: "고소한 내장 요리",
            image: "https://images.unsplash.com/photo-1670479063750-fb2c533c878f?q=80&w=400&auto=format&fit=crop",
            reason: "구미 지역 특산 곱창은 철분과 단백질이 풍부하여 체력 보충에 탁월합니다."
        },
        {
            name: "쌈밥 정식",
            desc: "신선한 채소",
            image: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?q=80&w=400&auto=format&fit=crop",
            reason: "다양한 야채와 함께하는 쌈밥은 식이섬유가 풍부해 건강에 좋습니다."
        },
        {
            name: "된장찌개 백반",
            desc: "구수한 재래식 된장",
            image: "https://images.unsplash.com/photo-1623428188584-d16f38e62665?q=80&w=400&auto=format&fit=crop",
            reason: "발효 식품인 된장은 장 건강을 개선하고 면역력을 높입니다."
        },
        {
            name: "갈비탕",
            desc: "진한 사골 국물",
            image: "https://images.unsplash.com/photo-1677183123125-093bd839cfaa?q=80&w=400&auto=format&fit=crop",
            reason: "깊은 맛의 갈비탕은 피로 회복과 뼈 건강에 도움을 줍니다."
        },
    ],
    "광주": [
        {
            name: "비빔밥 정식",
            desc: "전주 비빔밥 스타일",
            image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?q=80&w=400&auto=format&fit=crop",
            reason: "호남 지역의 자랑인 비빔밥은 다양한 나물로 영양 균형이 완벽합니다."
        },
        {
            name: "광주식 육회 비빔밥",
            desc: "신선한 생육",
            image: "https://images.unsplash.com/photo-1620791144290-cf4892134c1a?q=80&w=400&auto=format&fit=crop",
            reason: "신선한 육회는 철분과 단백질 공급에 탁월하며 원기 회복에 좋습니다."
        },
        {
            name: "백반 정식",
            desc: "풍성한 반찬",
            image: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?q=80&w=400&auto=format&fit=crop",
            reason: "10가지 이상의 반찬이 나오는 광주 백반은 영양소를 골고루 섭취할 수 있습니다."
        },
        {
            name: "떡갈비 정식",
            desc: "달콤한 양념갈비",
            image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=400&auto=format&fit=crop",
            reason: "부드러운 떡갈비는 소화가 잘 되고 에너지를 빠르게 보충해줍니다."
        },
    ],
};

const FUTURE_PERIODS = [
    { age: "현재", label: "Current", desc: "풋풋하고 열정 넘치는 현재의 모습입니다. 눈빛에서 미래를 향한 포부가 느껴지는군요." },
    { age: "+10년", label: "2036년", desc: "성숙함과 여유가 묻어나기 시작하는 시기입니다. 사회적 지위와 안정을 얻어 인상이 더욱 편안해졌습니다." },
    { age: "+30년", label: "2056년", desc: "지혜가 얼굴에 깊게 새겨진 전성기입니다. 인자한 미소가 주변 사람들에게 신뢰를 주는 관상으로 변모했습니다." },
    { age: "+50년", label: "2076년", desc: "모든 것을 통달한 듯한 평온한 노년의 모습입니다. 거북 도사와 닮은 신통방통한 기운이 느껴지네요!" },
];

const FUTURE_CHART_DATA = [
    { period: "현재", year: 2026, 재물운: 65, 애정운: 75, 건강운: 80, 지혜: 60, 사회운: 55 },
    { period: "+10년", year: 2036, 재물운: 80, 애정운: 85, 건강운: 75, 지혜: 78, 사회운: 82 },
    { period: "+30년", year: 2056, 재물운: 95, 애정운: 70, 건강운: 65, 지혜: 92, 사회운: 90 },
    { period: "+50년", year: 2076, 재물운: 85, 애정운: 60, 건강운: 55, 지혜: 98, 사회운: 88 },
];

interface StatsAnalysisProps {
    tab: "constitution" | "future";
    images: string[];
}

export const StatsAnalysis: React.FC<StatsAnalysisProps> = ({ tab, images }) => {
    const [selectedMenuIdx, setSelectedMenuIdx] = useState(0);
    const [selectedCampus, setSelectedCampus] = useState<Campus>("부울경");

    const handleDownload = () => {
        alert("이미지가 저장되었습니다. (준비 중)");
    };

    if (tab === "constitution") {
        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <GlassCard className="p-10 border-8 border-white rounded-[40px] shadow-clay-md bg-white/60">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-[#26A69A] rounded-3xl flex items-center justify-center shadow-clay-xs">
                                <Heart className="text-white w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-[#00897B] font-display">{CONSTITUTION_DATA.type}</h3>
                                <p className="text-sm text-gray-500 font-bold">체질 기반 사주 풀이</p>
                            </div>
                        </div>
                        <p className="text-xl text-gray-700 font-hand leading-relaxed mb-8 bg-white/60 p-6 rounded-3xl border-2 border-white shadow-inner">
                            {CONSTITUTION_DATA.desc}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-50 p-5 rounded-3xl border-4 border-white shadow-clay-xs">
                                <h4 className="flex items-center gap-2 font-bold text-red-600 mb-3 text-sm">
                                    <AlertTriangle size={16} /> 피할 음식
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {CONSTITUTION_DATA.badFoods.map((food, i) => (
                                        <span key={i} className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-gray-500 shadow-clay-xs">{food}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-green-50 p-5 rounded-3xl border-4 border-white shadow-clay-xs">
                                <h4 className="flex items-center gap-2 font-bold text-green-600 mb-3 text-sm">
                                    <Utensils size={16} /> 추천 음식
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {CONSTITUTION_DATA.goodFoods.map((food, i) => (
                                        <span key={i} className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-gray-600 shadow-clay-xs">{food}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-2 gap-6">
                        <GlassCard className="p-8 flex flex-col items-center shadow-clay-sm border-4 border-white rounded-[32px] bg-blue-50/40">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 shadow-clay-xs">
                                <Snowflake className="text-blue-500 w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-gray-800 mb-3 font-display">주요 증상</h4>
                            <ul className="text-base text-gray-600 space-y-2 font-hand font-bold w-full text-left">
                                {CONSTITUTION_DATA.symptoms.map((sym, i) => <li key={i} className="flex items-start gap-2"><span>•</span> {sym}</li>)}
                            </ul>
                        </GlassCard>
                        <GlassCard className="p-8 flex flex-col items-center shadow-clay-sm border-4 border-white rounded-[32px] bg-purple-50/40">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 shadow-clay-xs">
                                <Brain className="text-purple-500 w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-gray-800 mb-3 font-display">취약 장기</h4>
                            <ul className="text-base text-gray-600 space-y-2 font-hand font-bold w-full text-left">
                                {CONSTITUTION_DATA.vulnerable.map((org, i) => <li key={i} className="flex items-start gap-2"><span>•</span> {org}</li>)}
                            </ul>
                        </GlassCard>
                        <GlassCard className="col-span-2 p-8 flex items-center gap-6 shadow-clay-sm border-4 border-white rounded-[32px] bg-orange-50/40">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shadow-clay-xs shrink-0">
                                <Sparkles className="text-orange-500 w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-1 font-display">거북 도사의 생활 지침</h4>
                                <p className="text-base text-gray-600 font-hand leading-relaxed font-bold">{CONSTITUTION_DATA.habits}</p>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                <div className="pt-10">
                    <div className="text-center mb-10">
                        <h3 className="text-3xl font-bold text-gray-900 mb-3 font-display">🍽️ 오늘 싸밥 뭐먹지?</h3>
                        <p className="text-gray-500 font-hand text-lg">당신의 체질에 꼭 맞는 맞춤형 식단을 추천해드립니다.</p>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl flex gap-2 shadow-clay-sm border-4 border-white flex-wrap justify-center">
                            {CAMPUS_LIST.map((campus) => {
                                const isActive = selectedCampus === campus;
                                return (
                                    <button
                                        key={campus}
                                        onClick={() => {
                                            setSelectedCampus(campus);
                                            setSelectedMenuIdx(0);
                                        }}
                                        className={`
                                            px-6 py-2.5 rounded-2xl transition-all duration-300 font-bold font-display text-sm
                                            ${isActive
                                                ? "bg-[#00897B] text-white shadow-clay-xs scale-105"
                                                : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}
                                        `}
                                    >
                                        {campus}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {CAMPUS_MENUS[selectedCampus].map((menu, i) => {
                                const isActive = selectedMenuIdx === i;
                                return (
                                    <GlassCard
                                        key={i}
                                        onClick={() => setSelectedMenuIdx(i)}
                                        className={`
                                            p-4 flex flex-col items-center text-center transition-all cursor-pointer relative overflow-hidden rounded-[32px] border-4
                                            ${isActive ? "border-[#00897B] bg-[#E0F2F1] shadow-clay-md scale-105" : "border-white bg-white/60 hover:bg-white shadow-clay-sm"}
                                        `}
                                    >
                                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 shadow-inner border-2 border-white/50">
                                            <ImageWithFallback src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                                        </div>
                                        <h4 className="font-bold text-gray-800 mb-1 font-display text-sm">{menu.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold">{menu.desc}</p>
                                    </GlassCard>
                                )
                            })}
                        </div>
                        <div className="lg:col-span-1">
                            <GlassCard className="h-full p-6 border-4 border-white rounded-[32px] shadow-clay-sm bg-[#00897B] text-white flex flex-col justify-center">
                                <h5 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <Clock size={18} /> 추천 사유
                                </h5>
                                <p className="text-sm font-hand leading-relaxed opacity-90 italic">
                                    "{CAMPUS_MENUS[selectedCampus][selectedMenuIdx].reason}"
                                </p>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (tab === "future") {
        return (
            <div className="flex flex-col items-center">
                <div className="mb-10 text-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3 font-display">미래의 나와 인생네컷</h3>
                    <p className="text-gray-500 font-hand text-lg italic">"거북 도사의 신통력으로 엿보는 당신의 찬란한 앞날"</p>
                </div>

                <div className="flex flex-col xl:flex-row gap-12 items-center xl:items-start max-w-5xl w-full">
                    {/* Photo Strip Frame */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#1a1a1a] p-8 pb-14 shadow-[20px_20px_60px_rgba(0,0,0,0.4)] max-w-[360px] w-full relative group rounded-sm transform -rotate-1">
                            <div className="flex justify-between text-white/40 text-[9px] font-mono mb-4 uppercase tracking-[0.3em] font-bold">
                                <span>Turtle AI Simulation</span>
                                <span>{new Date().toLocaleDateString().replace(/\./g, ' /')}</span>
                            </div>

                            <div className="flex flex-col gap-4 mb-10">
                                {FUTURE_PERIODS.map((period, i) => {
                                    // Use first captured image for current, unsplash for others
                                    const imgSrc = i === 0 ? (images[0] || "https://images.unsplash.com/photo-1544005313-94ddf0286df2") :
                                        i === 1 ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2" :
                                            i === 2 ? "https://images.unsplash.com/photo-1566616696957-983966fa5d44" :
                                                "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91";

                                    const filterClass = i === 0 ? "grayscale contrast-125" :
                                        i === 1 ? "grayscale sepia-[0.2] brightness-110" :
                                            i === 2 ? "grayscale sepia-[0.4] contrast-110" :
                                                "grayscale sepia-[0.6] contrast-150 brightness-90";

                                    return (
                                        <div key={i} className="aspect-[3/4] bg-gray-900 relative overflow-hidden group/item">
                                            <img src={imgSrc} alt={period.age} className={`w-full h-full object-cover opacity-90 transition-all duration-700 ${filterClass}`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                            <div className="absolute top-2 left-2 text-white/50 text-[8px] font-mono">#{String(i + 1).padStart(2, '0')}</div>
                                            <div className="absolute bottom-3 right-3 text-white/80 text-[10px] font-mono uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-sm">
                                                {period.age}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="text-center pt-2 border-t border-white/10">
                                <h2 className="text-white font-bold text-2xl tracking-tighter font-sans italic">관상네컷</h2>
                                <p className="text-white/30 text-[9px] mt-1 tracking-[0.4em] uppercase font-bold">BY TURTLE GURU STUDIO</p>
                            </div>

                            {/* Film Grain/Dust overlays */}
                            <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
                        </div>

                        <ActionButton variant="primary" onClick={handleDownload} className="w-full flex items-center justify-center gap-3 py-6 text-base max-w-[360px]">
                            <Download size={20} /> 나의 미래 사진 저장하기
                        </ActionButton>
                    </div>

                    {/* Period Descriptions */}
                    <div className="flex-1 space-y-6">
                        <h4 className="text-2xl font-bold text-gray-800 font-display mb-6 flex items-center gap-3">
                            <TrendingUp className="text-[#00897B]" />
                            시대별 인상 변화 풀이
                        </h4>

                        {/* Chart Section */}
                        <GlassCard className="p-8 border-4 border-white shadow-clay-md rounded-[32px] bg-white">
                            <div className="mb-8">
                                <h5 className="text-xl font-bold text-gray-800 mb-2 font-display">운세 흐름 그래프</h5>
                                <p className="text-sm text-gray-500 font-hand">시간이 흐를수록 변화하는 당신의 운기를 한눈에 확인하세요</p>
                            </div>

                            <div className="h-[320px] bg-white rounded-2xl p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={FUTURE_CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="5 5" stroke="#F3F4F6" vertical={false} />
                                        <XAxis
                                            dataKey="period"
                                            tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: '600' }}
                                            stroke="#E5E7EB"
                                            axisLine={{ stroke: '#E5E7EB' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            stroke="#E5E7EB"
                                            axisLine={{ stroke: '#E5E7EB' }}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                padding: '12px 16px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                            }}
                                            labelStyle={{ fontWeight: '700', color: '#1F2937', marginBottom: '8px', fontSize: '14px' }}
                                            itemStyle={{ fontSize: '13px', padding: '2px 0' }}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '24px' }}
                                            iconType="line"
                                            iconSize={20}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="재물운"
                                            stroke="#F59E0B"
                                            strokeWidth={3}
                                            dot={{ fill: '#F59E0B', r: 5, strokeWidth: 2, stroke: 'white' }}
                                            activeDot={{ r: 7 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="애정운"
                                            stroke="#EC4899"
                                            strokeWidth={3}
                                            dot={{ fill: '#EC4899', r: 5, strokeWidth: 2, stroke: 'white' }}
                                            activeDot={{ r: 7 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="건강운"
                                            stroke="#10B981"
                                            strokeWidth={3}
                                            dot={{ fill: '#10B981', r: 5, strokeWidth: 2, stroke: 'white' }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        <div className="space-y-4">
                            {FUTURE_PERIODS.map((period, i) => (
                                <GlassCard
                                    key={i}
                                    className="p-6 border-2 border-white/50 bg-white/40 hover:bg-white/60 transition-colors rounded-2xl"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                            {/* Thumbnail placeholder */}
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                                                {period.age}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <h5 className="font-bold text-gray-800 text-lg">{period.label}</h5>
                                                <span className="text-xs font-bold text-[#00897B] bg-[#E0F2F1] px-2 py-0.5 rounded-full">{period.age}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed font-hand">
                                                {period.desc}
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
