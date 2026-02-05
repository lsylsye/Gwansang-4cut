from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime
import asyncio
import pytz

from app.config import settings
from app.services.welstory_client import WelstoryClient
from app.services.mattermost import send_to_multi_mattermost
from app.services.formatter import formatter_map, format_simple_menu_message
from app.services.scheduler import start_scheduler

KST = pytz.timezone("Asia/Seoul")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작 시 스케줄러 실행"""
    task = asyncio.create_task(start_scheduler())
    yield
    task.cancel()


app = FastAPI(
    title="Welstory Lunch API",
    description="웰스토리 점심 메뉴 알림 서비스",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    now = datetime.now(KST)
    return {
        "status": "ok",
        "message": "Welstory Lunch API is running",
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S KST")
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


@app.get("/menu")
async def get_menu():
    """오늘의 메뉴 조회"""
    try:
        client = WelstoryClient()
        if client.login(settings.WELSTORY_USERNAME, settings.WELSTORY_PASSWORD):
            menu = client.get_today_menu()
            return {"status": "success", "data": menu}
        else:
            return JSONResponse(
                status_code=401,
                content={"status": "error", "message": "로그인 실패"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.post("/send")
async def send_menu_now(background_tasks: BackgroundTasks):
    """메뉴 즉시 전송"""
    background_tasks.add_task(send_menu_job)
    return {"status": "success", "message": "메뉴 전송이 시작되었습니다."}


@app.post("/send/simple")
async def send_simple_menu_now(background_tasks: BackgroundTasks):
    """간단한 메뉴 (평점만) 즉시 전송"""
    background_tasks.add_task(send_simple_menu_job)
    return {"status": "success", "message": "간단 메뉴 전송이 시작되었습니다."}


def send_menu_job():
    """메뉴 전송 작업"""
    now = datetime.now(KST)
    weekday = now.weekday()
    print(f"[{now}] 현재 요일: {weekday}")

    client = WelstoryClient()
    if client.login(settings.WELSTORY_USERNAME, settings.WELSTORY_PASSWORD):
        menu = client.get_today_menu()
        formatter = formatter_map.get(weekday, formatter_map[0])
        msg = formatter(menu)
        send_to_multi_mattermost(msg)
    else:
        print("로그인 실패")


def send_simple_menu_job():
    """간단한 메뉴 전송 작업"""
    now = datetime.now(KST)
    weekday = now.weekday()
    print(f"[{now}] 현재 요일: {weekday} simple 내부")

    client = WelstoryClient()
    if client.login(settings.WELSTORY_USERNAME, settings.WELSTORY_PASSWORD):
        menu = client.get_today_menu()
        msg = format_simple_menu_message(menu)
        send_to_multi_mattermost(msg)
    else:
        print("로그인 실패")
