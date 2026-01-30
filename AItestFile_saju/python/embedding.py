"""
임베딩 모듈 (Python 버전)
sentence-transformers를 사용한 텍스트 벡터화
"""

from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

# 임베딩 모델 설정
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
# 한국어 지원 다국어 모델
# 차원: 384

EMBEDDING_DIMENSION = 384

# 임베딩 모델 싱글톤
_embedding_model: Optional[SentenceTransformer] = None
_is_initializing = False


def init_embedding() -> SentenceTransformer:
    """
    임베딩 모델 초기화 (싱글톤)
    
    Returns:
        SentenceTransformer: 임베딩 모델
    """
    global _embedding_model, _is_initializing
    
    if _embedding_model is not None:
        return _embedding_model
    
    if _is_initializing:
        # 초기화 중이면 대기
        import time
        while _embedding_model is None:
            time.sleep(0.1)
        return _embedding_model
    
    _is_initializing = True
    print("🤖 임베딩 모델 로딩 중...")
    print(f"   모델: {MODEL_NAME}")
    
    try:
        _embedding_model = SentenceTransformer(MODEL_NAME)
        print("✅ 임베딩 모델 로딩 완료")
    except Exception as e:
        print(f"❌ 임베딩 모델 로딩 실패: {e}")
        raise
    finally:
        _is_initializing = False
    
    return _embedding_model


def embed_text(text: str) -> List[float]:
    """
    텍스트를 벡터로 변환
    
    Args:
        text: 입력 텍스트
    
    Returns:
        List[float]: 벡터 (384차원)
    """
    model = init_embedding()
    
    # 텍스트 정규화 (최대 512자)
    clean_text = text.strip()[:512]
    
    # 임베딩 생성
    embedding = model.encode(clean_text, normalize_embeddings=True)
    
    # numpy 배열을 리스트로 변환
    return embedding.tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    여러 텍스트를 벡터로 변환 (배치 처리)
    
    Args:
        texts: 텍스트 리스트
    
    Returns:
        List[List[float]]: 벡터 리스트
    """
    model = init_embedding()
    
    # 텍스트 정규화
    clean_texts = [text.strip()[:512] for text in texts]
    
    # 배치 임베딩 생성
    embeddings = model.encode(clean_texts, normalize_embeddings=True)
    
    # numpy 배열을 리스트로 변환
    return embeddings.tolist()


def vector_to_buffer(vector: List[float]) -> bytes:
    """
    벡터를 Redis 저장용 Buffer로 변환
    
    Args:
        vector: 벡터 리스트
    
    Returns:
        bytes: 바이너리 버퍼
    """
    float32_array = np.array(vector, dtype=np.float32)
    return float32_array.tobytes()


def buffer_to_vector(buffer: bytes) -> List[float]:
    """
    Buffer를 벡터로 변환
    
    Args:
        buffer: 바이너리 버퍼
    
    Returns:
        List[float]: 벡터 리스트
    """
    float32_array = np.frombuffer(buffer, dtype=np.float32)
    return float32_array.tolist()


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    코사인 유사도 계산 (디버깅/테스트용)
    
    Args:
        a: 벡터 A
        b: 벡터 B
    
    Returns:
        float: 코사인 유사도 (0~1)
    """
    if len(a) != len(b):
        raise ValueError("벡터 차원이 일치하지 않습니다")
    
    a_np = np.array(a)
    b_np = np.array(b)
    
    dot_product = np.dot(a_np, b_np)
    norm_a = np.linalg.norm(a_np)
    norm_b = np.linalg.norm(b_np)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(dot_product / (norm_a * norm_b))
