/**
 * 사주 계산 모듈
 * 천문적 데이터 레이어: 생년월일시 → 간지 변환
 */
export interface BirthInfo {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    gender: "남" | "여";
    calendar: "양력" | "음력";
    isLeapMonth?: boolean;
}
export interface SajuData {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
    yearStem: string;
    yearBranch: string;
    monthStem: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    hourStem: string;
    hourBranch: string;
    solarTerm: string;
    solarTermDate: Date;
}
/**
 * 연주 계산 (년간·년지)
 * 기준: 입춘 전 출생자는 전년도 간지 사용
 * 1984년 = 갑자년 기준
 * 음력인 경우 양력으로 변환 후 계산
 */
export declare function calculateYearPillar(birth: BirthInfo): {
    stem: string;
    branch: string;
    pillar: string;
};
/**
 * 월주 계산
 * 월간은 연간에 따라 결정, 월지는 절기 기준
 * 정확한 절기 계산 사용
 */
export declare function calculateMonthPillar(birth: BirthInfo, yearStem: string): {
    stem: string;
    branch: string;
    pillar: string;
    solarTerm: string;
    solarTermDate: Date;
};
/**
 * 일주 계산
 * 기준일: 1900년 1월 1일(甲戌日)
 * 음력인 경우 양력으로 변환 후 계산
 * 분 단위까지 고려
 */
export declare function calculateDayPillar(birth: BirthInfo): {
    stem: string;
    branch: string;
    pillar: string;
};
/**
 * 시주 계산
 * 일간 기준으로 시간의 천간 결정
 */
export declare function calculateHourPillar(birth: BirthInfo, dayStem: string): {
    stem: string;
    branch: string;
    pillar: string;
};
/**
 * 전체 사주 계산
 * 음력 변환 및 정확한 절기 계산 포함
 */
export declare function calculateSaju(birth: BirthInfo): SajuData;
/**
 * 사주 데이터를 텍스트로 포맷팅
 */
export declare function formatSajuData(saju: SajuData): string;
//# sourceMappingURL=saju_calculation.d.ts.map