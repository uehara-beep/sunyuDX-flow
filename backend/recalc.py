"""
Excel数式再計算スクリプト
LibreOfficeを使用してExcelの数式を再計算
"""
import sys
import subprocess
import os
import json
import tempfile
from pathlib import Path


def recalculate_excel(excel_path: str) -> dict:
    """
    Excelファイルの数式を再計算
    
    Args:
        excel_path: Excelファイルパス
    
    Returns:
        dict: 実行結果
    """
    if not os.path.exists(excel_path):
        return {
            "status": "error",
            "message": f"ファイルが見つかりません: {excel_path}"
        }
    
    try:
        # LibreOfficeで開いて保存（数式再計算）
        result = subprocess.run([
            'soffice',
            '--headless',
            '--invisible',
            '--nologo',
            '--nofirststartwizard',
            '--convert-to', 'xlsx',
            '--outdir', os.path.dirname(excel_path),
            excel_path
        ], check=True, capture_output=True, text=True, timeout=30)
        
        return {
            "status": "success",
            "message": "数式を再計算しました",
            "file": excel_path
        }
        
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "message": "タイムアウトしました"
        }
    except subprocess.CalledProcessError as e:
        return {
            "status": "error",
            "message": f"実行エラー: {e.stderr}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"エラー: {str(e)}"
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "使用方法: python recalc.py <excel_file>"
        }))
        sys.exit(1)
    
    excel_path = sys.argv[1]
    result = recalculate_excel(excel_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if result["status"] == "error":
        sys.exit(1)
