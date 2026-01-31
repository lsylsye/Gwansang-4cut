/**
 * MediaPipe 468 랜드마크 기반 관상 메트릭 계산 모듈
 * 표준화된 좌표(0~1 범위)를 사용
 */
export interface Landmark {
    index?: number;
    x: number;
    y: number;
    z?: number;
}
export interface MediaPipeFaceData {
    timestamp?: string;
    faces?: Array<{
        faceIndex?: number;
        duration?: number;
        landmarks: Landmark[];
    }>;
    landmarks?: Landmark[];
}
export interface FaceMetricsCalculated {
    head_roll: number;
    head_roll_ok: boolean;
    W_face: number;
    H_face: number;
    face_ratio_wh: number;
    forehead_height: number;
    forehead_height_ratio: number;
    forehead_width: number;
    forehead_width_ratio: number;
    eye_width_L: number;
    eye_width_R: number;
    eye_open_L: number;
    eye_open_R: number;
    eye_slope_L: number;
    eye_slope_R: number;
    eye_size_mean: number;
    eye_asymmetry: number;
    inter_eye_dist: number;
    nose_length: number;
    nose_length_ratio: number;
    nose_width: number;
    mouth_width: number;
    lip_thickness: number;
    mouth_corner_slope: number;
    chin_length: number;
    jaw_width: number;
    jaw_angle: number;
    overall_symmetry: number;
    raw_landmarks_count: number;
}
/**
 * MediaPipe 랜드마크에서 관상 메트릭 계산
 */
export declare function calculateMetrics(data: MediaPipeFaceData): FaceMetricsCalculated;
/**
 * 메트릭을 사람이 읽기 좋은 텍스트로 변환
 */
export declare function formatMetricsForPrompt(m: FaceMetricsCalculated): string;
/**
 * 메트릭을 RAG 검색용 요약 텍스트로 변환
 */
export declare function summarizeMetricsForSearch(m: FaceMetricsCalculated): string;
//# sourceMappingURL=metrics.d.ts.map