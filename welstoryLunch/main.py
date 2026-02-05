from datetime import datetime
from flask import Flask
from welstory_client import WelstoryClient
from dotenv import load_dotenv
import schedule
import threading
import time
import pytz
import requests
import os

load_dotenv()

# 웹훅 주소 설정
# MATTERMOST_BASE_URL = "https://meeting.ssafy.com"
# MATTERMOST_WEBHOOK_PATH = "/hooks/웹훅경로"

# USERNAME = "웰스토리아이디"
# PASSWORD = "웰스토리비밀번호"


# 한 번에 여러 채널에 보낼 때 사용 (아니라면 주석 처리)
# MATTERMOST_WEBHOOK_PATHS = [
#     "/hooks/채널1경로",  # 이런 식으로 경로 추가
#     "/hooks/채널2경로",       # 이런 식으로 경로 추가
# ]

# MATTERMOST_BASE_URL = os.getenv("MATTERMOST_BASE_URL")
# MATTERMOST_WEBHOOK_PATH = os.getenv("MATTERMOST_WEBHOOK_PATH")

USERNAME = os.getenv("WELSTORY_USERNAME")
PASSWORD = os.getenv("WELSTORY_PASSWORD")

KST = pytz.timezone("Asia/Seoul")
app = Flask(__name__)

def get_current_seoul_time():
    return datetime.now(KST)


def format_menu_message(menu):
    message = "## :shark_food: 오늘의 점심 메뉴 :food-fried-egg:  \n\n"

    # 라면 메뉴 분리
    regular_items = []
    ramen_item = None

    for item in menu.get("점심", []):
        if "[라면" in item.get("메뉴명", ""):
            ramen_item = item
        else:
            regular_items.append(item)

    # 기존 메뉴 테이블 생성
    if regular_items:
        # 이미지 행
        message += "|"
        for item in regular_items:
            image_md = "이미지 없음"
            if item.get("이미지"):
                image_md = f"![메뉴이미지]({item['이미지']})"
            message += f" {image_md} |"
        message += "\n"

        # 구분선
        message += "|" + "---|" * len(regular_items) + "\n"

        # 음식점 행
        message += "|"
        for item in regular_items:
            message += f" {item['코너']} |"
        message += "\n"

        # 메뉴 제목 행
        message += "|"
        for item in regular_items:
            message += f" **{item['메뉴명']}** |"
        message += "\n"

        # 메뉴 상세 행
        message += "|"
        for item in regular_items:
            details = ", ".join(filter(None, item["구성"]))
            message += f" {details} |"
        message += "\n"

        # 칼로리 행
        message += "|"
        for item in regular_items:
            message += f" {item['칼로리']}kcal |"
        message += "\n"

        # 평점 행
        message += "|"
        for item in regular_items:
            rating_info = ""
            if item.get("평균평점", 0) > 0:
                rating_info = f"⭐ {item['평균평점']:.1f} ({item['참여자수']}명)"
            else:
                rating_info = "평가 없음"
            message += f" {rating_info} |"
        message += "\n\n"

    # 라면 메뉴 테이블 추가 (2열 테이블 버전)
    if ramen_item:
        # 라면 종류와 토핑 분리
        ramen_types = []
        toppings = []
        topping_start_idx = -1

        # 구성 리스트에서 '[토핑' 항목 이후부터 토핑으로 간주
        for i, item in enumerate(ramen_item.get("구성", [])):
            if "[토핑" in item:
                topping_start_idx = i
                break

        # 토핑 시작 인덱스가 찾아졌으면 분리
        if topping_start_idx > 0:
            # '[라면' 항목 제외하고 토핑 전까지는 라면 종류
            for i, item in enumerate(ramen_item.get("구성", [])):
                if (
                    i > 0 and i < topping_start_idx
                ):  # 첫 번째 항목([라면 n종 중 택1]) 제외
                    ramen_types.append(item)

            # 토핑 항목 이후부터 끝까지는 토핑
            for i, item in enumerate(ramen_item.get("구성", [])):
                if i > topping_start_idx:  # [토핑N종] 이후
                    toppings.append(item)
        else:
            # 토핑 구분자가 없는 경우 또는 찾지 못한 경우
            # 아무 필터링 없이 첫 번째 항목([라면 n종 중 택1])만 제외하고 모두 라면 종류로 간주
            for i, item in enumerate(ramen_item.get("구성", [])):
                if i > 0:  # 첫 번째 항목 제외
                    ramen_types.append(item)

        # 라면 정보가 포함된 2열 테이블 생성
        message += "## :sinjjang-ramen: 오늘의 라면 메뉴 :raccoon_ramen: \n\n"

        # 간단한 2열 테이블
        message += "| 라면 메뉴 | 라면 종류 |\n"
        message += "|---|---|\n"

        # 라면 이미지와 종류들
        image_md = "이미지 없음"
        if ramen_item.get("이미지"):
            image_md = f"![라면이미지]({ramen_item['이미지']})"

        # 라면 종류 리스트 (콤마로 구분)
        ramen_types_formatted = ", ".join(ramen_types)

        message += f"| {image_md} | {ramen_types_formatted} |\n"

        # 토핑 리스트 (콤마로 구분)
        toppings_formatted = ", ".join(toppings)

        message += f"| 토핑 | {toppings_formatted} |\n"

    return message



def format_menu_message_wen(menu):
    message = "## :happy_pen:  수요일은 특식 데이 :meow_hungry_move: \n\n"

    # 라면 메뉴 분리
    regular_items = []
    ramen_item = None

    for item in menu.get("점심", []):
        if "[라면" in item.get("메뉴명", ""):
            ramen_item = item
        else:
            regular_items.append(item)

    # 기존 메뉴 테이블 생성
    if regular_items:
        # 이미지 행
        message += "|"
        for item in regular_items:
            image_md = "이미지 없음"
            if item.get("이미지"):
                image_md = f"![메뉴이미지]({item['이미지']})"
            message += f" {image_md} |"
        message += "\n"

        # 구분선
        message += "|" + "---|" * len(regular_items) + "\n"

        # 음식점 행
        message += "|"
        for item in regular_items:
            message += f" {item['코너']} |"
        message += "\n"

        # 메뉴 제목 행
        message += "|"
        for item in regular_items:
            message += f" **{item['메뉴명']}** |"
        message += "\n"

        # 메뉴 상세 행
        message += "|"
        for item in regular_items:
            details = ", ".join(filter(None, item["구성"]))
            message += f" {details} |"
        message += "\n"

        # 칼로리 행
        message += "|"
        for item in regular_items:
            message += f" {item['칼로리']}kcal |"
        message += "\n"

        # 평점 행
        message += "|"
        for item in regular_items:
            rating_info = ""
            if item.get("평균평점", 0) > 0:
                rating_info = f"⭐ {item['평균평점']:.1f} ({item['참여자수']}명)"
            else:
                rating_info = "평가 없음"
            message += f" {rating_info} |"
        message += "\n\n"

    # 라면 메뉴 테이블 추가 (2열 테이블 버전)
    if ramen_item:
        # 라면 종류와 토핑 분리
        ramen_types = []
        toppings = []
        topping_start_idx = -1

        # 구성 리스트에서 '[토핑' 항목 이후부터 토핑으로 간주
        for i, item in enumerate(ramen_item.get("구성", [])):
            if "[토핑" in item:
                topping_start_idx = i
                break

        # 토핑 시작 인덱스가 찾아졌으면 분리
        if topping_start_idx > 0:
            # '[라면' 항목 제외하고 토핑 전까지는 라면 종류
            for i, item in enumerate(ramen_item.get("구성", [])):
                if (
                    i > 0 and i < topping_start_idx
                ):  # 첫 번째 항목([라면 n종 중 택1]) 제외
                    ramen_types.append(item)

            # 토핑 항목 이후부터 끝까지는 토핑
            for i, item in enumerate(ramen_item.get("구성", [])):
                if i > topping_start_idx:  # [토핑N종] 이후
                    toppings.append(item)
        else:
            # 토핑 구분자가 없는 경우 또는 찾지 못한 경우
            # 아무 필터링 없이 첫 번째 항목([라면 n종 중 택1])만 제외하고 모두 라면 종류로 간주
            for i, item in enumerate(ramen_item.get("구성", [])):
                if i > 0:  # 첫 번째 항목 제외
                    ramen_types.append(item)

        # 라면 정보가 포함된 2열 테이블 생성
        message += "## :sinjjang-ramen: 오늘의 라면 메뉴 :todayramen: \n\n"

        # 간단한 2열 테이블
        message += "| 라면 메뉴 | 라면 종류 |\n"
        message += "|---|---|\n"

        # 라면 이미지와 종류들
        image_md = "이미지 없음"
        if ramen_item.get("이미지"):
            image_md = f"![라면이미지]({ramen_item['이미지']})"

        # 라면 종류 리스트 (콤마로 구분)
        ramen_types_formatted = ", ".join(ramen_types)

        message += f"| {image_md} | {ramen_types_formatted} |\n"

        # 토핑 리스트 (콤마로 구분)
        toppings_formatted = ", ".join(toppings)

        message += f"| 토핑 | {toppings_formatted} |\n"

    return message


def format_menu_message_fri(menu):
    message = "## :dancing_peng: 행복한 금요일 점심 ...♡ :rilakkuma: :strawberry:  \n\n"

    # 라면 메뉴 분리
    regular_items = []
    ramen_item = None

    for item in menu.get("점심", []):
        if "[라면" in item.get("메뉴명", ""):
            ramen_item = item
        else:
            regular_items.append(item)

    # 기존 메뉴 테이블 생성
    if regular_items:
        # 이미지 행
        message += "|"
        for item in regular_items:
            image_md = "이미지 없음"
            if item.get("이미지"):
                image_md = f"![메뉴이미지]({item['이미지']})"
            message += f" {image_md} |"
        message += "\n"

        # 구분선
        message += "|" + "---|" * len(regular_items) + "\n"

        # 음식점 행
        message += "|"
        for item in regular_items:
            message += f" {item['코너']} |"
        message += "\n"

        # 메뉴 제목 행
        message += "|"
        for item in regular_items:
            message += f" **{item['메뉴명']}** |"
        message += "\n"

        # 메뉴 상세 행
        message += "|"
        for item in regular_items:
            details = ", ".join(filter(None, item["구성"]))
            message += f" {details} |"
        message += "\n"

        # 칼로리 행
        message += "|"
        for item in regular_items:
            message += f" {item['칼로리']}kcal |"
        message += "\n"

        # 평점 행
        message += "|"
        for item in regular_items:
            rating_info = ""
            if item.get("평균평점", 0) > 0:
                rating_info = f"⭐ {item['평균평점']:.1f} ({item['참여자수']}명)"
            else:
                rating_info = "평가 없음"
            message += f" {rating_info} |"
        message += "\n\n"

    # 라면 메뉴 테이블 추가 (2열 테이블 버전)
    if ramen_item:
        # 라면 종류와 토핑 분리
        ramen_types = []
        toppings = []
        topping_start_idx = -1

        # 구성 리스트에서 '[토핑' 항목 이후부터 토핑으로 간주
        for i, item in enumerate(ramen_item.get("구성", [])):
            if "[토핑" in item:
                topping_start_idx = i
                break

        # 토핑 시작 인덱스가 찾아졌으면 분리
        if topping_start_idx > 0:
            # '[라면' 항목 제외하고 토핑 전까지는 라면 종류
            for i, item in enumerate(ramen_item.get("구성", [])):
                if (
                    i > 0 and i < topping_start_idx
                ):  # 첫 번째 항목([라면 n종 중 택1]) 제외
                    ramen_types.append(item)

            # 토핑 항목 이후부터 끝까지는 토핑
            for i, item in enumerate(ramen_item.get("구성", [])):
                if i > topping_start_idx:  # [토핑N종] 이후
                    toppings.append(item)
        else:
            # 토핑 구분자가 없는 경우 또는 찾지 못한 경우
            # 아무 필터링 없이 첫 번째 항목([라면 n종 중 택1])만 제외하고 모두 라면 종류로 간주
            for i, item in enumerate(ramen_item.get("구성", [])):
                if i > 0:  # 첫 번째 항목 제외
                    ramen_types.append(item)

        # 라면 정보가 포함된 2열 테이블 생성
        message += "## :sinjjang-ramen: 오늘의 라면 메뉴 :todayramen: \n\n"

        # 간단한 2열 테이블
        message += "| 라면 메뉴 | 라면 종류 |\n"
        message += "|---|---|\n"

        # 라면 이미지와 종류들
        image_md = "이미지 없음"
        if ramen_item.get("이미지"):
            image_md = f"![라면이미지]({ramen_item['이미지']})"

        # 라면 종류 리스트 (콤마로 구분)
        ramen_types_formatted = ", ".join(ramen_types)

        message += f"| {image_md} | {ramen_types_formatted} |\n"

        # 토핑 리스트 (콤마로 구분)
        toppings_formatted = ", ".join(toppings)

        message += f"| 토핑 | {toppings_formatted} |\n"

    return message


def format_simple_menu_message(menu):
    message = "## :hachiware_glasses:  오늘 메뉴 평점 중간 점검 !! :pikmin_red_shake: \n\n"

    # 이미지 행
    message += "|"
    for meal_type, items in menu.items():
        for item in items:
            image_md = "이미지 없음"
            if item.get("이미지"):
                image_md = f"![메뉴이미지]({item['이미지']})"
            message += f" {image_md} |"
    message += "\n"

    # 구분선
    message += "|" + "---|" * len(menu["점심"]) + "\n"

    # 음식점 행
    message += "|"
    for meal_type, items in menu.items():
        for item in items:
            message += f" {item['코너']} |"
    message += "\n"

    # 메뉴 제목 행
    message += "|"
    for meal_type, items in menu.items():
        for item in items:
            message += f" **{item['메뉴명']}** |"
    message += "\n"

    # 평점 행
    message += "|"
    for meal_type, items in menu.items():
        for item in items:
            rating_info = ""
            if item.get("평균평점", 0) > 0:
                rating_info = f"⭐ {item['평균평점']:.1f} ({item['참여자수']}명)"
            else:
                rating_info = "평가 없음"
            message += f" {rating_info} |"
    message += "\n"

    return message


# 요일 → 함수 매핑
formatter_map = {
    0: format_menu_message,        # 월요일
    1: format_menu_message,        # 화요일
    2: format_menu_message_wen,    # 수요일
    3: format_menu_message,        # 목요일
    4: format_menu_message_fri,    # 금요일
}

# def send_to_mattermost(text):
#     payload = { "text": text }
#     webhook_url = f"{MATTERMOST_BASE_URL}{MATTERMOST_WEBHOOK_PATH}"
#     response = requests.post(webhook_url, json=payload)
#     print("전송 상태:", response.status_code)

def send_to_multi_mattermost(text):
    payload = { "text": text }

    for path in MATTERMOST_WEBHOOK_PATHS:
        webhook_url = f"{MATTERMOST_BASE_URL}{path}"
        try:
            response = requests.post(webhook_url, json=payload)
            print(f"✅ 전송 상태({path}):", response.status_code)
        except Exception as e:
            print(f"❌ 전송 실패({path}): {e}")

def job():

    now = datetime.now(KST)
    weekday = now.weekday()  # 월:0 ~ 금:4
    print(f"[{now}] 현재 요일: {weekday}")

    client = WelstoryClient()
    if client.login(USERNAME, PASSWORD):  # 실제 ID/PW로 대체
        menu = client.get_today_menu()

        formatter = formatter_map.get(weekday, format_menu_message)
        msg = formatter(menu)
        # send_to_mattermost(msg)
        send_to_multi_mattermost(msg)
    else:
        print("로그인 실패")


def job_simple():
    now = datetime.now(KST)
    weekday = now.weekday()  # 월:0 ~ 금:4
    print(f"[{now}] 현재 요일: {weekday} simple 내부")

    client = WelstoryClient()
    if client.login(USERNAME, PASSWORD):  # 실제 ID/PW로 대체
        menu = client.get_today_menu()

        msg = format_simple_menu_message(menu)
        send_to_mattermost(msg)
    else:
        print("로그인 실패")


def run_schedule():
    while True:
        schedule.run_pending()
        time.sleep(60)

def main():

    # 테스트용 즉시 발송 메소드 호출
    # job()

    # 평일 오전 12:00 자동 전송
    schedule.every().monday.at("12:00").do(job)
    schedule.every().tuesday.at("12:00").do(job)
    schedule.every().wednesday.at("12:16").do(job)
    schedule.every().thursday.at("12:00").do(job)
    schedule.every().friday.at("12:00").do(job)

    threading.Thread(target=run_schedule, daemon=True).start()
    app.run(host="0.0.0.0", port=8002)

if __name__ == "__main__":
    main()

# 테스트 코드
# if __name__ == "__main__":
#     now = get_current_seoul_time()
#     send_to_mattermost(f"현재 시각은 {now.strftime('%Y-%m-%d %H:%M:%S')} 입니다!")

