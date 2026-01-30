# 빠른 시작 가이드

Jupyter Lab GPU 서버에서 GMS API를 사용하여 텍스트를 생성하는 빠른 가이드입니다.

## 🚀 5분 안에 시작하기

### 1단계: 파일 준비

Jupyter Lab GPU 서버에 다음 파일들을 업로드하세요:
- `python/gms_api.py`
- `python/example_notebook.ipynb` (선택사항)

### 2단계: 패키지 설치

Jupyter Notebook에서 실행:

```python
!pip install requests
```

또는 터미널에서:

```bash
pip install requests
```

### 3단계: API 키 설정

Jupyter Notebook에서 실행:

```python
import os
os.environ['GMS_KEY'] = '여기에-실제-API-키-입력'
```

### 4단계: 사용하기

```python
from gms_api import call_gms_api

system_prompt = "당신은 친절한 AI 어시스턴트입니다."
user_prompt = "안녕하세요!"

result = call_gms_api(system_prompt, user_prompt)
print(result)
```

## 📝 TypeScript 코드와 함께 사용하기

### 방법 A: JSON 파일로 연동 (가장 간단)

**1. TypeScript 코드 수정 (한 번만)**

`src/main.ts` 또는 `src/saju_main.ts`에서 프롬프트 생성 후:

```typescript
// 프롬프트 생성
const systemPrompt = buildSystemPrompt(context);
const userPrompt = buildUserPrompt(metricsText, args.query);

// JSON 파일로 저장
import * as fs from 'fs';
const prompts = { systemPrompt, userPrompt };
fs.writeFileSync('prompts.json', JSON.stringify(prompts, null, 2), 'utf-8');
console.log('✅ 프롬프트가 prompts.json에 저장되었습니다.');
```

**2. Jupyter Notebook에서 사용**

```python
import json
from gms_api import call_gms_api

# 프롬프트 읽기
with open('../prompts.json', 'r', encoding='utf-8') as f:
    prompts = json.load(f)

# 텍스트 생성
result = call_gms_api(prompts['systemPrompt'], prompts['userPrompt'])
print(result)
```

### 방법 B: TypeScript에서 자동 호출

**1. 환경변수 설정**

```bash
# Windows
set USE_PYTHON_GMS=true
set GMS_KEY=your-api-key

# Linux/Mac
export USE_PYTHON_GMS=true
export GMS_KEY=your-api-key
```

**2. 기존 코드 그대로 실행**

```bash
node dist/main.js --file ./landmarks.json --query '성격 분석'
```

자동으로 Python 스크립트를 사용합니다!

## ⚙️ 고급 옵션

### 타임아웃 설정

```python
result = call_gms_api(
    system_prompt,
    user_prompt,
    model="gpt-5-mini",
    timeout=600  # 10분
)
```

### 배치 처리

```python
prompts_list = [
    ("시스템 프롬프트 1", "사용자 프롬프트 1"),
    ("시스템 프롬프트 2", "사용자 프롬프트 2"),
]

results = []
for sys_prompt, usr_prompt in prompts_list:
    result = call_gms_api(sys_prompt, usr_prompt)
    results.append(result)
```

## 🔧 문제 해결

### "모듈을 찾을 수 없습니다"

```python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath('')))
```

### "API 키가 없습니다"

```python
import os
print(os.getenv('GMS_KEY'))  # None이면 설정되지 않은 것
os.environ['GMS_KEY'] = 'your-api-key'  # 다시 설정
```

### "타임아웃 오류"

```python
# 타임아웃을 늘려보세요
result = call_gms_api(system_prompt, user_prompt, timeout=600)
```

## 📚 더 알아보기

- `README.md`: 상세한 사용법
- `INTEGRATION_GUIDE.md`: TypeScript와의 통합 방법
- `example_notebook.ipynb`: 다양한 예제
