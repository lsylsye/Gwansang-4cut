from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # Mattermost 설정
    MATTERMOST_BASE_URL: str = "https://meeting.ssafy.com"
    MATTERMOST_WEBHOOK_PATHS: List[str] = [
        "/hooks/채널1경로",
        "/hooks/채널2경로",
    ]
    
    # Welstory 로그인 정보
    WELSTORY_USERNAME: str = "웰스토리아이디"
    WELSTORY_PASSWORD: str = "웰스토리비밀번호"
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
