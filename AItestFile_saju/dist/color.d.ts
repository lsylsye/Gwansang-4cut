/**
 * 이미지에서 RGB 픽셀 추출 모듈
 * MediaPipe 랜드마크 좌표를 이미지 픽셀 좌표로 변환하여 색상 추출
 */
export interface Landmark {
    index?: number;
    x: number;
    y: number;
    z?: number;
}
export interface ColorData {
    sclera_redness?: number;
    eye_region_rgb?: {
        r: number;
        g: number;
        b: number;
    };
    nose_tip_redness?: number;
    nose_tip_rgb?: {
        r: number;
        g: number;
        b: number;
    };
    lip_redness?: number;
    lip_region_rgb?: {
        r: number;
        g: number;
        b: number;
    };
    temple_spot_score?: number;
    forehead_wrinkle_score?: number;
}
/**
 * MediaPipe 랜드마크와 이미지에서 색상 데이터 추출
 */
export declare function extractColorData(imagePath: string, landmarks: Landmark[]): Promise<ColorData>;
/**
 * 색상 데이터를 텍스트로 포맷팅
 */
export declare function formatColorDataForPrompt(colorData: ColorData): string;
//# sourceMappingURL=color.d.ts.map