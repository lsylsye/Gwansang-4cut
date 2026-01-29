/**
 * MediaPipe 468 랜드마크 기반 관상 메트릭 계산 모듈 (표 v2 확장)
 * 삼정/오악/조합표 기반 계산 포함
 */

import { Landmark, MediaPipeFaceData, FaceMetricsCalculated } from "./metrics";

/**
 * 표준편차 계산
 */
function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * 인덱스로 랜드마크 가져오기
 */
function getLandmark(landmarks: Landmark[], index: number): Landmark {
  const found = landmarks.find((l) => l.index === index);
  if (found) return found;
  if (landmarks[index]) return landmarks[index];
  return { x: 0.5, y: 0.5, z: 0 };
}

/**
 * 두 점 사이 거리
 */
function dist(p1: Landmark, p2: Landmark): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 여러 점의 중심
 */
function centerOf(points: Landmark[]): Landmark {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0, z: 0 };
  const sum = points.reduce(
    (acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y,
      z: (acc.z || 0) + (p.z || 0),
    }),
    { x: 0, y: 0, z: 0 }
  );
  return { x: sum.x / n, y: sum.y / n, z: (sum.z || 0) / n };
}

/**
 * 표 v2 기준으로 확장 메트릭 계산
 */
export function calculateExtendedMetrics(
  baseMetrics: FaceMetricsCalculated,
  data: MediaPipeFaceData
): ExtendedFaceMetrics {
  let landmarks: Landmark[];
  if (data.faces && data.faces.length > 0) {
    landmarks = data.faces[0].landmarks;
  } else if (data.landmarks) {
    landmarks = data.landmarks;
  } else {
    throw new Error("❌ 랜드마크 데이터를 찾을 수 없습니다.");
  }

  const L = (idx: number) => getLandmark(landmarks, idx);
  const { W_face, H_face, D_eye } = {
    W_face: baseMetrics.W_face,
    H_face: baseMetrics.H_face,
    D_eye: (baseMetrics.eye_width_L + baseMetrics.eye_width_R) / 2,
  };

  // ========== A) 품질 필터 ==========
  const p33 = L(33);
  const p263 = L(263);
  const head_roll_deg = Math.atan2(p263.y - p33.y, p263.x - p33.x) * (180 / Math.PI);
  const head_roll_status = Math.abs(head_roll_deg) < 5 ? "ok" : Math.abs(head_roll_deg) < 10 ? "warn" : "bad";

  const p234 = L(234);
  const p454 = L(454);
  const nose_tip = L(4);
  const head_yaw_proxy = Math.abs(dist(nose_tip, p234) - dist(nose_tip, p454)) / W_face;
  const head_yaw_status = head_yaw_proxy < 0.03 ? "front" : head_yaw_proxy < 0.06 ? "turned" : "excluded";

  const p159 = L(159);
  const p145 = L(145);
  const p386 = L(386);
  const p374 = L(374);
  const expression_neutral_eye = ((dist(p159, p145) + dist(p386, p374)) / 2) / D_eye;
  const eye_expression = expression_neutral_eye < 0.10 ? "blink" : expression_neutral_eye < 0.16 ? "neutral" : "wide";

  const p13 = L(13);
  const p14 = L(14);
  const expression_neutral_mouth = dist(p13, p14) / D_eye;
  const mouth_expression = expression_neutral_mouth < 0.06 ? "closed" : expression_neutral_mouth < 0.12 ? "talk" : "smile";

  // ========== B) 삼정(三停) ==========
  const p10 = L(10);
  const p168 = L(168);
  const p2 = L(2);
  const p152 = L(152);

  const upper_section_len = dist(p10, p168) / H_face;
  const mid_section_len = dist(p168, p2) / H_face;
  const lower_section_len = dist(p2, p152) / H_face;

  const upper_section_label = upper_section_len < 0.30 ? "short" : upper_section_len < 0.36 ? "normal" : "long";
  const mid_section_label = mid_section_len < 0.30 ? "short" : mid_section_len < 0.36 ? "normal" : "long";
  const lower_section_label = lower_section_len < 0.30 ? "short" : lower_section_len < 0.36 ? "normal" : "long";

  const three_section_balance = stdDev([upper_section_len, mid_section_len, lower_section_len]);
  const three_section_balanced = three_section_balance < 0.02;

  // 광대/중안
  const p93 = L(93);
  const p323 = L(323);
  const cheekbone_width = dist(p93, p323) / W_face;
  const cheekbone_label = cheekbone_width < 0.50 ? "narrow" : cheekbone_width < 0.56 ? "normal" : "wide";

  // 턱각
  const p172 = L(172);
  const p397 = L(397);
  const jaw_width_gonial = dist(p172, p397) / W_face;
  const jaw_width_label = jaw_width_gonial < 0.48 ? "narrow" : jaw_width_gonial < 0.54 ? "normal" : "wide";

  const lower_face_length = dist(p13, p152) / H_face;
  const lower_face_label = lower_face_length < 0.33 ? "weak" : lower_face_length < 0.38 ? "normal" : "strong";

  // ========== C) 오악(五嶽) ==========
  // 코(중악) z 높이
  const bridgePoints = [L(168), L(6), L(197), L(195)];
  const cheekRefPoints = [p234, p454, p93, p323];
  const mean_z_bridge = bridgePoints.reduce((sum, p) => sum + (p.z || 0), 0) / bridgePoints.length;
  const mean_z_cheek = cheekRefPoints.reduce((sum, p) => sum + (p.z || 0), 0) / cheekRefPoints.length;
  const nose_bridge_height_z = (mean_z_bridge - mean_z_cheek) / W_face;
  const nose_bridge_label = nose_bridge_height_z > 0.01 ? "high" : nose_bridge_height_z > -0.01 ? "mid" : "low";

  const nose_tip_projection_z = ((nose_tip.z || 0) - mean_z_cheek) / W_face;
  const nose_tip_label = nose_tip_projection_z > 0.01 ? "proj" : nose_tip_projection_z > -0.01 ? "neutral" : "recede";

  const x_mid = (p234.x + p454.x) / 2;
  const nose_center_offset = Math.abs(nose_tip.x - x_mid) / W_face;
  const nose_center_label = nose_center_offset < 0.02 ? "centered" : nose_center_offset < 0.04 ? "off" : "crooked";

  // 이마(남악) 기울기
  const forehead_slope_z = ((p10.z || 0) - (p168.z || 0)) / W_face;
  const forehead_slope_label = forehead_slope_z > 0.01 ? "forward" : forehead_slope_z > -0.01 ? "neutral" : "back";

  // 턱(북악) 돌출
  const chin_projection_z = ((p152.z || 0) - mean_z_cheek) / W_face;
  const chin_projection_label = chin_projection_z > 0.01 ? "proj" : chin_projection_z > -0.01 ? "neutral" : "recede";

  // 광대 vs 턱
  const cheekbone_vs_jaw = dist(p93, p323) / dist(p172, p397);
  const cheekbone_vs_jaw_label = cheekbone_vs_jaw > 1.05 ? "zygoma" : cheekbone_vs_jaw > 0.95 ? "neutral" : "jaw";

  // ========== D) 눈썹 ==========
  const browLeftSet = [46, 52, 53, 63, 65, 66, 70, 105, 107].map((i) => L(i));
  const browRightSet = [276, 282, 283, 293, 295, 296, 300, 334, 336].map((i) => L(i));
  const brow_low = centerOf([...browLeftSet, ...browRightSet]);
  const eye_top_set = [L(159), L(386)];
  const eye_top = centerOf(eye_top_set);
  const brow_height_mean = Math.abs(eye_top.y - brow_low.y) / H_face;
  const brow_height_label = brow_height_mean < 0.06 ? "low" : brow_height_mean < 0.09 ? "normal" : "high";

  const brow_length_L = dist(L(46), L(107));
  const brow_length_R = dist(L(276), L(336));
  const brow_length_mean = (brow_length_L + brow_length_R) / 2;
  const brow_length_label = brow_length_mean / D_eye > 1.1 ? "long" : brow_length_mean / D_eye < 0.9 ? "short" : "normal";

  const eye_width_mean = (baseMetrics.eye_width_L + baseMetrics.eye_width_R) / 2;
  const brow_vs_eye_len = brow_length_mean / (eye_width_mean + 0.001);
  const brow_vs_eye_label = brow_vs_eye_len > 1.05 ? "brow>eye" : brow_vs_eye_len > 0.95 ? "~=" : "<";

  const p107 = L(107);
  const p336 = L(336);
  const brow_gap = dist(p107, p336) / D_eye;
  const brow_gap_label = brow_gap < 0.55 ? "close" : brow_gap < 0.75 ? "normal" : "wide";

  // ========== E) 코 상세 ==========
  const p98 = L(98);
  const p327 = L(327);
  const nose_width_alar = dist(p98, p327) / D_eye;
  const nose_width_label = nose_width_alar < 0.55 ? "narrow" : nose_width_alar < 0.70 ? "normal" : "wide";

  const nose_tip_pointiness = angle3Points(p98, nose_tip, p327);
  const nose_tip_pointiness_label = nose_tip_pointiness < 55 ? "sharp" : nose_tip_pointiness < 70 ? "neutral" : "round";

  // ========== F) 입 상세 ==========
  const p61 = L(61);
  const p291 = L(291);
  const mouth_width_normalized = dist(p61, p291) / D_eye;
  const mouth_width_label = mouth_width_normalized < 1.60 ? "small" : mouth_width_normalized < 1.95 ? "normal" : "big";

  const p0 = L(0);
  const upper_lip_thick = dist(p0, p13) / D_eye;
  const p17 = L(17);
  const lower_lip_thick = dist(p17, p14) / D_eye;
  const lip_balance = upper_lip_thick / (lower_lip_thick + 0.001);
  const lip_balance_label = lip_balance > 0.8 && lip_balance < 1.2 ? "balanced" : "unbal";

  const philtrum_length = dist(p2, p13) / H_face;
  const philtrum_label = philtrum_length < 0.06 ? "short" : philtrum_length < 0.08 ? "normal" : "long";

  const chin_pointiness = angle3Points(L(148), p152, L(377));
  const chin_pointiness_label = chin_pointiness < 65 ? "pointy" : chin_pointiness < 80 ? "neutral" : "round";

  return {
    // 품질
    head_roll_deg,
    head_roll_status,
    head_yaw_proxy,
    head_yaw_status,
    expression_neutral_eye,
    eye_expression,
    expression_neutral_mouth,
    mouth_expression,

    // 삼정
    upper_section_len,
    upper_section_label,
    mid_section_len,
    mid_section_label,
    lower_section_len,
    lower_section_label,
    three_section_balance,
    three_section_balanced,
    cheekbone_width,
    cheekbone_label,
    jaw_width_gonial,
    jaw_width_label,
    lower_face_length,
    lower_face_label,

    // 오악
    nose_bridge_height_z,
    nose_bridge_label,
    nose_tip_projection_z,
    nose_tip_label,
    nose_center_offset,
    nose_center_label,
    forehead_slope_z,
    forehead_slope_label,
    chin_projection_z,
    chin_projection_label,
    cheekbone_vs_jaw,
    cheekbone_vs_jaw_label,

    // 눈썹
    brow_height_mean,
    brow_height_label,
    brow_length_mean,
    brow_length_label,
    brow_vs_eye_len,
    brow_vs_eye_label,
    brow_gap,
    brow_gap_label,

    // 코 상세
    nose_width_alar,
    nose_width_label,
    nose_tip_pointiness,
    nose_tip_pointiness_label,

    // 입 상세
    mouth_width_normalized,
    mouth_width_label,
    upper_lip_thick,
    lower_lip_thick,
    lip_balance,
    lip_balance_label,
    philtrum_length,
    philtrum_label,
    chin_pointiness,
    chin_pointiness_label,
  };
}

/**
 * 세 점으로 각도 계산
 */
function angle3Points(p1: Landmark, p2: Landmark, p3: Landmark): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cos) * (180 / Math.PI);
}

export interface ExtendedFaceMetrics {
  // 품질
  head_roll_deg: number;
  head_roll_status: "ok" | "warn" | "bad";
  head_yaw_proxy: number;
  head_yaw_status: "front" | "turned" | "excluded";
  expression_neutral_eye: number;
  eye_expression: "blink" | "neutral" | "wide";
  expression_neutral_mouth: number;
  mouth_expression: "closed" | "talk" | "smile";

  // 삼정
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

  // 오악
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

  // 눈썹
  brow_height_mean: number;
  brow_height_label: "low" | "normal" | "high";
  brow_length_mean: number;
  brow_length_label: "long" | "normal" | "short";
  brow_vs_eye_len: number;
  brow_vs_eye_label: "brow>eye" | "~=" | "<";
  brow_gap: number;
  brow_gap_label: "close" | "normal" | "wide";

  // 코 상세
  nose_width_alar: number;
  nose_width_label: "narrow" | "normal" | "wide";
  nose_tip_pointiness: number;
  nose_tip_pointiness_label: "sharp" | "neutral" | "round";

  // 입 상세
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
