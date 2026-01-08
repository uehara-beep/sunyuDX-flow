# sunyuDX-flow

Excel工程表をそのままWeb化し、
見積 → 予算 → 工程 → 原価 → 差異 を一気通関で管理するDX基盤。

## コンセプト
- 工程表が主役
- 手入力スタート禁止（Excel / PDF 起点）
- 色ルール固定（夜間=黄色 / 人材不足=赤）
- 請負外注は人数管理しない（数量のみ）

## 機能
- 工程表（週⇄月、Excelライク）
- 見積 → 予算明細 自動展開
- 請求OCR（失敗前提の逃げ道あり）
- 原価5分類（労務/外注/材料/機械/経費）

## 技術構成
- Frontend: React (Vite)
- Backend: FastAPI
- DB: SQLite（PostgreSQL移行可）

## 起動方法
```bash
# backend
cd backend
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
npm run dev
```
