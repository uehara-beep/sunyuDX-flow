#!/bin/bash

# sunyuDX-flow 完全版起動スクリプト
# S-BASE方式統合版

echo "🚀 sunyuDX-flow 起動中..."
echo ""

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. バックエンド起動
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Phase 1: バックエンド起動${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd backend

# 仮想環境確認
if [ ! -d "venv" ]; then
    echo -e "${ORANGE}⚠️  仮想環境が見つかりません。作成します...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ 仮想環境を作成しました${NC}"
fi

# 仮想環境アクティベート
echo -e "${BLUE}🔧 仮想環境をアクティベート中...${NC}"
source venv/bin/activate

# 依存関係インストール
echo -e "${BLUE}📥 依存関係をインストール中...${NC}"
pip install -q -r requirements.txt
echo -e "${GREEN}✅ 依存関係のインストール完了${NC}"
echo ""

# データベース初期化
echo -e "${BLUE}🗄️  データベース初期化中...${NC}"
python3 << EOF
from database import init_db
try:
    init_db()
    print("${GREEN}✅ データベースを初期化しました${NC}")
except Exception as e:
    print(f"${ORANGE}⚠️  データベース初期化: {e}${NC}")
EOF
echo ""

# バックエンドサーバー起動（バックグラウンド）
echo -e "${GREEN}🚀 バックエンドサーバーを起動中...${NC}"
python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ バックエンド起動完了 (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}   → http://localhost:8000${NC}"
echo ""

cd ..

# 2. フロントエンド起動
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Phase 2: フロントエンド起動${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd frontend

# node_modules確認
if [ ! -d "node_modules" ]; then
    echo -e "${ORANGE}⚠️  node_modulesが見つかりません。インストールします...${NC}"
    npm install
    echo -e "${GREEN}✅ npm install完了${NC}"
fi

# フロントエンド起動
echo -e "${GREEN}🚀 フロントエンドサーバーを起動中...${NC}"
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ フロントエンド起動完了 (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}   → http://localhost:3000${NC}"
echo ""

cd ..

# 3. 起動完了
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 sunyuDX-flow 起動完了！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 アクセス先:${NC}"
echo -e "   ${GREEN}フロントエンド: http://localhost:3000${NC}"
echo -e "   ${BLUE}バックエンドAPI: http://localhost:8000${NC}"
echo -e "   ${ORANGE}API Doc: http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}📊 プロセス情報:${NC}"
echo -e "   Backend PID: $BACKEND_PID"
echo -e "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 ログファイル:${NC}"
echo -e "   Backend: backend.log"
echo -e "   Frontend: frontend.log"
echo ""
echo -e "${RED}⚠️  停止するには: ./stop.sh または Ctrl+C${NC}"
echo ""

# プロセスIDを保存
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# ユーザー入力待機
echo -e "${ORANGE}Press Ctrl+C to stop all servers...${NC}"
wait
