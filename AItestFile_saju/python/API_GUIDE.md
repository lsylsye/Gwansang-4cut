# 관상/사주 분석 API 가이드

이 문서는 `AItestFile_saju/python` 디렉토리에 구현된 관상 및 사주 분석 API의 사용법을 설명합니다.

## API 개요

| API | 엔드포인트 | 방식 | 설명 |
|-----|-----------|------|------|
| 관상 분석 | `/api/face/analyze` | Rule-based | MediaPipe 468 랜드마크 기반 관상 분석 (LLM 미사용) |
| 사주 총평 | `/api/saju/summary` | LLM-based | 사주 데이터 기반 종합 총평 생성 |

---

## 1. 관상 분석 데이터 생성 API (Rule-based)

### 엔드포인트
```
POST /api/face/analyze
```

### 특징
- **LLM을 사용하지 않음**: 순수 알고리즘과 수식으로만 동작
- `rules.md`에 정의된 관상학 규칙을 기반으로 분석
- 각 부위별 측정값(`measures`), 게이지(`gauge`), 핵심 의미(`coreMeaning`) 반환

### 요청 형식
```json
{
  "timestamp": "2026-01-27T14:40:25.123",
  "faces": [
    {
      "faceIndex": 1,
      "duration": 3500,
      "landmarks": [
        { "index": 0, "x": 0.52, "y": 0.48, "z": -0.02 },
        { "index": 1, "x": 0.51, "y": 0.49, "z": -0.01 },
        // ... MediaPipe 468 랜드마크 전체
      ]
    }
  ],
  "sajuData": { }  // 이 API에서는 사용하지 않음
}
```

### 응답 형식
```json
{
  "success": true,
  "timestamp": "2026-01-27T14:40:25.123",
  "faceIndex": 1,
  "faceAnalysis": {
    "faceShape": {
      "measures": {
        "w": "0.2345",
        "h": "0.3456",
        "wh": "0.679"
      },
      "gauge": {
        "value": 2.63,
        "rangeMin": 0,
        "rangeMax": 8,
        "unit": "",
        "segments": [
          { "label": "좁음", "min": 0, "max": 2.5 },
          { "label": "보통", "min": 2.5, "max": 5.5 },
          { "label": "넓음", "min": 5.5, "max": 8 }
        ]
      },
      "coreMeaning": "내면 깊음, 예민, 예술적 감성. 깊은 사유와 창의성이 돋보이는 상입니다."
    },
    "forehead": { /* ... */ },
    "eyes": { /* ... */ },
    "nose": { /* ... */ },
    "mouth": { /* ... */ },
    "chin": { /* ... */ }
  },
  "meta": {
    "headRoll": 2.5,
    "qualityNote": "신뢰도 높음",
    "overallSymmetry": 92.5
  }
}
```

### 분석 항목

| 항목 | 필드명 | 분석 내용 |
|------|--------|----------|
| 얼굴형 | `faceShape` | W/H 비율로 그릇(세장형/균형형/광대형) 판단 |
| 이마 | `forehead` | 초년운, 판단력 (높이/폭 비율) |
| 눈 | `eyes` | 성격, 대인관계 (개방도, 비대칭, 미간 거리) |
| 코 | `nose` | 재물운, 현실감 (길이 비율) |
| 입 | `mouth` | 언변, 애정운 (입꼬리 각도, 입술 두께) |
| 턱 | `chin` | 지구력, 노년운 (턱 각도, 폭) |

---

## 2. 사주 총평 생성 API (LLM-based)

### 엔드포인트
```
POST /api/saju/summary
```

### 특징
- **LLM 호출**: GMS API를 통해 GPT 모델 사용
- 사주팔자 계산 후 종합 총평 자동 생성
- 기본 성향, 강점, 주의점, 운세 흐름, 조언 포함

### 요청 형식
```json
{
  "timestamp": "2026-01-27T14:40:25.123",
  "faces": [],  // 이 API에서는 사용하지 않음
  "sajuData": {
    "gender": "male",           // "male" 또는 "female"
    "calendarType": "solar",    // "solar"(양력) 또는 "lunar"(음력)
    "birthDate": "1995-05-15",  // YYYY-MM-DD 형식
    "birthTime": "14:30",       // HH:MM 형식 (선택)
    "birthTimeUnknown": false   // 시간 모를 경우 true
  },
  "model": "gpt-5-mini",        // 선택 (기본: gpt-5-mini)
  "timeout": 300                // 선택 (기본: 300초)
}
```

### 응답 형식
```json
{
  "success": true,
  "timestamp": "2026-01-27T14:40:25.123",
  "summary": "귀하의 사주를 살펴보니...(LLM이 생성한 총평 텍스트)...",
  "sajuInfo": {
    "yearPillar": "을해",
    "monthPillar": "신사",
    "dayPillar": "갑인",
    "hourPillar": "임오",
    "yearStem": "을",
    "yearBranch": "해",
    "monthStem": "신",
    "monthBranch": "사",
    "dayStem": "갑",
    "dayBranch": "인",
    "hourStem": "임",
    "hourBranch": "오",
    "solarTerm": "입하",
    "fiveElements": {
      "목": 3,
      "화": 2,
      "토": 1,
      "금": 1,
      "수": 1
    }
  }
}
```

---

## 서버 실행

### 환경 설정
```bash
# .env 파일 설정 (AItestFile_saju 폴더에 생성)
GMS_KEY=your-api-key
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

### 서버 시작
```bash
cd AItestFile_saju/python
python server.py
```

### 테스트 요청 (curl)

#### 관상 분석 API 테스트
```bash
curl -X POST http://localhost:8000/api/face/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-29T10:00:00",
    "faces": [{
      "faceIndex": 1,
      "landmarks": [
        {"index": 10, "x": 0.5, "y": 0.1, "z": 0},
        {"index": 35, "x": 0.3, "y": 0.4, "z": 0},
        {"index": 152, "x": 0.5, "y": 0.9, "z": 0},
        {"index": 265, "x": 0.7, "y": 0.4, "z": 0}
      ]
    }]
  }'
```

#### 사주 총평 API 테스트
```bash
curl -X POST http://localhost:8000/api/saju/summary \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-29T10:00:00",
    "sajuData": {
      "gender": "male",
      "calendarType": "solar",
      "birthDate": "1995-05-15",
      "birthTime": "14:30",
      "birthTimeUnknown": false
    }
  }'
```

---

## 파일 구조

```
AItestFile_saju/python/
├── server.py                    # Flask 서버 (모든 API 엔드포인트)
├── face_analysis_service.py     # 관상 분석 로직 (Rule-based)
├── saju_summary_service.py      # 사주 총평 프롬프트 생성
├── saju_calculation.py          # 사주 계산 로직
├── saju_myeongri.py             # 명리 분석 로직
├── gms_api.py                   # GMS API 호출
└── ...
```

---

## 에러 처리

### 공통 에러 응답
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

### HTTP 상태 코드
| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 필드 누락 등) |
| 500 | 서버 내부 오류 |
