# proxy_pass 전용 [프로토콜]://[주소(컨테이너명)]:[포트(컨테이너 내부 포트)]
# test-blue or test-green (Jenkins 가 주입)
set $test_upstream "http://was-test-blue:8080";