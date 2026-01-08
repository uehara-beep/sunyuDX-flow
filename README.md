# sunyuDX-flow (v1.0)

目的：見積（Excel/PDF取込）→ 受注→ 工事台帳→ 工程表（週⇄月/配置/赤黄/詳細）→ 日報→ 原価（OCR逃げ道）→ 外注（注文請書/請求突合）を一気通貫。

## 起動（ローカル）
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windowsは .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (Vite + React)
```bash
cd frontend
npm i
npm run dev
```

フロントは http://localhost:5173  
APIは http://localhost:8000

## 仕様の核（固定）
- 配色：青・オレンジ・グレージュ白
- 工程表：週⇄月（PCはボタン、スマホはスワイプ想定）
- 状態色：夜間=黄色、人材不足=赤（請負は赤判定しない）
- 外注表示：常用は人数表示、請負は人数なし（数量のみ）
- クリック時：右側Drawerに詳細パネル（項目固定）
- OCR失敗時の逃げ道：現場/項目/数量or金額の最小入力で原価化

## 次の実装（必要なら）
- 見積PDF/Excelの実取込（Azure Document Intelligence + xlsx）
- LINE WORKS通知の実接続
- 外注PDF帳票テンプレ
- 権限/監査ログ
