"""
見積API
見積・予算・請求の作成、アップロード、生成機能を提供
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.models.estimate import (
    Estimate, EstimateCreate, ParsedEstimateData, GenerateResponse,
    EstimateItem, EstimateDetail
)
from app.utils.excel_parser import ExcelParser
from app.utils.kakusa_generator import KakusaExcelGenerator
from app.utils.pdf_converter import convert_excel_to_pdf, recalculate_formulas
from app.utils.number_generator import NumberGenerator
from app.utils.estimate_db import EstimateDB
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/estimate", tags=["estimate"])

# パス設定
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
DB_PATH = str(BASE_DIR / "sunyuDX.db")

# ディレクトリが存在しない場合は作成
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ユーティリティ初期化
number_gen = NumberGenerator(DB_PATH)
estimate_db = EstimateDB(DB_PATH)


@router.post("/upload", response_model=ParsedEstimateData)
async def upload_estimate(file: UploadFile = File(...)):
    """
    見積Excelファイルをアップロードして解析
    
    Args:
        file: アップロードファイル
    
    Returns:
        ParsedEstimateData: 解析されたデータ
    """
    try:
        # ファイル保存
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        temp_path = UPLOAD_DIR / f"temp_{file_id}{file_ext}"
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"ファイルアップロード: {file.filename}")
        
        # Excel解析
        parser = ExcelParser(str(temp_path))
        parsed_data = parser.parse()
        parser.close()
        
        # 一時ファイル削除
        # os.remove(temp_path)  # デバッグ時はコメントアウト
        
        return parsed_data
        
    except Exception as e:
        logger.error(f"アップロードエラー: {e}")
        raise HTTPException(status_code=500, detail=f"アップロードエラー: {str(e)}")


@router.post("/generate", response_model=GenerateResponse)
async def generate_kakusa(file: UploadFile = File(...)):
    """
    見積ExcelをアップロードしてKAKUSA形式を生成
    
    Args:
        file: アップロードファイル
    
    Returns:
        GenerateResponse: 生成結果
    """
    try:
        # 1. ファイル保存
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        source_path = UPLOAD_DIR / f"source_{file_id}{file_ext}"
        
        with open(source_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"ファイルアップロード: {file.filename}")
        
        # 2. Excel解析
        parser = ExcelParser(str(source_path))
        parsed_data = parser.parse()
        parser.close()
        
        # 3. 見積番号生成
        estimate_number = number_gen.generate_estimate_number()
        estimate_id = str(uuid.uuid4())
        estimate_date = datetime.now().strftime('%Y年%m月%d日')
        
        # 4. 見積データ作成
        estimate = Estimate(
            id=estimate_id,
            estimate_number=estimate_number,
            estimate_date=estimate_date,
            customer_name=parsed_data.customer_name,
            project_name=parsed_data.project_name,
            project_location=parsed_data.project_location,
            project_period_from=None,
            project_period_to=None,
            valid_period=parsed_data.valid_period or "3ヵ月",
            payment_terms=parsed_data.payment_terms or "出来高現金払 現金100％",
            waste_notice=parsed_data.waste_notice,
            special_notes=parsed_data.special_notes,
            staff_name=parsed_data.staff_name or "上原 拓",
            subtotal=parsed_data.subtotal,
            tax_rate=0.1,
            tax_amount=parsed_data.tax_amount,
            total_amount=parsed_data.total_amount,
            status='draft',
            source_file_path=str(source_path),
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            items=parsed_data.items,
            details=parsed_data.details
        )
        
        # 5. データベース保存
        estimate_db.create_estimate(estimate)
        logger.info(f"見積保存: {estimate_number}")
        
        # 6. 会社マスタ取得
        company = estimate_db.get_company('company_001')
        if not company:
            raise HTTPException(status_code=500, detail="会社マスタが見つかりません")
        
        # 7. KAKUSA形式Excel生成
        excel_filename = f"{estimate_number}_KAKUSA.xlsx"
        excel_path = OUTPUT_DIR / excel_filename
        
        generator = KakusaExcelGenerator(company)
        generator.generate(estimate, str(excel_path))
        logger.info(f"KAKUSA Excel生成: {excel_path}")
        
        # 8. 数式再計算
        if not recalculate_formulas(str(excel_path)):
            logger.warning("数式再計算に失敗しました")
        
        # 9. PDF変換
        pdf_filename = f"{estimate_number}_KAKUSA.pdf"
        pdf_path = OUTPUT_DIR / pdf_filename
        
        if not convert_excel_to_pdf(str(excel_path), str(pdf_path)):
            logger.warning("PDF変換に失敗しました")
        
        return GenerateResponse(
            success=True,
            estimate_id=estimate_id,
            estimate_number=estimate_number,
            excel_path=str(excel_path),
            pdf_path=str(pdf_path),
            message=f"KAKUSA形式の見積を生成しました: {estimate_number}"
        )
        
    except Exception as e:
        logger.error(f"生成エラー: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"生成エラー: {str(e)}")


@router.get("/list")
async def list_estimates(limit: int = 100, offset: int = 0):
    """
    見積一覧を取得
    
    Args:
        limit: 取得件数
        offset: オフセット
    
    Returns:
        List[Estimate]: 見積リスト
    """
    try:
        estimates = estimate_db.list_estimates(limit, offset)
        return {"estimates": estimates, "total": len(estimates)}
        
    except Exception as e:
        logger.error(f"一覧取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"一覧取得エラー: {str(e)}")


@router.get("/{estimate_id}")
async def get_estimate(estimate_id: str):
    """
    見積詳細を取得
    
    Args:
        estimate_id: 見積ID
    
    Returns:
        Estimate: 見積データ
    """
    try:
        estimate = estimate_db.get_estimate(estimate_id)
        
        if not estimate:
            raise HTTPException(status_code=404, detail="見積が見つかりません")
        
        return estimate
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"見積取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"見積取得エラー: {str(e)}")


@router.get("/download/excel/{estimate_number}")
async def download_excel(estimate_number: str):
    """
    Excelファイルをダウンロード
    
    Args:
        estimate_number: 見積番号
    
    Returns:
        FileResponse: Excelファイル
    """
    try:
        excel_path = OUTPUT_DIR / f"{estimate_number}_KAKUSA.xlsx"
        
        if not excel_path.exists():
            raise HTTPException(status_code=404, detail="ファイルが見つかりません")
        
        return FileResponse(
            path=str(excel_path),
            filename=excel_path.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ダウンロードエラー: {e}")
        raise HTTPException(status_code=500, detail=f"ダウンロードエラー: {str(e)}")


@router.get("/download/pdf/{estimate_number}")
async def download_pdf(estimate_number: str):
    """
    PDFファイルをダウンロード
    
    Args:
        estimate_number: 見積番号
    
    Returns:
        FileResponse: PDFファイル
    """
    try:
        pdf_path = OUTPUT_DIR / f"{estimate_number}_KAKUSA.pdf"
        
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="ファイルが見つかりません")
        
        return FileResponse(
            path=str(pdf_path),
            filename=pdf_path.name,
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ダウンロードエラー: {e}")
        raise HTTPException(status_code=500, detail=f"ダウンロードエラー: {str(e)}")


@router.get("/company")
async def get_company():
    """
    会社マスタを取得
    
    Returns:
        CompanyMaster: 会社マスタ
    """
    try:
        company = estimate_db.get_company('company_001')
        
        if not company:
            raise HTTPException(status_code=404, detail="会社マスタが見つかりません")
        
        return company
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"会社マスタ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"会社マスタ取得エラー: {str(e)}")


@router.put("/company")
async def update_company(company: dict):
    """
    会社マスタを更新
    
    Args:
        company: 会社マスタ
    
    Returns:
        dict: 更新結果
    """
    try:
        from app.models.estimate import CompanyMaster
        
        company_data = CompanyMaster(**company)
        estimate_db.update_company(company_data)
        
        return {"success": True, "message": "会社マスタを更新しました"}
        
    except Exception as e:
        logger.error(f"会社マスタ更新エラー: {e}")
        raise HTTPException(status_code=500, detail=f"会社マスタ更新エラー: {str(e)}")
