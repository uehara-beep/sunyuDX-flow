#!/bin/bash

# sunyuDX-flow 停止スクリプト

echo "🛑 sunyuDX-flow を停止中..."
echo ""

# カラー定義
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# PIDファイルから読み取り
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    echo -e "${RED}🛑 バックエンドサーバーを停止中 (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null
    rm .backend.pid
    echo -e "${GREEN}✅ バックエンドを停止しました${NC}"
else
    echo -e "${RED}⚠️  バックエンドのPIDファイルが見つかりません${NC}"
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    echo -e "${RED}🛑 フロントエンドサーバーを停止中 (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    rm .frontend.pid
    echo -e "${GREEN}✅ フロントエンドを停止しました${NC}"
else
    echo -e "${RED}⚠️  フロントエンドのPIDファイルが見つかりません${NC}"
fi

# 念のため、ポートを使用しているプロセスも停止
echo ""
echo -e "${RED}🔍 ポートを使用しているプロセスをチェック中...${NC}"

# port 8000 (backend)
BACKEND_PORT_PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PORT_PID" ]; then
    echo -e "${RED}   Port 8000を使用しているプロセスを停止: $BACKEND_PORT_PID${NC}"
    kill $BACKEND_PORT_PID 2>/dev/null
fi

# port 3000 (frontend)
FRONTEND_PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    echo -e "${RED}   Port 3000を使用しているプロセスを停止: $FRONTEND_PORT_PID${NC}"
    kill $FRONTEND_PORT_PID 2>/dev/null
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ すべて停止しました${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
