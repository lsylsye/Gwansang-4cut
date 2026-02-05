FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 추가 패키지 설치 (indexer.py용)
#RUN pip install --no-cache-dir sentence-transformers torch

# 애플리케이션 코드 복사
COPY server_fastapi.py .
COPY *.py ./

# knowledge 폴더 복사
COPY knowledge /app/knowledge

# 서버 실행
CMD ["uvicorn", "server_fastapi:app", "--host", "0.0.0.0", "--port", "8000"]
