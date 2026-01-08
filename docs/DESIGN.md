# sunyuDX-flow 設計書（概要）

## システム構成
- Frontend: React (Vite)
- Backend: FastAPI
- DB: SQLite → PostgreSQL移行可
- OCR: Azure Form Recognizer
- 通知: LINE WORKS

## 中核エンティティ
- Project（現場）
- ScheduleEntry（工程）
- Assignment（配置）
- BudgetLine（予算）
- CostEntry（原価）
- SubcontractOrder（外注）
- Invoice（請求）

## 状態判定
- 人材不足:
  required_crew NOT NULL AND 社員配置数 < required_crew
- 夜間:
  is_night = true
