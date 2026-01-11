# sunyuTECH-DX クイックスタートガイド

## 起動方法（3ステップ）

### 1. PostgreSQL起動
```bash
brew services start postgresql@16
```

### 2. バックエンドAPI起動
```bash
cd ~/Downloads/sunyuDX-flow/backend
npm start
```
→ http://localhost:8000 で起動

### 3. フロントエンド表示
```bash
open ~/Downloads/sunyuDX-flow/frontend/public/login.html
```

---

## ログイン情報

| Email | パスワード | 権限 |
|-------|----------|------|
| admin@sunyutech.com | admin123 | 管理者 |
| manager@sunyutech.com | admin123 | マネージャー |
| user@sunyutech.com | admin123 | 一般 |

---

## 画面一覧

| 画面 | ファイル | 機能 |
|------|---------|------|
| ログイン | login.html | 認証 |
| 予算一覧 | budget-list.html | 一覧・検索・フィルタ |
| 予算作成 | budget-form.html | 新規予算登録 |
| 承認 | budget-approval.html | 承認ワークフロー |
| 出力 | budget-export.html | PDF/Excel出力 |
| ダッシュボード | dashboard-budget.html | KPI・グラフ |
| 商談 | meeting-records.html | 商談記録管理 |
| カンバン | project-kanban.html | 案件管理 |

---

## API エンドポイント

```
POST /api/auth/login      ログイン（JWT発行）
GET  /api/projects        プロジェクト一覧
GET  /api/budgets         予算一覧
POST /api/budgets         予算作成
GET  /api/meetings        商談一覧
GET  /api/dashboard/summary  ダッシュボード
```

---

## トラブルシューティング

### APIに接続できない
```bash
# サーバー状態確認
curl http://localhost:8000/
```

### DB接続エラー
```bash
# PostgreSQL起動確認
brew services list | grep postgresql
```

### ログインできない
- パスワード: `admin123`
- APIサーバーが起動しているか確認

---

## 停止方法

```bash
# Node.js停止
pkill -f "node.*server.js"

# PostgreSQL停止
brew services stop postgresql@16
```

---

最終更新: 2026-01-12
