FROM python:3.11-slim

WORKDIR /app

# 依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# データベース初期化とサーバー起動
CMD python -c "from app.db import init_db; init_db()" && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
