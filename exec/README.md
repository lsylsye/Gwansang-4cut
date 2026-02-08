## 1. Gitlab 소스 클론 이후 빌드 및 배포 메뉴얼

### 1-1. Gitlab 소스 클론 이후 빌드 및 배포하는법 : 백엔드 
1. Docker 설치
- Docker(20.10v 이상)만 설치 하면 다른 어떠한 프로그램도 설치 필요 없이 빌드 및 실행 가능

2. .env 삽입 및 Docker Compose 실행
- 각 서버 및 DB 컨테이너들이 Dockerfile로 이미지 빌드 정의가 되어있고 하나의 compose 파일로 빌드 및 실행 가능함
- 도커 컨테이너 이므로 어떠한 다른 환경에서 빌드 및 실행 해도 모두 동일한 서버 환경이 제공됨
- compose가 있는 최상위 위치에 환경변수 파일 .env를 삽입 후 docker compose -f compose.dev.was.yml up -d --build 명령어만 실행하면 빌드(이미지 생성) 및 실행됨, 최초 실행 시엔 
- 배포 시 운영용 .env와 compose 파일을 적용하면됨 (docker compose -f compose.prod.was.yml up -d --build)

### 1-2. Gitlab 소스 클론 이후 빌드 및 배포하는법 : 프런트엔드
1. Node.js 설치
- Node.js 20.20

2. client/webClient 위치에서 .env 삽입 후 npm i, npm run dev 명령어 입력
- 배포 시 운영용 .env 파일을 적용하면됨

### 1-3. 배포 환경에 필요한 Nginx 구축 및 SSL 인증서 발급
- 인스턴스에 compose.nginx.yml을 생성, nginx 라우팅 설정등을 위해 nginx/conf.d/app.conf 생성
- cerbot으로 도메인 https ssl 인증서 적용
- nginx compose 실행

### (참고용) 인프라 구성도 
![image](/uploads/03dca623c6c03128382d45a2353cbeed/image.png){width=521 height=456}

## 2. 프로젝트에서 사용하는 외부 서비스 정보
- GMS : key는 .env에 정의 되어 compose에서 알아서 적용됨
- Welstory : key는 .env에 정의 되어 compose에서 알아서 적용됨
- Gemini Nanobanana : key는 .env에 정의 되어 compose에서 알아서 적용됨

## 3. DB 덤프파일 : 필요 X
- 컨테이너 환경 구축 + JPA DDL AUTO 로 인해 덤프파일 의미 X

## 4. 시연 시나리오 
### 개인 관상 기능 요약
![image](/uploads/cf2e495308f8eab2b469575db78f79b5/image.png){width=769 height=407}

### 모임 관상 기능 요약
![image](/uploads/63e4408415e8b1d79187f9a834fefe8c/image.png){width=754 height=410}

### 개인 관상 상세
- 메인 페이지
![image](/uploads/e8ef02b5a7e1efb01f749060e16ded3c/image.png){width=900 height=511}

- 개인 관상 클릭 후 사진 촬영 or 사진 업로드
![image](/uploads/3f978b719d99d76f7690fd3164922726/image.png){width=900 height=508}
![image](/uploads/1502dbc48b5e8922ace8bdf33c12ee74/image.png){width=900 height=510}

- 사주 정보 입력 후 풀이 받기
![image](/uploads/4c31ece1a3ad94bc93bdb6d65e09b3d0/image.png){width=900 height=507}

- 분석 결과 확인 및 결과 링크 저장 가능(사진은 DB에 저장 안함)
- 분석 도중 / 이후 싸피 네컷 촬영 가능, 결과탭에서 미래의 나 확인 가능 (10, 20, 30년 후 미래 나의 이미지 생성)
- 체질 분석에서 웰스토리API 와 연동하여 나의 관상 / 사주 분석 결과 체질에 맞는 오늘의 점심메뉴 추천
![image](/uploads/5a3fc68f9735f08b1a922fab20a495d3/image.png){width=900 height=506}
![image](/uploads/c65a2d6b8cf5a75045cf02c47ec9de06/image.png){width=900 height=456}
![image](/uploads/3b6139df2bfb97aad68a6322e2dc05b7/image.png){width=900 height=506}
![image](/uploads/ace3b7a66b79860c07e21440f1571fa0/image.png){width=900 height=505}

### 모임 궁합 상세
- 모임 궁합 클릭 후 사진 촬영 or 사진 업로드


- 감지된 각 유저별 사주 정부 입력 후 풀이 받기

- 분석 결과 확인 및 결과 링크 저장 가능(사진은 DB에 저장 안함)
- 분석 도중 / 이후 싸피 네컷 촬영 가능, 결과탭에서 미래의 나 확인 가능 (10, 20, 30년 후 미래 나의 이미지 생성)
- 부여받은 점수로 랭킹 등록 가능

- 상단의 모임 랭킹 탭에서 랭킹 목록 조회
![image](/uploads/b3a5dfb178740253d6529ee9d57342dd/image.png){width=900 height=506}

