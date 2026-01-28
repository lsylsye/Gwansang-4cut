
FROM jenkins/jenkins:lts-jdk17

USER root

# Docker Compose V2 (Plugin) 설치
RUN mkdir -p /usr/libexec/docker/cli-plugins && \
    curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
    -o /usr/libexec/docker/cli-plugins/docker-compose && \
    chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# 젠킨스 실행 권한을 위해 다시 jenkins 유저로 돌아가지 않고 root 유지 (권장)
# (Compose에서 user: root를 쓰겠지만 여기서도 확실히 해둠)
USER root