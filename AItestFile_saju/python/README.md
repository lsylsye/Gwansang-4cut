# GMS API Python 모듈

Jupyter Lab GPU 서버에서 GMS API를 사용하여 텍스트를 생성하기 위한 Python 모듈입니다.

## 설치 방법

### 1. 필요한 패키지 설치

```bash
pip install -r requirements.txt
```

또는 직접 설치:

```bash
pip install requests
```

### 2. 환경변수 설정

#### Windows (PowerShell)
```powershell
$env:GMS_KEY="your-api-key-here"
```

#### Linux/Mac
```bash
export GMS_KEY="your-api-key-here"
```

#### Jupyter Notebook에서 직접 설정
```python
import os
os.environ['GMS_KEY'] = 'your-api-key-here'
```

## 사용 방법

### 기본 사용법

```python
from gms_api import call_gms_api, generate_text

# 간단한 사용
result = generate_text(
    system_prompt="당신은 친절한 AI 어시스턴트입니다.",
    user_prompt="안녕하세요!"
)
print(result)

# 상세 옵션 사용
result = call_gms_api(
    system_prompt="시스템 프롬프트",
    user_prompt="사용자 프롬프트",
    model="gpt-5-mini",
    timeout=300  # 5분 타임아웃
)
```

### Jupyter Notebook에서 사용

1. `example_notebook.ipynb` 파일을 열기
2. 첫 번째 셀에서 API 키 설정
3. 각 예제 셀을 실행

## TypeScript 코드와 연동

### 방법 1: JSON 파일을 통한 연동

TypeScript 코드에서 프롬프트를 JSON 파일로 저장:

```typescript
// TypeScript (src/gms.ts 수정 예시)
import * as fs from 'fs';

export async function savePromptsForPython(
  systemPrompt: string,
  userPrompt: string
): Promise<void> {
  const prompts = { systemPrompt, userPrompt };
  fs.writeFileSync(
    'prompts.json',
    JSON.stringify(prompts, null, 2),
    'utf-8'
  );
}
```

Python에서 읽기:

```python
import json
from gms_api import call_gms_api

with open('../prompts.json', 'r', encoding='utf-8') as f:
    prompts = json.load(f)

result = call_gms_api(
    prompts['systemPrompt'],
    prompts['userPrompt']
)
```

### 방법 2: TypeScript에서 Python 스크립트 직접 호출

TypeScript 코드를 수정하여 Python 스크립트를 호출할 수 있습니다 (선택사항).

## 주의사항

1. **API 키 보안**: API 키를 코드에 직접 하드코딩하지 마세요. 환경변수나 설정 파일을 사용하세요.

2. **타임아웃**: GPU 서버에서 처리 시간이 오래 걸릴 수 있으므로 `timeout` 파라미터를 적절히 설정하세요 (기본값: 300초).

3. **에러 처리**: 네트워크 오류나 API 오류가 발생할 수 있으므로 try-except 블록을 사용하세요.

4. **Jupyter 경로**: Jupyter Notebook에서 모듈을 임포트할 때 경로가 올바른지 확인하세요.

## 문제 해결

### 모듈을 찾을 수 없음

```python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath('')))
```

### API 키 오류

환경변수가 제대로 설정되었는지 확인:

```python
import os
print(os.getenv('GMS_KEY'))  # None이면 설정되지 않은 것
```

### 타임아웃 오류

`timeout` 값을 늘려보세요:

```python
result = call_gms_api(system_prompt, user_prompt, timeout=600)  # 10분
```
