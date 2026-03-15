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

## 핵심 기능

- **Mediapipe를 이용한 얼굴 인식**  
  얼굴 이미지 대신 478개의 특징점 좌표만 서버로 전송해 개인 정보 보호 강화
- **AI을 이용한 사주 및 관상 RAG 시스템**  
  관상학과 사주 명리학 문헌을 기반으로 한 지식 베이스를 RAG에 연결  
  (교안은 OCR로 텍스트 추출 → chunk 분할 → 임베딩 벡터화 → 벡터 DB 저장)
- **RediSearch : 빠른 검색 응답**   
  유사도 검색을 수행하여 가장 연관성 높은 정보를 찾아 답변 생성에 활용
- **안면 특징 전처리 및 지표화**  
  Mediapipe 좌표를 받아 어떤 관상학 유형에 매핑할지 rules.md에 기록 후 지표 계산에 사용
- **비동기 병렬 처리 방식**  
  다수의 LLM 호출이 순차 실행되어 응답 지연이 발생하던 문제를,  
  asyncio.gather를 활용한 병렬 처리로 개선해 응답 시간 50% 단축


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
<img width="2868" height="1626" alt="image" src="https://github.com/user-attachments/assets/7aafb815-9048-4b49-a5f4-7ff0ade8db3b" />

### 개인 관상

**1. Mediapipe를 통한 얼굴 인식**  
얼굴 인식 성공 시 3초 후 자동으로 사진 촬영 (가이드선 바깥으로 이동할 경우 얼굴 인식 기능 해제)
<img width="2880" height="1614" alt="image" src="https://github.com/user-attachments/assets/5d2e1969-4ed0-4ca7-9296-ebfb7b1b13ef" />

---

**2. 인적 사항 입력**
<img width="2866" height="1612" alt="image" src="https://github.com/user-attachments/assets/f2e205f4-9f03-4516-a597-2d65c00e8134" />

---

**3. 분석 결과**  
- 관상과 사주 정보를 통합한 총평 제공  
- 부위별 상세 풀이 기능
<img width="2880" height="1458" alt="image" src="https://github.com/user-attachments/assets/12b7e1b0-6c8d-4b9d-85f4-76355bcd1d79" />
<img width="2878" height="1618" alt="image" src="https://github.com/user-attachments/assets/36372a32-a365-4329-8809-a0d587d35b2c" />

---

**4. 체질에 맞는 식단 분석 받기**  
웰스토리 API를 연동해 실제 삼성전기 사업장 식단을 불러온 후 분석
<img width="2880" height="1616" alt="image" src="https://github.com/user-attachments/assets/e28f6427-464b-45ee-a780-7357950ad348" />

---

**5. 사주 오행 분석**  
사주 명리 데이터를 이용해 사용자의 오행 자동 계산(AI)  
오행 기반으로 프롬포트 엔지니어링을 통해 체질 + 식단 추천
<img width="1274" height="803" alt="Image" src="https://github.com/user-attachments/assets/1c63d82b-68a6-4da2-bddf-2aa55df97b88" />

---

**6. 결과 링크 공유**  
- UUID 기반 링크 공유
- 사진은 서버에 저장하지 않고 분석 결과만 공유됨

<img width="1266" height="786" alt="Image" src="https://github.com/user-attachments/assets/8edc12ae-5070-4868-b933-376a5c11b40b" />


### 모임 궁합

**1. Mediapipe를 통한 얼굴 인식**  
최대 7명까지 인식 가능
<img width="1394" height="864" alt="Image" src="https://github.com/user-attachments/assets/524e9696-0c40-4a04-9977-2cee0dfbe33b" />

---  


**2. 인적 사항 입력**  
감지된 얼굴 수에 맞춰 자동으로 영역 분할(세그멘테이션) 처리
<img width="1385" height="868" alt="Image" src="https://github.com/user-attachments/assets/8663b6ea-187e-4576-b523-a6b1da07d6dd" />


**3. 전체 궁합 결과** 
<img width="1378" height="866" alt="Image" src="https://github.com/user-attachments/assets/545c28e4-3220-46b1-bba0-346b44a0e7e7" />

<img width="1379" height="869" alt="Image" src="https://github.com/user-attachments/assets/5dc42bc1-6e56-41ff-bd40-351028b70987" />

<img width="1380" height="868" alt="Image" src="https://github.com/user-attachments/assets/2baf2361-ac25-4c3d-a356-3f0727414bdc" />


---  

**4. 1:1 궁합 확인**
- 관계맵을 통해 멤버 선택 시 나머지 멤버와의 궁합 점수를 시각적으로 확인 가능  
- 연애 궁합 확인 가능
<img width="1384" height="867" alt="Image" src="https://github.com/user-attachments/assets/083b3b72-875e-477c-8e34-1f7115eef02e" />

<img width="1391" height="870" alt="Image" src="https://github.com/user-attachments/assets/8a4e19f0-ce73-449b-b0b4-a95c945e5482" />

<img width="1382" height="866" alt="Image" src="https://github.com/user-attachments/assets/eac0a27a-1d0d-4419-bbe1-fb5c51622fb3" />


---  

**5. 점수 랭킹 등록하기**

<img width="1383" height="867" alt="Image" src="https://github.com/user-attachments/assets/f634b2bb-64b0-4a19-a663-4daa2b06504d" />

<img width="1377" height="866" alt="Image" src="https://github.com/user-attachments/assets/778da684-9bb1-4f56-a382-017aa77396f4" />


---  

**6. QR로 결과 공유**  
결과 공유시 사진은 DB에 저장되지 않음
<img width="1392" height="859" alt="Image" src="https://github.com/user-attachments/assets/47e7e3b4-7ca2-41d3-8a14-06ce8e9bb4cc" />

<img width="1383" height="866" alt="Image" src="https://github.com/user-attachments/assets/87c4a65a-5653-425d-9646-fe52f31522ab" />


### 랜딩 페이지 

1. 결과를 기다리면서 각 이목구비에 담긴 관상학적 의미 확인 가능
<img width="1394" height="865" alt="Image" src="https://github.com/user-attachments/assets/1f1bda1a-9ca0-469e-9af4-92a4ce54d072" />

---

2. 싸피네컷 [SSAFY 교육생을 위한 특별 부스]
- 자체 제작 네컷 프레임 : 세로 프레임 / 가로 프레임 중 택 1
- 8번의 사진 촬영 후 베스트샷 선택
- 문구 커스텀 기능
- 이미지 원본 저장 (Canvas API로 클라이언트에서 직접 다운로드)

<img width="1380" height="863" alt="Image" src="https://github.com/user-attachments/assets/32ad17d6-8c42-47ec-bf7b-1a338e53d197" />
<img width="1390" height="862" alt="Image" src="https://github.com/user-attachments/assets/eb1a3bab-4223-4e89-b2ed-ccab46c0c252" />
<img width="1382" height="870" alt="Image" src="https://github.com/user-attachments/assets/8c65964f-8f47-4943-ba67-d10054e73df5" />
<img width="1380" height="832" alt="Image" src="https://github.com/user-attachments/assets/790a0f1b-a848-474d-8497-3db2ed418bd1" />



# 5. 발표자료
- [영상 포트폴리오](https://drive.google.com/file/d/13vW6bNFFodqBR2SfHosRfE-4-WDsQHBa/view?usp=sharing)
- [최종발표 PPT](https://docs.google.com/presentation/d/1D3xv5daQuAUuIPddGbf2gwuoaM4c7yqG/edit?usp=sharing&ouid=117608158351093683950&rtpof=true&sd=true)


