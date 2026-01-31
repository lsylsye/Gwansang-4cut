"use strict";
/**
 * MediaPipe 468 랜드마크 기반 관상 메트릭 계산 모듈
 * 표준화된 좌표(0~1 범위)를 사용
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMetrics = calculateMetrics;
exports.formatMetricsForPrompt = formatMetricsForPrompt;
exports.summarizeMetricsForSearch = summarizeMetricsForSearch;
/**
 * 두 점 사이 거리 계산
 */
function dist(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
/**
 * 두 점 사이 각도 계산 (도 단위)
 */
function angleDeg(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}
/**
 * 세 점으로 각도 계산 (p1-p2-p3, p2가 꼭지점)
 */
function angle3Points(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0)
        return 0;
    const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cos) * (180 / Math.PI);
}
/**
 * 여러 점의 중심점 계산
 */
function centerOf(points) {
    const n = points.length;
    if (n === 0)
        return { x: 0, y: 0, z: 0 };
    const sum = points.reduce((acc, p) => ({
        x: acc.x + p.x,
        y: acc.y + p.y,
        z: (acc.z || 0) + (p.z || 0),
    }), { x: 0, y: 0, z: 0 });
    return { x: sum.x / n, y: sum.y / n, z: (sum.z || 0) / n };
}
/**
 * 인덱스로 랜드마크 가져오기
 */
function getLandmark(landmarks, index) {
    // index 필드가 있으면 찾고, 없으면 배열 인덱스 사용
    const found = landmarks.find((l) => l.index === index);
    if (found)
        return found;
    // 배열이 0부터 순서대로라면
    if (landmarks[index])
        return landmarks[index];
    // 못 찾으면 기본값
    return { x: 0.5, y: 0.5, z: 0 };
}
/**
 * MediaPipe 랜드마크에서 관상 메트릭 계산
 */
function calculateMetrics(data) {
    // 랜드마크 추출
    let landmarks;
    if (data.faces && data.faces.length > 0) {
        landmarks = data.faces[0].landmarks;
    }
    else if (data.landmarks) {
        landmarks = data.landmarks;
    }
    else {
        throw new Error("❌ 랜드마크 데이터를 찾을 수 없습니다.");
    }
    // 헬퍼 함수
    const L = (idx) => getLandmark(landmarks, idx);
    // ========== 1) 품질: head_roll ==========
    const p33 = L(33);
    const p263 = L(263);
    const head_roll = angleDeg(p33, p263);
    const head_roll_ok = Math.abs(head_roll) < 10; // ±10° 이내면 OK
    // ========== 2) 얼굴형 기준값 ==========
    const p35 = L(35); // 좌측 얼굴 외곽
    const p265 = L(265); // 우측 얼굴 외곽
    const p10 = L(10); // 이마 상단
    const p152 = L(152); // 턱 끝
    const W_face = dist(p35, p265);
    const H_face = dist(p10, p152);
    const face_ratio_wh = W_face / H_face;
    // D_eye (눈 사이 거리를 정규화 기준으로 사용)
    const p133 = L(133); // 좌측 눈 내안각
    const p362 = L(362); // 우측 눈 내안각
    const D_eye = dist(p133, p362);
    // ========== 3) 이마 ==========
    // 이마 높이: 10(이마 상단) ~ 눈썹 중심
    const browLeft = [L(70), L(63), L(105), L(66), L(107)];
    const browRight = [L(300), L(293), L(334), L(296), L(336)];
    const brow_center = centerOf([...browLeft, ...browRight]);
    const forehead_height = dist(p10, brow_center);
    const forehead_height_ratio = forehead_height / H_face;
    // 이마 폭: 109, 338
    const p109 = L(109);
    const p338 = L(338);
    const forehead_width = dist(p109, p338);
    const forehead_width_ratio = forehead_width / W_face;
    // ========== 4) 눈 ==========
    // 좌측 눈
    const p33_eye = L(33); // 외안각
    const p133_eye = L(133); // 내안각
    const p159 = L(159); // 상 눈꺼풀
    const p145 = L(145); // 하 눈꺼풀
    const eye_width_L = dist(p33_eye, p133_eye);
    const eye_open_L = dist(p159, p145);
    const eye_slope_L = angleDeg(p133_eye, p33_eye);
    // 우측 눈
    const p263_eye = L(263); // 외안각
    const p362_eye = L(362); // 내안각
    const p386 = L(386); // 상 눈꺼풀
    const p374 = L(374); // 하 눈꺼풀
    const eye_width_R = dist(p263_eye, p362_eye);
    const eye_open_R = dist(p386, p374);
    const eye_slope_R = angleDeg(p362_eye, p263_eye);
    // 눈 종합
    const eye_size_mean = (eye_open_L + eye_open_R) / 2;
    const eye_asymmetry = Math.abs(eye_open_L - eye_open_R);
    const inter_eye_dist = dist(p133, p362);
    // ========== 5) 코 ==========
    const p168 = L(168); // 미간
    const p4 = L(4); // 코끝
    const nose_length = dist(p168, p4);
    const nose_length_ratio = nose_length / H_face;
    // 콧볼 폭
    const p98 = L(98); // 좌측 콧볼
    const p195 = L(195); // 우측 콧볼 (또는 327)
    // MediaPipe에서 195는 코 관련, 실제로는 48, 278도 사용 가능
    const p48 = L(48);
    const p278 = L(278);
    const nose_width = dist(p48, p278);
    // ========== 6) 입 ==========
    const p61 = L(61); // 좌측 입꼬리
    const p291 = L(291); // 우측 입꼬리
    const p13 = L(13); // 상순 중앙
    const p14 = L(14); // 하순 중앙
    const mouth_width = dist(p61, p291);
    const lip_thickness = dist(p13, p14);
    const mouth_corner_slope = angleDeg(p61, p291);
    // ========== 7) 턱 ==========
    const p148 = L(148); // 좌측 턱
    const p377 = L(377); // 우측 턱
    const chin_length = dist(p14, p152);
    const jaw_width = dist(p148, p377);
    const jaw_angle = angle3Points(p148, p152, p377);
    // ========== 8) 대칭 ==========
    // 좌우 대칭 점들의 x 좌표 차이 평균
    const symmetryPairs = [
        [33, 263], // 눈 외안각
        [133, 362], // 눈 내안각
        [61, 291], // 입꼬리
        [148, 377], // 턱
        [109, 338], // 이마
    ];
    let symSum = 0;
    for (const [leftIdx, rightIdx] of symmetryPairs) {
        const left = L(leftIdx);
        const right = L(rightIdx);
        // 완벽한 대칭이면 left.x + right.x = 1.0
        symSum += Math.abs((left.x + right.x) - 1.0);
    }
    const overall_symmetry = 1 - symSum / symmetryPairs.length;
    return {
        head_roll,
        head_roll_ok,
        W_face,
        H_face,
        face_ratio_wh,
        forehead_height,
        forehead_height_ratio,
        forehead_width,
        forehead_width_ratio,
        eye_width_L,
        eye_width_R,
        eye_open_L,
        eye_open_R,
        eye_slope_L,
        eye_slope_R,
        eye_size_mean,
        eye_asymmetry,
        inter_eye_dist,
        nose_length,
        nose_length_ratio,
        nose_width,
        mouth_width,
        lip_thickness,
        mouth_corner_slope,
        chin_length,
        jaw_width,
        jaw_angle,
        overall_symmetry,
        raw_landmarks_count: landmarks.length,
    };
}
/**
 * 메트릭을 사람이 읽기 좋은 텍스트로 변환
 */
function formatMetricsForPrompt(m) {
    return `## 얼굴 측정 데이터 (MediaPipe 468 랜드마크 기반)

### 1) 품질(공통) — 얼굴 기울어짐
- **head_roll = ${m.head_roll.toFixed(2)}°** (${m.head_roll_ok ? "✅ 정상" : "⚠️ 기울어짐"})

### 2) 얼굴형(그릇)
- **W_face ≈ ${m.W_face.toFixed(4)}**
- **H_face ≈ ${m.H_face.toFixed(4)}**
- **W/H ≈ ${m.face_ratio_wh.toFixed(3)}**

### 3) 이마
- **forehead_height ≈ ${m.forehead_height.toFixed(4)}**
- **forehead_height / H_face ≈ ${m.forehead_height_ratio.toFixed(3)}**
- **forehead_width ≈ ${m.forehead_width.toFixed(4)}**
- **forehead_width / W_face ≈ ${m.forehead_width_ratio.toFixed(3)}**

### 4) 눈
- **eye_width_L ≈ ${m.eye_width_L.toFixed(4)}**
- **eye_width_R ≈ ${m.eye_width_R.toFixed(4)}**
- **eye_open_L ≈ ${m.eye_open_L.toFixed(4)}**
- **eye_open_R ≈ ${m.eye_open_R.toFixed(4)}**
- **eye_slope_L ≈ ${m.eye_slope_L.toFixed(2)}°**
- **eye_slope_R ≈ ${m.eye_slope_R.toFixed(2)}°**
- **eye_size_mean ≈ ${m.eye_size_mean.toFixed(4)}**
- **eye_asymmetry ≈ ${m.eye_asymmetry.toFixed(4)}**
- **inter_eye_dist ≈ ${m.inter_eye_dist.toFixed(4)}**

### 5) 코
- **nose_length ≈ ${m.nose_length.toFixed(4)}**
- **nose_length / H_face ≈ ${m.nose_length_ratio.toFixed(3)}**
- **nose_width ≈ ${m.nose_width.toFixed(4)}**

### 6) 입
- **mouth_width ≈ ${m.mouth_width.toFixed(4)}**
- **lip_thickness ≈ ${m.lip_thickness.toFixed(4)}**
- **mouth_corner_slope ≈ ${m.mouth_corner_slope.toFixed(2)}°**

### 7) 턱/하관
- **chin_length ≈ ${m.chin_length.toFixed(4)}**
- **jaw_width ≈ ${m.jaw_width.toFixed(4)}**
- **jaw_angle ≈ ${m.jaw_angle.toFixed(1)}°**

### 8) 대칭
- **overall_symmetry ≈ ${(m.overall_symmetry * 100).toFixed(1)}%**

---
*총 ${m.raw_landmarks_count}개 랜드마크 분석 완료*`;
}
/**
 * 메트릭을 RAG 검색용 요약 텍스트로 변환
 */
function summarizeMetricsForSearch(m) {
    const parts = ["관상 분석"];
    // 얼굴형
    if (m.face_ratio_wh < 0.75)
        parts.push("긴 얼굴형");
    else if (m.face_ratio_wh > 0.85)
        parts.push("넓은 얼굴형");
    else
        parts.push("균형 얼굴형");
    // 이마
    if (m.forehead_height_ratio > 0.15)
        parts.push("높은 이마");
    else if (m.forehead_height_ratio < 0.12)
        parts.push("낮은 이마");
    // 눈
    if (m.eye_asymmetry > 0.003)
        parts.push("눈 비대칭");
    if (m.inter_eye_dist > 0.17)
        parts.push("넓은 미간");
    // 입
    if (m.mouth_corner_slope < -3)
        parts.push("처진 입꼬리");
    else if (m.mouth_corner_slope > 3)
        parts.push("올라간 입꼬리");
    // 턱
    if (m.jaw_angle < 65)
        parts.push("각진 턱");
    else if (m.jaw_angle > 75)
        parts.push("둥근 턱");
    parts.push("성격 직업운 재물운 애정운 건강운");
    return parts.join(" ");
}
//# sourceMappingURL=metrics.js.map