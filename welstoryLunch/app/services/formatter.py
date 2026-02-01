def format_menu_message(menu):
    """일반 메뉴 메시지 포맷"""
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

    # 라면 메뉴 추가
    if ramen_item:
        message += _format_ramen_section(ramen_item)

    return message


def format_menu_message_wen(menu):
    """수요일 특식 메뉴 메시지 포맷"""
    message = "## :happy_pen:  수요일은 특식 데이 :meow_hungry_move: \n\n"

    regular_items = []
    ramen_item = None

    for item in menu.get("점심", []):
        if "[라면" in item.get("메뉴명", ""):
            ramen_item = item
        else:
            regular_items.append(item)

    if regular_items:
        message += _format_regular_menu_table(regular_items)

    if ramen_item:
        message += "## :sinjjang-ramen: 오늘의 라면 메뉴 :todayramen: \n\n"
        message += _format_ramen_table(ramen_item)

    return message


def format_menu_message_fri(menu):
    """금요일 메뉴 메시지 포맷"""
    message = "## :dancing_peng: 행복한 금요일 점심 ...♡ :rilakkuma: :strawberry:  \n\n"

    regular_items = []
    ramen_item = None

    for item in menu.get("점심", []):
        if "[라면" in item.get("메뉴명", ""):
            ramen_item = item
        else:
            regular_items.append(item)

    if regular_items:
        message += _format_regular_menu_table(regular_items)

    if ramen_item:
        message += "## :sinjjang-ramen: 오늘의 라면 메뉴 :todayramen: \n\n"
        message += _format_ramen_table(ramen_item)

    return message


def format_simple_menu_message(menu):
    """간단한 메뉴 메시지 (평점 중심)"""
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


def _format_regular_menu_table(items):
    """일반 메뉴 테이블 포맷"""
    message = ""
    
    # 이미지 행
    message += "|"
    for item in items:
        image_md = "이미지 없음"
        if item.get("이미지"):
            image_md = f"![메뉴이미지]({item['이미지']})"
        message += f" {image_md} |"
    message += "\n"

    # 구분선
    message += "|" + "---|" * len(items) + "\n"

    # 음식점 행
    message += "|"
    for item in items:
        message += f" {item['코너']} |"
    message += "\n"

    # 메뉴 제목 행
    message += "|"
    for item in items:
        message += f" **{item['메뉴명']}** |"
    message += "\n"

    # 메뉴 상세 행
    message += "|"
    for item in items:
        details = ", ".join(filter(None, item["구성"]))
        message += f" {details} |"
    message += "\n"

    # 칼로리 행
    message += "|"
    for item in items:
        message += f" {item['칼로리']}kcal |"
    message += "\n"

    # 평점 행
    message += "|"
    for item in items:
        rating_info = ""
        if item.get("평균평점", 0) > 0:
            rating_info = f"⭐ {item['평균평점']:.1f} ({item['참여자수']}명)"
        else:
            rating_info = "평가 없음"
        message += f" {rating_info} |"
    message += "\n\n"

    return message


def _format_ramen_section(ramen_item):
    """라면 섹션 포맷 (일반 메시지용)"""
    message = "## :sinjjang-ramen: 오늘의 라면 메뉴 :raccoon_ramen: \n\n"
    message += _format_ramen_table(ramen_item)
    return message


def _format_ramen_table(ramen_item):
    """라면 테이블 포맷"""
    ramen_types = []
    toppings = []
    topping_start_idx = -1

    for i, item in enumerate(ramen_item.get("구성", [])):
        if "[토핑" in item:
            topping_start_idx = i
            break

    if topping_start_idx > 0:
        for i, item in enumerate(ramen_item.get("구성", [])):
            if i > 0 and i < topping_start_idx:
                ramen_types.append(item)

        for i, item in enumerate(ramen_item.get("구성", [])):
            if i > topping_start_idx:
                toppings.append(item)
    else:
        for i, item in enumerate(ramen_item.get("구성", [])):
            if i > 0:
                ramen_types.append(item)

    message = "| 라면 메뉴 | 라면 종류 |\n"
    message += "|---|---|\n"

    image_md = "이미지 없음"
    if ramen_item.get("이미지"):
        image_md = f"![라면이미지]({ramen_item['이미지']})"

    ramen_types_formatted = ", ".join(ramen_types)
    message += f"| {image_md} | {ramen_types_formatted} |\n"

    toppings_formatted = ", ".join(toppings)
    message += f"| 토핑 | {toppings_formatted} |\n"

    return message


# 요일 → 함수 매핑
formatter_map = {
    0: format_menu_message,        # 월요일
    1: format_menu_message,        # 화요일
    2: format_menu_message_wen,    # 수요일
    3: format_menu_message,        # 목요일
    4: format_menu_message_fri,    # 금요일
}
