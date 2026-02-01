# Welstory Lunch API 명세서

## 개요

Welstory Lunch API는 웰스토리 점심 메뉴를 조회하고 Mattermost 채널로 자동 알림을 제공하는 RESTful API 서비스입니다.

### 기술 스택
- **Framework**: FastAPI 0.109.0+
- **Runtime**: Python 3.8+
- **Web Server**: Uvicorn
- **Dependencies**: Pydantic Settings, Requests, PyTZ, HTTPx

### 기본 정보
- **Base URL**: `http://localhost:8002` (개발 환경)
- **API Version**: 1.0.0
- **Content-Type**: `application/json`

---

## 엔드포인트 목록

### 1. 헬스 체크 엔드포인트

#### `GET /`
애플리케이션 상태 확인 및 현재 시간 조회

**Request**
```http
GET / HTTP/1.1
Host: localhost:8002
```

**Response**
```json
{
  "status": "ok",
  "message": "Welstory Lunch API is running",
  "current_time": "2026-02-01 12:00:00 KST"
}
```

**Response Fields**
- `status` (string): 서비스 상태 ("ok")
- `message` (string): 서비스 상태 메시지
- `current_time` (string): 현재 한국 표준시 (KST)

---

#### `GET /health`
간단한 헬스 체크

**Request**
```http
GET /health HTTP/1.1
Host: localhost:8002
```

**Response**
```json
{
  "status": "healthy"
}
```

---

### 2. 메뉴 조회 엔드포인트

#### `GET /menu`
오늘의 웰스토리 점심 메뉴 조회

**Request**
```http
GET /menu HTTP/1.1
Host: localhost:8002
```

**Response (성공)**
```json
{
  "status": "success",
  "data": {
    "점심": [
      {
        "코너": "한식",
        "메뉴명": "김치찌개정식",
        "칼로리": "850",
        "구성": ["김치찌개", "쌀밥", "계란후라이", "김치", "멸치볶음"],
        "이미지": "https://welplus.welstory.com/uploads/menu/202602/photo123.jpg",
        "평균평점": 4.5,
        "참여자수": 25
      },
      {
        "코너": "일품",
        "메뉴명": "돈까스정식",
        "칼로리": "920",
        "구성": ["돈까스", "쌀밥", "미소국", "양배추샐러드"],
        "이미지": "https://welplus.welstory.com/uploads/menu/202602/photo124.jpg",
        "평균평점": 4.2,
        "참여자수": 18
      },
      {
        "코너": "마이보글",
        "메뉴명": "[라면] 신라면",
        "칼로리": "450",
        "구성": ["[라면]신라면", "계란토핑", "파토핑"],
        "이미지": "https://welplus.welstory.com/uploads/menu/202602/photo125.jpg",
        "평균평점": 3.8,
        "참여자수": 12
      }
    ]
  }
}
```

**Response (로그인 실패)**
```json
{
  "status": "error",
  "message": "로그인 실패"
}
```
- **HTTP Status**: 401 Unauthorized

**Response (서버 오류)**
```json
{
  "status": "error",
  "message": "상세 오류 메시지"
}
```
- **HTTP Status**: 500 Internal Server Error

**Menu Item Fields**
- `코너` (string): 음식점/코너명 (예: "한식", "일품", "SELF 배식대", "마이보글")
- `메뉴명` (string): 메뉴 이름
- `칼로리` (string): 칼로리 정보 (단위: kcal)
- `구성` (array[string]): 메뉴 구성 요소 목록
- `이미지` (string|null): 메뉴 이미지 URL
- `평균평점` (number): 평균 평점 (0.0 ~ 5.0)
- `참여자수` (number): 평점 참여자 수

---

### 3. 메뉴 전송 엔드포인트

#### `POST /send`
현재 메뉴를 모든 구성된 Mattermost 채널에 즉시 전송

**Request**
```http
POST /send HTTP/1.1
Host: localhost:8002
Content-Type: application/json
```

**Response**
```json
{
  "status": "success",
  "message": "메뉴 전송이 시작되었습니다."
}
```

**동작 과정**
1. 백그라운드 태스크로 메뉴 전송 작업 시작
2. 웰스토리 로그인 및 오늘 메뉴 조회
3. 현재 요일에 따른 메시지 포맷 적용
4. 모든 구성된 Mattermost 웹훅으로 전송

---

#### `POST /send/simple`
간단한 메뉴 정보(평점 중심)를 Mattermost 채널에 즉시 전송

**Request**
```http
POST /send/simple HTTP/1.1
Host: localhost:8002
Content-Type: application/json
```

**Response**
```json
{
  "status": "success",
  "message": "간단 메뉴 전송이 시작되었습니다."
}
```

**특징**
- 메뉴 구성 정보 대신 평점 정보에 중점
- 간단한 테이블 형태로 메시지 구성
- 점심시간 중간 체크용으로 설계

---

## 자동 스케줄링

API는 다음과 같은 자동 스케줄을 운영합니다:

### 스케줄 설정
- **월요일**: 12:00
- **화요일**: 12:00  
- **수요일**: 12:16 (특식 데이)
- **목요일**: 12:00
- **금요일**: 12:00

### 메시지 포맷
요일별로 다른 메시지 포맷이 적용됩니다:

#### 평일 기본 포맷 (월, 화, 목)
```
## 🦈 오늘의 점심 메뉴 🍳

| 이미지 | 이미지 | 이미지 |
|---|---|---|
| 한식 | 일품 | SELF 배식대 |
| **김치찌개정식** | **돈까스정식** | **셀프코너** |
| 김치찌개, 쌀밥, 계란후라이 | 돈까스, 쌀밥, 미소국 | 다양한 반찬 |
| 850kcal | 920kcal | 400kcal |
| ⭐ 4.5 (25명) | ⭐ 4.2 (18명) | 평가 없음 |

## 🍜 오늘의 라면 메뉴 🦝
| 라면 메뉴 | 라면 종류 |
|---|---|
| 이미지 | 신라면 |
| 토핑 | 계란토핑, 파토핑 |
```

#### 수요일 특식 포맷
```
## 😊 수요일은 특식 데이 🐱

[동일한 테이블 구조]

## 🍜 오늘의 라면 메뉴 🍝
[라면 정보]
```

#### 금요일 포맷  
```
## 💃 행복한 금요일 점심 ...♡ 🐻 🍓

[동일한 테이블 구조]
```

#### 간단 메뉴 포맷
```
## 🤓 오늘 메뉴 평점 중간 점검 !! 🔴

| 이미지 | 이미지 | 이미지 |
|---|---|---|
| 한식 | 일품 | SELF 배식대 |
| **김치찌개정식** | **돈까스정식** | **셀프코너** |
| ⭐ 4.5 (25명) | ⭐ 4.2 (18명) | 평가 없음 |
```

---

## 설정 관리

### 환경 변수 (.env)
```bash
# Mattermost 설정
MATTERMOST_BASE_URL=https://meeting.ssafy.com
MATTERMOST_WEBHOOK_PATHS=["웹훅경로1", "웹훅경로2"]

# Welstory 로그인 정보
WELSTORY_USERNAME=웰스토리아이디
WELSTORY_PASSWORD=웰스토리비밀번호

# 서버 설정
HOST=0.0.0.0
PORT=8002
```

### 기본 설정 (app/config.py)
```python
class Settings(BaseSettings):
    MATTERMOST_BASE_URL: str = "https://meeting.ssafy.com"
    MATTERMOST_WEBHOOK_PATHS: List[str] = [
        "/hooks/채널1경로",
        "/hooks/채널2경로"
    ]
    WELSTORY_USERNAME: str = "웰스토리아이디"
    WELSTORY_PASSWORD: str = "웰스토리비밀번호"
    HOST: str = "0.0.0.0"
    PORT: int = 8002
```

---

## 에러 코드

### HTTP 상태 코드
- `200 OK`: 정상 처리
- `401 Unauthorized`: 웰스토리 로그인 실패
- `500 Internal Server Error`: 서버 내부 오류

### 오류 응답 형식
```json
{
  "status": "error",
  "message": "오류 상세 메시지"
}
```

---

## 외부 서비스 연동

### Welstory API 연동
- **Base URL**: `https://welplus.welstory.com`
- **인증**: Bearer Token (로그인 후 획득)
- **메뉴 조회**: `/api/meal`
- **평점 조회**: `/api/meal/getMenuEvalAvg`

### 요청 파라미터
#### 메뉴 조회
- `menuDt`: 날짜 (YYYYMMDD)
- `menuMealType`: "2" (점심)
- `restaurantCode`: "REST000595" (삼성 부산 전기)
- `sortingFlag`: ""
- `mainDivRestaurantCode`: "REST000595"
- `activeRestaurantCode`: "REST000595"

#### 평점 조회
- `menuDt`: 메뉴 날짜
- `hallNo`: 홀 번호
- `menuCourseType`: 메뉴 코스 타입
- `menuMealType`: 식사 타입
- `restaurantCode`: 레스토랑 코드
- `mainDivRestaurantCode`: 메인 레스토랑 코드

### Mattermost 웹훅 연동
- **Method**: POST
- **Content-Type**: `application/json`
- **Payload**: `{"text": "메시지 내용"}`

---

## 배포 정보

### Docker 실행
```bash
# 개발 환경
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

# Docker Compose
docker-compose up -d
```

### 의존성 설치
```bash
pip install -r requirements.txt
```

---

## 메뉴 데이터 구조

### 메뉴 처리 로직
1. **기본 메뉴**: 최대 4개 항목 처리
2. **SELF 배식대**: 별도 섹션으로 처리
3. **라면 메뉴**: "마이보글" 코너 또는 "[라면" 포함 메뉴
4. **T/O간편식DUMMY**: 제외 처리

### 평점 시스템
- **평균 평점**: 0.0 ~ 5.0 (소수점 2자리)
- **참여자 수**: 평점을 매긴 사용자 수
- **표시**: "⭐ 4.5 (25명)" 또는 "평가 없음"

### 이미지 처리
- **URL 구성**: `{photoUrl}{photoCd}`
- **기본값**: "이미지 없음" 텍스트
- **포맷**: Markdown 이미지 링크

---

## 로깅 및 모니터링

### 로그 출력
- 스케줄러 시작/실행 정보
- 메뉴 전송 결과 (✅ 성공 / ❌ 실패)
- 웹훅별 전송 상태 코드
- 오류 메시지

### 콘솔 출력 예시
```
📅 스케줄러가 시작되었습니다.
⏰ 스케줄 실행: 요일=0, 시간=12:0
[2026-02-01 12:00:00+09:00] 현재 요일: 0
✅ 전송 상태(/hooks/경로1): 200
✅ 전송 상태(/hooks/경로2): 200
✅ 메뉴 전송 완료
```

---

## 보안 고려사항

### 인증 정보 보호
- 환경 변수로 민감 정보 관리
- `.env` 파일을 `.gitignore`에 추가
- Docker secrets 사용 권장 (프로덕션)

### API 보안
- 내부 네트워크 사용 권장
- 필요시 API 키 또는 JWT 인증 추가 가능
- CORS 설정 필요시 구성

### Welstory 로그인
- 실제 사용자 계정 정보 사용
- Device ID는 고정값 사용
- 토큰 만료 시 자동 재로그인

---

## 향후 개선 사항

### 기능 확장
- 아침/저녁 메뉴 지원
- 여러 레스토랑 지원
- 메뉴 즐겨찾기 기능
- 사용자별 알림 설정

### 기술적 개선
- 데이터베이스 연동
- 캐싱 시스템 도입
- 비동기 작업 큐 (Celery)
- 메트릭 수집 (Prometheus)

### 운영 개선
- 헬스 체크 강화
- 로그 레벨 관리
- 설정 유효성 검증
- 장애 복구 메커니즘