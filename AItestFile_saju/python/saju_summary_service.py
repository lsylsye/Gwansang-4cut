"""
사주 총평 생성 서비스 모듈 (LLM-based)
사주 데이터를 기반으로 LLM을 호출하여 종합 총평을 생성합니다.
"""

from typing import Dict, Any, Optional
import json
import re


def build_saju_summary_prompt(saju_data: Dict[str, Any]) -> str:
    """
    사주 총평용 시스템 프롬프트 생성
    
    Args:
        saju_data: 사주 데이터 (gender, birthDate, birthTime 등)
        
    Returns:
        str: 시스템 프롬프트
    """
    return """당신은 한국 전통 사주명리학에 정통한 명리학자입니다.
사용자의 사주 정보를 바탕으로 종합적인 운세 총평을 작성합니다.

## 분석 원칙
1. 사주팔자의 오행 균형을 분석합니다.
2. 일간(日干)을 중심으로 성격과 기질을 파악합니다.
3. 십성(十神)의 분포로 삶의 방향성을 분석합니다.
4. 천간합, 지지합/충/형 관계를 고려합니다.

## 말투
- 사극 명리학자의 말투를 사용합니다. ("~이오", "~하시오", "~하겠소", "~있소")
- 과장이나 단정을 피합니다.
- 긍정적이면서도 현실적인 조언을 합니다.

## 출력 형식 (반드시 JSON 형식으로 출력)
다음 JSON 형식으로만 응답하시오. 다른 텍스트는 포함하지 마시오:

```json
{
  "harmony": "각 부위(눈, 코, 입, 이마, 턱 등)의 조화와 상생/상극 관계를 분석한 내용. 예: 눈이 강한데 입이 약하면 판단은 정확하나 표현력이 부족하여 소통에 약할 수 있다는 식의 분석. 3-4문장.",
  "comprehensive": "사주팔자를 종합적으로 해석한 인생 흐름, 성격적 기질, 운세의 전체적인 그림. 일간 중심의 기본 성향, 강점, 주의점을 포함. 4-5문장.",
  "improvement": "운명은 고정된 것이 아니므로 타고난 기운을 어떻게 보완하고 발전시킬 수 있는지에 대한 구체적인 조언과 실천 방법. 3-4문장."
}
```

## 주의사항
- 반드시 위의 JSON 형식으로만 응답하시오.
- 각 항목은 2-4문장으로 작성합니다.
- 전문 용어는 쉽게 풀어서 설명합니다.
- 구체적이고 실용적인 내용을 담습니다."""


def build_saju_user_prompt_for_summary(saju_data: Dict[str, Any]) -> str:
    """
    사주 총평용 사용자 프롬프트 생성
    
    Args:
        saju_data: 사주 데이터
        
    Returns:
        str: 사용자 프롬프트
    """
    gender = saju_data.get('gender', 'unknown')
    calendar_type = saju_data.get('calendarType', 'solar')
    birth_date = saju_data.get('birthDate', '')
    birth_time = saju_data.get('birthTime', '')
    birth_time_unknown = saju_data.get('birthTimeUnknown', False)
    
    # 성별 변환
    gender_str = "남성" if gender in ['male', '남', '남성'] else "여성" if gender in ['female', '여', '여성'] else "미상"
    
    # 달력 유형 변환
    calendar_str = "양력" if calendar_type in ['solar', '양력'] else "음력"
    
    # 시간 정보
    time_str = "시간 미상" if birth_time_unknown or not birth_time else birth_time
    
    prompt = f"""다음 정보를 바탕으로 사주 총평을 작성해주세요.

## 기본 정보
- 성별: {gender_str}
- 생년월일: {birth_date} ({calendar_str})
- 태어난 시간: {time_str}
"""
    
    # 추가 사주 데이터가 있으면 포함
    if 'yearPillar' in saju_data:
        prompt += f"""
## 사주 정보
- 연주(年柱): {saju_data.get('yearPillar', 'N/A')}
- 월주(月柱): {saju_data.get('monthPillar', 'N/A')}
- 일주(日柱): {saju_data.get('dayPillar', 'N/A')}
- 시주(時柱): {saju_data.get('hourPillar', 'N/A')}
"""
    
    if 'fiveElements' in saju_data:
        five_elements = saju_data['fiveElements']
        prompt += f"""
## 오행 분포
- 목(木): {five_elements.get('목', 0)}개
- 화(火): {five_elements.get('화', 0)}개
- 토(土): {five_elements.get('토', 0)}개
- 금(金): {five_elements.get('금', 0)}개
- 수(水): {five_elements.get('수', 0)}개
"""
    
    prompt += """
위 정보를 종합하여 JSON 형식으로 총평을 작성해주세요.
반드시 harmony, comprehensive, improvement 세 가지 키를 포함한 JSON 객체로 응답하시오."""
    
    return prompt


def parse_total_review(llm_response: str) -> Dict[str, str]:
    """
    LLM 응답에서 totalReview JSON을 파싱
    
    Args:
        llm_response: LLM이 생성한 텍스트
        
    Returns:
        harmony, comprehensive, improvement 키를 포함한 딕셔너리
    """
    # JSON 블록 추출 시도
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', llm_response)
    if json_match:
        json_str = json_match.group(1)
    else:
        # JSON 블록이 없으면 전체 텍스트에서 JSON 객체 찾기
        json_match = re.search(r'\{[\s\S]*"harmony"[\s\S]*"comprehensive"[\s\S]*"improvement"[\s\S]*\}', llm_response)
        if json_match:
            json_str = json_match.group(0)
        else:
            # JSON을 찾지 못하면 기본값 반환
            return {
                "harmony": llm_response[:len(llm_response)//3] if llm_response else "분석 결과를 생성하지 못했습니다.",
                "comprehensive": llm_response[len(llm_response)//3:2*len(llm_response)//3] if llm_response else "분석 결과를 생성하지 못했습니다.",
                "improvement": llm_response[2*len(llm_response)//3:] if llm_response else "분석 결과를 생성하지 못했습니다."
            }
    
    try:
        result = json.loads(json_str)
        # 필수 키 확인
        if all(key in result for key in ['harmony', 'comprehensive', 'improvement']):
            return {
                "harmony": result['harmony'],
                "comprehensive": result['comprehensive'],
                "improvement": result['improvement']
            }
    except json.JSONDecodeError:
        pass
    
    # 파싱 실패 시 기본값
    return {
        "harmony": "각 부위의 조화 분석을 생성하지 못했습니다.",
        "comprehensive": "종합적인 해석을 생성하지 못했습니다.",
        "improvement": "개선 조언을 생성하지 못했습니다."
    }


def _safe_int(value: Any, default: int) -> int:
    """빈 문자열·None·비숫자 시 default 반환 (사주 계산 시 int() 오류 방지)"""
    if value is None:
        return default
    s = str(value).strip()
    if not s:
        return default
    try:
        return int(s)
    except (ValueError, TypeError):
        return default


def parse_birth_info(saju_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    사주 데이터에서 생년월일시 정보 파싱
    
    Args:
        saju_data: 프론트엔드에서 전달받은 사주 데이터
        
    Returns:
        사주 계산용 birth_info 딕셔너리
    """
    birth_date = saju_data.get('birthDate') or ''
    birth_time = saju_data.get('birthTime') or ''
    
    # 날짜 파싱 (YYYY.MM.DD / YYYY-MM-DD / YYYY/MM/DD 지원)
    year, month, day = 1990, 1, 1
    if birth_date and isinstance(birth_date, str):
        parts = re.split(r'[.\-\/]', str(birth_date).strip())
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 3:
            year = _safe_int(parts[0], 1990)
            month = _safe_int(parts[1], 1)
            day = _safe_int(parts[2], 1)
    
    # 시간 파싱 (빈 문자열·':'만 있는 경우 기본값 사용)
    hour, minute = 12, 0
    if birth_time and isinstance(birth_time, str) and not saju_data.get('birthTimeUnknown', False):
        time_parts = str(birth_time).strip().split(':')
        if len(time_parts) >= 2:
            hour = _safe_int(time_parts[0], 12)
            minute = _safe_int(time_parts[1], 0)
    
    # 성별 변환
    gender = saju_data.get('gender', 'male')
    if gender in ['male', '남성', '남']:
        gender_kr = '남'
    elif gender in ['female', '여성', '여']:
        gender_kr = '여'
    else:
        gender_kr = '남'  # 기본값
    
    # 달력 유형 변환
    calendar_type = saju_data.get('calendarType', 'solar')
    calendar_kr = '양력' if calendar_type in ['solar', '양력'] else '음력'
    
    return {
        'year': year,
        'month': month,
        'day': day,
        'hour': hour,
        'minute': minute,
        'gender': gender_kr,
        'calendar': calendar_kr,
        'isLeapMonth': saju_data.get('isLeapMonth', False)
    }
