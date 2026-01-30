"""
관상 분석 서비스 모듈 (Rule-based)
MediaPipe 468 랜드마크 기반 관상학 분석

rules.md에 정의된 수식을 사용하여 각 부위별 측정값과 해석을 생성합니다.
LLM을 사용하지 않고 순수 알고리즘으로만 동작합니다.
"""

import math
from typing import Dict, List, Any, Optional, Tuple


def dist(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """두 랜드마크 점 사이의 유클리드 거리 계산"""
    dx = p2['x'] - p1['x']
    dy = p2['y'] - p1['y']
    return math.sqrt(dx * dx + dy * dy)


def clamp_gauge_value(value: float, range_min: float, range_max: float) -> float:
    """
    gauge.value를 rangeMin~rangeMax 범위로 클램핑(정규화)
    
    Args:
        value: 원본 측정값
        range_min: 게이지 최소값
        range_max: 게이지 최대값
        
    Returns:
        클램핑된 값
    """
    return max(range_min, min(range_max, value))


def angle_degrees(p1: Dict[str, float], center: Dict[str, float], p2: Dict[str, float]) -> float:
    """세 점으로 각도 계산 (중심점 기준, 도 단위)"""
    v1_x = p1['x'] - center['x']
    v1_y = p1['y'] - center['y']
    v2_x = p2['x'] - center['x']
    v2_y = p2['y'] - center['y']
    
    dot = v1_x * v2_x + v1_y * v2_y
    mag1 = math.sqrt(v1_x * v1_x + v1_y * v1_y)
    mag2 = math.sqrt(v2_x * v2_x + v2_y * v2_y)
    
    if mag1 == 0 or mag2 == 0:
        return 0
    
    cos_angle = max(-1, min(1, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


def get_landmark(landmarks: List[Dict], index: int) -> Optional[Dict[str, float]]:
    """
    인덱스로 랜드마크 좌표 가져오기
    
    주의: 프론트엔드에서 index는 1부터 시작하지만,
    rules.md와 코드에서는 MediaPipe 원본 (0부터 시작)을 사용합니다.
    따라서 index + 1로 검색합니다.
    """
    # 프론트엔드는 index를 1부터 시작하므로 +1 보정
    search_index = index + 1
    
    for lm in landmarks:
        if lm.get('index') == search_index:
            return {'x': lm['x'], 'y': lm['y'], 'z': lm.get('z', 0)}
    
    # 혹시 0부터 시작하는 경우도 대비
    for lm in landmarks:
        if lm.get('index') == index:
            return {'x': lm['x'], 'y': lm['y'], 'z': lm.get('z', 0)}
    
    return None


def get_brow_center(landmarks: List[Dict]) -> Dict[str, float]:
    """눈썹 집합(70~105, 300~336)의 중심점 계산"""
    brow_indices = list(range(70, 106)) + list(range(300, 337))
    points = []
    
    for idx in brow_indices:
        lm = get_landmark(landmarks, idx)
        if lm:
            points.append(lm)
    
    if not points:
        # 폴백: 이마 중앙 추정
        return {'x': 0.5, 'y': 0.3, 'z': 0}
    
    avg_x = sum(p['x'] for p in points) / len(points)
    avg_y = sum(p['y'] for p in points) / len(points)
    avg_z = sum(p['z'] for p in points) / len(points)
    
    return {'x': avg_x, 'y': avg_y, 'z': avg_z}


def get_brow_top(landmarks: List[Dict]) -> Dict[str, float]:
    """
    눈썹의 상단 경계점 계산 (이마 높이 측정용)
    MediaPipe에서 y는 위에서 아래로 증가하므로, 가장 작은 y값이 상단
    """
    brow_indices = list(range(70, 106)) + list(range(300, 337))
    points = []
    
    for idx in brow_indices:
        lm = get_landmark(landmarks, idx)
        if lm:
            points.append(lm)
    
    if not points:
        return {'x': 0.5, 'y': 0.25, 'z': 0}
    
    # 가장 위쪽(y값이 가장 작은) 점 찾기
    top_point = min(points, key=lambda p: p['y'])
    
    # x는 중심값 사용
    avg_x = sum(p['x'] for p in points) / len(points)
    
    return {'x': avg_x, 'y': top_point['y'], 'z': top_point['z']}


def calculate_head_roll(landmarks: List[Dict]) -> float:
    """얼굴 기울어짐(head_roll) 계산"""
    p33 = get_landmark(landmarks, 33)
    p263 = get_landmark(landmarks, 263)
    
    if not p33 or not p263:
        return 0
    
    dy = p263['y'] - p33['y']
    dx = p263['x'] - p33['x']
    roll_rad = math.atan2(dy, dx)
    return math.degrees(roll_rad)


def calculate_face_shape(landmarks: List[Dict]) -> Dict[str, Any]:
    """
    얼굴형(그릇) 분석 — W/H 비율
    
    랜드마크:
    - W_face = dist(35, 265) — 좌/우 얼굴 외곽
    - H_face = dist(10, 152) — 이마 상단 ~ 턱 끝
    """
    p35 = get_landmark(landmarks, 35)
    p265 = get_landmark(landmarks, 265)
    p10 = get_landmark(landmarks, 10)
    p152 = get_landmark(landmarks, 152)
    
    if not all([p35, p265, p10, p152]):
        return _default_face_shape()
    
    w_face = dist(p35, p265)
    h_face = dist(p10, p152)
    
    if h_face == 0:
        return _default_face_shape()
    
    wh_ratio = w_face / h_face
    
    # 해석 기준
    if wh_ratio < 0.70:
        face_type = "세장형"
        core_meaning = "얼굴이 길고 갸름한 형상이오. 이는 내면이 깊고 예민하며 예술적 감성이 뛰어난 자의 상이오. 깊은 사유와 창의성을 가졌으나, 감정의 기복이 있을 수 있으니 마음의 평정을 유지하는 것이 중요하오."
        advice = "예술, 연구, 창작 분야에서 재능을 발휘할 수 있는 상이니, 자신만의 세계를 깊이 탐구하시오."
    elif wh_ratio <= 0.80:
        face_type = "균형형"
        core_meaning = "얼굴의 가로와 세로 비율이 조화롭구려. 이는 안정적인 그릇을 가진 자요. 대인관계와 업무 모두 원만하게 처리하며, 중용의 덕을 갖추어 어느 한쪽으로 치우치지 않는 상이오."
        advice = "균형 잡힌 성품을 살려 다양한 분야에서 조화를 이루며 성공할 수 있소."
    else:
        face_type = "광대형"
        core_meaning = "얼굴이 넓고 당당한 형상이오. 이는 대외활동에 강하고 체력과 그릇이 큰 자의 상이오. 리더십이 돋보이며 사람들을 이끄는 능력이 있으나, 때로는 타인의 의견을 경청하는 자세가 필요하오."
        advice = "조직을 이끌거나 사업을 운영하는 데 적합한 상이니, 리더의 자리에서 능력을 발휘하시오."
    
    # gauge 값 계산 (rules.md 기준: W/H 비율 그대로 사용)
    # W/H 0.60~0.90 범위로 표시
    gauge_min, gauge_max = 0.60, 0.90
    gauge_value = clamp_gauge_value(wh_ratio, gauge_min, gauge_max)
    
    return {
        "measures": {
            "w": f"{w_face:.4f}",
            "h": f"{h_face:.4f}",
            "wh": f"{wh_ratio:.3f}"
        },
        "gauge": {
            "value": round(gauge_value, 3),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "세장형", "min": 0.60, "max": 0.70},
                {"label": "균형형", "min": 0.70, "max": 0.80},
                {"label": "광대형", "min": 0.80, "max": 0.90}
            ]
        },
        "coreMeaning": core_meaning,
        "advice": advice,
        "_type": face_type
    }


def _default_face_shape() -> Dict[str, Any]:
    """기본 얼굴형 데이터"""
    return {
        "measures": {"w": "N/A", "h": "N/A", "wh": "N/A"},
        "gauge": {
            "value": 0.75,
            "rangeMin": 0.60,
            "rangeMax": 0.90,
            "unit": "",
            "segments": [
                {"label": "세장형", "min": 0.60, "max": 0.70},
                {"label": "균형형", "min": 0.70, "max": 0.80},
                {"label": "광대형", "min": 0.80, "max": 0.90}
            ]
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "정면을 바라보고 다시 촬영해 주시오."
    }


def calculate_forehead(landmarks: List[Dict], h_face: float, w_face: float) -> Dict[str, Any]:
    """
    이마(초년운/판단력) 분석
    
    랜드마크:
    - forehead_height = brow_top.y - p10.y (y좌표 차이, 정규화 좌표)
    - forehead_width = dist(109, 338)
    
    MediaPipe 좌표: y는 위에서 아래로 증가
    - p10: 이마 상단 (y값이 작음)
    - brow_top: 눈썹 상단 (y값이 더 큼)
    """
    p10 = get_landmark(landmarks, 10)
    p109 = get_landmark(landmarks, 109)
    p338 = get_landmark(landmarks, 338)
    p152 = get_landmark(landmarks, 152)  # 턱 끝
    brow_top = get_brow_top(landmarks)
    
    if not all([p10, p109, p338, p152]):
        return _default_forehead()
    
    # 이마 높이: 눈썹 상단 y - 이마 상단 y (y좌표 차이)
    forehead_height = brow_top['y'] - p10['y']
    forehead_width = dist(p109, p338)
    
    # 얼굴 전체 높이: 턱 끝 y - 이마 상단 y
    face_height = p152['y'] - p10['y']
    
    # 비율 계산 (y좌표 기반)
    height_ratio = forehead_height / face_height if face_height > 0 else 0
    width_ratio = forehead_width / w_face if w_face > 0 else 0
    
    # 높이 비율 해석
    if height_ratio < 0.28:
        height_type = "낮은 이마"
        height_desc = "이마가 낮은 편이오. 이론보다 실전에 강하며, 생각보다 손이 먼저 움직이는 실행력의 소유자요."
        advice = "젊은 시절 너무 이른 독립은 피하고, 경험을 쌓으며 한 걸음씩 나아가면 큰 성공을 이루리라."
    elif height_ratio <= 0.35:
        height_type = "단정한 이마"
        height_desc = "이마가 반듯하고 단정하구려. 이는 총명하고 학습 능력이 뛰어난 기운을 의미하오. 초년 시절에 부모 복이 있으며, 공부나 기술을 잘 익히는 상이오."
        advice = "젊은 시절부터 계획을 세워 한걸음씩 가야 성공을 이루는 상이오. 차근차근 경험을 쌓으시오."
    else:
        height_type = "높은 이마"
        height_desc = "이마가 넓고 높구려. 이는 지혜가 출중하고 학업이나 기획에 유리한 상이오. 전략적 사고가 돋보이며, 큰 그림을 그릴 줄 아는 자요."
        advice = "학문이나 기획, 전략 분야에서 재능을 발휘할 수 있으니, 장기적인 목표를 세우고 정진하시오."
    
    # 폭 비율 해석
    if width_ratio < 0.85:
        width_type = "좁은 이마"
        width_desc = "한 분야를 깊게 파는 집중형이오."
    elif width_ratio <= 0.95:
        width_type = "균형 이마"
        width_desc = "분석과 실행의 균형을 갖추어 다방면에서 역량을 발휘할 수 있소."
    else:
        width_type = "넓은 이마"
        width_desc = "리더십과 협상력이 강하며 대외 활동에 능한 상이오."
    
    core_meaning = f"{height_desc} {width_desc}"
    
    # gauge 범위 정의 (rules.md 기준: < 0.28 / 0.28~0.35 / > 0.35)
    gauge_min, gauge_max = 0.15, 0.45
    gauge_value = clamp_gauge_value(height_ratio, gauge_min, gauge_max)
    
    return {
        "measures": {
            "height": f"{forehead_height:.4f}",
            "heightRatio": f"{height_ratio:.3f}",
            "width": f"{forehead_width:.4f}",
            "widthRatio": f"{width_ratio:.3f}"
        },
        "gauge": {
            "value": round(gauge_value, 3),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "낮음", "min": 0.15, "max": 0.28},
                {"label": "보통", "min": 0.28, "max": 0.35},
                {"label": "높음", "min": 0.35, "max": 0.45}
            ]
        },
        "coreMeaning": core_meaning,
        "advice": advice
    }


def _default_forehead() -> Dict[str, Any]:
    """기본 이마 데이터"""
    return {
        "measures": {
            "height": "N/A",
            "heightRatio": "N/A",
            "width": "N/A",
            "widthRatio": "N/A"
        },
        "gauge": {
            "value": 0.32,
            "rangeMin": 0.15,
            "rangeMax": 0.45,
            "unit": "",
            "segments": [
                {"label": "낮음", "min": 0.15, "max": 0.28},
                {"label": "보통", "min": 0.28, "max": 0.35},
                {"label": "높음", "min": 0.35, "max": 0.45}
            ]
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "이마가 잘 보이도록 머리카락을 정리하고 다시 촬영해 주시오."
    }


def calculate_eyes(landmarks: List[Dict], w_face: float) -> Dict[str, Any]:
    """
    눈(성격/직업운/대인관계) 분석
    
    랜드마크:
    - 좌측 눈: 33(외안각), 133(내안각), 159(상 눈꺼풀), 145(하 눈꺼풀)
    - 우측 눈: 263(외안각), 362(내안각), 386(상 눈꺼풀), 374(하 눈꺼풀)
    - inter_eye_dist = dist(133, 362)
    """
    # 좌측 눈
    p33 = get_landmark(landmarks, 33)
    p133 = get_landmark(landmarks, 133)
    p159 = get_landmark(landmarks, 159)
    p145 = get_landmark(landmarks, 145)
    
    # 우측 눈
    p263 = get_landmark(landmarks, 263)
    p362 = get_landmark(landmarks, 362)
    p386 = get_landmark(landmarks, 386)
    p374 = get_landmark(landmarks, 374)
    
    if not all([p159, p145, p386, p374, p133, p362]):
        return _default_eyes()
    
    # 눈 개방도
    eye_open_l = dist(p159, p145)
    eye_open_r = dist(p386, p374)
    
    # 비대칭
    asymmetry = abs(eye_open_l - eye_open_r)
    
    # 미간 거리
    inter_eye_dist = dist(p133, p362)
    width_ratio = inter_eye_dist / w_face if w_face > 0 else 0
    
    # 전체 대칭도 계산
    symmetry = calculate_overall_symmetry(landmarks)
    
    # 개방도 해석
    avg_open = (eye_open_l + eye_open_r) / 2
    if avg_open < 0.025:
        open_type = "가는 눈"
        open_desc = "눈매가 가늘고 시선이 곳으며 흐트러짐이 없구려. 이는 냉정한 판단력과 집중력을 가진 자요. 감정보다 이성적으로 생각하며 분석적 사고에 강하고 추진력 있는 스타일이오."
        advice = "리더보다는 참모형, 분석가, 전략가 등의 직업에 잘 맞는 인재요. 단, 타인과 쉽게 어울리기보다 선별적으로 인간관계를 맺는 성향이 강하니, 오해를 살 수 있으니 조심하시오."
    elif avg_open <= 0.04:
        open_type = "균형 눈"
        open_desc = "눈의 크기가 적당하고 좌우 균형이 잘 맞구려. 이는 안정된 감정과 원만한 대인관계를 가진 자의 상이오. 감정의 기복이 적고 일관된 태도를 유지하여 신뢰를 얻는 상이오."
        advice = "다양한 분야에서 조화롭게 활동할 수 있으니, 인간관계를 넓히고 여러 사람들과 교류하면 더 큰 복이 오리라."
    else:
        open_type = "큰 눈"
        open_desc = "눈매가 크고 시선이 맑구려. 이는 표현력이 풍부하고 감수성이 예민한 자의 상이오. 예술적 기질이 있으며 사람들에게 호감을 주는 인상을 가졌소."
        advice = "창작, 예술, 서비스 분야에서 재능을 발휘할 수 있으니, 감성을 살릴 수 있는 일을 찾으시오."
    
    # 비대칭 해석
    if asymmetry < 0.01:
        asym_type = "균형형"
        asym_desc = "좌우 눈의 균형이 잘 맞으니 감정이 안정되고 일관된 성향을 지녔소."
    elif asymmetry <= 0.02:
        asym_type = "약간 차이"
        asym_desc = "좌우 눈에 약간의 차이가 있으니 감정 변동이 있을 수 있소."
    else:
        asym_type = "비대칭"
        asym_desc = "좌우 눈의 차이가 두드러지니 내면의 고민이나 감정 기복이 있을 수 있소."
    
    # 미간 거리 해석
    if width_ratio < 0.28:
        inter_type = "집중형"
        inter_desc = "미간이 좁아 집중력이 높으나 시야가 좁을 수 있소."
    elif width_ratio <= 0.35:
        inter_type = "균형형"
        inter_desc = "미간 거리가 적당하여 오래가는 관계를 맺을 수 있소."
    else:
        inter_type = "포용형"
        inter_desc = "미간이 넓어 포용력이 크나 우유부단할 가능성이 있소."
    
    core_meaning = f"{open_desc} {asym_desc}"
    
    # gauge 범위 정의 (rules.md 기준: <0.01 균형, 0.01~0.02 약간 차이, >0.02 비대칭)
    gauge_min, gauge_max = 0, 0.03
    gauge_value = clamp_gauge_value(asymmetry, gauge_min, gauge_max)
    
    return {
        "measures": {
            "openL": f"{eye_open_l:.4f}",
            "openR": f"{eye_open_r:.4f}",
            "asymmetry": f"{asymmetry:.4f}",
            "asymmetryCriteria": asym_type,
            "interDist": f"{inter_eye_dist:.4f}",
            "widthRatio": f"{width_ratio:.3f}",
            "symmetry": f"{symmetry:.1f}%"
        },
        "gauge": {
            "value": round(gauge_value, 4),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "균형", "min": 0, "max": 0.01},
                {"label": "약간 차이", "min": 0.01, "max": 0.02},
                {"label": "비대칭", "min": 0.02, "max": 0.03}
            ]
        },
        "coreMeaning": core_meaning,
        "advice": advice
    }


def _default_eyes() -> Dict[str, Any]:
    """기본 눈 데이터"""
    return {
        "measures": {
            "openL": "N/A",
            "openR": "N/A",
            "asymmetry": "N/A",
            "asymmetryCriteria": "N/A",
            "interDist": "N/A",
            "widthRatio": "N/A",
            "symmetry": "N/A"
        },
        "gauge": {
            "value": 0.005,
            "rangeMin": 0,
            "rangeMax": 0.03,
            "unit": "",
            "segments": [
                {"label": "균형", "min": 0, "max": 0.01},
                {"label": "약간 차이", "min": 0.01, "max": 0.02},
                {"label": "비대칭", "min": 0.02, "max": 0.03}
            ]
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "눈이 잘 보이도록 정면을 바라보고 다시 촬영해 주시오."
    }


def calculate_nose(landmarks: List[Dict], h_face: float) -> Dict[str, Any]:
    """
    코(재물운/현실감) 분석
    
    랜드마크:
    - nose_length = dist(168, 4) — 미간 ~ 코끝
    - nose_width = dist(48, 278) — 좌/우 콧볼
    """
    p168 = get_landmark(landmarks, 168)
    p4 = get_landmark(landmarks, 4)
    p48 = get_landmark(landmarks, 48)
    p278 = get_landmark(landmarks, 278)
    
    if not all([p168, p4, p48, p278]):
        return _default_nose()
    
    nose_length = dist(p168, p4)
    nose_width = dist(p48, p278)
    
    length_ratio = nose_length / h_face if h_face > 0 else 0
    
    # 길이 비율 해석
    if length_ratio < 0.22:
        length_type = "짧은 코"
        core_meaning = "코가 짧은 편이오. 순발력이 뛰어나 단기 수익에 유리한 상이오. 즉흥적인 판단으로 기회를 잡는 능력이 있으나, 장기적 계획에는 주의가 필요하오."
        advice = "단기적 성과를 내는 일에 강하니, 빠른 판단이 필요한 분야에서 능력을 발휘하시오. 단, 저축과 장기 투자도 병행하면 더욱 좋으리라."
    elif length_ratio <= 0.28:
        length_type = "균형 코"
        core_meaning = "코가 반듯하고 콧망울이 단단하며 좌우 균형이 맞소. 이는 재물운이 따르는 상이오. 스스로 돈을 벌 줄 아는 자질이 있으며, 특히 중년 이후에 금전운이 트일 가능성이 크오."
        advice = "재물 쌓이는 형국이니, 재테크나 자산관리에도 소질이 있소. 꾼준히 저축하고 분산 투자하면 큰 부를 쌓으리라."
    else:
        length_type = "긴 코"
        core_meaning = "코가 길고 우뜻한 형상이오. 이는 장기 투자형으로 인내로 큰 재물을 모으는 상이오. 신중한 판단으로 큰 결실을 맺으나, 고집이 세지면 타인의 조언을 늦게 듣는 경향이 있으니 주의하시오."
        advice = "장기적인 목표를 세우고 꾼준히 노력하면 큰 성공을 거두리라. 단, 타인의 의견에도 귀 기울이면 더욱 좋으리다."
    
    # gauge 범위 정의 (rules.md 기준: < 0.22 / 0.22~0.28 / > 0.28)
    gauge_min, gauge_max = 0.15, 0.35
    gauge_value = clamp_gauge_value(length_ratio, gauge_min, gauge_max)
    
    return {
        "measures": {
            "length": f"{nose_length:.4f}",
            "lengthRatio": f"{length_ratio:.3f}",
            "width": f"{nose_width:.4f}",
            "lengthCriteria": length_type
        },
        "gauge": {
            "value": round(gauge_value, 3),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "짧음", "min": 0.15, "max": 0.22},
                {"label": "보통", "min": 0.22, "max": 0.28},
                {"label": "김", "min": 0.28, "max": 0.35}
            ]
        },
        "coreMeaning": core_meaning,
        "advice": advice
    }


def _default_nose() -> Dict[str, Any]:
    """기본 코 데이터"""
    return {
        "measures": {
            "length": "N/A",
            "lengthRatio": "N/A",
            "width": "N/A",
            "lengthCriteria": "N/A"
        },
        "gauge": {
            "value": 0.25,
            "rangeMin": 0.15,
            "rangeMax": 0.35,
            "unit": "",
            "segments": [
                {"label": "짧음", "min": 0.15, "max": 0.22},
                {"label": "보통", "min": 0.22, "max": 0.28},
                {"label": "김", "min": 0.28, "max": 0.35}
            ]
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "코가 잘 보이도록 정면을 바라보고 다시 촬영해 주시오."
    }


def calculate_mouth(landmarks: List[Dict]) -> Dict[str, Any]:
    """
    입(말·신뢰·애정운) 분석
    
    랜드마크:
    - mouth_width = dist(61, 291) — 좌/우 입꼬리
    - lip_thickness = dist(13, 14) — 상순/하순 중앙
    - mouth_corner_slope = atan2(y291-y61, x291-x61)
    """
    p61 = get_landmark(landmarks, 61)
    p291 = get_landmark(landmarks, 291)
    p13 = get_landmark(landmarks, 13)
    p14 = get_landmark(landmarks, 14)
    
    if not all([p61, p291, p13, p14]):
        return _default_mouth()
    
    mouth_width = dist(p61, p291)
    lip_thickness = dist(p13, p14)
    
    # 입꼬리 기울기 (도 단위)
    # MediaPipe 좌표: x는 왼쪽→오른쪽 증가, y는 위→아래 증가
    # p61은 왼쪽 입꼬리, p291은 오른쪽 입꼬리
    # 입꼬리가 올라감 = 오른쪽이 왼쪽보다 y가 작음 (화면에서 위쪽)
    dy = p291['y'] - p61['y']  # 양수면 오른쪽이 아래, 음수면 오른쪽이 위
    dx = p291['x'] - p61['x']  # 보통 양수 (오른쪽이 더 오른쪽)
    
    # atan2는 라디안 반환, 0도=수평, 양수=하향, 음수=상향
    raw_slope = math.degrees(math.atan2(dy, dx))
    
    # 보정: raw_slope가 90도 이상이면 좌표가 뒤바뀐 것
    if abs(raw_slope) > 45:
        # 잘못된 좌표 순서 보정 (좌우 반전된 경우)
        raw_slope = math.degrees(math.atan2(-dy, abs(dx)))
    
    corner_slope = raw_slope
    
    # 입꼬리 방향 해석
    # MediaPipe 좌표: y는 아래로 갈수록 커짐
    # corner_slope > 0 이면 오른쪽이 아래 = 입꼬리 내려감 (하향)
    # corner_slope < 0 이면 오른쪽이 위 = 입꼬리 올라감 (상향)
    # rules.md: 상향(+3°↑) = 밝은 인상, 하향(-3°↓) = 진중한 인상
    # 따라서 corner_slope의 부호를 반전하여 사용자 직관과 맞춤
    display_slope = -corner_slope  # 부호 반전: 양수=상향, 음수=하향
    
    if display_slope > 3:
        corner_type = "상향"
        corner_desc = "입꼬리가 올라간 형상이오. 이는 밝은 인상을 주며 인덕운이 좋은 상이오. 첫인상에서 호감을 주며 낙천적인 성품을 가졌소."
        advice = "사람들과 어울리는 일에 적합하니, 서비스나 영업, 대인관계가 중요한 분야에서 능력을 발휘하시오."
    elif display_slope >= -3:
        corner_type = "수평"
        corner_desc = "입이 크고 입술이 평형을 이루며 두께도 적당하오. 이는 말에 무게가 있으며, 신뢰를 주는 언변을 가진 자요. 첫인상이 무난하고 신뢰감을 주는 상이오."
        advice = "진지한 관계에 강하지만, 표현력은 더 키워야 애정운이 더 활짝 피리라. 자신의 감정을 자주 표현하는 것이 중요하오."
    else:
        corner_type = "하향"
        corner_desc = "입꼬리가 내려간 형상이오. 이는 진중한 인상을 주며 엄격해 보일 수 있소. 첫인상에서 손해를 볼 수 있으니, 의식적으로 밝은 표정을 지으면 좋겠소."
        advice = "의식적으로 미소를 지으면 인상이 환하게 바뀔 것이오. 진지한 모습이 오히려 신뢰를 줄 수도 있으니 자신감을 가지시오."
    
    # 입술 두께 해석
    if lip_thickness < 0.02:
        lip_type = "얇음"
        lip_desc = "입술이 얇은 편이오. 말을 아끼는 상으로 논리적이나 차가워 보일 수 있소."
    elif lip_thickness <= 0.035:
        lip_type = "중간"
        lip_desc = "입술 두께가 적당하오. 적절한 표현력으로 신뢰 형성에 유리한 상이오."
    else:
        lip_type = "두꺼움"
        lip_desc = "입술이 두꺼운 편이오. 정이 많고 표현이 풍부하며 애정운이 좋은 상이오."
    
    core_meaning = f"{corner_desc} {lip_desc}"
    
    # gauge 범위 정의 (display_slope 사용: 양수=상향, 음수=하향)
    gauge_min, gauge_max = -10, 10
    gauge_value = clamp_gauge_value(display_slope, gauge_min, gauge_max)
    
    return {
        "measures": {
            "width": f"{mouth_width:.4f}",
            "lipThickness": f"{lip_thickness:.4f}",
            "cornerSlope": f"{display_slope:.2f}",
            "cornerCriteria": corner_type
        },
        "gauge": {
            "value": round(gauge_value, 2),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "°",
            "segments": [
                {"label": "내려감", "min": -10, "max": -3},
                {"label": "보통", "min": -3, "max": 3},
                {"label": "올라감", "min": 3, "max": 10}
            ]
        },
        "coreMeaning": core_meaning,
        "advice": advice
    }


def _default_mouth() -> Dict[str, Any]:
    """기본 입 데이터"""
    return {
        "measures": {
            "width": "N/A",
            "lipThickness": "N/A",
            "cornerSlope": "N/A",
            "cornerCriteria": "N/A"
        },
        "gauge": {
            "value": 0,
            "rangeMin": -10,
            "rangeMax": 10,
            "unit": "°",
            "segments": [
                {"label": "내려감", "min": -10, "max": -3},
                {"label": "보통", "min": -3, "max": 3},
                {"label": "올라감", "min": 3, "max": 10}
            ]
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "입이 잘 보이도록 정면을 바라보고 다시 촬영해 주시오."
    }


def calculate_chin(landmarks: List[Dict]) -> Dict[str, Any]:
    """
    턱/하관(지구력·노년운) 분석
    
    랜드마크:
    - jaw_width = dist(148, 377) — 좌/우 턱
    - jaw_angle = angle(148-152-377) — 턱 각도
    - chin_length = dist(14, 152) — 입 ~ 턱끝
    """
    p148 = get_landmark(landmarks, 148)
    p377 = get_landmark(landmarks, 377)
    p152 = get_landmark(landmarks, 152)
    p14 = get_landmark(landmarks, 14)
    
    if not all([p148, p377, p152, p14]):
        return _default_chin()
    
    jaw_width = dist(p148, p377)
    chin_length = dist(p14, p152)
    jaw_angle = angle_degrees(p148, p152, p377)
    
    # 턱 각도 해석 (rules.md 기준: 65° 미만=각진, 65-75°=완만, 75° 초과=둥근)
    if jaw_angle < 65:
        angle_type = "각진 턱"
        angle_desc = "턱선이 각지고 단정한 형상이오. 이는 의지력과 끈기가 강한 자의 상이오. 밀어붙이는 추진력이 뛰어나나, 고집이 세질 수 있으니 주의하시오."
        advice = "꾸준함이 무기요. 시간이 지날수록 신망이 쌓이는 상이니 중도 포기만 피하시오. 타인의 의견에도 귀 기울이면 더욱 좋으리라."
    elif jaw_angle <= 75:
        angle_type = "완만한 턱"
        angle_desc = "턱선이 단정하고 좌우 밸런스가 좋으며 각이 너무 날카롭지 않구려. 이는 인내심 있고 자기 관리가 철저한 자의 상이오. 말년에 외롭지 않고, 꾸준히 자신의 삶을 책임질 수 있는 운이 들어있소."
        advice = "꾸준함이 무기요. 시간이 지날수록 신망이 쌓이는 상이니 중도 포기만 피하시오."
    else:
        angle_type = "둥근 턱"
        angle_desc = "턱선이 부드럽고 둥근 형상이오. 이는 포용력과 완충 능력이 뛰어난 상이오. 중재자 역할에 복이 있으나, 결단이 늦어질 수 있으니 주의하시오. 말년이 편안한 상이오."
        advice = "사람들 사이에서 중재 역할을 하면 복이 따르리라. 단, 중요한 일에는 결단력을 키우는 노력이 필요하오."
    
    # 턱 폭 해석
    if jaw_width < 0.25:
        width_type = "예리형"
        width_desc = "섬세하고 예민한 성품으로 예술적 감각이 있소."
    elif jaw_width <= 0.35:
        width_type = "안정형"
        width_desc = "균형 잡힌 의지력과 지구력을 갖추었소."
    else:
        width_type = "광대형"
        width_desc = "강한 체력과 지구력으로 조직 장악력이 있소."
    
    core_meaning = f"{angle_desc} {width_desc}"
    
    # gauge 범위 정의 (rules.md 기준: 55~85도 범위)
    gauge_min, gauge_max = 55, 85
    gauge_value = clamp_gauge_value(jaw_angle, gauge_min, gauge_max)
    
    return {
        "measures": {
            "length": f"{chin_length:.4f}",
            "width": f"{jaw_width:.4f}",
            "angle": f"{jaw_angle:.2f}",
            "angleCriteria": angle_type
        },
        "gauge": {
            "value": round(gauge_value, 2),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "°",
            "segments": [
                {"label": "각진", "min": 55, "max": 65},
                {"label": "보통", "min": 65, "max": 75},
                {"label": "둥근편", "min": 75, "max": 85}
            ]
        },
        "coreMeaning": core_meaning,
        "advice": advice
    }


def _default_chin() -> Dict[str, Any]:
    """기본 턱 데이터"""
    return {
        "measures": {
            "length": "N/A",
            "width": "N/A",
            "angle": "N/A",
            "angleCriteria": "N/A"
        },
        "gauge": {
            "value": 70,
            "rangeMin": 55,
            "rangeMax": 85,
            "unit": "°",
            "segments": [
                {"label": "각진", "min": 55, "max": 65},
                {"label": "보통", "min": 65, "max": 75},
                {"label": "둥근편", "min": 75, "max": 85}
            ]
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "턱이 잘 보이도록 정면을 바라보고 다시 촬영해 주시오."
    }


def calculate_overall_symmetry(landmarks: List[Dict]) -> float:
    """
    전체 대칭도 계산
    
    좌우 대응 점 쌍에서 |left_x - (1 - right_x)|의 평균 오차를 계산
    대칭도(%) = (1 - 평균오차) × 100
    """
    # 좌우 대응 점 쌍
    pairs = [
        (33, 263),   # 외안각
        (133, 362),  # 내안각
        (159, 386),  # 상 눈꺼풀
        (145, 374),  # 하 눈꺼풀
        (35, 265),   # 얼굴 외곽
        (61, 291),   # 입꼬리
        (48, 278),   # 콧볼
        (148, 377),  # 턱
    ]
    
    errors = []
    for left_idx, right_idx in pairs:
        left = get_landmark(landmarks, left_idx)
        right = get_landmark(landmarks, right_idx)
        
        if left and right:
            # x 좌표 비대칭 계산 (1 - right_x는 좌우 반전)
            error = abs(left['x'] - (1 - right['x']))
            errors.append(error)
    
    if not errors:
        return 90.0  # 기본값
    
    avg_error = sum(errors) / len(errors)
    symmetry = (1 - avg_error) * 100
    
    return max(0, min(100, symmetry))


def analyze_face(landmarks: List[Dict]) -> Dict[str, Any]:
    """
    전체 관상 분석 수행
    
    Args:
        landmarks: MediaPipe 468 랜드마크 배열
        
    Returns:
        관상 분석 결과 딕셔너리
    """
    # 기본 측정값 계산
    p35 = get_landmark(landmarks, 35)
    p265 = get_landmark(landmarks, 265)
    p10 = get_landmark(landmarks, 10)
    p152 = get_landmark(landmarks, 152)
    
    w_face = dist(p35, p265) if p35 and p265 else 0.3
    h_face = dist(p10, p152) if p10 and p152 else 0.5
    
    # 품질 체크
    head_roll = calculate_head_roll(landmarks)
    
    # 각 부위 분석
    face_shape = calculate_face_shape(landmarks)
    forehead = calculate_forehead(landmarks, h_face, w_face)
    eyes = calculate_eyes(landmarks, w_face)
    nose = calculate_nose(landmarks, h_face)
    mouth = calculate_mouth(landmarks)
    chin = calculate_chin(landmarks)
    
    # _type 필드 제거 (내부용)
    if '_type' in face_shape:
        del face_shape['_type']
    
    return {
        "faceShape": face_shape,
        "forehead": forehead,
        "eyes": eyes,
        "nose": nose,
        "mouth": mouth,
        "chin": chin,
        "_meta": {
            "headRoll": round(head_roll, 2),
            "qualityNote": get_quality_note(head_roll),
            "symmetry": round(calculate_overall_symmetry(landmarks), 1)
        }
    }


def get_quality_note(head_roll: float) -> str:
    """품질 노트 생성"""
    abs_roll = abs(head_roll)
    if abs_roll <= 5:
        return "신뢰도 높음"
    elif abs_roll <= 10:
        return "사용 가능"
    else:
        return "얼굴이 기울어져 있어 비율·거리 중심 분석 권장"
