"""
대운(大運) 계산 모듈

- 기준: 월주(태어난 달 간지). 연주 아님.
- 순행/역행: 연간 음양 + 성별 (양년남·음년여 → 순행, 그 외 역행)
- 시작 나이: 출생 → 다음(순행) 또는 이전(역행) 절기까지 시간 차이, 3일=1세 환산 (소수점 유지)
- 시간: 모든 시각은 Asia/Seoul 기준으로 해석. (입력 생년월일시도 서울시간으로 간주)
- 절기: 연도별 해당일 12:00 KST 근사 (실제 서비스에서는 천문 시각 사용 권장)
"""

from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

try:
    from zoneinfo import ZoneInfo
    SEOUL = ZoneInfo("Asia/Seoul")
except Exception:
    SEOUL = None  # Python 3.8 이하: naive datetime 사용, "서울 기준" 문서화

from saju_calculation import (
    HEAVENLY_STEMS,
    EARTHLY_BRANCHES,
)

# 24절기 순서 (월주·대운 공통): 해당 연도에서 시간 순 (월,일)
# 소한(1/6), 대한(1/20), 입춘(2/4), ... 동지(12/22)
JULGI_ORDER: List[Tuple[str, int, int]] = [
    ("소한", 1, 6), ("대한", 1, 20), ("입춘", 2, 4), ("우수", 2, 19),
    ("경칩", 3, 6), ("춘분", 3, 21), ("청명", 4, 5), ("곡우", 4, 20),
    ("입하", 5, 6), ("소만", 5, 21), ("망종", 6, 6), ("하지", 6, 21),
    ("소서", 7, 7), ("대서", 7, 23), ("입추", 8, 7), ("처서", 8, 23),
    ("백로", 9, 7), ("추분", 9, 23), ("한로", 10, 8), ("상강", 10, 23),
    ("입동", 11, 7), ("소설", 11, 22), ("대설", 12, 7), ("동지", 12, 22),
]


def _birth_datetime_seoul(birth: Dict[str, Any]) -> datetime:
    """출생 시각을 서울시간 datetime으로 반환. (타임존 미지원 시 naive로 반환)"""
    y = birth.get("year", 1990)
    m = birth.get("month", 1)
    d = birth.get("day", 1)
    h = birth.get("hour", 12)
    minu = birth.get("minute", 0)
    if SEOUL:
        return datetime(y, m, d, h, minu, 0, tzinfo=SEOUL)
    return datetime(y, m, d, h, minu, 0)


def _julgi_datetime_kst(year: int, name: str, month: int, day: int) -> datetime:
    """절기 시각: 해당 연도 월/일 12:00 KST. (실제로는 연도별 천문 시각 사용 권장)"""
    if SEOUL:
        return datetime(year, month, day, 12, 0, 0, tzinfo=SEOUL)
    return datetime(year, month, day, 12, 0, 0)


def _all_julgi_for_year(year: int) -> List[Tuple[datetime, str]]:
    """해당 연도 24절기 (시각, 이름) 리스트, 시간 순 정렬."""
    out: List[Tuple[datetime, str]] = []
    for name, month, day in JULGI_ORDER:
        dt = _julgi_datetime_kst(year, name, month, day)
        out.append((dt, name))
    out.sort(key=lambda x: x[0])
    return out


def _get_next_julgi(birth_dt: datetime) -> Tuple[datetime, str]:
    """출생 시각 이후 첫 번째 절기 (다음 절기)."""
    y = birth_dt.year
    for dt, name in _all_julgi_for_year(y):
        if dt > birth_dt:
            return (dt, name)
    dt_next, name_next = _all_julgi_for_year(y + 1)[0]
    return (dt_next, name_next)


def _get_prev_julgi(birth_dt: datetime) -> Tuple[datetime, str]:
    """출생 시각 이전 마지막 절기 (이전 절기)."""
    y = birth_dt.year
    all_j = _all_julgi_for_year(y)
    for i in range(len(all_j) - 1, -1, -1):
        dt, name = all_j[i]
        if dt < birth_dt:
            return (dt, name)
    all_prev = _all_julgi_for_year(y - 1)
    return all_prev[-1]


def _is_forward_daewoon(year_stem: str, gender_kr: str) -> bool:
    """순행 여부: 양년남·음년여 → 순행(True), 그 외 역행(False)."""
    yang = year_stem in ("갑", "병", "무", "경", "임")
    is_male = gender_kr in ("남", "남성", "male")
    if (yang and is_male) or (not yang and not is_male):
        return True
    return False


def _next_60ganji(stem: str, branch: str) -> Tuple[str, str]:
    """60갑자에서 다음 간지."""
    si = HEAVENLY_STEMS.index(stem) if stem in HEAVENLY_STEMS else 0
    bi = EARTHLY_BRANCHES.index(branch) if branch in EARTHLY_BRANCHES else 0
    return (HEAVENLY_STEMS[(si + 1) % 10], EARTHLY_BRANCHES[(bi + 1) % 12])


def _prev_60ganji(stem: str, branch: str) -> Tuple[str, str]:
    """60갑자에서 이전 간지."""
    si = HEAVENLY_STEMS.index(stem) if stem in HEAVENLY_STEMS else 0
    bi = EARTHLY_BRANCHES.index(branch) if branch in EARTHLY_BRANCHES else 0
    return (HEAVENLY_STEMS[(si - 1) % 10], EARTHLY_BRANCHES[(bi - 1) % 12])


def calculate_daewoon(
    birth: Dict[str, Any],
    month_stem: str,
    month_branch: str,
    year_stem: str,
) -> Dict[str, Any]:
    """
    대운 계산.

    - birth: parse_birth_info() 결과 (year, month, day, hour, minute, gender 등)
    - month_stem, month_branch: 월주 천간·지지 (대운 출발점)
    - year_stem: 연간 (순/역 판단용)

    Returns:
        - direction: "순행" | "역행"
        - startAgeYears: 첫 대운 시작 나이 (소수점, 3일=1세)
        - blocks: [{ startAge, endAge, stem, branch, pillar }, ...] (최대 8개 = 80년)
        - currentBlockIndex, currentBlock: 현재 나이 기준 대운
        - calculationBasis: 계산 기준 (타임존, 3일=1세 등)
    """
    birth_dt = _birth_datetime_seoul(birth)
    forward = _is_forward_daewoon(year_stem, birth.get("gender", "남"))

    if forward:
        ref_dt, ref_name = _get_next_julgi(birth_dt)
        days_diff = (ref_dt - birth_dt).total_seconds() / 86400.0
    else:
        ref_dt, ref_name = _get_prev_julgi(birth_dt)
        days_diff = (birth_dt - ref_dt).total_seconds() / 86400.0

    start_age_years = round(days_diff / 3.0, 2) if days_diff >= 0 else 0.0

    # 첫 대운 = 월주의 다음(순행) 또는 이전(역행) 간지
    blocks: List[Dict[str, Any]] = []
    s, b = month_stem, month_branch
    for i in range(8):
        if forward:
            s, b = _next_60ganji(s, b)
        else:
            s, b = _prev_60ganji(s, b)
        start_age = start_age_years + i * 10
        end_age = start_age + 10
        blocks.append({
            "startAge": round(start_age, 2),
            "endAge": round(end_age, 2),
            "stem": s,
            "branch": b,
            "pillar": s + b,
        })

    today = datetime.now(SEOUL) if SEOUL else datetime.now()
    try:
        delta = today - birth_dt
        age_years = delta.total_seconds() / (365.25 * 86400)
    except TypeError:
        age_years = (today - birth_dt).days / 365.25
    current_idx: Optional[int] = None
    for idx, blk in enumerate(blocks):
        if blk["startAge"] <= age_years < blk["endAge"]:
            current_idx = idx
            break

    return {
        "direction": "순행" if forward else "역행",
        "startAgeYears": start_age_years,
        "referenceJulgi": ref_name,
        "blocks": blocks,
        "currentBlockIndex": current_idx,
        "currentBlock": blocks[current_idx] if current_idx is not None else None,
        "calculationBasis": {
            "timezone": "Asia/Seoul",
            "method": "3days_1year",
            "julgiApproximation": "해당일 12:00 KST (천문 시각 아님)",
        },
    }
