# LINE Bot module
# 環境変数が設定されていない場合はダミーモードで動作

import os

try:
    from linebot import LineBotApi, WebhookHandler
    from linebot.models import TextSendMessage

    CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN', '')
    CHANNEL_SECRET = os.getenv('LINE_CHANNEL_SECRET', '')

    if CHANNEL_ACCESS_TOKEN and CHANNEL_SECRET:
        line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)
        handler = WebhookHandler(CHANNEL_SECRET)
    else:
        # ダミーモード
        class DummyHandler:
            def handle(self, body, signature):
                print("[LINE Bot] ダミーモード: handle called")
            def add(self, event_type):
                def decorator(func):
                    return func
                return decorator

        class DummyLineBotApi:
            def push_message(self, user_id, message):
                print(f"[LINE Bot] ダミーモード: Push to {user_id}")

        handler = DummyHandler()
        line_bot_api = DummyLineBotApi()
        print("[LINE Bot] 環境変数未設定のためダミーモードで起動")

except ImportError:
    # line-bot-sdkがインストールされていない場合
    class DummyHandler:
        def handle(self, body, signature):
            pass
        def add(self, event_type):
            def decorator(func):
                return func
            return decorator

    class DummyLineBotApi:
        def push_message(self, user_id, message):
            print(f"[LINE Bot Mock] Push to {user_id}")

    handler = DummyHandler()
    line_bot_api = DummyLineBotApi()
