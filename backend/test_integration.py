"""
見積システム統合テスト
実際のExcelファイルを使って全フローをテスト
"""
import sys
sys.path.append('/home/claude/backend')

from app.utils.excel_parser import ExcelParser
from app.utils.kakusa_generator import KakusaExcelGenerator
from app.utils.estimate_db import EstimateDB
from app.utils.number_generator import NumberGenerator
from app.models.estimate import Estimate
from datetime import datetime
import uuid

print("=" * 60)
print("見積システム統合テスト")
print("=" * 60)

# 1. データベース初期化
print("\n[1] データベース初期化...")
db = EstimateDB("/home/claude/backend/test_estimate.db")
print("✅ 完了")

# 2. 会社マスタ取得
print("\n[2] 会社マスタ取得...")
company = db.get_company('company_001')
print(f"✅ 会社名: {company.company_name}")

# 3. Excel解析
print("\n[3] Excel解析...")
excel_path = "/mnt/user-data/uploads/市道久原住宅常盤団地線交差点美装化工事.xlsx"
parser = ExcelParser(excel_path)
parsed_data = parser.parse()
parser.close()

print(f"✅ 解析完了")
print(f"   顧客: {parsed_data.customer_name}")
print(f"   工事: {parsed_data.project_name}")
print(f"   明細: {len(parsed_data.items)}件")
print(f"   内訳: {len(parsed_data.details)}件")

# 4. 見積番号生成
print("\n[4] 見積番号生成...")
num_gen = NumberGenerator("/home/claude/backend/test_estimate.db")
estimate_number = num_gen.generate_estimate_number()
print(f"✅ 見積番号: {estimate_number}")

# 5. 見積データ作成
print("\n[5] 見積データ作成...")
estimate_id = str(uuid.uuid4())
estimate = Estimate(
    id=estimate_id,
    estimate_number=estimate_number,
    estimate_date=datetime.now().strftime('%Y年%m月%d日'),
    customer_name=parsed_data.customer_name,
    project_name=parsed_data.project_name,
    project_location=parsed_data.project_location,
    valid_period=parsed_data.valid_period or "3ヵ月",
    payment_terms=parsed_data.payment_terms or "出来高現金払 現金100％",
    waste_notice=parsed_data.waste_notice,
    special_notes=parsed_data.special_notes,
    staff_name=parsed_data.staff_name or "上原 拓",
    subtotal=340000,  # テストデータ
    tax_rate=0.1,
    tax_amount=34000,
    total_amount=374000,
    status='draft',
    source_file_path=excel_path,
    created_at=datetime.now().isoformat(),
    updated_at=datetime.now().isoformat(),
    items=parsed_data.items if parsed_data.items else [{
        "item_number": 1,
        "item_name": "研掃工",
        "specification": "内訳書別添え",
        "quantity": 1.0,
        "unit": "式",
        "unit_price": 340000,
        "amount": 340000,
        "remarks": None
    }],
    details=parsed_data.details
)
print(f"✅ 完了")

# 6. データベース保存
print("\n[6] データベース保存...")
db.create_estimate(estimate)
print(f"✅ 保存完了: {estimate_number}")

# 7. KAKUSA Excel生成
print("\n[7] KAKUSA Excel生成...")
output_path = f"/mnt/user-data/outputs/{estimate_number}_KAKUSA.xlsx"
generator = KakusaExcelGenerator(company)
generator.generate(estimate, output_path)
print(f"✅ 生成完了: {output_path}")

# 8. 結果表示
print("\n" + "=" * 60)
print("✅ 全テスト完了！")
print("=" * 60)
print(f"\n生成されたファイル:")
print(f"  📄 {output_path}")
print(f"\nデータベース:")
print(f"  💾 /home/claude/backend/test_estimate.db")
print(f"\n見積番号: {estimate_number}")
print(f"見積ID: {estimate_id}")
