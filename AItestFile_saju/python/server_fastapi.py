"""
GMS API 텍스트 생성 서버 (FastAPI 버전)
관상 및 사주 분석 API를 제공합니다.

사용법:
    uvicorn server_fastapi:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드 (상위 폴더의 .env 파일 사용)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from gms_api import call_gms_api
from gms_api import call_gms_api
from saju_prompt_builder import build_saju_system_prompt, build_saju_user_prompt
from rag_search import (
    load_knowledge_base,
    search_chunks,
    format_context,
    summarize_saju_for_search
)
from redis_client import (
    get_redis_client,
    check_redis_search,
    get_indexed_doc_count
)
from redis_search import (
    search_by_vector,
    format_search_context
)
from saju_calculation import calculate_saju
from saju_myeongri import calculate_myeongri
from face_analysis_service import analyze_face
from saju_summary_service import (
    build_saju_summary_prompt,
    build_saju_user_prompt_for_summary,
    parse_birth_info,
    parse_total_review
)
from face_prompt_builder import (
    summarize_face_analysis_for_search,
    build_total_review_prompt,
    parse_total_review
    parse_total_review
)

# FastAPI 앱 초기화
app = FastAPI(
    title="GMS API 서버",
    description="관상 및 사주 분석 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경변수 확인
if not os.getenv("GMS_KEY"):
    print("⚠️ 경고: GMS_KEY 환경변수가 설정되지 않았습니다.")

# RAG 지식베이스 경로 설정
SCRIPT_DIR = Path(__file__).parent
KNOWLEDGE_BASE_PATH = SCRIPT_DIR.parent / "knowledge"

# 지식베이스 캐시
_knowledge_chunks_cache = None
_use_redis = None


def get_knowledge_chunks():
    """지식베이스 청크를 로드하고 캐시"""
    global _knowledge_chunks_cache
    if _knowledge_chunks_cache is None:
        print(f"📚 지식베이스 로드 중: {KNOWLEDGE_BASE_PATH}")
        _knowledge_chunks_cache = load_knowledge_base(str(KNOWLEDGE_BASE_PATH))
        if not _knowledge_chunks_cache:
            print("⚠️ 경고: 지식베이스가 비어있습니다.")
    return _knowledge_chunks_cache


def should_use_redis() -> bool:
    """Redis 사용 여부 확인"""
    global _use_redis
    
    if _use_redis is not None:
        return _use_redis
    
    use_redis_env = os.getenv("USE_REDIS_RAG", "false").lower() == "true"
    
    if not use_redis_env:
        _use_redis = False
        return False
    
    try:
        check_redis_search()
        from redis_client import index_exists, SAJU_INDEX_NAME
        if not index_exists(SAJU_INDEX_NAME):
            print("⚠️ Redis 인덱스가 없습니다.")
            _use_redis = False
            return False
        
        doc_count = get_indexed_doc_count()
        if doc_count == 0:
            print("⚠️ 인덱싱된 문서가 없습니다.")
            _use_redis = False
            return False
        
        print(f"✅ Redis 벡터 검색 사용 가능 (인덱싱된 문서: {doc_count}개)")
        _use_redis = True
        return True
    except Exception as e:
        print(f"⚠️ Redis 사용 불가: {e}")
        _use_redis = False
        return False


# ===== Pydantic 모델 정의 =====

class HealthResponse(BaseModel):
    status: str
    message: str
    gms_key_set: bool


class GenerateRequest(BaseModel):
    system_prompt: str
    user_prompt: str
    model: str = Field(default="gpt-5-mini")
    timeout: int = Field(default=300)


class GenerateResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None


class SajuAnalyzeRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: int
    minute: int = Field(default=0)
    gender: str
    calendar: str = Field(default="양력")
    isLeapMonth: bool = Field(default=False)
    query: Optional[str] = None
    useRedis: Optional[bool] = None
    model: str = Field(default="gpt-5-mini")
    timeout: int = Field(default=300)


class SajuGenerateRequest(BaseModel):
    """사주 분석 텍스트 생성 요청"""
    saju_data: Dict[str, Any] = Field(..., description="사주 4주 데이터")
    myeongri_data: Dict[str, Any] = Field(..., description="명리 관계 데이터")
    birth_info: Dict[str, Any] = Field(..., description="생년월일시 정보")
    context: Optional[str] = Field(default="", description="RAG 검색 결과 컨텍스트 (선택사항)")
    query: Optional[str] = Field(default=None, description="추가 질문 (선택사항)")
    model: str = Field(default="gpt-5-mini")
    timeout: int = Field(default=300)


class SajuData(BaseModel):
    gender: str
    calendarType: str = Field(default="solar")
    birthDate: str
    birthTime: Optional[str] = None
    birthTimeUnknown: bool = Field(default=False)


class SajuSummaryRequest(BaseModel):
    """사주 총평 생성 요청"""
    timestamp: Optional[str] = None
    sajuData: SajuData = Field(..., description="사주 데이터")
    model: str = Field(default="gpt-5-mini")
    timeout: int = Field(default=300)


class Landmark(BaseModel):
    index: int
    x: float
    y: float
    z: float


class FaceData(BaseModel):
    faceIndex: int
    duration: Optional[int] = None
    landmarks: List[Landmark]


class FaceAnalysisRequest(BaseModel):
    timestamp: Optional[str] = None
    faces: List[FaceData]
    sajuData: Optional[SajuData] = None
    model: str = Field(default="gpt-5-mini")
    timeout: int = Field(default=300)


class GroupOhengMember(BaseModel):
    name: str
    fiveElements: Dict[str, int]


class GroupOhengRequest(BaseModel):
    members: List[GroupOhengMember]


# ===== API 엔드포인트 =====

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """서버 상태 확인"""
    return HealthResponse(
        status="ok",
        message="GMS API 서버가 정상적으로 실행 중입니다.",
        gms_key_set=bool(os.getenv("GMS_KEY"))
    )


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """텍스트 생성 API"""
    try:
        result = call_gms_api(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            model=request.model,
            timeout=request.timeout
        )
        
        return GenerateResponse(
            success=True,
            result=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@app.post("/api/saju/analyze")
async def analyze_saju(request: SajuAnalyzeRequest):
    """사주 분석 API"""
    try:
        print(f"📥 받은 요청 데이터: {request.dict()}")
        
        print("🔮 사주 분석 시작...")
        print(f"   생년월일시: {request.year}-{request.month:02d}-{request.day:02d} {request.hour:02d}:{request.minute:02d}")
        print(f"   성별: {request.gender}, 달력: {request.calendar}")
        
        birth_info = {
            'year': request.year,
            'month': request.month,
            'day': request.day,
            'hour': request.hour,
            'minute': request.minute,
            'gender': request.gender,
            'calendar': request.calendar,
            'isLeapMonth': request.isLeapMonth
        }
        
        # 1. 사주 계산
        print("   1단계: 사주 계산 중...")
        saju = calculate_saju(birth_info)
        print(f"      연주: {saju['yearPillar']}, 월주: {saju['monthPillar']}, 일주: {saju['dayPillar']}, 시주: {saju['hourPillar']}")
        
        # 2. 명리 분석
        print("   2단계: 명리 분석 중...")
        myeongri = calculate_myeongri(saju)
        print(f"      일간: {saju['dayStem']}, 오행: {myeongri['fiveElements']}")
        
        # 3. RAG 검색
        print("   3단계: RAG 검색 중...")
        context = ""
        try:
            day_stem = saju['dayStem']
            keywords = myeongri['keywords']
            
            five_elements = myeongri['fiveElements']
            day_element = "목"
            if five_elements:
                max_element = max(five_elements.items(), key=lambda x: x[1])
                if max_element[1] > 0:
                    day_element = max_element[0]
            
            search_query = summarize_saju_for_search(day_stem, day_element, keywords)
            print(f"      검색 쿼리: {search_query[:60]}...")
            
            use_redis = request.useRedis
            if use_redis is None:
                use_redis = should_use_redis()
            elif use_redis:
                use_redis = should_use_redis()
            
            if use_redis:
                print("      Redis 벡터 검색 모드")
                try:
                    relevant_chunks = search_by_vector(search_query, topK=8)
                    context = format_search_context(relevant_chunks)
                    print(f"      ✅ {len(relevant_chunks)}개의 관련 문서 찾음 (벡터 검색)")
                except Exception as e:
                    print(f"      ⚠️ Redis 검색 실패, 파일 기반 검색으로 전환: {e}")
                    chunks = get_knowledge_chunks()
                    if chunks:
                        relevant_chunks = search_chunks(chunks, search_query, topK=8)
                        context = format_context(relevant_chunks)
                        print(f"      ✅ {len(relevant_chunks)}개의 관련 문서 찾음 (파일 검색)")
                    else:
                        context = "[컨텍스트 없음 - 지식베이스가 비어있습니다]"
            else:
                print("      파일 기반 검색 모드")
                chunks = get_knowledge_chunks()
                if chunks:
                    relevant_chunks = search_chunks(chunks, search_query, topK=8)
                    context = format_context(relevant_chunks)
                    print(f"      ✅ {len(relevant_chunks)}개의 관련 문서 찾음 (파일 검색)")
                else:
                    print("      ⚠️ 지식베이스가 비어있어 RAG 검색을 건너뜁니다.")
                    context = "[컨텍스트 없음 - 지식베이스가 비어있습니다]"
        except Exception as e:
            print(f"      ⚠️ RAG 검색 중 오류 발생: {e}")
            context = "[컨텍스트 없음 - 검색 오류]"
        
        # 4. 십성 개수 계산
        sip_sung_data = myeongri['sipSung']
        sip_sung_values = [
            sip_sung_data['yearStem'],
            sip_sung_data['monthStem'],
            sip_sung_data['hourStem'],
            sip_sung_data['yearBranch'],
            sip_sung_data['monthBranch'],
            sip_sung_data['dayBranch'],
            sip_sung_data['hourBranch']
        ]
        
        sip_sung_counts = {
            '비견': sip_sung_values.count('비견'),
            '겁재': sip_sung_values.count('겁재'),
            '식신': sip_sung_values.count('식신'),
            '상관': sip_sung_values.count('상관'),
            '편재': sip_sung_values.count('편재'),
            '정재': sip_sung_values.count('정재'),
            '편관': sip_sung_values.count('편관'),
            '정관': sip_sung_values.count('정관'),
            '편인': sip_sung_values.count('편인'),
            '인수': sip_sung_values.count('인수')
        }
        
        # 5. 프롬프트 생성
        print("   4단계: 프롬프트 생성 중...")
        system_prompt = build_saju_system_prompt(context)
        user_prompt = build_saju_user_prompt(
            saju_data={
                'yearPillar': saju['yearPillar'],
                'monthPillar': saju['monthPillar'],
                'dayPillar': saju['dayPillar'],
                'hourPillar': saju['hourPillar'],
                'yearStem': saju['yearStem'],
                'yearBranch': saju['yearBranch'],
                'monthStem': saju['monthStem'],
                'monthBranch': saju['monthBranch'],
                'dayStem': saju['dayStem'],
                'dayBranch': saju['dayBranch'],
                'hourStem': saju['hourStem'],
                'hourBranch': saju['hourBranch'],
                'solarTerm': saju['solarTerm'],
                'solarTermDate': saju['solarTermDate']
            },
            myeongri_data={
                'fiveElements': myeongri['fiveElements'],
                'sipSung': sip_sung_counts,
                'twelveFortune': myeongri.get('twelveFortune', {}),
                'ganjiRelations': myeongri.get('ganjiRelations', {}),
                'keywords': myeongri['keywords']
            },
            birth_info=birth_info,
            additional_query=request.query
        )
        
        # 6. GMS API 호출
        print("   5단계: LLM 호출 중...")
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=request.model,
            timeout=request.timeout
        )
        
        print("✅ 사주 분석 완료")
        
        return {
            "success": True,
            "result": result,
            "sajuData": {
                'yearPillar': saju['yearPillar'],
                'monthPillar': saju['monthPillar'],
                'dayPillar': saju['dayPillar'],
                'hourPillar': saju['hourPillar'],
                'yearStem': saju['yearStem'],
                'yearBranch': saju['yearBranch'],
                'monthStem': saju['monthStem'],
                'monthBranch': saju['monthBranch'],
                'dayStem': saju['dayStem'],
                'dayBranch': saju['dayBranch'],
                'hourStem': saju['hourStem'],
                'hourBranch': saju['hourBranch'],
                'solarTerm': saju['solarTerm'],
                'solarTermDate': saju['solarTermDate']
            },
            "myeongriData": {
                'fiveElements': myeongri['fiveElements'],
                'sipSung': sip_sung_counts,
                'twelveFortune': myeongri.get('twelveFortune', {}),
                'ganjiRelations': myeongri.get('ganjiRelations', {}),
                'keywords': myeongri['keywords']
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ 사주 분석 중 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@app.post("/api/saju/generate")
async def generate_saju(request: SajuGenerateRequest):
    """사주 분석 텍스트 생성 API"""
    try:
        saju_data = request.saju_data
        myeongri_data = request.myeongri_data
        birth_info = request.birth_info
        context = request.context or ""
        additional_query = request.query
        
        # RAG 검색 수행 (context가 비어있으면 자동으로 검색)
        if not context or context.strip() == "":
            try:
                print("🔍 RAG 검색 수행 중...")
                
                dayStem = saju_data.get("dayStem", "")
                keywords = myeongri_data.get("keywords", [])
                
                fiveElements = myeongri_data.get("fiveElements", {})
                dayElement = "목"
                if fiveElements:
                    maxElement = max(fiveElements.items(), key=lambda x: x[1])
                    if maxElement[1] > 0:
                        dayElement = maxElement[0]
                
                searchQuery = summarize_saju_for_search(dayStem, dayElement, keywords)
                print(f"   검색 쿼리: {searchQuery[:60]}...")
                
                use_redis = should_use_redis()
                
                if use_redis:
                    print("   Redis 벡터 검색 모드")
                    try:
                        relevantChunks = search_by_vector(searchQuery, topK=8)
                        context = format_search_context(relevantChunks)
                        print(f"✅ {len(relevantChunks)}개의 관련 문서 찾음 (벡터 검색)")
                    except Exception as e:
                        print(f"⚠️ Redis 검색 실패, 파일 기반 검색으로 전환: {e}")
                        chunks = get_knowledge_chunks()
                        if chunks:
                            relevantChunks = search_chunks(chunks, searchQuery, topK=8)
                            context = format_context(relevantChunks)
                            print(f"✅ {len(relevantChunks)}개의 관련 문서 찾음 (파일 검색)")
                        else:
                            context = "[컨텍스트 없음 - 지식베이스가 비어있습니다]"
                else:
                    print("   파일 기반 검색 모드")
                    chunks = get_knowledge_chunks()
                    if chunks:
                        relevantChunks = search_chunks(chunks, searchQuery, topK=8)
                        context = format_context(relevantChunks)
                        print(f"✅ {len(relevantChunks)}개의 관련 문서 찾음 (파일 검색)")
                    else:
                        print("⚠️ 지식베이스가 비어있어 RAG 검색을 건너뜁니다.")
                        context = "[컨텍스트 없음 - 지식베이스가 비어있습니다]"
            except Exception as e:
                print(f"⚠️ RAG 검색 중 오류 발생: {e}")
                context = "[컨텍스트 없음 - 검색 오류]"
        
        # 프롬프트 생성
        system_prompt = build_saju_system_prompt(context)
        user_prompt = build_saju_user_prompt(
            saju_data=saju_data,
            myeongri_data=myeongri_data,
            birth_info=birth_info,
            additional_query=additional_query
        )
        
        # GMS API 호출
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=request.model,
            timeout=request.timeout
        )
        
        return {
            "success": True,
            "result": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@app.post("/api/saju/summary")
async def generate_saju_summary(request: SajuSummaryRequest):
    """사주 총평 생성 API (LLM-based)"""
    try:
        saju_data = request.sajuData
        
        print(f"🔮 사주 총평 생성 시작...")
        print(f"   성별: {saju_data.gender}")
        print(f"   생년월일: {saju_data.birthDate}")
        print(f"   시간: {saju_data.birthTime or '미상'}")
        
        # 1. 생년월일시 파싱
        birth_info = parse_birth_info(saju_data.dict())
        
        # 2. 사주 계산
        print("   1단계: 사주 계산 중...")
        saju = calculate_saju(birth_info)
        print(f"      연주: {saju['yearPillar']}, 월주: {saju['monthPillar']}, 일주: {saju['dayPillar']}, 시주: {saju['hourPillar']}")
        
        # 3. 명리 분석
        print("   2단계: 명리 분석 중...")
        myeongri = calculate_myeongri(saju)
        
        # 4. 총평용 사주 데이터 구성
        enhanced_saju_data = {
            **saju_data.dict(),
            "yearPillar": saju['yearPillar'],
            "monthPillar": saju['monthPillar'],
            "dayPillar": saju['dayPillar'],
            "hourPillar": saju['hourPillar'],
            "dayStem": saju['dayStem'],
            "fiveElements": myeongri['fiveElements']
        }
        
        # 5. 프롬프트 생성
        print("   3단계: 프롬프트 생성 중...")
        system_prompt = build_saju_summary_prompt(enhanced_saju_data)
        user_prompt = build_saju_user_prompt_for_summary(enhanced_saju_data)
        
        # 6. GMS API 호출 (LLM)
        print("   4단계: LLM 호출 중...")
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=request.model,
            timeout=request.timeout
        )
        
        # 7. LLM 응답 파싱하여 totalReview 구조로 변환
        print("   5단계: 응답 파싱 중...")
        total_review = parse_total_review(result)
        
        print("✅ 사주 총평 생성 완료")
        
        return {
            "success": True,
            "timestamp": request.timestamp or "",
            "totalReview": total_review,
            "sajuInfo": {
                "yearPillar": saju['yearPillar'],
                "monthPillar": saju['monthPillar'],
                "dayPillar": saju['dayPillar'],
                "hourPillar": saju['hourPillar'],
                "yearStem": saju['yearStem'],
                "yearBranch": saju['yearBranch'],
                "monthStem": saju['monthStem'],
                "monthBranch": saju['monthBranch'],
                "dayStem": saju['dayStem'],
                "dayBranch": saju['dayBranch'],
                "hourStem": saju['hourStem'],
                "hourBranch": saju['hourBranch'],
                "solarTerm": saju['solarTerm'],
                "fiveElements": myeongri['fiveElements']
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ 사주 총평 생성 중 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@app.post("/test-api/facemesh/personal")
async def analyze_face_api(request: FaceAnalysisRequest):
    """관상 분석 + 사주 총평 통합 API"""
    try:
        # 1. 관상 분석 (Rule-based)
        faces = request.faces
        if not faces or len(faces) == 0:
            raise HTTPException(status_code=400, detail="faces 배열이 비어있습니다.")
        
        face = faces[0]
        landmarks = [{"index": lm.index, "x": lm.x, "y": lm.y, "z": lm.z} for lm in face.landmarks]
        
        if not landmarks or len(landmarks) < 100:
            raise HTTPException(status_code=400, detail="landmarks 데이터가 부족합니다. MediaPipe 468 랜드마크가 필요합니다.")
        
        print(f"🔍 관상 분석 시작 - landmarks 수: {len(landmarks)}")
        
        analysis_result = analyze_face(landmarks)
        meta = analysis_result.pop("_meta", {})
        
        print(f"✅ 관상 분석 완료 - 품질: {meta.get('qualityNote', 'N/A')}")
        
        # 2. 사주 계산 (필수)
        # 2. 사주 계산 (필수)
        saju_data = request.sajuData
        if not saju_data or not saju_data.birthDate:
            raise HTTPException(status_code=400, detail="sajuData와 birthDate는 필수입니다.")
        if not saju_data or not saju_data.birthDate:
            raise HTTPException(status_code=400, detail="sajuData와 birthDate는 필수입니다.")
        
        try:
            print(f"🔮 사주 계산 시작...")
            birth_info = parse_birth_info(saju_data.dict())
            saju = calculate_saju(birth_info)
            myeongri = calculate_myeongri(saju)
            saju_info = {
                "yearPillar": saju['yearPillar'],
                "monthPillar": saju['monthPillar'],
                "dayPillar": saju['dayPillar'],
                "hourPillar": saju['hourPillar'],
                "yearStem": saju['yearStem'],
                "yearBranch": saju['yearBranch'],
                "monthStem": saju['monthStem'],
                "monthBranch": saju['monthBranch'],
                "dayStem": saju['dayStem'],
                "dayBranch": saju['dayBranch'],
                "hourStem": saju['hourStem'],
                "hourBranch": saju['hourBranch'],
                "solarTerm": saju['solarTerm'],
                "fiveElements": myeongri['fiveElements']
            }
            print(f"   사주: {saju['yearPillar']} {saju['monthPillar']} {saju['dayPillar']} {saju['hourPillar']}")
            print("✅ 사주 계산 완료")
        except Exception as e:
            print(f"⚠️ 사주 계산 중 오류: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"사주 계산 오류: {str(e)}")
        try:
            print(f"🔮 사주 계산 시작...")
            birth_info = parse_birth_info(saju_data.dict())
            saju = calculate_saju(birth_info)
            myeongri = calculate_myeongri(saju)
            saju_info = {
                "yearPillar": saju['yearPillar'],
                "monthPillar": saju['monthPillar'],
                "dayPillar": saju['dayPillar'],
                "hourPillar": saju['hourPillar'],
                "yearStem": saju['yearStem'],
                "yearBranch": saju['yearBranch'],
                "monthStem": saju['monthStem'],
                "monthBranch": saju['monthBranch'],
                "dayStem": saju['dayStem'],
                "dayBranch": saju['dayBranch'],
                "hourStem": saju['hourStem'],
                "hourBranch": saju['hourBranch'],
                "solarTerm": saju['solarTerm'],
                "fiveElements": myeongri['fiveElements']
            }
            print(f"   사주: {saju['yearPillar']} {saju['monthPillar']} {saju['dayPillar']} {saju['hourPillar']}")
            print("✅ 사주 계산 완료")
        except Exception as e:
            print(f"⚠️ 사주 계산 중 오류: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"사주 계산 오류: {str(e)}")
        
        # 3. RAG 검색 + LLM 1회 호출 (관상 3키 + 전체적인 체질 특성 = 4키)
        # 3. RAG 검색 + LLM 1회 호출 (관상 3키 + 전체적인 체질 특성 = 4키)
        total_review = None
        try:
            print("🔍 RAG 검색 시작...")
            search_query = summarize_face_analysis_for_search(analysis_result)
            use_redis = should_use_redis()
            rag_context = ""
            if use_redis:
                try:
                    relevant_chunks = search_by_vector(search_query, topK=8)
                    rag_context = format_search_context(relevant_chunks)
                except Exception as e:
                    chunks = get_knowledge_chunks()
                    if chunks:
                        relevant_chunks = search_chunks(chunks, search_query, topK=8)
                        rag_context = format_context(relevant_chunks)
            else:
                chunks = get_knowledge_chunks()
                if chunks:
                    relevant_chunks = search_chunks(chunks, search_query, topK=8)
                    rag_context = format_context(relevant_chunks)
            
            # LLM 1회 호출: [조화][종합][조언][전체적인 체질 특성] 한 번에 생성
            print("📝 LLM 프롬프트 생성 중 (관상+사주 4키)...")
            system_prompt, user_prompt = build_total_review_prompt(analysis_result, saju_info, rag_context)
            print("🤖 LLM 호출 중 (1회)...")
            
            # LLM 1회 호출: [조화][종합][조언][전체적인 체질 특성] 한 번에 생성
            print("📝 LLM 프롬프트 생성 중 (관상+사주 4키)...")
            system_prompt, user_prompt = build_total_review_prompt(analysis_result, saju_info, rag_context)
            print("🤖 LLM 호출 중 (1회)...")
            llm_result = call_gms_api(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=request.model,
                timeout=request.timeout
            )
            total_review = parse_total_review(llm_result)
            
            print("✅ LLM 기반 관상+체질 해석 생성 완료 (4키)")
        except Exception as e:
            print(f"⚠️ RAG+LLM 처리 중 오류: {e}")
            print(f"⚠️ RAG+LLM 처리 중 오류: {e}")
            import traceback
            traceback.print_exc()
            total_review = {
                "harmony": "관상 분석 결과를 바탕으로 전체적인 조화를 분석합니다.",
                "comprehensive": "종합적인 성격과 운세를 분석합니다.",
                "improvement": "더 나은 삶을 위한 조언을 제공합니다.",
                "total_user_saju_information": "",
            }
        
        # 4. 통합 응답 반환
        response = {
            "success": True,
            "timestamp": request.timestamp or "",
            "faceIndex": face.faceIndex,
            "faceAnalysis": analysis_result,
            "meta": {
                "headRoll": meta.get("headRoll", 0),
                "qualityNote": meta.get("qualityNote", ""),
                "overallSymmetry": meta.get("symmetry", 0)
            },
            "totalReview": total_review,
            "sajuInfo": saju_info,
        }
            },
            "totalReview": total_review,
            "sajuInfo": saju_info,
        }
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 관상 분석 중 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"관상 분석 오류: {str(e)}")


@app.post("/api/group-oheng-combination")
async def group_oheng_combination(request: GroupOhengRequest):
    """모임 관상 결과용 오행 조합 (RAG)"""
    try:
        ELEMENT_LABELS = {"목": "목(木)", "화": "화(火)", "토": "토(土)", "금": "금(金)", "수": "수(水)"}
        SUPPLEMENT_THRESHOLD = 3
        CONFLICT_THRESHOLD = 2
        
        members = [m.dict() for m in request.members]
        
        if len(members) < 2:
            return {
                "success": True,
                "supplement": [],
                "conflict": [],
                "summary": "멤버가 2명 이상일 때만 오행 조합을 분석합니다.",
            }
        
        # 기운 채워줌 계산
        supplement = []
        for elem in ["목", "화", "토", "금", "수"]:
            for i, a in enumerate(members):
                fe_a = a.get("fiveElements", {})
                val_a = fe_a.get(elem, 0)
                if val_a < SUPPLEMENT_THRESHOLD:
                    continue
                for j, b in enumerate(members):
                    if i == j:
                        continue
                    fe_b = b.get("fiveElements", {})
                    if fe_b.get(elem, 0) != 0:
                        continue
                    name_a = a.get("name", f"멤버{i+1}")
                    name_b = b.get("name", f"멤버{j+1}")
                    supplement.append({
                        "fromName": name_a,
                        "toName": name_b,
                        "element": elem,
                        "elementLabel": ELEMENT_LABELS.get(elem, elem),
                        "explanation": f"{name_a}님이 {name_b}님의 {ELEMENT_LABELS.get(elem, elem)} 기운을 채워 줍니다.",
                    })
        
        # 상충 계산
        conflict = []
        for elem in ["목", "화", "토", "금", "수"]:
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    a, b = members[i], members[j]
                    va = a.get("fiveElements", {}).get(elem, 0)
                    vb = b.get("fiveElements", {}).get(elem, 0)
                    if va >= CONFLICT_THRESHOLD and vb >= CONFLICT_THRESHOLD:
                        name_a = a.get("name", f"멤버{i+1}")
                        name_b = b.get("name", f"멤버{j+1}")
                        conflict.append({
                            "name1": name_a,
                            "name2": name_b,
                            "element": elem,
                            "elementLabel": ELEMENT_LABELS.get(elem, elem),
                            "explanation": f"{name_a}님과 {name_b}님은 둘 다 {ELEMENT_LABELS.get(elem, elem)} 기운이 강해 같은 기운이라 상충할 수 있습니다.",
                        })
        
        summary_parts = []
        if supplement:
            summary_parts.append("기운 채워줌 %d쌍: " % len(supplement) + ", ".join(
                f"{p['fromName']}→{p['toName']}({p['elementLabel']})" for p in supplement[:5]
            ))
        if conflict:
            summary_parts.append("상충 %d쌍: " % len(conflict) + ", ".join(
                f"{p['name1']}-{p['name2']}({p['elementLabel']})" for p in conflict[:5]
            ))
        summary = " ".join(summary_parts) if summary_parts else "채워줌/상충 쌍이 없습니다."
        
        return {
            "success": True,
            "supplement": supplement,
            "conflict": conflict,
            "summary": summary,
        }
    except Exception as e:
        print(f"❌ 모임 오행 조합 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
