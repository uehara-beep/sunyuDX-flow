# sunyuDX-flow 完全要件定義書

**作成日**: 2026年1月11日  
**バージョン**: 2.0（整理版）  
**GitHub**: https://github.com/uehara-beep/sunyuDX-flow.git

---

## 📋 目次

1. [システム概要](#1-システム概要)
2. [4部門構成](#2-4部門構成)
3. [画面設計](#3-画面設計)
4. [API設計](#4-api設計)
5. [データベース設計](#5-データベース設計)
6. [外部連携](#6-外部連携)
7. [実装状況](#7-実装状況)
8. [次のアクション](#8-次のアクション)

---

## 1. システム概要

### 1.1 目的
株式会社サンユウテックの建設業務をDX化する次世代原価管理システム

### 1.2 コンセプト
- **Stripe級のUX** - 美しく使いやすいUI
- **痒いところに手が届く** - 建設業特化
- **5年先を行く** - AI・外部連携

### 1.3 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + TypeScript |
| バックエンド | FastAPI (Python) |
| データベース | SQLite（開発）/ PostgreSQL（本番） |
| AI | Claude API |
| 外部連携 | LINE Messaging API |

---

## 2. 4部門構成

### 2.1 ホーム画面デザイン

```
┌─────────────────────────────────────────────────────────────┐
│  sunyuTECHの未来を創る                                      │
│  Stripe級のUX。建設会社のイメージを塗り替える               │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│  📊 営業（ブルー #0066cc） │  │  🏗️ 工事（オレンジ #FF6B00）│
│  ├ 見積書アップロード     │  │  ├ 工事台帳              │
│  ├ 実行予算作成           │  │  ├ 日報入力              │
│  └ 案件一覧               │  │  └ 原価入力              │
│                           │  │                          │
│  [営業部屋へ →]           │  │  [工事部屋へ →]          │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│  📋 事務（グリーン #10b981）│  │  📈 経営（パープル #8b5cf6）│
│  ├ 勤怠管理               │  │  ├ ダッシュボード         │
│  ├ 経費精算               │  │  ├ 利益率分析            │
│  └ 請求書管理             │  │  └ AI秘書                │
│                           │  │                          │
│  [事務部屋へ →]           │  │  [経営部屋へ →]          │
└──────────────────────────┘  └──────────────────────────┘
```

### 2.2 各部門の機能詳細

#### 📊 営業部門（ブルー）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 見積書アップロード | Excel/PDF読み込み、内訳抽出 | ⭐⭐⭐ |
| 実行予算作成 | 5科目で予算作成、PDF/Excel出力 | ⭐⭐⭐ |
| 案件一覧 | 見積中/受注済/完了の管理 | ⭐⭐ |

#### 🏗️ 工事部門（オレンジ）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 工事台帳 | 進行中工事の一覧、進捗管理 | ⭐⭐⭐ |
| 日報入力 | 写真付き日報、LINE連携 | ⭐⭐ |
| 原価入力 | 5科目（材料/労務/外注/機械/経費）| ⭐⭐⭐ |

#### 📋 事務部門（グリーン）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 勤怠管理 | 出勤/退勤、残業管理 | ⭐ |
| 経費精算 | レシートOCR、承認フロー | ⭐ |
| 請求書管理 | 発行/入金管理 | ⭐ |

#### 📈 経営部門（パープル）
| 機能 | 説明 | 優先度 |
|------|------|--------|
| ダッシュボード | KPI表示、リアルタイム統計 | ⭐⭐ |
| 利益率分析 | 工事別/月別の分析 | ⭐⭐ |
| AI秘書 | 音声質問、自動回答 | ⭐ |

---

## 3. 画面設計

### 3.1 画面一覧

| パス | 画面名 | 部門 | 実装状況 |
|------|--------|------|----------|
| `/` | ホーム（4部門カード） | - | 🔧 要修正 |
| `/sales` | 営業部屋 | 営業 | ❌ 未実装 |
| `/sales/estimate` | 見積書アップロード | 営業 | ✅ 実装済 |
| `/sales/budget` | 実行予算作成 | 営業 | ✅ 実装済 |
| `/sales/projects` | 案件一覧 | 営業 | ❌ 未実装 |
| `/construction` | 工事部屋 | 工事 | ❌ 未実装 |
| `/construction/ledger` | 工事台帳 | 工事 | ✅ 実装済 |
| `/construction/daily` | 日報入力 | 工事 | ✅ 実装済 |
| `/construction/cost` | 原価入力 | 工事 | ✅ 実装済 |
| `/office` | 事務部屋 | 事務 | ❌ 未実装 |
| `/management` | 経営部屋 | 経営 | ❌ 未実装 |
| `/management/dashboard` | ダッシュボード | 経営 | ❌ 未実装 |

### 3.2 デザインシステム

#### カラーパレット
```css
/* 部門カラー */
--sales-blue: #0066cc;
--construction-orange: #FF6B00;
--office-green: #10b981;
--management-purple: #8b5cf6;

/* 背景 */
--bg-dark: #0a2540;
--bg-card: rgba(255, 255, 255, 0.05);
--bg-card-hover: rgba(255, 255, 255, 0.08);

/* テキスト */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.6);
```

#### フォント
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

---

## 4. API設計

### 4.1 営業API

```
POST   /api/estimate/upload      見積書アップロード
GET    /api/estimate/{id}        見積書取得
POST   /api/budget/create        実行予算作成
GET    /api/budget/{id}          実行予算取得
POST   /api/budget/{id}/pdf      PDF出力
POST   /api/budget/{id}/excel    Excel出力
```

### 4.2 工事API

```
GET    /api/projects             工事一覧
GET    /api/projects/{id}        工事詳細
POST   /api/projects             工事作成
PUT    /api/projects/{id}        工事更新
POST   /api/daily-report         日報作成
POST   /api/cost                 原価入力
GET    /api/cost/{project_id}    原価一覧
```

### 4.3 統計API

```
GET    /api/dashboard/stats      ダッシュボード統計
GET    /api/dashboard/alerts     アラート一覧
```

### 4.4 LINE API

```
POST   /webhook/line             LINE Webhook受信
```

---

## 5. データベース設計

### 5.1 テーブル一覧

```sql
-- 工事プロジェクト
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT,
    contract_amount INTEGER,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 実行予算
CREATE TABLE budgets (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    material INTEGER DEFAULT 0,      -- 材料費
    labor INTEGER DEFAULT 0,         -- 労務費
    outsource INTEGER DEFAULT 0,     -- 外注費
    machine INTEGER DEFAULT 0,       -- 機械費
    expense INTEGER DEFAULT 0,       -- 経費
    total INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 原価記録
CREATE TABLE costs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    category TEXT NOT NULL,          -- 材料費/労務費/外注費/機械費/経費
    description TEXT,
    amount INTEGER NOT NULL,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日報
CREATE TABLE daily_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    report_date DATE NOT NULL,
    weather TEXT,
    content TEXT,
    photo_urls TEXT,                 -- JSON配列
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 見積書
CREATE TABLE estimates (
    id TEXT PRIMARY KEY,
    project_name TEXT,
    file_name TEXT,
    breakdowns TEXT,                 -- JSON: 内訳明細
    total_amount INTEGER,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. 外部連携

### 6.1 LINE連携（後で詳細設定）

| 機能 | 説明 |
|------|------|
| 日報送信 | LINEから日報テキスト送信 |
| 工事写真 | LINEから写真アップロード |
| 原価入力 | LINEから簡易入力 |
| 通知受信 | アラート・リマインダー |

### 6.2 将来の連携（優先度低）

- 会計ソフト（freee/弥生）
- CAD連携
- 気象データ

---

## 7. 実装状況

### 7.1 完了済み

- [x] フロントエンド基盤（React + TypeScript）
- [x] ダークブルーUIデザイン
- [x] HomePage（components版）
- [x] BudgetCreation（実行予算作成）
- [x] EstimateUpload（見積書アップロード）
- [x] ProjectList（工事台帳）
- [x] CostInput（原価入力）
- [x] DailyReport（日報入力）
- [x] バックエンド基盤（FastAPI）
- [x] GitHub連携

### 7.2 要修正

- [ ] ホーム画面を4部門カードに変更
- [ ] 各ページのCSSレイアウト修正
- [ ] Excel読み込み機能（S-BASE方式）

### 7.3 未実装

- [ ] 部門別ルーティング
- [ ] ダッシュボード
- [ ] LINE連携
- [ ] AI機能

---

## 8. 次のアクション

### 8.1 今すぐやること

1. **GitHubにプッシュ**
   ```bash
   cd ~/Downloads/sunyuDX-flow
   git add .
   git commit -m "要件定義整理、ダークブルーUI完成"
   git push origin main
   ```

2. **ホーム画面を4部門カードに修正**
   - HomePage.tsxを修正
   - 部門別カラー適用

3. **Excel読み込み機能修正**
   - S-BASEの読み取りロジック移植
   - 条件書スキップ
   - 列認識改善

### 8.2 今週中

- 各部門の部屋ページ作成
- ルーティング整理
- API接続

### 8.3 来週以降

- LINE連携設定
- ダッシュボード実装
- AI機能追加

---

## 📝 メモ

### S-BASE Excel読み込みの問題点（要修正）
- 条件書のテキストが予算明細に入る
- 列の認識がうまくいかない
- → S-BASEの最新仕様に合わせて修正が必要

### LINE連携について
- 詳細はたくから指示を待つ
- 基本機能は準備済み

---

*最終更新: 2026年1月11日*
