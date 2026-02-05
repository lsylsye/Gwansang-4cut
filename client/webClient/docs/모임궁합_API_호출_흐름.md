# 모임 관상 – 모임궁합 / 1:1궁합 API 호출 시점

## 1. 언제 호출되는가

**한 번만 호출됩니다.**  
사용자가 **모임 관상 분석을 시작할 때** (촬영·멤버 입력 후 "분석 시작" 등으로 `handleStartAnalysis`가 실행될 때) 한 번만 호출됩니다.

- **모임궁합(전체 궁합)**: `analyzeGroupOverall(payload)`
- **1:1궁합**: `analyzeGroupPairs(payload)`

결과 페이지로 이동한 뒤, 탭을 바꾼다거나 다시 들어온다고 해서 **추가로 이 API들은 호출되지 않습니다.**

---

## 2. 어디서 호출되는가

| 구분 | 파일 | 위치 |
|------|------|------|
| 진입점 | `src/app/App.tsx` | `handleStartAnalysis()` 내부 (그룹 모드 분기) |
| 전체 궁합 API | `src/shared/api/faceAnalysisApi.ts` | `analyzeGroupOverall()` → `FACEMESH_GROUP_OVERALL` (POST) |
| 1:1 궁합 API | `src/shared/api/faceAnalysisApi.ts` | `analyzeGroupPairs()` → `FACEMESH_GROUP_PAIRS` (POST) |

엔드포인트 (기본값):

- 모임궁합: `{VITE_AI_SERVER_URL}/facemesh/group/overall`
- 1:1궁합: `{VITE_AI_SERVER_URL}/facemesh/group/pairs`

---

## 3. 호출 순서 (현재 동작)

**두 API는 동시에 요청됩니다.** (순차가 아님)

```text
분석 시작 클릭
    → GROUP_ANALYZING 페이지로 이동
    → payload 생성 (metadata, groupMembers 등)
    → overallPromise = analyzeGroupOverall(payload)   ← 1번째 요청 (즉시)
    → pairsPromise  = analyzeGroupPairs(payload)      ← 2번째 요청 (즉시)
    → pairsPromise.then(...)  // pairs 오면 state에만 반영
    → await overallPromise    // 전체 궁합만 기다림
    → overall 성공 시 setGroupAnalysisResult(overall 병합), 결과 페이지로 이동
```

- **모임궁합(overall)**: `await` 하므로, 이게 끝나야 결과 페이지로 이동합니다.
- **1:1궁합(pairs)**: `await` 하지 않고 `.then()`으로만 처리합니다.  
  → 전체 궁합이 먼저 끝나면 그때 결과 페이지로 이동하고, pairs는 나중에 도착하면 그때 state에만 반영됩니다.

즉, **프론트에서는 LLM 호출을 “동시에 2번” 보내는 구조**입니다 (overall 1번 + pairs 1번을 같은 시점에 요청).

---

## 4. “모임궁합이 생성되면 1:1궁합 API를 요청해서 한참 걸린다”는 경우

프론트 기준으로는:

- 모임궁합 API와 1:1궁합 API는 **동시에** 나가고,
- 결과 페이지 전환은 **모임궁합(overall) 응답만** 기다립니다.

그래도 전체가 오래 걸린다면 아래를 확인하는 것이 좋습니다.

1. **백엔드가 두 API를 순차 처리하는지**  
   - 예: `/overall` 처리 후에만 `/pairs`를 받아서 처리하거나, 한 엔드포인트 안에서 overall LLM 호출 → 그 다음 pairs LLM 호출 순서로 처리하는지.
   - 이렇게 되면 “모임궁합이 생성된 뒤 1:1궁합 API를 타는” 것처럼 느껴질 수 있습니다.
   - **권장**: 두 API를 완전히 분리하고, 프론트에서 지금처럼 **동시에** 호출하면, 백엔드에서도 LLM 호출 2개가 동시에 돌아가도록 구성하는 것이 좋습니다.

2. **실제로 한 엔드포인트에서 overall + pairs를 같이 처리하는지**  
   - 그렇다면 그 한 API 내부에서 LLM을 2번 순차 호출하고 있을 수 있으므로,  
     - 하나의 API에서 overall / pairs를 **동시에** (병렬로) LLM 호출하거나,  
     - 아예 **overall 전용 API**와 **pairs 전용 API**로 나누고, 프론트는 지금처럼 두 API를 동시에 호출하는 방식으로 바꾸면 됩니다.

3. **네트워크/타임아웃**  
   - 두 요청이 동시에 나가도, 각각 LLM 응답이 느리면 전체 대기 시간이 길어질 수 있습니다.  
   - 필요하면 “전체 궁합만 먼저 보여 주고, 1:1 궁합은 나중에 로딩”하는 식으로 UX를 나누는 것도 방법입니다 (이미 overall만 await 하고 있어서, 백엔드만 병렬로 처리하면 결과 화면은 overall 기준으로 빨리 뜨고, pairs는 조금 뒤 채워질 수 있습니다).

---

## 5. 요약

| 항목 | 내용 |
|------|------|
| **호출 시점** | 모임 관상 “분석 시작” 시 **단 한 번** (결과 페이지·탭 전환 시에는 미호출) |
| **호출 위치** | `App.tsx` → `handleStartAnalysis()` (그룹 모드) |
| **호출 방식** | 모임궁합 API와 1:1궁합 API **동시 요청** (병렬) |
| **화면 전환** | **모임궁합(overall) 응답만** 기다린 뒤 결과 페이지로 이동, 1:1 궁합은 도착 시점에 state만 반영 |

시간이 오래 걸린다면, **백엔드에서 두 API(또는 두 LLM 호출)가 실제로 병렬로 처리되는지** 확인하는 것이 좋습니다.

---

## 6. 백엔드 권장 방식 (적용됨)

- **AItestFile_saju/python/server_fastapi.py**
  - `/api/face/facemesh/group/overall`: `call_gms_api` → **`await call_gms_api_async`** 로 변경. 동기 호출이 이벤트 루프를 막지 않아, `/overall`과 `/pairs`가 동시에 들어와도 **두 LLM 호출이 병렬로** 처리됨.
  - `/api/face/facemesh/group/pairs`: 동일하게 **`await call_gms_api_async`** 사용.
  - `/api/face/facemesh/group` (통합): overall·pairs LLM 호출을 **`asyncio.gather`** 로 한 번에 병렬 호출하도록 변경.
- 프론트는 계속 **overall / pairs 를 동시에** 요청하므로, 백엔드에서 두 요청이 각각 비동기 LLM 호출을 하면 **총 대기 시간 ≈ max(overall 시간, pairs 시간)** 이 됨.
