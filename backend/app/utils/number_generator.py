"""
番号採番ユーティリティ
見積番号・予算番号・請求番号の自動採番
"""
import sqlite3
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NumberGenerator:
    """番号採番クラス"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def generate_estimate_number(self) -> str:
        """
        見積番号を生成
        形式: SYT-YYYYMMDD-XXX
        
        Returns:
            str: 見積番号
        """
        return self._generate_number('estimate', 'SYT')
    
    def generate_budget_number(self) -> str:
        """
        予算番号を生成
        形式: BDG-YYYYMMDD-XXX
        
        Returns:
            str: 予算番号
        """
        return self._generate_number('budget', 'BDG')
    
    def generate_invoice_number(self) -> str:
        """
        請求番号を生成
        形式: INV-YYYYMMDD-XXX
        
        Returns:
            str: 請求番号
        """
        return self._generate_number('invoice', 'INV')
    
    def _generate_number(self, doc_type: str, prefix: str) -> str:
        """
        番号を生成（内部メソッド）
        
        Args:
            doc_type: ドキュメント種別（estimate/budget/invoice）
            prefix: プレフィックス（SYT/BDG/INV）
        
        Returns:
            str: 生成された番号
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 今日の日付
            today = datetime.now().strftime('%Y%m%d')
            
            # 今日の同種ドキュメント数を取得
            if doc_type == 'estimate':
                cursor.execute(
                    "SELECT COUNT(*) FROM estimates WHERE estimate_number LIKE ?",
                    (f"{prefix}-{today}-%",)
                )
            elif doc_type == 'budget':
                cursor.execute(
                    "SELECT COUNT(*) FROM budgets WHERE budget_number LIKE ?",
                    (f"{prefix}-{today}-%",)
                )
            elif doc_type == 'invoice':
                cursor.execute(
                    "SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE ?",
                    (f"{prefix}-{today}-%",)
                )
            else:
                raise ValueError(f"Invalid doc_type: {doc_type}")
            
            count = cursor.fetchone()[0]
            
            # 連番を生成
            sequence = count + 1
            
            # 番号を生成
            number = f"{prefix}-{today}-{sequence:03d}"
            
            logger.info(f"{doc_type}番号生成: {number}")
            
            return number
            
        finally:
            conn.close()
