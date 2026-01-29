"""
Knowledge Base 인덱싱 스크립트
knowledge 폴더의 문서들을 Redis에 벡터 인덱싱
"""

import os
import sys
from pathlib import Path
from typing import List

from redis_client import get_redis_client, SAJU_DOC_PREFIX, check_redis_search
from redis_search import create_saju_index, drop_saju_index
from embedding import embed_texts, vector_to_buffer
from rag_search import load_knowledge_base, Chunk


def index_chunks(chunks: List[Chunk], batch_size: int = 10):
    """
    청크를 Redis에 인덱싱
    
    Args:
        chunks: 인덱싱할 청크 리스트
        batch_size: 배치 크기 (기본 10)
    """
    if not chunks:
        print("❌ 인덱싱할 청크가 없습니다.")
        return
    
    client = get_redis_client()
    
    print(f"📝 {len(chunks)}개의 청크 인덱싱 시작...")
    
    # 배치 처리
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        
        # 배치 텍스트 수집
        texts = [chunk.content for chunk in batch]
        
        # 임베딩 생성 (배치)
        print(f"   배치 {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1}: 임베딩 생성 중...")
        embeddings = embed_texts(texts)
        
        # Redis에 저장
        for j, (chunk, embedding) in enumerate(zip(batch, embeddings)):
            doc_id = f"{SAJU_DOC_PREFIX}{chunk.fileName}:{chunk.chunkIndex}"
            
            # 벡터를 바이너리로 변환
            embedding_buffer = vector_to_buffer(embedding)
            
            # Redis HASH에 저장
            client.hset(
                doc_id,
                mapping={
                    "content": chunk.content,
                    "fileName": chunk.fileName,
                    "chunkIndex": chunk.chunkIndex,
                    "embedding": embedding_buffer
                }
            )
        
        print(f"   ✅ {i+len(batch)}/{len(chunks)} 완료")
    
    print(f"✅ 인덱싱 완료: {len(chunks)}개 문서")


def main():
    """메인 함수"""
    print("=" * 60)
    print("📚 Knowledge Base 인덱싱 시작")
    print("=" * 60)
    
    # 1. Redis 연결 확인
    print("\n[1단계] Redis 연결 확인...")
    try:
        client = get_redis_client()
        print("✅ Redis 연결 성공")
    except Exception as e:
        print(f"❌ Redis 연결 실패: {e}")
        print("\n💡 Redis Stack을 먼저 실행하세요:")
        print("   docker run -d --name redis-stack -p 6379:6379 redis/redis-stack-server:latest")
        sys.exit(1)
    
    # 2. RedisSearch 모듈 확인
    print("\n[2단계] RedisSearch 모듈 확인...")
    if not check_redis_search():
        print("❌ RedisSearch 모듈이 없습니다.")
        print("\n💡 redis-stack-server 이미지를 사용하세요:")
        print("   docker run -d --name redis-stack -p 6379:6379 redis/redis-stack-server:latest")
        sys.exit(1)
    
    # 3. 기존 인덱스 삭제 (선택)
    print("\n[3단계] 기존 인덱스 처리...")
    response = input("기존 인덱스를 삭제하시겠습니까? (y/N): ").strip().lower()
    if response == 'y':
        try:
            drop_saju_index()
        except:
            print("   (기존 인덱스 없음)")
    
    # 4. 인덱스 생성
    print("\n[4단계] 인덱스 생성...")
    try:
        create_saju_index()
    except Exception as e:
        print(f"❌ 인덱스 생성 실패: {e}")
        sys.exit(1)
    
    # 5. Knowledge 폴더 로드
    print("\n[5단계] Knowledge 폴더 로드...")
    
    # 스크립트 위치 기준으로 knowledge 폴더 찾기
    script_dir = Path(__file__).parent
    knowledge_path = script_dir.parent / "knowledge"
    
    if not knowledge_path.exists():
        print(f"❌ Knowledge 폴더가 없습니다: {knowledge_path}")
        sys.exit(1)
    
    print(f"   경로: {knowledge_path}")
    chunks = load_knowledge_base(str(knowledge_path))
    
    if not chunks:
        print("❌ 로드된 청크가 없습니다.")
        sys.exit(1)
    
    # 6. 인덱싱 수행
    print(f"\n[6단계] 인덱싱 수행...")
    index_chunks(chunks, batch_size=10)
    
    # 7. 완료
    print("\n" + "=" * 60)
    print("✅ 인덱싱 완료!")
    print("=" * 60)
    print(f"\n📊 통계:")
    print(f"   - 총 청크 수: {len(chunks)}")
    print(f"   - 인덱스명: idx:saju_knowledge")
    print(f"   - Redis 키 접두사: saju:doc:")
    print("\n💡 이제 server/ai-server/main.py에서 RedisSearch를 사용할 수 있습니다!")


if __name__ == "__main__":
    main()
