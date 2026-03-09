export interface MenuItem {
    name: string;
    desc: string;
    image: string;
    reason: string;
}

export const SSABAP_MENUS: MenuItem[] = [
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

export const CAMPUS_LIST = ["부울경", "서울", "대전", "구미", "광주"] as const;
export type Campus = typeof CAMPUS_LIST[number];

export const CAMPUS_MENUS: Record<Campus, MenuItem[]> = {
    "부울경": SSABAP_MENUS,
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
