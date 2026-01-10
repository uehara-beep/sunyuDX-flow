# 📝 既存アプリへの統合手順

## ✅ 完了した作業

### 1. バックエンド
- `/home/claude/sunyuDX-flow/backend/` にコード配置完了
- データベース・API・ユーティリティすべて準備完了

### 2. フロントエンド
- `/home/claude/sunyuDX-flow/frontend/src/components/EstimateUpload.tsx` 作成完了

---

## 🔧 次にやること（統合作業）

### Step 1: App.tsxに追加

既存の `frontend/src/App.tsx` を開いて、以下を追加：

```tsx
import { EstimateUpload } from './components/EstimateUpload';

// 既存のルーティングに追加
<Route path="/estimate-upload" element={<EstimateUpload />} />
```

### Step 2: メニューに追加

既存のナビゲーションメニューに以下を追加：

```tsx
<Link to="/estimate-upload">
  見積→予算
</Link>
```

---

## 🚀 ローカル起動手順

### バックエンド起動

```bash
cd ~/sunyuDX-flow/backend
pip install -r requirements.txt --break-system-packages
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### フロントエンド起動

```bash
cd ~/sunyuDX-flow/frontend
npm install
npm run dev
```

---

## 📡 動作確認

1. ブラウザで http://localhost:5173/estimate-upload にアクセス
2. Excelファイルをアップロード
3. 「KAKUSA形式で生成」をクリック
4. Excel/PDFをダウンロード

---

## 🗄️ データベース

データは `/home/claude/sunyuDX-flow/backend/sunyuDX.db` に保存されます。

---

## 🔗 GitHubへのプッシュ（デプロイ用）

```bash
cd ~/sunyuDX-flow
git add .
git commit -m "feat: 見積→予算 KAKUSA形式生成機能追加"
git push origin main
```

→ Railwayが自動でデプロイ開始

---

## ✨ 機能一覧

### 利用可能なAPIエンドポイント

- `POST /api/estimate/upload` - 見積解析
- `POST /api/estimate/generate` - KAKUSA生成
- `GET /api/estimate/list` - 見積一覧
- `GET /api/estimate/{id}` - 見積詳細
- `GET /api/estimate/download/excel/{number}` - Excelダウンロード
- `GET /api/estimate/download/pdf/{number}` - PDFダウンロード
- `GET /api/estimate/company` - 会社情報取得
- `PUT /api/estimate/company` - 会社情報更新

---

## 📋 生成されるファイル

### KAKUSA形式Excel（4シート）

1. **御見積書** - タイトル・顧客・金額・明細
2. **内訳明細書** - 詳細明細・諸経費・法定福利費
3. **実行予算内訳書** - 予算・粗利・費用分類
4. **請求明細書** - 請求金額・振込先

---

## 🎯 次の拡張（オプション）

### フロントエンド追加機能
- [ ] 見積一覧画面
- [ ] 見積詳細・編集画面
- [ ] プレビュー機能
- [ ] 会社マスタ設定画面

### バックエンド追加機能
- [ ] プロジェクト連携
- [ ] 原価管理
- [ ] メール送信
- [ ] 検索・フィルター

---

## ❓ トラブルシューティング

### バックエンドが起動しない
```bash
# ポート確認
lsof -i :8000
# プロセスkill
kill -9 <PID>
```

### フロントエンドがバックエンドに接続できない
- CORS設定確認: `backend/app/main.py` のallow_origins
- URLが正しいか確認: `http://localhost:8000`

### データベースエラー
```bash
# DB再初期化
cd ~/sunyuDX-flow/backend
rm sunyuDX.db
python3 -c "from app.utils.estimate_db import EstimateDB; EstimateDB('sunyuDX.db')"
```

---

## 📞 サポート

質問があれば、いつでも聞いてください！
