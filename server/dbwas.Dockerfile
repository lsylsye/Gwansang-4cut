# -------------------------------------------------------------------------
# 1. 빌드 스테이지 (Builder)
# -------------------------------------------------------------------------
    FROM eclipse-temurin:17-jdk-alpine AS builder

    WORKDIR /build
    
    # [속도 최적화] Gradle 설정 파일들만 먼저 복사!
    # (이렇게 해야 소스코드가 바껴도 라이브러리는 다시 다운 안 받음 -> 엄청 빠름)
    COPY gradlew .
    COPY gradle gradle
    COPY build.gradle .
    COPY settings.gradle .
    
    # 실행 권한 주고 라이브러리 다운로드 (여기서 캐싱됨)
    RUN chmod +x ./gradlew
    RUN ./gradlew dependencies --no-daemon
    
    # [중요] 진짜 소스 코드 복사 (src -> /build/src) (우 : 도커내부)
    COPY src src
    
    # 빌드 실행 : 도커 내부의 /build/build/libs 경로에 jar 생성
    RUN ./gradlew clean bootJar -x test --no-daemon
    
    # -------------------------------------------------------------------------
    # 2. 실행 스테이지 (Runner)
    # -------------------------------------------------------------------------
    FROM eclipse-temurin:17-jdk-alpine
    
    WORKDIR /app
    
    # --from=builder 옵션 필수!
    COPY --from=builder /build/build/libs/*.jar app.jar
    
    # 실행
    ENTRYPOINT ["sh", "-c", "java -Duser.timezone=Asia/Seoul -jar app.jar"]