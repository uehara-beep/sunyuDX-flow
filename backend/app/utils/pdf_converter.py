"""
PDF変換ユーティリティ
LibreOfficeを使用してExcelをPDFに変換
"""
import subprocess
import os
import logging

logger = logging.getLogger(__name__)


def convert_excel_to_pdf(excel_path: str, pdf_path: str) -> bool:
    """
    ExcelファイルをPDFに変換
    
    Args:
        excel_path: Excelファイルパス
        pdf_path: 出力PDFファイルパス
    
    Returns:
        bool: 成功したらTrue
    """
    try:
        logger.info(f"PDF変換開始: {excel_path} -> {pdf_path}")
        
        # 出力ディレクトリを取得
        output_dir = os.path.dirname(pdf_path)
        
        # LibreOfficeでPDF変換
        result = subprocess.run([
            'soffice',
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', output_dir,
            excel_path
        ], check=True, capture_output=True, text=True)
        
        logger.info(f"PDF変換完了: {pdf_path}")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"PDF変換エラー: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"PDF変換エラー: {e}")
        return False


def recalculate_formulas(excel_path: str) -> bool:
    """
    Excelファイルの数式を再計算
    
    Args:
        excel_path: Excelファイルパス
    
    Returns:
        bool: 成功したらTrue
    """
    try:
        logger.info(f"数式再計算開始: {excel_path}")
        
        # recalc.pyスクリプトを実行
        result = subprocess.run([
            'python',
            'recalc.py',
            excel_path
        ], check=True, capture_output=True, text=True, cwd='/home/claude/backend')
        
        logger.info(f"数式再計算完了: {excel_path}")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"数式再計算エラー: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"数式再計算エラー: {e}")
        return False
