# Jupyter Lab 설정 가이드

Jupyter Lab GPU 서버에서 텍스트 생성 서버를 실행하기 위한 단계별 가이드입니다.

## 📁 필요한 파일들

Jupyter Lab 서버에 다음 파일들을 업로드하세요:

### 필수 파일
1. **`gms_api.py`** - GMS API 호출 모듈
2. **`server.py`** - Flask 서버 (메인 실행 파일)
3. **`saju_prompt_builder.py`** - 사주 프롬프트 생성 모듈
4. **`requirements.txt`** - 필요한 Python 패키지 목록

### 선택 파일 (참고용)
- `README.md` - 사용 가이드
- `SERVER_GUIDE.md` - 서버 상세 가이드
- `CLIENT_SERVER_SETUP.md` - 전체 설정 가이드

## 🚀 실행 단계

### 1단계: 파일 업로드

Jupyter Lab에서:
1. 새 폴더 생성 (예: `gms-server`)
2. 위의 필수 파일들을 해당 폴더에 업로드

### 2단계: 패키지 설치

Jupyter Notebook에서 새 셀을 만들고 실행:

```python
!pip install -r requirements.txt
```

또는 개별 설치:

```python
!pip install requests flask flask-cors
```

### 3단계: API 키 설정

새 셀에서:

```python
import os
os.environ['GMS_KEY'] = 'your-ssafy-gms-api-key-here'
```

⚠️ **중요**: 실제 API 키로 교체하세요!

### 4단계: 서버 실행

#### 방법 A: 직접 실행 (권장)

새 셀에서:

```python
%run server.py
```

#### 방법 B: 백그라운드 실행

새 셀에서:

```python
import threading
import server

def run_server():
    server.app.run(host='0.0.0.0', port=5000, debug=False)

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

print("✅ 서버가 백그라운드에서 시작되었습니다.")
```

### 5단계: 서버 확인

새 셀에서:

```python
import time
import requests

# 서버 시작 대기
time.sleep(2)

# Health check
try:
    response = requests.get('http://localhost:5000/health')
    print("서버 상태:", response.json())
    print("✅ 서버가 정상적으로 실행 중입니다!")
except Exception as e:
    print(f"❌ 서버 연결 실패: {e}")
    print("서버가 실행 중인지 확인하세요.")
```

## 📋 전체 실행 예제 (한 번에)

Jupyter Notebook에서 다음 셀들을 순서대로 실행하세요:

### 셀 1: 패키지 설치
```python
!pip install -r requirements.txt
```

### 셀 2: 환경 설정
```python
import os
os.environ['GMS_KEY'] = 'your-ssafy-gms-api-key-here'
os.environ['SERVER_HOST'] = '0.0.0.0'
os.environ['SERVER_PORT'] = '5000'
```

### 셀 3: 서버 실행
```python
import threading
import server

def run_server():
    server.app.run(host='0.0.0.0', port=5000, debug=False)

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

print("🚀 서버 시작 중...")
print("📡 서버 URL: http://0.0.0.0:5000")
```

### 셀 4: 서버 확인
```python
import time
import requests

time.sleep(3)  # 서버 시작 대기

try:
    response = requests.get('http://localhost:5000/health')
    data = response.json()
    print("✅ 서버 상태:", data['status'])
    print("✅ GMS_KEY 설정:", "✅" if data.get('gms_key_set') else "❌")
except Exception as e:
    print(f"❌ 오류: {e}")
```

## 🔍 서버 실행 확인

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

⚠️  서버를 중지하려면 Ctrl+C를 누르세요.
```

## 📝 폴더 구조 예시

Jupyter Lab에서 다음과 같은 구조로 파일을 배치하세요:

```
your-workspace/
├── gms-server/              # 새로 만든 폴더
│   ├── gms_api.py          # 필수
│   ├── server.py            # 필수
│   ├── saju_prompt_builder.py  # 필수
│   └── requirements.txt     # 필수
└── (다른 파일들...)
```

## ⚙️ 설정 옵션

### 포트 변경

```python
import os
os.environ['SERVER_PORT'] = '8000'  # 기본값: 5000
```

### 호스트 변경

```python
import os
os.environ['SERVER_HOST'] = '127.0.0.1'  # 기본값: 0.0.0.0
```

## 🧪 테스트

서버가 실행된 후, 다음 셀에서 테스트할 수 있습니다:

```python
import requests

# 간단한 테스트
test_request = {
    "system_prompt": "당신은 친절한 AI 어시스턴트입니다.",
    "user_prompt": "안녕하세요! 간단히 자기소개를 해주세요."
}

response = requests.post(
    'http://localhost:5000/api/generate',
    json=test_request
)

print("응답:", response.json())
```

## ⚠️ 주의사항

1. **API 키 보안**: API 키를 코드에 하드코딩하지 마세요. 환경변수나 Jupyter의 시크릿 기능을 사용하세요.

2. **포트 충돌**: 포트 5000이 이미 사용 중이면 다른 포트를 사용하세요.

3. **서버 중지**: 서버를 중지하려면 셀을 중단(Interrupt)하거나 커널을 재시작하세요.

4. **네트워크 접근**: 다른 컴퓨터에서 접근하려면 방화벽 설정을 확인하세요.

## 🔗 클라이언트 연결

서버가 실행되면, 로컬 TypeScript 클라이언트에서:

```bash
# 환경변수 설정
set USE_GMS_SERVER=true
set GMS_SERVER_HOST=your-jupyter-server-ip
set GMS_SERVER_PORT=5000

# 실행
node dist/saju_main.js --year 1998 --month 10 --day 17 --hour 13 --gender 남
```

## 📚 추가 정보

- `SERVER_GUIDE.md`: 서버 상세 설정
- `CLIENT_SERVER_SETUP.md`: 클라이언트-서버 전체 설정
- `README.md`: 기본 사용법
