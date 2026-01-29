# GMS API 통합 변경사항

## 개요
Gemini API를 GMS (SSAFY GPT Model Service) API로 전환하여 사주 분석 기능을 구현했습니다.

## 주요 변경 파일

### 1. server/ai-server/main.py
**변경 내용:**
- GMS API 통합 함수 추가:
  - `get_gms_config()`: GMS API 설정 가져오기
  - `extract_gms_output_text()`: GMS 응답에서 텍스트 추출
  - `call_gms_api()`: GMS API 호출 및 응답 처리

- `/api/saju/analyze` 엔드포인트 수정:
  - Gemini API 호출 → GMS API 호출로 변경
  - `client.models.generate_content()` → `call_gms_api()` 사용
  - 모델: gemini-2.0-flash → gpt-4o-mini

- 환경 변수 체크 변경:
  - GEMINI_API_KEY → GMS_KEY로 변경
  - 목업 모드 판단 기준 업데이트

### 2. server/ai-server/requirements.txt
**추가 패키지:**
- `requests>=2.31.0`: GMS API HTTP 요청용

### 3. server/ai-server/.env.example (신규)
**내용:**
```
GMS_KEY=your_gms_api_key_here
GMS_BASE_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1
```

### 4. server/ai-server/README.md
**업데이트:**
- GMS API 사주 분석 기능 추가
- 환경 변수 설정 가이드 업데이트
- GMS_KEY 설정 방법 안내

## GMS API 사용법

### 설정
1. `.env` 파일 생성:
   ```bash
   cp .env.example .env
   ```

2. GMS_KEY 입력:
   ```
   GMS_KEY=your_actual_gms_key
   ```

### API 호출 흐름
```
사용자 입력 (생년월일시, 성별)
   ↓
사주팔자 계산 (연주/월주/일주/시주)
   ↓
명리 분석 (오행, 십성)
   ↓
프롬프트 생성
   ↓
GMS API 호출 (gpt-4o-mini)
   ↓
AI 사주 풀이 반환
```

### GMS API 엔드포인트
- **URL**: `https://gms.ssafy.io/gmsapi/api.openai.com/v1/responses`
- **Method**: POST
- **인증**: Bearer Token (GMS_KEY)
- **모델**: gpt-4o-mini

### 요청 형식
```json
{
  "model": "gpt-4o-mini",
  "input": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "사주 분석 시스템 프롬프트..."
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "위 정보를 바탕으로 사주를 자세히 풀이해주세요."
        }
      ]
    }
  ]
}
```

## 에러 처리

### 1. GMS_KEY 없을 때
→ 목업 모드로 동작 (기본 사주 정보만 제공)

### 2. GMS API 호출 실패 시
→ Fallback 응답 반환 (사주팔자 + 오행 분석)

### 3. 타임아웃 (30초)
→ 예외 처리 후 fallback 응답

## 테스트 방법

### 1. 서버 실행
```bash
cd server/ai-server
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

### 2. API 테스트
```bash
curl -X POST http://localhost:8000/api/saju/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "year": 1995,
    "month": 3,
    "day": 15,
    "hour": 14,
    "minute": 30,
    "gender": "남성",
    "calendar": "양력",
    "isLeapMonth": false
  }'
```

## 장점

1. **통합 관리**: SSAFY GMS 플랫폼을 통한 통합 API 관리
2. **안정성**: GMS의 로드 밸런싱 및 에러 핸들링
3. **모니터링**: GMS 대시보드를 통한 사용량 추적
4. **일관성**: 다른 SSAFY 프로젝트와 동일한 API 사용

## 다음 단계

- [ ] .env 파일에 실제 GMS_KEY 설정
- [ ] 프론트엔드와 통합 테스트
- [ ] 에러 처리 추가 검증
- [ ] 응답 시간 모니터링
