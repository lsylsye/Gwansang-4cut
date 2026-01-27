FROM eclipse-temurin:17-jdk-alpine
COPY ./build/libs/*SNAPSHOT.jar project.jar

# 젠킨스가 넣어준 .env를 이미지 안으로 가져가기
COPY .env .env

# 혹시나를 위해서 기본값은 dev ( test 용 서버 )
ENV PROFILE="dev"

ENTRYPOINT ["sh", "-c", "java -Duser.timezone=Asia/Seoul -jar project.jar --spring.profiles.active=${PROFILE}"]