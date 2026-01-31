"""
관상 분석 프롬프트 빌더 모듈
Rule-based 분석 결과와 RAG 컨텍스트를 바탕으로 LLM 프롬프트 생성
"""

from typing import Dict, List, Any, Optional


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
- W/H 비율: {measures.get('wh', 'N/A')}
- 기본 해석: {face_shape.get('coreMeaning', '')}
- 조언: {face_shape.get('advice', '')}
""")
    
    # 이마
    forehead = analysis.get("forehead", {})
    if forehead:
        measures = forehead.get("measures", {})
        parts_info.append(f"""
### 이마 (초년운/판단력)
- 높이 비율: {measures.get('heightRatio', 'N/A')}, 폭 비율: {measures.get('widthRatio', 'N/A')}
- 기본 해석: {forehead.get('coreMeaning', '')}
- 조언: {forehead.get('advice', '')}
""")
    
    # 눈
    eyes = analysis.get("eyes", {})
    if eyes:
        measures = eyes.get("measures", {})
        parts_info.append(f"""
### 눈 (성격/대인관계)
- 좌우 비대칭도: {measures.get('asymmetry', 'N/A')}, 대칭 판정: {measures.get('asymmetryCriteria', '')}
- 눈 개방도(좌): {measures.get('openL', 'N/A')}, (우): {measures.get('openR', 'N/A')}
- 미간 거리: {measures.get('interDist', 'N/A')}
- 기본 해석: {eyes.get('coreMeaning', '')}
- 조언: {eyes.get('advice', '')}
""")
    
    # 코
    nose = analysis.get("nose", {})
    if nose:
        measures = nose.get("measures", {})
        parts_info.append(f"""
### 코 (재물운/현실감)
- 길이 비율: {measures.get('lengthRatio', 'N/A')}, 판정: {measures.get('lengthCriteria', '')}
- 폭: {measures.get('width', 'N/A')}
- 기본 해석: {nose.get('coreMeaning', '')}
- 조언: {nose.get('advice', '')}
""")
    
    # 입
    mouth = analysis.get("mouth", {})
    if mouth:
        measures = mouth.get("measures", {})
        parts_info.append(f"""
### 입 (언어/복)
- 폭: {measures.get('width', 'N/A')}, 입술 두께: {measures.get('lipThickness', 'N/A')}
- 입꼬리 각도: {measures.get('cornerSlope', 'N/A')}°, 판정: {measures.get('cornerCriteria', '')}
- 기본 해석: {mouth.get('coreMeaning', '')}
- 조언: {mouth.get('advice', '')}
""")
    
    # 턱
    chin = analysis.get("chin", {})
    if chin:
        measures = chin.get("measures", {})
        parts_info.append(f"""
### 턱 (말년운/리더십)
- 턱 각도: {measures.get('angle', 'N/A')}°, 판정: {measures.get('angleCriteria', '')}
- 길이: {measures.get('length', 'N/A')}, 폭: {measures.get('width', 'N/A')}
- 기본 해석: {chin.get('coreMeaning', '')}
- 조언: {chin.get('advice', '')}
""")
    
    parts_text = "\n".join(parts_info)
    
    meta_info = ""
    if meta:
        meta_info = f"""
## 측정 품질
- 얼굴 기울기: {safe_float(meta.get('headRoll', 0)):.1f}°
- 전체 대칭도: {safe_float(meta.get('overallSymmetry', meta.get('symmetry', 0))):.1f}%
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


def build_total_review_prompt(
    analysis: Dict[str, Any],
    saju_info: Dict[str, Any],
    saju_info: Dict[str, Any],
    rag_context: str = ""
) -> tuple:
    """
    totalReview 생성을 위한 프롬프트. 한 번의 LLM 호출로 [조화][종합][조언][전체적인 체질 특성] 4키를 생성.
    사주는 항상 있다고 가정합니다.

    totalReview 생성을 위한 프롬프트. 한 번의 LLM 호출로 [조화][종합][조언][전체적인 체질 특성] 4키를 생성.
    사주는 항상 있다고 가정합니다.

    Args:
        analysis: analyze_face() 함수의 결과
        saju_info: 사주 정보 (필수)
        saju_info: 사주 정보 (필수)
        rag_context: RAG 검색 결과


    Returns:
        tuple: (system_prompt, user_prompt)
    """
    five = saju_info.get("fiveElements") or {}
    five = saju_info.get("fiveElements") or {}
    system_prompt = f"""당신은 전통 동양 관상학과 명리학 전문가입니다.
관상 분석 결과와 사주를 종합하여 총평을 작성합니다.

## 참고 지식
{rag_context if rag_context else "[참고 자료 없음]"}

## 응답 원칙
1. 긍정적이고 건설적인 관점 유지
2. 구체적이고 실용적인 조언 제공
3. 자연스러운 문장으로 작성 (JSON 형식 아님)
4. 각 섹션을 명확히 구분하여 작성

## 응답 형식

다음 네 섹션을 순서대로 반드시 모두 작성하세요. 각 섹션 제목은 반드시 대괄호 [ ] 안에 그대로 쓸 것 (예: [조화], [전체적인 체질 특성]). [조언] 다음에 반드시 [전체적인 체질 특성]을 새 줄에 쓴 뒤 체질 풀이 본문을 이어서 작성하세요.

다음 네 섹션을 순서대로 반드시 모두 작성하세요. 각 섹션 제목은 반드시 대괄호 [ ] 안에 그대로 쓸 것 (예: [조화], [전체적인 체질 특성]). [조언] 다음에 반드시 [전체적인 체질 특성]을 새 줄에 쓴 뒤 체질 풀이 본문을 이어서 작성하세요.

[조화]
관상 각 부위의 조화와 균형에 대한 분석 (3-4문장)

[종합]
종합적인 성격, 운세, 특성에 대한 분석 (4-5문장)

[조언]
더 나은 삶을 위한 조언과 방향 (3-4문장)

[전체적인 체질 특성]
아래 사용자 사주 정보에 적힌 오행 분포(목·화·토·금·수 개수)와 일간을 반드시 그대로 사용하여 건강 관점의 체질 풀이를 작성하시오. 다른 사람의 사주나 예시 숫자를 사용하지 마시오.

출력 형식: 반드시 아래 다섯 개 소제목을 순서대로, 각 소제목을 한 줄에만 쓴 뒤 그 다음 줄부터 본문을 작성하시오. 소제목은 번호 없이 제목만 쓴다.

소제목 1: 전체적인 체질 특성
(이 사용자의 오행 분포에서 가장 많은 오행·적은 오행을 반영한 기본 체질 특성 2~3문장. 예: "사주를 보면 토(土)가 가장 많고, 그다음이 화(火)입니다. 이는 기본 체질이 열과 건조, 그리고 소화기 중심으로 돌아간다는 뜻입니다. 따라서 건강을 볼 때도 차갑고 축축한 병보다는 열이나 염증, 소화기 질환, 순환 장애, 긴장성 질환 쪽을 먼저 살펴보아야 합니다.")

소제목 2: 이 체질이 나타내는 건강상 주의점
(이 사용자의 일간(천간 한 글자)이 몸·심리에 미치는 영향. 일간이 丁이면 정화 일간으로 심장·혈관·불면·두근거림·스트레스 반응 등을, 갑이면 갑목으로 간·담·긴장 등을 서술. 3~4문장.)

소제목 3: [가장 많은 오행](漢)가 많은 사주와 [해당 오행 건강] — 반드시 위 오행 개수에서 가장 많은 오행만 사용. 예: 토가 가장 많으면 "토(土)가 많은 사주와 소화기 건강", 목이 가장 많으면 "목(木)이 많은 사주와 간·담 건강". 해당 오행이 몸에서 담당하는 부위·주의점·패턴을 4~5문장으로.

소제목 4: [가장 적은 오행](漢)가 약한 구조와 회복력 — 반드시 위 오행 개수에서 가장 적은 오행만 사용. 예: 수가 가장 적으면 "수(水)가 약한 구조와 회복력". 해당 오행이 담당하는 신장·방광·수면·회복력 등을 3~4문장으로.

소제목 5: 건강 관리를 위해 꼭 챙기면 좋은 것들
(물·차·음식·수면·식사 습관 등 구체적 실천 3~4문장.)

[전체적인 체질 특성]
아래 사용자 사주 정보에 적힌 오행 분포(목·화·토·금·수 개수)와 일간을 반드시 그대로 사용하여 건강 관점의 체질 풀이를 작성하시오. 다른 사람의 사주나 예시 숫자를 사용하지 마시오.

출력 형식: 반드시 아래 다섯 개 소제목을 순서대로, 각 소제목을 한 줄에만 쓴 뒤 그 다음 줄부터 본문을 작성하시오. 소제목은 번호 없이 제목만 쓴다.

소제목 1: 전체적인 체질 특성
(이 사용자의 오행 분포에서 가장 많은 오행·적은 오행을 반영한 기본 체질 특성 2~3문장. 예: "사주를 보면 토(土)가 가장 많고, 그다음이 화(火)입니다. 이는 기본 체질이 열과 건조, 그리고 소화기 중심으로 돌아간다는 뜻입니다. 따라서 건강을 볼 때도 차갑고 축축한 병보다는 열이나 염증, 소화기 질환, 순환 장애, 긴장성 질환 쪽을 먼저 살펴보아야 합니다.")

소제목 2: 이 체질이 나타내는 건강상 주의점
(이 사용자의 일간(천간 한 글자)이 몸·심리에 미치는 영향. 일간이 丁이면 정화 일간으로 심장·혈관·불면·두근거림·스트레스 반응 등을, 갑이면 갑목으로 간·담·긴장 등을 서술. 3~4문장.)

소제목 3: [가장 많은 오행](漢)가 많은 사주와 [해당 오행 건강] — 반드시 위 오행 개수에서 가장 많은 오행만 사용. 예: 토가 가장 많으면 "토(土)가 많은 사주와 소화기 건강", 목이 가장 많으면 "목(木)이 많은 사주와 간·담 건강". 해당 오행이 몸에서 담당하는 부위·주의점·패턴을 4~5문장으로.

소제목 4: [가장 적은 오행](漢)가 약한 구조와 회복력 — 반드시 위 오행 개수에서 가장 적은 오행만 사용. 예: 수가 가장 적으면 "수(水)가 약한 구조와 회복력". 해당 오행이 담당하는 신장·방광·수면·회복력 등을 3~4문장으로.

소제목 5: 건강 관리를 위해 꼭 챙기면 좋은 것들
(물·차·음식·수면·식사 습관 등 구체적 실천 3~4문장.)
"""


    # 분석 결과 요약
    analysis_summary = []
    for part_name, part_data in analysis.items():
        if isinstance(part_data, dict) and 'type' in part_data:
            analysis_summary.append(f"- {part_name}: {part_data.get('type', '')} - {part_data.get('coreMeaning', '')[:50]}")

    saju_section = f"""

    saju_section = f"""

## 이 사용자의 사주 정보 (반드시 이 수치만 사용할 것)
## 이 사용자의 사주 정보 (반드시 이 수치만 사용할 것)
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}
- 오행 분포(4주 기준 개수): 목(木) {five.get('목', 0)}개, 화(火) {five.get('화', 0)}개, 토(土) {five.get('토', 0)}개, 금(金) {five.get('금', 0)}개, 수(水) {five.get('수', 0)}개
- 오행 분포(4주 기준 개수): 목(木) {five.get('목', 0)}개, 화(火) {five.get('화', 0)}개, 토(土) {five.get('토', 0)}개, 금(金) {five.get('금', 0)}개, 수(水) {five.get('수', 0)}개

[전체적인 체질 특성]을 쓸 때 반드시 위 오행 분포 숫자(목·화·토·금·수 개수)를 그대로 사용하시오. 가장 많은 오행·가장 적은 오행 판단도 위 숫자 기준으로만 하시오.
[전체적인 체질 특성]을 쓸 때 반드시 위 오행 분포 숫자(목·화·토·금·수 개수)를 그대로 사용하시오. 가장 많은 오행·가장 적은 오행 판단도 위 숫자 기준으로만 하시오.
"""


    user_prompt = f"""다음 관상 분석 결과에 대한 종합 총평을 작성해주세요.

## 관상 분석 요약
{chr(10).join(analysis_summary)}
{saju_section}

위 분석을 바탕으로 [조화], [종합], [조언], [전체적인 체질 특성] 네 섹션을 순서대로 모두 작성해주세요.
위 분석을 바탕으로 [조화], [종합], [조언], [전체적인 체질 특성] 네 섹션을 순서대로 모두 작성해주세요.
"""
    return system_prompt, user_prompt


def parse_face_analysis_response(llm_response: str) -> Dict[str, Any]:
    """
    LLM 응답에서 관상 분석 결과 파싱
    
    Args:
        llm_response: LLM의 JSON 응답
        
    Returns:
        Dict: 파싱된 결과 {'partSummaries': {...}, 'totalReview': {...}}
    """
    import json
    import re
    
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
    import re
    
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


def parse_total_review(response: str) -> Dict[str, str]:
def parse_total_review(response: str) -> Dict[str, str]:
    """
    LLM 응답에서 totalReview 파싱 (한 번의 호출로 4키 반환)
    [조화], [종합], [조언], [전체적인 체질 특성] 섹션을 추출.
    LLM이 괄호 없이 '전체적인 체질 특성'만 줄 제목으로 쓴 경우에도 추출.
    LLM 응답에서 totalReview 파싱 (한 번의 호출로 4키 반환)
    [조화], [종합], [조언], [전체적인 체질 특성] 섹션을 추출.
    LLM이 괄호 없이 '전체적인 체질 특성'만 줄 제목으로 쓴 경우에도 추출.
    """
    import re
    
    result = {
        "harmony": "",
        "comprehensive": "",
        "improvement": "",
        "total_user_saju_information": "",
    }
    
    # 체질 블록 경계: [전체적인 체질 특성] 또는 줄 단위 제목 "전체적인 체질 특성"
    constitution_boundary = r'\[전체적인 체질 특성\]|\n\s*전체적인 체질 특성\s*\n'
    
    # [조화] 섹션 추출 (다음 섹션 전까지만)
    harmony_match = re.search(r'\[조화\]\s*([\s\S]*?)(?=\[종합\]|\[조언\]|' + constitution_boundary + r'|$)', response)
    if harmony_match:
        result["harmony"] = harmony_match.group(1).strip()
    
    # [종합] 섹션 추출
    comprehensive_match = re.search(r'\[종합\]\s*([\s\S]*?)(?=\[조언\]|' + constitution_boundary + r'|$)', response)
    comprehensive_match = re.search(r'\[종합\]\s*([\s\S]*?)(?=\[조언\]|' + constitution_boundary + r'|$)', response)
    if comprehensive_match:
        result["comprehensive"] = comprehensive_match.group(1).strip()
    
    # [조언] 섹션 추출 — 괄호 [전체적인 체질 특성] 또는 줄 제목 '전체적인 체질 특성' 전까지
    improvement_match = re.search(r'\[조언\]\s*([\s\S]*?)(?=\[전체적인 체질 특성\]|\n\s*전체적인 체질 특성\s*\n|$)', response)
    # [조언] 섹션 추출 — 괄호 [전체적인 체질 특성] 또는 줄 제목 '전체적인 체질 특성' 전까지
    improvement_match = re.search(r'\[조언\]\s*([\s\S]*?)(?=\[전체적인 체질 특성\]|\n\s*전체적인 체질 특성\s*\n|$)', response)
    if improvement_match:
        result["improvement"] = improvement_match.group(1).strip()
    
    # [전체적인 체질 특성] 섹션 추출 → total_user_saju_information 하나만 사용 (중복 제거)
    constitution_match = re.search(r'\[전체적인 체질 특성\]\s*([\s\S]*)$', response)
    if constitution_match:
        constitution_text = constitution_match.group(1).strip()
        result["total_user_saju_information"] = constitution_text
    else:
        # 괄호 없이 줄 제목으로만 쓴 경우: "전체적인 체질 특성" 줄 다음부터 끝까지
        fallback = re.search(r'\n\s*전체적인 체질 특성\s*\n\s*([\s\S]*)$', response)
        if fallback:
            constitution_text = fallback.group(1).strip()
            if constitution_text.startswith("전체적인 체질 특성"):
                constitution_text = re.sub(r'^\s*전체적인 체질 특성\s*\n?', '', constitution_text).strip()
            result["total_user_saju_information"] = constitution_text
    
    # 섹션이 없으면 전체 응답을 comprehensive에 넣음
    if not result["harmony"] and not result["comprehensive"] and not result["improvement"]:
        result["comprehensive"] = response.strip()
    
    return result


def build_constitution_total_review_prompt(saju_info: Dict[str, Any], rag_context: str = "") -> tuple:
    """
    체질 풀이 totalReview 생성을 위한 프롬프트 (한 번의 LLM 호출로 5개 키 생성)
    사주 오행(목·화·토·금·수) 분포와 일간을 바탕으로 건강·체질 풀이를 생성합니다.
    
    Args:
        saju_info: 사주 정보 (yearPillar, dayStem, fiveElements 등)
        rag_context: RAG 검색 결과 (knowledge 폴더 오행·건강 관련)
        
    Returns:
        tuple: (system_prompt, user_prompt)
    """
    five = saju_info.get("fiveElements") or {}
    목, 화, 토, 금, 수 = five.get("목", 0), five.get("화", 0), five.get("토", 0), five.get("금", 0), five.get("수", 0)
    
    system_prompt = f"""당신은 사주명리학과 한의학적 체질론을 현대적으로 해석하는 전문가입니다.
사주팔자의 오행(목·화·토·금·수) 분포와 일간(日干)을 바탕으로, 건강 관점의 체질 풀이를 작성합니다.

## 참고 지식 (오행·체질·건강)
{rag_context if rag_context else "[오행 상생상극, 일간별 특성, 오행별 신체 부위(목=간·담, 화=심·소장, 토=비·위·장, 금=폐·대장, 수=신·방광)·수면·회복력 등을 참고하시오.]"}

## 작성 원칙
1. 오행 개수(목·화·토·금·수)로 가장 많은 기운과 가장 적은 기운을 정확히 반영합니다.
2. 일간(日干)이 몸과 심리에 미치는 영향을 구체적으로 서술합니다.
3. 과다한 오행으로 인한 건강 주의점(소화기, 심장·혈관, 수면·회복력 등)을 실생활에 맞게 제시합니다.
4. 부족한 오행을 보완하는 음식·습관을 구체적으로 추천합니다.
5. 반드시 아래 JSON 형식으로만 응답하시오. 다른 텍스트는 포함하지 마시오.

## 응답 형식 (JSON만 출력)
```json
{{
  "comprehensive": "전체적인 체질 특성 (사주 오행이 열·건조·소화기·순환 등 어떤 쪽인지 2~3문장)",
  "harmony": "이 체질이 나타내는 건강상 주의점 (일간과 오행을 연결해 심장·혈관·불면·스트레스 반응 등 3~4문장)",
  "strongElementSection": "가장 많은 오행이 많은 사주와 해당 오행이 담당하는 신체·건강 (예: 토가 많으면 소화기·위장·비장·과식 패턴 등, 4~5문장)",
  "weakElementSection": "가장 적은 오행이 약한 구조와 그 영향 (예: 수가 약하면 신장·방광·수면·회복력·물 마시는 습관 등, 3~4문장)",
  "improvement": "건강 관리를 위해 꼭 챙기면 좋은 것들 (물·차·음식·수면·식사 습관 등 구체적 실천, 3~4문장)"
}}
```
"""
    
    user_prompt = f"""다음 사주 정보를 바탕으로 체질 풀이 JSON을 생성해주세요.

## 사주 정보
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}

## 오행 분포 (4주 기준 개수)
- 목(木): {목}개
- 화(火): {화}개
- 토(土): {토}개
- 금(金): {금}개
- 수(水): {수}개

위 오행 분포에서 가장 많은 오행과 가장 적은 오행을 반영하여, comprehensive, harmony, strongElementSection, weakElementSection, improvement 다섯 가지 키를 채운 JSON만 출력하시오.
"""
    
    return system_prompt, user_prompt


def parse_constitution_total_review(llm_response: str) -> Dict[str, str]:
    """
    체질 풀이 LLM 응답에서 totalReview용 5개 키 파싱
    JSON 블록 또는 키별 추출.
    
    Args:
        llm_response: LLM이 생성한 텍스트 (JSON 또는 자유 문단)
        
    Returns:
        Dict: comprehensive, harmony, strongElementSection, weakElementSection, improvement
    """
    import json
    import re
    
    result = {
        "comprehensive": "",
        "harmony": "",
        "strongElementSection": "",
        "weakElementSection": "",
        "improvement": ""
    }
    
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', llm_response)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
            for key in result:
                if key in data and isinstance(data[key], str):
                    result[key] = data[key].strip()
            return result
        except json.JSONDecodeError:
            pass
    
    # JSON 블록 없으면 키 패턴으로 추출
    for key in result:
        pat = re.compile(rf'"{re.escape(key)}"\s*:\s*"((?:[^"\\]|\\.)*)"', re.DOTALL)
        m = pat.search(llm_response)
        if m:
            result[key] = m.group(1).replace('\\n', '\n').strip()
    
    return result


def build_constitution_total_review_prompt(saju_info: Dict[str, Any], rag_context: str = "") -> tuple:
    """
    체질 풀이 totalReview 생성을 위한 프롬프트 (한 번의 LLM 호출로 5개 키 생성)
    사주 오행(목·화·토·금·수) 분포와 일간을 바탕으로 건강·체질 풀이를 생성합니다.
    
    Args:
        saju_info: 사주 정보 (yearPillar, dayStem, fiveElements 등)
        rag_context: RAG 검색 결과 (knowledge 폴더 오행·건강 관련)
        
    Returns:
        tuple: (system_prompt, user_prompt)
    """
    five = saju_info.get("fiveElements") or {}
    목, 화, 토, 금, 수 = five.get("목", 0), five.get("화", 0), five.get("토", 0), five.get("금", 0), five.get("수", 0)
    
    system_prompt = f"""당신은 사주명리학과 한의학적 체질론을 현대적으로 해석하는 전문가입니다.
사주팔자의 오행(목·화·토·금·수) 분포와 일간(日干)을 바탕으로, 건강 관점의 체질 풀이를 작성합니다.

## 참고 지식 (오행·체질·건강)
{rag_context if rag_context else "[오행 상생상극, 일간별 특성, 오행별 신체 부위(목=간·담, 화=심·소장, 토=비·위·장, 금=폐·대장, 수=신·방광)·수면·회복력 등을 참고하시오.]"}

## 작성 원칙
1. 오행 개수(목·화·토·금·수)로 가장 많은 기운과 가장 적은 기운을 정확히 반영합니다.
2. 일간(日干)이 몸과 심리에 미치는 영향을 구체적으로 서술합니다.
3. 과다한 오행으로 인한 건강 주의점(소화기, 심장·혈관, 수면·회복력 등)을 실생활에 맞게 제시합니다.
4. 부족한 오행을 보완하는 음식·습관을 구체적으로 추천합니다.
5. 반드시 아래 JSON 형식으로만 응답하시오. 다른 텍스트는 포함하지 마시오.

## 응답 형식 (JSON만 출력)
```json
{{
  "comprehensive": "전체적인 체질 특성 (사주 오행이 열·건조·소화기·순환 등 어떤 쪽인지 2~3문장)",
  "harmony": "이 체질이 나타내는 건강상 주의점 (일간과 오행을 연결해 심장·혈관·불면·스트레스 반응 등 3~4문장)",
  "strongElementSection": "가장 많은 오행이 많은 사주와 해당 오행이 담당하는 신체·건강 (예: 토가 많으면 소화기·위장·비장·과식 패턴 등, 4~5문장)",
  "weakElementSection": "가장 적은 오행이 약한 구조와 그 영향 (예: 수가 약하면 신장·방광·수면·회복력·물 마시는 습관 등, 3~4문장)",
  "improvement": "건강 관리를 위해 꼭 챙기면 좋은 것들 (물·차·음식·수면·식사 습관 등 구체적 실천, 3~4문장)"
}}
```
"""
    
    user_prompt = f"""다음 사주 정보를 바탕으로 체질 풀이 JSON을 생성해주세요.

## 사주 정보
- 연주: {saju_info.get('yearPillar', '미상')}
- 월주: {saju_info.get('monthPillar', '미상')}
- 일주: {saju_info.get('dayPillar', '미상')}
- 시주: {saju_info.get('hourPillar', '미상')}
- 일간: {saju_info.get('dayStem', '미상')}

## 오행 분포 (4주 기준 개수)
- 목(木): {목}개
- 화(火): {화}개
- 토(土): {토}개
- 금(金): {금}개
- 수(水): {수}개

위 오행 분포에서 가장 많은 오행과 가장 적은 오행을 반영하여, comprehensive, harmony, strongElementSection, weakElementSection, improvement 다섯 가지 키를 채운 JSON만 출력하시오.
"""
    
    return system_prompt, user_prompt


def parse_constitution_total_review(llm_response: str) -> Dict[str, str]:
    """
    체질 풀이 LLM 응답에서 totalReview용 5개 키 파싱
    JSON 블록 또는 키별 추출.
    
    Args:
        llm_response: LLM이 생성한 텍스트 (JSON 또는 자유 문단)
        
    Returns:
        Dict: comprehensive, harmony, strongElementSection, weakElementSection, improvement
    """
    import json
    import re
    
    result = {
        "comprehensive": "",
        "harmony": "",
        "strongElementSection": "",
        "weakElementSection": "",
        "improvement": ""
    }
    
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', llm_response)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
            for key in result:
                if key in data and isinstance(data[key], str):
                    result[key] = data[key].strip()
            return result
        except json.JSONDecodeError:
            pass
    
    # JSON 블록 없으면 키 패턴으로 추출
    for key in result:
        pat = re.compile(rf'"{re.escape(key)}"\s*:\s*"((?:[^"\\]|\\.)*)"', re.DOTALL)
        m = pat.search(llm_response)
        if m:
            result[key] = m.group(1).replace('\\n', '\n').strip()
    
    return result
