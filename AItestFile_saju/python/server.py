"""
GMS API 텍스트 생성 서버
Jupyter Lab GPU 서버에서 실행하여 클라이언트의 요청을 처리합니다.

사용법:
    python server.py
    
또는 Jupyter Notebook에서:
    %run server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드 (상위 폴더의 .env 파일 사용)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

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

app = Flask(__name__)
CORS(app)  # CORS 허용 (클라이언트에서 접근 가능하도록)

# 환경변수 확인
if not os.getenv("GMS_KEY"):
    print("⚠️ 경고: GMS_KEY 환경변수가 설정되지 않았습니다.")
    print("   서버 시작 전에 설정하세요: os.environ['GMS_KEY'] = 'your-api-key'")

# RAG 지식베이스 경로 설정
# server.py가 있는 디렉토리의 상위 디렉토리에서 knowledge 폴더 찾기
SCRIPT_DIR = Path(__file__).parent
KNOWLEDGE_BASE_PATH = SCRIPT_DIR.parent / "knowledge"

# 지식베이스 캐시 (서버 시작 시 한 번만 로드)
_knowledge_chunks_cache = None
_use_redis = None


def get_knowledge_chunks():
    """지식베이스 청크를 로드하고 캐시 (싱글톤 패턴)"""
    global _knowledge_chunks_cache
    if _knowledge_chunks_cache is None:
        print(f"📚 지식베이스 로드 중: {KNOWLEDGE_BASE_PATH}")
        _knowledge_chunks_cache = load_knowledge_base(str(KNOWLEDGE_BASE_PATH))
        if not _knowledge_chunks_cache:
            print("⚠️ 경고: 지식베이스가 비어있습니다. RAG 검색이 제대로 작동하지 않을 수 있습니다.")
    return _knowledge_chunks_cache


def should_use_redis() -> bool:
    """
    Redis 사용 여부 확인
    
    Returns:
        bool: Redis 사용 가능 여부
    """
    global _use_redis
    
    if _use_redis is not None:
        return _use_redis
    
    # 환경변수로 Redis 사용 여부 확인
    use_redis_env = os.getenv("USE_REDIS_RAG", "false").lower() == "true"
    
    if not use_redis_env:
        _use_redis = False
        return False
    
    try:
        # Redis 연결 및 RedisSearch 확인
        check_redis_search()
        
        # 인덱스 존재 여부 확인
        from redis_client import index_exists, SAJU_INDEX_NAME
        if not index_exists(SAJU_INDEX_NAME):
            print("⚠️ Redis 인덱스가 없습니다. 파일 기반 검색으로 전환합니다.")
            print("   인덱싱을 실행하세요: npx ts-node src/indexer.ts index")
            _use_redis = False
            return False
        
        doc_count = get_indexed_doc_count()
        if doc_count == 0:
            print("⚠️ 인덱싱된 문서가 없습니다. 파일 기반 검색으로 전환합니다.")
            _use_redis = False
            return False
        
        print(f"✅ Redis 벡터 검색 사용 가능 (인덱싱된 문서: {doc_count}개)")
        _use_redis = True
        return True
    except Exception as e:
        print(f"⚠️ Redis 사용 불가: {e}")
        print("   파일 기반 검색으로 전환합니다.")
        _use_redis = False
        return False


@app.route("/health", methods=["GET"])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        "status": "ok",
        "message": "GMS API 서버가 정상적으로 실행 중입니다.",
        "gms_key_set": bool(os.getenv("GMS_KEY"))
    })


@app.route("/api/generate", methods=["POST"])
def generate_text():
    """
    텍스트 생성 API
    
    요청 형식:
    {
        "system_prompt": "...",
        "user_prompt": "...",
        "model": "gpt-5-mini",  # 선택사항
        "timeout": 300  # 선택사항
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "요청 데이터가 없습니다."}), 400
        
        system_prompt = data.get("system_prompt")
        user_prompt = data.get("user_prompt")
        
        if not system_prompt or not user_prompt:
            return jsonify({
                "error": "system_prompt와 user_prompt가 필요합니다."
            }), 400
        
        model = data.get("model", "gpt-5-mini")
        timeout = data.get("timeout", 300)
        
        # GMS API 호출
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            timeout=timeout
        )
        
        return jsonify({
            "success": True,
            "result": result
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"서버 오류: {str(e)}"
        }), 500


@app.route("/api/saju/analyze", methods=["POST"])
def analyze_saju():
    """
    사주 분석 API (생년월일시만 받아서 모든 계산 수행)
    
    요청 형식:
    {
        "year": 1999,
        "month": 10,
        "day": 28,
        "hour": 11,
        "minute": 46,        # 선택사항
        "gender": "남" | "여",
        "calendar": "양력" | "음력",  # 기본: "양력"
        "isLeapMonth": false,  # 선택사항
        "query": "...",       # 추가 질문 (선택사항)
        "useRedis": true      # Redis 사용 여부 (선택사항, 기본: 환경변수 따름)
    }
    """
    try:
        data = request.json
        
        # 디버깅: 받은 데이터 출력
        print(f"📥 받은 요청 데이터: {data}")
        
        if not data:
            return jsonify({"error": "요청 데이터가 없습니다."}), 400
        
        # 필수 필드 확인
        required_fields = ["year", "month", "day", "hour", "gender"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"필수 필드가 없습니다: {field}"
                }), 400
        
        print("🔮 사주 분석 시작...")
        print(f"   생년월일시: {data['year']}-{data['month']:02d}-{data['day']:02d} {data['hour']:02d}:{data.get('minute', 0):02d}")
        print(f"   성별: {data['gender']}, 달력: {data.get('calendar', '양력')}")
        
        # 생년월일시 정보 구성
        birth_info = {
            'year': data['year'],
            'month': data['month'],
            'day': data['day'],
            'hour': data['hour'],
            'minute': data.get('minute', 0),
            'gender': data['gender'],
            'calendar': data.get('calendar', '양력'),
            'isLeapMonth': data.get('isLeapMonth', False)
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
            # 검색 쿼리 생성
            day_stem = saju['dayStem']
            keywords = myeongri['keywords']
            
            # 일간 오행 추출
            five_elements = myeongri['fiveElements']
            day_element = "목"
            if five_elements:
                max_element = max(five_elements.items(), key=lambda x: x[1])
                if max_element[1] > 0:
                    day_element = max_element[0]
            
            # 검색 쿼리 생성
            search_query = summarize_saju_for_search(day_stem, day_element, keywords)
            print(f"      검색 쿼리: {search_query[:60]}...")
            
            # Redis 사용 여부 확인
            use_redis = data.get('useRedis')
            if use_redis is None:
                use_redis = should_use_redis()
            elif use_redis:
                # 명시적으로 Redis 사용 요청한 경우만 확인
                use_redis = should_use_redis()
            
            if use_redis:
                # Redis 벡터 검색
                print("      Redis 벡터 검색 모드")
                try:
                    relevant_chunks = search_by_vector(search_query, topK=8)
                    context = format_search_context(relevant_chunks)
                    print(f"      ✅ {len(relevant_chunks)}개의 관련 문서 찾음 (벡터 검색)")
                except Exception as e:
                    print(f"      ⚠️ Redis 검색 실패, 파일 기반 검색으로 전환: {e}")
                    # 폴백: 파일 기반 검색
                    chunks = get_knowledge_chunks()
                    if chunks:
                        relevant_chunks = search_chunks(chunks, search_query, topK=8)
                        context = format_context(relevant_chunks)
                        print(f"      ✅ {len(relevant_chunks)}개의 관련 문서 찾음 (파일 검색)")
                    else:
                        context = "[컨텍스트 없음 - 지식베이스가 비어있습니다]"
            else:
                # 파일 기반 검색
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
                'twelveFortune': myeongri['twelveFortune'],
                'ganjiRelations': {
                    'ganCombinations': [
                        {
                            'stem1': c['gan1'],
                            'stem2': c['gan2'],
                            'resultElement': c['result'],
                            'description': f"{c['gan1']}{c['gan2']} 합 → {c['result']}"
                        }
                        for c in myeongri['ganjiRelations']['ganCombinations']
                    ],
                    'branchRelations': [
                        {
                            'type': r['type'],
                            'branch1': r['branch1'],
                            'branch2': r['branch2'],
                            'description': r['description']
                        }
                        for r in myeongri['ganjiRelations']['branchRelations']
                    ]
                },
                'keywords': myeongri['keywords']
            },
            birth_info=birth_info,
            additional_query=data.get('query')
        )
        
        # 6. GMS API 호출
        print("   5단계: LLM 호출 중...")
        model = data.get("model", "gpt-5-mini")
        timeout = data.get("timeout", 300)
        
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            timeout=timeout
        )
        
        print("✅ 사주 분석 완료")
        
        return jsonify({
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
                'twelveFortune': myeongri['twelveFortune'],
                'ganjiRelations': {
                    'ganCombinations': [
                        {
                            'stem1': c['gan1'],
                            'stem2': c['gan2'],
                            'resultElement': c['result'],
                            'description': f"{c['gan1']}{c['gan2']} 합 → {c['result']}"
                        }
                        for c in myeongri['ganjiRelations']['ganCombinations']
                    ],
                    'branchRelations': [
                        {
                            'type': r['type'],
                            'branch1': r['branch1'],
                            'branch2': r['branch2'],
                            'description': r['description']
                        }
                        for r in myeongri['ganjiRelations']['branchRelations']
                    ]
                },
                'keywords': myeongri['keywords']
            }
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        print(f"❌ 사주 분석 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"서버 오류: {str(e)}"
        }), 500


@app.route("/api/saju/generate", methods=["POST"])
def generate_saju():
    """
    사주 분석 텍스트 생성 API
    
    요청 형식:
    {
        "saju_data": {...},      # 사주 4주 데이터
        "myeongri_data": {...},  # 명리 관계 데이터
        "context": "...",        # RAG 검색 결과 컨텍스트 (선택사항, 비어있으면 자동 검색)
        "birth_info": {...},     # 생년월일시 정보
        "query": "..."           # 추가 질문 (선택사항)
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "요청 데이터가 없습니다."}), 400
        
        # 필수 필드 확인
        required_fields = ["saju_data", "myeongri_data", "birth_info"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"필수 필드가 없습니다: {field}"
                }), 400
        
        # 데이터 추출
        saju_data = data.get("saju_data") or {}
        myeongri_data = data.get("myeongri_data") or {}
        birth_info = data.get("birth_info") or {}
        context = data.get("context") or ""
        additional_query = data.get("query")
        
        # RAG 검색 수행 (context가 비어있으면 자동으로 검색)
        if not context or context.strip() == "":
            try:
                print("🔍 RAG 검색 수행 중...")
                
                # 검색 쿼리 생성
                dayStem = saju_data.get("dayStem", "")
                keywords = myeongri_data.get("keywords", [])
                
                # 일간 오행 추출
                fiveElements = myeongri_data.get("fiveElements", {})
                dayElement = "목"
                if fiveElements:
                    # 가장 많은 오행 찾기
                    maxElement = max(fiveElements.items(), key=lambda x: x[1])
                    if maxElement[1] > 0:
                        dayElement = maxElement[0]
                
                # 검색 쿼리 생성
                searchQuery = summarize_saju_for_search(dayStem, dayElement, keywords)
                print(f"   검색 쿼리: {searchQuery[:60]}...")
                
                # Redis 사용 여부 확인 및 검색 수행
                use_redis = should_use_redis()
                
                if use_redis:
                    # Redis 벡터 검색
                    print("   Redis 벡터 검색 모드")
                    try:
                        relevantChunks = search_by_vector(searchQuery, topK=8)
                        context = format_search_context(relevantChunks)
                        print(f"✅ {len(relevantChunks)}개의 관련 문서 찾음 (벡터 검색)")
                    except Exception as e:
                        print(f"⚠️ Redis 검색 실패, 파일 기반 검색으로 전환: {e}")
                        # 폴백: 파일 기반 검색
                        chunks = get_knowledge_chunks()
                        if chunks:
                            relevantChunks = search_chunks(chunks, searchQuery, topK=8)
                            context = format_context(relevantChunks)
                            print(f"✅ {len(relevantChunks)}개의 관련 문서 찾음 (파일 검색)")
                        else:
                            context = "[컨텍스트 없음 - 지식베이스가 비어있습니다]"
                else:
                    # 파일 기반 검색
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
        model = data.get("model", "gpt-5-mini")
        timeout = data.get("timeout", 300)
        
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            timeout=timeout
        )
        
        return jsonify({
            "success": True,
            "result": result
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"서버 오류: {str(e)}"
        }), 500


# ============================================================
# 관상 분석 API (Rule-based) - LLM 사용 안 함
# ============================================================
from face_analysis_service import analyze_face


@app.route("/test-api/facemesh/personal", methods=["POST"])
def analyze_face_api():
    """
    관상 분석 데이터 생성 API (Rule-based)
    
    LLM을 사용하지 않고 순수 알고리즘으로 관상 분석 데이터를 생성합니다.
    rules.md에 정의된 수식을 사용하여 각 부위별 측정값과 해석을 계산합니다.
    
    요청 형식:
    {
        "timestamp": "2026-01-27T14:40:25.123",
        "faces": [
            {
                "faceIndex": 1,
                "duration": 3500,
                "landmarks": [
                    { "index": 1, "x": 0.52, "y": 0.48, "z": -0.02 },
                    ...
                ]
            }
        ],
        "sajuData": { ... }  // 사주 데이터 (이 API에서는 사용하지 않음)
    }
    
    응답 형식:
    {
        "success": true,
        "timestamp": "...",
        "faceAnalysis": {
            "faceShape": { ... },
            "forehead": { ... },
            "eyes": { ... },
            "nose": { ... },
            "mouth": { ... },
            "chin": { ... }
        }
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "error": "요청 데이터가 없습니다."
            }), 400
        
        # faces 배열 확인
        faces = data.get("faces", [])
        if not faces or len(faces) == 0:
            return jsonify({
                "success": False,
                "error": "faces 배열이 비어있습니다."
            }), 400
        
        # 첫 번째 얼굴 분석 (향후 다중 얼굴 지원 가능)
        face = faces[0]
        landmarks = face.get("landmarks", [])
        
        if not landmarks or len(landmarks) < 100:
            return jsonify({
                "success": False,
                "error": "landmarks 데이터가 부족합니다. MediaPipe 468 랜드마크가 필요합니다."
            }), 400
        
        print(f"🔍 관상 분석 시작 - landmarks 수: {len(landmarks)}")
        
        # 관상 분석 수행
        analysis_result = analyze_face(landmarks)
        
        # _meta 필드 분리
        meta = analysis_result.pop("_meta", {})
        
        print(f"✅ 관상 분석 완료 - 품질: {meta.get('qualityNote', 'N/A')}")
        
        return jsonify({
            "success": True,
            "timestamp": data.get("timestamp", ""),
            "faceIndex": face.get("faceIndex", 1),
            "faceAnalysis": analysis_result,
            "meta": {
                "headRoll": meta.get("headRoll", 0),
                "qualityNote": meta.get("qualityNote", ""),
                "overallSymmetry": meta.get("symmetry", 0)
            }
        })
        
    except Exception as e:
        print(f"❌ 관상 분석 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"관상 분석 오류: {str(e)}"
        }), 500


# ============================================================
# 사주 총평 생성 API (LLM-based)
# ============================================================
from saju_summary_service import (
    build_saju_summary_prompt,
    build_saju_user_prompt_for_summary,
    parse_birth_info,
    parse_total_review
)


@app.route("/api/saju/summary", methods=["POST"])
def generate_saju_summary():
    """
    사주 총평 생성 API (LLM-based)
    
    LLM을 호출하여 사주 데이터 기반 종합 총평을 생성합니다.
    
    요청 형식:
    {
        "timestamp": "2026-01-27T14:40:25.123",
        "faces": [ ... ],  // 관상 데이터 (이 API에서는 사용하지 않음)
        "sajuData": {
            "gender": "male",
            "calendarType": "solar",
            "birthDate": "1995-05-15",
            "birthTime": "14:30",
            "birthTimeUnknown": false
        }
    }
    
    응답 형식:
    {
        "success": true,
        "summary": "LLM이 생성한 사주 총평 텍스트",
        "sajuInfo": {
            "yearPillar": "...",
            "monthPillar": "...",
            "dayPillar": "...",
            "hourPillar": "..."
        }
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "error": "요청 데이터가 없습니다."
            }), 400
        
        # sajuData 확인
        saju_data = data.get("sajuData", {})
        if not saju_data:
            return jsonify({
                "success": False,
                "error": "sajuData가 없습니다."
            }), 400
        
        # 필수 필드 확인
        required_fields = ["gender", "birthDate"]
        for field in required_fields:
            if field not in saju_data:
                return jsonify({
                    "success": False,
                    "error": f"sajuData에 필수 필드가 없습니다: {field}"
                }), 400
        
        print(f"🔮 사주 총평 생성 시작...")
        print(f"   성별: {saju_data.get('gender')}")
        print(f"   생년월일: {saju_data.get('birthDate')}")
        print(f"   시간: {saju_data.get('birthTime', '미상')}")
        
        # 1. 생년월일시 파싱
        birth_info = parse_birth_info(saju_data)
        
        # 2. 사주 계산
        print("   1단계: 사주 계산 중...")
        saju = calculate_saju(birth_info)
        print(f"      연주: {saju['yearPillar']}, 월주: {saju['monthPillar']}, 일주: {saju['dayPillar']}, 시주: {saju['hourPillar']}")
        
        # 3. 명리 분석
        print("   2단계: 명리 분석 중...")
        myeongri = calculate_myeongri(saju)
        
        # 4. 총평용 사주 데이터 구성
        enhanced_saju_data = {
            **saju_data,
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
        model = data.get("model", "gpt-5-mini")
        timeout = data.get("timeout", 300)
        
        result = call_gms_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            timeout=timeout
        )
        
        # 7. LLM 응답 파싱하여 totalReview 구조로 변환
        print("   5단계: 응답 파싱 중...")
        total_review = parse_total_review(result)
        
        print("✅ 사주 총평 생성 완료")
        
        return jsonify({
            "success": True,
            "timestamp": data.get("timestamp", ""),
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
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        print(f"❌ 사주 총평 생성 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"서버 오류: {str(e)}"
        }), 500


if __name__ == "__main__":
    # 서버 설정
    host = os.getenv("SERVER_HOST", "0.0.0.0")  # 모든 인터페이스에서 접근 가능
    port = int(os.getenv("SERVER_PORT", "8000"))  # 클라이언트와 포트 통일
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"🚀 GMS API 서버 시작 중...")
    print(f"   호스트: {host}")
    print(f"   포트: {port}")
    print(f"   디버그 모드: {debug}")
    print(f"   GMS_KEY 설정: {'✅' if os.getenv('GMS_KEY') else '❌'}")
    print(f"   지식베이스 경로: {KNOWLEDGE_BASE_PATH}")
    print(f"   지식베이스 존재: {'✅' if KNOWLEDGE_BASE_PATH.exists() else '❌'}")
    
    # 지식베이스 사전 로드 (서버 시작 시)
    try:
        chunks = get_knowledge_chunks()
        print(f"   로드된 청크 수: {len(chunks)}개")
    except Exception as e:
        print(f"   ⚠️ 지식베이스 로드 실패: {e}")
    
    # Redis 사용 여부 확인
    print(f"\n📡 Redis 설정:")
    use_redis_env = os.getenv("USE_REDIS_RAG", "false").lower() == "true"
    print(f"   USE_REDIS_RAG: {use_redis_env}")
    if use_redis_env:
        try:
            use_redis = should_use_redis()
            if use_redis:
                doc_count = get_indexed_doc_count()
                print(f"   Redis 벡터 검색: ✅ 활성화 (인덱싱된 문서: {doc_count}개)")
            else:
                print(f"   Redis 벡터 검색: ❌ 비활성화 (파일 기반 검색 사용)")
        except Exception as e:
            print(f"   Redis 확인 실패: {e}")
    else:
        print(f"   Redis 벡터 검색: ❌ 비활성화 (파일 기반 검색 사용)")
    
    print(f"\n📡 서버 URL: http://{host}:{port}")
    print(f"   Health check: http://{host}:{port}/health")
    print(f"   텍스트 생성: http://{host}:{port}/api/generate")
    print(f"   사주 분석 (간단): http://{host}:{port}/api/saju/analyze")
    print(f"   사주 분석 (상세): http://{host}:{port}/api/saju/generate")
    print(f"   관상 분석 (Rule-based): http://{host}:{port}/test-api/facemesh/personal")
    print(f"   사주 총평 (LLM-based): http://{host}:{port}/api/saju/summary")
    print(f"\n⚠️  서버를 중지하려면 Ctrl+C를 누르세요.\n")
    
    app.run(host=host, port=port, debug=debug)
