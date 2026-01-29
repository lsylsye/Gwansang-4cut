# 클라이언트-서버 설정 가이드

클라이언트(로컬 TypeScript)에서 서버(Jupyter Lab GPU 서버)로 연결하여 텍스트 생성을 수행하는 전체 설정 가이드입니다.

## 📋 전체 흐름

```
[클라이언트]                    [서버]
   TypeScript              Jupyter Lab GPU
      │                          │
      │  1. 사주 계산            │
      │  2. 명리 계산            │
      │  3. RAG 검색            │
      │                          │
      ├─────────────────────────>│
      │  HTTP POST 요청          │
      │  (계산된 데이터)         │
      │                          │
      │                          │  4. 프롬프트 생성
      │                          │  5. GMS API 호출
      │                          │  6. 텍스트 생성
      │                          │
      │<─────────────────────────┤
      │  HTTP 응답               │
      │  (생성된 텍스트)          │
      │                          │
      │  7. 결과 출력             │
```

## 🚀 단계별 설정

### 1단계: 서버 설정 (Jupyter Lab GPU 서버)

#### 1-1. 파일 업로드

Jupyter Lab 서버에 다음 파일들을 업로드하세요:
- `python/server.py`
- `python/gms_api.py`
- `python/saju_prompt_builder.py`
- `python/requirements.txt`

#### 1-2. 패키지 설치

Jupyter Notebook에서:

```python
!pip install -r requirements.txt
```

#### 1-3. API 키 설정

```python
import os
os.environ['GMS_KEY'] = 'your-ssafy-gms-api-key'
```

#### 1-4. 서버 실행

```python
# 방법 1: 직접 실행
%run server.py

# 방법 2: 백그라운드 실행
import threading
import server

def run_server():
    server.app.run(host='0.0.0.0', port=5000, debug=False)

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# 서버 확인
import time
import requests
time.sleep(2)
response = requests.get('http://localhost:5000/health')
print(response.json())
```

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
🚀 GMS API 서버 시작 중...
   호스트: 0.0.0.0
   포트: 5000
   디버그 모드: False
   GMS_KEY 설정: ✅

📡 서버 URL: http://0.0.0.0:5000
   Health check: http://0.0.0.0:5000/health
   텍스트 생성: http://0.0.0.0:5000/api/generate
   사주 분석: http://0.0.0.0:5000/api/saju/generate
```

### 2단계: 클라이언트 설정 (로컬 TypeScript)

#### 2-1. 환경변수 설정

**Windows (PowerShell):**
```powershell
$env:USE_GMS_SERVER="true"
$env:GMS_SERVER_HOST="your-server-ip"  # 또는 "localhost" (같은 컴퓨터인 경우)
$env:GMS_SERVER_PORT="5000"
$env:GMS_KEY="your-api-key"  # 로컬 fallback용
```

**Windows (CMD):**
```cmd
set USE_GMS_SERVER=true
set GMS_SERVER_HOST=your-server-ip
set GMS_SERVER_PORT=5000
set GMS_KEY=your-api-key
```

**Linux/Mac:**
```bash
export USE_GMS_SERVER=true
export GMS_SERVER_HOST=your-server-ip
export GMS_SERVER_PORT=5000
export GMS_KEY=your-api-key
```

#### 2-2. 코드 빌드

```bash
npm run build
```

#### 2-3. 실행

```bash
node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남 --name "홍길동" --query "재물운"
```

## 🔍 동작 확인

### 서버 측 확인

서버가 요청을 받으면 다음과 같은 로그가 표시됩니다:

```
🌐 서버 연결: http://localhost:5000/api/saju/generate
📤 요청 전송 중...
🔗 API 호출: https://gms.ssafy.io/...
📤 모델: gpt-5-mini
```

### 클라이언트 측 확인

클라이언트가 서버에 연결하면:

```
🌐 서버를 통한 텍스트 생성...
✅ 서버 연결 성공: http://localhost:5000
🤖 서버에서 LLM 해석 생성 중...
```

## 🔧 문제 해결

### 문제 1: 서버 연결 실패

**증상:**
```
❌ 서버 연결 실패: http://localhost:5000
   서버가 실행 중인지 확인하세요.
```

**해결:**
1. 서버가 실행 중인지 확인
2. 포트 번호가 맞는지 확인
3. 방화벽 설정 확인
4. 서버 호스트 주소 확인

### 문제 2: 서버가 요청을 받지 못함

**증상:**
- 서버는 실행 중이지만 클라이언트가 연결하지 못함

**해결:**
1. 서버가 `0.0.0.0`에서 리스닝하는지 확인
2. 네트워크 연결 확인
3. CORS 설정 확인 (Flask-CORS가 자동 처리)

### 문제 3: 타임아웃 오류

**증상:**
```
❌ 요청 타임아웃: 600초 내에 응답을 받지 못했습니다.
```

**해결:**
1. 타임아웃 시간 증가:
   ```bash
   export GMS_SERVER_TIMEOUT=1200000  # 20분
   ```
2. 서버의 GPU 처리 시간 확인
3. 네트워크 상태 확인

### 문제 4: API 키 오류

**증상:**
```
❌ API 에러: Invalid API key
```

**해결:**
1. 서버에서 API 키 확인:
   ```python
   import os
   print(os.getenv('GMS_KEY'))
   ```
2. API 키 재설정

## 📊 성능 비교

### 로컬 API (기존 방식)
- 장점: 간단, 빠른 반복
- 단점: CPU만 사용, 느림

### 서버 API (새로운 방식)
- 장점: GPU 가속 가능, 빠름
- 단점: 네트워크 지연, 서버 관리 필요

## 🔄 Fallback 동작

서버 연결이 실패하면 자동으로 로컬 API로 전환됩니다:

```
⚠️ 서버 연결 실패: http://localhost:5000
   로컬 API로 전환합니다.
🤖 로컬 API로 LLM 해석 생성 중...
```

## 📝 환경변수 요약

### 서버 측 (Jupyter Lab)
- `GMS_KEY`: SSAFY GMS API 키
- `SERVER_HOST`: 서버 호스트 (기본: 0.0.0.0)
- `SERVER_PORT`: 서버 포트 (기본: 5000)
- `DEBUG`: 디버그 모드 (기본: false)

### 클라이언트 측 (TypeScript)
- `USE_GMS_SERVER`: 서버 사용 여부 (true/false)
- `GMS_SERVER_HOST`: 서버 호스트 주소
- `GMS_SERVER_PORT`: 서버 포트
- `GMS_SERVER_TIMEOUT`: 요청 타임아웃 (밀리초)
- `GMS_KEY`: 로컬 fallback용 API 키

## 🎯 권장 워크플로우

1. **개발 단계**: 로컬 API 사용 (빠른 반복)
2. **테스트 단계**: 서버 API 사용 (성능 확인)
3. **프로덕션**: 서버 API 사용 (GPU 가속)

환경변수로 쉽게 전환할 수 있습니다!
