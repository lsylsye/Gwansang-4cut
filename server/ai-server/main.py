"""
Gemini Image Generation API - FastAPI Server
Google AI의 Nano Banana (Gemini 이미지 생성) API를 활용한 FastAPI 서버

지원 모델:
- gemini-2.5-flash-image (Nano Banana): 속도와 효율성 최적화
- gemini-3-pro-image-preview (Nano Banana Pro): 전문적인 애셋 제작용
"""

import os
import base64
import uuid
import math
import json
import requests
import re
import redis
import numpy as np
from datetime import datetime
from typing import Optional, List, Dict, Tuple
from pathlib import Path
from collections import Counter

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from google import genai
from google.genai import types

try:
    from sentence_transformers import SentenceTransformer
    EMBEDDING_AVAILABLE = True
except ImportError:
    EMBEDDING_AVAILABLE = False
    print("⚠️ sentence-transformers가 설치되지 않았습니다. pip install sentence-transformers")


# ===== GMS API 모듈 =====

def get_gms_config() -> Dict[str, str]:
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
            "   Linux/Mac: export GMS_KEY=your-api-key"
        )
    
    return {"apiKey": api_key, "baseUrl": base_url}


def extract_gms_output_text(response: Dict) -> str:
    """
    GMS API 응답에서 텍스트 추출
    
    Args:
        response: API 응답 딕셔너리
        
    Returns:
        str: 추출된 텍스트
        
    Raises:
        ValueError: 텍스트를 찾을 수 없는 경우
    """
    # 1) output_text가 있으면 사용
    if "output_text" in response and response["output_text"]:
        return response["output_text"]
    
    # 2) output 배열 순회
    if "output" in response and isinstance(response["output"], list):
        texts = []
        for item in response["output"]:
            if "text" in item and item["text"]:
                texts.append(item["text"])
            if "message" in item and "content" in item["message"]:
                texts.append(item["message"]["content"])
            if "content" in item and isinstance(item["content"], list):
                for content_item in item["content"]:
                    if "text" in content_item and content_item["text"]:
                        texts.append(content_item["text"])
        if texts:
            return "\n".join(texts)
    
    # 3) choices 배열
    if "choices" in response and isinstance(response["choices"], list):
        texts = []
        for choice in response["choices"]:
            if "message" in choice and "content" in choice["message"]:
                texts.append(choice["message"]["content"])
            if "text" in choice and choice["text"]:
                texts.append(choice["text"])
        if texts:
            return "\n".join(texts)
    
    response_str = json.dumps(response, ensure_ascii=False)[:1000]
    raise ValueError(
        f"❌ GMS API 응답에서 출력 텍스트를 찾을 수 없습니다.\n"
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
    config = get_gms_config()
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
    
    print(f"\n🔗 GMS API 호출: {base_url}")
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
        
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            raise ValueError(f"❌ GMS API 에러: {data['error'].get('message', 'Unknown error')}")
        
        return extract_gms_output_text(data)
        
    except requests.exceptions.Timeout:
        raise ValueError(
            f"❌ 요청 타임아웃: {timeout}초 내에 응답을 받지 못했습니다."
        )
    except requests.exceptions.RequestException as e:
        raise ValueError(
            f"❌ 네트워크 오류: GMS API 서버에 연결할 수 없습니다.\n"
            f"   URL: {base_url}\n"
            f"   오류: {str(e)}"
        )


# ===== Redis 클라이언트 모듈 =====

# 환경변수에서 Redis 설정 읽기
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

# 인덱스 및 키 설정
EMBEDDING_DIMENSION = 384

# Redis 클라이언트 싱글톤
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    """Redis 클라이언트 생성 및 연결 (싱글톤)"""
    global _redis_client
    
    if _redis_client is not None:
        try:
            _redis_client.ping()
            return _redis_client
        except:
            _redis_client = None
    
    print(f"🔗 Redis 연결 중... {REDIS_HOST}:{REDIS_PORT}")
    
    try:
        _redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=False,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        
        _redis_client.ping()
        print("✅ Redis 연결됨")
        
        return _redis_client
    except Exception as e:
        print(f"❌ Redis 연결 실패: {e}")
        raise


def check_redis_available() -> bool:
    """Redis 사용 가능 여부 확인"""
    try:
        get_redis_client()
        return True
    except:
        return False


def index_exists(index_name: str) -> bool:
    """인덱스 존재 여부 확인"""
    try:
        client = get_redis_client()
        client.execute_command("FT.INFO", index_name)
        return True
    except redis.exceptions.ResponseError as e:
        if "unknown index name" in str(e).lower():
            return False
        raise


# ===== 임베딩 모듈 =====

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
_embedding_model: Optional[SentenceTransformer] = None


def init_embedding() -> Optional[SentenceTransformer]:
    """임베딩 모델 초기화 (싱글톤)"""
    global _embedding_model
    
    if not EMBEDDING_AVAILABLE:
        return None
    
    if _embedding_model is not None:
        return _embedding_model
    
    print("🤖 임베딩 모델 로딩 중...")
    print(f"   모델: {MODEL_NAME}")
    
    try:
        _embedding_model = SentenceTransformer(MODEL_NAME)
        print("✅ 임베딩 모델 로딩 완료")
    except Exception as e:
        print(f"❌ 임베딩 모델 로딩 실패: {e}")
        return None
    
    return _embedding_model


def embed_text(text: str) -> Optional[List[float]]:
    """텍스트를 벡터로 변환"""
    model = init_embedding()
    if model is None:
        return None
    
    clean_text = text.strip()[:512]
    embedding = model.encode(clean_text, normalize_embeddings=True)
    return embedding.tolist()


def vector_to_buffer(vector: List[float]) -> bytes:
    """벡터를 Redis 저장용 Buffer로 변환"""
    float32_array = np.array(vector, dtype=np.float32)
    return float32_array.tobytes()


# ===== RedisSearch 검색 모듈 =====

def parse_search_result(result: List) -> List['Chunk']:
    """RedisSearch 결과 파싱"""
    chunks = []
    
    if not result or len(result) < 2:
        return chunks
    
    i = 1
    while i < len(result):
        if i + 1 >= len(result):
            break
        
        doc_key = result[i]
        fields_list = result[i + 1]
        
        fields = {}
        if isinstance(fields_list, list):
            for j in range(0, len(fields_list) - 1, 2):
                field_name = fields_list[j]
                field_value = fields_list[j + 1]
                fields[field_name] = field_value
        
        content = fields.get(b"content", fields.get("content", b""))
        fileName = fields.get(b"fileName", fields.get("fileName", b""))
        chunkIndex = fields.get(b"chunkIndex", fields.get("chunkIndex", b"0"))
        score = None
        
        if b"score" in fields:
            try:
                score = float(fields[b"score"])
            except:
                pass
        elif "score" in fields:
            try:
                score = float(fields["score"])
            except:
                pass
        
        try:
            content_str = content.decode("utf-8", errors="ignore") if isinstance(content, bytes) else str(content)
            fileName_str = fileName.decode("utf-8", errors="ignore") if isinstance(fileName, bytes) else str(fileName)
            chunkIndex_int = int(chunkIndex.decode("utf-8", errors="ignore") if isinstance(chunkIndex, bytes) else str(chunkIndex))
        except:
            i += 2
            continue
        
        chunks.append(Chunk(
            content=content_str,
            fileName=fileName_str,
            chunkIndex=chunkIndex_int,
            score=score
        ))
        
        i += 2
    
    return chunks


def search_by_vector(query_text: str, topK: int = 8) -> List['Chunk']:
    """벡터 유사도 검색 (KNN)"""
    try:
        client = get_redis_client()
        
        print("   쿼리 임베딩 생성 중...")
        query_embedding = embed_text(query_text)
        if query_embedding is None:
            print("   ⚠️ 임베딩 생성 실패, TF-IDF로 폴백")
            return []
        
        query_buffer = vector_to_buffer(query_embedding)
        
        print("   Redis 벡터 검색 수행 중...")
        result = client.execute_command(
            f"*=>[KNN {topK} @embedding $query_vec AS score]",
            "PARAMS", "2", "query_vec", query_buffer,
            "SORTBY", "score",
            "RETURN", "4", "content", "fileName", "chunkIndex", "score",
            "DIALECT", "2"
        )
        
        return parse_search_result(result)
    except Exception as e:
        print(f"⚠️ 벡터 검색 실패: {e}")
        return []


def format_redis_context(chunks: List['Chunk'], is_vector_score: bool = True) -> str:
    """
    검색 결과를 컨텍스트 문자열로 변환 (통합 함수)
    
    Args:
        chunks: 검색된 청크 리스트
        is_vector_score: True면 벡터 검색 점수(거리), False면 TF-IDF 점수(유사도)
    """
    if not chunks:
        return "[컨텍스트 없음]"
    
    context_parts = []
    for chunk in chunks:
        score_text = ""
        if chunk.score is not None:
            if is_vector_score:
                # 벡터 검색: score는 거리이므로 1 - score로 유사도 변환
                similarity = 1 - chunk.score
            else:
                # TF-IDF: score가 이미 유사도
                similarity = chunk.score
            score_text = f" (유사도: {(similarity * 100):.1f}%)"
        
        context_parts.append(
            f"--- [출처: {chunk.fileName}, chunk {chunk.chunkIndex}{score_text}] ---\n{chunk.content}"
        )
    
    return "\n\n".join(context_parts)


# ===== RAG 검색 모듈 (TF-IDF 폴백용) =====

class Chunk:
    """문서 청크"""
    def __init__(self, content: str, fileName: str, chunkIndex: int, score: float = None):
        self.content = content
        self.fileName = fileName
        self.chunkIndex = chunkIndex
        self.score = score


def tokenize(text: str) -> List[str]:
    """한국어 + 영어 토큰화"""
    text = text.lower()
    text = re.sub(r'[^\w\s가-힣]', ' ', text)
    tokens = text.split()
    return [t for t in tokens if len(t) > 1]


def compute_tf_idf(chunks: List[Chunk], query: str) -> List[Tuple[Chunk, float]]:
    """TF-IDF 기반 문서 유사도 계산"""
    if not chunks:
        return []
    
    queryTokens = tokenize(query)
    if not queryTokens:
        return []
    
    N = len(chunks)
    
    # 문서 빈도 계산
    docFreq = Counter()
    for chunk in chunks:
        tokens = set(tokenize(chunk.content))
        docFreq.update(tokens)
    
    # TF-IDF 점수 계산
    results = []
    for chunk in chunks:
        tokens = tokenize(chunk.content)
        if not tokens:
            continue
        
        termFreq = Counter(tokens)
        score = 0.0
        
        for qToken in queryTokens:
            tf = termFreq.get(qToken, 0) / len(tokens)
            df = docFreq.get(qToken, 0)
            idf = math.log(N / df) if df > 0 else 0
            score += tf * idf
        
        if score > 0:
            results.append((chunk, score))
    
    results.sort(key=lambda x: x[1], reverse=True)
    return results


def split_into_chunks(content: str, fileName: str, chunkSize: int = 600, overlap: int = 100) -> List[Chunk]:
    """문서를 chunk로 분할"""
    chunks = []
    lines = content.split("\n")
    currentChunk = ""
    chunkIndex = 0

    for line in lines:
        if len(currentChunk) + len(line) > chunkSize and len(currentChunk) > 0:
            chunks.append(Chunk(
                content=currentChunk.strip(),
                fileName=fileName,
                chunkIndex=chunkIndex
            ))
            chunkIndex += 1
            
            words = currentChunk.split()
            overlapWords = words[-max(1, len(words) // 5):]
            currentChunk = " ".join(overlapWords) + "\n" + line
        else:
            currentChunk += ("\n" if currentChunk else "") + line

    if currentChunk.strip():
        chunks.append(Chunk(
            content=currentChunk.strip(),
            fileName=fileName,
            chunkIndex=chunkIndex
        ))

    return chunks


def load_knowledge_base(knowledgePath: str) -> List[Chunk]:
    """knowledge 폴더에서 모든 문서 로드"""
    chunks = []
    
    if not os.path.exists(knowledgePath):
        print(f"⚠️ knowledge 폴더가 없습니다: {knowledgePath}")
        return chunks
    
    try:
        files = os.listdir(knowledgePath)
        
        for file in files:
            if not (file.endswith(".md") or file.endswith(".txt")):
                continue
            
            filePath = os.path.join(knowledgePath, file)
            try:
                with open(filePath, "r", encoding="utf-8") as f:
                    content = f.read()
                    fileChunks = split_into_chunks(content, file)
                    chunks.extend(fileChunks)
            except Exception as e:
                print(f"⚠️ 파일 읽기 실패 {file}: {e}")
                continue
        
        print(f"📚 {len(chunks)}개의 chunk를 로드했습니다.")
    except Exception as e:
        print(f"⚠️ knowledge 폴더 읽기 실패: {e}")
    
    return chunks


def search_chunks(chunks: List[Chunk], query: str, topK: int = 8) -> List[Chunk]:
    """RAG 검색 수행 - topK개 관련 chunk 반환"""
    if not chunks:
        return []
    
    scored = compute_tf_idf(chunks, query)
    topChunks = []
    
    for chunk, score in scored[:topK]:
        chunk.score = score
        topChunks.append(chunk)
    
    return topChunks


# format_context는 format_redis_context로 통합됨 (is_vector_score=False로 호출)




# 환경 변수 로드 (main.py 기준 경로에서 .env 찾기)
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# FastAPI 앱 초기화
app = FastAPI(
    title="Gemini Image Generation API",
    description="Google Gemini (Nano Banana)를 활용한 이미지 생성/편집 API",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용하도록 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini 클라이언트 초기화
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
IS_MOCK_MODE = not GEMINI_API_KEY  # API 키가 없으면 목업 모드

if IS_MOCK_MODE:
    print("⚠️  GEMINI_API_KEY가 설정되지 않았습니다. 목업 모드로 실행됩니다.")
    client = None
else:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Gemini API 클라이언트가 초기화되었습니다.")


# 채팅 세션 저장소 (메모리 기반, 프로덕션에서는 Redis 등 사용 권장)
chat_sessions = {}

# 목업용 더미 이미지 (1x1 투명 PNG, base64)
MOCK_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 미래 이미지 생성용 프롬프트 (중복 제거를 위해 상수화)
FUTURE_IMAGE_PROMPTS = {
    "year_10": "이 사진의 인물이 10년 후의 모습을 상상해서 생성해주세요. 약간의 성숙함과 여유로운 표정을 더하고, 자연스러운 미세한 노화 (얼굴선이 조금 더 또렷해지고, 눈가에 미세한 웃음주름) 를 반영해주세요. 하지만 전체적으로 건강하고 활력있는 모습으로 표현해주세요. 동일 인물임을 알 수 있도록 얼굴 특징을 유지해주세요.",
    "year_30": "이 사진의 인물이 30년 후의 모습을 상상해서 생성해주세요. 중년의 성숙미와 지혜로운 인상을 담아주세요. 자연스러운 주름, 약간 희끗해진 머리카락, 눈가와 미간의 세월 흔적을 표현하되, 인자하고 편안한 미소를 담아주세요. 원본 사진의 얼굴 특징과 인상은 유지해주세요.",
    "year_50": "이 사진의 인물이 50년 후 노년의 모습을 상상해서 생성해주세요. 깊은 주름, 흰머리, 그러나 지혜롭고 평온한 눈빛을 가진 노인으로 표현해주세요. 건강하고 품위 있는 노년의 모습으로, 따뜻한 미소를 띤 인자한 할머니/할아버지의 인상으로 만들어주세요. 원본의 얼굴 특징은 유지해주세요."
}

# ===== Pydantic 모델 정의 =====

class TextToImageRequest(BaseModel):
    """텍스트로 이미지 생성 요청"""
    prompt: str = Field(..., description="이미지 생성을 위한 프롬프트")
    model: str = Field(
        default="gemini-2.5-flash-image",
        description="사용할 모델 (gemini-2.5-flash-image 또는 gemini-3-pro-image-preview)"
    )
    aspect_ratio: Optional[str] = Field(
        default="1:1",
        description="가로세로 비율 (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)"
    )
    image_size: Optional[str] = Field(
        default=None,
        description="이미지 크기 (1K, 2K, 4K) - gemini-3-pro-image-preview에서만 지원"
    )
    response_modalities: Optional[List[str]] = Field(
        default=["TEXT", "IMAGE"],
        description="응답 모달리티 (['TEXT', 'IMAGE'] 또는 ['IMAGE'])"
    )
    use_google_search: bool = Field(
        default=False,
        description="Google 검색 그라운딩 사용 여부"
    )


class ImageEditRequest(BaseModel):
    """이미지 편집 요청 (Base64 인코딩된 이미지 사용)"""
    prompt: str = Field(..., description="이미지 편집을 위한 프롬프트")
    image_base64: str = Field(..., description="Base64 인코딩된 이미지")
    image_mime_type: str = Field(
        default="image/png",
        description="이미지 MIME 타입 (image/png, image/jpeg, image/webp, image/gif)"
    )
    model: str = Field(
        default="gemini-2.5-flash-image",
        description="사용할 모델"
    )
    aspect_ratio: Optional[str] = Field(default="1:1", description="가로세로 비율")


class ChatSessionRequest(BaseModel):
    """채팅 세션 생성 요청"""
    model: str = Field(
        default="gemini-3-pro-image-preview",
        description="사용할 모델"
    )
    use_google_search: bool = Field(
        default=False,
        description="Google 검색 도구 사용 여부"
    )


class ChatMessageRequest(BaseModel):
    """채팅 메시지 전송 요청"""
    session_id: str = Field(..., description="채팅 세션 ID")
    message: str = Field(..., description="전송할 메시지")
    aspect_ratio: Optional[str] = Field(default=None, description="가로세로 비율")
    image_size: Optional[str] = Field(default=None, description="이미지 크기")


class ImageResponse(BaseModel):
    """이미지 응답"""
    success: bool
    text: Optional[str] = None
    images: List[dict] = Field(default_factory=list)
    message: Optional[str] = None


class ChatSessionResponse(BaseModel):
    """채팅 세션 응답"""
    session_id: str
    model: str
    created_at: str


# ===== 헬퍼 함수 =====

def process_response_parts(response) -> tuple[Optional[str], List[dict]]:
    """
    Gemini 응답에서 텍스트와 이미지를 추출
    """
    text_content = None
    images = []
    
    for part in response.parts:
        if part.text is not None:
            text_content = part.text
        elif part.inline_data is not None:
            # 이미지를 Base64로 인코딩
            image_data = part.inline_data.data
            mime_type = part.inline_data.mime_type
            
            # Base64 인코딩
            if isinstance(image_data, bytes):
                b64_data = base64.b64encode(image_data).decode('utf-8')
            else:
                b64_data = image_data
            
            images.append({
                "data": b64_data,
                "mime_type": mime_type,
                "data_uri": f"data:{mime_type};base64,{b64_data}"
            })
    
    return text_content, images


def create_image_config(aspect_ratio: Optional[str], image_size: Optional[str], model: str) -> types.ImageConfig:
    """
    이미지 설정 생성
    """
    config_params = {}
    
    if aspect_ratio:
        config_params["aspect_ratio"] = aspect_ratio
    
    # image_size는 gemini-3-pro-image-preview에서만 지원
    if image_size and "gemini-3-pro" in model:
        config_params["image_size"] = image_size
    
    return types.ImageConfig(**config_params) if config_params else None


# ===== API 엔드포인트 =====

@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "status": "healthy",
        "service": "Gemini Image Generation API",
        "version": "1.0.0",
        "supported_models": [
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview"
        ]
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/generate", response_model=ImageResponse)
async def generate_image(request: TextToImageRequest):
    """
    텍스트 프롬프트로 이미지 생성 (Text-to-Image)
    
    지원 모델:
    - gemini-2.5-flash-image: 빠른 이미지 생성
    - gemini-3-pro-image-preview: 고품질 이미지 생성 (최대 4K)
    """
    try:
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": request.response_modalities
        }
        
        # 이미지 설정
        image_config = create_image_config(
            request.aspect_ratio,
            request.image_size,
            request.model
        )
        if image_config:
            config_params["image_config"] = image_config
        
        # Google 검색 도구 설정
        if request.use_google_search:
            config_params["tools"] = [{"google_search": {}}]
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 생성 요청
        response = client.models.generate_content(
            model=request.model,
            contents=[request.prompt],
            config=config
        )
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="이미지 생성 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 생성 실패: {str(e)}")


@app.post("/api/edit", response_model=ImageResponse)
async def edit_image(request: ImageEditRequest):
    """
    기존 이미지를 텍스트 프롬프트로 편집
    
    Base64 인코딩된 이미지와 프롬프트를 받아 편집된 이미지 반환
    """
    try:
        # Base64 이미지 디코딩
        image_bytes = base64.b64decode(request.image_base64)
        
        # 이미지 Part 생성
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=request.image_mime_type,
                data=image_bytes
            )
        )
        
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        image_config = create_image_config(request.aspect_ratio, None, request.model)
        if image_config:
            config_params["image_config"] = image_config
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 편집 요청
        response = client.models.generate_content(
            model=request.model,
            contents=[request.prompt, image_part],
            config=config
        )
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="이미지 편집 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 편집 실패: {str(e)}")


@app.post("/api/edit/upload", response_model=ImageResponse)
async def edit_image_upload(
    prompt: str = Form(..., description="이미지 편집을 위한 프롬프트"),
    image: UploadFile = File(..., description="편집할 이미지 파일"),
    model: str = Form(default="gemini-2.5-flash-image", description="사용할 모델"),
    aspect_ratio: str = Form(default="1:1", description="가로세로 비율")
):
    """
    파일 업로드 방식으로 이미지 편집
    
    이미지 파일을 직접 업로드하여 편집
    """
    try:
        # 이미지 파일 읽기
        image_bytes = await image.read()
        mime_type = image.content_type or "image/png"
        
        # 이미지 Part 생성
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=mime_type,
                data=image_bytes
            )
        )
        
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        image_config = create_image_config(aspect_ratio, None, model)
        if image_config:
            config_params["image_config"] = image_config
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 편집 요청
        response = client.models.generate_content(
            model=model,
            contents=[prompt, image_part],
            config=config
        )
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="이미지 편집 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 편집 실패: {str(e)}")


@app.post("/api/edit/multiple", response_model=ImageResponse)
async def edit_multiple_images(
    prompt: str = Form(..., description="이미지 편집/결합을 위한 프롬프트"),
    images: List[UploadFile] = File(..., description="참조 이미지들 (최대 14개)"),
    model: str = Form(default="gemini-3-pro-image-preview", description="사용할 모델"),
    aspect_ratio: str = Form(default="1:1", description="가로세로 비율"),
    image_size: str = Form(default="1K", description="이미지 크기 (1K, 2K, 4K)")
):
    """
    여러 이미지를 결합하여 새 이미지 생성
    
    Gemini 3 Pro는 최대 14개의 참조 이미지를 지원합니다.
    - 최대 6개의 충실도 높은 객체 이미지
    - 최대 5개의 인물 이미지 (캐릭터 일관성용)
    """
    try:
        if len(images) > 14:
            raise HTTPException(status_code=400, detail="최대 14개의 이미지만 지원됩니다.")
        
        contents = [prompt]
        
        # 모든 이미지를 contents에 추가
        for img in images:
            image_bytes = await img.read()
            mime_type = img.content_type or "image/png"
            
            image_part = types.Part(
                inline_data=types.Blob(
                    mime_type=mime_type,
                    data=image_bytes
                )
            )
            contents.append(image_part)
        
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        image_config = create_image_config(aspect_ratio, image_size, model)
        if image_config:
            config_params["image_config"] = image_config
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 생성 요청
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config
        )
        
        # 응답 처리
        text_content, result_images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=result_images,
            message=f"{len(images)}개의 참조 이미지로 새 이미지 생성 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 생성 실패: {str(e)}")


# ===== 채팅 세션 API (멀티턴 이미지 수정) =====

@app.post("/api/chat/create", response_model=ChatSessionResponse)
async def create_chat_session(request: ChatSessionRequest):
    """
    멀티턴 이미지 수정을 위한 채팅 세션 생성
    
    채팅 세션을 통해 이미지를 반복적으로 수정할 수 있습니다.
    """
    try:
        session_id = str(uuid.uuid4())
        
        # 채팅 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        if request.use_google_search:
            config_params["tools"] = [{"google_search": {}}]
        
        config = types.GenerateContentConfig(**config_params)
        
        # 채팅 세션 생성
        chat = client.chats.create(
            model=request.model,
            config=config
        )
        
        # 세션 저장
        chat_sessions[session_id] = {
            "chat": chat,
            "model": request.model,
            "created_at": datetime.now().isoformat()
        }
        
        return ChatSessionResponse(
            session_id=session_id,
            model=request.model,
            created_at=chat_sessions[session_id]["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 세션 생성 실패: {str(e)}")


@app.post("/api/chat/message", response_model=ImageResponse)
async def send_chat_message(request: ChatMessageRequest):
    """
    채팅 세션에 메시지 전송
    
    멀티턴 대화를 통해 이미지를 반복적으로 수정합니다.
    """
    try:
        if request.session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
        
        session = chat_sessions[request.session_id]
        chat = session["chat"]
        model = session["model"]
        
        # 이미지 설정 (있는 경우)
        send_config = None
        if request.aspect_ratio or request.image_size:
            image_config = create_image_config(request.aspect_ratio, request.image_size, model)
            if image_config:
                send_config = types.GenerateContentConfig(image_config=image_config)
        
        # 메시지 전송
        if send_config:
            response = chat.send_message(request.message, config=send_config)
        else:
            response = chat.send_message(request.message)
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="메시지 처리 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메시지 전송 실패: {str(e)}")


@app.delete("/api/chat/{session_id}")
async def delete_chat_session(session_id: str):
    """채팅 세션 삭제"""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
    
    del chat_sessions[session_id]
    return {"success": True, "message": "채팅 세션이 삭제되었습니다."}


@app.get("/api/chat/sessions")
async def list_chat_sessions():
    """현재 활성화된 채팅 세션 목록"""
    sessions = []
    for session_id, session_data in chat_sessions.items():
        sessions.append({
            "session_id": session_id,
            "model": session_data["model"],
            "created_at": session_data["created_at"]
        })
    return {"sessions": sessions, "count": len(sessions)}


# ===== 유틸리티 엔드포인트 =====

@app.get("/api/models")
async def list_supported_models():
    """지원되는 모델 목록 및 기능 설명"""
    return {
        "models": [
            {
                "id": "gemini-2.5-flash-image",
                "name": "Nano Banana",
                "description": "속도와 효율성을 위해 설계된 모델. 대량의 낮은 지연 시간 작업에 최적화",
                "max_resolution": "1024px",
                "max_input_images": 3,
                "features": ["텍스트-이미지 생성", "이미지 편집", "스타일 전이"]
            },
            {
                "id": "gemini-3-pro-image-preview",
                "name": "Nano Banana Pro",
                "description": "전문적인 애셋 제작을 위해 설계된 모델. 고급 추론과 사고 기능 포함",
                "max_resolution": "4K",
                "max_input_images": 14,
                "features": [
                    "고해상도 출력 (1K, 2K, 4K)",
                    "고급 텍스트 렌더링",
                    "Google 검색 그라운딩",
                    "사고 모드",
                    "최대 14개 참조 이미지"
                ]
            }
        ],
        "supported_aspect_ratios": [
            "1:1", "2:3", "3:2", "3:4", "4:3", 
            "4:5", "5:4", "9:16", "16:9", "21:9"
        ],
        "supported_image_sizes": ["1K", "2K", "4K"]
    }


# ===== 미래 이미지 생성 API =====

class FutureImageRequest(BaseModel):
    """미래 이미지 생성 요청 (Base64 인코딩된 이미지 사용)"""
    image_base64: str = Field(..., description="Base64 인코딩된 원본 이미지")
    image_mime_type: str = Field(
        default="image/png",
        description="이미지 MIME 타입"
    )
    model: str = Field(
        default="gemini-2.5-flash-image",
        description="사용할 모델"
    )


class FutureImageResponse(BaseModel):
    """미래 이미지 응답"""
    success: bool
    current: Optional[dict] = None  # 현재 이미지
    year_10: Optional[dict] = None  # 10년 후
    year_30: Optional[dict] = None  # 30년 후
    year_50: Optional[dict] = None  # 50년 후
    message: Optional[str] = None


def _create_mock_future_response() -> FutureImageResponse:
    """목업 모드용 미래 이미지 응답 생성"""
    mock_image = {
        "data": MOCK_IMAGE_BASE64,
        "mime_type": "image/png",
        "data_uri": f"data:image/png;base64,{MOCK_IMAGE_BASE64}"
    }
    return FutureImageResponse(
        success=True,
        current=None,
        year_10=mock_image,
        year_30=mock_image,
        year_50=mock_image,
        message="[목업 모드] API 키가 없어 더미 이미지를 반환합니다."
    )


def _generate_future_images_core(image_part: types.Part, model: str) -> Dict[str, Optional[dict]]:
    """
    미래 이미지 생성 핵심 로직 (공통 함수)
    
    Args:
        image_part: Gemini API용 이미지 Part
        model: 사용할 모델명
        
    Returns:
        Dict: year_10, year_30, year_50 키를 가진 결과 딕셔너리
    """
    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="3:4")
    )
    
    results = {}
    
    for period, prompt in FUTURE_IMAGE_PROMPTS.items():
        try:
            response = client.models.generate_content(
                model=model,
                contents=[prompt, image_part],
                config=config
            )
            
            _, images = process_response_parts(response)
            results[period] = images[0] if images else None
                
        except Exception as e:
            print(f"Error generating {period} image: {str(e)}")
            results[period] = None
    
    return results


@app.post("/api/future-image", response_model=FutureImageResponse)
async def generate_future_images(request: FutureImageRequest):
    """
    업로드된 사진을 기반으로 현재, 10년 후, 30년 후, 50년 후 이미지 생성
    
    한 장의 사진에서 4가지 시점의 나이든 모습을 AI로 생성합니다.
    """
    if IS_MOCK_MODE:
        return _create_mock_future_response()
    
    try:
        image_bytes = base64.b64decode(request.image_base64)
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=request.image_mime_type,
                data=image_bytes
            )
        )
        
        results = _generate_future_images_core(image_part, request.model)
        
        return FutureImageResponse(
            success=True,
            current=None,
            year_10=results.get("year_10"),
            year_30=results.get("year_30"),
            year_50=results.get("year_50"),
            message="미래 이미지 생성 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"미래 이미지 생성 실패: {str(e)}")


@app.post("/api/image/upload", response_model=FutureImageResponse)
async def generate_future_images_upload(
    image: UploadFile = File(..., description="원본 이미지 파일"),
    model: str = Form(default="gemini-2.5-flash-image", description="사용할 모델")
):
    """
    파일 업로드 방식으로 미래 이미지 생성
    
    이미지 파일을 직접 업로드하여 3가지 시점의 미래 이미지를 생성합니다.
    """
    if IS_MOCK_MODE:
        return _create_mock_future_response()
    
    try:
        image_bytes = await image.read()
        mime_type = image.content_type or "image/png"
        
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=mime_type,
                data=image_bytes
            )
        )
        
        results = _generate_future_images_core(image_part, model)
        
        return FutureImageResponse(
            success=True,
            current=None,
            year_10=results.get("year_10"),
            year_30=results.get("year_30"),
            year_50=results.get("year_50"),
            message="미래 이미지 생성 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"미래 이미지 생성 실패: {str(e)}")


@app.get("/api/prompt-templates")
async def get_prompt_templates():
    """이미지 생성을 위한 프롬프트 템플릿 예시"""
    return {
        "templates": [
            {
                "category": "실사형 장면",
                "template": "A photorealistic [shot type] of [subject], [action or expression], set in [environment]. The scene is illuminated by [lighting description], creating a [mood] atmosphere. Captured with a [camera/lens details], emphasizing [key textures and details]. The image should be in a [aspect ratio] format.",
                "example": "A photorealistic close-up portrait of an elderly Japanese potter, deeply focused on shaping clay on a spinning wheel, set in a traditional, sunlit workshop. The scene is illuminated by soft, diffused natural light from a nearby window, creating a serene atmosphere."
            },
            {
                "category": "스티커/삽화",
                "template": "A [style] sticker of a [subject], featuring [key characteristics] and a [color palette]. The design should have [line style] and [shading style]. The background must be transparent.",
                "example": "A kawaii-style sticker of a happy red panda, featuring large expressive eyes and a fluffy tail with a pastel color palette. The design should have clean outlines and soft cel-shading. The background must be transparent."
            },
            {
                "category": "이미지 내 텍스트",
                "template": "Create a [image type] for [brand/concept] with the text \"[text to render]\" in a [font style]. The design should be [style description], with a [color scheme].",
                "example": "Create a logo for a coffee shop called 'The Daily Grind' with the text 'The Daily Grind' in a modern sans-serif font. The design should be minimalist and elegant, with an earthy brown and cream color scheme."
            },
            {
                "category": "제품 사진",
                "template": "A high-resolution, studio-lit product photograph of a [product description] on a [background surface/description]. The lighting is a [lighting setup] to [lighting purpose]. The camera angle is a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp focus on [key detail]. [Aspect ratio].",
                "example": "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug on a polished marble surface. The lighting is a three-point softbox setup to minimize harsh shadows."
            },
            {
                "category": "이미지 편집 - 요소 추가",
                "template": "Using the provided image of [subject], please [add/remove/modify] [element] to/from the scene. Ensure the change is [description of how the change should integrate].",
                "example": "Using the provided image of a fluffy ginger cat, please add a small, knitted wizard hat. Ensure the change is seamlessly integrated with realistic shadows."
            },
            {
                "category": "스타일 전이",
                "template": "Transform the provided photograph of [subject] into the artistic style of [artist/art style]. Preserve the original composition but render it with [description of stylistic elements].",
                "example": "Transform the provided photograph of a city street into the artistic style of Van Gogh. Preserve the original composition but render it with bold, swirling brushstrokes and vibrant colors."
            }
        ]
    }






# ===== 모임 오행 조합 API (RAG 활용) =====

ELEMENT_NAMES = {"목": "목(木)", "화": "화(火)", "토": "토(土)", "금": "금(金)", "수": "수(水)"}
SUPPLEMENT_THRESHOLD = 3  # 이 이상이면 "많음"
CONFLICT_THRESHOLD = 3   # 둘 다 이 이상이면 "상충"
CONFLICT_BOTH_MIN = 2    # 둘 다 2 이상이면 상충 후보 (같은 기운 강함)


class FiveElementsBody(BaseModel):
    """오행 분포 (목·화·토·금·수 개수)"""
    목: int = Field(default=0, description="목 오행 개수")
    화: int = Field(default=0, description="화 오행 개수")
    토: int = Field(default=0, description="토 오행 개수")
    금: int = Field(default=0, description="금 오행 개수")
    수: int = Field(default=0, description="수 오행 개수")


class GroupOhengMember(BaseModel):
    """모임 멤버 (이름 + 오행)"""
    name: str = Field(..., description="멤버 이름")
    fiveElements: FiveElementsBody = Field(..., description="오행 분포")


class GroupOhengCombinationRequest(BaseModel):
    """모임 오행 조합 요청"""
    members: List[GroupOhengMember] = Field(..., description="멤버 목록 (이름 + 오행)")


class SupplementPair(BaseModel):
    """기운 채워줌 쌍"""
    fromName: str = Field(..., description="기운을 채워 주는 사람")
    toName: str = Field(..., description="기운을 받는 사람")
    element: str = Field(..., description="오행 (목/화/토/금/수)")
    elementLabel: str = Field(..., description="오행 한글 라벨 (예: 금(金))")
    explanation: str = Field(default="", description="RAG 기반 해석")


class ConflictPair(BaseModel):
    """상충 쌍"""
    name1: str = Field(..., description="멤버1")
    name2: str = Field(..., description="멤버2")
    element: str = Field(..., description="오행 (목/화/토/금/수)")
    elementLabel: str = Field(..., description="오행 한글 라벨")
    explanation: str = Field(default="", description="RAG 기반 해석")


class GroupOhengCombinationResponse(BaseModel):
    """모임 오행 조합 응답"""
    success: bool = True
    supplement: List[SupplementPair] = Field(default_factory=list, description="기운 채워줌 목록")
    conflict: List[ConflictPair] = Field(default_factory=list, description="상충 목록")
    summary: Optional[str] = Field(default=None, description="요약 (선택)")


def _get_rag_explanation_for_meeting(query: str, top_k: int = 3) -> str:
    """모임 오행 지식베이스에서 RAG 검색 후 해석 문단 반환"""
    if not KNOWLEDGE_CHUNKS:
        return ""
    chunks = search_chunks(KNOWLEDGE_CHUNKS, query, topK=top_k)
    if not chunks:
        return ""
    return chunks[0].content if chunks else ""


def _get_element_val(fe: FiveElementsBody, elem: str) -> int:
    """FiveElementsBody에서 오행 값 읽기"""
    return getattr(fe, elem, 0)


def _compute_supplement_pairs(members: List[GroupOhengMember]) -> List[SupplementPair]:
    """기운 채워줌 쌍 계산: A는 해당 오행 많음(>=3), B는 해당 오행 없음(0)"""
    pairs: List[SupplementPair] = []
    elements = ["목", "화", "토", "금", "수"]

    for elem in elements:
        for i, a in enumerate(members):
            val_a = _get_element_val(a.fiveElements, elem)
            if val_a < SUPPLEMENT_THRESHOLD:
                continue
            for j, b in enumerate(members):
                if i == j:
                    continue
                val_b = _get_element_val(b.fiveElements, elem)
                if val_b != 0:
                    continue
                query = f"모임 오행 기운 채워줌 {elem} 기운"
                context = _get_rag_explanation_for_meeting(query, top_k=2)
                explanation = context.split("---")[0].strip() if context else f"{a.name}님이 {b.name}님의 {ELEMENT_NAMES.get(elem, elem)} 기운을 채워 주는 관계입니다."
                if len(explanation) > 400:
                    explanation = explanation[:397] + "..."
                pairs.append(SupplementPair(
                    fromName=a.name,
                    toName=b.name,
                    element=elem,
                    elementLabel=ELEMENT_NAMES.get(elem, elem),
                    explanation=explanation
                ))
    return pairs


def _compute_conflict_pairs(members: List[GroupOhengMember]) -> List[ConflictPair]:
    """상충 쌍 계산: 둘 다 같은 오행이 강함(각 2 이상)"""
    pairs: List[ConflictPair] = []
    elements = ["목", "화", "토", "금", "수"]

    for elem in elements:
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                a, b = members[i], members[j]
                va, vb = _get_element_val(a.fiveElements, elem), _get_element_val(b.fiveElements, elem)
                if va >= CONFLICT_BOTH_MIN and vb >= CONFLICT_BOTH_MIN:
                    query = f"모임 오행 상충 {elem} 같은 기운"
                    context = _get_rag_explanation_for_meeting(query, top_k=2)
                    explanation = context.split("---")[0].strip() if context else f"{a.name}님과 {b.name}님은 둘 다 {ELEMENT_NAMES.get(elem, elem)} 기운이 강해 같은 기운이라 상충할 수 있습니다."
                    if len(explanation) > 400:
                        explanation = explanation[:397] + "..."
                    pairs.append(ConflictPair(
                        name1=a.name,
                        name2=b.name,
                        element=elem,
                        elementLabel=ELEMENT_NAMES.get(elem, elem),
                        explanation=explanation
                    ))
    return pairs


@app.post("/api/group-oheng-combination", response_model=GroupOhengCombinationResponse)
async def group_oheng_combination(request: GroupOhengCombinationRequest):
    """
    모임 관상 결과용 오행 조합 분석 (RAG 활용)

    - 기운 채워줌: 한 사람은 해당 오행이 많고, 다른 사람은 그 오행이 없음 → 채워 주는 관계
    - 상충: 두 사람 모두 같은 오행이 많음 → 같은 기운이라 상충

    멤버별 오행(목·화·토·금·수 개수)을 넘기면 규칙으로 쌍을 찾고, RAG 지식베이스에서 해석 문단을 가져와 반환합니다.
    """
    try:
        if not request.members or len(request.members) < 2:
            return GroupOhengCombinationResponse(
                success=True,
                supplement=[],
                conflict=[],
                summary="멤버가 2명 이상일 때만 오행 조합을 분석합니다."
            )

        supplement = _compute_supplement_pairs(request.members)
        conflict = _compute_conflict_pairs(request.members)

        summary_parts = []
        if supplement:
            summary_parts.append(f"기운 채워줌 {len(supplement)}쌍: " + ", ".join(f"{p.fromName}→{p.toName}({p.elementLabel})" for p in supplement[:5]))
        if conflict:
            summary_parts.append(f"상충 {len(conflict)}쌍: " + ", ".join(f"{p.name1}-{p.name2}({p.elementLabel})" for p in conflict[:5]))
        summary = " ".join(summary_parts) if summary_parts else "채워줌/상충 쌍이 없습니다."

        return GroupOhengCombinationResponse(
            success=True,
            supplement=supplement,
            conflict=conflict,
            summary=summary
        )
    except Exception as e:
        print(f"❌ 모임 오행 조합 분석 오류: {e}")
        import traceback
        traceback.print_exc()
        return GroupOhengCombinationResponse(
            success=False,
            supplement=[],
            conflict=[],
            summary=None
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
