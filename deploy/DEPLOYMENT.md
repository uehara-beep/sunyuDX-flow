# sunyuDX-flow デプロイメントガイド

## 概要

本ドキュメントはsunyuDX-flowの本番環境へのデプロイ手順を説明します。

## 推奨環境

- **OS**: Ubuntu 24.04 LTS
- **CPU**: 2+ vCPU
- **RAM**: 4GB+
- **Storage**: 50GB+ SSD
- **Python**: 3.11+
- **PostgreSQL**: 16+
- **Redis**: 7+
- **Nginx**: 1.24+

## 初期セットアップ

### 1. システム準備

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# 必要なパッケージをインストール
sudo apt install -y \
    git \
    curl \
    nginx \
    postgresql \
    redis-server \
    python3.11 \
    python3.11-venv \
    python3-pip \
    certbot \
    python3-certbot-nginx
```

### 2. ユーザー作成

```bash
# アプリケーション用ユーザー作成
sudo useradd -m -s /bin/bash sunyudx
sudo usermod -aG www-data sunyudx
```

### 3. ディレクトリ構成

```bash
# ディレクトリ作成
sudo mkdir -p /opt/sunyudx-flow
sudo mkdir -p /opt/backups/sunyudx
sudo mkdir -p /var/log/sunyudx
sudo mkdir -p /var/www/sunyudx-flow
sudo mkdir -p /var/www/certbot

# 権限設定
sudo chown -R sunyudx:sunyudx /opt/sunyudx-flow
sudo chown -R sunyudx:sunyudx /opt/backups/sunyudx
sudo chown -R sunyudx:sunyudx /var/log/sunyudx
sudo chown -R www-data:www-data /var/www/sunyudx-flow
```

### 4. コードの取得

```bash
sudo -u sunyudx git clone https://github.com/your-org/sunyudx-flow.git /opt/sunyudx-flow
```

### 5. Python環境セットアップ

```bash
cd /opt/sunyudx-flow/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 6. PostgreSQL設定

```bash
# PostgreSQLにログイン
sudo -u postgres psql

# データベースとユーザー作成
CREATE USER sunyudx_prod WITH PASSWORD 'your_secure_password';
CREATE DATABASE sunyutech_dx_prod OWNER sunyudx_prod;
GRANT ALL PRIVILEGES ON DATABASE sunyutech_dx_prod TO sunyudx_prod;
\q
```

### 7. Redis設定

```bash
# Redis設定ファイル編集
sudo nano /etc/redis/redis.conf

# 以下を設定:
# requirepass your_redis_password
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Redis再起動
sudo systemctl restart redis
```

### 8. 環境変数設定

```bash
# 環境変数ファイル作成
cp /opt/sunyudx-flow/deploy/.env.production.example /opt/sunyudx-flow/backend/.env.production

# 値を編集
nano /opt/sunyudx-flow/backend/.env.production
```

### 9. SSL証明書取得

```bash
# SSL設定スクリプト実行
sudo bash /opt/sunyudx-flow/deploy/scripts/setup-ssl.sh
```

### 10. Nginx設定

```bash
# Nginx設定をコピー
sudo cp /opt/sunyudx-flow/deploy/nginx/nginx.conf /etc/nginx/nginx.conf

# 設定テスト
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx
```

### 11. systemdサービス設定

```bash
# サービスファイルをコピー
sudo cp /opt/sunyudx-flow/deploy/sunyudx-api.service /etc/systemd/system/

# サービス有効化
sudo systemctl daemon-reload
sudo systemctl enable sunyudx-api
sudo systemctl start sunyudx-api
```

### 12. バックアップ設定（cron）

```bash
# crontab編集
sudo crontab -e

# 毎日午前2時にバックアップ実行
0 2 * * * /opt/sunyudx-flow/deploy/scripts/backup.sh >> /var/log/sunyudx/backup.log 2>&1
```

## デプロイ手順

### 通常デプロイ

```bash
sudo -u sunyudx bash /opt/sunyudx-flow/deploy/scripts/deploy.sh
```

### 手動デプロイ

```bash
cd /opt/sunyudx-flow

# コード更新
git pull origin main

# 依存関係更新
source backend/venv/bin/activate
pip install -r backend/requirements.txt

# サービス再起動
sudo systemctl restart sunyudx-api
sudo systemctl reload nginx
```

## 監視

### サービス状態確認

```bash
# APIサービス
sudo systemctl status sunyudx-api

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis
```

### ログ確認

```bash
# APIログ
tail -f /var/log/sunyudx/api.log

# Nginxアクセスログ
tail -f /var/log/nginx/access.log

# Nginxエラーログ
tail -f /var/log/nginx/error.log
```

### ヘルスチェック

```bash
curl http://localhost:8000/health
```

## トラブルシューティング

### APIが起動しない

```bash
# ログ確認
journalctl -u sunyudx-api -f

# 環境変数確認
cat /opt/sunyudx-flow/backend/.env.production
```

### データベース接続エラー

```bash
# PostgreSQL状態確認
sudo -u postgres psql -c "SELECT 1"

# 接続テスト
psql -h localhost -U sunyudx_prod -d sunyutech_dx_prod
```

### SSL証明書更新

```bash
# 手動更新
sudo certbot renew

# 証明書確認
sudo certbot certificates
```

## ロールバック

```bash
# 最新バックアップを確認
ls -la /opt/backups/sunyudx/

# ロールバック実行
sudo -u sunyudx bash /opt/sunyudx-flow/deploy/scripts/restore.sh /opt/backups/sunyudx/sunyudx-YYYYMMDD_HHMMSS
```

## セキュリティ

- 定期的なセキュリティアップデート実施
- SSH鍵認証のみ許可
- ファイアウォール設定（UFW）
- fail2banの導入
- 定期的なログ監視

```bash
# UFW設定
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

最終更新: 2026-01-11
バージョン: 1.0.0
