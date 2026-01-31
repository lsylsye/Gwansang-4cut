/**
 * MediaPipe 468 랜드마크 기반 관상 메트릭 계산 모듈 (표 v2 확장)
 * 삼정/오악/조합표 기반 계산 포함
 */
import { MediaPipeFaceData, FaceMetricsCalculated } from "./metrics";
/**
 * 표 v2 기준으로 확장 메트릭 계산
 */
export declare function calculateExtendedMetrics(baseMetrics: FaceMetricsCalculated, data: MediaPipeFaceData): ExtendedFaceMetrics;
export interface ExtendedFaceMetrics {
    head_roll_deg: number;
    head_roll_status: "ok" | "warn" | "bad";
    head_yaw_proxy: number;
    head_yaw_status: "front" | "turned" | "excluded";
    expression_neutral_eye: number;
    eye_expression: "blink" | "neutral" | "wide";
    expression_neutral_mouth: number;
    mouth_expression: "closed" | "talk" | "smile";
    upper_section_len: number;
    upper_section_label: "short" | "normal" | "long";
    mid_section_len: number;
    mid_section_label: "short" | "normal" | "long";
    lower_section_len: number;
    lower_section_label: "short" | "normal" | "long";
    three_section_balance: number;
    three_section_balanced: boolean;
    cheekbone_width: number;
    cheekbone_label: "narrow" | "normal" | "wide";
    jaw_width_gonial: number;
    jaw_width_label: "narrow" | "normal" | "wide";
    lower_face_length: number;
    lower_face_label: "weak" | "normal" | "strong";
    nose_bridge_height_z: number;
    nose_bridge_label: "high" | "mid" | "low";
    nose_tip_projection_z: number;
    nose_tip_label: "proj" | "neutral" | "recede";
    nose_center_offset: number;
    nose_center_label: "centered" | "off" | "crooked";
    forehead_slope_z: number;
    forehead_slope_label: "forward" | "neutral" | "back";
    chin_projection_z: number;
    chin_projection_label: "proj" | "neutral" | "recede";
    cheekbone_vs_jaw: number;
    cheekbone_vs_jaw_label: "zygoma" | "neutral" | "jaw";
    brow_height_mean: number;
    brow_height_label: "low" | "normal" | "high";
    brow_length_mean: number;
    brow_length_label: "long" | "normal" | "short";
    brow_vs_eye_len: number;
    brow_vs_eye_label: "brow>eye" | "~=" | "<";
    brow_gap: number;
    brow_gap_label: "close" | "normal" | "wide";
    nose_width_alar: number;
    nose_width_label: "narrow" | "normal" | "wide";
    nose_tip_pointiness: number;
    nose_tip_pointiness_label: "sharp" | "neutral" | "round";
    mouth_width_normalized: number;
    mouth_width_label: "small" | "normal" | "big";
    upper_lip_thick: number;
    lower_lip_thick: number;
    lip_balance: number;
    lip_balance_label: "balanced" | "unbal";
    philtrum_length: number;
    philtrum_label: "short" | "normal" | "long";
    chin_pointiness: number;
    chin_pointiness_label: "pointy" | "neutral" | "round";
}
//# sourceMappingURL=metrics_extended.d.ts.map