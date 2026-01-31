"""
관상 분석 서비스 모듈 (Rule-based)
MediaPipe 468 랜드마크 기반 관상학 분석

rules.md에 정의된 수식을 사용하여 각 부위별 측정값과 해석을 생성합니다.
LLM을 사용하지 않고 순수 알고리즘으로만 동작합니다.
"""

import math
from typing import Dict, List, Any, Optional, Tuple


def dist(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """두 랜드마크 점 사이의 유클리드 거리 계산 (x, y만 사용 — 비율/거리 계산용)"""
    dx = p2['x'] - p1['x']
    dy = p2['y'] - p1['y']
    return math.sqrt(dx * dx + dy * dy)


def dist3(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """두 랜드마크 점 사이의 3D 유클리드 거리 (pitch 각도 추정용)"""
    dx = p2['x'] - p1['x']
    dy = p2['y'] - p1['y']
    dz = p2.get('z', 0) - p1.get('z', 0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)


# pitch 보정 시 사용할 각도 상한 (이 이상은 같은 보정량 유지 — 수치 안정성)
PITCH_CAP_DEG = 65.0


def estimate_pitch_degrees(landmarks: List[Dict]) -> float:
    """
    pitch(고개 숙임) 각도 추정 [도 단위].
    V_face = normalize(landmark[152] - landmark[9]), V_down = (0, 1, 0),
    theta = arccos(dot(V_face, V_down)).
    theta ≈ 0 → 정면, theta 증가 → 고개 숙임.
    """
    p9 = get_landmark(landmarks, 9)   # 미간
    p152 = get_landmark(landmarks, 152)  # 턱 끝
    if not p9 or not p152:
        return 0.0
    vx = p152['x'] - p9['x']
    vy = p152['y'] - p9['y']
    vz = p152.get('z', 0) - p9.get('z', 0)
    mag = math.sqrt(vx * vx + vy * vy + vz * vz)
    if mag <= 1e-9:
        return 0.0
    # V_down = (0, 1, 0) → dot(V_face, V_down) = vy / mag
    cos_theta = max(-1.0, min(1.0, vy / mag))
    return math.degrees(math.acos(cos_theta))


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


# 오형(五行) 라벨 및 해석 (얼굴형)
_OSHAPE_LABELS = ("목형", "화형", "토형", "금형", "수형")
_OSHAPE_MEANINGS = {
    "목형": (
        "목형(木形) 세로 성장형이오. 세로 우세하고 위·아래 균형이 맞으며 각보다 흐름이 있구려. "
        "내면이 깊고 예민하며 예술적 감성이 뛰어난 자의 상이오."
        ,
        "예술, 연구, 창작 분야에서 재능을 발휘할 수 있으니 자신만의 세계를 깊이 탐구하시오.",
    ),
    "화형": (
        "화형(火形) 상부 확장형이오. 위가 크고 아래가 약한 역삼각에 가깝구려. "
        "이마·상안이 발달하고 턱이 좁아 지적이고 활발한 인상이오."
        ,
        "아이디어와 기획력이 강점이니 실행과 마무리에도 신경 쓰면 큰 성과가 있으리라.",
    ),
    "토형": (
        "토형(土形) 중심 안정형이오. 가로·세로가 유사하고 하안이 안정된 둥근 형상이오. "
        "현실 중심이고 포용력이 있으며 꾸준한 자의 상이오."
        ,
        "중용의 덕을 살려 다양한 분야에서 조화를 이루며 성공할 수 있소.",
    ),
    "금형": (
        "금형(金形) 각진 골격형이오. 광대가 우세하고 하안은 받치되 각이 살아 있구려. "
        "리더십과 대외 활동에 강한 상이오."
        ,
        "조직을 이끌거나 사업을 운영하는 데 적합하니 리더의 자리에서 능력을 발휘하시오.",
    ),
    "수형": (
        "수형(水形) 가로 확산형이오. 얼굴 폭이 크고 하안이 안정되어 전체적으로 퍼진 인상이오. "
        "포용력과 지구력이 있으며 말년이 편한 상이오."
        ,
        "사람을 모으고 책임을 지는 구조에 복이 있으니 중재와 운영에 힘쓰시오.",
    ),
}


def _count_mok(r_lw: float, r_um: float, r_wj: float) -> int:
    """목형: R_LW≥1.30, 0.90≤R_UM≤1.05, 0.95≤R_WJ≤1.05 중 2개 이상."""
    c = 0
    if r_lw >= 1.30:
        c += 1
    if 0.90 <= r_um <= 1.05:
        c += 1
    if 0.95 <= r_wj <= 1.05:
        c += 1
    return c


def _count_hwa(r_lw: float, r_um: float, r_wj: float) -> int:
    """화형: 상안 과다(R_UM>1.10) 포함 + 총 2개 이상."""
    if r_um <= 1.10:
        return 0
    c = 1  # 상안 과다
    if r_wj >= 1.15:
        c += 1
    if r_lw >= 1.25:
        c += 1
    return c if c >= 2 else 0


def _count_to(r_lw: float, r_um: float, r_wj: float) -> int:
    """토형: 0.95≤R_LW≤1.10, R_WJ≤0.95, R_UM<0.90 중 2개 이상."""
    c = 0
    if 0.95 <= r_lw <= 1.10:
        c += 1
    if r_wj <= 0.95:
        c += 1
    if r_um < 0.90:
        c += 1
    return c


def _count_geum(r_lw: float, r_um: float, r_wj: float) -> int:
    """금형: 광대 과다(R_WJ≥1.20) 포함 + 총 2개 이상. J/W≤0.85 → R_WJ≥1/0.85."""
    if r_wj < 1.20:
        return 0
    c = 1
    if 1.15 <= r_lw <= 1.30:
        c += 1
    if r_wj >= (1.0 / 0.85):  # J/W ≤ 0.85
        c += 1
    return c if c >= 2 else 0


def _count_su(r_lw: float, r_um: float, r_wj: float) -> int:
    """수형: R_LW≤0.95, R_WJ≤0.90, R_UM≤0.85 중 2개 이상."""
    c = 0
    if r_lw <= 0.95:
        c += 1
    if r_wj <= 0.90:
        c += 1
    if r_um <= 0.85:
        c += 1
    return c


def calculate_face_shape(landmarks: List[Dict]) -> Dict[str, Any]:
    """
    얼굴형(그릇) 분석 — pitch 보정 후 오형(목·화·토·금·수) 5분류.

    비율만 사용: L,W,J,U,M → R_LW, R_UM, R_WJ. 각 오형은 3개 feature 중 2개 이상
    충족 시 카운트. 최고 점수 타입 1개 또는 동점이면 "목형&화형" 형태로 반환.
    """
    theta = estimate_pitch_degrees(landmarks)
    theta_cap = min(theta, PITCH_CAP_DEG)

    p10 = get_landmark(landmarks, 10)
    p152 = get_landmark(landmarks, 152)
    p9 = get_landmark(landmarks, 9)
    p94 = get_landmark(landmarks, 94)
    p234 = get_landmark(landmarks, 234)
    p454 = get_landmark(landmarks, 454)
    p172 = get_landmark(landmarks, 172)
    p397 = get_landmark(landmarks, 397)

    if not all([p10, p152, p9, p94, p234, p454, p172, p397]):
        return _default_face_shape()

    L = dist(p10, p152)
    W = dist(p234, p454)
    J = dist(p172, p397)
    U = dist(p10, p9)
    M = dist(p9, p94)

    if W <= 0 or M <= 0:
        return _default_face_shape()

    scale = 0.5 + 0.2 * (theta_cap / PITCH_CAP_DEG)
    theta_rad = math.radians(theta_cap * scale)
    cos_val = max(0.15, math.cos(theta_rad))
    L_adj = L / cos_val

    R_LW = L_adj / W
    R_UM = U / M
    R_WJ = W / J

    scores = {
        "목형": _count_mok(R_LW, R_UM, R_WJ),
        "화형": _count_hwa(R_LW, R_UM, R_WJ),
        "토형": _count_to(R_LW, R_UM, R_WJ),
        "금형": _count_geum(R_LW, R_UM, R_WJ),
        "수형": _count_su(R_LW, R_UM, R_WJ),
    }
    max_score = max(scores.values())
    winners = [name for name in _OSHAPE_LABELS if scores[name] == max_score]
    face_type = "&".join(winners)

    if len(winners) == 1:
        core_meaning, advice = _OSHAPE_MEANINGS[winners[0]]
    else:
        core_meaning = (
            "관상에서 얼굴형(그릇)은 타고난 활동 범위와 리더십·대외적 성향을 나타냅니다. "
            f"여러 오형의 특징이 고르게 드러나는 상이오 ({face_type})."
        )
        advice = "균형 잡힌 성품을 살려 다양한 분야에서 조화를 이루며 성공할 수 있소."

    gauge_min, gauge_max = 0.85, 1.45
    gauge_value = clamp_gauge_value(R_LW, gauge_min, gauge_max)

    return {
        "measures": {
            "L": f"{L:.4f}",
            "W": f"{W:.4f}",
            "J": f"{J:.4f}",
            "U": f"{U:.4f}",
            "M": f"{M:.4f}",
            "R_LW": f"{R_LW:.3f}",
            "R_UM": f"{R_UM:.3f}",
            "R_WJ": f"{R_WJ:.3f}",
            "wh": f"{R_LW:.3f}",
            "pitch_deg": f"{theta:.1f}",
        },
        "gauge": {
            "value": round(gauge_value, 3),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "목형", "min": 1.30, "max": 1.45},
                {"label": "화형", "min": 1.25, "max": 1.30},
                {"label": "토형", "min": 0.95, "max": 1.10},
                {"label": "금형", "min": 1.15, "max": 1.30},
                {"label": "수형", "min": 0.85, "max": 0.95},
            ],
        },
        "coreMeaning": core_meaning,
        "advice": advice,
        "_type": face_type,
    }


def _default_face_shape(reason: Optional[str] = None) -> Dict[str, Any]:
    """기본 얼굴형 데이터 (랜드마크 부족 시에만 사용)"""
    core_meaning = "랜드마크 데이터가 부족하여 분석할 수 없습니다."
    advice = "정면을 바라보고 다시 촬영해 주시오."

    return {
        "measures": {"L": "N/A", "W": "N/A", "J": "N/A", "R_LW": "N/A", "R_UM": "N/A", "R_WJ": "N/A"},
        "gauge": {
            "value": 1.10,
            "rangeMin": 0.85,
            "rangeMax": 1.45,
            "unit": "",
            "segments": [
                {"label": "목형", "min": 1.30, "max": 1.45},
                {"label": "화형", "min": 1.25, "max": 1.30},
                {"label": "토형", "min": 0.95, "max": 1.10},
                {"label": "금형", "min": 1.15, "max": 1.30},
                {"label": "수형", "min": 0.85, "max": 0.95},
            ],
        },
        "coreMeaning": core_meaning,
        "advice": advice,
    }


def calculate_forehead(landmarks: List[Dict], h_face: float, w_face: float) -> Dict[str, Any]:
    """
    이마(초년운/판단력) 분석 — 세로 비중 분포, 폭, 좌우 비대칭.

    1) 세로 비중: U1(10→8), U2(8→107), U3(107→9) → R_F1, R_F2, R_F3 (사고 초점)
    2) 이마 폭: F_width = dist(103, 332), R_FW = F_width / W (사고 확장성 vs 집중성)
    3) 좌우 비대칭: Left/Right height(10→103, 10→332) 차이 / U_total (사고 편향)
    """
    # F_top=10, F_mid1=8, F_mid2=107, F_base=9 / F_left=103, F_right=332
    p10 = get_landmark(landmarks, 10)
    p8 = get_landmark(landmarks, 8)
    p107 = get_landmark(landmarks, 107)
    p9 = get_landmark(landmarks, 9)
    p103 = get_landmark(landmarks, 103)
    p332 = get_landmark(landmarks, 332)

    if not all([p10, p8, p107, p9, p103, p332]) or w_face <= 0:
        return _default_forehead()

    # 1) 이마 세로 비중 분포
    U1 = dist(p10, p8)      # 상부 이마
    U2 = dist(p8, p107)     # 중앙 이마
    U3 = dist(p107, p9)     # 하부 이마
    U_total = U1 + U2 + U3
    if U_total <= 0:
        return _default_forehead()

    R_F1 = U1 / U_total
    R_F2 = U2 / U_total
    R_F3 = U3 / U_total

    # 어떤 구간이 두드러지는지 (최대 비중)
    which_dominant = max(
        [("상부", R_F1), ("중앙", R_F2), ("하부", R_F3)],
        key=lambda x: x[1],
    )[0]

    if which_dominant == "상부":
        focus_desc = (
            "이마 상부의 비중이 두드러져, 눈앞의 현실보다는 개념과 이상을 먼저 그리는 사고 경향이 보이오. "
            "사물의 본질과 큰 흐름을 읽는 데 강하며, 생각이 충분히 무르익은 뒤에야 행동으로 옮기는 편이오. "
            "비전·철학·방향성을 중시하는 사고 구조라 할 수 있소."
        )
        advice_focus = (
            "큰 그림을 세우는 능력은 이미 갖추었으니, "
            "이제는 생각을 실행으로 옮길 중간 단계(계획·일정·마감)를 의도적으로 만들어 보시오. "
            "현실적 파트너나 보조 수단을 곁들이면 공상으로 끝나지 않고 성과로 이어질 것이오."
        )
    elif which_dominant == "중앙":
        focus_desc = (
            "이마 중앙부의 비중이 커, 생각을 체계적으로 정리한 뒤 움직이는 사고 경향이 뚜렷하오. "
            "즉흥보다는 준비를 중시하며, 장기적인 흐름 속에서 현재의 선택을 위치시키는 데 능한 상이오. "
            "사고의 안정성과 지속성이 강점이라 할 수 있소."
        )
        advice_focus = (
            "기획·전략·관리처럼 흐름을 설계하는 역할에서 재능을 발휘할 것이오. "
            "다만 준비에만 머물러 기회를 놓칠 수 있으니, "
            '"80% 준비되면 실행"이라는 기준을 세워 속도를 조절하면 좋겠소.'
        )
    else:
        focus_desc = (
            "이마 하부의 비중이 커, 상황을 빠르게 파악하고 즉각 결론을 내리는 사고 경향이 강하오. "
            "복잡한 이론보다 현실적 가능성과 결과를 먼저 보는 편이며, "
            "실행과 성과를 통해 판단을 검증하는 실전형 사고 구조를 가졌소."
        )
        advice_focus = (
            "실행력은 이미 강점이니, 단기 목표를 명확히 세우고 빠르게 성과를 쌓는 방식이 잘 맞겠소. "
            "다만 판단이 빠른 만큼, 중요한 사안에서는 "
            "한 번 더 검토하거나 타인의 의견을 거치는 습관을 들이면 실수를 줄일 수 있소."
        )

    # 2) 이마 폭 → 사고의 확장성 vs 집중성
    F_width = dist(p103, p332)
    R_FW = F_width / w_face

    if R_FW >= 0.95:
        width_desc = (
            "이마 폭이 넓어 사고의 가로 폭이 크고, "
            "하나의 문제를 여러 방향에서 바라보는 확장적 사고 경향이 있소. "
            "아이디어가 풍부하고, 새로운 관점이나 가능성을 떠올리는 데 능하오."
        )
        advice_width = (
            "발상력은 충분하니, 흩어진 생각을 하나로 묶어낼 선택과 정리가 관건이오. "
            "우선순위를 명확히 하면 재능이 분산되지 않고 힘을 발휘할 것이오."
        )
    elif R_FW >= 0.85:
        width_desc = (
            "이마 폭이 확장과 집중의 균형을 이루어, "
            "현실적인 판단과 아이디어 발상이 조화를 이루는 사고 구조를 가졌소. "
            "상황에 따라 넓게도, 좁게도 생각할 수 있는 유연함이 있소."
        )
        advice_width = (
            "이 균형이 가장 큰 자산이니, 스스로의 판단 기준을 신뢰하고 흔들리지 않는 것이 중요하오. "
            "다만 너무 무난해질 수 있으니, 때로는 한쪽으로 과감히 밀어붙이는 선택도 필요하오."
        )
    else:
        width_desc = (
            "이마 폭이 비교적 좁아 사고가 한 방향으로 모이는 집중형 경향이 강하오. "
            "한 번 정한 목표에 몰입하는 힘이 크며, 깊이 파고드는 문제 해결에 능한 상이오."
        )
        advice_width = (
            "전문성을 키우기에 좋은 상이니, 한 분야를 깊이 파는 전략이 잘 맞겠소. "
            "다만 시야가 좁아질 수 있으니, 정기적으로 다른 관점의 의견을 접하는 것이 사고 균형에 도움이 되오."
        )

    # 3) 좌우 비대칭 → 사고 편향
    Left_height = dist(p10, p103)
    Right_height = dist(p10, p332)
    Asym = abs(Left_height - Right_height) / U_total if U_total > 0 else 0

    if Asym >= 0.15:
        asym_desc = (
            "이마 좌우 높이에 차이가 보여, "
            "사고에서 특정 관점이나 사고 방식이 반복적으로 우세하게 작용하는 경향이 있소. "
            "상황에 따라 감정 중심 또는 이성 중심 판단으로 치우칠 수 있는 상이오."
        )
        advice_asym = (
            "자신의 판단이 어느 쪽으로 기울기 쉬운지 자각하는 것이 중요하오. "
            "중요한 선택 앞에서는 반대 관점의 질문을 스스로에게 던져보면 "
            "사고의 편향을 줄이고 결정의 질을 높일 수 있소."
        )
    else:
        asym_desc = (
            "이마 좌우가 비교적 균형을 이루어, "
            "판단에서 감정과 이성의 균형이 잘 유지되는 상이오. "
            "상황을 중립적으로 바라보고 조율하는 능력이 있소."
        )
        advice_asym = (
            "균형 잡힌 판단은 신뢰를 부르니, 조정자·중재자 역할에서 강점을 발휘할 것이오. "
            "다만 결정이 늦어질 수 있으니, 마감과 기준을 스스로 정해주는 것이 도움이 되오."
        )

    core_meaning = f"{focus_desc} {width_desc} {asym_desc}"
    advice = f"{advice_focus} {advice_width} {advice_asym}"

    # gauge: 세로 비중에서 가장 두드러진 구간 대표값 (R_F2 중앙 비중을 주 지표로)
    gauge_min, gauge_max = 0.20, 0.55
    gauge_value = clamp_gauge_value(R_F2, gauge_min, gauge_max)

    return {
        "measures": {
            "U1": f"{U1:.4f}",
            "U2": f"{U2:.4f}",
            "U3": f"{U3:.4f}",
            "U_total": f"{U_total:.4f}",
            "R_F1": f"{R_F1:.3f}",
            "R_F2": f"{R_F2:.3f}",
            "R_F3": f"{R_F3:.3f}",
            "F_width": f"{F_width:.4f}",
            "R_FW": f"{R_FW:.3f}",
            "Asym": f"{Asym:.3f}",
            "dominant": which_dominant,
        },
        "gauge": {
            "value": round(gauge_value, 3),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "상부우세", "min": 0.20, "max": 0.32},
                {"label": "중앙우세", "min": 0.32, "max": 0.42},
                {"label": "하부우세", "min": 0.42, "max": 0.55},
            ],
        },
        "coreMeaning": core_meaning,
        "advice": advice,
    }


def _default_forehead() -> Dict[str, Any]:
    """기본 이마 데이터"""
    return {
        "measures": {
            "U1": "N/A", "U2": "N/A", "U3": "N/A", "U_total": "N/A",
            "R_F1": "N/A", "R_F2": "N/A", "R_F3": "N/A",
            "F_width": "N/A", "R_FW": "N/A", "Asym": "N/A",
        },
        "gauge": {
            "value": 0.35,
            "rangeMin": 0.20,
            "rangeMax": 0.55,
            "unit": "",
            "segments": [
                {"label": "상부우세", "min": 0.20, "max": 0.32},
                {"label": "중앙우세", "min": 0.32, "max": 0.42},
                {"label": "하부우세", "min": 0.42, "max": 0.55},
            ],
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "이마가 잘 보이도록 머리카락을 정리하고 다시 촬영해 주시오.",
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
    
    # 1) 개방도 해석
    avg_open = (eye_open_l + eye_open_r) / 2
    if avg_open < 0.025:
        open_type = "가는 눈"
        open_desc = (
            "눈의 개방도가 낮아 시선이 한곳으로 모이는 상이오. "
            "이는 세상을 넓게 훑기보다는 중요한 정보만 골라 받아들이는 인지 방식을 뜻하오. "
            "감정 표현은 절제되어 있으며, 즉각적인 반응보다는 속으로 한 번 더 생각한 뒤 움직이는 경향이 강하오. "
            "타인에게는 차분하고 냉정해 보일 수 있으나, 실제로는 판단의 밀도가 높은 상이라 볼 수 있소."
        )
        advice_open = (
            "중요한 순간에 강점을 발휘하는 상이니, 분석·기획·판단이 필요한 역할에서 빛을 보게 될 것이오. "
            "다만 감정을 드러내지 않아 오해를 살 수 있으니, "
            "신뢰가 필요한 관계에서는 의도적으로 의견과 감정을 말로 풀어내는 연습을 하시면 좋겠소."
        )
    elif avg_open <= 0.04:
        open_type = "균형 눈"
        open_desc = (
            "눈의 크기와 개방도가 안정적이니, 감정과 이성의 균형이 잘 잡힌 상이오. "
            "상황을 지나치게 확대하지도, 그렇다고 축소하지도 않는 현실적인 인지 방식을 가졌으며, "
            "타인의 감정에도 적절히 반응하되 스스로 휘둘리지는 않는 편이오. "
            "신뢰를 쌓는 데 시간이 걸리지 않고, 꾸준히 관계를 유지하는 힘이 있는 눈이라 할 수 있소."
        )
        advice_open = (
            "어떤 조직이나 관계에서도 중심을 잡는 역할에 잘 어울리는 상이오. "
            "본인의 안정감이 주변에 긍정적인 영향을 주니, 책임 있는 위치에서 조율자·중재자의 역할을 맡아보시게. "
            "다만 지나치게 무난함에 머물면 존재감이 흐려질 수 있으니, "
            "결정이 필요한 순간에는 한 발 앞서 의견을 드러내는 것도 도움이 되오."
        )
    else:
        open_type = "큰 눈"
        open_desc = (
            "눈의 개방도가 크고 시선이 열려 있어 감정과 생각이 밖으로 잘 드러나는 상이오. "
            "새로운 자극에 대한 반응이 빠르고, 사람과 상황을 직관적으로 받아들이는 경향이 강하오. "
            "공감 능력이 뛰어나고 표현력이 풍부하여, 주변 사람들에게 친근한 인상을 주는 눈이오. "
            "다만 감정의 흐름이 얼굴에 그대로 드러나, 컨디션에 따라 기복이 보일 수 있소."
        )
        advice_open = (
            "사람을 상대하는 일, 창의력과 감각을 쓰는 분야에서 재능을 발휘할 수 있소. "
            "다만 감정이 판단을 앞서지 않도록, 중요한 결정은 한 박자 늦춰 생각하는 습관을 들이면 좋겠소. "
            "에너지가 분산되지 않도록 우선순위를 정해 행동하는 것이 운을 안정시키는 길이오."
        )

    # 2) 좌우 비대칭 해석
    if asymmetry < 0.01:
        asym_type = "균형형"
        asym_desc = (
            "좌우 눈의 균형이 잘 맞아 감정과 사고의 흐름이 비교적 일정한 상이오. "
            "외부 상황에 크게 흔들리지 않고, 판단의 기준이 명확한 편이라 볼 수 있소."
        )
        advice_asym = (
            "꾸준함이 강점이니, 장기적인 계획이나 지속성이 필요한 일에 적합하오. "
            "다만 변화가 필요한 상황에서도 기존 방식을 고수하려는 경향이 있을 수 있으니, "
            "새로운 의견을 의식적으로 받아들이려는 태도를 유지하면 더 큰 성장을 이룰 것이오."
        )
    elif asymmetry <= 0.02:
        asym_type = "약간 차이"
        asym_desc = (
            "좌우 눈에 미세한 차이가 있어 상황에 따라 감정과 이성의 비중이 달라지는 상이오. "
            "평소에는 안정적이나, 특정 자극이나 인간관계에서 감정의 파동이 나타날 수 있소."
        )
        advice_asym = (
            "자신의 컨디션이 판단에 영향을 미친다는 점을 인식하는 것이 중요하오. "
            "중요한 결정은 감정이 안정된 시점에 다시 한 번 점검하시면 실수가 줄어들 것이오. "
            "기록하거나 생각을 글로 정리하는 습관이 판단의 균형을 도와줄 것이오."
        )
    else:
        asym_type = "비대칭"
        asym_desc = (
            "좌우 눈의 차이가 뚜렷하여 감정과 사고의 사용 비율이 크게 요동칠 수 있는 상이오. "
            "사람이나 상황에 따라 판단 기준이 달라지기 쉬워, "
            "스스로도 자신의 선택에 혼란을 느낄 때가 있을 수 있소."
        )
        advice_asym = (
            "감정이 크게 움직이는 순간에는 즉각적인 결정을 피하는 것이 상책이오. "
            "신뢰할 수 있는 기준(원칙, 체크리스트, 조언자)을 미리 정해두면 판단의 흔들림을 크게 줄일 수 있소. "
            "감정 관리가 곧 운 관리라 여기시게."
        )

    # 3) 미간 거리 해석
    if width_ratio < 0.28:
        inter_type = "집중형"
        inter_desc = (
            "미간이 좁아 사람과 상황을 쉽게 허용하지 않는 상이오. "
            "관계의 수보다는 깊이를 중시하며, 한 번 마음을 연 대상에게는 오래 신뢰를 유지하는 경향이 강하오. "
            "첫인상에서는 다소 차갑거나 까다로워 보일 수 있소."
        )
        advice_inter = (
            "소수 정예의 인간관계에서 큰 힘을 발휘하는 상이니, 협업에서는 역할과 책임이 명확한 환경이 잘 맞겠소. "
            "다만 처음부터 벽을 높이 세우면 기회를 놓칠 수 있으니, "
            "초반에는 의식적으로 한 걸음만 더 열어두는 연습을 하시면 좋겠소."
        )
    elif width_ratio <= 0.35:
        inter_type = "균형형"
        inter_desc = (
            "미간의 간격이 적절하여 사람을 대하는 거리 조절이 자연스러운 상이오. "
            "처음에는 관찰하고, 신뢰가 쌓이면 깊어지는 관계를 선호하오. "
            "대인관계에서 무리하지 않고, 오래 유지되는 인연을 만드는 눈이라 볼 수 있소."
        )
        advice_inter = (
            "관계 관리 능력이 뛰어나니, 팀이나 조직에서 신뢰의 중심 역할을 맡기 좋겠소. "
            "다만 모든 관계를 무난하게 유지하려다 자신의 입장을 숨길 수 있으니, "
            "때로는 분명한 선을 긋는 것도 필요하오."
        )
    else:
        inter_type = "포용형"
        inter_desc = (
            "미간이 넓어 사람을 쉽게 받아들이고, 처음 만남에서도 경계가 적은 상이오. "
            "개방적이고 친화적인 성향으로, 주변에 사람이 모이기 쉬운 눈이라 할 수 있소. "
            "다만 관계의 시작은 빠르나, 깊이가 얕아질 가능성도 함께 지니고 있소."
        )
        advice_inter = (
            "인간관계의 폭은 이미 충분하니, 이제는 관계의 질을 선택적으로 관리하는 것이 중요하오. "
            "모든 부탁과 관계를 다 받아들이기보다, "
            "스스로 에너지를 쏟을 대상을 가려내면 운의 소모를 줄일 수 있소."
        )

    core_meaning = f"{open_desc} {asym_desc} {inter_desc}"
    advice = f"{advice_open} {advice_asym} {advice_inter}"
    
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
    코(재물운/현실감) 분석 — pitch 보정 선행 가정, yaw는 좌우 평균/비율로 완화.

    파이프라인:
    1. nose_length = dist(168, 4), nose_width = dist(48, 278), face_width = dist(234, 454)
    2. nose_width_ratio = nose_width / face_width → 재물 운용 (절제/균형/확장)
    3. nose_shape_ratio = nose_width / nose_length → 재물 성향 (축적/균형/회전)
    4. nose_shift_ratio = |avg(168,195,5).x - 168.x| / nose_length → 중심선 기울기 (보조)
    """
    p168 = get_landmark(landmarks, 168)   # 미간
    p4 = get_landmark(landmarks, 4)       # 코끝
    p48 = get_landmark(landmarks, 48)
    p278 = get_landmark(landmarks, 278)
    p195 = get_landmark(landmarks, 195)   # 코 중간
    p5 = get_landmark(landmarks, 5)       # 코 하단 중간
    p234 = get_landmark(landmarks, 234)
    p454 = get_landmark(landmarks, 454)

    if not all([p168, p4, p48, p278, p195, p5, p234, p454]):
        return _default_nose()

    nose_length = dist(p168, p4)
    nose_width = dist(p48, p278)
    face_width = dist(p234, p454)

    if face_width <= 0 or nose_length <= 0:
        return _default_nose()

    nose_width_ratio = nose_width / face_width
    nose_shape_ratio = nose_width / nose_length
    length_ratio = nose_length / h_face if h_face > 0 else 0.25

    # 중심선 기울어짐 (yaw 보정: 3점 평균 - 미간)
    center_x = (p168["x"] + p195["x"] + p5["x"]) / 3
    ref_x = p168["x"]
    nose_center_shift = abs(center_x - ref_x)
    nose_shift_ratio = nose_center_shift / nose_length if nose_length > 0 else 0

    # 1) 코 길이 비율 (재물의 시간축)
    if length_ratio < 0.22:
        length_type = "짧은 코"
        length_desc = (
            "코의 길이가 비교적 짧아, 재물을 다루는 데 있어 속도와 기회를 중시하는 경향이 있소. "
            "긴 시간을 두고 쌓기보다는, 눈앞의 흐름을 빠르게 읽고 즉각적인 성과를 만들어내는 재물 운용 방식이오. "
            "판단이 빠른 만큼 기회를 잘 잡지만, 계획 없이 움직이면 손실도 함께 따를 수 있소."
        )
        advice_length = (
            "단기 성과가 중요한 환경에서는 강점을 발휘하겠으나, "
            "수익이 생길수록 일부를 반드시 남기는 구조를 만들어 두시오. "
            "'버는 속도'에 비해 '지키는 장치'를 함께 갖추는 것이 재물운을 안정시키는 길이오."
        )
    elif length_ratio <= 0.28:
        length_type = "균형 코"
        length_desc = (
            "코의 길이가 얼굴과 조화를 이루어, 재물을 다루는 판단에 무리가 없는 상이오. "
            "단기와 장기의 균형을 알고, 상황에 맞게 속도를 조절할 줄 아는 현실적인 재물 감각을 지녔소. "
            "스스로 벌고, 스스로 관리하는 힘이 비교적 안정적으로 갖추어진 형국이오."
        )
        advice_length = (
            "이미 재물의 흐름을 읽는 감각이 있으니, 꾸준함과 원칙을 지키는 것이 가장 큰 자산이 되오. "
            "무리한 한 번의 선택보다, 반복 가능한 전략을 유지하시오."
        )
    else:
        length_type = "긴 코"
        length_desc = (
            "코의 길이가 길어, 재물을 대하는 태도가 장기적이고 인내심이 강한 상이오. "
            "단기간의 이익보다는 시간을 들여 크게 만드는 흐름에 익숙하며, "
            "계획이 한 번 서면 쉽게 바꾸지 않는 신중한 재물 판단을 보이오."
        )
        advice_length = (
            "장기 목표를 세우고 꾸준히 밀고 가는 전략이 잘 맞겠소. "
            "다만 지나친 신중함으로 기회를 놓치지 않도록, "
            "중간 점검과 외부 의견을 받아들이는 여유를 두면 더욱 좋겠소."
        )

    # 2) 코 폭 비율 (재물 운용 방식)
    if nose_width_ratio < 0.23:
        width_type = "절제형"
        width_desc = (
            "콧볼의 폭이 비교적 좁아, 재물을 쓰는 데 있어 절제와 통제를 중시하는 경향이 있소. "
            "불필요한 지출을 꺼리고, 안정성을 우선하는 보수적인 운용 성향이 강하오."
        )
        advice_width = (
            "자산을 지키는 힘은 이미 충분하니, 지나친 경계로 기회를 흘려보내지 않도록 주의하시오. "
            "계산된 범위 안에서의 도전은 재물의 폭을 넓혀줄 것이오."
        )
    elif nose_width_ratio <= 0.27:
        width_type = "균형형"
        width_desc = (
            "콧볼의 폭이 적절하여, 벌고 쓰는 흐름이 비교적 균형을 이루는 상이오. "
            "수입과 지출, 투자와 소비를 상황에 맞게 조절할 줄 아는 관리형 재물 운용을 보이오."
        )
        advice_width = (
            "지금의 균형 감각을 유지하는 것이 가장 중요하오. "
            "큰 욕심을 부리기보다는, 안정적인 누적을 목표로 삼으면 재물이 오래 머무를 것이오."
        )
    else:
        width_type = "확장형"
        width_desc = (
            "콧볼의 폭이 넓어, 재물의 흐름을 크게 움직이려는 성향이 보이오. "
            "투자나 확장에 대한 거부감이 적고, 기회가 보이면 과감히 움직이는 타입이오. "
            "다만 들어오고 나가는 규모가 모두 커질 수 있소."
        )
        advice_width = (
            "큰 흐름을 탈 수 있는 상이니, 반드시 손실을 제한하는 기준선을 함께 세우시오. "
            "확장과 절제가 함께 갈 때 재물운이 오래 이어질 것이오."
        )

    # 3) 길이 대비 폭 비율 (재물 성격)
    if nose_shape_ratio < 0.85:
        shape_type = "축적형"
        shape_desc = (
            "코의 길이에 비해 폭이 좁아, 재물이 천천히 모이며 오래 쌓이는 형국이오. "
            "한 번에 크게 벌기보다는, 꾸준히 모아 안정적인 자산을 만드는 흐름이 강하오."
        )
        advice_shape = (
            "장기 저축, 실물 자산, 안정형 투자에 적합하오. "
            "조급해하지 않는 것이 곧 재물운을 키우는 비결이오."
        )
    elif nose_shape_ratio <= 1.0:
        shape_type = "균형형"
        shape_desc = (
            "코의 길이와 폭이 균형을 이루어, "
            "재물이 들어오고 나가는 흐름이 비교적 안정적인 상이오."
        )
        advice_shape = (
            "현재의 관리 패턴을 유지하되, "
            "주기적으로 점검하여 흐름이 새지 않게 관리하시오."
        )
    else:
        shape_type = "회전형"
        shape_desc = (
            "폭이 길이에 비해 넓어, 재물의 회전이 빠른 상이오. "
            "돈이 머무르기보다는 흐르며, 기회와 위험이 함께 움직이오."
        )
        advice_shape = (
            "현금 흐름 관리가 핵심이오. "
            "수입이 늘수록 지출 구조를 함께 정리하지 않으면 남는 것이 적을 수 있소."
        )

    # 4) 코 중심선 기울어짐 (재물 판단의 일관성)
    if nose_shift_ratio < 0.05:
        asym_desc = (
            "코의 중심선이 비교적 곧아, 재물 판단의 기준이 일정한 편이오. "
            "상황이 바뀌어도 큰 틀의 원칙을 유지하는 상이오."
        )
        advice_asym = (
            "이 일관성이 재물의 안정성을 키워주니, "
            "스스로 세운 기준을 쉽게 바꾸지 않는 것이 좋겠소."
        )
    else:
        asym_desc = (
            "코 중심선에 미세한 흔들림이 보여, "
            "재물 판단이 환경이나 감정에 따라 달라질 수 있소."
        )
        advice_asym = (
            "큰 금액이 오가는 결정일수록 즉흥을 피하고, "
            "기록·계산·조언을 거치는 습관을 들이시오. "
            "판단의 일관성이 곧 재물을 지키는 방패가 될 것이오."
        )

    core_meaning = f"{length_desc} {width_desc} {shape_desc} {asym_desc}"
    advice = f"{advice_length} {advice_width} {advice_shape} {advice_asym}"

    # gauge: nose_width_ratio 기준 (0.20~0.30)
    gauge_min, gauge_max = 0.20, 0.30
    gauge_value = clamp_gauge_value(nose_width_ratio, gauge_min, gauge_max)

    return {
        "measures": {
            "nose_length": f"{nose_length:.4f}",
            "nose_width": f"{nose_width:.4f}",
            "face_width": f"{face_width:.4f}",
            "length_ratio": f"{length_ratio:.3f}",
            "nose_width_ratio": f"{nose_width_ratio:.3f}",
            "nose_shape_ratio": f"{nose_shape_ratio:.3f}",
            "nose_shift_ratio": f"{nose_shift_ratio:.3f}",
            "lengthCriteria": length_type,
            "widthCriteria": width_type,
            "shapeCriteria": shape_type,
        },
        "gauge": {
            "value": round(gauge_value, 3),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "",
            "segments": [
                {"label": "절제형", "min": 0.20, "max": 0.23},
                {"label": "균형형", "min": 0.23, "max": 0.27},
                {"label": "확장형", "min": 0.27, "max": 0.30},
            ],
        },
        "coreMeaning": core_meaning,
        "advice": advice,
    }


def _default_nose() -> Dict[str, Any]:
    """기본 코 데이터"""
    return {
        "measures": {
            "nose_length": "N/A",
            "nose_width": "N/A",
            "face_width": "N/A",
            "length_ratio": "N/A",
            "nose_width_ratio": "N/A",
            "nose_shape_ratio": "N/A",
            "nose_shift_ratio": "N/A",
            "lengthCriteria": "N/A",
            "widthCriteria": "N/A",
            "shapeCriteria": "N/A",
        },
        "gauge": {
            "value": 0.25,
            "rangeMin": 0.20,
            "rangeMax": 0.30,
            "unit": "",
            "segments": [
                {"label": "절제형", "min": 0.20, "max": 0.23},
                {"label": "균형형", "min": 0.23, "max": 0.27},
                {"label": "확장형", "min": 0.27, "max": 0.30},
            ],
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "코가 잘 보이도록 정면을 바라보고 다시 촬영해 주시오.",
    }


def calculate_mouth(landmarks: List[Dict]) -> Dict[str, Any]:
    """
    입(말·신뢰·애정운) 분석 — 입꼬리 기울기, 입술 두께, 입 폭.

    랜드마크: mouth_width=dist(61,291), lip_thickness=dist(13,14),
    display_slope(입꼬리 기울기), face_width=dist(234,454)로 입 폭 비율.
    """
    p61 = get_landmark(landmarks, 61)
    p291 = get_landmark(landmarks, 291)
    p13 = get_landmark(landmarks, 13)
    p14 = get_landmark(landmarks, 14)
    p234 = get_landmark(landmarks, 234)
    p454 = get_landmark(landmarks, 454)

    if not all([p61, p291, p13, p14]):
        return _default_mouth()

    mouth_width = dist(p61, p291)
    lip_thickness = dist(p13, p14)
    face_width = dist(p234, p454) if p234 and p454 else 0.3
    mouth_width_ratio = mouth_width / face_width if face_width > 0 else 0.25

    # 입꼬리 기울기 (도 단위), display_slope: 양수=상향, 음수=하향
    dy = p291["y"] - p61["y"]
    dx = p291["x"] - p61["x"]
    raw_slope = math.degrees(math.atan2(dy, dx))
    if abs(raw_slope) > 45:
        raw_slope = math.degrees(math.atan2(-dy, abs(dx)))
    display_slope = -raw_slope

    # 1) 입꼬리 기울기 해석
    if display_slope > 3:
        corner_type = "상향"
        corner_desc = (
            "입꼬리가 자연스레 올라간 형상이오. 이는 첫인상에서 밝고 온화한 기운을 주는 상으로, "
            "사람을 편안하게 만드는 힘이 있소. 말에 감정이 실려 전달되며, "
            "주변의 호의와 도움을 얻기 쉬운 인덕형의 상이오."
        )
        advice_corner = (
            "사람을 상대하는 일, 소통이 중요한 자리에서 복이 따르니 이를 적극 살리시오. "
            "다만 분위기에 휩쓸려 가벼운 약속을 남발하지 않도록 말의 무게를 스스로 조절하면 더 큰 신뢰를 얻으리다."
        )
    elif display_slope >= -3:
        corner_type = "수평"
        corner_desc = (
            "입꼬리가 수평을 이루니 감정 표현이 절제되어 있고, 말에 중심이 있는 상이오. "
            "과장되지 않은 언변으로 신뢰를 쌓는 유형이며, "
            "처음에는 차분해 보이나 관계가 깊어질수록 진가가 드러나는 상이오."
        )
        advice_corner = (
            "신중함은 큰 장점이나, 감정을 조금 더 드러내면 애정운과 인간관계의 폭이 넓어지리라. "
            "중요한 순간에는 자신의 의사를 분명히 표현하는 연습도 도움이 되오."
        )
    else:
        corner_type = "하향"
        corner_desc = (
            "입꼬리가 아래로 기운 형상이오. 이는 진중하고 무게감 있는 인상을 주는 상으로, "
            "말 한마디의 책임을 크게 여기는 성향이 강하오. "
            "다만 첫인상에서는 엄격하거나 차가워 보일 수 있소."
        )
        advice_corner = (
            "말과 태도에 온기를 조금 더 보태면 인상이 크게 부드러워질 것이오. "
            "신중함 자체는 신뢰로 이어지는 상이니, 표정과 말투만 의식적으로 조정해도 인간관계 운이 한결 수월해지리다."
        )

    # 2) 입술 두께 해석
    if lip_thickness < 0.02:
        lip_type = "얇음"
        lip_desc = (
            "입술이 얇은 편이오. 감정을 겉으로 드러내기보다 속으로 정리하는 성향이 강하며, "
            "말과 감정 모두 절제된 상이오. 논리와 이성이 앞서 신뢰는 주나, 차갑게 보일 수 있소."
        )
        advice_lip = (
            "마음을 다 표현하지 않아 오해를 살 수 있으니, "
            "가까운 사람에게는 의식적으로 감정을 언어로 풀어내는 것이 애정운을 돕는 길이오."
        )
    elif lip_thickness <= 0.035:
        lip_type = "중간"
        lip_desc = (
            "입술 두께가 균형을 이루니 감정과 이성의 조화가 좋은 상이오. "
            "말에 과하지도 부족하지도 않은 온기가 담겨 있어, 신뢰와 호감을 동시에 얻기 쉬운 형국이오."
        )
        advice_lip = (
            "현재의 표현 방식이 안정적이니, "
            "상황에 따라 감정 표현의 강약만 조절하면 더욱 원만한 관계를 유지할 수 있소."
        )
    else:
        lip_type = "두꺼움"
        lip_desc = (
            "입술이 도톰한 편이오. 정이 많고 감정 표현이 풍부하여 애정운이 강한 상이오. "
            "말과 행동에 마음이 실려 주변 사람들에게 정서적 영향을 크게 미치오."
        )
        advice_lip = (
            "정이 깊은 만큼 감정이 앞설 수 있으니, "
            "중요한 결정이나 약속 앞에서는 한 번 더 생각하는 여유를 가지면 관계가 오래가리다."
        )

    # 3) 입 폭 해석 (말의 범위 · 책임감) — 얼굴 폭 대비 비율
    if mouth_width_ratio < 0.22:
        width_type = "좁은 입 폭"
        width_desc = (
            "입의 폭이 비교적 좁아, 말을 쉽게 꺼내지 않는 신중형의 상이오. "
            "발언 하나하나에 책임을 두며, 가벼운 약속을 싫어하는 성향이 강하오."
        )
        advice_width = (
            "신중함은 큰 신뢰로 이어지나, "
            "필요할 때는 생각을 명확히 표현해야 기회를 놓치지 않으리라."
        )
    elif mouth_width_ratio <= 0.28:
        width_type = "균형 잡힌 입 폭"
        width_desc = (
            "입의 폭이 적당하여 말의 범위와 책임의 균형이 잘 잡힌 상이오. "
            "상황 판단에 맞는 언변을 구사하여 사람들과 안정적인 관계를 맺기 쉬운 형국이오."
        )
        advice_width = (
            "지금의 표현 방식이 매우 안정적이니, "
            "중요한 순간에는 한 발 더 나서도 무리가 없소."
        )
    else:
        width_type = "넓은 입 폭"
        width_desc = (
            "입의 폭이 넓어 표현력과 발언의 범위가 큰 상이오. "
            "말로 사람을 움직이는 힘이 있으나, 그만큼 말에 대한 책임도 함께 따르는 형국이오."
        )
        advice_width = (
            "말이 곧 신뢰가 되는 상이니, "
            "약속과 발언의 무게를 스스로 관리하면 큰 인덕으로 돌아올 것이오."
        )

    core_meaning = f"{corner_desc} {lip_desc} {width_desc}"
    advice = f"{advice_corner} {advice_lip} {advice_width}"

    gauge_min, gauge_max = -10, 10
    gauge_value = clamp_gauge_value(display_slope, gauge_min, gauge_max)

    return {
        "measures": {
            "width": f"{mouth_width:.4f}",
            "mouth_width_ratio": f"{mouth_width_ratio:.3f}",
            "lipThickness": f"{lip_thickness:.4f}",
            "cornerSlope": f"{display_slope:.2f}",
            "cornerCriteria": corner_type,
            "lipCriteria": lip_type,
            "widthCriteria": width_type,
        },
        "gauge": {
            "value": round(gauge_value, 2),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "°",
            "segments": [
                {"label": "내려감", "min": -10, "max": -3},
                {"label": "보통", "min": -3, "max": 3},
                {"label": "올라감", "min": 3, "max": 10},
            ],
        },
        "coreMeaning": core_meaning,
        "advice": advice,
    }


def _default_mouth() -> Dict[str, Any]:
    """기본 입 데이터"""
    return {
        "measures": {
            "width": "N/A",
            "mouth_width_ratio": "N/A",
            "lipThickness": "N/A",
            "cornerSlope": "N/A",
            "cornerCriteria": "N/A",
            "lipCriteria": "N/A",
            "widthCriteria": "N/A",
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


def calculate_chin(landmarks: List[Dict], h_face: float = 0.5) -> Dict[str, Any]:
    """
    턱/하관(지구력·노년운) 분석 — 선이 아니라 면·무게·버팀 구조.

    ① structure: 각도(148-152-377)·폭 — 성격적 버팀 방식
    ② endurance: 길이 비율(18→152/h_face), 깊이(z), 좌우 안정(148→176, 377→400) — 실제 지구력·노년운
    """
    p152 = get_landmark(landmarks, 152)   # 턱끝
    p18 = get_landmark(landmarks, 18)     # 입 하단 중앙
    p148 = get_landmark(landmarks, 148)   # 좌측 하악
    p377 = get_landmark(landmarks, 377)   # 우측 하악
    p176 = get_landmark(landmarks, 176)   # 좌측 턱 아래
    p400 = get_landmark(landmarks, 400)   # 우측 턱 아래

    if not all([p152, p18, p148, p377, p176, p400]) or h_face <= 0:
        return _default_chin()

    jaw_width = dist(p148, p377)
    chin_length = dist(p18, p152)
    jaw_angle = angle_degrees(p148, p152, p377)

    chin_ratio = chin_length / h_face
    chin_depth = abs(p152.get("z", 0) - p18.get("z", 0))
    chin_depth_ratio = chin_depth / h_face if h_face > 0 else 0

    left_support = dist(p148, p176)
    right_support = dist(p377, p400)
    support_asym = abs(left_support - right_support) / chin_length if chin_length > 0 else 0

    # 1) structure — 각도(성향용)
    if jaw_angle < 65:
        angle_type = "각진 턱"
        angle_desc = "턱선이 각지고 단정한 형상이오. 이는 의지력과 끈기가 강한 자의 상이오. 밀어붙이는 추진력이 뛰어나나, 고집이 세질 수 있으니 주의하시오."
        advice_angle = "꾸준함이 무기요. 시간이 지날수록 신망이 쌓이는 상이니 중도 포기만 피하시오. 타인의 의견에도 귀 기울이면 더욱 좋으리라."
    elif jaw_angle <= 75:
        angle_type = "완만한 턱"
        angle_desc = "턱선이 단정하고 좌우 밸런스가 좋으며 각이 너무 날카롭지 않구려. 이는 인내심 있고 자기 관리가 철저한 자의 상이오. 말년에 외롭지 않고, 꾸준히 자신의 삶을 책임질 수 있는 운이 들어있소."
        advice_angle = "꾸준함이 무기요. 시간이 지날수록 신망이 쌓이는 상이니 중도 포기만 피하시오."
    else:
        angle_type = "둥근 턱"
        angle_desc = "턱선이 부드럽고 둥근 형상이오. 이는 포용력과 완충 능력이 뛰어난 상이오. 중재자 역할에 복이 있으나, 결단이 늦어질 수 있으니 주의하시오. 말년이 편안한 상이오."
        advice_angle = "사람들 사이에서 중재 역할을 하면 복이 따르리라. 단, 중요한 일에는 결단력을 키우는 노력이 필요하오."

    # 2) endurance — 턱 길이 비율 (책임 지속력 · 말년 체력)
    if chin_ratio < 0.18:
        length_type = "짧은 턱 길이"
        length_desc = (
            "턱의 길이가 비교적 짧은 편이오. 시작은 빠르나, 오랜 시간 같은 책임을 짊어지는 데에는 피로를 느끼기 쉬운 상이오. "
            "단기 집중에는 강하나, 후반부로 갈수록 체력과 의지가 분산되기 쉬운 형국이오."
        )
        advice_length = (
            "한 번에 모든 것을 책임지려 하지 말고, 역할과 부담을 나누는 것이 말년운을 지키는 길이오. "
            "휴식과 리듬 조절이 곧 복이 되리다."
        )
    elif chin_ratio <= 0.23:
        length_type = "균형 잡힌 턱 길이"
        length_desc = (
            "턱의 길이가 안정적으로 형성되어, 책임을 꾸준히 이어가는 힘이 있소. "
            "초반과 후반의 기복이 크지 않아 삶의 흐름이 비교적 평탄한 상이오."
        )
        advice_length = (
            "지금의 생활 리듬을 유지하는 것이 곧 운을 지키는 일이오. "
            "꾸준함을 무기로 삼으면 말년에도 큰 흔들림이 없으리다."
        )
    else:
        length_type = "긴 턱 길이"
        length_desc = (
            "턱이 길게 뻗은 형상이오. 이는 책임과 의무를 끝까지 끌고 가는 지구력이 강한 상이오. "
            "시간이 지날수록 진가가 드러나며, 말년에 기반이 단단해지는 형국이오."
        )
        advice_length = (
            "오래 버티는 힘이 있으니 단기 성과에 조급해하지 말고, "
            "장기적인 관점으로 삶을 설계하면 큰 안정으로 돌아오리다."
        )

    # 3) endurance — 턱 깊이(실제 버팀 힘 · 의지의 실체)
    if chin_depth_ratio < 0.03:
        depth_type = "얕은 턱 깊이"
        depth_desc = (
            "턱의 깊이가 얕은 편이오. 마음과 의지는 있으나, "
            "실제 체력이나 환경의 뒷받침이 약해 무리하면 쉽게 소진될 수 있는 상이오."
        )
        advice_depth = (
            "의지로만 버티려 하지 말고, 체력·재정·환경을 함께 다지는 것이 중요하오. "
            "기반을 다지면 운의 소모를 크게 줄일 수 있소."
        )
    elif chin_depth_ratio <= 0.06:
        depth_type = "중간 깊이"
        depth_desc = (
            "턱의 깊이가 적당하여 의지와 현실의 균형이 잘 맞는 상이오. "
            "무리하지 않으면서도 필요한 순간에는 힘을 낼 줄 아는 형국이오."
        )
        advice_depth = (
            "지금처럼 페이스를 조절하면 큰 탈 없이 안정적인 말년운을 이어갈 수 있소."
        )
    else:
        depth_type = "깊은 턱"
        depth_desc = (
            "턱이 앞으로 단단히 자리한 형상이오. 이는 실제 버팀 힘이 강하고, "
            "어려운 환경에서도 쉽게 무너지지 않는 상이오. 말년으로 갈수록 중심이 더욱 단단해지는 형국이오."
        )
        advice_depth = (
            "타고난 지구력이 강하니, 이를 남을 떠받치는 데만 쓰지 말고 "
            "스스로를 위한 안정에도 투자하시오."
        )

    # 4) endurance — 턱 좌우 안정성 (노년 균형 · 말년 기복)
    if support_asym < 0.1:
        support_type = "좌우 안정형"
        support_desc = (
            "턱의 좌우 지지가 균형을 이루어, 말년의 생활 기반이 비교적 안정적인 상이오. "
            "환경 변화에도 중심을 잃지 않는 힘이 있소."
        )
        advice_stability = (
            "큰 선택만 무리하지 않으면, 후반으로 갈수록 삶의 균형이 자연스레 잡힐 것이오."
        )
    else:
        support_type = "좌우 불균형형"
        support_desc = (
            "턱의 좌우 지지에 차이가 있어, 말년으로 갈수록 환경이나 주변 사람의 영향이 크게 작용할 수 있는 상이오. "
            "시기별로 기복이 생기기 쉬운 형국이오."
        )
        advice_stability = (
            "노년을 대비해 기반을 분산시키는 것이 중요하오. "
            "한쪽에만 의지하지 말고, 여러 축을 만들어 두면 기복을 크게 줄일 수 있소."
        )

    # coreMeaning: 각도(성향) + 길이 + 깊이 + 안정성
    endurance_desc = f"{length_desc} {depth_desc} {support_desc}"
    core_meaning = f"{angle_desc} {endurance_desc}"
    advice = f"{advice_angle} {advice_length} {advice_depth} {advice_stability}"

    gauge_min, gauge_max = 55, 85
    gauge_value = clamp_gauge_value(jaw_angle, gauge_min, gauge_max)

    return {
        "structure": {
            "angle": round(jaw_angle, 2),
            "angleType": angle_type,
            "width": round(jaw_width, 4),
        },
        "endurance": {
            "lengthRatio": round(chin_ratio, 4),
            "depthRatio": round(chin_depth_ratio, 4),
            "supportAsym": round(support_asym, 4),
            "lengthType": length_type,
            "depthType": depth_type,
            "supportType": support_type,
        },
        "measures": {
            "chin_length": f"{chin_length:.4f}",
            "chin_ratio": f"{chin_ratio:.3f}",
            "chin_depth": f"{chin_depth:.4f}",
            "chin_depth_ratio": f"{chin_depth_ratio:.3f}",
            "support_asym": f"{support_asym:.3f}",
            "jaw_width": f"{jaw_width:.4f}",
            "angle": f"{jaw_angle:.2f}",
            "angleCriteria": angle_type,
        },
        "gauge": {
            "value": round(gauge_value, 2),
            "rangeMin": gauge_min,
            "rangeMax": gauge_max,
            "unit": "°",
            "segments": [
                {"label": "각진", "min": 55, "max": 65},
                {"label": "보통", "min": 65, "max": 75},
                {"label": "둥근편", "min": 75, "max": 85},
            ],
        },
        "coreMeaning": core_meaning,
        "advice": advice,
    }


def _default_chin() -> Dict[str, Any]:
    """기본 턱 데이터"""
    return {
        "structure": {"angle": None, "angleType": "N/A", "width": None},
        "endurance": {
            "lengthRatio": None,
            "depthRatio": None,
            "supportAsym": None,
            "lengthType": "N/A",
            "depthType": "N/A",
            "supportType": "N/A",
        },
        "measures": {
            "chin_length": "N/A",
            "chin_ratio": "N/A",
            "chin_depth": "N/A",
            "chin_depth_ratio": "N/A",
            "support_asym": "N/A",
            "jaw_width": "N/A",
            "angle": "N/A",
            "angleCriteria": "N/A",
        },
        "gauge": {
            "value": 70,
            "rangeMin": 55,
            "rangeMax": 85,
            "unit": "°",
            "segments": [
                {"label": "각진", "min": 55, "max": 65},
                {"label": "보통", "min": 65, "max": 75},
                {"label": "둥근편", "min": 75, "max": 85},
            ],
        },
        "coreMeaning": "랜드마크 데이터가 부족하여 분석할 수 없습니다.",
        "advice": "턱이 잘 보이도록 정면을 바라보고 다시 촬영해 주시오.",
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
    # 기본 측정값 계산 (다른 부위 분석용 — 얼굴형은 calculate_face_shape 내부에서 비율 기반 사용)
    p35 = get_landmark(landmarks, 35)
    p265 = get_landmark(landmarks, 265)
    p10 = get_landmark(landmarks, 10)
    p152 = get_landmark(landmarks, 152)

    w_face = dist(p35, p265) if p35 and p265 else 0.3
    h_face = dist(p10, p152) if p10 and p152 else 0.5

    # 품질 체크: head_roll + pitch
    head_roll = calculate_head_roll(landmarks)
    pitch_deg = estimate_pitch_degrees(landmarks)

    # 각 부위 분석 (face_shape 내부에서 pitch > 40° 시 프레임 폐기 처리)
    face_shape = calculate_face_shape(landmarks)
    forehead = calculate_forehead(landmarks, h_face, w_face)
    eyes = calculate_eyes(landmarks, w_face)
    nose = calculate_nose(landmarks, h_face)
    mouth = calculate_mouth(landmarks)
    chin = calculate_chin(landmarks, h_face)

    # _type → type (API/프롬프트에서 part.get('type') 사용)
    if '_type' in face_shape:
        face_shape['type'] = face_shape['_type']
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
            "pitchDeg": round(pitch_deg, 2),
            "qualityNote": get_quality_note(head_roll, pitch_deg),
            "symmetry": round(calculate_overall_symmetry(landmarks), 1),
        },
    }


def get_quality_note(head_roll: float, pitch_deg: float = 0.0) -> str:
    """품질 노트 생성 (head_roll + pitch 반영, 폐기 없이 보정 적용 안내)"""
    abs_roll = abs(head_roll)
    if pitch_deg > 25:
        note = "고개 각도 보정 적용."
    else:
        note = ""
    if abs_roll <= 5 and pitch_deg <= 15:
        return (note + " 신뢰도 높음").strip() or "신뢰도 높음"
    if abs_roll <= 10 and pitch_deg <= 25:
        return (note + " 사용 가능").strip() or "사용 가능"
    if abs_roll > 10:
        return (note + " 얼굴이 기울어져 있어 비율·거리 중심 분석 권장").strip()
    return (note + " 사용 가능").strip() or "사용 가능"
