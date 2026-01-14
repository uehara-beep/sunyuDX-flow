#!/usr/bin/env python3
"""
12月原価補完スクリプト
欠けているカテゴリを仮データで補完

Usage:
    python scripts/fill_december_costs.py --dry-run  # 確認のみ
    python scripts/fill_december_costs.py --apply    # 実行
"""

import argparse
import os
import sys
from datetime import datetime
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load .env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(env_path) as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, val = line.strip().split('=', 1)
            os.environ[key] = val

from models import Project, CostRecord, Invoice

# 5分類
CATEGORIES = ['labor', 'subcontract', 'material', 'machine', 'expense']
CATEGORY_LABELS = {
    'labor': '労務費',
    'subcontract': '外注費',
    'material': '材料費',
    'machine': '機械費',
    'expense': '経費'
}


def get_december_target_projects(session):
    """12月対象プロジェクトを取得（請求or原価が1件でも存在）"""
    target_pids = set()

    # 12月請求があるプロジェクト
    invoices = session.query(Invoice).all()
    for inv in invoices:
        if inv.billing_month and '-12' in inv.billing_month:
            target_pids.add(inv.project_id)

    # 原価が1件でもあるプロジェクト（運用中とみなす）
    costs = session.query(CostRecord).all()
    for c in costs:
        target_pids.add(c.project_id)

    return target_pids


def analyze_missing_categories(session, project_ids):
    """欠けているカテゴリを分析"""
    results = []

    for pid in project_ids:
        project = session.query(Project).filter(Project.id == pid).first()
        if not project:
            continue

        # 既存カテゴリを取得
        costs = session.query(CostRecord).filter(CostRecord.project_id == pid).all()
        existing_cats = set(c.category for c in costs if c.category)

        # 欠けカテゴリ
        missing_cats = set(CATEGORIES) - existing_cats

        if missing_cats:
            results.append({
                'project_id': pid,
                'project_name': project.name,
                'existing': existing_cats,
                'missing': missing_cats
            })

    return results


def fill_missing_categories(session, analysis_results, apply=False):
    """欠けカテゴリを仮データで補完"""
    fill_stats = {cat: 0 for cat in CATEGORIES}
    filled_records = []

    # 12月31日を基準日とする
    cost_date = datetime(2024, 12, 31)

    for item in analysis_results:
        for cat in item['missing']:
            record = CostRecord(
                id=str(uuid.uuid4()),
                project_id=item['project_id'],
                category=cat,
                item_name=f"12月分 {CATEGORY_LABELS[cat]} 仮入力（後で修正）",
                amount=1,  # 0円不可の場合に備えて1円
                created_at=cost_date
            )

            filled_records.append({
                'project': item['project_name'],
                'category': cat,
                'label': CATEGORY_LABELS[cat],
                'amount': 1
            })
            fill_stats[cat] += 1

            if apply:
                session.add(record)

    if apply:
        session.commit()

    return fill_stats, filled_records


def main():
    parser = argparse.ArgumentParser(description='12月原価補完スクリプト')
    parser.add_argument('--dry-run', action='store_true', default=True, help='確認のみ')
    parser.add_argument('--apply', action='store_true', help='実行')
    args = parser.parse_args()

    engine = create_engine(os.environ["DATABASE_URL"])
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("=" * 60)
        print("  12月原価補完スクリプト")
        print("=" * 60)

        # 1. 対象プロジェクト抽出
        target_pids = get_december_target_projects(session)
        print(f"\n【対象プロジェクト】{len(target_pids)}件")

        for pid in target_pids:
            p = session.query(Project).filter(Project.id == pid).first()
            if p:
                print(f"  - {p.name}")

        # 2. 欠けカテゴリ分析
        analysis = analyze_missing_categories(session, target_pids)

        print(f"\n【欠けカテゴリ検出】{len(analysis)}件のプロジェクトに欠けあり")
        for item in analysis:
            print(f"\n  {item['project_name']}:")
            print(f"    既存: {', '.join(CATEGORY_LABELS[c] for c in item['existing']) or '(なし)'}")
            print(f"    欠け: {', '.join(CATEGORY_LABELS[c] for c in item['missing'])}")

        if not analysis:
            print("\n  → 全プロジェクトで5分類が揃っています。補完不要。")
            return

        # 3. 補完実行
        if args.apply:
            print("\n【補完実行中...】")
            stats, records = fill_missing_categories(session, analysis, apply=True)

            print("\n【補完完了】")
            print(f"  金額: 1円（仮入力）")
            print(f"  日付: 2024-12-31")
            print(f"\n  分類別件数:")
            for cat, count in stats.items():
                if count > 0:
                    print(f"    {CATEGORY_LABELS[cat]}: {count}件")
            print(f"\n  合計: {sum(stats.values())}件")

            # 検証
            print("\n【検証】")
            for pid in target_pids:
                p = session.query(Project).filter(Project.id == pid).first()
                costs = session.query(CostRecord).filter(CostRecord.project_id == pid).all()
                cats = set(c.category for c in costs if c.category)
                missing = set(CATEGORIES) - cats
                status = "✓ 完備" if not missing else f"✗ 欠け: {missing}"
                print(f"  {p.name}: {status}")
        else:
            print("\n【dry-run モード】")
            stats, records = fill_missing_categories(session, analysis, apply=False)

            print(f"\n  補完予定:")
            for cat, count in stats.items():
                if count > 0:
                    print(f"    {CATEGORY_LABELS[cat]}: {count}件")
            print(f"\n  合計: {sum(stats.values())}件（1円/件）")
            print("\n  実行するには --apply オプションを付けてください:")
            print("    python scripts/fill_december_costs.py --apply")

    finally:
        session.close()


if __name__ == "__main__":
    main()
