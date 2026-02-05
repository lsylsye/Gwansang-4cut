import asyncio
from datetime import datetime
import pytz

from app.config import settings
from app.services.welstory_client import WelstoryClient
from app.services.mattermost import send_to_multi_mattermost
from app.services.formatter import formatter_map

KST = pytz.timezone("Asia/Seoul")

# 스케줄 설정: (요일, 시, 분) - 요일: 0=월, 1=화, 2=수, 3=목, 4=금
SCHEDULE = [
    (0, 12, 0),   # 월요일 12:00
    (1, 12, 0),   # 화요일 12:00
    (2, 12, 16),  # 수요일 12:16
    (3, 12, 0),   # 목요일 12:00
    (4, 12, 0),   # 금요일 12:00
]


async def start_scheduler():
    """비동기 스케줄러 시작"""
    print("📅 스케줄러가 시작되었습니다.")
    
    while True:
        now = datetime.now(KST)
        current_weekday = now.weekday()
        current_hour = now.hour
        current_minute = now.minute
        
        for weekday, hour, minute in SCHEDULE:
            if (current_weekday == weekday and 
                current_hour == hour and 
                current_minute == minute):
                print(f"⏰ 스케줄 실행: 요일={weekday}, 시간={hour}:{minute}")
                await run_scheduled_job()
        
        # 1분마다 체크
        await asyncio.sleep(60)


async def run_scheduled_job():
    """스케줄된 작업 실행"""
    now = datetime.now(KST)
    weekday = now.weekday()
    print(f"[{now}] 스케줄 작업 실행 - 요일: {weekday}")

    try:
        client = WelstoryClient()
        if client.login(settings.WELSTORY_USERNAME, settings.WELSTORY_PASSWORD):
            menu = client.get_today_menu()
            formatter = formatter_map.get(weekday, formatter_map[0])
            msg = formatter(menu)
            send_to_multi_mattermost(msg)
            print("✅ 메뉴 전송 완료")
        else:
            print("❌ 로그인 실패")
    except Exception as e:
        print(f"❌ 스케줄 작업 실패: {e}")
