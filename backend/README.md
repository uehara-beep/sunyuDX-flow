# SunyuTECH 見積・予算・請求管理システム

サンユウテック専用の見積書・予算書・請求書自動生成システム

## 🎯 機能

### ✅ 実装済み

1. **見積書自動生成**
   - 自社Excel見積をアップロード
   - KAKUSA形式（4シート）に自動変換
   - 見積番号自動採番（SYT-YYYYMMDD-XXX）
   - PDF出力対応

2. **データベース管理**
   - 見積・予算・請求データの永続化
   - 会社マスタ管理（住所・連絡先・銀行情報）
   - 見積一覧・検索機能

3. **Excel処理**
   - サンユウテック形式の見積Excelを自動解析
   - 表紙・内訳明細書の両シート対応
   - 数式自動設定・再計算

4. **KAKUSA帳票生成**
   - Sheet1: 御見積書
   - Sheet2: 内訳明細書
   - Sheet3: 実行予算内訳書
   - Sheet4: 請求明細書

## 📁 プロジェクト構成

```
backend/
├── app/
│   ├── main.py                 # FastAPIメインアプリケーション
│   ├── models/
│   │   └── estimate.py         # データモデル定義
│   ├── routers/
│   │   └── estimate.py         # 見積API
│   └── utils/
│       ├── excel_parser.py     # Excel解析
│       ├── kakusa_generator.py # KAKUSA生成
│       ├── pdf_converter.py    # PDF変換
│       ├── number_generator.py # 番号採番
│       └── estimate_db.py      # DB操作
├── docs/
│   └── db_schema_estimate.sql  # データベーススキーマ
├── recalc.py                   # 数式再計算スクリプト
├── test_integration.py         # 統合テスト
└── requirements.txt            # Python依存関係
```

## 🚀 セットアップ

### 1. 依存関係インストール

```bash
cd backend
pip install -r requirements.txt --break-system-packages
```

### 2. データベース初期化

```bash
python3 << 'EOF'
from app.utils.estimate_db import EstimateDB
db = EstimateDB("sunyuDX.db")
print("✅ データベース初期化完了")
EOF
```

### 3. サーバー起動

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API エンドポイント

### 見積管理

#### `POST /api/estimate/upload`
見積Excelをアップロードして解析

**リクエスト:**
```bash
curl -X POST http://localhost:8000/api/estimate/upload \
  -F "file=@見積.xlsx"
```

**レスポンス:**
```json
{
  "customer_name": "西九州ニチレキ工事株式会社",
  "project_name": "市道久原住宅常盤団地線交差点美装化工事",
  "subtotal": 340000,
  "tax_amount": 34000,
  "total_amount": 374000,
  "items": [...],
  "details": [...]
}
```

#### `POST /api/estimate/generate`
KAKUSA形式Excel/PDF生成

**リクエスト:**
```bash
curl -X POST http://localhost:8000/api/estimate/generate \
  -F "file=@見積.xlsx"
```

**レスポンス:**
```json
{
  "success": true,
  "estimate_id": "uuid",
  "estimate_number": "SYT-20260110-001",
  "excel_path": "/outputs/SYT-20260110-001_KAKUSA.xlsx",
  "pdf_path": "/outputs/SYT-20260110-001_KAKUSA.pdf",
  "message": "KAKUSA形式の見積を生成しました"
}
```

#### `GET /api/estimate/list`
見積一覧取得

#### `GET /api/estimate/{estimate_id}`
見積詳細取得

#### `GET /api/estimate/download/excel/{estimate_number}`
Excelダウンロード

#### `GET /api/estimate/download/pdf/{estimate_number}`
PDFダウンロード

### 会社マスタ

#### `GET /api/estimate/company`
会社情報取得

#### `PUT /api/estimate/company`
会社情報更新

## 🧪 テスト

### 統合テスト実行

```bash
python3 test_integration.py
```

### 動作確認

```bash
# 1. Excel解析テスト
python3 << 'EOF'
from app.utils.excel_parser import ExcelParser
parser = ExcelParser("見積.xlsx")
data = parser.parse()
print(f"顧客: {data.customer_name}")
print(f"金額: ¥{data.total_amount:,.0f}")
EOF

# 2. 見積番号生成テスト
python3 << 'EOF'
from app.utils.number_generator import NumberGenerator
gen = NumberGenerator("sunyuDX.db")
print(gen.generate_estimate_number())
EOF

# 3. KAKUSA生成テスト
python3 test_integration.py
```

## 📊 データベーススキーマ

### テーブル一覧

- `company_master` - 会社マスタ
- `estimates` - 見積
- `estimate_items` - 見積明細
- `estimate_details` - 内訳明細
- `budgets` - 予算
- `budget_items` - 予算明細
- `invoices` - 請求
- `invoice_items` - 請求明細

### 見積番号ルール

- **見積**: `SYT-YYYYMMDD-XXX`
- **予算**: `BDG-YYYYMMDD-XXX`
- **請求**: `INV-YYYYMMDD-XXX`

## 🎨 フロントエンド統合

### React連携例

```typescript
// 見積アップロード
const uploadEstimate = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/api/estimate/generate', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  console.log(result.estimate_number); // SYT-20260110-001
};

// Excel/PDFダウンロード
const downloadExcel = (estimateNumber: string) => {
  window.open(`http://localhost:8000/api/estimate/download/excel/${estimateNumber}`);
};

const downloadPDF = (estimateNumber: string) => {
  window.open(`http://localhost:8000/api/estimate/download/pdf/${estimateNumber}`);
};
```

## 🔧 トラブルシューティング

### Q1: 数式が計算されない

```bash
python3 recalc.py output.xlsx
```

### Q2: PDF変換が失敗する

```bash
# LibreOfficeが起動しているか確認
which soffice

# 手動変換
soffice --headless --convert-to pdf output.xlsx
```

### Q3: データベースエラー

```bash
# データベース再初期化
rm sunyuDX.db
python3 -c "from app.utils.estimate_db import EstimateDB; EstimateDB('sunyuDX.db')"
```

## 📝 今後の拡張

- [ ] プロジェクト連携（projects テーブル）
- [ ] 原価管理機能
- [ ] 請求書自動生成
- [ ] メール送信機能
- [ ] Excel テンプレートカスタマイズ
- [ ] 複数社対応

## 📄 ライセンス

Proprietary - 株式会社サンユウテック

## 👤 作成者

上原 拓 (Taku Uehara)
株式会社サンユウテック
