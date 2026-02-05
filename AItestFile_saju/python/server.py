"""
GMS API 텍스트 생성 서버
Jupyter Lab GPU 서버에서 실행하여 클라이언트의 요청을 처리합니다.

사용법:
    python server.py
    
또는 Jupyter Notebook에서:
    %run server.py
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드 (상위 폴더의 .env 파일 사용)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from gms_api import call_gms_api, call_gms_api_streaming
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


# ----- 모임 오행 조합 (RAG) -----
ELEMENT_LABELS = {"목": "목(木)", "화": "화(火)", "토": "토(土)", "금": "금(金)", "수": "수(水)"}
SUPPLEMENT_THRESHOLD = 3
CONFLICT_THRESHOLD = 2


def _get_rag_explanation_meeting(query: str, top_k: int = 2) -> str:
    """모임 오행 지식베이스에서 RAG 검색 후 해석 문단 반환"""
    chunks = get_knowledge_chunks()
    if not chunks:
        return ""
    found = search_chunks(chunks, query, topK=top_k)
    if not found:
        return ""
    return found[0].content if hasattr(found[0], "content") else ""


def _compute_supplement_pairs(members: list) -> list:
    """기운 채워줌: A는 해당 오행 >= 3, B는 0"""
    pairs = []
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
                query = f"모임 오행 기운 채워줌 {elem} 기운"
                explanation = _get_rag_explanation_meeting(query)
                if not explanation or len(explanation) > 400:
                    explanation = explanation[:397] + "..." if explanation and len(explanation) > 400 else (
                        f"{name_a}님이 {name_b}님의 {ELEMENT_LABELS.get(elem, elem)} 기운을 채워 주는 관계입니다."
                    )
                pairs.append({
                    "fromName": name_a,
                    "toName": name_b,
                    "element": elem,
                    "elementLabel": ELEMENT_LABELS.get(elem, elem),
                    "explanation": explanation or f"{name_a}님이 {name_b}님의 {ELEMENT_LABELS.get(elem, elem)} 기운을 채워 줍니다.",
                })
    return pairs


def _compute_conflict_pairs(members: list) -> list:
    """상충: 둘 다 같은 오행 >= 2"""
    pairs = []
    for elem in ["목", "화", "토", "금", "수"]:
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                a, b = members[i], members[j]
                va = a.get("fiveElements", {}).get(elem, 0)
                vb = b.get("fiveElements", {}).get(elem, 0)
                if va >= CONFLICT_THRESHOLD and vb >= CONFLICT_THRESHOLD:
                    name_a = a.get("name", f"멤버{i+1}")
                    name_b = b.get("name", f"멤버{j+1}")
                    query = f"모임 오행 상충 {elem} 같은 기운"
                    explanation = _get_rag_explanation_meeting(query)
                    if explanation and len(explanation) > 400:
                        explanation = explanation[:397] + "..."
                    if not explanation:
                        explanation = f"{name_a}님과 {name_b}님은 둘 다 {ELEMENT_LABELS.get(elem, elem)} 기운이 강해 같은 기운이라 상충할 수 있습니다."
                    pairs.append({
                        "name1": name_a,
                        "name2": name_b,
                        "element": elem,
                        "elementLabel": ELEMENT_LABELS.get(elem, elem),
                        "explanation": explanation,
                    })
    return pairs


@app.route("/api/group-oheng-combination", methods=["POST", "OPTIONS"])
def group_oheng_combination():
    """
    모임 관상 결과용 오행 조합 (RAG).
    요청: { "members": [ { "name": "...", "fiveElements": { "목": n, "화": n, "토": n, "금": n, "수": n } }, ... ] }
    """
    if request.method == "OPTIONS":
        return "", 204
    try:
        data = request.json or {}
        members = data.get("members", [])
        if len(members) < 2:
            return jsonify({
                "success": True,
                "supplement": [],
                "conflict": [],
                "summary": "멤버가 2명 이상일 때만 오행 조합을 분석합니다.",
            })
        supplement = _compute_supplement_pairs(members)
        conflict = _compute_conflict_pairs(members)
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
        return jsonify({
            "success": True,
            "supplement": supplement,
            "conflict": conflict,
            "summary": summary,
        })
    except Exception as e:
        print(f"❌ 모임 오행 조합 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "supplement": [],
            "conflict": [],
            "summary": None,
        }), 500


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
# 관상 분석 + 사주 총평 통합 API
# ============================================================
from face_analysis_service import analyze_face
from saju_summary_service import (
    build_saju_summary_prompt,
    build_saju_user_prompt_for_summary,
    parse_birth_info,
    parse_total_review
)
from face_prompt_builder import (
    summarize_face_analysis_for_search,
    build_face_analysis_system_prompt,
    build_face_analysis_user_prompt,
    build_total_review_prompt,
    parse_face_analysis_response,
    parse_streaming_total_review
)


@app.route("/test-api/facemesh/personal", methods=["POST"])
def analyze_face_api():
    """
    관상 분석 + 사주 총평 통합 API
    
    관상 분석 (Rule-based)과 사주 총평 (LLM-based)을 함께 수행하여 
    한 번의 요청으로 모든 결과를 반환합니다.
    
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
        "timestamp": "...",
        "faceIndex": 1,
        "faceAnalysis": {
            "faceShape": { ... },
            "forehead": { ... },
            "eyes": { ... },
            "nose": { ... },
            "mouth": { ... },
            "chin": { ... }
        },
        "meta": {
            "headRoll": 0,
            "qualityNote": "...",
            "overallSymmetry": 0.95
        },
        "totalReview": {
            "harmony": "...",
            "comprehensive": "...",
            "improvement": "..."
        },
        "sajuInfo": {
            "yearPillar": "...",
            "monthPillar": "...",
            "dayPillar": "...",
            "hourPillar": "...",
            ...
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
        
        # ============================================================
        # 1. 관상 분석 (Rule-based)
        # ============================================================
        faces = data.get("faces", [])
        if not faces or len(faces) == 0:
            return jsonify({
                "success": False,
                "error": "faces 배열이 비어있습니다."
            }), 400
        
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
        
        # ============================================================
        # 2. 사주 계산
        # ============================================================
        saju_data = data.get("sajuData", {})
        saju_info = None
        myeongri = None
        
        if saju_data and saju_data.get("birthDate"):
            try:
                print(f"🔮 사주 계산 시작...")
                print(f"   성별: {saju_data.get('gender')}")
                print(f"   생년월일: {saju_data.get('birthDate')}")
                print(f"   시간: {saju_data.get('birthTime', '미상')}")
                
                # 1) 생년월일시 파싱
                birth_info = parse_birth_info(saju_data)
                
                # 2) 사주 계산
                saju = calculate_saju(birth_info)
                print(f"   사주: {saju['yearPillar']} {saju['monthPillar']} {saju['dayPillar']} {saju['hourPillar']}")
                
                # 3) 명리 분석
                myeongri = calculate_myeongri(saju)
                
                # 4) 사주 정보 구성
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
                
                print("✅ 사주 계산 완료")
                
            except Exception as e:
                print(f"⚠️ 사주 계산 중 오류: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("⚠️ sajuData가 없거나 birthDate가 없어 사주 계산을 건너뜁니다.")
        
        # ============================================================
        # 3. RAG 검색 + LLM으로 관상 해석 생성
        # ============================================================
        total_review = None
        
        try:
            print("🔍 RAG 검색 시작...")
            
            # 관상 분석 결과를 검색 쿼리로 변환
            search_query = summarize_face_analysis_for_search(analysis_result)
            print(f"   검색 쿼리: {search_query[:60]}...")
            
            # RAG 검색 수행
            use_redis = should_use_redis()
            rag_context = ""
            
            if use_redis:
                try:
                    relevant_chunks = search_by_vector(search_query, topK=8)
                    rag_context = format_search_context(relevant_chunks)
                    print(f"✅ Redis 벡터 검색 완료: {len(relevant_chunks)}개 문서")
                except Exception as e:
                    print(f"⚠️ Redis 검색 실패, 파일 기반 검색으로 전환: {e}")
                    chunks = get_knowledge_chunks()
                    if chunks:
                        relevant_chunks = search_chunks(chunks, search_query, topK=8)
                        rag_context = format_context(relevant_chunks)
                        print(f"✅ 파일 검색 완료: {len(relevant_chunks)}개 문서")
            else:
                chunks = get_knowledge_chunks()
                if chunks:
                    relevant_chunks = search_chunks(chunks, search_query, topK=8)
                    rag_context = format_context(relevant_chunks)
                    print(f"✅ 파일 검색 완료: {len(relevant_chunks)}개 문서")
            
            # LLM 프롬프트 생성
            print("📝 LLM 프롬프트 생성 중...")
            system_prompt = build_face_analysis_system_prompt(rag_context, saju_info)
            user_prompt = build_face_analysis_user_prompt(analysis_result, meta)
            
            # LLM 호출
            print("🤖 LLM 호출 중...")
            model = data.get("model", "gpt-5-mini")
            timeout = data.get("timeout", 300)
            
            llm_result = call_gms_api(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=model,
                timeout=timeout
            )
            
            # LLM 응답 파싱
            print("📄 LLM 응답 파싱 중...")
            parsed_result = parse_face_analysis_response(llm_result)
            
            # 각 부위별 summary 업데이트
            part_summaries = parsed_result.get("partSummaries", {})
            for part_name, summary in part_summaries.items():
                if part_name in analysis_result and summary:
                    analysis_result[part_name]["summary"] = summary
            
            # LLM summary가 없는 부위는 coreMeaning + advice로 대체
            for part_name in ["faceShape", "forehead", "eyes", "nose", "mouth", "chin"]:
                if part_name in analysis_result and "summary" not in analysis_result[part_name]:
                    core = analysis_result[part_name].get("coreMeaning", "")
                    advice = analysis_result[part_name].get("advice", "")
                    if core:
                        analysis_result[part_name]["summary"] = f"{core} {advice}".strip()
            
            # totalReview 추출
            total_review = parsed_result.get("totalReview", {})
            if not total_review or not total_review.get("comprehensive"):
                total_review = {
                    "harmony": "관상 분석 결과를 바탕으로 전체적인 조화를 분석합니다.",
                    "comprehensive": "종합적인 성격과 운세를 분석합니다.",
                    "improvement": "더 나은 삶을 위한 조언을 제공합니다."
                }
            
            print("✅ LLM 기반 관상 해석 생성 완료")
            
        except Exception as e:
            print(f"⚠️ RAG+LLM 처리 중 오류 (Rule-based 결과는 유지): {e}")
            import traceback
            traceback.print_exc()
            # 오류 시 기본 totalReview 설정
            total_review = {
                "harmony": "관상 분석 결과를 바탕으로 전체적인 조화를 분석합니다.",
                "comprehensive": "종합적인 성격과 운세를 분석합니다.",
                "improvement": "더 나은 삶을 위한 조언을 제공합니다."
            }
            # 오류 시에도 summary를 coreMeaning으로 대체
            for part_name in ["faceShape", "forehead", "eyes", "nose", "mouth", "chin"]:
                if part_name in analysis_result and "summary" not in analysis_result[part_name]:
                    core = analysis_result[part_name].get("coreMeaning", "")
                    advice = analysis_result[part_name].get("advice", "")
                    if core:
                        analysis_result[part_name]["summary"] = f"{core} {advice}".strip()
        
        # ============================================================
        # 4. 통합 응답 반환
        # ============================================================
        response = {
            "success": True,
            "timestamp": data.get("timestamp", ""),
            "faceIndex": face.get("faceIndex", 1),
            "faceAnalysis": analysis_result,
            "meta": {
                "headRoll": meta.get("headRoll", 0),
                "qualityNote": meta.get("qualityNote", ""),
                "overallSymmetry": meta.get("symmetry", 0)
            }
        }
        
        # 사주 총평이 있으면 추가
        if total_review:
            response["totalReview"] = total_review
        if saju_info:
            response["sajuInfo"] = saju_info
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ 관상 분석 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"관상 분석 오류: {str(e)}"
        }), 500


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


# ============================================================
# 🆕 관상 분석 + 사주 총평 2단계 스트리밍 API (SSE)
# ============================================================

@app.route("/test-api/facemesh/personal/stream", methods=["POST"])
def analyze_face_streaming():
    """
    관상 분석 + 사주 총평 2단계 스트리밍 API (SSE)
    
    1단계: Rule-based 관상 분석 결과를 즉시 전송 (faceAnalysis, sajuInfo, meta)
    2단계: LLM 생성 결과를 스트리밍 전송 (totalReview)
    
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
        "sajuData": {
            "gender": "male",
            "calendarType": "solar",
            "birthDate": "1995-05-15",
            "birthTime": "14:30",
            "birthTimeUnknown": false
        }
    }
    
    SSE 응답 형식:
    
    [1단계 - 즉시 전송]
    data: {"stage": 1, "type": "analysis", "data": {"success": true, "faceAnalysis": {...}, "sajuInfo": {...}, "meta": {...}}}
    
    [2단계 - LLM 스트리밍]
    data: {"stage": 2, "type": "totalReview", "field": "comprehensive", "content": "일간 병화는..."}
    data: {"stage": 2, "type": "totalReview", "field": "comprehensive", "content": "온화하고..."}
    ...
    data: {"stage": 2, "type": "complete", "data": {"totalReview": {"comprehensive": "...", "harmony": "...", "improvement": "..."}}}
    """
    
    def generate_sse_response():
        """SSE 스트리밍 응답 생성기"""
        try:
            data = request.json
            
            if not data:
                yield f"data: {json.dumps({'error': '요청 데이터가 없습니다.'}, ensure_ascii=False)}\n\n"
                return
            
            # ============================================================
            # 1단계: Rule-based 분석 (즉시 전송)
            # ============================================================
            faces = data.get("faces", [])
            if not faces or len(faces) == 0:
                yield f"data: {json.dumps({'error': 'faces 배열이 비어있습니다.'}, ensure_ascii=False)}\n\n"
                return
            
            face = faces[0]
            landmarks = face.get("landmarks", [])
            
            if not landmarks or len(landmarks) < 100:
                yield f"data: {json.dumps({'error': 'landmarks 데이터가 부족합니다.'}, ensure_ascii=False)}\n\n"
                return
            
            print(f"🔍 [스트리밍] 1단계: 관상 분석 시작 - landmarks 수: {len(landmarks)}")
            
            # 관상 분석 수행
            analysis_result = analyze_face(landmarks)
            meta = analysis_result.pop("_meta", {})
            
            # 사주 계산 (LLM 호출 없이)
            saju_data = data.get("sajuData", {})
            saju_info = None
            myeongri = None
            enhanced_saju_data = None
            
            if saju_data and saju_data.get("birthDate"):
                try:
                    birth_info = parse_birth_info(saju_data)
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
                    
                    enhanced_saju_data = {
                        **saju_data,
                        "yearPillar": saju['yearPillar'],
                        "monthPillar": saju['monthPillar'],
                        "dayPillar": saju['dayPillar'],
                        "hourPillar": saju['hourPillar'],
                        "dayStem": saju['dayStem'],
                        "fiveElements": myeongri['fiveElements']
                    }
                except Exception as e:
                    print(f"⚠️ 사주 계산 오류: {e}")
            
            # 1단계 데이터 전송 (Rule-based 분석 + 사주정보)
            stage1_response = {
                "stage": 1,
                "type": "analysis",
                "data": {
                    "success": True,
                    "timestamp": data.get("timestamp", ""),
                    "faceIndex": face.get("faceIndex", 1),
                    "faceAnalysis": analysis_result,
                    "meta": {
                        "headRoll": meta.get("headRoll", 0),
                        "qualityNote": meta.get("qualityNote", ""),
                        "overallSymmetry": meta.get("symmetry", 0)
                    }
                }
            }
            
            if saju_info:
                stage1_response["data"]["sajuInfo"] = saju_info
            
            print(f"✅ [스트리밍] 1단계 전송: faceAnalysis + sajuInfo")
            yield f"data: {json.dumps(stage1_response, ensure_ascii=False)}\n\n"
            
            # ============================================================
            # 2단계: RAG 검색 + LLM 스트리밍 (totalReview 생성)
            # ============================================================
            try:
                print(f"🔍 [스트리밍] 2단계: RAG 검색 시작...")
                
                # 관상 분석 결과를 검색 쿼리로 변환
                search_query = summarize_face_analysis_for_search(analysis_result)
                
                # RAG 검색 수행
                use_redis = should_use_redis()
                rag_context = ""
                
                if use_redis:
                    try:
                        relevant_chunks = search_by_vector(search_query, topK=8)
                        rag_context = format_search_context(relevant_chunks)
                        print(f"   Redis 검색 완료: {len(relevant_chunks)}개 문서")
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
                
                # totalReview 생성 프롬프트 (스트리밍용)
                print(f"🔮 [스트리밍] LLM 호출 시작...")
                system_prompt, user_prompt = build_total_review_prompt(
                    analysis_result, 
                    saju_info, 
                    rag_context
                )
                
                model = data.get("model", "gpt-5-mini")
                timeout = data.get("timeout", 300)
                
                # LLM 스트리밍 호출
                full_response = ""
                current_field = "comprehensive"  # 현재 파싱 중인 필드
                
                try:
                    # 스트리밍 모드로 LLM 호출
                    for chunk in call_gms_api_streaming(
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        model=model,
                        timeout=timeout
                    ):
                        full_response += chunk
                        
                        # 청크 단위로 클라이언트에 전송
                        chunk_response = {
                            "stage": 2,
                            "type": "totalReview",
                            "field": current_field,
                            "content": chunk
                        }
                        yield f"data: {json.dumps(chunk_response, ensure_ascii=False)}\n\n"
                        
                        # 필드 경계 감지 ([조화], [종합], [조언] 섹션)
                        if "[조화]" in full_response and current_field == "comprehensive":
                            current_field = "harmony"
                        elif "[종합]" in full_response and current_field == "harmony":
                            current_field = "comprehensive"
                        elif "[조언]" in full_response:
                            current_field = "improvement"
                
                except Exception as streaming_error:
                    print(f"⚠️ 스트리밍 모드 실패, 일반 모드로 재시도: {streaming_error}")
                    
                    # 스트리밍 실패 시 일반 모드로 폴백
                    full_response = call_gms_api(
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        model=model,
                        timeout=timeout
                    )
                    
                    # 전체 응답을 한 번에 전송
                    chunk_response = {
                        "stage": 2,
                        "type": "totalReview",
                        "field": "all",
                        "content": full_response
                    }
                    yield f"data: {json.dumps(chunk_response, ensure_ascii=False)}\n\n"
                
                # LLM 응답 파싱 (섹션 기반)
                print("   [스트리밍] 응답 파싱 중...")
                total_review = parse_streaming_total_review(full_response)
                
                # 완료 이벤트 전송
                complete_response = {
                    "stage": 2,
                    "type": "complete",
                    "data": {
                        "totalReview": total_review
                    }
                }
                print(f"✅ [스트리밍] 2단계 완료: totalReview 전송")
                yield f"data: {json.dumps(complete_response, ensure_ascii=False)}\n\n"
                
            except Exception as e:
                print(f"⚠️ [스트리밍] RAG+LLM 오류: {e}")
                import traceback
                traceback.print_exc()
                
                error_response = {
                    "stage": 2,
                    "type": "error",
                    "error": f"RAG+LLM 오류: {str(e)}"
                }
                yield f"data: {json.dumps(error_response, ensure_ascii=False)}\n\n"
            
            # 종료 이벤트
            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            print(f"❌ [스트리밍] 전체 오류: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
    
    return Response(
        generate_sse_response(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',  # nginx 버퍼링 비활성화
            'Access-Control-Allow-Origin': '*'
        }
    )


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
    print(f"   관상+사주 통합 분석: http://{host}:{port}/test-api/facemesh/personal")
    print(f"   🆕 관상+사주 스트리밍: http://{host}:{port}/test-api/facemesh/personal/stream")
    print(f"   사주 총평 (단독): http://{host}:{port}/api/saju/summary")
    print(f"   모임 오행 조합 (RAG): http://{host}:{port}/api/group-oheng-combination")
    print(f"\n⚠️  서버를 중지하려면 Ctrl+C를 누르세요.\n")
    
    app.run(host=host, port=port, debug=debug)
