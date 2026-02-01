# Welstory Lunch API

웰스토리 점심 메뉴를 Mattermost로 자동 알림하는 FastAPI 서비스입니다.

## 기능

- 🍽️ 오늘의 점심 메뉴 조회
- 📨 Mattermost 웹훅을 통한 자동 알림
- ⏰ 평일 점심시간 자동 전송 스케줄링
- 🐳 Docker & Docker Compose 지원

## 프로젝트 구조

```
welstoryLunch-main/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 엔트리포인트
│   ├── config.py            # 설정 관리
│   └── services/
│       ├── __init__.py
│       ├── welstory_client.py   # 웰스토리 API 클라이언트
│       ├── mattermost.py        # Mattermost 웹훅 서비스
│       ├── formatter.py         # 메시지 포맷터
│       └── scheduler.py         # 스케줄러
├── Dockerfile
├── compose.yaml
├── requirements.txt
├── .env.example
└── README.md
```

## 빠른 시작

### 1. 환경 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 수정합니다:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
# Mattermost 설정
MATTERMOST_BASE_URL=https://meeting.ssafy.com
MATTERMOST_WEBHOOK_PATHS=["/hooks/your-webhook-path-1","/hooks/your-webhook-path-2"]

# Welstory 로그인 정보
WELSTORY_USERNAME=your-welstory-id
WELSTORY_PASSWORD=your-welstory-password
```

### 2. Docker Compose로 실행

```bash
# 빌드 및 실행
docker compose up -d

# 로그 확인
docker compose logs -f

# 중지
docker compose down
```

### 3. 로컬에서 실행 (개발용)

```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 헬스 체크 및 현재 시간 |
| GET | `/health` | 헬스 체크 |
| GET | `/menu` | 오늘의 메뉴 조회 |
| POST | `/send` | 메뉴 즉시 전송 |
| POST | `/send/simple` | 간단한 메뉴 (평점만) 즉시 전송 |

## API 문서

서버 실행 후 아래 URL에서 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc

## 스케줄

자동 전송 스케줄:

| 요일 | 시간 |
|------|------|
| 월요일 | 12:00 |
| 화요일 | 12:00 |
| 수요일 | 12:16 |
| 목요일 | 12:00 |
| 금요일 | 12:00 |

## Docker 명령어

```bash
# 이미지 빌드
docker compose build

# 컨테이너 시작
docker compose up -d

# 컨테이너 로그 확인
docker compose logs -f welstory-api

# 컨테이너 재시작
docker compose restart

# 컨테이너 중지 및 삭제
docker compose down

# 이미지까지 삭제
docker compose down --rmi all
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `MATTERMOST_BASE_URL` | Mattermost 서버 URL | `https://meeting.ssafy.com` |
| `MATTERMOST_WEBHOOK_PATHS` | 웹훅 경로 목록 (JSON 배열) | `["/hooks/채널1경로"]` |
| `WELSTORY_USERNAME` | 웰스토리 아이디 | - |
| `WELSTORY_PASSWORD` | 웰스토리 비밀번호 | - |

## 라이선스

MIT License

---

# welstoryLunch (Legacy)