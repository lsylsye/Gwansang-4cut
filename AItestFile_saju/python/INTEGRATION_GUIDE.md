# TypeScript와 Python 통합 가이드

이 가이드는 TypeScript 코드에서 Jupyter Lab GPU 서버의 Python 환경을 사용하여 텍스트 생성을 수행하는 방법을 설명합니다.

## 방법 1: Jupyter Notebook에서 직접 사용 (권장)

가장 간단하고 권장되는 방법입니다. Jupyter Lab GPU 서버에서 직접 Python 코드를 실행합니다.

### 단계

1. **Jupyter Lab GPU 서버에 접속**

2. **필요한 파일 업로드**
   - `python/gms_api.py` → Jupyter 서버의 작업 디렉토리
   - `python/example_notebook.ipynb` → Jupyter 서버에서 열기

3. **패키지 설치**
   ```python
   !pip install requests
   ```

4. **API 키 설정**
   ```python
   import os
   os.environ['GMS_KEY'] = 'your-api-key-here'
   ```

5. **사용**
   ```python
   from gms_api import call_gms_api
   
   result = call_gms_api(system_prompt, user_prompt)
   print(result)
   ```

### TypeScript 코드와 연동

TypeScript 코드에서 생성한 프롬프트를 JSON 파일로 저장하고, Python에서 읽어서 사용:

**TypeScript (수정 예시):**
```typescript
// src/main.ts 또는 src/saju_main.ts에서
import * as fs from 'fs';

// 프롬프트 생성 후
const systemPrompt = buildSystemPrompt(context);
const userPrompt = buildUserPrompt(metricsText, args.query);

// JSON 파일로 저장
const prompts = { systemPrompt, userPrompt };
fs.writeFileSync(
  'prompts.json',
  JSON.stringify(prompts, null, 2),
  'utf-8'
);

console.log('✅ 프롬프트가 prompts.json에 저장되었습니다.');
console.log('   Jupyter Notebook에서 이 파일을 사용하여 텍스트를 생성하세요.');
```

**Python (Jupyter Notebook):**
```python
import json
from gms_api import call_gms_api

# TypeScript에서 생성한 프롬프트 읽기
with open('../prompts.json', 'r', encoding='utf-8') as f:
    prompts = json.load(f)

# 텍스트 생성
result = call_gms_api(
    prompts['systemPrompt'],
    prompts['userPrompt']
)

# 결과 출력 또는 저장
print(result)
```

## 방법 2: TypeScript에서 Python 스크립트 직접 호출

TypeScript 코드에서 Python 스크립트를 자동으로 호출하는 방법입니다.

### 설정

1. **환경변수 설정**
   ```bash
   # Windows
   set USE_PYTHON_GMS=true
   
   # Linux/Mac
   export USE_PYTHON_GMS=true
   ```

2. **Python 설치 확인**
   - Python이 설치되어 있고 PATH에 등록되어 있어야 합니다.
   - `python --version` 또는 `python3 --version`으로 확인

3. **필요한 패키지 설치**
   ```bash
   cd python
   pip install -r requirements.txt
   ```

4. **API 키 설정**
   - TypeScript와 동일하게 `GMS_KEY` 환경변수 설정

### 사용

기존 TypeScript 코드를 수정할 필요 없이, 환경변수만 설정하면 자동으로 Python 스크립트를 사용합니다:

```bash
# Windows
set USE_PYTHON_GMS=true
set GMS_KEY=your-api-key
node dist/main.js --file ./landmarks.json --query '성격 분석'

# Linux/Mac
export USE_PYTHON_GMS=true
export GMS_KEY=your-api-key
node dist/main.js --file ./landmarks.json --query '성격 분석'
```

### 작동 방식

1. TypeScript 코드가 `callGmsApi()` 호출
2. `USE_PYTHON_GMS=true`이면 `gms_python.ts`의 `callGmsApiPython()` 실행
3. Python 스크립트(`python/call_gms.py`)를 호출
4. 결과를 반환

## 방법 3: 수동으로 Python 스크립트 실행

TypeScript 코드를 수정하지 않고, 수동으로 Python 스크립트를 실행하는 방법입니다.

### 단계

1. **프롬프트 파일 생성 (TypeScript에서)**
   ```typescript
   // 수동으로 프롬프트를 JSON 파일로 저장하는 함수 추가
   import * as fs from 'fs';
   
   function savePrompts(systemPrompt: string, userPrompt: string) {
     const prompts = { systemPrompt, userPrompt };
     fs.writeFileSync('prompts.json', JSON.stringify(prompts, null, 2), 'utf-8');
   }
   ```

2. **Python 스크립트 실행**
   ```bash
   cd python
   python call_gms.py --json ../prompts.json output.txt
   ```

3. **결과 확인**
   ```bash
   cat output.txt
   ```

## 성능 비교

- **TypeScript (Node.js)**: 일반적인 서버 환경에서 빠름
- **Python (Jupyter Lab GPU 서버)**: GPU 가속이 가능한 경우 더 빠를 수 있음

## 문제 해결

### Python을 찾을 수 없음

```bash
# Python 경로 확인
which python
which python3

# PATH에 Python 추가 (Windows)
set PATH=%PATH%;C:\Python39

# PATH에 Python 추가 (Linux/Mac)
export PATH=$PATH:/usr/bin/python3
```

### 모듈을 찾을 수 없음

```bash
# Python 패키지 설치 확인
pip list | grep requests

# 재설치
pip install -r requirements.txt
```

### 권한 오류

```bash
# Jupyter 서버에서 파일 권한 확인
ls -la python/

# 필요시 권한 변경
chmod +x python/call_gms.py
```

## 권장 워크플로우

1. **개발/테스트**: TypeScript 버전 사용 (빠른 반복)
2. **프로덕션/대량 처리**: Jupyter Lab GPU 서버에서 Python 버전 사용
3. **프롬프트 생성**: TypeScript 코드 사용
4. **텍스트 생성**: Python 코드 사용 (GPU 서버)

이렇게 하면 각 환경의 장점을 최대한 활용할 수 있습니다.
