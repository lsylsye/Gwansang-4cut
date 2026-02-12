# 1. 프로젝트 소개

## 관상네컷 

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
![image](/uploads/03dca623c6c03128382d45a2353cbeed/image.png){width=521 height=456}

# 2. 프로젝트에서 사용하는 외부 서비스 정보
- GMS : key는 .env에 정의 후 compose에서 알아서 적용됨
- Welstory : key는 .env에 정의 후 compose에서 알아서 적용됨
- Gemini Nanobanana : key는 .env에 정의 후 compose에서 알아서 적용됨



# 3. 기능 소개
### 개인 관상 기능 요약
![image](/uploads/cf2e495308f8eab2b469575db78f79b5/image.png){width=769 height=407}

### 모임 관상 기능 요약
![image](/uploads/63e4408415e8b1d79187f9a834fefe8c/image.png){width=754 height=410}

### 개인 관상 상세
- 메인 페이지
![image](/uploads/e8ef02b5a7e1efb01f749060e16ded3c/image.png){width=900 height=511}

- 개인 관상 클릭 후 사진 촬영 or 사진 업로드
![image](/uploads/3f978b719d99d76f7690fd3164922726/image.png){width=900 height=508}
![image](/uploads/af8b23f3e42b28cdf61c2061b724245c/image.png){width=900 height=505}

- 사주 정보 입력 후 풀이 받기
![image](/uploads/4c31ece1a3ad94bc93bdb6d65e09b3d0/image.png){width=900 height=507}

- 분석 결과 확인
- 분석 도중 / 이후 싸피 네컷 촬영 가능 (브라우저에서 이미지 다운로드 가능)
- 결과탭에서 미래의 나 확인 가능 (10, 20, 30년 후 미래 나의 이미지 생성)
- 체질 분석에서 웰스토리API 와 연동하여 나의 관상 / 사주 분석 결과 체질에 맞는 오늘의 점심메뉴 추천
![image](/uploads/5a3fc68f9735f08b1a922fab20a495d3/image.png){width=900 height=506}
![image](/uploads/c65a2d6b8cf5a75045cf02c47ec9de06/image.png){width=900 height=456}
![image](/uploads/3b6139df2bfb97aad68a6322e2dc05b7/image.png){width=900 height=506}
![image](/uploads/ace3b7a66b79860c07e21440f1571fa0/image.png){width=900 height=505}

- 결과 링크 저장 가능(사진은 DB에 저장 안함)
![스크린샷_2026-02-09_092017](/uploads/afb0d4b360b1820d6b10c6ade8dbfb4f/스크린샷_2026-02-09_092017.png){width=900 height=507}

### 모임 궁합 상세
- 모임 궁합 클릭 후 사진 촬영 or 사진 업로드
![image](/uploads/4915daf3d863440e85aa4a3f81b201ff/image.png){width=900 height=500}

- 감지된 각 유저별 사주 정부 입력 후 풀이 받기
![image](/uploads/d74c7ef22a311d02367bda5664e0e2ae/image.png){width=900 height=506}

- 분석 결과 확인 및 결과 링크 저장 가능(사진은 DB에 저장 안함), 부여받은 점수로 랭킹 등록 가능
- 분석 도중 / 이후 싸피 네컷 촬영 가능 (브라우저에서 이미지 다운로드 가능)
![image](/uploads/01647e339efe4d91f323d03d60512255/image.png){width=900 height=508}
![image](/uploads/03cb039a7c3ccc1a315b82c9df760019/image.png){width=900 height=500}
![image](/uploads/be3018b69956fb0bb43fc14e7ea85047/image.png){width=900 height=505}
![image](/uploads/a61aac778f8fef0047e5639e79229337/image.png){width=900 height=511}

- 모임 결과도 개인 결과와 동일하게 링크 저장 가능(사진은 DB에 저장 안함)

- 상단의 모임 랭킹 탭에서 랭킹 목록 조회 가능
![image](/uploads/c054ed1bf23ec866c15622c1ccbc2b18/image.png){width=900 height=460}

