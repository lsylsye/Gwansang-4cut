"""
Gemini Image Generation API - FastAPI Server
Google AI의 Nano Banana (Gemini 이미지 생성) API를 활용한 FastAPI 서버

지원 모델:
- gemini-2.5-flash-image (Nano Banana): 속도와 효율성 최적화
- gemini-3-pro-image-preview (Nano Banana Pro): 전문적인 애셋 제작용
"""

import os
import base64
import uuid
from datetime import datetime
from typing import Optional, List
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from google import genai
from google.genai import types

# 환경 변수 로드 (main.py 기준 경로에서 .env 찾기)
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# FastAPI 앱 초기화
app = FastAPI(
    title="Gemini Image Generation API",
    description="Google Gemini (Nano Banana)를 활용한 이미지 생성/편집 API",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용하도록 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini 클라이언트 초기화
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
IS_MOCK_MODE = not GEMINI_API_KEY  # API 키가 없으면 목업 모드

if IS_MOCK_MODE:
    print("⚠️  GEMINI_API_KEY가 설정되지 않았습니다. 목업 모드로 실행됩니다.")
    client = None
else:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Gemini API 클라이언트가 초기화되었습니다.")

# 채팅 세션 저장소 (메모리 기반, 프로덕션에서는 Redis 등 사용 권장)
chat_sessions = {}

# 목업용 더미 이미지 (1x1 투명 PNG, base64)
MOCK_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# ===== Pydantic 모델 정의 =====

class TextToImageRequest(BaseModel):
    """텍스트로 이미지 생성 요청"""
    prompt: str = Field(..., description="이미지 생성을 위한 프롬프트")
    model: str = Field(
        default="gemini-2.5-flash-image",
        description="사용할 모델 (gemini-2.5-flash-image 또는 gemini-3-pro-image-preview)"
    )
    aspect_ratio: Optional[str] = Field(
        default="1:1",
        description="가로세로 비율 (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)"
    )
    image_size: Optional[str] = Field(
        default=None,
        description="이미지 크기 (1K, 2K, 4K) - gemini-3-pro-image-preview에서만 지원"
    )
    response_modalities: Optional[List[str]] = Field(
        default=["TEXT", "IMAGE"],
        description="응답 모달리티 (['TEXT', 'IMAGE'] 또는 ['IMAGE'])"
    )
    use_google_search: bool = Field(
        default=False,
        description="Google 검색 그라운딩 사용 여부"
    )


class ImageEditRequest(BaseModel):
    """이미지 편집 요청 (Base64 인코딩된 이미지 사용)"""
    prompt: str = Field(..., description="이미지 편집을 위한 프롬프트")
    image_base64: str = Field(..., description="Base64 인코딩된 이미지")
    image_mime_type: str = Field(
        default="image/png",
        description="이미지 MIME 타입 (image/png, image/jpeg, image/webp, image/gif)"
    )
    model: str = Field(
        default="gemini-2.5-flash-image",
        description="사용할 모델"
    )
    aspect_ratio: Optional[str] = Field(default="1:1", description="가로세로 비율")


class ChatSessionRequest(BaseModel):
    """채팅 세션 생성 요청"""
    model: str = Field(
        default="gemini-3-pro-image-preview",
        description="사용할 모델"
    )
    use_google_search: bool = Field(
        default=False,
        description="Google 검색 도구 사용 여부"
    )


class ChatMessageRequest(BaseModel):
    """채팅 메시지 전송 요청"""
    session_id: str = Field(..., description="채팅 세션 ID")
    message: str = Field(..., description="전송할 메시지")
    aspect_ratio: Optional[str] = Field(default=None, description="가로세로 비율")
    image_size: Optional[str] = Field(default=None, description="이미지 크기")


class ImageResponse(BaseModel):
    """이미지 응답"""
    success: bool
    text: Optional[str] = None
    images: List[dict] = Field(default_factory=list)
    message: Optional[str] = None


class ChatSessionResponse(BaseModel):
    """채팅 세션 응답"""
    session_id: str
    model: str
    created_at: str


# ===== 헬퍼 함수 =====

def process_response_parts(response) -> tuple[Optional[str], List[dict]]:
    """
    Gemini 응답에서 텍스트와 이미지를 추출
    """
    text_content = None
    images = []
    
    for part in response.parts:
        if part.text is not None:
            text_content = part.text
        elif part.inline_data is not None:
            # 이미지를 Base64로 인코딩
            image_data = part.inline_data.data
            mime_type = part.inline_data.mime_type
            
            # Base64 인코딩
            if isinstance(image_data, bytes):
                b64_data = base64.b64encode(image_data).decode('utf-8')
            else:
                b64_data = image_data
            
            images.append({
                "data": b64_data,
                "mime_type": mime_type,
                "data_uri": f"data:{mime_type};base64,{b64_data}"
            })
    
    return text_content, images


def create_image_config(aspect_ratio: Optional[str], image_size: Optional[str], model: str) -> types.ImageConfig:
    """
    이미지 설정 생성
    """
    config_params = {}
    
    if aspect_ratio:
        config_params["aspect_ratio"] = aspect_ratio
    
    # image_size는 gemini-3-pro-image-preview에서만 지원
    if image_size and "gemini-3-pro" in model:
        config_params["image_size"] = image_size
    
    return types.ImageConfig(**config_params) if config_params else None


# ===== API 엔드포인트 =====

@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "status": "healthy",
        "service": "Gemini Image Generation API",
        "version": "1.0.0",
        "supported_models": [
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview"
        ]
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/generate", response_model=ImageResponse)
async def generate_image(request: TextToImageRequest):
    """
    텍스트 프롬프트로 이미지 생성 (Text-to-Image)
    
    지원 모델:
    - gemini-2.5-flash-image: 빠른 이미지 생성
    - gemini-3-pro-image-preview: 고품질 이미지 생성 (최대 4K)
    """
    try:
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": request.response_modalities
        }
        
        # 이미지 설정
        image_config = create_image_config(
            request.aspect_ratio,
            request.image_size,
            request.model
        )
        if image_config:
            config_params["image_config"] = image_config
        
        # Google 검색 도구 설정
        if request.use_google_search:
            config_params["tools"] = [{"google_search": {}}]
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 생성 요청
        response = client.models.generate_content(
            model=request.model,
            contents=[request.prompt],
            config=config
        )
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="이미지 생성 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 생성 실패: {str(e)}")


@app.post("/api/edit", response_model=ImageResponse)
async def edit_image(request: ImageEditRequest):
    """
    기존 이미지를 텍스트 프롬프트로 편집
    
    Base64 인코딩된 이미지와 프롬프트를 받아 편집된 이미지 반환
    """
    try:
        # Base64 이미지 디코딩
        image_bytes = base64.b64decode(request.image_base64)
        
        # 이미지 Part 생성
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=request.image_mime_type,
                data=image_bytes
            )
        )
        
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        image_config = create_image_config(request.aspect_ratio, None, request.model)
        if image_config:
            config_params["image_config"] = image_config
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 편집 요청
        response = client.models.generate_content(
            model=request.model,
            contents=[request.prompt, image_part],
            config=config
        )
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="이미지 편집 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 편집 실패: {str(e)}")


@app.post("/api/edit/upload", response_model=ImageResponse)
async def edit_image_upload(
    prompt: str = Form(..., description="이미지 편집을 위한 프롬프트"),
    image: UploadFile = File(..., description="편집할 이미지 파일"),
    model: str = Form(default="gemini-2.5-flash-image", description="사용할 모델"),
    aspect_ratio: str = Form(default="1:1", description="가로세로 비율")
):
    """
    파일 업로드 방식으로 이미지 편집
    
    이미지 파일을 직접 업로드하여 편집
    """
    try:
        # 이미지 파일 읽기
        image_bytes = await image.read()
        mime_type = image.content_type or "image/png"
        
        # 이미지 Part 생성
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=mime_type,
                data=image_bytes
            )
        )
        
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        image_config = create_image_config(aspect_ratio, None, model)
        if image_config:
            config_params["image_config"] = image_config
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 편집 요청
        response = client.models.generate_content(
            model=model,
            contents=[prompt, image_part],
            config=config
        )
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="이미지 편집 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 편집 실패: {str(e)}")


@app.post("/api/edit/multiple", response_model=ImageResponse)
async def edit_multiple_images(
    prompt: str = Form(..., description="이미지 편집/결합을 위한 프롬프트"),
    images: List[UploadFile] = File(..., description="참조 이미지들 (최대 14개)"),
    model: str = Form(default="gemini-3-pro-image-preview", description="사용할 모델"),
    aspect_ratio: str = Form(default="1:1", description="가로세로 비율"),
    image_size: str = Form(default="1K", description="이미지 크기 (1K, 2K, 4K)")
):
    """
    여러 이미지를 결합하여 새 이미지 생성
    
    Gemini 3 Pro는 최대 14개의 참조 이미지를 지원합니다.
    - 최대 6개의 충실도 높은 객체 이미지
    - 최대 5개의 인물 이미지 (캐릭터 일관성용)
    """
    try:
        if len(images) > 14:
            raise HTTPException(status_code=400, detail="최대 14개의 이미지만 지원됩니다.")
        
        contents = [prompt]
        
        # 모든 이미지를 contents에 추가
        for img in images:
            image_bytes = await img.read()
            mime_type = img.content_type or "image/png"
            
            image_part = types.Part(
                inline_data=types.Blob(
                    mime_type=mime_type,
                    data=image_bytes
                )
            )
            contents.append(image_part)
        
        # GenerateContentConfig 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        image_config = create_image_config(aspect_ratio, image_size, model)
        if image_config:
            config_params["image_config"] = image_config
        
        config = types.GenerateContentConfig(**config_params)
        
        # 이미지 생성 요청
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config
        )
        
        # 응답 처리
        text_content, result_images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=result_images,
            message=f"{len(images)}개의 참조 이미지로 새 이미지 생성 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 생성 실패: {str(e)}")


# ===== 채팅 세션 API (멀티턴 이미지 수정) =====

@app.post("/api/chat/create", response_model=ChatSessionResponse)
async def create_chat_session(request: ChatSessionRequest):
    """
    멀티턴 이미지 수정을 위한 채팅 세션 생성
    
    채팅 세션을 통해 이미지를 반복적으로 수정할 수 있습니다.
    """
    try:
        session_id = str(uuid.uuid4())
        
        # 채팅 설정
        config_params = {
            "response_modalities": ["TEXT", "IMAGE"]
        }
        
        if request.use_google_search:
            config_params["tools"] = [{"google_search": {}}]
        
        config = types.GenerateContentConfig(**config_params)
        
        # 채팅 세션 생성
        chat = client.chats.create(
            model=request.model,
            config=config
        )
        
        # 세션 저장
        chat_sessions[session_id] = {
            "chat": chat,
            "model": request.model,
            "created_at": datetime.now().isoformat()
        }
        
        return ChatSessionResponse(
            session_id=session_id,
            model=request.model,
            created_at=chat_sessions[session_id]["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 세션 생성 실패: {str(e)}")


@app.post("/api/chat/message", response_model=ImageResponse)
async def send_chat_message(request: ChatMessageRequest):
    """
    채팅 세션에 메시지 전송
    
    멀티턴 대화를 통해 이미지를 반복적으로 수정합니다.
    """
    try:
        if request.session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
        
        session = chat_sessions[request.session_id]
        chat = session["chat"]
        model = session["model"]
        
        # 이미지 설정 (있는 경우)
        send_config = None
        if request.aspect_ratio or request.image_size:
            image_config = create_image_config(request.aspect_ratio, request.image_size, model)
            if image_config:
                send_config = types.GenerateContentConfig(image_config=image_config)
        
        # 메시지 전송
        if send_config:
            response = chat.send_message(request.message, config=send_config)
        else:
            response = chat.send_message(request.message)
        
        # 응답 처리
        text_content, images = process_response_parts(response)
        
        return ImageResponse(
            success=True,
            text=text_content,
            images=images,
            message="메시지 처리 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메시지 전송 실패: {str(e)}")


@app.delete("/api/chat/{session_id}")
async def delete_chat_session(session_id: str):
    """채팅 세션 삭제"""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="채팅 세션을 찾을 수 없습니다.")
    
    del chat_sessions[session_id]
    return {"success": True, "message": "채팅 세션이 삭제되었습니다."}


@app.get("/api/chat/sessions")
async def list_chat_sessions():
    """현재 활성화된 채팅 세션 목록"""
    sessions = []
    for session_id, session_data in chat_sessions.items():
        sessions.append({
            "session_id": session_id,
            "model": session_data["model"],
            "created_at": session_data["created_at"]
        })
    return {"sessions": sessions, "count": len(sessions)}


# ===== 유틸리티 엔드포인트 =====

@app.get("/api/models")
async def list_supported_models():
    """지원되는 모델 목록 및 기능 설명"""
    return {
        "models": [
            {
                "id": "gemini-2.5-flash-image",
                "name": "Nano Banana",
                "description": "속도와 효율성을 위해 설계된 모델. 대량의 낮은 지연 시간 작업에 최적화",
                "max_resolution": "1024px",
                "max_input_images": 3,
                "features": ["텍스트-이미지 생성", "이미지 편집", "스타일 전이"]
            },
            {
                "id": "gemini-3-pro-image-preview",
                "name": "Nano Banana Pro",
                "description": "전문적인 애셋 제작을 위해 설계된 모델. 고급 추론과 사고 기능 포함",
                "max_resolution": "4K",
                "max_input_images": 14,
                "features": [
                    "고해상도 출력 (1K, 2K, 4K)",
                    "고급 텍스트 렌더링",
                    "Google 검색 그라운딩",
                    "사고 모드",
                    "최대 14개 참조 이미지"
                ]
            }
        ],
        "supported_aspect_ratios": [
            "1:1", "2:3", "3:2", "3:4", "4:3", 
            "4:5", "5:4", "9:16", "16:9", "21:9"
        ],
        "supported_image_sizes": ["1K", "2K", "4K"]
    }


# ===== 미래 이미지 생성 API =====

class FutureImageRequest(BaseModel):
    """미래 이미지 생성 요청 (Base64 인코딩된 이미지 사용)"""
    image_base64: str = Field(..., description="Base64 인코딩된 원본 이미지")
    image_mime_type: str = Field(
        default="image/png",
        description="이미지 MIME 타입"
    )
    model: str = Field(
        default="gemini-2.5-flash-image",
        description="사용할 모델"
    )


class FutureImageResponse(BaseModel):
    """미래 이미지 응답"""
    success: bool
    current: Optional[dict] = None  # 현재 이미지
    year_10: Optional[dict] = None  # 10년 후
    year_30: Optional[dict] = None  # 30년 후
    year_50: Optional[dict] = None  # 50년 후
    message: Optional[str] = None


@app.post("/api/future-image", response_model=FutureImageResponse)
async def generate_future_images(request: FutureImageRequest):
    """
    업로드된 사진을 기반으로 현재, 10년 후, 30년 후, 50년 후 이미지 생성
    
    한 장의 사진에서 4가지 시점의 나이든 모습을 AI로 생성합니다.
    """
    # 목업 모드: API 키 없으면 더미 응답 반환
    if IS_MOCK_MODE:
        mock_image = {
            "data": MOCK_IMAGE_BASE64,
            "mime_type": "image/png",
            "data_uri": f"data:image/png;base64,{MOCK_IMAGE_BASE64}"
        }
        return FutureImageResponse(
            success=True,
            current=None,
            year_10=mock_image,
            year_30=mock_image,
            year_50=mock_image,
            message="[목업 모드] API 키가 없어 더미 이미지를 반환합니다."
        )
    
    try:
        # Base64 이미지 디코딩
        image_bytes = base64.b64decode(request.image_base64)
        
        # 이미지 Part 생성
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=request.image_mime_type,
                data=image_bytes
            )
        )
        
        # GenerateContentConfig 설정
        config = types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="3:4")
        )
        
        # 각 시점별 프롬프트 정의 (현재는 업로드 원본 사용, API 호출 안함)
        prompts = {
            "year_10": "이 사진의 인물이 10년 후의 모습을 상상해서 생성해주세요. 약간의 성숙함과 여유로운 표정을 더하고, 자연스러운 미세한 노화 (얼굴선이 조금 더 또렷해지고, 눈가에 미세한 웃음주름) 를 반영해주세요. 하지만 전체적으로 건강하고 활력있는 모습으로 표현해주세요. 동일 인물임을 알 수 있도록 얼굴 특징을 유지해주세요.",
            "year_30": "이 사진의 인물이 30년 후의 모습을 상상해서 생성해주세요. 중년의 성숙미와 지혜로운 인상을 담아주세요. 자연스러운 주름, 약간 희끗해진 머리카락, 눈가와 미간의 세월 흔적을 표현하되, 인자하고 편안한 미소를 담아주세요. 원본 사진의 얼굴 특징과 인상은 유지해주세요.",
            "year_50": "이 사진의 인물이 50년 후 노년의 모습을 상상해서 생성해주세요. 깊은 주름, 흰머리, 그러나 지혜롭고 평온한 눈빛을 가진 노인으로 표현해주세요. 건강하고 품위 있는 노년의 모습으로, 따뜻한 미소를 띤 인자한 할머니/할아버지의 인상으로 만들어주세요. 원본의 얼굴 특징은 유지해주세요."
        }
        
        results = {}
        
        # 각 시점별로 이미지 생성
        for period, prompt in prompts.items():
            try:
                response = client.models.generate_content(
                    model=request.model,
                    contents=[prompt, image_part],
                    config=config
                )
                
                # 응답에서 이미지 추출
                _, images = process_response_parts(response)
                
                if images:
                    results[period] = images[0]  # 첫 번째 이미지 사용
                else:
                    results[period] = None
                    
            except Exception as e:
                print(f"Error generating {period} image: {str(e)}")
                results[period] = None
        
        return FutureImageResponse(
            success=True,
            current=None,
            year_10=results.get("year_10"),
            year_30=results.get("year_30"),
            year_50=results.get("year_50"),
            message="미래 이미지 생성 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"미래 이미지 생성 실패: {str(e)}")


@app.post("/api/future-image/upload", response_model=FutureImageResponse)
async def generate_future_images_upload(
    image: UploadFile = File(..., description="원본 이미지 파일"),
    model: str = Form(default="gemini-2.5-flash-image", description="사용할 모델")
):
    """
    파일 업로드 방식으로 미래 이미지 생성
    
    이미지 파일을 직접 업로드하여 3가지 시점의 미래 이미지를 생성합니다.
    (현재 사진은 업로드 원본 사용)
    """
    # 목업 모드: API 키 없으면 더미 응답 반환
    if IS_MOCK_MODE:
        mock_image = {
            "data": MOCK_IMAGE_BASE64,
            "mime_type": "image/png",
            "data_uri": f"data:image/png;base64,{MOCK_IMAGE_BASE64}"
        }
        return FutureImageResponse(
            success=True,
            current=None,
            year_10=mock_image,
            year_30=mock_image,
            year_50=mock_image,
            message="[목업 모드] API 키가 없어 더미 이미지를 반환합니다."
        )
    
    try:
        # 이미지 파일 읽기
        image_bytes = await image.read()
        mime_type = image.content_type or "image/png"
        
        # 이미지 Part 생성
        image_part = types.Part(
            inline_data=types.Blob(
                mime_type=mime_type,
                data=image_bytes
            )
        )
        
        # GenerateContentConfig 설정
        config = types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="3:4")
        )
        
        # 각 시점별 프롬프트 정의 (현재는 업로드 원본 사용, API 호출 안함)
        prompts = {
            "year_10": "이 사진의 인물이 10년 후의 모습을 상상해서 생성해주세요. 약간의 성숙함과 여유로운 표정을 더하고, 자연스러운 미세한 노화 (얼굴선이 조금 더 또렷해지고, 눈가에 미세한 웃음주름) 를 반영해주세요. 하지만 전체적으로 건강하고 활력있는 모습으로 표현해주세요. 동일 인물임을 알 수 있도록 얼굴 특징을 유지해주세요.",
            "year_30": "이 사진의 인물이 30년 후의 모습을 상상해서 생성해주세요. 중년의 성숙미와 지혜로운 인상을 담아주세요. 자연스러운 주름, 약간 희끗해진 머리카락, 눈가와 미간의 세월 흔적을 표현하되, 인자하고 편안한 미소를 담아주세요. 원본 사진의 얼굴 특징과 인상은 유지해주세요.",
            "year_50": "이 사진의 인물이 50년 후 노년의 모습을 상상해서 생성해주세요. 깊은 주름, 흰머리, 그러나 지혜롭고 평온한 눈빛을 가진 노인으로 표현해주세요. 건강하고 품위 있는 노년의 모습으로, 따뜻한 미소를 띤 인자한 할머니/할아버지의 인상으로 만들어주세요. 원본의 얼굴 특징은 유지해주세요."
        }
        
        results = {}
        
        # 각 시점별로 이미지 생성
        for period, prompt in prompts.items():
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[prompt, image_part],
                    config=config
                )
                
                # 응답에서 이미지 추출
                _, images = process_response_parts(response)
                
                if images:
                    results[period] = images[0]
                else:
                    results[period] = None
                    
            except Exception as e:
                print(f"Error generating {period} image: {str(e)}")
                results[period] = None
        
        return FutureImageResponse(
            success=True,
            current=None,
            year_10=results.get("year_10"),
            year_30=results.get("year_30"),
            year_50=results.get("year_50"),
            message="미래 이미지 생성 완료"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"미래 이미지 생성 실패: {str(e)}")


@app.get("/api/prompt-templates")
async def get_prompt_templates():
    """이미지 생성을 위한 프롬프트 템플릿 예시"""
    return {
        "templates": [
            {
                "category": "실사형 장면",
                "template": "A photorealistic [shot type] of [subject], [action or expression], set in [environment]. The scene is illuminated by [lighting description], creating a [mood] atmosphere. Captured with a [camera/lens details], emphasizing [key textures and details]. The image should be in a [aspect ratio] format.",
                "example": "A photorealistic close-up portrait of an elderly Japanese potter, deeply focused on shaping clay on a spinning wheel, set in a traditional, sunlit workshop. The scene is illuminated by soft, diffused natural light from a nearby window, creating a serene atmosphere."
            },
            {
                "category": "스티커/삽화",
                "template": "A [style] sticker of a [subject], featuring [key characteristics] and a [color palette]. The design should have [line style] and [shading style]. The background must be transparent.",
                "example": "A kawaii-style sticker of a happy red panda, featuring large expressive eyes and a fluffy tail with a pastel color palette. The design should have clean outlines and soft cel-shading. The background must be transparent."
            },
            {
                "category": "이미지 내 텍스트",
                "template": "Create a [image type] for [brand/concept] with the text \"[text to render]\" in a [font style]. The design should be [style description], with a [color scheme].",
                "example": "Create a logo for a coffee shop called 'The Daily Grind' with the text 'The Daily Grind' in a modern sans-serif font. The design should be minimalist and elegant, with an earthy brown and cream color scheme."
            },
            {
                "category": "제품 사진",
                "template": "A high-resolution, studio-lit product photograph of a [product description] on a [background surface/description]. The lighting is a [lighting setup] to [lighting purpose]. The camera angle is a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp focus on [key detail]. [Aspect ratio].",
                "example": "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug on a polished marble surface. The lighting is a three-point softbox setup to minimize harsh shadows."
            },
            {
                "category": "이미지 편집 - 요소 추가",
                "template": "Using the provided image of [subject], please [add/remove/modify] [element] to/from the scene. Ensure the change is [description of how the change should integrate].",
                "example": "Using the provided image of a fluffy ginger cat, please add a small, knitted wizard hat. Ensure the change is seamlessly integrated with realistic shadows."
            },
            {
                "category": "스타일 전이",
                "template": "Transform the provided photograph of [subject] into the artistic style of [artist/art style]. Preserve the original composition but render it with [description of stylistic elements].",
                "example": "Transform the provided photograph of a city street into the artistic style of Van Gogh. Preserve the original composition but render it with bold, swirling brushstrokes and vibrant colors."
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
