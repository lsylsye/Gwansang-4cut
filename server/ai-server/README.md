# Gemini Image Generation API Server

Google Gemini (Nano Banana)를 활용한 이미지 생성/편집 FastAPI 서버입니다.

## 지원 기능

### 모델

| 모델 | 이름 | 특징 |
|------|------|------|
| `gemini-2.5-flash-image` | Nano Banana | 빠른 속도, 효율성 최적화, 최대 1024px |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 고품질, 최대 4K, 14개 참조 이미지 지원 |

### 주요 기능

- **텍스트 → 이미지 생성**: 텍스트 프롬프트로 이미지 생성
- **이미지 편집**: 기존 이미지를 프롬프트로 수정
- **다중 이미지 결합**: 여러 참조 이미지를 결합하여 새 이미지 생성
- **멀티턴 채팅**: 대화형으로 이미지를 반복 수정
- **Google 검색 그라운딩**: 실시간 정보 기반 이미지 생성

## 설치 및 실행

### 1. 의존성 설치

```bash
cd server/ai-server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 열어 API 키 입력
# GEMINI_API_KEY=your_api_key_here
```

API 키는 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받을 수 있습니다.

### 3. 서버 실행

```bash
# 개발 모드 (자동 리로드)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. API 문서 확인

서버 실행 후 브라우저에서:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 이미지 생성

#### `POST /api/generate`
텍스트 프롬프트로 이미지 생성

```json
{
  "prompt": "A cute cat wearing a wizard hat",
  "model": "gemini-2.5-flash-image",
  "aspect_ratio": "1:1",
  "image_size": "1K",
  "use_google_search": false
}
```

### 이미지 편집

#### `POST /api/edit`
Base64 인코딩된 이미지 편집

```json
{
  "prompt": "Add sunglasses to this cat",
  "image_base64": "iVBORw0KGgo...",
  "image_mime_type": "image/png",
  "model": "gemini-2.5-flash-image",
  "aspect_ratio": "1:1"
}
```

#### `POST /api/edit/upload`
파일 업로드로 이미지 편집 (multipart/form-data)

```bash
curl -X POST "http://localhost:8000/api/edit/upload" \
  -F "prompt=Add a hat to this person" \
  -F "image=@photo.jpg" \
  -F "model=gemini-2.5-flash-image" \
  -F "aspect_ratio=1:1"
```

#### `POST /api/edit/multiple`
여러 참조 이미지 결합 (최대 14개)

```bash
curl -X POST "http://localhost:8000/api/edit/multiple" \
  -F "prompt=Create a group photo of these people" \
  -F "images=@person1.jpg" \
  -F "images=@person2.jpg" \
  -F "images=@person3.jpg" \
  -F "model=gemini-3-pro-image-preview" \
  -F "aspect_ratio=16:9" \
  -F "image_size=2K"
```

### 채팅 세션 (멀티턴 수정)

#### `POST /api/chat/create`
새 채팅 세션 생성

```json
{
  "model": "gemini-3-pro-image-preview",
  "use_google_search": true
}
```

#### `POST /api/chat/message`
채팅 메시지 전송

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Create a vibrant infographic about photosynthesis",
  "aspect_ratio": "16:9",
  "image_size": "2K"
}
```

#### `DELETE /api/chat/{session_id}`
채팅 세션 삭제

### 유틸리티

#### `GET /api/models`
지원되는 모델 목록

#### `GET /api/prompt-templates`
프롬프트 템플릿 예시

## 응답 형식

모든 이미지 관련 API는 다음 형식으로 응답합니다:

```json
{
  "success": true,
  "text": "Here is your generated image...",
  "images": [
    {
      "data": "base64_encoded_image_data",
      "mime_type": "image/png",
      "data_uri": "data:image/png;base64,..."
    }
  ],
  "message": "이미지 생성 완료"
}
```

## 가로세로 비율

지원되는 비율:
- `1:1` (정사각형)
- `2:3`, `3:2`
- `3:4`, `4:3`
- `4:5`, `5:4`
- `9:16`, `16:9` (세로/가로 와이드)
- `21:9` (울트라 와이드)

## 이미지 크기 (gemini-3-pro-image-preview 전용)

- `1K`: 기본 해상도 (~1024px)
- `2K`: 고해상도 (~2048px)
- `4K`: 최고 해상도 (~4096px)

## 프롬프트 작성 팁

1. **구체적으로 작성**: 세부 사항을 많이 포함할수록 좋은 결과
2. **장면 설명**: 키워드 나열보다 문장으로 장면 묘사
3. **스타일 지정**: 사진, 일러스트, 만화 등 원하는 스타일 명시
4. **카메라 용어 활용**: wide-angle, close-up, macro 등

## 주의사항

- 모든 생성된 이미지에는 SynthID 워터마크가 포함됩니다
- 이미지 생성은 오디오/동영상 입력을 지원하지 않습니다
- `gemini-2.5-flash-image`는 최대 3개 이미지 입력 권장
- `gemini-3-pro-image-preview`는 최대 14개 이미지 입력 지원
