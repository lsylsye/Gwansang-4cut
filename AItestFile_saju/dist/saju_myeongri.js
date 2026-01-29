"use strict";
/**
 * 명리 관계 모듈
 * 오행 분포, 십성, 12운성, 합충해 계산
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFiveElements = calculateFiveElements;
exports.calculateSipSung = calculateSipSung;
exports.calculateTwelveFortune = calculateTwelveFortune;
exports.calculateMyeongri = calculateMyeongri;
exports.formatMyeongriData = formatMyeongriData;
// 천간 오행 매핑
const stemFiveElements = {
    '갑': '목', '을': '목',
    '병': '화', '정': '화',
    '무': '토', '기': '토',
    '경': '금', '신': '금',
    '임': '수', '계': '수'
};
// 지지 오행 매핑
const branchFiveElements = {
    '자': '수', '축': '토', '인': '목', '묘': '목',
    '진': '토', '사': '화', '오': '화', '미': '토',
    '신': '금', '유': '금', '술': '토', '해': '수'
};
// 천간 음양 매핑
const stemYinYang = {
    '갑': '양', '을': '음', '병': '양', '정': '음',
    '무': '양', '기': '음', '경': '양', '신': '음',
    '임': '양', '계': '음'
};
// 지지 음양 매핑
const branchYinYang = {
    '자': '양', '축': '음', '인': '양', '묘': '음',
    '진': '양', '사': '음', '오': '양', '미': '음',
    '신': '양', '유': '음', '술': '양', '해': '음'
};
/**
 * 오행 분포 계산
 */
function calculateFiveElements(saju) {
    const distribution = {
        목: 0,
        화: 0,
        토: 0,
        금: 0,
        수: 0
    };
    // 천간 오행
    const stems = [saju.yearStem, saju.monthStem, saju.dayStem, saju.hourStem];
    stems.forEach(stem => {
        const element = stemFiveElements[stem];
        if (element)
            distribution[element]++;
    });
    // 지지 오행
    const branches = [saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch];
    branches.forEach(branch => {
        const element = branchFiveElements[branch];
        if (element)
            distribution[element]++;
    });
    return distribution;
}
/**
 * 십성 계산
 * 일간을 기준으로 다른 간지와의 관계
 */
function calculateSipSung(saju) {
    const dayStem = saju.dayStem;
    const dayElement = stemFiveElements[dayStem];
    const dayYinYang = stemYinYang[dayStem];
    // 십성 매핑 함수
    function getSipSung(targetStem, targetBranch) {
        const targetElement = stemFiveElements[targetStem] || branchFiveElements[targetBranch];
        const targetYinYang = stemYinYang[targetStem] || branchYinYang[targetBranch];
        if (!targetElement)
            return '';
        // 같은 오행
        if (targetElement === dayElement) {
            if (targetYinYang === dayYinYang) {
                return '비견'; // 같은 음양
            }
            else {
                return '겁재'; // 다른 음양
            }
        }
        // 오행 상생 관계
        // 목생화, 화생토, 토생금, 금생수, 수생목
        const generateMap = {
            '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
        };
        // 오행 상극 관계
        // 목극토, 화극금, 토극수, 금극목, 수극화
        const overcomeMap = {
            '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
        };
        // 내가 생하는 오행 (식신/상관)
        if (generateMap[dayElement] === targetElement) {
            return targetYinYang === dayYinYang ? '식신' : '상관';
        }
        // 나를 생하는 오행 (인수/편인)
        const reverseGenerate = {
            '화': '목', '토': '화', '금': '토', '수': '금', '목': '수'
        };
        if (reverseGenerate[dayElement] === targetElement) {
            return targetYinYang === dayYinYang ? '인수' : '편인';
        }
        // 내가 극하는 오행 (정재/편재)
        if (overcomeMap[dayElement] === targetElement) {
            return targetYinYang === dayYinYang ? '정재' : '편재';
        }
        // 나를 극하는 오행 (정관/편관)
        const reverseOvercome = {
            '토': '목', '금': '화', '수': '토', '목': '금', '화': '수'
        };
        if (reverseOvercome[dayElement] === targetElement) {
            return targetYinYang === dayYinYang ? '정관' : '편관';
        }
        return '';
    }
    return {
        yearStem: getSipSung(saju.yearStem, ''),
        monthStem: getSipSung(saju.monthStem, ''),
        dayStem: '일간', // 기준
        hourStem: getSipSung(saju.hourStem, ''),
        yearBranch: getSipSung('', saju.yearBranch),
        monthBranch: getSipSung('', saju.monthBranch),
        dayBranch: getSipSung('', saju.dayBranch),
        hourBranch: getSipSung('', saju.hourBranch)
    };
}
/**
 * 12운성 계산
 * 일간 기준으로 각 지지의 운성
 */
function calculateTwelveFortune(dayStem) {
    // 일간별 12운성 순서
    const fortuneMap = {
        '갑': ['해', '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술'],
        '을': ['오', '미', '신', '유', '술', '해', '자', '축', '인', '묘', '진', '사'],
        '병': ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'],
        '정': ['유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미', '신'],
        '무': ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'],
        '기': ['유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미', '신'],
        '경': ['사', '오', '미', '신', '유', '술', '해', '자', '축', '인', '묘', '진'],
        '신': ['축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자'],
        '임': ['묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축', '인'],
        '계': ['진', '사', '오', '미', '신', '유', '술', '해', '자', '축', '인', '묘']
    };
    const fortuneNames = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const result = {};
    const order = fortuneMap[dayStem] || [];
    branches.forEach((branch, index) => {
        const fortuneIndex = order.indexOf(branch);
        if (fortuneIndex >= 0) {
            result[branch] = fortuneNames[fortuneIndex];
        }
    });
    return result;
}
/**
 * 천간 합 계산
 */
function calculateGanCombinations(saju) {
    const combinations = [];
    // 천간 5합
    const ganCombinations = {
        '갑': { partner: '기', result: '토' },
        '을': { partner: '경', result: '금' },
        '병': { partner: '신', result: '수' },
        '정': { partner: '임', result: '목' },
        '무': { partner: '계', result: '화' }
    };
    const stems = [
        { name: 'year', stem: saju.yearStem },
        { name: 'month', stem: saju.monthStem },
        { name: 'day', stem: saju.dayStem },
        { name: 'hour', stem: saju.hourStem }
    ];
    for (let i = 0; i < stems.length; i++) {
        for (let j = i + 1; j < stems.length; j++) {
            const stem1 = stems[i].stem;
            const stem2 = stems[j].stem;
            if (ganCombinations[stem1]?.partner === stem2) {
                combinations.push({
                    gan1: stem1,
                    gan2: stem2,
                    result: ganCombinations[stem1].result
                });
            }
            else if (ganCombinations[stem2]?.partner === stem1) {
                combinations.push({
                    gan1: stem2,
                    gan2: stem1,
                    result: ganCombinations[stem2].result
                });
            }
        }
    }
    return combinations;
}
/**
 * 지지 관계 계산 (합, 충, 형, 해, 파)
 */
function calculateBranchRelations(saju) {
    const relations = [];
    const branches = [
        { name: 'year', branch: saju.yearBranch },
        { name: 'month', branch: saju.monthBranch },
        { name: 'day', branch: saju.dayBranch },
        { name: 'hour', branch: saju.hourBranch }
    ];
    // 6합
    const sixCombinations = {
        '자': '축', '축': '자',
        '인': '해', '해': '인',
        '묘': '술', '술': '묘',
        '진': '유', '유': '진',
        '사': '신', '신': '사',
        '오': '미', '미': '오'
    };
    // 3합
    const threeCombinations = [
        ['인', '오', '술'], // 화국
        ['해', '묘', '미'], // 목국
        ['사', '유', '축'], // 금국
        ['신', '자', '진'] // 수국
    ];
    // 충 (6충)
    const chungPairs = {
        '자': '오', '오': '자',
        '축': '미', '미': '축',
        '인': '신', '신': '인',
        '묘': '유', '유': '묘',
        '진': '술', '술': '진',
        '사': '해', '해': '사'
    };
    // 형
    const hyeongPairs = [
        ['인', '사', '신'], // 삼형
        ['자', '묘'], // 자묘형
        ['축', '진', '미', '술'], // 사형
        ['해', '해'] // 자형
    ];
    // 해
    const haePairs = {
        '자': '미', '미': '자',
        '축': '오', '오': '축',
        '인': '신', '신': '인',
        '묘': '진', '진': '묘',
        '사': '해', '해': '사',
        '유': '술', '술': '유'
    };
    // 관계 검사
    for (let i = 0; i < branches.length; i++) {
        for (let j = i + 1; j < branches.length; j++) {
            const b1 = branches[i].branch;
            const b2 = branches[j].branch;
            // 6합
            if (sixCombinations[b1] === b2) {
                relations.push({
                    type: '합',
                    branch1: b1,
                    branch2: b2,
                    description: `${b1}${b2} 6합`
                });
            }
            // 3합
            for (const trio of threeCombinations) {
                if (trio.includes(b1) && trio.includes(b2)) {
                    const third = trio.find(b => b !== b1 && b !== b2);
                    relations.push({
                        type: '합',
                        branch1: b1,
                        branch2: b2,
                        description: `${b1}${b2}${third} 3합(${trio.join('')}국)`
                    });
                    break;
                }
            }
            // 충
            if (chungPairs[b1] === b2) {
                relations.push({
                    type: '충',
                    branch1: b1,
                    branch2: b2,
                    description: `${b1}${b2} 충`
                });
            }
            // 형
            for (const hyeongGroup of hyeongPairs) {
                if (hyeongGroup.includes(b1) && hyeongGroup.includes(b2)) {
                    relations.push({
                        type: '형',
                        branch1: b1,
                        branch2: b2,
                        description: `${b1}${b2} 형`
                    });
                    break;
                }
            }
            // 해
            if (haePairs[b1] === b2) {
                relations.push({
                    type: '해',
                    branch1: b1,
                    branch2: b2,
                    description: `${b1}${b2} 해`
                });
            }
        }
    }
    return relations;
}
/**
 * 전체 명리 데이터 계산
 */
function calculateMyeongri(saju) {
    const fiveElements = calculateFiveElements(saju);
    const sipSung = calculateSipSung(saju);
    const twelveFortune = calculateTwelveFortune(saju.dayStem);
    const ganCombinations = calculateGanCombinations(saju);
    const branchRelations = calculateBranchRelations(saju);
    // 키워드 추출 (RAG 검색용)
    const keywords = [];
    // 일간 키워드
    keywords.push(`${saju.dayStem}${stemFiveElements[saju.dayStem]} 일간`);
    // 오행 분포 키워드
    const maxElement = Object.entries(fiveElements)
        .sort((a, b) => b[1] - a[1])[0];
    if (maxElement[1] >= 3) {
        keywords.push(`${maxElement[0]} 기운이 강한 사주`);
    }
    const minElement = Object.entries(fiveElements)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => a[1] - b[1])[0];
    if (minElement && minElement[1] <= 1) {
        keywords.push(`${minElement[0]} 기운이 약한 사주`);
    }
    // 합충 관계 키워드
    ganCombinations.forEach(combo => {
        keywords.push(`${combo.gan1}${combo.gan2} 합`);
    });
    branchRelations.forEach(rel => {
        if (rel.type === '합') {
            keywords.push(rel.description);
        }
        else if (rel.type === '충') {
            keywords.push(rel.description);
        }
    });
    // 12운성 키워드
    const dayFortune = twelveFortune[saju.dayBranch];
    if (dayFortune === '제왕' || dayFortune === '건록') {
        keywords.push(`${dayFortune} 중심`);
    }
    return {
        fiveElements,
        sipSung,
        twelveFortune,
        ganjiRelations: {
            ganCombinations,
            branchRelations
        },
        keywords
    };
}
/**
 * 명리 데이터를 텍스트로 포맷팅
 */
function formatMyeongriData(myeongri) {
    let text = `## 명리 관계 분석

### 오행 분포
- 목: ${myeongri.fiveElements.목}개
- 화: ${myeongri.fiveElements.화}개
- 토: ${myeongri.fiveElements.토}개
- 금: ${myeongri.fiveElements.금}개
- 수: ${myeongri.fiveElements.수}개

### 십성 (일간 기준)
- 연간: ${myeongri.sipSung.yearStem}
- 월간: ${myeongri.sipSung.monthStem}
- 시간: ${myeongri.sipSung.hourStem}
- 연지: ${myeongri.sipSung.yearBranch}
- 월지: ${myeongri.sipSung.monthBranch}
- 일지: ${myeongri.sipSung.dayBranch}
- 시지: ${myeongri.sipSung.hourBranch}

### 12운성 (일간 기준)
- 연지: ${myeongri.twelveFortune[Object.keys(myeongri.twelveFortune)[0]] || 'N/A'}
- 월지: ${myeongri.twelveFortune[Object.keys(myeongri.twelveFortune)[1]] || 'N/A'}
- 일지: ${myeongri.twelveFortune[Object.keys(myeongri.twelveFortune)[2]] || 'N/A'}
- 시지: ${myeongri.twelveFortune[Object.keys(myeongri.twelveFortune)[3]] || 'N/A'}`;
    if (myeongri.ganjiRelations.ganCombinations.length > 0) {
        text += `\n\n### 천간 합\n`;
        myeongri.ganjiRelations.ganCombinations.forEach(combo => {
            text += `- ${combo.gan1}${combo.gan2} 합 → ${combo.result}\n`;
        });
    }
    if (myeongri.ganjiRelations.branchRelations.length > 0) {
        text += `\n\n### 지지 관계\n`;
        myeongri.ganjiRelations.branchRelations.forEach(rel => {
            text += `- ${rel.description} (${rel.type})\n`;
        });
    }
    text += `\n\n### 주요 키워드\n${myeongri.keywords.join(', ')}`;
    return text;
}
//# sourceMappingURL=saju_myeongri.js.map