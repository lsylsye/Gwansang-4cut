import requests
from app.config import settings


def send_to_multi_mattermost(text: str):
    """여러 Mattermost 채널에 메시지 전송"""
    payload = {"text": text}

    for path in settings.MATTERMOST_WEBHOOK_PATHS:
        webhook_url = f"{settings.MATTERMOST_BASE_URL}{path}"
        try:
            response = requests.post(webhook_url, json=payload)
            print(f"✅ 전송 상태({path}):", response.status_code)
        except Exception as e:
            print(f"❌ 전송 실패({path}): {e}")


def send_to_mattermost(text: str, webhook_path: str = None):
    """단일 Mattermost 채널에 메시지 전송"""
    payload = {"text": text}
    
    if webhook_path:
        webhook_url = f"{settings.MATTERMOST_BASE_URL}{webhook_path}"
    else:
        # 첫 번째 웹훅 경로 사용
        webhook_url = f"{settings.MATTERMOST_BASE_URL}{settings.MATTERMOST_WEBHOOK_PATHS[0]}"
    
    try:
        response = requests.post(webhook_url, json=payload)
        print(f"✅ 전송 상태: {response.status_code}")
        return response.status_code
    except Exception as e:
        print(f"❌ 전송 실패: {e}")
        return None
