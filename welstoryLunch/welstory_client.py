# welstory_client.py

from datetime import datetime, timedelta
import requests


class WelstoryClient:
    def __init__(self):
        self.base_url = "https://welplus.welstory.com"
        self.device_id = "95CB2CC5-543E-4DA7-AD7D-3D2D463CB0A0"
        self.token = None
        self.headers = {
            "X-Device-Id": self.device_id,
            "X-Autologin": "Y",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Welplus/1.01.08",
        }

    def login(self, username, password):
        url = f"{self.base_url}/login"

        login_headers = self.headers.copy()
        login_headers["Content-Type"] = "application/x-www-form-urlencoded;charset=utf-8"
        login_headers["Authorization"] = "Bearer null"
        data = {"username": username, "password": password, "remember-me": "true"}
        response = requests.post(url, headers=login_headers, data=data)
        if response.status_code == 200:
            self.token = response.headers.get("Authorization")
            return True
        return False

    def get_today_menu(self):
            if not self.token:
                raise Exception("Not logged in")

            url = f"{self.base_url}/api/meal"

            headers = self.headers.copy()
            headers.update({"Authorization": self.token})

            today = datetime.now().strftime("%Y%m%d")

            params = {
                "menuDt": today,
                "menuMealType": "2",  # 2는 점심
                "restaurantCode": "REST000595",  # 삼성 부산 전기
                "sortingFlag": "",
                "mainDivRestaurantCode": "REST000595",
                "activeRestaurantCode": "REST000595",
            }

            response = requests.get(url, headers=headers, params=params)

            print(response.url)
            print(response.text)

            if response.status_code == 200:
                menu_data = response.json()
                return self._parse_menu(menu_data)
            else:
                raise Exception(f"Failed to get menu: {response.status_code}")


    def get_menu_rating(
        self, menu_dt, hall_no, menu_course_type, menu_meal_type, restaurant_code
        ):
        """메뉴 평점 조회"""
        if not self.token:
            raise Exception("Not logged in")

        url = f"{self.base_url}/api/meal/getMenuEvalAvg"

        headers = self.headers.copy()
        headers.update({"Authorization": self.token})

        params = {
            "menuDt": menu_dt,
            "hallNo": hall_no,
            "menuCourseType": menu_course_type,
            "menuMealType": menu_meal_type,
            "restaurantCode": restaurant_code,
            "mainDivRestaurantCode": restaurant_code,
        }

        try:
            response = requests.get(url, headers=headers, params=params)
            # print(response.url)
            # print(response.text)
            if response.status_code == 200:
                data = response.json().get("data", {})
                return {
                    "평균평점": round(data.get("MENU_GRADE_AVG", 0), 2),
                    "참여자수": data.get("TOT_CNT", 0),
                }
        except Exception as e:
            print(f"평점 조회 실패: {str(e)}")

        return {"평균평점": 0, "참여자수": 0}
    


    def _parse_menu(self, menu_data):
        """메뉴 데이터 파싱"""
        try:
            menu_items = []
            meal_list = menu_data.get("data", {}).get("mealList", [])

            # 기본적으로 최대 4개 항목만 처리하되, SELF 배식대가 나오면 중단
            count = 0
            for meal in meal_list:
                if count >= 4:  # 최대 4개까지만 처리
                    break

                if "T/O간편식DUMMY" in (meal.get("setName") or ""):
                    continue  # 해당 메뉴는 건너뜀

                # 코너가 "SELF 배식대"면 루프 종료
                course_txt = meal.get("courseTxt", "")
                if course_txt == "SELF 배식대":
                    break

                # 기본 메뉴 정보
                menu_name = meal.get("menuName", "")
                kcal = meal.get("sumKcal", "")
                sub_menu_txt = (meal.get("subMenuTxt") or "").split(",")

                # 이미지 URL 구성
                photo_url = meal.get("photoUrl", "")
                photo_cd = meal.get("photoCd", "")
                image_url = f"{photo_url}{photo_cd}" if photo_url and photo_cd else None

                # 평점 정보 조회
                rating_info = self.get_menu_rating(
                    meal.get("menuDt"),
                    meal.get("hallNo"),
                    meal.get("menuCourseType"),
                    meal.get("menuMealType"),
                    meal.get("restaurantCode"),
                )

                menu_info = {
                    "코너": course_txt,
                    "메뉴명": menu_name,
                    "칼로리": kcal,
                    "구성": sub_menu_txt,
                    "이미지": image_url,
                    "평균평점": rating_info["평균평점"],
                    "참여자수": rating_info["참여자수"],
                }
                menu_items.append(menu_info)
                count += 1  # 처리된 메뉴 카운트 증가

            # SELF 배식대 항목 찾기
            self_meal = None
            for meal in meal_list:
                if meal.get("courseTxt", "") == "SELF 배식대":
                    self_meal = meal
                    break

            # SELF 배식대 메뉴 추가
            if self_meal:
                # 기본 메뉴 정보
                course_txt = self_meal.get("courseTxt", "")
                menu_name = self_meal.get("menuName", "")
                kcal = self_meal.get("sumKcal", "")
                sub_menu_txt = self_meal.get("subMenuTxt", "").split(",")

                # 이미지 URL 구성
                photo_url = self_meal.get("photoUrl", "")
                photo_cd = self_meal.get("photoCd", "")
                image_url = f"{photo_url}{photo_cd}" if photo_url and photo_cd else None

                menu_info = {
                    "코너": course_txt,
                    "메뉴명": menu_name,
                    "칼로리": kcal,
                    "구성": sub_menu_txt,
                    "이미지": image_url,
                }
                menu_items.append(menu_info)

            # 라면 항목 찾기 (마이보글)
            ramen_meal = None
            for meal in meal_list:
                if meal.get("courseTxt", "") == "마이보글" or "[라면" in meal.get(
                    "menuName", ""
                ):
                    ramen_meal = meal
                    break

            # 라면 메뉴 추가
            if ramen_meal:
                # 기본 메뉴 정보
                course_txt = ramen_meal.get("courseTxt", "")
                menu_name = ramen_meal.get("menuName", "")
                kcal = ramen_meal.get("sumKcal", "")
                sub_menu_txt = ramen_meal.get("subMenuTxt", "").split(",")

                # 이미지 URL 구성
                photo_url = ramen_meal.get("photoUrl", "")
                photo_cd = ramen_meal.get("photoCd", "")
                image_url = f"{photo_url}{photo_cd}" if photo_url and photo_cd else None

                # 평점 정보 조회
                rating_info = self.get_menu_rating(
                    ramen_meal.get("menuDt"),
                    ramen_meal.get("hallNo"),
                    ramen_meal.get("menuCourseType"),
                    ramen_meal.get("menuMealType"),
                    ramen_meal.get("restaurantCode"),
                )

                menu_info = {
                    "코너": course_txt,
                    "메뉴명": menu_name,
                    "칼로리": kcal,
                    "구성": sub_menu_txt,
                    "이미지": image_url,
                    "평균평점": rating_info["평균평점"],
                    "참여자수": rating_info["참여자수"],
                }
                menu_items.append(menu_info)

            return {"점심": menu_items}
        except Exception as e:
            raise Exception(f"Failed to parse menu data: {str(e)}")



    