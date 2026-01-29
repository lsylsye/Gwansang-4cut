# GMS 서버 실행 가이드

Jupyter Lab GPU 서버에서 텍스트 생성 서버를 실행하는 방법입니다.

## 🚀 빠른 시작

### 1. 패키지 설치

Jupyter Notebook에서 실행:

```python
!pip install -r requirements.txt
```

또는 터미널에서:

```bash
pip install -r requirements.txt
```

### 2. API 키 설정

Jupyter Notebook에서:

```python
import os
os.environ['GMS_KEY'] = 'your-api-key-here'
```

또는 터미널에서:

```bash
export GMS_KEY='your-api-key-here'
```

### 3. 서버 실행

#### 방법 A: Jupyter Notebook에서 실행

```python
# 서버 실행
%run server.py
```

또는:

```python
import server
server.app.run(host='0.0.0.0', port=5000, debug=False)
```

#### 방법 B: 터미널에서 실행

```bash
python server.py
```

### 4. 서버 확인

브라우저에서 다음 URL을 열어보세요:

```
http://localhost:5000/health
```

또는 Python에서:

```python
import requests
response = requests.get('http://localhost:5000/health')
print(response.json())
```

## ⚙️ 설정 옵션

### 환경변수 설정

```python
import os

# API 키
os.environ['GMS_KEY'] = 'your-api-key'

# 서버 호스트 (기본값: 0.0.0.0)
os.environ['SERVER_HOST'] = '0.0.0.0'

# 서버 포트 (기본값: 5000)
os.environ['SERVER_PORT'] = '5000'

# 디버그 모드 (기본값: false)
os.environ['DEBUG'] = 'true'
```

### 서버 시작 코드

```python
import os
import server

# 환경변수 설정
os.environ['GMS_KEY'] = 'your-api-key'
os.environ['SERVER_PORT'] = '5000'

# 서버 실행
server.app.run(host='0.0.0.0', port=5000, debug=False)
```

## 📡 API 엔드포인트

### 1. Health Check

```
GET /health
```

응답:
```json
{
  "status": "ok",
  "message": "GMS API 서버가 정상적으로 실행 중입니다.",
  "gms_key_set": true
}
```

### 2. 일반 텍스트 생성

```
POST /api/generate
```

요청:
```json
{
  "system_prompt": "당신은 친절한 AI 어시스턴트입니다.",
  "user_prompt": "안녕하세요!",
  "model": "gpt-5-mini",
  "timeout": 300
}
```

응답:
```json
{
  "success": true,
  "result": "생성된 텍스트..."
}
```

### 3. 사주 분석 텍스트 생성

```
POST /api/saju/generate
```

요청:
```json
{
  "saju_data": {
    "yearPillar": "戊寅",
    "monthPillar": "壬戌",
    "dayPillar": "丁酉",
    "hourPillar": "丙午",
    ...
  },
  "myeongri_data": {
    "fiveElements": {
      "목": 2,
      "화": 3,
      ...
    },
    ...
  },
  "context": "RAG 검색 결과...",
  "birth_info": {
    "year": 1998,
    "month": 10,
    "day": 17,
    "hour": 13,
    "gender": "남",
    ...
  },
  "query": "재물운"
}
```

## 🔧 클라이언트 연결

### TypeScript 클라이언트 설정

환경변수 설정:

```bash
# Windows
set USE_GMS_SERVER=true
set GMS_SERVER_HOST=localhost
set GMS_SERVER_PORT=5000

# Linux/Mac
export USE_GMS_SERVER=true
export GMS_SERVER_HOST=localhost
export GMS_SERVER_PORT=5000
```

### 클라이언트 실행

```bash
node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남
```

## 🌐 원격 접근 설정

다른 컴퓨터에서 접근하려면:

1. **서버 호스트 설정**
   ```python
   os.environ['SERVER_HOST'] = '0.0.0.0'  # 모든 인터페이스에서 접근 가능
   ```

2. **방화벽 설정**
   - 포트 5000을 열어야 합니다
   - Jupyter Lab 서버의 방화벽 설정 확인

3. **클라이언트 설정**
   ```bash
   export GMS_SERVER_HOST=your-server-ip
   export GMS_SERVER_PORT=5000
   ```

## 🐛 문제 해결

### 서버가 시작되지 않음

```python
# 포트가 이미 사용 중인지 확인
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(('localhost', 5000))
if result == 0:
    print("포트 5000이 이미 사용 중입니다.")
else:
    print("포트 5000을 사용할 수 있습니다.")
sock.close()
```

### API 키 오류

```python
import os
print(f"GMS_KEY 설정: {os.getenv('GMS_KEY') is not None}")
```

### CORS 오류

Flask-CORS가 자동으로 처리하지만, 문제가 있으면:

```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

## 📝 Jupyter Notebook 예제

```python
# 1. 환경 설정
import os
os.environ['GMS_KEY'] = 'your-api-key'

# 2. 서버 실행 (백그라운드)
import threading
import server

def run_server():
    server.app.run(host='0.0.0.0', port=5000, debug=False)

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# 3. 서버 확인
import time
import requests
time.sleep(2)  # 서버 시작 대기

response = requests.get('http://localhost:5000/health')
print(response.json())

# 4. 테스트 요청
test_request = {
    "system_prompt": "당신은 친절한 AI입니다.",
    "user_prompt": "안녕하세요!"
}

response = requests.post(
    'http://localhost:5000/api/generate',
    json=test_request
)
print(response.json())
```

## ⚠️ 주의사항

1. **보안**: 프로덕션 환경에서는 인증을 추가하세요.
2. **리소스**: GPU 서버의 리소스를 고려하여 동시 요청 수를 제한하세요.
3. **로깅**: 서버 로그를 확인하여 문제를 추적하세요.
