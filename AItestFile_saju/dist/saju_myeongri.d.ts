/**
 * 명리 관계 모듈
 * 오행 분포, 십성, 12운성, 합충해 계산
 */
import { SajuData } from "./saju_calculation";
export interface FiveElementDistribution {
    목: number;
    화: number;
    토: number;
    금: number;
    수: number;
}
export interface SipSungData {
    yearStem: string;
    monthStem: string;
    dayStem: string;
    hourStem: string;
    yearBranch: string;
    monthBranch: string;
    dayBranch: string;
    hourBranch: string;
}
export interface TwelveFortune {
    yearBranch: string;
    monthBranch: string;
    dayBranch: string;
    hourBranch: string;
}
export interface GanjiRelation {
    ganCombinations: Array<{
        gan1: string;
        gan2: string;
        result: string;
    }>;
    branchRelations: Array<{
        type: '합' | '충' | '형' | '해' | '파';
        branch1: string;
        branch2: string;
        description: string;
    }>;
}
export interface MyeongriData {
    fiveElements: FiveElementDistribution;
    sipSung: SipSungData;
    twelveFortune: Record<string, string>;
    ganjiRelations: GanjiRelation;
    keywords: string[];
}
/**
 * 오행 분포 계산
 */
export declare function calculateFiveElements(saju: SajuData): FiveElementDistribution;
/**
 * 십성 계산
 * 일간을 기준으로 다른 간지와의 관계
 */
export declare function calculateSipSung(saju: SajuData): SipSungData;
/**
 * 12운성 계산
 * 일간 기준으로 각 지지의 운성
 */
export declare function calculateTwelveFortune(dayStem: string): Record<string, string>;
/**
 * 전체 명리 데이터 계산
 */
export declare function calculateMyeongri(saju: SajuData): MyeongriData;
/**
 * 명리 데이터를 텍스트로 포맷팅
 */
export declare function formatMyeongriData(myeongri: MyeongriData): string;
//# sourceMappingURL=saju_myeongri.d.ts.map