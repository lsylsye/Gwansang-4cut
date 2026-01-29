# Knowledge Base 인덱싱 가이드

## 사전 준비

### 1. Redis Stack 실행

```bash
# Docker로 Redis Stack 실행
docker run -d --name redis-stack -p 6379:6379 redis/redis-stack-server:latest

# 실행 확인
docker ps | grep redis-stack
```

### 2. Python 패키지 설치

```bash
cd AItestFile_saju/python
pip install -r requirements.txt
```

필요한 패키지:
- redis
- sentence-transformers
- numpy
- (기타 requirements.txt 참조)

## 인덱싱 실행

### 방법 1: 스크립트 직접 실행

```bash
cd AItestFile_saju/python
python indexer.py
```

### 방법 2: 환경변수 설정 후 실행

```bash
# .env 파일 생성 (AItestFile_saju/.env)
cat > ../env << EOF
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# 인덱싱 실행
python indexer.py
```

## 실행 과정

스크립트가 다음 단계를 자동으로 수행합니다:

1. **Redis 연결 확인**
   - localhost:6379에 연결 시도
   - 연결 실패시 안내 메시지 출력

2. **RedisSearch 모듈 확인**
   - Redis Stack에 RedisSearch 모듈이 있는지 확인
   - 없으면 redis-stack-server 사용 권장

3. **기존 인덱스 처리**
   - 기존 인덱스 삭제 여부 선택 (y/N)

4. **인덱스 생성**
   - `idx:saju_knowledge` 인덱스 생성
   - 벡터 필드 설정 (HNSW, 384차원, COSINE)

5. **Knowledge 로드**
   - `AItestFile_saju/knowledge/*.md` 파일 읽기
   - 600자 단위로 청크 분할

6. **인덱싱**
   - 각 청크를 임베딩 벡터로 변환
   - Redis에 저장
   - 배치 처리 (10개씩)

## 예상 출력

```
============================================================
📚 Knowledge Base 인덱싱 시작
============================================================

[1단계] Redis 연결 확인...
🔗 Redis 연결 중... localhost:6379
✅ Redis 연결됨
✅ Redis 연결 성공

[2단계] RedisSearch 모듈 확인...
✅ RedisSearch 모듈 활성화됨

[3단계] 기존 인덱스 처리...
기존 인덱스를 삭제하시겠습니까? (y/N): y
🗑️ 인덱스 'idx:saju_knowledge' 삭제 완료

[4단계] 인덱스 생성...
📋 인덱스 'idx:saju_knowledge' 생성 중...
✅ 인덱스 'idx:saju_knowledge' 생성 완료

[5단계] Knowledge 폴더 로드...
   경로: C:\SSAFY\workspace\S14P11E208\AItestFile_saju\knowledge
📚 145개의 chunk를 로드했습니다.

[6단계] 인덱싱 수행...
📝 145개의 청크 인덱싱 시작...
🤖 임베딩 모델 로딩 중...
   모델: paraphrase-multilingual-MiniLM-L12-v2
✅ 임베딩 모델 로딩 완료
   배치 1/15: 임베딩 생성 중...
   ✅ 10/145 완료
   배치 2/15: 임베딩 생성 중...
   ✅ 20/145 완료
   ...
   배치 15/15: 임베딩 생성 중...
   ✅ 145/145 완료
✅ 인덱싱 완료: 145개 문서

============================================================
✅ 인덱싱 완료!
============================================================

📊 통계:
   - 총 청크 수: 145
   - 인덱스명: idx:saju_knowledge
   - Redis 키 접두사: saju:doc:

💡 이제 server/ai-server/main.py에서 RedisSearch를 사용할 수 있습니다!
```

## 완료 후 확인

### Redis에서 확인

```bash
# Redis CLI 접속
docker exec -it redis-stack redis-cli

# 인덱스 정보 확인
FT.INFO idx:saju_knowledge

# 문서 개수 확인
KEYS saju:doc:*
```

### AI 서버에서 사용

```bash
cd server/ai-server

# .env 설정
cat > .env << EOF
GMS_KEY=your_gms_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# 서버 실행
python main.py
```

서버가 자동으로 RedisSearch를 감지하고 벡터 검색을 사용합니다!

## 문제 해결

### Redis 연결 실패
```
❌ Redis 연결 실패: Error 111 connecting to localhost:6379. Connection refused.
```
→ Redis Stack이 실행 중인지 확인하세요.

### RedisSearch 모듈 없음
```
❌ RedisSearch 모듈이 없습니다.
```
→ `redis/redis-stack-server` 이미지를 사용하세요. 일반 redis 이미지에는 없습니다.

### 임베딩 모델 로딩 실패
```
❌ 임베딩 모델 로딩 실패
```
→ `pip install sentence-transformers` 실행

### Knowledge 폴더 없음
```
❌ Knowledge 폴더가 없습니다
```
→ `AItestFile_saju/knowledge/` 폴더 경로 확인

## 재인덱싱

Knowledge 파일을 수정했다면 다시 인덱싱하세요:

```bash
python indexer.py
# 기존 인덱스 삭제? → y 입력
```

## 인덱싱 없이 사용하기

RedisSearch 없이도 AI 서버는 동작합니다:
- 자동으로 TF-IDF 방식으로 폴백
- 정확도는 낮지만 설정 불필요
