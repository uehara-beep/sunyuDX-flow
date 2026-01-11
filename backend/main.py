"""
sunyuDX-flow Backend API
S-BASE方式の完全実装版
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import openpyxl
from datetime import datetime
import uuid
import os
from pathlib import Path
import json

# FastAPIアプリケーション
app = FastAPI(
    title="sunyuDX-flow API",
    description="S-BASE方式の次世代建設DXプラットフォーム",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ディレクトリ設定
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# =====================================
# データモデル (Pydantic)
# =====================================

class CostItem(BaseModel):
    """原価項目"""
    id: str
    name: str
    quantity: float
    unit: str
    unit_price: float
    amount: float

class BudgetCategory(BaseModel):
    """予算カテゴリ（5科目）"""
    name: str
    items: List[CostItem]
    total: float

class Budget(BaseModel):
    """実行予算"""
    id: str
    project_name: str
    client_name: str
    material: BudgetCategory
    labor: BudgetCategory
    equipment: BudgetCategory
    subcontract: BudgetCategory
    expense: BudgetCategory
    budget_total: float
    profit_rate: float
    profit_amount: float
    estimate_amount: float
    created_at: datetime

class EstimateBreakdown(BaseModel):
    """見積内訳"""
    id: str
    sheet_name: str
    item_name: str
    amount: float

class Project(BaseModel):
    """工事プロジェクト"""
    id: str
    name: str
    client: str
    contract_amount: float
    budget_amount: float
    actual_cost: float
    profit_rate: float
    progress: float
    status: str  # active, warning, danger
    created_at: datetime

# =====================================
# インメモリデータストア（デモ用）
# =====================================

budgets_db: Dict[str, Budget] = {}
projects_db: Dict[str, Project] = {}

# =====================================
# ユーティリティ関数
# =====================================

def analyze_excel_file(file_path: Path) -> List[EstimateBreakdown]:
    """
    Excelファイルを解析して内訳明細を抽出
    S-BASE方式: 全シートをスキャンして自動抽出
    """
    breakdowns = []
    
    try:
        # openpyxlでExcelを開く
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # 全シートをスキャン
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            
            # キーワード検索: 「金額」「合計」「小計」を含む行を探す
            for row_idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=100), start=1):
                for cell in row:
                    if cell.value and isinstance(cell.value, str):
                        # 「○○工」や「○○費」などを検索
                        if any(keyword in cell.value for keyword in ['工', '費', '作業']):
                            # 同じ行の金額を探す
                            amount = None
                            for amt_cell in row:
                                if isinstance(amt_cell.value, (int, float)) and amt_cell.value > 1000:
                                    amount = float(amt_cell.value)
                                    break
                            
                            if amount:
                                breakdown = EstimateBreakdown(
                                    id=str(uuid.uuid4()),
                                    sheet_name=sheet_name,
                                    item_name=str(cell.value),
                                    amount=amount
                                )
                                breakdowns.append(breakdown)
                                break  # 同じ行で複数ヒットしないように
        
        # 重複を除去
        seen = set()
        unique_breakdowns = []
        for b in breakdowns:
            key = (b.sheet_name, b.item_name, b.amount)
            if key not in seen:
                seen.add(key)
                unique_breakdowns.append(b)
        
        return unique_breakdowns[:10]  # 最大10件
        
    except Exception as e:
        print(f"Excel解析エラー: {e}")
        return []

def classify_cost_item(item_name: str, amount: float) -> str:
    """
    AIによる原価分類（簡易版）
    本番環境ではClaude APIを使用
    """
    item_lower = item_name.lower()
    
    # キーワードベースの分類
    if any(word in item_lower for word in ['材料', '資材', '管', 'パイプ', 'コンクリート']):
        return 'material'
    elif any(word in item_lower for word in ['労務', '人工', '作業員', '技術者']):
        return 'labor'
    elif any(word in item_lower for word in ['機械', '重機', 'リース', 'クレーン']):
        return 'equipment'
    elif any(word in item_lower for word in ['外注', '下請', '業者']):
        return 'subcontract'
    else:
        return 'expense'

def generate_estimate_pdf(budget: Budget) -> Path:
    """
    見積書PDFを生成
    S-BASE方式: ReportLabを使用した高品質PDF
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    # 日本語フォント設定（システムにある場合）
    try:
        pdfmetrics.registerFont(TTFont('Japanese', '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf'))
    except:
        pass  # フォントがない場合はデフォルト
    
    # PDF出力パス
    pdf_path = OUTPUT_DIR / f"estimate_{budget.id}.pdf"
    
    # PDFドキュメント作成
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # タイトル
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=20,
    )
    story.append(Paragraph('見積書', title_style))
    story.append(Spacer(1, 10*mm))
    
    # プロジェクト情報
    info_data = [
        ['工事名', budget.project_name],
        ['発注者', budget.client_name],
        ['作成日', budget.created_at.strftime('%Y年%m月%d日')],
    ]
    info_table = Table(info_data, colWidths=[50*mm, 100*mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10*mm))
    
    # 金額サマリー
    summary_data = [
        ['実行予算合計', f'¥{budget.budget_total:,.0f}'],
        [f'粗利率 {budget.profit_rate}%', f'¥{budget.profit_amount:,.0f}'],
        ['見積金額', f'¥{budget.estimate_amount:,.0f}'],
    ]
    summary_table = Table(summary_data, colWidths=[80*mm, 70*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#0066cc')),
        ('TEXTCOLOR', (0, 2), (-1, 2), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 1), 14),
        ('FONTSIZE', (0, 2), (-1, 2), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10*mm))
    
    # 5科目内訳
    story.append(Paragraph('内訳明細', styles['Heading2']))
    story.append(Spacer(1, 5*mm))
    
    for category_name, category in [
        ('材料費', budget.material),
        ('労務費', budget.labor),
        ('機械費', budget.equipment),
        ('外注費', budget.subcontract),
        ('経費', budget.expense),
    ]:
        if category.total > 0:
            story.append(Paragraph(f'{category_name}: ¥{category.total:,.0f}', styles['Heading3']))
            
            if category.items:
                item_data = [['項目', '数量', '単位', '単価', '金額']]
                for item in category.items[:5]:  # 最大5件
                    item_data.append([
                        item.name,
                        f'{item.quantity:.1f}',
                        item.unit,
                        f'¥{item.unit_price:,.0f}',
                        f'¥{item.amount:,.0f}',
                    ])
                
                item_table = Table(item_data, colWidths=[60*mm, 20*mm, 20*mm, 30*mm, 30*mm])
                item_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(item_table)
            
            story.append(Spacer(1, 5*mm))
    
    # PDF生成
    doc.build(story)
    
    return pdf_path

# =====================================
# APIエンドポイント
# =====================================

@app.get("/")
async def root():
    """ヘルスチェック"""
    return {
        "status": "ok",
        "message": "sunyuDX-flow API is running",
        "version": "1.0.0"
    }

@app.post("/api/estimate/upload")
async def upload_estimate(file: UploadFile = File(...)):
    """
    見積書Excelをアップロードして解析
    """
    try:
        # ファイル保存
        file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Excel解析
        breakdowns = analyze_excel_file(file_path)
        
        # 一時ファイル削除
        file_path.unlink()
        
        return {
            "status": "success",
            "breakdowns": [b.dict() for b in breakdowns]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解析エラー: {str(e)}")

@app.post("/api/budget/create")
async def create_budget(budget: Budget):
    """
    実行予算を作成
    """
    try:
        # データベースに保存（デモ用）
        budgets_db[budget.id] = budget
        
        return {
            "status": "success",
            "budget_id": budget.id,
            "message": "実行予算を作成しました"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"作成エラー: {str(e)}")

@app.get("/api/budget/{budget_id}")
async def get_budget(budget_id: str):
    """
    実行予算を取得
    """
    if budget_id not in budgets_db:
        raise HTTPException(status_code=404, detail="予算が見つかりません")
    
    return budgets_db[budget_id].dict()

@app.post("/api/budget/{budget_id}/pdf")
async def generate_pdf(budget_id: str):
    """
    見積書PDFを生成
    """
    if budget_id not in budgets_db:
        raise HTTPException(status_code=404, detail="予算が見つかりません")
    
    try:
        budget = budgets_db[budget_id]
        pdf_path = generate_estimate_pdf(budget)
        
        return FileResponse(
            path=str(pdf_path),
            filename=f"estimate_{budget_id}.pdf",
            media_type="application/pdf"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF生成エラー: {str(e)}")

@app.get("/api/projects")
async def get_projects():
    """
    工事一覧を取得
    """
    # デモデータ
    demo_projects = [
        Project(
            id="1",
            name="広島自動車道工事",
            client="NEXCO西日本",
            contract_amount=15000000,
            budget_amount=12500000,
            actual_cost=10625000,
            profit_rate=18.5,
            progress=85,
            status="active",
            created_at=datetime.now()
        ),
        Project(
            id="2",
            name="○○市水道管工事",
            client="○○市水道局",
            contract_amount=8500000,
            budget_amount=7200000,
            actual_cost=7800000,
            profit_rate=4.7,
            progress=92,
            status="danger",
            created_at=datetime.now()
        ),
    ]
    
    return {
        "status": "success",
        "projects": [p.dict() for p in demo_projects]
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """
    ダッシュボード統計情報を取得
    """
    return {
        "active_projects": 23,
        "profit_margin": 18.5,
        "revenue": 125000000,
        "alerts": 2
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
