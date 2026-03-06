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


### 개인 관상 상세
- 메인 페이지
<img width="2868" height="1626" alt="image" src="https://github.com/user-attachments/assets/7aafb815-9048-4b49-a5f4-7ff0ade8db3b" />


- 개인 관상 클릭 후 사진 촬영 or 사진 업로드
<img width="2880" height="1622" alt="image" src="https://github.com/user-attachments/assets/bdaca060-ddc0-4a46-b855-3d5272339cf2" />
<img width="2880" height="1614" alt="image" src="https://github.com/user-attachments/assets/5d2e1969-4ed0-4ca7-9296-ebfb7b1b13ef" />


- 사주 정보 입력 후 풀이 받기
<img width="2866" height="1612" alt="image" src="https://github.com/user-attachments/assets/f2e205f4-9f03-4516-a597-2d65c00e8134" />


- 분석 결과 확인
- 분석 도중 / 이후 싸피 네컷 촬영 가능 (브라우저에서 이미지 다운로드 가능)
- 결과탭에서 미래의 나 확인 가능 (10, 20, 30년 후 미래 나의 이미지 생성)
- 체질 분석에서 웰스토리API 와 연동하여 나의 관상 / 사주 분석 결과 체질에 맞는 오늘의 점심메뉴 추천
<img width="2876" height="1614" alt="image" src="https://github.com/user-attachments/assets/b3ffa3de-c22d-4bf1-b830-bdd66d3374d1" />
<img width="2880" height="1458" alt="image" src="https://github.com/user-attachments/assets/12b7e1b0-6c8d-4b9d-85f4-76355bcd1d79" />
<img width="2878" height="1618" alt="image" src="https://github.com/user-attachments/assets/36372a32-a365-4329-8809-a0d587d35b2c" />
<img width="2880" height="1616" alt="image" src="https://github.com/user-attachments/assets/e28f6427-464b-45ee-a780-7357950ad348" />




- 결과 링크 저장 가능(사진은 DB에 저장 안함)
<img width="2879" height="1620" alt="image" src="https://github.com/user-attachments/assets/cd8a7a3e-7392-49a3-8907-853686402b9d" />


### 모임 궁합 상세
- 모임 궁합 클릭 후 사진 촬영 or 사진 업로드
<img width="2880" height="1600" alt="image" src="https://github.com/user-attachments/assets/5241119e-5653-4fea-80a5-fc9c5d3b1c8e" />


- 감지된 각 유저별 사주 정부 입력 후 풀이 받기
<img width="2880" height="1618" alt="image" src="https://github.com/user-attachments/assets/9ca760fe-aafe-41f0-bfbc-3541e5ce17d3" />


- 분석 결과 확인 및 결과 링크 저장 가능(사진은 DB에 저장 안함), 부여받은 점수로 랭킹 등록 가능
- 분석 도중 / 이후 싸피 네컷 촬영 가능 (브라우저에서 이미지 다운로드 가능)
<img width="2880" height="1622" alt="image" src="https://github.com/user-attachments/assets/8dccec82-6283-40d8-82e9-3681ed59c93c" />
<img width="2880" height="1600" alt="image" src="https://github.com/user-attachments/assets/68928db8-5380-400d-9808-3e9eb5da09fd" />
<img width="2880" height="1612" alt="image" src="https://github.com/user-attachments/assets/bc055d78-d496-4619-9170-4f26f34ff89a" />
<img width="2880" height="1634" alt="image" src="https://github.com/user-attachments/assets/eee83325-051f-4e2b-b7d6-77a4e883a244" />


- 모임 결과도 개인 결과와 동일하게 링크 저장 가능(사진은 DB에 저장 안함)

- 상단의 모임 랭킹 탭에서 랭킹 목록 조회 가능
<img width="2866" height="1462" alt="image" src="https://github.com/user-attachments/assets/1fb4185b-00d9-438e-bc2b-5e1d32c889e5" />




