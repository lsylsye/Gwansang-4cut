"""
명리 관계 모듈 (Python 버전)
오행 분포, 십성, 12운성, 합충해 계산
"""

from typing import Dict, List
from saju_calculation import (
    STEM_FIVE_ELEMENTS,
    BRANCH_FIVE_ELEMENTS,
    STEM_YIN_YANG,
    BRANCH_YIN_YANG
)


def calculate_five_elements(saju: Dict) -> Dict[str, int]:
    """오행 분포 계산"""
    distribution = {
        '목': 0,
        '화': 0,
        '토': 0,
        '금': 0,
        '수': 0
    }
    
    stems = [saju['yearStem'], saju['monthStem'], saju['dayStem'], saju['hourStem']]
    for stem in stems:
        element = STEM_FIVE_ELEMENTS.get(stem)
        if element:
            distribution[element] = distribution.get(element, 0) + 1
    
    branches = [saju['yearBranch'], saju['monthBranch'], saju['dayBranch'], saju['hourBranch']]
    for branch in branches:
        element = BRANCH_FIVE_ELEMENTS.get(branch)
        if element:
            distribution[element] = distribution.get(element, 0) + 1
    
    return distribution


def calculate_sip_sung(saju: Dict) -> Dict[str, str]:
    """십성 계산"""
    day_stem = saju['dayStem']
    day_element = STEM_FIVE_ELEMENTS[day_stem]
    day_yin_yang = STEM_YIN_YANG[day_stem]
    
    def get_sip_sung(target_stem: str, target_branch: str) -> str:
        target_element = STEM_FIVE_ELEMENTS.get(target_stem) or BRANCH_FIVE_ELEMENTS.get(target_branch)
        target_yin_yang = STEM_YIN_YANG.get(target_stem) or BRANCH_YIN_YANG.get(target_branch)
        
        if not target_element:
            return ''
        
        if target_element == day_element:
            return '비견' if target_yin_yang == day_yin_yang else '겁재'
        
        # 오행 상생 관계
        generate_map = {
            '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
        }
        
        # 오행 상극 관계
        overcome_map = {
            '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
        }
        
        if generate_map.get(day_element) == target_element:
            return '식신' if target_yin_yang == day_yin_yang else '상관'
        
        reverse_generate = {
            '화': '목', '토': '화', '금': '토', '수': '금', '목': '수'
        }
        if reverse_generate.get(day_element) == target_element:
            return '인수' if target_yin_yang == day_yin_yang else '편인'
        
        if overcome_map.get(day_element) == target_element:
            return '정재' if target_yin_yang == day_yin_yang else '편재'
        
        reverse_overcome = {
            '토': '목', '금': '화', '수': '토', '목': '금', '화': '수'
        }
        if reverse_overcome.get(day_element) == target_element:
            return '정관' if target_yin_yang == day_yin_yang else '편관'
        
        return ''
    
    return {
        'yearStem': get_sip_sung(saju['yearStem'], ''),
        'monthStem': get_sip_sung(saju['monthStem'], ''),
        'dayStem': '일간',
        'hourStem': get_sip_sung(saju['hourStem'], ''),
        'yearBranch': get_sip_sung('', saju['yearBranch']),
        'monthBranch': get_sip_sung('', saju['monthBranch']),
        'dayBranch': get_sip_sung('', saju['dayBranch']),
        'hourBranch': get_sip_sung('', saju['hourBranch'])
    }


def calculate_twelve_fortune(day_stem: str) -> Dict[str, str]:
    """12운성 계산"""
    fortune_map = {
        '갑': ['해', '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술'],
        '을': ['오', '미', '신', '유', '술', '해', '자', '축', '인', '묘', '진', '사'],
        '병': ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'],
        '정': ['유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미', '신'],
        '무': ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'],
        '기': ['유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미', '신'],
        '경': ['사', '오', '미', '신', '유', '술', '해', '자', '축', '인', '묘', '진'],
        '신': ['축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자'],
        '임': ['묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축', '인'],
        '계': ['진', '사', '오', '미', '신', '유', '술', '해', '자', '축', '인', '묘']
    }
    
    fortune_names = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양']
    branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
    
    result = {}
    order = fortune_map.get(day_stem, [])
    
    for branch in branches:
        if branch in order:
            fortune_index = order.index(branch)
            if fortune_index < len(fortune_names):
                result[branch] = fortune_names[fortune_index]
    
    return result


def calculate_gan_combinations(saju: Dict) -> List[Dict]:
    """천간 합 계산"""
    combinations = []
    
    gan_combinations = {
        '갑': {'partner': '기', 'result': '토'},
        '을': {'partner': '경', 'result': '금'},
        '병': {'partner': '신', 'result': '수'},
        '정': {'partner': '임', 'result': '목'},
        '무': {'partner': '계', 'result': '화'}
    }
    
    stems = [
        {'name': 'year', 'stem': saju['yearStem']},
        {'name': 'month', 'stem': saju['monthStem']},
        {'name': 'day', 'stem': saju['dayStem']},
        {'name': 'hour', 'stem': saju['hourStem']}
    ]
    
    for i in range(len(stems)):
        for j in range(i + 1, len(stems)):
            stem1 = stems[i]['stem']
            stem2 = stems[j]['stem']
            
            if stem1 in gan_combinations and gan_combinations[stem1]['partner'] == stem2:
                combinations.append({
                    'gan1': stem1,
                    'gan2': stem2,
                    'result': gan_combinations[stem1]['result']
                })
            elif stem2 in gan_combinations and gan_combinations[stem2]['partner'] == stem1:
                combinations.append({
                    'gan1': stem2,
                    'gan2': stem1,
                    'result': gan_combinations[stem2]['result']
                })
    
    return combinations


def calculate_branch_relations(saju: Dict) -> List[Dict]:
    """지지 관계 계산"""
    relations = []
    
    branches = [
        {'name': 'year', 'branch': saju['yearBranch']},
        {'name': 'month', 'branch': saju['monthBranch']},
        {'name': 'day', 'branch': saju['dayBranch']},
        {'name': 'hour', 'branch': saju['hourBranch']}
    ]
    
    # 6합
    six_combinations = {
        '자': '축', '축': '자',
        '인': '해', '해': '인',
        '묘': '술', '술': '묘',
        '진': '유', '유': '진',
        '사': '신', '신': '사',
        '오': '미', '미': '오'
    }
    
    # 3합
    three_combinations = [
        ['인', '오', '술'],
        ['해', '묘', '미'],
        ['사', '유', '축'],
        ['신', '자', '진']
    ]
    
    # 충
    chung_pairs = {
        '자': '오', '오': '자',
        '축': '미', '미': '축',
        '인': '신', '신': '인',
        '묘': '유', '유': '묘',
        '진': '술', '술': '진',
        '사': '해', '해': '사'
    }
    
    # 형
    hyeong_pairs = [
        ['인', '사', '신'],
        ['자', '묘'],
        ['축', '진', '미', '술'],
        ['해', '해']
    ]
    
    # 해
    hae_pairs = {
        '자': '미', '미': '자',
        '축': '오', '오': '축',
        '인': '신', '신': '인',
        '묘': '진', '진': '묘',
        '사': '해', '해': '사',
        '유': '술', '술': '유'
    }
    
    for i in range(len(branches)):
        for j in range(i + 1, len(branches)):
            b1 = branches[i]['branch']
            b2 = branches[j]['branch']
            
            # 6합
            if six_combinations.get(b1) == b2:
                relations.append({
                    'type': '합',
                    'branch1': b1,
                    'branch2': b2,
                    'description': f'{b1}{b2} 6합'
                })
            
            # 3합
            for trio in three_combinations:
                if b1 in trio and b2 in trio:
                    third = [b for b in trio if b != b1 and b != b2][0]
                    relations.append({
                        'type': '합',
                        'branch1': b1,
                        'branch2': b2,
                        'description': f'{b1}{b2}{third} 3합({"".join(trio)}국)'
                    })
                    break
            
            # 충
            if chung_pairs.get(b1) == b2:
                relations.append({
                    'type': '충',
                    'branch1': b1,
                    'branch2': b2,
                    'description': f'{b1}{b2} 충'
                })
            
            # 형
            for hyeong_group in hyeong_pairs:
                if b1 in hyeong_group and b2 in hyeong_group:
                    relations.append({
                        'type': '형',
                        'branch1': b1,
                        'branch2': b2,
                        'description': f'{b1}{b2} 형'
                    })
                    break
            
            # 해
            if hae_pairs.get(b1) == b2:
                relations.append({
                    'type': '해',
                    'branch1': b1,
                    'branch2': b2,
                    'description': f'{b1}{b2} 해'
                })
    
    return relations


def calculate_myeongri(saju: Dict) -> Dict:
    """전체 명리 데이터 계산"""
    five_elements = calculate_five_elements(saju)
    sip_sung = calculate_sip_sung(saju)
    twelve_fortune = calculate_twelve_fortune(saju['dayStem'])
    gan_combinations = calculate_gan_combinations(saju)
    branch_relations = calculate_branch_relations(saju)
    
    # 키워드 추출
    keywords = []
    
    keywords.append(f"{saju['dayStem']}{STEM_FIVE_ELEMENTS[saju['dayStem']]} 일간")
    
    # 오행 분포 키워드
    max_element = max(five_elements.items(), key=lambda x: x[1])
    if max_element[1] >= 3:
        keywords.append(f"{max_element[0]} 기운이 강한 사주")
    
    min_element = min([(k, v) for k, v in five_elements.items() if v > 0], key=lambda x: x[1], default=None)
    if min_element and min_element[1] <= 1:
        keywords.append(f"{min_element[0]} 기운이 약한 사주")
    
    # 합충 관계 키워드
    for combo in gan_combinations:
        keywords.append(f"{combo['gan1']}{combo['gan2']} 합")
    
    for rel in branch_relations:
        if rel['type'] == '합':
            keywords.append(rel['description'])
        elif rel['type'] == '충':
            keywords.append(rel['description'])
    
    # 12운성 키워드
    day_fortune = twelve_fortune.get(saju['dayBranch'])
    if day_fortune in ['제왕', '건록']:
        keywords.append(f"{day_fortune} 중심")
    
    return {
        'fiveElements': five_elements,
        'sipSung': sip_sung,
        'twelveFortune': twelve_fortune,
        'ganjiRelations': {
            'ganCombinations': gan_combinations,
            'branchRelations': branch_relations
        },
        'keywords': keywords
    }
