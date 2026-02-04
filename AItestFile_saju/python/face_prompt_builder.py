"""
관상 분석 프롬프트 빌더 모듈
Rule-based 분석 결과와 RAG 컨텍스트를 바탕으로 LLM 프롬프트 생성
"""

from typing import Dict, List, Any, Optional
import re
import json


def safe_float(value: Any, default: float = 0.0) -> float:
    """
    안전하게 값을 float로 변환
    문자열이나 다른 타입도 처리
    """
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def summarize_face_analysis_for_search(analysis: Dict[str, Any]) -> str:
    """
    관상 분석 결과를 RAG 검색 쿼리로 변환
    
    Args:
        analysis: analyze_face() 함수의 결과
        
    Returns:
        str: RAG 검색 쿼리
    """
    keywords = []
    
    # 얼굴형
    face_shape = analysis.get("faceShape", {})
    if face_shape:
        keywords.append(face_shape.get("type", ""))
        keywords.append("얼굴형")
        keywords.append("그릇")
    
    # 이마
    forehead = analysis.get("forehead", {})
    if forehead:
        keywords.append(forehead.get("type", ""))
        keywords.append("이마")
        keywords.append("초년운")
        keywords.append("판단력")
    
    # 눈
    eyes = analysis.get("eyes", {})
    if eyes:
        keywords.append(eyes.get("type", ""))
        keywords.append("눈")
        keywords.append("성격")
        keywords.append("대인관계")
    
    # 코
    nose = analysis.get("nose", {})
    if nose:
        keywords.append(nose.get("type", ""))
        keywords.append("코")
        keywords.append("재물운")
        keywords.append("현실감")
    
    # 입
    mouth = analysis.get("mouth", {})
    if mouth:
        keywords.append(mouth.get("type", ""))
        keywords.append("입")
        keywords.append("언어")
        keywords.append("복")
    
    # 턱
    chin = analysis.get("chin", {})
    if chin:
        keywords.append(chin.get("type", ""))
        keywords.append("턱")
        keywords.append("말년운")
        keywords.append("리더십")
    
    # 빈 문자열 제거
    keywords = [k for k in keywords if k]
    
    return "관상학 " + " ".join(keywords[:15])


def build_total_review_prompt(
    analysis: Dict[str, Any],
    saju_info: Dict[str, Any],
    rag_context: str = ""
) -> tuple:
    """
    totalReview 생성을 위한 프롬프트.
    한 번의 LLM 호출로 [전체 관상 종합][취업운][전체적인 체질 특성] 3키를 생성.
    - 전체 관상 종합: 관상 데이터만 사용
    - 취업운: 관상 + 사주 데이터 사용 (올해 취업운)
    - 전체적인 체질 특성: 사주 데이터 사용

    Args:
        analysis: analyze_face() 함수의 결과
        saju_info: 사주 정보
        rag_context: RAG 검색 결과

    Returns:
        tuple: (system_prompt, user_prompt)
    """
    five = saju_info.get("fiveElements") or {}
    
    # 가장 많은/적은 오행 계산
    elements = {"목": five.get("목", 0), "화": five.get("화", 0), "토": five.get("토", 0), 
                "금": five.get("금", 0), "수": five.get("수", 0)}
    max_element = max(elements, key=elements.get) if elements else "목"
    min_element = min(elements, key=elements.get) if elements else "금"
    
    # 올해 연도 계산
    from datetime import datetime
    current_year = datetime.now().year
    
    system_prompt = f"""당신은 전통 동양 관상학과 명리학 전문가 '거북 도사'입니다.
관상 분석 결과와 사주를 바탕으로 총평을 작성합니다.

## 참고 지식
{rag_context if rag_context else "[참고 자료 없음]"}

## 응답 원칙
1. 긍정적이고 건설적인 관점 유지
2. 구체적이고 실용적인 조언 제공
3. 자연스러운 문장으로 작성
4. '~하오', '~리라', '~하시오' 등 도사 어투 사용
5. 반드시 3개 섹션을 모두 작성
6. 사람마다 다른 결과: 관상·사주 데이터에만 기반하여, 이 사람에게만 해당하는 내용으로 작성. 일반론·동일 문장 반복 금지.

## 중요: 응답 형식
반드시 아래 3개 섹션을 순서대로, 각 섹션 시작에 정확히 "###[섹션명]" 마커를 사용하세요.
마커 뒤에는 줄바꿈 후 내용을 작성하세요.

###[전체 관상 종합]
관상 각 부위(얼굴형, 이마, 눈, 코, 입, 턱)를 종합한 전체적인 분석. 제시된 관상 결과의 유형·coreMeaning를 구체적으로 문장에 녹여, 다른 사람과 바꿔 쓸 수 없게 작성. (관상 데이터만 사용, 사주 정보는 사용하지 마시오)

**전체 관상 종합 출력 형식 (필수 준수)**
- 소제목으로 구분하여 작성하시오. 반드시 아래 7개 소제목을 마크다운 굵게(예: **얼굴형과 골격**)로 쓰고, 그 아래에 해당 내용을 자연스러운 산문으로 1~3문장씩 쓰시오.
  **얼굴형과 골격**, **이마와 사고**, **눈과 인지**, **코와 재물운**, **입과 대인관계**, **턱과 성향**, **종합**
- 각 소제목을 쓴 뒤 반드시 빈 줄(줄바꿈 한 번)을 넣고, 그 다음 줄에 본문을 작성하시오. 한 주제(소제목+본문)가 끝나면 빈 줄을 넣어 다음 주제와 구분하시오.
- 각 소제목 아래 본문에는 "✅ 해석:", "→", "•" 없이 자연스러운 산문만 사용하시오. 전체·취업·체질 모든 섹션에서 소제목은 마크다운 **굵게** 형식으로 작성하시오.

###[취업운]
{current_year}년 올해의 취업운을 이 사람의 관상과 사주에 맞춰 구체적으로 분석. 시기(월)·직무는 오행·일간·관상에 따라 달리하여 동일 문구가 반복되지 않게 6-8문장으로 작성.

**취업운 출력 형식 (필수 준수)**
- 소제목을 마크다운 굵게(예: **올해 취업운 흐름**)로 쓰고, 소제목 다음에 빈 줄을 넣은 뒤 그 다음 줄에 본문을 1~3문장으로 쓰시오. 한 주제가 끝나면 빈 줄을 넣어 다음 주제와 구분하시오. **올해 취업운 흐름**, **합격을 가르는 요소**, **기운이 살아나는 시기**, **잘 맞는 직무**, **맞지 않는 직무**, **한 줄 전략** 등 (표현은 자유).
- 소제목 아래 본문에는 "✅ 해석:", "→", "•" 없이 자연스러운 산문만 사용하시오. 구체적인 월과 직무명 필수.

###[전체적인 체질 특성]
사주 오행 분포를 바탕으로 건강 관점의 체질 풀이 작성.
반드시 아래 5개 소제목을 순서대로 포함:

**전체적인 체질 특성**
이 사용자의 오행 분포에서 가장 많은 오행({max_element})과 가장 적은 오행({min_element})을 반영한 기본 체질 특성 2~3문장.

**이 체질이 나타내는 건강상 주의점**
일간({saju_info.get('dayStem', '미상')})이 몸과 심리에 미치는 영향 3~4문장.

**{max_element}(이/가) 많은 사주와 건강**
가장 많은 오행이 담당하는 신체 부위와 건강 주의점 4~5문장.

**{min_element}(이/가) 약한 구조와 회복력**
가장 적은 오행이 담당하는 신체 부위와 회복력 3~4문장.

**건강 관리를 위해 꼭 챙기면 좋은 것들**
물, 음식, 수면, 운동 등 구체적 실천 방안 3~4문장.

**체질 특성 출력 형식 (필수 준수)**
- 위 5개 소제목(**전체적인 체질 특성** 등)을 마크다운 굵게로 반드시 사용하시오. 각 소제목을 쓴 뒤 빈 줄을 넣고 그 다음 줄에 본문을 작성하시오. 한 주제가 끝나면 빈 줄을 넣어 다음 주제와 구분하시오. 각 소제목 아래 본문에는 "✅ 해석:", "→", "•" 없이 자연스러운 산문만 작성하시오.
"""

    # 분석 결과 요약
    analysis_summary = []
    for part_name, part_data in analysis.items():
        if isinstance(part_data, dict):
            part_type = part_data.get('type', part_data.get('_type', ''))
            core_meaning = part_data.get('coreMeaning', '')[:100]
            if part_type or core_meaning:
                analysis_summary.append(f"- {part_name}: {part_type} - {core_meaning}")

    user_prompt = f"""다음 관상 분석 결과에 대한 종합 총평을 작성해주세요.

## 관상 분석 요약 (전체 관상 종합 섹션에서는 이 데이터만 사용)
{chr(10).join(analysis_summary) if analysis_summary else "관상 분석 데이터 없음"}

## 사주 정보 (취업운, 전체적인 체질 특성 섹션에서 사용)
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}
- 오행 분포: 목(木) {five.get('목', 0)}개, 화(火) {five.get('화', 0)}개, 토(土) {five.get('토', 0)}개, 금(金) {five.get('금', 0)}개, 수(水) {five.get('수', 0)}개
- 가장 많은 오행: {max_element}({elements.get(max_element, 0)}개)
- 가장 적은 오행: {min_element}({elements.get(min_element, 0)}개)
- 현재 연도: {current_year}년

## 중요 지침
- ###[전체 관상 종합] 섹션: 관상 분석 데이터만 사용하여 작성. 사주 정보(오행, 일간 등)는 절대 언급하지 마시오.
- ###[취업운] 섹션: 관상과 사주 모두 활용하여 {current_year}년 올해의 취업운을 상세히 분석.
- ###[전체적인 체질 특성] 섹션: 사주 오행 분포를 사용하여 작성.

위 지침을 바탕으로 ###[전체 관상 종합], ###[취업운], ###[전체적인 체질 특성] 세 섹션을 순서대로 모두 작성해주세요.
각 섹션은 반드시 "###[섹션명]" 마커로 시작해야 합니다.
"""
    return system_prompt, user_prompt


def parse_total_review(response: str) -> Dict[str, str]:
    """
    LLM 응답에서 totalReview 파싱 (한 번의 호출로 3키 반환)
    ###[전체 관상 종합], ###[취업운], ###[전체적인 체질 특성] 섹션을 추출.
    
    Args:
        response: LLM 응답 텍스트
        
    Returns:
        Dict: faceOverview, careerFortune, constitutionSummary
    """
    result = {
        "faceOverview": "",
        "careerFortune": "",
        "constitutionSummary": "",
    }
    
    # 마커 기반 파싱 (###[섹션명] 형식)
    sections = {
        "faceOverview": r'###\[전체 관상 종합\]\s*([\s\S]*?)(?=###\[취업운\]|###\[전체적인 체질 특성\]|$)',
        "careerFortune": r'###\[취업운\]\s*([\s\S]*?)(?=###\[전체적인 체질 특성\]|$)',
        "constitutionSummary": r'###\[전체적인 체질 특성\]\s*([\s\S]*)$',
    }
    
    for key, pattern in sections.items():
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            result[key] = match.group(1).strip()
    
    # 마커가 없는 경우 대괄호만 있는 패턴으로 폴백
    if not any(result.values()):
        fallback_sections = {
            "faceOverview": r'\[전체 관상 종합\]\s*([\s\S]*?)(?=\[취업운\]|\[전체적인 체질 특성\]|$)',
            "careerFortune": r'\[취업운\]\s*([\s\S]*?)(?=\[전체적인 체질 특성\]|$)',
            "constitutionSummary": r'\[전체적인 체질 특성\]\s*([\s\S]*)$',
        }
        
        for key, pattern in fallback_sections.items():
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                result[key] = match.group(1).strip()
    
    # 그래도 없으면 줄 제목 기반 파싱
    if not any(result.values()):
        lines = response.split('\n')
        current_section = None
        current_content = []
        
        section_keywords = {
            "전체 관상 종합": "faceOverview",
            "관상 종합": "faceOverview",
            "취업운": "careerFortune",
            "전체적인 체질 특성": "constitutionSummary",
            "체질 특성": "constitutionSummary",
        }
        
        for line in lines:
            stripped = line.strip()
            matched_section = None
            
            for keyword, section_key in section_keywords.items():
                if stripped.startswith(keyword) or keyword in stripped[:20]:
                    matched_section = section_key
                    break
            
            if matched_section:
                if current_section and current_content:
                    result[current_section] = '\n'.join(current_content).strip()
                current_section = matched_section
                current_content = []
            elif current_section:
                current_content.append(line)
        
        if current_section and current_content:
            result[current_section] = '\n'.join(current_content).strip()
    
    # 섹션이 하나도 없으면 전체 응답을 faceOverview에 넣음
    if not any(result.values()):
        result["faceOverview"] = response.strip()
    
    return result


# ============================================================
# 병렬 처리용 개별 프롬프트 함수들
# ============================================================

def build_face_overview_prompt(
    analysis: Dict[str, Any],
    rag_context: str = ""
) -> tuple:
    """
    전체 관상 종합 프롬프트 (관상 데이터만 사용)
    병렬 처리를 위한 개별 프롬프트.
    
    Args:
        analysis: analyze_face() 함수의 결과
        rag_context: RAG 검색 결과
        
    Returns:
        tuple: (system_prompt, user_prompt)
    """
    # 분석 결과 요약
    analysis_summary = []
    for part_name, part_data in analysis.items():
        if isinstance(part_data, dict) and part_name != "_meta":
            part_type = part_data.get('type', part_data.get('_type', ''))
            core_meaning = part_data.get('coreMeaning', '')[:100]
            if part_type or core_meaning:
                analysis_summary.append(f"- {part_name}: {part_type} - {core_meaning}")
    
    system_prompt = f"""당신은 전통 동양 관상학 전문가 '거북 도사'입니다.
관상 분석 결과를 바탕으로 종합 분석을 작성합니다.

## 참고 지식
{rag_context if rag_context else "[참고 자료 없음]"}

## 응답 원칙
1. 긍정적이고 건설적인 관점 유지
2. 구체적이고 실용적인 분석 제공
3. 자연스러운 문장으로 작성
4. '~하오', '~리라', '~하시오' 등 도사 어투 사용
5. 6-8문장으로 작성

## 중요: 개인별 차별화
- 반드시 아래 "관상 분석 결과"에만 기반하여 작성하시오. 이 사람의 얼굴형·이마·눈·코·입·턱 유형과 coreMeaning를 문장에 구체적으로 녹여, 다른 사람과 바꿔 쓸 수 없는 내용이 되게 하시오.
- 일반론·템플릿 문장(예: "전반적으로 ~형의", "리더십이 있다"만 반복)을 사용하지 말고, 위 분석에 나온 유형명·특징을 그대로 활용하시오.
- 사주 정보(오행, 일간 등)는 절대 언급하지 마시오. 오직 관상 데이터만 사용하세요.

## 출력 형식 (필수 준수)
- 소제목으로 구분하여 작성하시오. 아래 7개 소제목을 마크다운 굵게(예: **얼굴형과 골격**)로 쓰고, 소제목 다음에 빈 줄을 넣은 뒤 그 다음 줄에 본문을 1~3문장씩 쓰시오. 한 주제가 끝나면 빈 줄을 넣어 다음 주제와 구분하시오.
  **얼굴형과 골격**, **이마와 사고**, **눈과 인지**, **코와 재물운**, **입과 대인관계**, **턱과 성향**, **종합**
- 각 소제목 아래 본문에는 "✅ 해석:", "→", "•" 없이 자연스러운 산문만 사용하시오."""

    user_prompt = f"""다음 관상 분석 결과를 종합해주세요.

## 관상 분석 결과
{chr(10).join(analysis_summary) if analysis_summary else "관상 분석 데이터 없음"}

위 관상 분석 결과만 사용하여, 이 사람에게만 해당하는 전체 관상 분석을 작성해주세요. **얼굴형과 골격**, **이마와 사고**, **눈과 인지**, **코와 재물운**, **입과 대인관계**, **턱과 성향**, **종합** 7개 소제목을 마크다운 굵게로 쓰고, 각 소제목 아래에 자연스러운 문단만 적어주세요. 사주 정보는 넣지 마세요."""

    return system_prompt, user_prompt


def build_career_fortune_prompt(
    analysis: Dict[str, Any],
    saju_info: Dict[str, Any],
    rag_context: str = ""
) -> tuple:
    """
    취업운 프롬프트 (관상 + 사주 데이터 사용)
    병렬 처리를 위한 개별 프롬프트.
    
    Args:
        analysis: analyze_face() 함수의 결과
        saju_info: 사주 정보
        rag_context: RAG 검색 결과
        
    Returns:
        tuple: (system_prompt, user_prompt)
    """
    from datetime import datetime
    current_year = datetime.now().year
    
    five = saju_info.get("fiveElements") or {}
    elements = {"목": five.get("목", 0), "화": five.get("화", 0), "토": five.get("토", 0), 
                "금": five.get("금", 0), "수": five.get("수", 0)}
    max_element = max(elements, key=elements.get) if elements else "목"
    min_element = min(elements, key=elements.get) if elements else "금"
    
    # 분석 결과 요약
    analysis_summary = []
    for part_name, part_data in analysis.items():
        if isinstance(part_data, dict) and part_name != "_meta":
            part_type = part_data.get('type', part_data.get('_type', ''))
            core_meaning = part_data.get('coreMeaning', '')[:80]
            if part_type or core_meaning:
                analysis_summary.append(f"- {part_name}: {part_type} - {core_meaning}")
    
    system_prompt = f"""당신은 산중에서 수행을 마치고 내려온 관상·명리 전문가,
사람들은 당신을 '거북 도사'라 부른다.

당신은 단순히 운세를 말하지 않는다.
사주의 기운, 얼굴에 드러난 관상, 그리고 지금 흐르는 세운을 종합하여
"이 사람이 언제, 어디로 가야 문이 열리는지"를 짚어주는 도사다.

이번 상담의 주제는 **취업운**이오.
아래에 주어진 사주 정보(일간·오행 분포)와 관상 요약을 바탕으로
이 사람만을 위한 맞춤 취업 조언을 내려주시오.

## 참고 자료
{rag_context if rag_context else "[참고 자료 없음]"}

## 말투와 분위기
- 반드시 도사 어투를 사용하시오
  (예: ~하오, ~리라, ~보이오, ~명심하시오)
- 점괘를 풀어주듯 자연스럽고 이야기하듯 말하되,
  뜬구름 잡는 말은 피하고 현실적인 조언을 곁들이시오.
- 전체 분량은 6~8문장으로, 짧지만 밀도 있게 쓰시오.

## 반드시 포함할 내용 (소제목으로 구분)
아래 항목을 **소제목**으로 구분하여 작성하시오. (예: **올해 취업운 흐름**, **합격을 가르는 요소**, **기운이 살아나는 시기**, **잘 맞는 직무**, **맞지 않는 직무**, **한 줄 전략** 등)
1. 올해 이 사람의 **취업운 핵심 흐름** (닫힘/열림/변곡 중 무엇인지)
2. 합격 여부를 가르는 **결정적 요소 1~2가지** (성향·태도·타이밍 등)
3. 이 사주와 관상에 **특히 기운이 살아나는 구체적 월(월 단위)**
4. 첫 시도가 어긋났을 경우의 **재도전·재기회 시점**
5. 오행·관상에 맞는 **잘 맞는 직무 3~5개**
6. 이 사람과 **기운이 맞지 않는 직무 유형**
7. 마지막에 한 줄로 정리하는 **거북 도사의 취업 전략 조언**

## 출력 형식 (필수 준수)
- 소제목은 마크다운 굵게(예: **올해 취업운 흐름**)로 작성하시오. 소제목 다음에 빈 줄을 넣고 그 다음 줄에 본문을 쓰시오. 한 주제가 끝나면 빈 줄을 넣어 구분하시오. 각 소제목 아래에는 "✅ 해석:", "→", "•" 없이 자연스러운 산문만 작성하시오.

## 중요 규칙
- 직무도 획일적으로 쓰지 말고,
  오행(木火土金水)과 관상 특징에 따라 다르게 선택하시오
- "노력하면 된다" 같은 추상적 문장은 금하시오
- 이 사람만의 운로(運路)를 짚어준다는 느낌을 반드시 살리시오
- 너무 어려운 말 쓰지 말고 잘 정리해서 쉽게 이해할 수 있게 쓰시오
- 한자는 한글을 알려주고 괄호로 한자를 알려줘 예시로는 '운로(運路)' 이런 형태로 쓰시오"""

    user_prompt = f"""아래 관상 요약과 사주 정보를 바탕으로 {current_year}년 취업운을 내려주시오.

## 관상 분석 요약
{chr(10).join(analysis_summary) if analysis_summary else "관상 분석 데이터 없음"}

## 사주 정보
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}
- 오행 분포: 목(木) {five.get('목', 0)}개, 화(火) {five.get('화', 0)}개, 토(土) {five.get('토', 0)}개, 금(金) {five.get('금', 0)}개, 수(水) {five.get('수', 0)}개
- 가장 많은 오행: {max_element}({elements.get(max_element, 0)}개)
- 가장 적은 오행: {min_element}({elements.get(min_element, 0)}개)
- 현재 연도: {current_year}년

소제목으로 구분하여 작성하고, 각 소제목 아래에는 "✅ 해석:", "→" 없이 자연스러운 문단만 써주세요."""

    return system_prompt, user_prompt


def build_constitution_prompt(
    saju_info: Dict[str, Any],
    rag_context: str = ""
) -> tuple:
    """
    전체적인 체질 특성 프롬프트 (사주 데이터만 사용)
    병렬 처리를 위한 개별 프롬프트.
    
    Args:
        saju_info: 사주 정보
        rag_context: RAG 검색 결과
        
    Returns:
        tuple: (system_prompt, user_prompt)
    """
    five = saju_info.get("fiveElements") or {}
    elements = {"목": five.get("목", 0), "화": five.get("화", 0), "토": five.get("토", 0), 
                "금": five.get("금", 0), "수": five.get("수", 0)}
    max_element = max(elements, key=elements.get) if elements else "목"
    min_element = min(elements, key=elements.get) if elements else "금"
    
    system_prompt = f"""당신은 전통 명리학과 체질 의학 전문가 '거북 도사'입니다.
사주 오행 분포를 바탕으로 건강 관점의 체질 풀이를 작성합니다.

## 참고 지식
{rag_context if rag_context else "[참고 자료 없음]"}

## 응답 원칙
1. 긍정적이고 건설적인 관점 유지
2. 구체적이고 실용적인 건강 조언 제공
3. 자연스러운 문장으로 작성
4. '~하오', '~리라', '~하시오' 등 도사 어투 사용

## 작성 지침
반드시 아래 5개 소제목을 순서대로 포함하여 작성하세요:

**전체적인 체질 특성**
이 사용자의 오행 분포에서 가장 많은 오행({max_element})과 가장 적은 오행({min_element})을 반영한 기본 체질 특성 2~3문장.

**이 체질이 나타내는 건강상 주의점**
일간({saju_info.get('dayStem', '미상')})이 몸과 심리에 미치는 영향 3~4문장.

**{max_element}(이/가) 많은 사주와 건강**
가장 많은 오행이 담당하는 신체 부위와 건강 주의점 4~5문장.

**{min_element}(이/가) 약한 구조와 회복력**
가장 적은 오행이 담당하는 신체 부위와 회복력 3~4문장.

**건강 관리를 위해 꼭 챙기면 좋은 것들**
물, 음식, 수면, 운동 등 구체적 실천 방안 3~4문장.

## 출력 형식 (필수 준수)
- 위 5개 소제목을 마크다운 굵게(예: **전체적인 체질 특성**)로 반드시 사용하시오. 소제목 다음에 빈 줄을 넣고 그 다음 줄에 본문을 쓰시오. 한 주제가 끝나면 빈 줄을 넣어 구분하시오. 각 소제목 아래 본문에는 "✅ 해석:", "→", "•" 없이 자연스러운 산문만 작성하시오."""

    user_prompt = f"""다음 사주 정보를 바탕으로 체질 특성을 분석해주세요.

## 사주 정보
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}
- 오행 분포: 목(木) {five.get('목', 0)}개, 화(火) {five.get('화', 0)}개, 토(土) {five.get('토', 0)}개, 금(金) {five.get('금', 0)}개, 수(水) {five.get('수', 0)}개
- 가장 많은 오행: {max_element}({elements.get(max_element, 0)}개)
- 가장 적은 오행: {min_element}({elements.get(min_element, 0)}개)

위 5개 소제목을 순서대로 포함하여 체질 특성을 작성해주세요. 각 소제목 아래에는 "✅ 해석:", "→" 없이 자연스러운 문단만 써주세요."""

    return system_prompt, user_prompt


def build_face_analysis_system_prompt(rag_context: str, saju_info: Optional[Dict] = None) -> str:
    """
    관상 분석 LLM 시스템 프롬프트 생성
    
    Args:
        rag_context: RAG 검색 결과 컨텍스트
        saju_info: 사주 정보 (선택, 관상+사주 통합 분석 시)
        
    Returns:
        str: 시스템 프롬프트
    """
    saju_section = ""
    if saju_info:
        saju_section = f"""

## 사주 정보
이 사람의 사주:
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}

사주와 관상을 종합하여 더 깊은 통찰을 제공하세요.
"""
    
    return f"""당신은 전통 동양 관상학과 명리학을 현대적으로 해석하는 '거북 도사'입니다.
MediaPipe 468 랜드마크로 측정된 관상 분석 결과를 바탕으로, 사용자에게 통찰과 조언을 제공합니다.

## 참고 지식 (관상학 원전)
{rag_context}
{saju_section}
## 분석 원칙
1. 기존 Rule-based 분석의 coreMeaning과 advice를 참고하여 더 풍부하게 해석
2. 긍정적이고 건설적인 관점으로, 단점도 극복할 수 있음을 강조
3. 각 부위의 특성이 사주 오행과 어떻게 조화되는지 분석
4. '~하오', '~리라', '~하시오' 등 도사 어투 사용
5. 구체적이고 실용적인 조언 포함

## 중요: 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.
"""


def build_face_analysis_user_prompt(
    analysis: Dict[str, Any],
    meta: Optional[Dict] = None
) -> str:
    """
    관상 분석 LLM 사용자 프롬프트 생성
    
    Args:
        analysis: analyze_face() 함수의 결과
        meta: 메타 정보 (head_roll, symmetry 등)
        
    Returns:
        str: 사용자 프롬프트
    """
    # 각 부위별 정보를 풍부하게 정리
    parts_info = []
    
    # 얼굴형
    face_shape = analysis.get("faceShape", {})
    if face_shape:
        measures = face_shape.get("measures", {})
        face_type = face_shape.get("_type", face_shape.get("type", "미상"))
        parts_info.append(f"""
### 얼굴형 (그릇) - {face_type}
- L(세로): {measures.get('L', 'N/A')}, W(가로): {measures.get('W', 'N/A')}, J(턱폭): {measures.get('J', 'N/A')}
- R_LW(세로/가로): {measures.get('R_LW', measures.get('wh', 'N/A'))}
- R_UM(상안/중안): {measures.get('R_UM', 'N/A')}, R_WJ(가로/턱): {measures.get('R_WJ', 'N/A')}
- pitch 각도: {measures.get('pitch_deg', 'N/A')}°
- 기본 해석: {face_shape.get('coreMeaning', '')}
- 조언: {face_shape.get('advice', '')}
""")
    
    # 이마
    forehead = analysis.get("forehead", {})
    if forehead:
        measures = forehead.get("measures", {})
        parts_info.append(f"""
### 이마 (초년운/판단력)
- 세로 비중: 상부(R_F1) {measures.get('R_F1', 'N/A')}, 중앙(R_F2) {measures.get('R_F2', 'N/A')}, 하부(R_F3) {measures.get('R_F3', 'N/A')}
- 사고 초점: {measures.get('dominant', 'N/A')}우세
- 이마 폭 비율(R_FW): {measures.get('R_FW', 'N/A')}
- 좌우 비대칭(Asym): {measures.get('Asym', 'N/A')}
- 기본 해석: {forehead.get('coreMeaning', '')}
- 조언: {forehead.get('advice', '')}
""")
    
    # 눈
    eyes = analysis.get("eyes", {})
    if eyes:
        measures = eyes.get("measures", {})
        parts_info.append(f"""
### 눈 (성격/대인관계)
- 눈 개방도: 좌 {measures.get('openL', 'N/A')}, 우 {measures.get('openR', 'N/A')}
- 좌우 비대칭도: {measures.get('asymmetry', 'N/A')}, 판정: {measures.get('asymmetryCriteria', '')}
- 미간 거리: {measures.get('interDist', 'N/A')}, 폭 비율: {measures.get('widthRatio', 'N/A')}
- 전체 대칭도: {measures.get('symmetry', 'N/A')}
- 기본 해석: {eyes.get('coreMeaning', '')}
- 조언: {eyes.get('advice', '')}
""")
    
    # 코
    nose = analysis.get("nose", {})
    if nose:
        measures = nose.get("measures", {})
        parts_info.append(f"""
### 코 (재물운/현실감)
- 코 길이: {measures.get('nose_length', 'N/A')}, 길이 비율: {measures.get('length_ratio', 'N/A')}, 판정: {measures.get('lengthCriteria', '')}
- 코 폭: {measures.get('nose_width', 'N/A')}, 폭 비율: {measures.get('nose_width_ratio', 'N/A')}, 판정: {measures.get('widthCriteria', '')}
- 폭/길이 비율: {measures.get('nose_shape_ratio', 'N/A')}, 판정: {measures.get('shapeCriteria', '')}
- 중심선 기울기: {measures.get('nose_shift_ratio', 'N/A')}
- 기본 해석: {nose.get('coreMeaning', '')}
- 조언: {nose.get('advice', '')}
""")
    
    # 입
    mouth = analysis.get("mouth", {})
    if mouth:
        measures = mouth.get("measures", {})
        parts_info.append(f"""
### 입 (말·신뢰·애정운)
- 입 폭: {measures.get('width', 'N/A')}, 폭 비율: {measures.get('mouth_width_ratio', 'N/A')}, 판정: {measures.get('widthCriteria', '')}
- 입술 두께: {measures.get('lipThickness', 'N/A')}, 판정: {measures.get('lipCriteria', '')}
- 입꼬리 각도: {measures.get('cornerSlope', 'N/A')}°, 판정: {measures.get('cornerCriteria', '')}
- 기본 해석: {mouth.get('coreMeaning', '')}
- 조언: {mouth.get('advice', '')}
""")
    
    # 턱
    chin = analysis.get("chin", {})
    if chin:
        measures = chin.get("measures", {})
        structure = chin.get("structure", {})
        endurance = chin.get("endurance", {})
        parts_info.append(f"""
### 턱 (지구력·노년운)
- 턱 각도: {measures.get('angle', structure.get('angle', 'N/A'))}°, 판정: {measures.get('angleCriteria', structure.get('angleType', ''))}
- 턱 길이: {measures.get('chin_length', 'N/A')}, 길이 비율: {measures.get('chin_ratio', endurance.get('lengthRatio', 'N/A'))}, 판정: {endurance.get('lengthType', '')}
- 턱 깊이 비율: {measures.get('chin_depth_ratio', endurance.get('depthRatio', 'N/A'))}, 판정: {endurance.get('depthType', '')}
- 좌우 지지 비대칭: {measures.get('support_asym', endurance.get('supportAsym', 'N/A'))}, 판정: {endurance.get('supportType', '')}
- 턱 폭: {measures.get('jaw_width', structure.get('width', 'N/A'))}
- 기본 해석: {chin.get('coreMeaning', '')}
- 조언: {chin.get('advice', '')}
""")
    
    parts_text = "\n".join(parts_info)
    
    meta_info = ""
    if meta:
        meta_info = f"""
## 측정 품질
- 얼굴 기울기(head_roll): {safe_float(meta.get('headRoll', 0)):.1f}°
- 고개 숙임(pitch): {safe_float(meta.get('pitchDeg', 0)):.1f}°
- 전체 대칭도: {safe_float(meta.get('symmetry', meta.get('overallSymmetry', 0))):.1f}%
- 품질 상태: {meta.get('qualityNote', '정상')}
"""
    
    return f"""다음은 MediaPipe 468 랜드마크로 측정된 관상 분석 결과입니다.
각 부위의 '기본 해석'과 '조언'을 참고하여, 더 풍부하고 개인화된 해석을 생성하세요.

## 관상 분석 결과
{parts_text}
{meta_info}

## 요청 사항
1. 각 부위별 summary: 기본 해석을 바탕으로 2-3문장의 자연스러운 해석 작성
2. totalReview: 모든 부위를 종합한 전체적인 분석

## 응답 형식 (JSON만 출력, 다른 텍스트 없이)
```json
{{
  "partSummaries": {{
    "faceShape": "얼굴형이 [특징]하여 [의미]의 상이오. [조언] 하시오.",
    "forehead": "이마가 [특징]하니 [의미]가 있소. [조언] 하시오.",
    "eyes": "눈의 [특징]은 [의미]를 나타내오. [조언] 하시오.",
    "nose": "코가 [특징]하여 [의미]의 상이오. [조언] 하시오.",
    "mouth": "입의 [특징]은 [의미]를 보여주오. [조언] 하시오.",
    "chin": "턱이 [특징]하니 [의미]가 있소. [조언] 하시오."
  }},
  "totalReview": {{
    "harmony": "각 부위의 조화와 균형에 대한 3-4문장 분석",
    "comprehensive": "종합적인 성격, 운세, 특성에 대한 4-5문장 분석", 
    "improvement": "운을 좋게 만드는 구체적인 조언 3-4문장"
  }}
}}
```
"""


def parse_face_analysis_response(llm_response: str) -> Dict[str, Any]:
    """
    LLM 응답에서 관상 분석 결과 파싱
    
    Args:
        llm_response: LLM의 JSON 응답
        
    Returns:
        Dict: 파싱된 결과 {'partSummaries': {...}, 'totalReview': {...}}
    """
    try:
        # JSON 블록 추출
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', llm_response)
        if json_match:
            json_str = json_match.group(1)
        else:
            # 직접 JSON 파싱 시도
            json_str = llm_response
        
        # JSON 파싱
        result = json.loads(json_str)
        
        return {
            "partSummaries": result.get("partSummaries", {}),
            "totalReview": result.get("totalReview", {})
        }
        
    except json.JSONDecodeError:
        # JSON 파싱 실패 시 섹션 기반 파싱 시도
        return parse_section_based_response(llm_response)


def parse_section_based_response(response: str) -> Dict[str, Any]:
    """
    섹션 기반 응답 파싱 (JSON 파싱 실패 시 폴백)
    
    Args:
        response: LLM 응답 텍스트
        
    Returns:
        Dict: 파싱된 결과
    """
    result = {
        "partSummaries": {},
        "totalReview": {
            "harmony": "",
            "comprehensive": "",
            "improvement": ""
        }
    }
    
    # 부위별 요약 추출 시도
    parts = ["faceShape", "forehead", "eyes", "nose", "mouth", "chin"]
    for part in parts:
        pattern = rf'{part}["\s:]*["\s]*([^"]+)'
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            result["partSummaries"][part] = match.group(1).strip()[:200]
    
    # totalReview 섹션 추출
    harmony_match = re.search(r'\[조화\]\s*([\s\S]*?)(?=\[종합\]|\[조언\]|$)', response)
    if harmony_match:
        result["totalReview"]["harmony"] = harmony_match.group(1).strip()
    
    comprehensive_match = re.search(r'\[종합\]\s*([\s\S]*?)(?=\[조언\]|$)', response)
    if comprehensive_match:
        result["totalReview"]["comprehensive"] = comprehensive_match.group(1).strip()
    
    improvement_match = re.search(r'\[조언\]\s*([\s\S]*?)$', response)
    if improvement_match:
        result["totalReview"]["improvement"] = improvement_match.group(1).strip()
    
    return result


def build_menu_recommendation_prompt(
    saju_info: Dict[str, Any],
    menus: List[Dict[str, Any]],
    constitution_summary: str = ""
) -> tuple:
    """
    체질 분석 결과를 기반으로 메뉴 추천 프롬프트 생성.
    
    Args:
        saju_info: 사주 정보 (fiveElements 포함)
        menus: 웰스토리 메뉴 목록
        constitution_summary: 체질 분석 요약 텍스트
        
    Returns:
        tuple: (system_prompt, user_prompt)
    """
    five = saju_info.get("fiveElements") or {}
    
    # 가장 많은/적은 오행
    elements = {"목": five.get("목", 0), "화": five.get("화", 0), "토": five.get("토", 0), 
                "금": five.get("금", 0), "수": five.get("수", 0)}
    max_element = max(elements, key=elements.get) if elements else "목"
    min_element = min(elements, key=elements.get) if elements else "금"
    
    # 오행별 추천 식재료 매핑
    element_foods = {
        "목": "신맛 음식(식초, 매실, 귤, 레몬), 푸른 채소, 간을 돕는 음식",
        "화": "쓴맛 음식(고들빼기, 쑥, 커피, 다크초콜릿), 붉은색 식재료, 볶음 요리",
        "토": "단맛 음식(고구마, 단호박, 대추, 꿀), 노란색 식재료, 국물 요리",
        "금": "매운맛 음식(고추, 생강, 마늘, 양파), 흰색 식재료",
        "수": "짠맛 음식(미역, 다시마, 조개류), 검은색 식재료(검은콩, 흑미), 해산물"
    }
    
    # 부족한 오행 보충 음식
    supplement_foods = element_foods.get(min_element, "")
    
    # 메뉴 목록 포맷팅 (인덱스 포함)
    menu_list = []
    for i, m in enumerate(menus):
        name = m.get('name', m.get('메뉴명', f'메뉴{i}'))
        corner = m.get('corner', m.get('코너', ''))
        if corner:
            menu_list.append(f"{i}. {name} ({corner})")
        else:
            menu_list.append(f"{i}. {name}")
    menu_text = "\n".join(menu_list)
    
    system_prompt = f"""당신은 동양 전통 체질 의학과 음식 궁합 전문가 '거북 도사'입니다.
사용자의 사주 오행 분석 결과를 바탕으로 오늘의 점심 메뉴를 추천합니다.

## 체질 분석 요약
{constitution_summary if constitution_summary else "체질 정보가 제공되지 않았습니다."}

## 오행 분포
- 가장 많은 오행: {max_element} ({elements.get(max_element, 0)}개) - 과잉될 수 있어 조절 필요
- 가장 적은 오행: {min_element} ({elements.get(min_element, 0)}개) - 보충이 필요함

## 오행별 추천 식재료
- 목(木): 신맛, 푸른 채소, 간에 좋은 음식
- 화(火): 쓴맛, 붉은색, 볶음 요리
- 토(土): 단맛, 노란색, 국물 요리
- 금(金): 매운맛, 흰색 식재료
- 수(水): 짠맛, 검은색, 해산물

## 부족한 {min_element} 오행 보충 식재료
{supplement_foods}

## 응답 원칙
1. 부족한 오행({min_element})을 보충할 수 있는 메뉴를 우선 추천
2. '~하오', '~리라' 등 도사 어투 사용
3. 반드시 JSON 형식으로만 응답

## 응답 형식 (JSON)
{{"recommendedIndex": <메뉴 인덱스 번호>, "reason": "<추천 이유 2-3문장, 도사 어투>"}}
"""

    user_prompt = f"""오늘 점심 메뉴 목록입니다. 이 사용자의 체질에 맞는 메뉴를 추천해주세요.

## 오늘의 메뉴
{menu_text}

## 사용자 오행 정보
- 오행 분포: 목 {five.get('목', 0)}개, 화 {five.get('화', 0)}개, 토 {five.get('토', 0)}개, 금 {five.get('금', 0)}개, 수 {five.get('수', 0)}개
- 과잉: {max_element} ({elements.get(max_element, 0)}개)
- 부족: {min_element} ({elements.get(min_element, 0)}개)

위 메뉴 중에서 이 사용자의 체질에 가장 잘 맞는 메뉴 1개를 선택하고,
JSON 형식으로 응답해주세요: {{"recommendedIndex": <번호>, "reason": "<이유>"}}"""

    return system_prompt, user_prompt


def parse_menu_recommendation(response: str, menu_count: int) -> Dict[str, Any]:
    """
    메뉴 추천 LLM 응답 파싱
    
    Args:
        response: LLM 응답 텍스트
        menu_count: 메뉴 개수 (유효성 검증용)
        
    Returns:
        Dict: recommendedIndex, reason
    """
    result = {
        "recommendedIndex": 0,
        "reason": "오늘의 메뉴 중 체질에 맞는 음식을 추천합니다."
    }
    
    try:
        # JSON 블록 추출
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
        if json_match:
            json_str = json_match.group(1)
        else:
            # JSON 블록이 없으면 전체에서 JSON 객체 찾기
            json_match = re.search(r'\{[\s\S]*"recommendedIndex"[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response
        
        parsed = json.loads(json_str)
        
        idx = parsed.get("recommendedIndex", 0)
        if isinstance(idx, int) and 0 <= idx < menu_count:
            result["recommendedIndex"] = idx
        
        reason = parsed.get("reason", "")
        if reason:
            result["reason"] = reason
            
    except (json.JSONDecodeError, ValueError) as e:
        print(f"⚠️ 메뉴 추천 JSON 파싱 실패: {e}")
        # 텍스트에서 숫자 추출 시도
        num_match = re.search(r'(\d+)', response)
        if num_match:
            idx = int(num_match.group(1))
            if 0 <= idx < menu_count:
                result["recommendedIndex"] = idx
    
    return result


def build_group_combination_prompt(members_data: List[Dict[str, Any]]) -> tuple:
    """
    모임(그룹) 사주 조합용 프롬프트. 관상은 사용하지 않고, 멤버별 사주 정보와 RAG 컨텍스트만으로
    한 번의 LLM 호출로 '모임 조합' 텍스트를 생성한다.

    Args:
        members_data: 각 멤버별 dict. 필드: name, sajuInfo (yearPillar, dayStem, fiveElements 등), rag_context

    Returns:
        tuple: (system_prompt, user_prompt)
    """
    if not members_data:
        raise ValueError("members_data는 1명 이상 필요합니다.")

    members_block = []
    for i, m in enumerate(members_data, 1):
        name = m.get("name", f"멤버{i}")
        saju = m.get("sajuInfo") or {}
        five = saju.get("fiveElements") or {}
        members_block.append(f"""
### 멤버 {i}: {name}
- 사주: 연주 {saju.get('yearPillar', '미상')}, 월주 {saju.get('monthPillar', '미상')}, 일주 {saju.get('dayPillar', '미상')}, 시주 {saju.get('hourPillar', '미상')}
- 일간: {saju.get('dayStem', '미상')}
- 오행: 목 {five.get('목', 0)}, 화 {five.get('화', 0)}, 토 {five.get('토', 0)}, 금 {five.get('금', 0)}, 수 {five.get('수', 0)}
- 참고 자료(이 멤버): {m.get("rag_context", "[없음]")[:800]}
""")

    system_prompt = """당신은 한국 전통 사주명리학에 정통한 명리학자입니다.
여러 명의 사주 정보만을 바탕으로, **이 모임 전체의 궁합·조합**을 한 편의 글로 풀어내시오.
관상·얼굴은 전혀 사용하지 않고, 오직 사주(연월일시주, 일간, 오행)만으로 판단하시오.

## 원칙
1. 각 멤버의 일간·오행 균형을 참고하여, 서로의 오행이 상생/상극하는지 흐름을 짚으시오.
2. 모임 전체로 보았을 때 '어떤 기운이 강한지', '누가 누구를 보완하는지'를 자연스럽게 서술하시오.
3. 도사 어투를 사용하시오 ("~이오", "~하시오", "~구먼").
4. 6~12문장 정도로, 한 편의 연속된 글로만 응답하시오. JSON이나 소제목 없이 본문만 출력하시오.

## 참고
- 각 멤버별 '참고 자료'는 명리 해석 시 참고만 하고, 그대로 인용하지 마시오.
- 과장이나 단정을 피하고, 긍정적이면서 현실적인 톤을 유지하시오."""

    user_prompt = f"""아래 {len(members_data)}명의 사주 정보를 바탕으로, 이 모임의 사주 조합(궁합)을 한 편의 글로 작성하시오.
관상은 보지 말고, 사주만으로 판단하시오.

{"".join(members_block)}

위 내용만 참고하여, 이 모임 전체의 기운이 어떻게 어우러지는지 한 편의 글로만 답하시오. JSON·소제목 없이 본문만 출력하시오."""

    return system_prompt, user_prompt


# ========== 모임 전체 궁합(overall) + 1대1 궁합(pairs) 구조화 출력 ==========

def _members_block_for_json(members_data: List[Dict[str, Any]]) -> str:
    """LLM 프롬프트용 멤버 정보 블록 (사주·RAG 요약)."""
    lines = []
    for i, m in enumerate(members_data, 1):
        name = m.get("name", f"멤버{i}")
        saju = m.get("sajuInfo") or {}
        five = saju.get("fiveElements") or {}
        lines.append(f"""
### 멤버 {i}: {name}
- 사주: 연주 {saju.get('yearPillar', '미상')}, 월주 {saju.get('monthPillar', '미상')}, 일주 {saju.get('dayPillar', '미상')}, 시주 {saju.get('hourPillar', '미상')}
- 일간: {saju.get('dayStem', '미상')}
- 오행: 목 {five.get('목', 0)}, 화 {five.get('화', 0)}, 토 {five.get('토', 0)}, 금 {five.get('금', 0)}, 수 {five.get('수', 0)}
- 참고 자료(요약): {(m.get("rag_context") or "[없음]")[:600]}
""")
    return "\n".join(lines)


def build_group_overall_prompt(members_data: List[Dict[str, Any]]) -> tuple:
    """
    모임 **전체 궁합**용 프롬프트. 한 번의 LLM 호출로 personality, compatibility, teamwork, maintenance, members(역할·키워드 등)를
    JSON 하나로 생성한다. 관상 미사용, 사주만 사용.
    """
    if not members_data:
        raise ValueError("members_data는 1명 이상 필요합니다.")
    member_names = [m.get("name", f"멤버{i}") for i, m in enumerate(members_data, 1)]
    names_ordered = ", ".join(member_names)

    system_prompt = """당신은 한국 전통 사주명리학에 정통한 명리학자 '거북 도사'입니다.
여러 명의 사주(연월일시주, 일간, 오행)만을 바탕으로, **모임 전체 궁합**을 분석하여 아래 JSON 형식으로만 출력하시오.
관상·얼굴은 사용하지 마시오. 도사 어투("~이오", "~하시오", "~구먼")를 사용하시오.

## 반드시 지킬 것
1. 응답은 반드시 아래 JSON만 출력하시오. 다른 설명이나 마크다운 없이 JSON만.
2. "personality", "compatibility", "teamwork", "maintenance", "members" 키를 모두 포함하시오.
3. members 배열은 반드시 입력된 멤버 **순서와 이름** 그대로, 같은 인원수로 작성하시오.
4. compatibility.score는 0~100 정수. teamwork의 communication, speed, stability도 각 0~100 정수.
5. maintenance.maintenanceCards는 반드시 3개: label은 순서대로 "소통", "리더십", "빈도". 각각 title(짧은 제목), description(1~2문장) 포함.
6. roleBadge는 이모지 하나(예: 🌿 🔥 🪨 🌊 ⚡ 등)로 각 멤버 역할을 상징하시오."""

    user_prompt = f"""아래 {len(members_data)}명의 사주 정보를 바탕으로, 모임 전체 궁합을 분석하여 아래 JSON 형식으로만 응답하시오.
멤버 이름(순서 유지): {names_ordered}

{_members_block_for_json(members_data)}

## 출력할 JSON 형식 (따옴표·쉼표·괄호 정확히 지킬 것)
{{
  "personality": {{
    "title": "이 모임을 한마디로 정리한 제목 (20자 내외)",
    "harmony": "모임의 조화 및 균형 해석 (3~5문장, 도사 어투)",
    "comprehensive": "종합 궁합 해석. 각 멤버 역할과 구조 설명 (4~6문장)",
    "improvement": "모임이 오래 가기 위한 조언 3가지 이상 (4~6문장)"
  }},
  "compatibility": {{ "score": 75 }},
  "teamwork": {{
    "communication": 75,
    "speed": 80,
    "stability": 85,
    "communicationDetail": "커뮤니케이션 특성 설명 2~4문장",
    "speedDetail": "갈등/대응력 설명 2~4문장",
    "stabilityDetail": "의사결정·안정도 설명 2~4문장"
  }},
  "maintenance": {{
    "do": ["할 것 1", "할 것 2", "할 것 3"],
    "dont": ["하지 말 것 1", "하지 말 것 2", "하지 말 것 3"],
    "maintenanceCards": [
      {{ "label": "소통", "title": "짧은 제목", "description": "1~2문장 설명" }},
      {{ "label": "리더십", "title": "짧은 제목", "description": "1~2문장 설명" }},
      {{ "label": "빈도", "title": "짧은 제목", "description": "1~2문장 설명" }}
    ]
  }},
  "members": [
    {{
      "name": "멤버이름(입력과 동일)",
      "role": "역할 한 줄",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "roleBadge": "🌿",
      "description": "이 멤버의 모임 내 포지션 1~2문장",
      "strengths": ["장점1"],
      "warnings": ["주의점1"]
    }}
  ]
}}

members 배열은 반드시 {len(members_data)}명, 위 이름 순서대로 작성하시오. JSON만 출력하시오."""

    return system_prompt, user_prompt


def parse_group_overall_response(response: str) -> Optional[Dict[str, Any]]:
    """전체 궁합 LLM 응답에서 JSON 추출."""
    if not response or not response.strip():
        return None
    text = response.strip()
    json_match = re.search(r"\{[\s\S]*\}", text)
    if json_match:
        try:
            data = json.loads(json_match.group(0))
            if "personality" in data and "members" in data:
                return data
        except json.JSONDecodeError:
            pass
    return None


def build_group_pairs_prompt(member_names: List[str], members_data: List[Dict[str, Any]]) -> tuple:
    """
    모임 **1대1 궁합**용 프롬프트. 모든 쌍(n*(n-1)/2)에 대해 rank, score, type, reason, summary를
    JSON 하나로 생성한다. member1, member2는 반드시 member_names에 있는 이름 그대로.
    """
    if len(member_names) < 2:
        raise ValueError("멤버는 2명 이상 필요합니다.")
    n = len(member_names)
    pair_count = n * (n - 1) // 2
    names_ordered = ", ".join(member_names)

    system_prompt = """당신은 한국 전통 사주명리학에 정통한 명리학자입니다.
주어진 멤버들 간의 **1대1 사주 궁합**을 분석하여, 모든 쌍에 대해 순위(rank), 점수(score), 유형(type), 이유(reason), 요약(summary)을 JSON으로 출력하시오.
관상은 사용하지 마시오. 사주(일간·오행 등)만으로 판단하시오.

## 규칙
1. 응답은 반드시 아래 형식의 JSON만 출력하시오. 다른 텍스트 없이.
2. member1, member2는 반드시 입력된 **멤버 이름 그대로** 사용하시오. 오타 금지.
3. pairs 배열 길이는 반드시 n*(n-1)/2 (모든 쌍). 각 쌍은 한 번만 (A-B와 B-A 중 하나만).
4. rank는 1부터 순서대로. 1위가 가장 궁합 좋은 쌍.
5. score는 0~100 정수. 90 이상 best, 75~89 good, 60~74 normal, 50~59 unstable, 50 미만 worst 권장.
6. type은 반드시 "best" | "normal" | "unstable" | "worst" 중 하나.
7. reason, summary는 각 1~3문장."""

    members_block = _members_block_for_json(members_data)
    user_prompt = f"""멤버(이름 그대로 사용): {names_ordered}
쌍 개수: {pair_count}개 (모든 1대1 조합)

{members_block}

## 출력 JSON 형식
{{
  "pairs": [
    {{
      "member1": "이름1",
      "member2": "이름2",
      "rank": 1,
      "score": 95,
      "type": "best",
      "reason": "궁합 이유 1~3문장",
      "summary": "한 줄 요약"
    }}
  ]
}}

pairs 배열은 반드시 {pair_count}개, rank 1~{pair_count}까지 모두 포함하시오. member1/member2는 위 목록의 이름을 정확히 쓰시오. JSON만 출력하시오."""

    return system_prompt, user_prompt


def parse_group_pairs_response(response: str, member_names: List[str]) -> List[Dict[str, Any]]:
    """1대1 궁합 LLM 응답에서 pairs 배열 추출. 멤버 이름 정규화(공백 제거) 후 반환."""
    if not response or not response.strip():
        return []
    text = response.strip()
    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        return []
    try:
        data = json.loads(json_match.group(0))
        pairs = data.get("pairs") or []
    except json.JSONDecodeError:
        return []
    name_set = {n.strip() for n in member_names}
    result = []
    for p in pairs:
        m1 = (p.get("member1") or "").strip()
        m2 = (p.get("member2") or "").strip()
        if not m1 or not m2:
            continue
        # 이름이 목록에 없으면 가장 비슷한 목록 이름으로 매핑 (선택)
        if m1 not in name_set:
            for n in member_names:
                if n.strip() == m1 or n in m1 or m1 in n:
                    m1 = n.strip()
                    break
        if m2 not in name_set:
            for n in member_names:
                if n.strip() == m2 or n in m2 or m2 in n:
                    m2 = n.strip()
                    break
        result.append({
            "member1": m1,
            "member2": m2,
            "rank": int(p.get("rank") or 0),
            "score": int(p.get("score") or 65),
            "type": p.get("type") or "normal",
            "reason": p.get("reason") or "",
            "summary": p.get("summary") or "",
        })
    return result
