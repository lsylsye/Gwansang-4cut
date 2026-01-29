"""
RAG 검색 모듈 (Python 버전)
로컬 knowledge 폴더 기반 TF-IDF 검색 구현
"""

import os
import re
import math
from typing import List, Dict, Tuple
from collections import Counter


class Chunk:
    """문서 청크"""
    def __init__(self, content: str, fileName: str, chunkIndex: int, score: float = None):
        self.content = content
        self.fileName = fileName
        self.chunkIndex = chunkIndex
        self.score = score


def split_into_chunks(
    content: str,
    fileName: str,
    chunkSize: int = 600,
    overlap: int = 100
) -> List[Chunk]:
    """
    문서를 chunk로 분할 (600자 단위)
    
    Args:
        content: 문서 내용
        fileName: 파일명
        chunkSize: 청크 크기 (기본 600자)
        overlap: 오버랩 크기 (기본 100자)
    
    Returns:
        List[Chunk]: 청크 리스트
    """
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
            
            # overlap 처리: 마지막 일부 유지
            words = currentChunk.split()
            overlapWords = words[-max(1, len(words) // 5):]  # 마지막 20%
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


def tokenize(text: str) -> List[str]:
    """
    한국어 + 영어 토큰화
    
    Args:
        text: 입력 텍스트
    
    Returns:
        List[str]: 토큰 리스트
    """
    # 소문자 변환 및 특수문자 제거
    text = text.lower()
    text = re.sub(r'[^\w\s가-힣]', ' ', text)
    tokens = text.split()
    # 2글자 이상만 필터링
    return [t for t in tokens if len(t) > 1]


def compute_tf_idf(chunks: List[Chunk], query: str) -> List[Tuple[Chunk, float]]:
    """
    TF-IDF 기반 문서 빈도 계산
    
    Args:
        chunks: 청크 리스트
        query: 검색 쿼리
    
    Returns:
        List[Tuple[Chunk, float]]: (청크, 점수) 튜플 리스트 (점수 내림차순)
    """
    if not chunks:
        return []
    
    queryTokens = tokenize(query)
    if not queryTokens:
        return []
    
    N = len(chunks)
    
    # 문서 빈도 계산 (DF)
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
            # TF (Term Frequency)
            tf = termFreq.get(qToken, 0) / len(tokens)
            
            # DF (Document Frequency)
            df = docFreq.get(qToken, 0)
            
            # IDF (Inverse Document Frequency)
            idf = math.log(N / df) if df > 0 else 0
            
            # TF-IDF 점수
            score += tf * idf
        
        if score > 0:
            results.append((chunk, score))
    
    # 점수 내림차순 정렬
    results.sort(key=lambda x: x[1], reverse=True)
    return results


def load_knowledge_base(knowledgePath: str) -> List[Chunk]:
    """
    knowledge 폴더에서 모든 문서 로드
    
    Args:
        knowledgePath: knowledge 폴더 경로
    
    Returns:
        List[Chunk]: 모든 청크 리스트
    """
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


def search_chunks(
    chunks: List[Chunk],
    query: str,
    topK: int = 8
) -> List[Chunk]:
    """
    RAG 검색 수행 - topK개 관련 chunk 반환
    
    Args:
        chunks: 검색 대상 청크 리스트
        query: 검색 쿼리
        topK: 반환할 상위 개수 (기본 8개)
    
    Returns:
        List[Chunk]: 관련 청크 리스트 (점수 포함)
    """
    if not chunks:
        return []
    
    scored = compute_tf_idf(chunks, query)
    topChunks = []
    
    for chunk, score in scored[:topK]:
        chunk.score = score
        topChunks.append(chunk)
    
    return topChunks


def format_context(chunks: List[Chunk]) -> str:
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
        score_text = f" (유사도: {(chunk.score * 100):.1f}%)" if chunk.score else ""
        context_parts.append(
            f"--- [출처: {chunk.fileName}, chunk {chunk.chunkIndex}{score_text}] ---\n{chunk.content}"
        )
    
    return "\n\n".join(context_parts)


def summarize_saju_for_search(
    dayStem: str,
    dayElement: str,
    keywords: List[str]
) -> str:
    """
    사주 데이터 요약 (RAG 검색용)
    
    Args:
        dayStem: 일간 (예: 갑)
        dayElement: 일간 오행 (예: 목)
        keywords: 키워드 리스트
    
    Returns:
        str: 검색 쿼리 문자열
    """
    keywords_str = " ".join(keywords[:10])  # 최대 10개 키워드
    return f"{dayStem}{dayElement} 일간 {keywords_str} 사주 분석"
