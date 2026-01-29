# proxy_pass 전용 [프로토콜]://[주소(컨테이너명)]:[포트(컨테이너 내부 포트)]
# prod-blue or prod-green (Jenkins 가 주입)
set $prod_upstream "http://was-prod-blue:8080";