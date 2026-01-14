#!/usr/bin/env python3
"""
ダミーデータ削除スクリプト
安全設計: dry-run（デフォルト）で確認後、--apply で実削除

Usage:
    python backend/scripts/cleanup_dummy.py --dry-run  # 削除対象を表示（デフォルト）
    python backend/scripts/cleanup_dummy.py --apply    # 実削除
"""

import argparse
import re
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, or_, func
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent.parent / ".env")

from models import (
    Project as ProjectModel,
    CostRecord as CostRecordModel,
    Invoice as InvoiceModel,
    DailyReport as DailyReportModel,
    DailyReportItem as DailyReportItemModel,
)

# ダミー判定パターン（大文字小文字無視）
DUMMY_PATTERNS = [
    r'test',
    r'demo',
    r'sample',
    r'dummy',
    r'テスト',
    r'デモ',
    r'サンプル',
]

# プロジェクトコードのダミーパターン
PROJECT_CODE_PATTERNS = [
    r'^TEST-',
    r'^DEMO-',
    r'^SAMPLE-',
]


def is_dummy_text(text: str) -> bool:
    """テキストがダミーパターンにマッチするか"""
    if not text:
        return False
    text_lower = text.lower()
    for pattern in DUMMY_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    return False


def is_dummy_project_code(code: str) -> bool:
    """プロジェクトコードがダミーパターンにマッチするか"""
    if not code:
        return False
    for pattern in PROJECT_CODE_PATTERNS:
        if re.match(pattern, code, re.IGNORECASE):
            return True
    return False


def get_dummy_projects(session):
    """ダミープロジェクトを取得"""
    projects = session.query(ProjectModel).all()
    dummy_projects = []

    for p in projects:
        if is_dummy_text(p.name) or is_dummy_text(p.client_name):
            dummy_projects.append(p)

    return dummy_projects


def get_related_records(session, project_ids: list):
    """プロジェクトに紐づく関連レコードを取得"""
    if not project_ids:
        return {
            'daily_report_items': [],
            'daily_reports': [],
            'cost_records': [],
            'invoices': [],
        }

    # Daily Reports
    daily_reports = session.query(DailyReportModel).filter(
        DailyReportModel.project_id.in_(project_ids)
    ).all()
    daily_report_ids = [dr.id for dr in daily_reports]

    # Daily Report Items
    daily_report_items = []
    if daily_report_ids:
        daily_report_items = session.query(DailyReportItemModel).filter(
            DailyReportItemModel.daily_report_id.in_(daily_report_ids)
        ).all()

    # Cost Records
    cost_records = session.query(CostRecordModel).filter(
        CostRecordModel.project_id.in_(project_ids)
    ).all()

    # Invoices
    invoices = session.query(InvoiceModel).filter(
        InvoiceModel.project_id.in_(project_ids)
    ).all()

    return {
        'daily_report_items': daily_report_items,
        'daily_reports': daily_reports,
        'cost_records': cost_records,
        'invoices': invoices,
    }


def print_summary(projects, related, mode="dry-run"):
    """削除対象のサマリーを表示"""
    print(f"\n{'='*60}")
    print(f"  ダミーデータ削除 [{mode.upper()}]")
    print(f"{'='*60}\n")

    # Projects
    print(f"[projects] {len(projects)} 件")
    for p in projects[:5]:  # 最大5件表示
        print(f"  - id: {p.id[:8]}... | name: {p.name} | created: {p.created_at}")
    if len(projects) > 5:
        print(f"  ... 他 {len(projects) - 5} 件")
    print()

    # Daily Report Items
    print(f"[daily_report_items] {len(related['daily_report_items'])} 件")

    # Daily Reports
    print(f"[daily_reports] {len(related['daily_reports'])} 件")
    for dr in related['daily_reports'][:3]:
        print(f"  - id: {dr.id[:8]}... | work_date: {dr.work_date} | foreman: {dr.foreman_name}")
    if len(related['daily_reports']) > 3:
        print(f"  ... 他 {len(related['daily_reports']) - 3} 件")
    print()

    # Cost Records
    print(f"[cost_records] {len(related['cost_records'])} 件")
    for cr in related['cost_records'][:3]:
        print(f"  - id: {cr.id[:8]}... | category: {cr.category} | amount: {cr.amount}")
    if len(related['cost_records']) > 3:
        print(f"  ... 他 {len(related['cost_records']) - 3} 件")
    print()

    # Invoices
    print(f"[invoices] {len(related['invoices'])} 件")
    for inv in related['invoices'][:3]:
        print(f"  - id: {inv.id[:8]}... | month: {inv.billing_month} | amount: {inv.amount}")
    if len(related['invoices']) > 3:
        print(f"  ... 他 {len(related['invoices']) - 3} 件")
    print()

    # Total
    total = (
        len(projects) +
        len(related['daily_report_items']) +
        len(related['daily_reports']) +
        len(related['cost_records']) +
        len(related['invoices'])
    )
    print(f"{'='*60}")
    print(f"  合計: {total} 件")
    print(f"{'='*60}\n")

    return {
        'projects': len(projects),
        'daily_report_items': len(related['daily_report_items']),
        'daily_reports': len(related['daily_reports']),
        'cost_records': len(related['cost_records']),
        'invoices': len(related['invoices']),
        'total': total,
    }


def delete_records(session, projects, related):
    """レコードを削除（FK順）"""
    counts = {}

    # 1. Daily Report Items
    for item in related['daily_report_items']:
        session.delete(item)
    counts['daily_report_items'] = len(related['daily_report_items'])
    print(f"[DELETE] daily_report_items: {counts['daily_report_items']} 件")

    # 2. Daily Reports
    for dr in related['daily_reports']:
        session.delete(dr)
    counts['daily_reports'] = len(related['daily_reports'])
    print(f"[DELETE] daily_reports: {counts['daily_reports']} 件")

    # 3. Cost Records
    for cr in related['cost_records']:
        session.delete(cr)
    counts['cost_records'] = len(related['cost_records'])
    print(f"[DELETE] cost_records: {counts['cost_records']} 件")

    # 4. Invoices
    for inv in related['invoices']:
        session.delete(inv)
    counts['invoices'] = len(related['invoices'])
    print(f"[DELETE] invoices: {counts['invoices']} 件")

    # 5. Projects（最後）
    for p in projects:
        session.delete(p)
    counts['projects'] = len(projects)
    print(f"[DELETE] projects: {counts['projects']} 件")

    session.commit()

    return counts


def main():
    parser = argparse.ArgumentParser(description='ダミーデータ削除スクリプト')
    parser.add_argument('--dry-run', action='store_true', default=True,
                        help='削除対象を表示するのみ（デフォルト）')
    parser.add_argument('--apply', action='store_true',
                        help='実際に削除を実行')
    args = parser.parse_args()

    # DB接続
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in .env")
        sys.exit(1)

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # ダミープロジェクトを取得
        dummy_projects = get_dummy_projects(session)
        project_ids = [p.id for p in dummy_projects]

        # 関連レコードを取得
        related = get_related_records(session, project_ids)

        if args.apply:
            # 実削除モード
            print_summary(dummy_projects, related, mode="APPLY - 実削除")

            if not dummy_projects and not any(related.values()):
                print("削除対象がありません。")
                return

            confirm = input("本当に削除しますか？ (yes/no): ")
            if confirm.lower() != 'yes':
                print("キャンセルしました。")
                return

            print("\n削除を実行中...\n")
            counts = delete_records(session, dummy_projects, related)

            print(f"\n{'='*60}")
            print("  削除完了")
            print(f"{'='*60}")
            for table, count in counts.items():
                print(f"  {table}: {count} 件削除")
            print(f"{'='*60}\n")
        else:
            # dry-runモード
            print_summary(dummy_projects, related, mode="DRY-RUN - 確認のみ")

            if dummy_projects or any(related.values()):
                print("実際に削除するには --apply オプションを付けて実行してください:")
                print("  python backend/scripts/cleanup_dummy.py --apply")
            else:
                print("削除対象のダミーデータはありません。")

    finally:
        session.close()


if __name__ == "__main__":
    main()
