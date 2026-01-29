"""
사주 계산 모듈 (Python 버전)
생년월일시 → 간지 변환
"""

from datetime import datetime
from typing import Dict, Optional, Tuple
import math

# 천간 10개
HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']

# 지지 12개
EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

# 천간 오행 매핑
STEM_FIVE_ELEMENTS = {
    '갑': '목', '을': '목',
    '병': '화', '정': '화',
    '무': '토', '기': '토',
    '경': '금', '신': '금',
    '임': '수', '계': '수'
}

# 지지 오행 매핑
BRANCH_FIVE_ELEMENTS = {
    '자': '수', '축': '토', '인': '목', '묘': '목',
    '진': '토', '사': '화', '오': '화', '미': '토',
    '신': '금', '유': '금', '술': '토', '해': '수'
}

# 천간 음양 매핑
STEM_YIN_YANG = {
    '갑': '양', '을': '음', '병': '양', '정': '음',
    '무': '양', '기': '음', '경': '양', '신': '음',
    '임': '양', '계': '음'
}

# 지지 음양 매핑
BRANCH_YIN_YANG = {
    '자': '양', '축': '음', '인': '양', '묘': '음',
    '진': '양', '사': '음', '오': '양', '미': '음',
    '신': '양', '유': '음', '술': '양', '해': '음'
}

# 24절기 한국어 이름 매핑 (근사값)
SOLAR_TERMS = [
    {'name': '입춘', 'month': 2, 'day': 4},
    {'name': '우수', 'month': 2, 'day': 19},
    {'name': '경칩', 'month': 3, 'day': 6},
    {'name': '춘분', 'month': 3, 'day': 21},
    {'name': '청명', 'month': 4, 'day': 5},
    {'name': '곡우', 'month': 4, 'day': 20},
    {'name': '입하', 'month': 5, 'day': 6},
    {'name': '소만', 'month': 5, 'day': 21},
    {'name': '망종', 'month': 6, 'day': 6},
    {'name': '하지', 'month': 6, 'day': 21},
    {'name': '소서', 'month': 7, 'day': 7},
    {'name': '대서', 'month': 7, 'day': 23},
    {'name': '입추', 'month': 8, 'day': 7},
    {'name': '처서', 'month': 8, 'day': 23},
    {'name': '백로', 'month': 9, 'day': 7},
    {'name': '추분', 'month': 9, 'day': 23},
    {'name': '한로', 'month': 10, 'day': 8},
    {'name': '상강', 'month': 10, 'day': 23},
    {'name': '입동', 'month': 11, 'day': 7},
    {'name': '소설', 'month': 11, 'day': 22},
    {'name': '대설', 'month': 12, 'day': 7},
    {'name': '동지', 'month': 12, 'day': 22},
    {'name': '소한', 'month': 1, 'day': 6},
    {'name': '대한', 'month': 1, 'day': 20}
]


def find_solar_term_approx(year: int, month: int, day: int) -> Dict[str, any]:
    """절기 찾기 (근사값)"""
    target_date = datetime(year, month, day)
    
    # 올해의 절기들 확인
    for i in range(len(SOLAR_TERMS) - 1, -1, -1):
        term = SOLAR_TERMS[i]
        term_date = datetime(year, term['month'], term['day'])
        if target_date >= term_date:
            return {'name': term['name'], 'date': term_date}
    
    # 전년도 대한 확인
    last_term = SOLAR_TERMS[-1]
    return {'name': last_term['name'], 'date': datetime(year - 1, last_term['month'], last_term['day'])}


def calculate_year_pillar(birth: Dict) -> Dict[str, str]:
    """연주 계산"""
    year = birth['year']
    
    # 입춘 근사값 확인 (2월 4일)
    ipchun = datetime(year, 2, 4)
    birth_date = datetime(year, birth['month'], birth['day'], birth.get('hour', 0), birth.get('minute', 0))
    
    # 입춘 이전이면 전년도 사용
    if birth_date < ipchun:
        year -= 1
    
    base_year = 1984  # 갑자년
    gap = (year - base_year) % 60
    if gap < 0:
        gap += 60
    
    stem = HEAVENLY_STEMS[gap % 10]
    branch = EARTHLY_BRANCHES[gap % 12]
    
    return {
        'stem': stem,
        'branch': branch,
        'pillar': stem + branch
    }


def calculate_month_pillar(birth: Dict, year_stem: str) -> Dict:
    """월주 계산"""
    month_stem_map = {
        '갑': ['병', '정', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
        '을': ['무', '기', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
        '병': ['무', '기', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
        '정': ['경', '신', '경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'],
        '무': ['갑', '을', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
        '기': ['병', '정', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을'],
        '경': ['무', '기', '무', '기', '경', '신', '임', '계', '갑', '을', '병', '정'],
        '신': ['임', '계', '임', '계', '갑', '을', '병', '정', '무', '기', '경', '신'],
        '임': ['갑', '을', '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'],
        '계': ['병', '정', '병', '정', '무', '기', '경', '신', '임', '계', '갑', '을']
    }
    
    solar_term = find_solar_term_approx(birth['year'], birth['month'], birth['day'])
    
    # 절기 기준 월지 결정
    term_order = ['입춘', '우수', '경칩', '춘분', '청명', '곡우', '입하', '소만', 
                 '망종', '하지', '소서', '대서', '입추', '처서', '백로', '추분',
                 '한로', '상강', '입동', '소설', '대설', '동지', '소한', '대한']
    
    term_index = term_order.index(solar_term['name']) if solar_term['name'] in term_order else -1
    month_branch_index = 0
    
    if term_index >= 0:
        month_branch_index = (term_index // 2 + 2) % 12
    else:
        # 근사 계산
        birth_date = datetime(birth['year'], birth['month'], birth['day'])
        ipchun = datetime(birth['year'], 2, 4)
        gyungchip = datetime(birth['year'], 3, 6)
        cheongmyeong = datetime(birth['year'], 4, 5)
        ipha = datetime(birth['year'], 5, 6)
        mangjong = datetime(birth['year'], 6, 6)
        soseo = datetime(birth['year'], 7, 7)
        ipchu = datetime(birth['year'], 8, 7)
        baekro = datetime(birth['year'], 9, 7)
        hanro = datetime(birth['year'], 10, 8)
        ipdong = datetime(birth['year'], 11, 7)
        daeseol = datetime(birth['year'], 12, 7)
        
        if birth_date < ipchun:
            month_branch_index = 1  # 축월
        elif birth_date < gyungchip:
            month_branch_index = 2  # 인월
        elif birth_date < cheongmyeong:
            month_branch_index = 3  # 묘월
        elif birth_date < ipha:
            month_branch_index = 4  # 진월
        elif birth_date < mangjong:
            month_branch_index = 5  # 사월
        elif birth_date < soseo:
            month_branch_index = 6  # 오월
        elif birth_date < ipchu:
            month_branch_index = 7  # 미월
        elif birth_date < baekro:
            month_branch_index = 8  # 신월
        elif birth_date < hanro:
            month_branch_index = 9  # 유월
        elif birth_date < ipdong:
            month_branch_index = 10  # 술월
        elif birth_date < daeseol:
            month_branch_index = 11  # 해월
        else:
            month_branch_index = 0  # 자월
    
    branch = EARTHLY_BRANCHES[month_branch_index]
    stem = month_stem_map.get(year_stem, ['갑'] * 12)[month_branch_index]
    
    return {
        'stem': stem,
        'branch': branch,
        'pillar': stem + branch,
        'solarTerm': solar_term['name'],
        'solarTermDate': solar_term['date']
    }


def calculate_day_pillar(birth: Dict) -> Dict[str, str]:
    """일주 계산"""
    base_date = datetime(1900, 1, 1, 0, 0, 0)  # 갑술일
    target_date = datetime(
        birth['year'], 
        birth['month'], 
        birth['day'], 
        birth.get('hour', 0), 
        birth.get('minute', 0), 
        0
    )
    
    diff_time = (target_date - base_date).total_seconds()
    diff_days = int(diff_time / (24 * 60 * 60))
    
    base_stem_index = 0  # 갑
    base_branch_index = 10  # 술
    
    stem_index = (diff_days + base_stem_index) % 10
    branch_index = (diff_days + base_branch_index) % 12
    
    return {
        'stem': HEAVENLY_STEMS[stem_index],
        'branch': EARTHLY_BRANCHES[branch_index],
        'pillar': HEAVENLY_STEMS[stem_index] + EARTHLY_BRANCHES[branch_index]
    }


def calculate_hour_pillar(birth: Dict, day_stem: str) -> Dict[str, str]:
    """시주 계산"""
    hour_branch_map = {
        23: '자', 0: '자', 1: '축', 2: '축',
        3: '인', 4: '인', 5: '묘', 6: '묘',
        7: '진', 8: '진', 9: '사', 10: '사',
        11: '오', 12: '오', 13: '미', 14: '미',
        15: '신', 16: '신', 17: '유', 18: '유',
        19: '술', 20: '술', 21: '해', 22: '해'
    }
    
    hour = birth.get('hour', 0)
    hour_for_branch = 12 if hour == 13 else hour
    
    branch = hour_branch_map.get(hour_for_branch, '자')
    branch_index = EARTHLY_BRANCHES.index(branch)
    
    day_stem_index = HEAVENLY_STEMS.index(day_stem)
    
    # 일간별 자시 시작 인덱스
    if day_stem_index in [0, 5]:  # 갑, 기
        hour_start_stem_index = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1]
    elif day_stem_index in [1, 6]:  # 을, 경
        hour_start_stem_index = [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3]
    elif day_stem_index in [2, 7]:  # 병, 신
        hour_start_stem_index = [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5]
    elif day_stem_index in [3, 8]:  # 정, 임
        hour_start_stem_index = [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7]
    else:  # 무, 계 (4, 9)
        hour_start_stem_index = [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    start_stem_index = hour_start_stem_index[branch_index]
    stem = HEAVENLY_STEMS[start_stem_index]
    
    return {
        'stem': stem,
        'branch': branch,
        'pillar': stem + branch
    }


def calculate_saju(birth: Dict) -> Dict:
    """전체 사주 계산"""
    # 1. 연주 계산
    year_pillar = calculate_year_pillar(birth)
    
    # 2. 월주 계산
    month_pillar = calculate_month_pillar(birth, year_pillar['stem'])
    
    # 3. 일주 계산
    day_pillar = calculate_day_pillar(birth)
    
    # 4. 시주 계산
    hour_pillar = calculate_hour_pillar(birth, day_pillar['stem'])
    
    return {
        'yearPillar': year_pillar['pillar'],
        'monthPillar': month_pillar['pillar'],
        'dayPillar': day_pillar['pillar'],
        'hourPillar': hour_pillar['pillar'],
        'yearStem': year_pillar['stem'],
        'yearBranch': year_pillar['branch'],
        'monthStem': month_pillar['stem'],
        'monthBranch': month_pillar['branch'],
        'dayStem': day_pillar['stem'],
        'dayBranch': day_pillar['branch'],
        'hourStem': hour_pillar['stem'],
        'hourBranch': hour_pillar['branch'],
        'solarTerm': month_pillar['solarTerm'],
        'solarTermDate': month_pillar['solarTermDate'].isoformat()
    }
