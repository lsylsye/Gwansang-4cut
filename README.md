# 1. 프로젝트 소개

## 관상네컷 [🏆SSAFY 공통 프로젝트 우수]
- MediaPipe를 활용한 AI 관상 및 사주 분석 서비스


## 기술 스택

- **프론트**: React, TypeScript, Vite, Tailwind, MediaPipe (얼굴 랜드마크 클라이언트 연산)
- **백엔드**: Spring Boot - DB관련 프로세스, MySQL,  FastAPI - 관상/사주 분석, 
- **AI**:RAG(Redis), GMS(LLM), 미래 이미지 생성(Gemini)

## 실행 방법

1. `.env` 설정 (DB, GMS_KEY 등)
2. compose.dev.was.yml 빌드 및 실행, redis 컨테이너 내부에서 indexer.py 인덱싱파일 실행
3. 프론트: `cd client/webClient && npm i && npm run dev` (Node 20.20)

## 주요 기능

- 개인/모임 관상 및 사주 분석 (랜드마크 → rule-based → RAG·LLM)
- 사주 분석, 모임 궁합
- 미래 얼굴 이미지 생성
- 네컷 포토부스, 랭킹

## 프로젝트 구조

- `client/webClient` — 프론트
- `server` — Spring Boot(8080) + 이미지생성 호출(8001)
- `AItestFile_saju/python` — 관상·사주 API(8000)
- `welstoryLunch` — welstory 연동(8002)

### 인프라 구성도
<img width="1388" height="1216" alt="image" src="https://github.com/user-attachments/assets/be1732d0-8a0e-44a3-8599-49587cc0712d" />



# 2. 프로젝트에서 사용하는 외부 서비스 정보
- GMS : key는 .env에 정의 후 compose에서 알아서 적용됨
- Welstory : key는 .env에 정의 후 compose에서 알아서 적용됨
- Gemini Nanobanana : key는 .env에 정의 후 compose에서 알아서 적용됨


# 3. 기능 소개
### 개인 관상 기능 요약
<img width="2050" height="1084" alt="image" src="https://github.com/user-attachments/assets/644fc362-ecc6-48e3-8f18-ccade816adef" />


### 모임 관상 기능 요약
<img width="2010" height="1092" alt="image" src="https://github.com/user-attachments/assets/13e48ae7-f611-4627-82ad-9e334d6a7f73" />


# 4. 기능 화면

### 개인 관상

**[1. Mediapipe를 통한 얼굴 인식]**

**2. 개인 관상 결과 확인**

**3. 미래의 내 모습 확인하기**

**4. 체질에 맞는 식단 분석 받기**

**5. 사주 오행 분석**


### 모임 궁합

**[1. Mediapipe를 통한 얼굴 인식]**

최대 7명까지 인식 가능

**[2. 모임 전체 궁합 확인]**


**[3. 1:1 궁합 확인]**

**[4. 점수 랭킹 등록하기]**


### 랜딩 페이지 

1. 결과를 기다리면서 각 이목구비에 담긴 관상학적 의미 확인하기

2. 싸피네컷 [SSAFY 교육생을 위한 특별 부스]

싸피 캐릭터를 통해 자체 제작한 네컷 프레임으로 촬영 가능
문구 커스텀 가능


# 5. 발표자료
- [영상 포트폴리오](https://drive.google.com/file/d/13vW6bNFFodqBR2SfHosRfE-4-WDsQHBa/view?usp=sharing)
- [최종발표 PPT](https://docs.google.com/presentation/d/1D3xv5daQuAUuIPddGbf2gwuoaM4c7yqG/edit?usp=sharing&ouid=117608158351093683950&rtpof=true&sd=true)


