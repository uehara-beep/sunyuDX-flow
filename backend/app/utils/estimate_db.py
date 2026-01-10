"""
見積データベース操作クラス
"""
import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List
from app.models.estimate import (
    Estimate, EstimateItem, EstimateDetail, EstimateCreate,
    CompanyMaster, Budget, BudgetItem, Invoice, InvoiceItem
)
import logging

logger = logging.getLogger(__name__)


class EstimateDB:
    """見積データベース操作クラス"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """データベース初期化"""
        from pathlib import Path
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # スキーマファイルを読み込んで実行
            base_dir = Path(__file__).resolve().parent.parent.parent
            schema_path = base_dir / 'docs' / 'db_schema_estimate.sql'
            if schema_path.exists():
                with open(schema_path, 'r', encoding='utf-8') as f:
                    schema = f.read()
                    cursor.executescript(schema)
            else:
                # スキーマファイルがない場合は基本テーブルを作成
                logger.warning(f"Schema file not found at {schema_path}, creating basic tables")
                self._create_basic_tables(cursor)
            
            conn.commit()
            logger.info("データベース初期化完了")
            
        except Exception as e:
            logger.error(f"データベース初期化エラー: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    # ==========================================
    # 会社マスタ
    # ==========================================
    
    def get_company(self, company_id: str = 'company_001') -> Optional[CompanyMaster]:
        """
        会社マスタを取得
        
        Args:
            company_id: 会社ID
        
        Returns:
            CompanyMaster: 会社マスタ
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM company_master WHERE id = ?", (company_id,))
            row = cursor.fetchone()
            
            if row:
                return CompanyMaster(**dict(row))
            return None
            
        finally:
            conn.close()
    
    def update_company(self, company: CompanyMaster):
        """
        会社マスタを更新
        
        Args:
            company: 会社マスタ
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE company_master SET
                    company_name = ?,
                    postal_code = ?,
                    address = ?,
                    tel = ?,
                    fax = ?,
                    representative = ?,
                    bank_name = ?,
                    bank_branch = ?,
                    bank_account_type = ?,
                    bank_account_number = ?,
                    bank_account_name = ?,
                    registration_number = ?,
                    logo_path = ?,
                    updated_at = datetime('now', 'localtime')
                WHERE id = ?
            """, (
                company.company_name,
                company.postal_code,
                company.address,
                company.tel,
                company.fax,
                company.representative,
                company.bank_name,
                company.bank_branch,
                company.bank_account_type,
                company.bank_account_number,
                company.bank_account_name,
                company.registration_number,
                company.logo_path,
                company.id
            ))
            
            conn.commit()
            logger.info(f"会社マスタ更新: {company.id}")
            
        finally:
            conn.close()
    
    # ==========================================
    # 見積
    # ==========================================
    
    def create_estimate(self, estimate: Estimate) -> str:
        """
        見積を作成
        
        Args:
            estimate: 見積データ
        
        Returns:
            str: 見積ID
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 見積本体を挿入
            cursor.execute("""
                INSERT INTO estimates (
                    id, estimate_number, estimate_date, customer_name, project_name,
                    project_location, project_period_from, project_period_to,
                    valid_period, payment_terms, waste_notice, special_notes,
                    staff_name, subtotal, tax_rate, tax_amount, total_amount,
                    status, source_file_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                estimate.id,
                estimate.estimate_number,
                estimate.estimate_date,
                estimate.customer_name,
                estimate.project_name,
                estimate.project_location,
                estimate.project_period_from,
                estimate.project_period_to,
                estimate.valid_period,
                estimate.payment_terms,
                estimate.waste_notice,
                estimate.special_notes,
                estimate.staff_name,
                estimate.subtotal,
                estimate.tax_rate,
                estimate.tax_amount,
                estimate.total_amount,
                estimate.status,
                estimate.source_file_path
            ))
            
            # 見積明細を挿入
            for item in estimate.items:
                item_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO estimate_items (
                        id, estimate_id, item_number, item_name, specification,
                        quantity, unit, unit_price, amount, remarks
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item_id,
                    estimate.id,
                    item.item_number,
                    item.item_name,
                    item.specification,
                    item.quantity,
                    item.unit,
                    item.unit_price,
                    item.amount,
                    item.remarks
                ))
            
            # 内訳明細を挿入
            for detail in estimate.details:
                detail_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO estimate_details (
                        id, estimate_id, category, item_name, specification,
                        quantity, unit, unit_price, amount, remarks, item_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    detail_id,
                    estimate.id,
                    detail.category,
                    detail.item_name,
                    detail.specification,
                    detail.quantity,
                    detail.unit,
                    detail.unit_price,
                    detail.amount,
                    detail.remarks,
                    detail.item_order
                ))
            
            conn.commit()
            logger.info(f"見積作成: {estimate.estimate_number}")
            
            return estimate.id
            
        except Exception as e:
            logger.error(f"見積作成エラー: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def get_estimate(self, estimate_id: str) -> Optional[Estimate]:
        """
        見積を取得
        
        Args:
            estimate_id: 見積ID
        
        Returns:
            Estimate: 見積データ
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            # 見積本体を取得
            cursor.execute("SELECT * FROM estimates WHERE id = ?", (estimate_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            estimate_dict = dict(row)
            
            # 見積明細を取得
            cursor.execute(
                "SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY item_number",
                (estimate_id,)
            )
            items = [EstimateItem(**dict(r)) for r in cursor.fetchall()]
            
            # 内訳明細を取得
            cursor.execute(
                "SELECT * FROM estimate_details WHERE estimate_id = ? ORDER BY item_order",
                (estimate_id,)
            )
            details = [EstimateDetail(**dict(r)) for r in cursor.fetchall()]
            
            estimate_dict['items'] = items
            estimate_dict['details'] = details
            
            return Estimate(**estimate_dict)
            
        finally:
            conn.close()
    
    def list_estimates(self, limit: int = 100, offset: int = 0) -> List[Estimate]:
        """
        見積一覧を取得
        
        Args:
            limit: 取得件数
            offset: オフセット
        
        Returns:
            List[Estimate]: 見積リスト
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM estimates
                ORDER BY estimate_date DESC, created_at DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))
            
            estimates = []
            for row in cursor.fetchall():
                estimate_dict = dict(row)
                estimate_id = estimate_dict['id']
                
                # 見積明細を取得
                cursor.execute(
                    "SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY item_number",
                    (estimate_id,)
                )
                items = [EstimateItem(**dict(r)) for r in cursor.fetchall()]
                
                # 内訳明細を取得
                cursor.execute(
                    "SELECT * FROM estimate_details WHERE estimate_id = ? ORDER BY item_order",
                    (estimate_id,)
                )
                details = [EstimateDetail(**dict(r)) for r in cursor.fetchall()]
                
                estimate_dict['items'] = items
                estimate_dict['details'] = details
                
                estimates.append(Estimate(**estimate_dict))
            
            return estimates
            
        finally:
            conn.close()
    
    # ==========================================
    # 予算
    # ==========================================
    
    def create_budget(self, budget: Budget) -> str:
        """
        予算を作成
        
        Args:
            budget: 予算データ
        
        Returns:
            str: 予算ID
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 予算本体を挿入
            cursor.execute("""
                INSERT INTO budgets (
                    id, estimate_id, budget_number, budget_date,
                    budget_amount, initial_contract_amount, change_amount,
                    contract_amount, expected_profit, expected_profit_rate, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                budget.id,
                budget.estimate_id,
                budget.budget_number,
                budget.budget_date,
                budget.budget_amount,
                budget.initial_contract_amount,
                budget.change_amount,
                budget.contract_amount,
                budget.expected_profit,
                budget.expected_profit_rate,
                budget.status
            ))
            
            # 予算明細を挿入
            for item in budget.items:
                item_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO budget_items (
                        id, budget_id, cost_category, item_name, specification,
                        quantity, unit, unit_price, amount, vendor_name
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item_id,
                    budget.id,
                    item.cost_category,
                    item.item_name,
                    item.specification,
                    item.quantity,
                    item.unit,
                    item.unit_price,
                    item.amount,
                    item.vendor_name
                ))
            
            conn.commit()
            logger.info(f"予算作成: {budget.budget_number}")
            
            return budget.id
            
        except Exception as e:
            logger.error(f"予算作成エラー: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    # ==========================================
    # 請求
    # ==========================================
    
    def create_invoice(self, invoice: Invoice) -> str:
        """
        請求を作成
        
        Args:
            invoice: 請求データ
        
        Returns:
            str: 請求ID
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 請求本体を挿入
            cursor.execute("""
                INSERT INTO invoices (
                    id, estimate_id, budget_id, invoice_number, invoice_date,
                    customer_name, project_name, project_location, payment_due_date,
                    subtotal, tax_amount, total_amount, payment_status, paid_amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                invoice.id,
                invoice.estimate_id,
                invoice.budget_id,
                invoice.invoice_number,
                invoice.invoice_date,
                invoice.customer_name,
                invoice.project_name,
                invoice.project_location,
                invoice.payment_due_date,
                invoice.subtotal,
                invoice.tax_amount,
                invoice.total_amount,
                invoice.payment_status,
                invoice.paid_amount
            ))
            
            # 請求明細を挿入
            for item in invoice.items:
                item_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO invoice_items (
                        id, invoice_id, item_name, specification,
                        quantity, unit, unit_price, amount, tax_category
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item_id,
                    invoice.id,
                    item.item_name,
                    item.specification,
                    item.quantity,
                    item.unit,
                    item.unit_price,
                    item.amount,
                    item.tax_category
                ))
            
            conn.commit()
            logger.info(f"請求作成: {invoice.invoice_number}")
            
            return invoice.id
            
        except Exception as e:
            logger.error(f"請求作成エラー: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
