"""
GMS (GPT Model Service) API 호출 모듈
Jupyter Lab GPU 서버에서 사용하기 위한 Python 버전
"""

import os
import json
import requests
from typing import Dict, Any, Optional


def get_config() -> Dict[str, str]:
    """
    환경변수에서 GMS API 설정 로드
    
    Returns:
        dict: apiKey와 baseUrl을 포함한 딕셔너리
        
    Raises:
        ValueError: GMS_KEY 환경변수가 설정되지 않은 경우
    """
    api_key = os.getenv("GMS_KEY")
    base_url = os.getenv(
        "GMS_BASE_URL", 
        "https://gms.ssafy.io/gmsapi/api.openai.com/v1/responses"
    )
    
    if not api_key:
        raise ValueError(
            "❌ GMS_KEY 환경변수가 설정되지 않았습니다.\n"
            "   다음 명령으로 설정하세요:\n"
            "   Windows: set GMS_KEY=your-api-key\n"
            "   Linux/Mac: export GMS_KEY=your-api-key\n"
            "   Jupyter Notebook: os.environ['GMS_KEY'] = 'your-api-key'"
        )
    
    return {"apiKey": api_key, "baseUrl": base_url}


def extract_output_text(response: Dict[str, Any]) -> str:
    """
    API 응답에서 텍스트 추출 (robust 처리)
    
    Args:
        response: API 응답 딕셔너리
        
    Returns:
        str: 추출된 텍스트
        
    Raises:
        ValueError: 텍스트를 찾을 수 없는 경우
    """
    # 1) output_text가 있으면 사용 (Responses API)
    if "output_text" in response and response["output_text"]:
        return response["output_text"]
    
    # 2) output 배열 순회 (Responses API)
    if "output" in response and isinstance(response["output"], list):
        texts = []
        
        for item in response["output"]:
            # 직접 text 필드가 있는 경우
            if "text" in item and item["text"]:
                texts.append(item["text"])
            # message.content가 있는 경우
            if "message" in item and "content" in item["message"]:
                texts.append(item["message"]["content"])
            # content 배열이 있는 경우
            if "content" in item and isinstance(item["content"], list):
                for content_item in item["content"]:
                    if "text" in content_item and content_item["text"]:
                        texts.append(content_item["text"])
        
        if texts:
            return "\n".join(texts)
    
    # 3) choices 배열 (Chat Completions API 호환)
    if "choices" in response and isinstance(response["choices"], list):
        texts = []
        
        for choice in response["choices"]:
            if "message" in choice and "content" in choice["message"]:
                texts.append(choice["message"]["content"])
            if "text" in choice and choice["text"]:
                texts.append(choice["text"])
        
        if texts:
            return "\n".join(texts)
    
    # 4) 최후의 수단: 응답 객체에서 텍스트 찾기
    response_str = json.dumps(response, ensure_ascii=False)[:1000]
    raise ValueError(
        f"❌ API 응답에서 출력 텍스트를 찾을 수 없습니다.\n"
        f"   응답 형식을 확인하세요: {response_str}..."
    )


def call_gms_api(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-5-mini",
    timeout: int = 300
) -> str:
    """
    GMS API 호출
    
    Args:
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 프롬프트
        model: 사용할 모델명 (기본값: "gpt-5-mini")
        timeout: 요청 타임아웃 (초, 기본값: 300)
        
    Returns:
        str: 생성된 텍스트
        
    Raises:
        ValueError: API 키가 없거나 응답 파싱 실패
        requests.RequestException: 네트워크 오류
    """
    config = get_config()
    api_key = config["apiKey"]
    base_url = config["baseUrl"]
    
    request_body = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": user_prompt}],
            },
        ],
    }
    
    print(f"\n🔗 API 호출: {base_url}")
    print(f"📤 모델: {model}")
    
    try:
        response = requests.post(
            base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=request_body,
            timeout=timeout
        )
        
        # 디버깅: HTTP 상태 코드 출력
        print(f"📥 HTTP 상태 코드: {response.status_code}")
        
        response.raise_for_status()  # HTTP 에러 체크
        
        data = response.json()
        
        # 디버깅: API 응답 출력
        print(f"📥 API 응답 키: {data.keys() if data else 'None'}")
        if 'error' in data and data['error'] is not None:
            print(f"📥 에러 내용: {data.get('error')}")
        
        # error 키가 있고 값이 None이 아닌 경우에만 에러 처리
        if "error" in data and data["error"] is not None:
            error_info = data['error']
            if isinstance(error_info, dict):
                raise ValueError(f"❌ API 에러: {error_info.get('message', str(error_info))}")
            else:
                raise ValueError(f"❌ API 에러: {str(error_info)}")
        
        return extract_output_text(data)
        
    except requests.exceptions.Timeout:
        raise ValueError(
            f"❌ 요청 타임아웃: {timeout}초 내에 응답을 받지 못했습니다.\n"
            f"   GPU 서버의 처리 시간이 오래 걸릴 수 있습니다."
        )
    except requests.exceptions.RequestException as e:
        raise ValueError(
            f"❌ 네트워크 오류: API 서버에 연결할 수 없습니다.\n"
            f"   URL: {base_url}\n"
            f"   오류: {str(e)}"
        )


# Jupyter Notebook에서 편리하게 사용하기 위한 헬퍼 함수
def generate_text(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-5-mini",
    timeout: int = 300
) -> str:
    """
    간단한 텍스트 생성 함수 (Jupyter Notebook용)
    
    Args:
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 프롬프트
        model: 사용할 모델명
        timeout: 요청 타임아웃 (초)
        
    Returns:
        str: 생성된 텍스트
    """
    return call_gms_api(system_prompt, user_prompt, model, timeout)
