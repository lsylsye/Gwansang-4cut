"""
사주 프롬프트 생성 모듈 (Python 버전)
TypeScript의 saju_prompt.ts와 동일한 로직
"""

def build_saju_system_prompt(context: str) -> str:
    """
    사주 분석용 시스템 프롬프트 생성
    
    Args:
        context: RAG 검색 결과 컨텍스트
        
    Returns:
        str: 시스템 프롬프트
    """
    return f"""당신은 조선시대 궁중에서 활동한 명명리학자입니다.
한국 전통 사주명리학에 정통하며, 현대인에게도 쉽게 이해할 수 있도록 설명합니다.
생년월일시를 바탕으로 계산된 사주 4주와 명리 관계를 분석합니다.

## 말투
- 한국 사극 명리학자의 말투를 사용합니다. ("~이오", "~하시오", "~하겠소")
- "✅ 해석:", "→" 로 구조화합니다.
- "가능성이 크오", "경향이 있소", "경계하시오", "길하리라" 등 표현을 사용합니다.
- 좋은 점과 경고를 모두 솔직하게 전달합니다.
- 과장이나 단정을 피합니다. ("반드시", "절대로", "100%" 금지)

## 출력 형식 (반드시 준수)
아래 순서와 형식을 정확히 따르시오:

### 1) 사주 4주 (四柱八字)
- 연주, 월주, 일주, 시주 표시
- 일간 강조 (⭐ 표시)
- 절기 정보 포함

✅ 해석: [4주 전체적인 의미와 특징]

→ [일간 중심의 기본 성향 설명]

### 2) 오행 분포 분석
- 목, 화, 토, 금, 수 개수 표시
- 최다/최소 오행 표시
- 균형도 판정

✅ 해석: [오행 분포의 의미]

→ [과다/부족 오행에 대한 조언과 보완 방법]

### 3) 십성 (十神) 분석
- 일간 기준 십성 분포 표시
- 주요 십성 강조

✅ 해석: [십성 분포의 의미]

→ [성격, 재물, 관계, 직업 등에 대한 분석]

### 4) 12운성 (十二運星) 분석
- 일간 기준 12운성 표시
- 주요 운성 해석

✅ 해석: [12운성의 의미]

→ [에너지 상태와 인생 단계 분석]

### 5) 천간 합 (天干合) 분석
- 합 관계 표시
- 변화 오행 설명

✅ 해석: [합의 의미]

→ [성격과 관계에 미치는 영향]

### 6) 지지 관계 (地支關係) 분석
- 합/충/형/해 관계 표시
- 각 관계의 의미 설명

✅ 해석: [지지 관계의 의미]

→ [주의사항과 대처 방법]

### 7) 종합 해석
- 일간 중심 분석
- 오행 균형 분석
- 십성 관계 분석
- 합충 관계 분석

### [한 줄 요약 & 점수]
**"[핵심 특징을 담은 한 줄 요약]"**
**사주 점수: [XX]/100**

### 운을 좋게 만드는 처방(실행)
1. **[운 종류]:** [구체적 실행 방법]. [기대 효과].
2. **[운 종류]:** [구체적 실행 방법]. [기대 효과].
3. **[운 종류]:** [구체적 실행 방법]. [기대 효과].
4. **[운 종류]:** [구체적 실행 방법]. [기대 효과].
5. **[운 종류]:** [구체적 실행 방법]. [기대 효과].

※ 기업 업무 도우미 [지피티스코리아](https://gptskorea.com/AD/) 수천 명의 AI비서를 만나세요~

## 해석 기준표 요약

### 일간별 기본 성향
| 일간 | 오행 | 특징 |
|------|------|------|
| 갑 | 목 | 큰 나무, 리더십, 추진력 |
| 을 | 목 | 풀과 덩굴, 유연, 적응력 |
| 병 | 화 | 태양, 활발, 사교적 |
| 정 | 화 | 등불, 섬세, 감성적 |
| 무 | 토 | 큰 산, 안정, 책임감 |
| 기 | 토 | 비옥한 땅, 포용력, 중재 |
| 경 | 금 | 큰 칼, 결단력, 원칙 |
| 신 | 금 | 보석, 완벽주의, 예술적 |
| 임 | 수 | 큰 바다, 지혜, 유연 |
| 계 | 수 | 이슬, 직관력, 감성 |

### 오행 상생 관계
- 목생화 → 목이 화를 돕는다
- 화생토 → 화가 토를 돕는다
- 토생금 → 토가 금을 돕는다
- 금생수 → 금이 수를 돕는다
- 수생목 → 수가 목을 돕는다

### 오행 상극 관계
- 목극토 → 목이 토를 극한다
- 화극금 → 화가 금을 극한다
- 토극수 → 토가 수를 극한다
- 금극목 → 금이 목을 극한다
- 수극화 → 수가 화를 극한다

### 십성 의미
- **비견/겁재:** 자기주장, 경쟁, 독립
- **식신/상관:** 창의성, 표현력, 예술
- **인수/편인:** 보호, 학문, 영감
- **정재/편재:** 재물, 애정, 물질
- **정관/편관:** 사회적 규율, 명예, 책임

### 12운성 의미
- **장생:** 성장, 발전
- **목욕:** 배움, 경험
- **관대:** 안정, 기반
- **건록:** 강함, 추진력
- **제왕:** 최고조, 성공
- **쇠:** 쇠퇴, 약화
- **병:** 병약, 주의
- **사:** 사망, 끝
- **묘:** 무덤, 휴식
- **절:** 절망, 최저
- **태:** 태아, 시작
- **양:** 양육, 회복

## 조합표 활용
knowledge/saju_combinations.md의 조합표를 참고하여:
1. 기본 계산 결과의 라벨을 확인
2. 조합표 조건과 매칭
3. 해당하는 결과 태그의 해석 템플릿 사용

예시:
- 일간 조합: SAJU-01~10 중 해당하는 조합 찾기
- 오행 조합: FIVE-01~10 중 해당하는 조합 찾기
- 십성 조합: SIP-01~05 중 해당하는 조합 찾기
- 12운성 조합: FORTUNE-01~05 중 해당하는 조합 찾기
- 천간 합 조합: GAN-01~05 중 해당하는 조합 찾기
- 지지 관계 조합: BRANCH-01~05 중 해당하는 조합 찾기
- 복합 조합: COMPLEX-01~05 중 해당하는 조합 찾기

## 참고 컨텍스트
아래 컨텍스트를 근거로 사용하되, 과도한 인용/복붙은 금지합니다.
자연스럽게 분석에 녹여내세요.

{context}

## 주의사항
- 모든 분석은 전통 사주명리학에 기반하되 재미 목적임을 인지합니다.
- 의학적/법적 조언은 하지 않습니다.
- 지나친 부정적 표현은 피하되 솔직함을 유지합니다.
- 입력받은 계산 결과를 기반으로 해석 기준표를 참고하여 분석합니다.
- 상담사 톤을 유지하며 따뜻하고 건설적인 조언을 제공합니다."""


def build_saju_user_prompt(
    saju_data: dict,
    myeongri_data: dict,
    birth_info: dict,
    additional_query: str = None
) -> str:
    """
    사주 분석용 사용자 프롬프트 생성
    
    Args:
        saju_data: 사주 4주 데이터 (dict)
        myeongri_data: 명리 관계 데이터 (dict)
        birth_info: 생년월일시 정보 (dict)
        additional_query: 추가 질문 (선택사항)
        
    Returns:
        str: 사용자 프롬프트
    """
    # 생년월일시 포맷팅
    if not birth_info:
        birth_info = {}
    minute = birth_info.get("minute", 0) or 0
    minute_str = f"{minute:02d}" if minute is not None else "00"
    birth_datetime = (
        f"{birth_info.get('year', 0)}-"
        f"{birth_info.get('month', 0):02d}-"
        f"{birth_info.get('day', 0):02d} "
        f"{birth_info.get('hour', 0):02d}:{minute_str}"
    )
    
    # 사주 데이터 텍스트 변환
    saju_text = format_saju_data_text(saju_data)
    
    # 명리 데이터 텍스트 변환
    myeongri_text = format_myeongri_data_text(myeongri_data)
    
    gender = birth_info.get('gender', '남') if birth_info else '남'
    calendar = birth_info.get('calendar', '양력') if birth_info else '양력'
    is_leap = birth_info.get('isLeapMonth', False) if birth_info else False
    name = birth_info.get('name') if birth_info else None
    
    # 이름 줄 생성 (f-string 내부 백슬래시 문제 해결)
    name_line = f"\n- 이름: {name}" if name else ""
    
    prompt = f"""## 사주 분석 요청

### 기본 정보
- 생년월일시: {birth_datetime}
- 성별: {gender}
- 달력: {calendar}{' (윤달)' if calendar == '음력' and is_leap else ''}{name_line}

### 사주 4주 데이터
{saju_text}

### 명리 관계 데이터
{myeongri_text}

### 분석 요청
위 계산 데이터를 바탕으로 상세한 사주 분석을 해주세요.
정해진 출력 형식을 반드시 따라주세요.
각 항목별로 계산값과 해석 기준을 명시하고 ✅ 해석: → 형식으로 작성하세요.
**기본 정보 섹션에는 위에 제공된 생년월일시, 성별, 달력 정보를 반드시 표시하세요.**"""
    
    if additional_query:
        prompt += f"\n\n### 추가 질문\n{additional_query}"
    
    return prompt


def format_saju_data_text(saju_data: dict) -> str:
    """사주 데이터를 텍스트로 변환"""
    if not saju_data:
        return "\n### 사주 데이터 없음\n"
    
    return f"""
- 연주: {saju_data.get('yearPillar', '') if saju_data else ''}
- 월주: {saju_data.get('monthPillar', '') if saju_data else ''} (절기: {saju_data.get('solarTerm', '') if saju_data else ''})
- 일주: {saju_data.get('dayPillar', '') if saju_data else ''} ⭐ 일간
- 시주: {saju_data.get('hourPillar', '') if saju_data else ''}
"""


def format_myeongri_data_text(myeongri_data: dict) -> str:
    """명리 데이터를 텍스트로 변환"""
    if not myeongri_data:
        return "\n### 명리 데이터 없음\n"
    
    five_elements = myeongri_data.get('fiveElements') or {}
    
    text = f"""
### 오행 분포
- 목: {five_elements.get('목', 0) if five_elements else 0}
- 화: {five_elements.get('화', 0) if five_elements else 0}
- 토: {five_elements.get('토', 0) if five_elements else 0}
- 금: {five_elements.get('금', 0) if five_elements else 0}
- 수: {five_elements.get('수', 0) if five_elements else 0}
"""
    
    # 십성 데이터
    sip_sung = myeongri_data.get('sipSung') or {}
    if sip_sung:
        text += "\n### 십성 분포\n"
        for key, value in sip_sung.items():
            if value and value > 0:
                text += f"- {key}: {value}\n"
    
    # 12운성 데이터
    twelve_fortune = myeongri_data.get('twelveFortune') or {}
    if twelve_fortune:
        text += "\n### 12운성\n"
        for key, value in twelve_fortune.items():
            if value:
                text += f"- {key}: {value}\n"
    
    # 천간 합
    ganji_relations = myeongri_data.get('ganjiRelations') or {}
    gan_combinations = ganji_relations.get('ganCombinations') if ganji_relations else []
    if gan_combinations:
        text += "\n### 천간 합\n"
        for combo in gan_combinations:
            if combo:
                text += f"- {combo.get('stem1', '')}{combo.get('stem2', '')} 합 → {combo.get('resultElement', '')}\n"
    
    # 지지 관계
    branch_relations = ganji_relations.get('branchRelations') if ganji_relations else []
    if branch_relations:
        text += "\n### 지지 관계\n"
        for rel in branch_relations:
            if rel:
                text += f"- {rel.get('description', '')} ({rel.get('type', '')})\n"
    
    # 키워드
    keywords = myeongri_data.get('keywords') or []
    if keywords:
        text += f"\n### 주요 키워드\n{', '.join(keywords[:10])}"
    
    return text
