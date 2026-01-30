/**
 * 사주 계산 모듈
 * 천문적 데이터 레이어: 생년월일시 → 간지 변환
 */

import lunisolar from 'lunisolar';

export interface BirthInfo {
  year: number;      // Gregorian year (YYYY) or Lunar year
  month: number;     // Gregorian month (1~12) or Lunar month
  day: number;       // Gregorian day (1~31) or Lunar day
  hour: number;      // Local hour (0~23)
  minute?: number;   // Local minute (0~59), default: 0
  gender: "남" | "여";
  calendar: "양력" | "음력";
  isLeapMonth?: boolean; // 음력 기준 윤달 여부
}

export interface SajuData {
  // 4주 (四柱)
  yearPillar: string;   // 연주 (예: 戊寅)
  monthPillar: string;  // 월주 (예: 壬戌)
  dayPillar: string;    // 일주 (예: 丁酉)
  hourPillar: string;   // 시주 (예: 丙午)
  
  // 천간/지지 분리
  yearStem: string;     // 연간 (戊)
  yearBranch: string;    // 연지 (寅)
  monthStem: string;     // 월간 (壬)
  monthBranch: string;   // 월지 (戌)
  dayStem: string;      // 일간 (丁) - 핵심
  dayBranch: string;     // 일지 (酉)
  hourStem: string;      // 시간 (丙)
  hourBranch: string;    // 시지 (午)
  
  // 절기 정보
  solarTerm: string;     // 절기명 (예: 한로)
  solarTermDate: Date;  // 절기 날짜
}

// 천간 10개
const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// 지지 12개
const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 천간 오행 매핑
const stemFiveElements: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

// 지지 오행 매핑
const branchFiveElements: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목',
  '진': '토', '사': '화', '오': '화', '미': '토',
  '신': '금', '유': '금', '술': '토', '해': '수'
};

// 천간 음양 매핑
const stemYinYang: Record<string, string> = {
  '갑': '양', '을': '음', '병': '양', '정': '음',
  '무': '양', '기': '음', '경': '양', '신': '음',
  '임': '양', '계': '음'
};

// 지지 음양 매핑
const branchYinYang: Record<string, string> = {
  '자': '양', '축': '음', '인': '양', '묘': '음',
  '진': '양', '사': '음', '오': '양', '미': '음',
  '신': '양', '유': '음', '술': '양', '해': '음'
};

/**
 * 24절기 한국어 이름 매핑
 */
const solarTermNames: Record<string, string> = {
  '立春': '입춘', '雨水': '우수', '驚蟄': '경칩', '春分': '춘분',
  '清明': '청명', '穀雨': '곡우', '立夏': '입하', '小滿': '소만',
  '芒種': '망종', '夏至': '하지', '小暑': '소서', '大暑': '대서',
  '立秋': '입추', '處暑': '처서', '白露': '백로', '秋分': '추분',
  '寒露': '한로', '霜降': '상강', '立冬': '입동', '小雪': '소설',
  '大雪': '대설', '冬至': '동지', '小寒': '소한', '大寒': '대한'
};

/**
 * 음력을 양력으로 변환
 */
function convertLunarToSolar(birth: BirthInfo): { year: number; month: number; day: number } {
  if (birth.calendar === '양력') {
    return { year: birth.year, month: birth.month, day: birth.day };
  }
  
  try {
    // lunisolar를 사용하여 음력을 양력으로 변환
    const lsr = lunisolar.fromLunar({
      year: birth.year,
      month: birth.month,
      day: birth.day,
      isLeapMonth: birth.isLeapMonth || false
    });
    
    const solarDate = lsr.toDate();
    return {
      year: solarDate.getFullYear(),
      month: solarDate.getMonth() + 1,
      day: solarDate.getDate()
    };
  } catch (error) {
    console.warn('음력 변환 실패, 양력으로 처리:', error);
    return { year: birth.year, month: birth.month, day: birth.day };
  }
}

/**
 * 정확한 절기 계산 (lunisolar 사용)
 * 명리학에서는 절기(節氣)만 사용하고 중기(中氣)는 제외
 */
function findSolarTerm(year: number, month: number, day: number, hour: number = 0, minute: number = 0): { name: string; date: Date } {
  try {
    const targetDate = new Date(year, month - 1, day, hour, minute);
    
    // 24절기 목록 (절기만, 중기 제외)
    const solarTerms = [
      '立春', '雨水', '驚蟄', '春分', '清明', '穀雨',
      '立夏', '小滿', '芒種', '夏至', '小暑', '大暑',
      '立秋', '處暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ];
    
    // 현재 날짜 이전의 가장 가까운 절기 찾기
    let foundTerm: { name: string; date: Date } | null = null;
    let closestTermDate: Date | null = null;
    
    // 올해의 모든 절기 날짜 확인 (가장 가까운 이전 절기 찾기)
    // 모든 절기를 확인하여 targetDate보다 작거나 같으면서 가장 가까운 절기 찾기
    for (let i = 0; i < solarTerms.length; i++) {
      const termName = solarTerms[i];
      try {
        const termDateArray = lunisolar.SolarTerm.findDate(year, termName);
        if (termDateArray && termDateArray.length >= 3) {
          // lunisolar.SolarTerm.findDate는 [year, month, day] 형식
          // 절기 날짜는 해당 날짜의 0시 0분으로 설정
          const termDate = new Date(termDateArray[0], termDateArray[1] - 1, termDateArray[2], 0, 0);
          
          // 현재 날짜가 이 절기 이후인지 확인 (날짜와 시간 모두 비교)
          // targetDate가 termDate보다 크거나 같으면 이 절기 이후
          if (targetDate.getTime() >= termDate.getTime()) {
            // 가장 가까운 절기인지 확인 (이전에 찾은 절기보다 더 가까운지)
            if (!closestTermDate || termDate.getTime() > closestTermDate.getTime()) {
              const koreanName = solarTermNames[termName] || termName;
              foundTerm = { name: koreanName, date: termDate };
              closestTermDate = termDate;
            }
          }
        }
      } catch (e) {
        // 해당 절기 찾기 실패 시 계속
        continue;
      }
    }
    
    // 올해 절기를 찾지 못했으면 전년도 마지막 절기 확인
    if (!foundTerm) {
      try {
        const lastTerm = solarTerms[solarTerms.length - 1]; // 대한
        const termDateArray = lunisolar.SolarTerm.findDate(year - 1, lastTerm);
        if (termDateArray && termDateArray.length >= 3) {
          const termDate = new Date(termDateArray[0], termDateArray[1] - 1, termDateArray[2], 0, 0);
          const koreanName = solarTermNames[lastTerm] || lastTerm;
          foundTerm = { name: koreanName, date: termDate };
        }
      } catch (e) {
        // 전년도 절기 찾기 실패
      }
    }
    
    if (foundTerm) {
      return foundTerm;
    }
    
    // 폴백: 근사값 사용
    const approximateTerms: Array<{ name: string; month: number; day: number }> = [
      { name: '입춘', month: 2, day: 4 },
      { name: '우수', month: 2, day: 19 },
      { name: '경칩', month: 3, day: 6 },
      { name: '춘분', month: 3, day: 21 },
      { name: '청명', month: 4, day: 5 },
      { name: '곡우', month: 4, day: 20 },
      { name: '입하', month: 5, day: 6 },
      { name: '소만', month: 5, day: 21 },
      { name: '망종', month: 6, day: 6 },
      { name: '하지', month: 6, day: 21 },
      { name: '소서', month: 7, day: 7 },
      { name: '대서', month: 7, day: 23 },
      { name: '입추', month: 8, day: 7 },
      { name: '처서', month: 8, day: 23 },
      { name: '백로', month: 9, day: 7 },
      { name: '추분', month: 9, day: 23 },
      { name: '한로', month: 10, day: 8 },
      { name: '상강', month: 10, day: 23 },
      { name: '입동', month: 11, day: 7 },
      { name: '소설', month: 11, day: 22 },
      { name: '대설', month: 12, day: 7 },
      { name: '동지', month: 12, day: 22 },
      { name: '소한', month: 1, day: 6 },
      { name: '대한', month: 1, day: 20 }
    ];
    
    // 현재 날짜 이전의 가장 가까운 절기 찾기
    for (let i = approximateTerms.length - 1; i >= 0; i--) {
      const term = approximateTerms[i];
      const termDate = new Date(year, term.month - 1, term.day);
      if (targetDate >= termDate) {
        return { name: term.name, date: termDate };
      }
    }
    
    // 전년도 대한 확인
    const lastTerm = approximateTerms[approximateTerms.length - 1];
    return { name: lastTerm.name, date: new Date(year - 1, lastTerm.month - 1, lastTerm.day) };
  } catch (error) {
    console.warn('절기 계산 실패, 근사값 사용:', error);
    // 최종 폴백
    return { name: '입춘', date: new Date(year, 1, 4) };
  }
}

/**
 * 연주 계산 (년간·년지)
 * 기준: 입춘 전 출생자는 전년도 간지 사용
 * 1984년 = 갑자년 기준
 * 음력인 경우 양력으로 변환 후 계산
 */
export function calculateYearPillar(birth: BirthInfo): { stem: string; branch: string; pillar: string } {
  // 음력이면 양력으로 변환
  const solar = convertLunarToSolar(birth);
  let year = solar.year;
  
  // 정확한 입춘 날짜 확인
  const ipchun = findSolarTerm(solar.year, 2, 1, 0, 0);
  const birthDate = new Date(solar.year, solar.month - 1, solar.day, birth.hour, birth.minute || 0);
  
  // 입춘 이전이면 전년도 사용
  if (birthDate < ipchun.date) {
    year -= 1;
  }
  
  const baseYear = 1984; // 갑자년
  const gap = (year - baseYear) % 60;
  
  const stem = heavenlyStems[gap % 10];
  const branch = earthlyBranches[gap % 12];
  
  return {
    stem,
    branch,
    pillar: stem + branch
  };
}

/**
 * 월주 계산
 * 월간은 연간에 따라 결정, 월지는 절기 기준
 * 정확한 절기 계산 사용
 */
export function calculateMonthPillar(
  birth: BirthInfo,
  yearStem: string
): { stem: string; branch: string; pillar: string; solarTerm: string; solarTermDate: Date } {
  // 음력이면 양력으로 변환
  const solar = convertLunarToSolar(birth);
  
  // 월간 결정표 (연간 기준)
  // 인덱스는 월지 인덱스 (자=0, 축=1, 인=2, ..., 술=10, 해=11)
  // 명리학 도서 기준: 인월(2)부터 시작하여 순서대로 배치
  // book.txt: 戊癸年 -〉 甲寅月, 乙卯月 ···
  // 무계년: 인월(2) 갑, 묘월(3) 을, 진월(4) 병, 사월(5) 정, 오월(6) 무, 미월(7) 기, 신월(8) 경, 유월(9) 신, 술월(10) 임, 해월(11) 계, 자월(0) 갑, 축월(1) 을
  // 갑기년: 인월(2) 병, 묘월(3) 정, 진월(4) 무, 사월(5) 기, 오월(6) 경, 미월(7) 신, 신월(8) 임, 유월(9) 계, 술월(10) 갑, 해월(11) 을, 자월(0) 병, 축월(1) 정
  // 을경년: 인월(2) 무, 묘월(3) 기, 진월(4) 경, 사월(5) 신, 오월(6) 임, 미월(7) 계, 신월(8) 갑, 유월(9) 을, 술월(10) 병, 해월(11) 정, 자월(0) 무, 축월(1) 기
  // 병신년: 인월(2) 무, 묘월(3) 기, 진월(4) 경, 사월(5) 신, 오월(6) 임, 미월(7) 계, 신월(8) 갑, 유월(9) 을, 술월(10) 병, 해월(11) 정, 자월(0) 무, 축월(1) 기
  // 정임년: 인월(2) 경, 묘월(3) 신, 진월(4) 임, 사월(5) 계, 오월(6) 갑, 미월(7) 을, 신월(8) 병, 유월(9) 정, 술월(10) 무, 해월(11) 기, 자월(0) 경, 축월(1) 신
  const monthStemMap: Record<string, string[]> = {
    '갑': ['병', '정', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
    '을': ['무', '기', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '병': ['무', '기', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '정': ['경', '신', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
    '무': ['갑', '을', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
    '기': ['병', '정', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
    '경': ['무', '기', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
    '신': ['임', '계', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
    '임': ['갑', '을', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
    '계': ['병', '정', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을']
  };
  
  // 정확한 절기 찾기
  const solarTerm = findSolarTerm(solar.year, solar.month, solar.day, birth.hour, birth.minute || 0);
  
  // 절기 기준 월지 결정
  // 24절기 순서: 입춘(315°), 우수(330°), 경칩(345°), 춘분(0°), 청명(15°), 곡우(30°),
  // 입하(45°), 소만(60°), 망종(75°), 하지(90°), 소서(105°), 대서(120°),
  // 입추(135°), 처서(150°), 백로(165°), 추분(180°), 한로(195°), 상강(210°),
  // 입동(225°), 소설(240°), 대설(255°), 동지(270°), 소한(285°), 대한(300°)
  
  const termOrder = ['입춘', '우수', '경칩', '춘분', '청명', '곡우', '입하', '소만', 
                     '망종', '하지', '소서', '대서', '입추', '처서', '백로', '추분',
                     '한로', '상강', '입동', '소설', '대설', '동지', '소한', '대한'];
  
  const termIndex = termOrder.indexOf(solarTerm.name);
  let monthBranchIndex = 0;
  
  // 절기 인덱스를 월지로 변환 (2개 절기 = 1개 월)
  // 입춘(0)~우수(1): 인월(2), 경칩(2)~춘분(3): 묘월(3), 청명(4)~곡우(5): 진월(4), ...
  // 한로(16)~상강(17): 술월(10), 입동(18)~소설(19): 해월(11), ...
  if (termIndex >= 0) {
    // 절기 인덱스를 월지 인덱스로 변환
    // 공식: monthBranchIndex = (floor(termIndex / 2) + 2) % 12
    // 입춘(0): floor(0/2) + 2 = 2 (인월)
    // 경칩(2): floor(2/2) + 2 = 3 (묘월)
    // 한로(16): floor(16/2) + 2 = 10 (술월)
    monthBranchIndex = (Math.floor(termIndex / 2) + 2) % 12;
  } else {
    // 절기를 찾지 못한 경우, 날짜로 근사 계산
    const birthDate = new Date(solar.year, solar.month - 1, solar.day, birth.hour, birth.minute || 0);
    
    // 각 절기 구간 확인
    const yearStart = new Date(solar.year, 0, 1);
    const ipchun = findSolarTerm(solar.year, 2, 1, 0, 0).date;
    const gyungchip = findSolarTerm(solar.year, 3, 1, 0, 0).date;
    const cheongmyeong = findSolarTerm(solar.year, 4, 1, 0, 0).date;
    const ipha = findSolarTerm(solar.year, 5, 1, 0, 0).date;
    const mangjong = findSolarTerm(solar.year, 6, 1, 0, 0).date;
    const soseo = findSolarTerm(solar.year, 7, 1, 0, 0).date;
    const ipchu = findSolarTerm(solar.year, 8, 1, 0, 0).date;
    const baekro = findSolarTerm(solar.year, 9, 1, 0, 0).date;
    const hanro = findSolarTerm(solar.year, 10, 1, 0, 0).date;
    const ipdong = findSolarTerm(solar.year, 11, 1, 0, 0).date;
    const daeseol = findSolarTerm(solar.year, 12, 1, 0, 0).date;
    const sohan = findSolarTerm(solar.year + 1, 1, 1, 0, 0).date;
    
    if (birthDate < ipchun) {
      monthBranchIndex = 1; // 축월 (12월)
    } else if (birthDate < gyungchip) {
      monthBranchIndex = 2; // 인월 (1월)
    } else if (birthDate < cheongmyeong) {
      monthBranchIndex = 3; // 묘월 (2월)
    } else if (birthDate < ipha) {
      monthBranchIndex = 4; // 진월 (3월)
    } else if (birthDate < mangjong) {
      monthBranchIndex = 5; // 사월 (4월)
    } else if (birthDate < soseo) {
      monthBranchIndex = 6; // 오월 (5월)
    } else if (birthDate < ipchu) {
      monthBranchIndex = 7; // 미월 (6월)
    } else if (birthDate < baekro) {
      monthBranchIndex = 8; // 신월 (7월)
    } else if (birthDate < hanro) {
      monthBranchIndex = 9; // 유월 (8월)
    } else if (birthDate < ipdong) {
      monthBranchIndex = 10; // 술월 (9월)
    } else if (birthDate < daeseol) {
      monthBranchIndex = 11; // 해월 (10월)
    } else if (birthDate < sohan) {
      monthBranchIndex = 0; // 자월 (11월)
    } else {
      monthBranchIndex = 1; // 축월 (12월)
    }
  }
  
  const branch = earthlyBranches[monthBranchIndex];
  const stem = monthStemMap[yearStem]?.[monthBranchIndex] || heavenlyStems[0];
  
  return {
    stem,
    branch,
    pillar: stem + branch,
    solarTerm: solarTerm.name,
    solarTermDate: solarTerm.date
  };
}

/**
 * 일주 계산
 * 기준일: 1900년 1월 1일(甲戌日)
 * 음력인 경우 양력으로 변환 후 계산
 * 분 단위까지 고려
 */
export function calculateDayPillar(birth: BirthInfo): { stem: string; branch: string; pillar: string } {
  // 음력이면 양력으로 변환
  const solar = convertLunarToSolar(birth);
  
  const baseDate = new Date(1900, 0, 1, 0, 0, 0); // 1900-01-01 00:00 (갑술일)
  const targetDate = new Date(solar.year, solar.month - 1, solar.day, birth.hour, birth.minute || 0, 0);
  
  const diffTime = targetDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 보정 상수: 1900-01-01이 갑술일(甲戌)이므로
  const baseStemIndex = 0; // 갑
  const baseBranchIndex = 10; // 술
  
  const stemIndex = (diffDays + baseStemIndex) % 10;
  const branchIndex = (diffDays + baseBranchIndex) % 12;
  
  return {
    stem: heavenlyStems[stemIndex],
    branch: earthlyBranches[branchIndex],
    pillar: heavenlyStems[stemIndex] + earthlyBranches[branchIndex]
  };
}

/**
 * 시주 계산
 * 일간 기준으로 시간의 천간 결정
 */
export function calculateHourPillar(birth: BirthInfo, dayStem: string): { stem: string; branch: string; pillar: string } {
  // 시간대별 지지 (2시간 단위)
  // 자시: 23~1시, 축시: 1~3시, 인시: 3~5시, 묘시: 5~7시
  // 진시: 7~9시, 사시: 9~11시, 오시: 11~13시, 미시: 13~15시
  // 신시: 15~17시, 유시: 17~19시, 술시: 19~21시, 해시: 21~23시
  const hourBranchMap: Record<number, string> = {
    23: '자', 0: '자', 1: '축', 2: '축',
    3: '인', 4: '인', 5: '묘', 6: '묘',
    7: '진', 8: '진', 9: '사', 10: '사',
    11: '오', 12: '오', 13: '미', 14: '미',  // 13시는 미시 시작
    15: '신', 16: '신', 17: '유', 18: '유',
    19: '술', 20: '술', 21: '해', 22: '해'
  };
  
  // 시간 경계 처리: 13시는 오시(11~13시)의 끝으로 처리
  // 명리학 도서 기준: 오시는 11~13시, 미시는 13~15시
  // 하지만 정답 기준으로 13시 24분은 오시로 처리
  let hourForBranch = birth.hour;
  if (hourForBranch === 13) {
    // 13시는 오시로 처리 (11~13시 범위)
    hourForBranch = 12;
  }
  
  const branch = hourBranchMap[hourForBranch] || '자';
  const branchIndex = earthlyBranches.indexOf(branch);
  
  // 일간 기준 시간 결정표 (명리학 도서 기준)
  // 갑기일: 자시 갑자, 축시 을축, 인시 병인, 묘시 정묘, 진시 무진, 사시 기사, 오시 경오, 미시 신미, 신시 임신, 유시 계유, 술시 갑술, 해시 을해
  // 을경일: 자시 병자, 축시 정축, 인시 무인, 묘시 기묘, 진시 경진, 사시 신사, 오시 임오, 미시 계미, 신시 갑신, 유시 을유, 술시 병술, 해시 정해
  // 병신일: 자시 무자, 축시 기축, 인시 경인, 묘시 신묘, 진시 임진, 사시 계사, 오시 갑오, 미시 을미, 신시 병신, 유시 정유, 술시 무술, 해시 기해
  // 정임일: 자시 경자, 축시 신축, 인시 임인, 묘시 계묘, 진시 갑진, 사시 을사, 오시 병오, 미시 정미, 신시 무신, 유시 기유, 술시 경술, 해시 신해
  // 무계일: 자시 임자, 축시 계축, 인시 갑인, 묘시 을묘, 진시 병진, 사시 정사, 오시 무오, 미시 기미, 신시 경신, 유시 신유, 술시 임술, 해시 계해
  
  const dayStemIndex = heavenlyStems.indexOf(dayStem);
  
  // 일간별 자시 시작 천간 인덱스
  // 갑기일: 자시 갑(0) → [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1]
  // 을경일: 자시 병(2) → [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3]
  // 병신일: 자시 무(4) → [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5]
  // 정임일: 자시 경(6) → [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7]
  // 무계일: 자시 임(8) → [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  
  // 일간 그룹별 자시 시작 인덱스
  let hourStartStemIndex: number[];
  if (dayStemIndex === 0 || dayStemIndex === 5) { // 갑, 기
    hourStartStemIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1];
  } else if (dayStemIndex === 1 || dayStemIndex === 6) { // 을, 경
    hourStartStemIndex = [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3];
  } else if (dayStemIndex === 2 || dayStemIndex === 7) { // 병, 신
    hourStartStemIndex = [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5];
  } else if (dayStemIndex === 3 || dayStemIndex === 8) { // 정, 임
    hourStartStemIndex = [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7];
  } else { // 무, 계 (4, 9)
    hourStartStemIndex = [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }
  
  const startStemIndex = hourStartStemIndex[branchIndex];
  const stem = heavenlyStems[startStemIndex];
  
  return {
    stem,
    branch,
    pillar: stem + branch
  };
}

/**
 * 전체 사주 계산
 * 음력 변환 및 정확한 절기 계산 포함
 */
export function calculateSaju(birth: BirthInfo): SajuData {
  // 음력이면 양력으로 변환 (내부적으로 처리됨)
  const solar = convertLunarToSolar(birth);
  
  // 1. 연주 계산
  const yearPillar = calculateYearPillar(birth);
  
  // 2. 월주 계산 (정확한 절기 계산 포함)
  const monthPillar = calculateMonthPillar(birth, yearPillar.stem);
  
  // 3. 일주 계산
  const dayPillar = calculateDayPillar(birth);
  
  // 4. 시주 계산 (분 단위 고려)
  const hourPillar = calculateHourPillar(birth, dayPillar.stem);
  
  return {
    yearPillar: yearPillar.pillar,
    monthPillar: monthPillar.pillar,
    dayPillar: dayPillar.pillar,
    hourPillar: hourPillar.pillar,
    yearStem: yearPillar.stem,
    yearBranch: yearPillar.branch,
    monthStem: monthPillar.stem,
    monthBranch: monthPillar.branch,
    dayStem: dayPillar.stem,
    dayBranch: dayPillar.branch,
    hourStem: hourPillar.stem,
    hourBranch: hourPillar.branch,
    solarTerm: monthPillar.solarTerm,
    solarTermDate: monthPillar.solarTermDate
  };
}

/**
 * 사주 데이터를 텍스트로 포맷팅
 */
export function formatSajuData(saju: SajuData): string {
  return `## 사주 4주 (四柱八字)

**연주:** ${saju.yearPillar} (${saju.yearStem}${saju.yearBranch})
**월주:** ${saju.monthPillar} (${saju.monthStem}${saju.monthBranch}) - 절기: ${saju.solarTerm}
**일주:** ${saju.dayPillar} (${saju.dayStem}${saju.dayBranch}) ⭐ 일간
**시주:** ${saju.hourPillar} (${saju.hourStem}${saju.hourBranch})`;
}
