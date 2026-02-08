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
- 인스턴스에 compose.nginx.yml을 생성
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

