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
- Frontend: React (Vite) + TypeScript
- Backend: FastAPI (Python 3.14)
- DB: PostgreSQL 16 (SQLite fallback)

## 起動方法

### 1. PostgreSQL起動
```bash
brew services start postgresql@16
```

### 2. バックエンド起動
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

ヘルスチェック確認:
```bash
curl http://localhost:8000/health
# {"status":"ok","service":"sunyuDX-flow API","version":"1.0.0"}

curl http://localhost:8000/health/db
# {"status":"ok","database":"connected"}
```

### 3. フロントエンド起動
```bash
cd frontend
npm install  # 初回のみ
npm run dev
```

ブラウザで http://localhost:3000 （または表示されたポート）にアクセス

## API エンドポイント

| Method | Path | 説明 |
|--------|------|------|
| GET | /health | ヘルスチェック |
| GET | /health/db | データベース接続確認 |
| GET | /api/projects | プロジェクト一覧 |
| GET | /api/budgets | 予算一覧 |
| POST | /api/budgets | 予算作成 |
| POST | /api/upload/estimate | 見積Excel取込 |

## 停止方法

```bash
# プロセス停止
pkill -f "uvicorn main:app"

# PostgreSQL停止（オプション）
brew services stop postgresql@16
```

## ディレクトリ構成

```
sunyuDX-flow/
├── backend/
│   ├── main.py          # FastAPIアプリケーション
│   ├── database.py      # DB接続設定
│   ├── models.py        # SQLAlchemyモデル
│   ├── requirements.txt # Python依存関係
│   ├── venv/            # Python仮想環境
│   ├── database/
│   │   └── schema.sql   # DBスキーマ
│   └── _trash_node/     # 隔離: Node.jsファイル
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # メインコンポーネント
│   │   ├── api.ts       # API呼び出し
│   │   └── components/  # UIコンポーネント
│   ├── public/
│   └── _trash_html/     # 隔離: 静的HTMLファイル
└── README.md
```

---

## ダミーデータ削除

テスト/デモデータを安全に削除するスクリプト

```bash
# 確認（dry-run）
cd backend
source venv/bin/activate
python scripts/cleanup_dummy.py --dry-run

# 実削除
python scripts/cleanup_dummy.py --apply
```

**判定条件:**
- name/note に `test`, `demo`, `sample`, `dummy`, `テスト`, `デモ`, `サンプル` が含まれる
- 削除順: daily_report_items → daily_reports → cost_records → invoices → projects

---

## 12月分入力ルール（運用）

### 原価入力
| 項目 | ルール |
|------|--------|
| 日付 | 12/31 で統一 |
| カテゴリ | 5分類（労務費/外注費/材料費/機械費/経費） |
| メモ | 「12月分 ○○まとめ」形式 |

**カテゴリ対応表:**
| 内部値 | 表示 |
|--------|------|
| labor | 労務費 |
| subcontract | 外注費 |
| material | 材料費 |
| machine | 機械費 |
| expense | 経費 |

### 売上（請求）入力
- billing_month: `2024-12`
- status: `issued`（発行済）で登録
- 入金確認後に `paid` に変更

### 入力フロー
1. プロジェクト作成（工事名・施主名）
2. 見積登録 → 受注（ordered）に変更 → 売上に反映
3. 原価入力（5分類 × 12/31）
4. 請求登録（issued）
5. サマリーで売上・原価・粗利を確認

---

## 月次締め（ロック）- 未実装

### 運用ルール
- 締め: 毎月5日（前月分をロック）
- ロック実行: 上原
- ロック解除: 森社長判断のみ（理由必須）

---

## LINE通知

### テストAPI
```bash
curl -X POST http://localhost:8000/api/notify/test
```

### 環境変数（.env）
```
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_ADMIN_USER_ID=xxx
```
