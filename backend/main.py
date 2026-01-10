"""
sunyuDX-flow Backend API
S-BASE方式の完全実装版
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
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
from linebot.exceptions import InvalidSignatureError
from line_bot import handler, line_bot_api

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
    from sbase_excel_reader import extract_from_excel
    
    try:
        # S-BASE方式でExcelを解析
        result = extract_from_excel(str(file_path))
        
        breakdowns = []
        for item in result.get('items', []):
            breakdown = EstimateBreakdown(
                id=item['id'],
                sheet_name=item['sheet_name'],
                item_name=item['item_name'],
                amount=item['amount']
            )
            breakdowns.append(breakdown)
        
        return breakdowns
        
    except Exception as e:
        print(f"S-BASE Excel解析エラー: {e}")
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
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    
    # 日本語フォント設定
    try:
        # IPAフォント（Linuxで一般的）
        pdfmetrics.registerFont(TTFont('Japanese', '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'))
        font_name = 'Japanese'
    except:
        try:
            # ヒラギノ（macOS）
            pdfmetrics.registerFont(TTFont('Japanese', '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc'))
            font_name = 'Japanese'
        except:
            try:
                # UnicodeCIDFont（フォールバック）
                pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
                font_name = 'HeiseiMin-W3'
            except:
                # 最終フォールバック
                font_name = 'Helvetica'
    
    # PDF出力パス
    pdf_path = OUTPUT_DIR / f"estimate_{budget.id}.pdf"
    
    # PDFドキュメント作成
    doc = SimpleDocTemplate(
        str(pdf_path), 
        pagesize=A4,
        topMargin=20*mm,
        bottomMargin=20*mm,
        leftMargin=20*mm,
        rightMargin=20*mm
    )
    story = []
    styles = getSampleStyleSheet()
    
    # カスタムスタイル
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=20,
        fontName=font_name,
        alignment=1,  # 中央揃え
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#0066cc'),
        spaceAfter=10,
        fontName=font_name,
    )
    
    # タイトル
    story.append(Paragraph('見積書', title_style))
    story.append(Spacer(1, 10*mm))
    
    # プロジェクト情報
    info_data = [
        ['工事名', budget.project_name],
        ['発注者', budget.client_name],
        ['作成日', budget.created_at.strftime('%Y年%m月%d日')],
    ]
    info_table = Table(info_data, colWidths=[50*mm, 120*mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
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
    summary_table = Table(summary_data, colWidths=[80*mm, 90*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#0066cc')),
        ('TEXTCOLOR', (0, 2), (-1, 2), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, 1), 14),
        ('FONTSIZE', (0, 2), (-1, 2), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15*mm))
    
    # 5科目内訳
    story.append(Paragraph('内訳明細', heading_style))
    story.append(Spacer(1, 5*mm))
    
    for category_name, category in [
        ('材料費', budget.material),
        ('労務費', budget.labor),
        ('機械費', budget.equipment),
        ('外注費', budget.subcontract),
        ('経費', budget.expense),
    ]:
        if category.total > 0:
            # カテゴリータイトル
            cat_para = Paragraph(
                f'{category_name}: ¥{category.total:,.0f}',
                ParagraphStyle(
                    'CategoryTitle',
                    parent=styles['Heading3'],
                    fontSize=12,
                    textColor=colors.HexColor('#FF6B00'),
                    fontName=font_name,
                )
            )
            story.append(cat_para)
            story.append(Spacer(1, 3*mm))
            
            if category.items:
                item_data = [['項目', '数量', '単位', '単価', '金額']]
                for item in category.items[:10]:  # 最大10件
                    item_data.append([
                        item.name[:20],  # 20文字まで
                        f'{item.quantity:.1f}',
                        item.unit,
                        f'¥{item.unit_price:,.0f}',
                        f'¥{item.amount:,.0f}',
                    ])
                
                item_table = Table(item_data, colWidths=[50*mm, 20*mm, 20*mm, 35*mm, 40*mm])
                item_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), font_name),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(item_table)
            
            story.append(Spacer(1, 5*mm))
    
    # フッター
    story.append(Spacer(1, 10*mm))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        fontName=font_name,
        alignment=1,
    )
    story.append(Paragraph('株式会社サンユウテック', footer_style))
    story.append(Paragraph('sunyuDX-flow で生成', footer_style))
    
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
    S-BASE方式: キーワード検索で柔軟に対応
    """
    try:
        # ファイル保存
        file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # S-BASE方式でExcel解析
        from sbase_excel_reader import extract_from_excel
        result = extract_from_excel(str(file_path))
        
        # 内訳明細をEstimateBreakdownに変換
        breakdowns = []
        for item in result.get('items', []):
            breakdown = EstimateBreakdown(
                id=item['id'],
                sheet_name=item['sheet_name'],
                item_name=item['item_name'],
                amount=item['amount']
            )
            breakdowns.append(breakdown)
        
        # 一時ファイルは残しておく（後で使うかも）
        # file_path.unlink()
        
        return {
            "status": "success",
            "project_name": result['project_name'],
            "client_name": result['client_name'],
            "location": result['location'],
            "amount": result['amount'],
            "sheets": result['sheets'],
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

@app.post("/api/budget/{budget_id}/excel")
async def generate_excel(budget_id: str):
    """
    実行予算書Excelを生成
    """
    if budget_id not in budgets_db:
        raise HTTPException(status_code=404, detail="予算が見つかりません")
    
    try:
        budget = budgets_db[budget_id]
        
        # Budgetオブジェクトを辞書に変換
        budget_dict = {
            'id': budget.id,
            'project_name': budget.project_name,
            'client_name': budget.client_name,
            'material': {'items': [item.dict() for item in budget.material.items], 'total': budget.material.total},
            'labor': {'items': [item.dict() for item in budget.labor.items], 'total': budget.labor.total},
            'equipment': {'items': [item.dict() for item in budget.equipment.items], 'total': budget.equipment.total},
            'subcontract': {'items': [item.dict() for item in budget.subcontract.items], 'total': budget.subcontract.total},
            'expense': {'items': [item.dict() for item in budget.expense.items], 'total': budget.expense.total},
            'budget_total': budget.budget_total,
            'profit_rate': budget.profit_rate,
            'profit_amount': budget.profit_amount,
            'estimate_amount': budget.estimate_amount,
        }
        
        from excel_generator import generate_budget_excel
        excel_path = OUTPUT_DIR / f"budget_{budget_id}.xlsx"
        generate_budget_excel(budget_dict, str(excel_path))
        
        return FileResponse(
            path=str(excel_path),
            filename=f"budget_{budget_id}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel生成エラー: {str(e)}")

@app.get("/api/projects/excel")
async def export_projects_excel():
    """
    工事台帳一覧をExcel出力
    """
    try:
        # デモデータ
        demo_projects = [
            {
                "id": "1",
                "name": "広島自動車道工事",
                "client": "NEXCO西日本",
                "contract_amount": 15000000,
                "budget_amount": 12500000,
                "actual_cost": 10625000,
                "profit_rate": 0.185,
                "progress": 0.85,
                "status": "active",
            },
            {
                "id": "2",
                "name": "○○市水道管工事",
                "client": "○○市水道局",
                "contract_amount": 8500000,
                "budget_amount": 7200000,
                "actual_cost": 7800000,
                "profit_rate": 0.047,
                "progress": 0.92,
                "status": "danger",
            },
        ]
        
        from excel_generator import generate_project_list_excel
        excel_path = OUTPUT_DIR / f"projects_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        generate_project_list_excel(demo_projects, str(excel_path))
        
        return FileResponse(
            path=str(excel_path),
            filename=excel_path.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel生成エラー: {str(e)}")

# =====================================
# Claude AI Integration
# =====================================

@app.post("/api/ai/classify")
async def ai_classify_item(item_name: str, amount: float):
    """
    AIで原価項目を5科目に自動分類
    """
    try:
        from claude_ai import classify_cost_item_ai
        result = classify_cost_item_ai(item_name, amount)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分類エラー: {str(e)}")

@app.post("/api/ai/suggest")
async def ai_suggest_budget(budget_data: Dict[str, Any]):
    """
    AIで実行予算の改善提案を生成
    """
    try:
        from claude_ai import suggest_budget_improvements_ai
        # 過去データ（デモ用）
        historical_data = [
            {'material_ratio': 0.35, 'labor_ratio': 0.25},
            {'material_ratio': 0.38, 'labor_ratio': 0.22},
        ]
        suggestions = suggest_budget_improvements_ai(budget_data, historical_data)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI提案エラー: {str(e)}")

@app.post("/api/ai/analyze-risk")
async def ai_analyze_risk(project_data: Dict[str, Any]):
    """
    AIでプロジェクトのリスク分析
    """
    try:
        from claude_ai import analyze_project_risk_ai
        result = analyze_project_risk_ai(project_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AIリスク分析エラー: {str(e)}")

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

# =====================================
# LINE Bot Webhook
# =====================================

@app.post("/webhook/line")
async def line_webhook(request: Request):
    """
    LINE Messaging API Webhook
    """
    # X-Line-Signatureヘッダーを取得
    signature = request.headers.get('X-Line-Signature', '')
    
    # リクエストボディを取得
    body = await request.body()
    body_str = body.decode('utf-8')
    
    # 署名検証してイベントを処理
    try:
        handler.handle(body_str, signature)
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    return {"status": "ok"}

@app.post("/api/line/push")
async def send_line_push(user_id: str, message: str):
    """
    LINEプッシュメッセージを送信
    """
    try:
        from linebot.models import TextSendMessage
        line_bot_api.push_message(user_id, TextSendMessage(text=message))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"送信エラー: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
