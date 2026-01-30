"""
RedisSearch 검색 모듈 (Python 버전)
벡터 검색 및 풀텍스트 검색 구현
"""

from typing import List, Optional
from redis_client import (
    get_redis_client,
    SAJU_INDEX_NAME,
    SAJU_DOC_PREFIX,
    index_exists,
    get_indexed_doc_count
)
from embedding import embed_text, vector_to_buffer, EMBEDDING_DIMENSION
from rag_search import Chunk


def create_saju_index():
    """RedisSearch 인덱스 생성"""
    client = get_redis_client()
    
    # 기존 인덱스 확인
    if index_exists(SAJU_INDEX_NAME):
        print(f"⚠️ 인덱스 '{SAJU_INDEX_NAME}' 이미 존재함")
        return
    
    print(f"📋 인덱스 '{SAJU_INDEX_NAME}' 생성 중...")
    
    try:
        # FT.CREATE 명령 실행
        client.execute_command(
            "FT.CREATE", SAJU_INDEX_NAME,
            "ON", "HASH",
            "PREFIX", "1", SAJU_DOC_PREFIX,
            "SCHEMA",
            "content", "TEXT", "WEIGHT", "1.0",
            "fileName", "TAG",
            "chunkIndex", "NUMERIC",
            "embedding", "VECTOR", "HNSW", "6",
            "TYPE", "FLOAT32",
            "DIM", str(EMBEDDING_DIMENSION),
            "DISTANCE_METRIC", "COSINE"
        )
        print(f"✅ 인덱스 '{SAJU_INDEX_NAME}' 생성 완료")
    except Exception as e:
        print(f"❌ 인덱스 생성 실패: {e}")
        raise


def drop_saju_index():
    """인덱스 삭제"""
    client = get_redis_client()
    
    if not index_exists(SAJU_INDEX_NAME):
        print(f"⚠️ 인덱스 '{SAJU_INDEX_NAME}' 존재하지 않음")
        return
    
    try:
        client.execute_command("FT.DROPINDEX", SAJU_INDEX_NAME, "DD")
        print(f"🗑️ 인덱스 '{SAJU_INDEX_NAME}' 삭제 완료")
    except Exception as e:
        print(f"❌ 인덱스 삭제 실패: {e}")
        raise


def parse_search_result(result: List) -> List[Chunk]:
    """
    RedisSearch 결과 파싱
    
    Args:
        result: FT.SEARCH 결과 (리스트 형태)
        - result[0]: 총 개수
        - result[1]: 첫 번째 문서 키
        - result[2]: 첫 번째 문서 필드 (리스트: [field1, val1, field2, val2, ...])
        - result[3]: 두 번째 문서 키
        - ...
    
    Returns:
        List[Chunk]: 청크 리스트
    """
    chunks = []
    
    if not result or len(result) < 2:
        return chunks
    
    # result[0] = 총 개수
    # result[1:] = (키, 필드리스트) 쌍
    total_count = result[0]
    
    i = 1
    while i < len(result):
        if i + 1 >= len(result):
            break
        
        doc_key = result[i]
        fields_list = result[i + 1]
        
        # fields_list는 리스트 형태: [field1, val1, field2, val2, ...]
        # 딕셔너리로 변환
        fields = {}
        if isinstance(fields_list, list):
            for j in range(0, len(fields_list) - 1, 2):
                field_name = fields_list[j]
                field_value = fields_list[j + 1]
                fields[field_name] = field_value
        
        # 필드 추출
        content = b""
        fileName = b""
        chunkIndex = b"0"
        score = None
        
        if b"content" in fields:
            content = fields[b"content"]
        elif "content" in fields:
            content = fields["content"]
            if isinstance(content, str):
                content = content.encode("utf-8")
        
        if b"fileName" in fields:
            fileName = fields[b"fileName"]
        elif "fileName" in fields:
            fileName = fields["fileName"]
            if isinstance(fileName, str):
                fileName = fileName.encode("utf-8")
        
        if b"chunkIndex" in fields:
            chunkIndex = fields[b"chunkIndex"]
        elif "chunkIndex" in fields:
            chunkIndex = fields["chunkIndex"]
            if isinstance(chunkIndex, (int, float)):
                chunkIndex = str(int(chunkIndex)).encode("utf-8")
            elif isinstance(chunkIndex, str):
                chunkIndex = chunkIndex.encode("utf-8")
        
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
        
        # 디코딩
        try:
            content_str = content.decode("utf-8", errors="ignore") if isinstance(content, bytes) else str(content)
            fileName_str = fileName.decode("utf-8", errors="ignore") if isinstance(fileName, bytes) else str(fileName)
            chunkIndex_int = int(chunkIndex.decode("utf-8", errors="ignore") if isinstance(chunkIndex, bytes) else str(chunkIndex))
        except:
            continue
        
        chunks.append(Chunk(
            content=content_str,
            fileName=fileName_str,
            chunkIndex=chunkIndex_int,
            score=score
        ))
        
        i += 2
    
    return chunks


def search_by_vector(
    query_text: str,
    topK: int = 8
) -> List[Chunk]:
    """
    벡터 유사도 검색 (KNN)
    
    Args:
        query_text: 검색 쿼리 텍스트
        topK: 반환할 상위 개수
    
    Returns:
        List[Chunk]: 관련 청크 리스트
    """
    client = get_redis_client()
    
    # 쿼리 텍스트 임베딩
    print("   쿼리 임베딩 생성 중...")
    query_embedding = embed_text(query_text)
    query_buffer = vector_to_buffer(query_embedding)
    
    # FT.SEARCH 명령 (KNN 벡터 검색)
    print("   Redis 벡터 검색 수행 중...")
    try:
        result = client.execute_command(
            "FT.SEARCH", SAJU_INDEX_NAME,
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


def search_by_text(
    query_text: str,
    topK: int = 8
) -> List[Chunk]:
    """
    풀텍스트 검색
    
    Args:
        query_text: 검색 쿼리 텍스트
        topK: 반환할 상위 개수
    
    Returns:
        List[Chunk]: 관련 청크 리스트
    """
    client = get_redis_client()
    
    # 검색어 정리
    import re
    clean_query = re.sub(r"[^\w\s가-힣]", " ", query_text)
    clean_query = " ".join([t for t in clean_query.split() if len(t) > 1])
    
    if not clean_query:
        return []
    
    try:
        result = client.execute_command(
            "FT.SEARCH", SAJU_INDEX_NAME,
            clean_query,
            "LIMIT", "0", str(topK),
            "RETURN", "3", "content", "fileName", "chunkIndex"
        )
        
        return parse_search_result(result)
    except Exception as e:
        print(f"⚠️ 텍스트 검색 실패: {e}")
        return []


def format_search_context(chunks: List[Chunk]) -> str:
    """
    검색 결과를 컨텍스트 문자열로 변환
    
    Args:
        chunks: 청크 리스트
    
    Returns:
        str: 포맷된 컨텍스트 문자열
    """
    if not chunks:
        return "[컨텍스트 없음]"
    
    context_parts = []
    for chunk in chunks:
        score_text = ""
        if chunk.score is not None:
            # 코사인 거리를 유사도로 변환 (1 - distance)
            similarity = 1 - chunk.score
            score_text = f" (유사도: {(similarity * 100):.1f}%)"
        
        context_parts.append(
            f"--- [출처: {chunk.fileName}, chunk {chunk.chunkIndex}{score_text}] ---\n{chunk.content}"
        )
    
    return "\n\n".join(context_parts)
