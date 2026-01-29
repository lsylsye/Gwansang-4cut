"""
Redis 클라이언트 모듈 (Python 버전)
RedisSearch 연결 및 기본 설정
"""

import os
import redis
from typing import Optional

# 환경변수에서 Redis 설정 읽기
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

# 인덱스 및 키 설정
SAJU_INDEX_NAME = "idx:saju_knowledge"
SAJU_DOC_PREFIX = "saju:doc:"

# Redis 클라이언트 싱글톤
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    """
    Redis 클라이언트 생성 및 연결 (싱글톤)
    
    Returns:
        redis.Redis: Redis 클라이언트 인스턴스
    """
    global _redis_client
    
    if _redis_client is not None:
        try:
            # 연결 상태 확인
            _redis_client.ping()
            return _redis_client
        except:
            # 연결이 끊어진 경우 재연결
            _redis_client = None
    
    print(f"🔗 Redis 연결 중... {REDIS_HOST}:{REDIS_PORT}")
    
    try:
        _redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=False,  # 바이너리 모드 (벡터 저장용)
            socket_connect_timeout=5,
            socket_timeout=5
        )
        
        # 연결 테스트
        _redis_client.ping()
        print("✅ Redis 연결됨")
        
        return _redis_client
    except Exception as e:
        print(f"❌ Redis 연결 실패: {e}")
        raise


def close_redis_client():
    """Redis 연결 종료"""
    global _redis_client
    if _redis_client is not None:
        try:
            _redis_client.close()
            print("🔌 Redis 연결 종료")
        except:
            pass
        finally:
            _redis_client = None


def check_redis_search() -> bool:
    """
    RedisSearch 모듈 확인
    
    Returns:
        bool: RedisSearch 모듈 활성화 여부
    """
    try:
        client = get_redis_client()
        # FT._LIST 명령으로 RedisSearch 모듈 확인
        result = client.execute_command("FT._LIST")
        print("✅ RedisSearch 모듈 활성화됨")
        return True
    except redis.exceptions.ResponseError as e:
        if "unknown command" in str(e).lower():
            print("❌ RedisSearch 모듈이 없습니다. redis-stack-server 이미지를 사용하세요.")
            return False
        raise
    except Exception as e:
        print(f"❌ RedisSearch 확인 실패: {e}")
        return False


def index_exists(index_name: str) -> bool:
    """
    인덱스 존재 여부 확인
    
    Args:
        index_name: 인덱스 이름
    
    Returns:
        bool: 인덱스 존재 여부
    """
    try:
        client = get_redis_client()
        client.execute_command("FT.INFO", index_name)
        return True
    except redis.exceptions.ResponseError as e:
        if "unknown index name" in str(e).lower():
            return False
        raise


def get_indexed_doc_count() -> int:
    """
    인덱싱된 문서 수 조회
    
    Returns:
        int: 문서 수
    """
    try:
        client = get_redis_client()
        # FT.INFO로 인덱스 정보 조회
        info = client.execute_command("FT.INFO", SAJU_INDEX_NAME)
        
        # info는 리스트 형태로 반환됨 (키-값 쌍)
        # num_docs 값을 찾기
        if isinstance(info, list):
            for i in range(0, len(info) - 1, 2):
                if info[i] == b"num_docs" or info[i] == "num_docs":
                    return int(info[i + 1])
        
        return 0
    except Exception as e:
        print(f"⚠️ 인덱스 정보 조회 실패: {e}")
        return 0
