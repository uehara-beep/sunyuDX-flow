"""
見積・予算・請求システムのデータモデル
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==========================================
# 会社マスタ
# ==========================================
class CompanyMaster(BaseModel):
    """会社マスタ"""
    id: str
    company_name: str
    postal_code: Optional[str] = None
    address: Optional[str] = None
    tel: Optional[str] = None
    fax: Optional[str] = None
    representative: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    registration_number: Optional[str] = None
    logo_path: Optional[str] = None


# ==========================================
# 見積関連
# ==========================================
class EstimateItem(BaseModel):
    """見積明細"""
    item_number: int
    item_name: str
    specification: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    amount: float
    remarks: Optional[str] = None


class EstimateDetail(BaseModel):
    """内訳明細"""
    category: str
    item_name: str
    specification: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    amount: float
    remarks: Optional[str] = None
    item_order: Optional[int] = None


class EstimateCreate(BaseModel):
    """見積作成リクエスト"""
    customer_name: str
    project_name: str
    project_location: Optional[str] = None
    project_period_from: Optional[str] = None
    project_period_to: Optional[str] = None
    valid_period: Optional[str] = "3ヵ月"
    payment_terms: Optional[str] = "出来高現金払 現金100％"
    waste_notice: Optional[str] = None
    special_notes: Optional[str] = None
    staff_name: str = "上原 拓"
    items: List[EstimateItem]
    details: Optional[List[EstimateDetail]] = []


class Estimate(BaseModel):
    """見積"""
    id: str
    estimate_number: str
    estimate_date: str
    customer_name: str
    project_name: str
    project_location: Optional[str] = None
    project_period_from: Optional[str] = None
    project_period_to: Optional[str] = None
    valid_period: str
    payment_terms: str
    waste_notice: Optional[str] = None
    special_notes: Optional[str] = None
    staff_name: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    status: str
    source_file_path: Optional[str] = None
    created_at: str
    updated_at: str
    items: List[EstimateItem] = []
    details: List[EstimateDetail] = []


# ==========================================
# 予算関連
# ==========================================
class BudgetItem(BaseModel):
    """予算明細"""
    cost_category: str  # 労務費/材料費/外注費/経費
    item_name: str
    specification: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    amount: float
    vendor_name: Optional[str] = None


class BudgetCreate(BaseModel):
    """予算作成リクエスト"""
    estimate_id: str
    budget_amount: float
    initial_contract_amount: Optional[float] = None
    items: List[BudgetItem]


class Budget(BaseModel):
    """予算"""
    id: str
    estimate_id: str
    budget_number: str
    budget_date: str
    project_id: Optional[str] = None
    budget_amount: float
    initial_contract_amount: Optional[float] = None
    change_amount: float
    contract_amount: Optional[float] = None
    expected_profit: Optional[float] = None
    expected_profit_rate: Optional[float] = None
    status: str
    created_at: str
    updated_at: str
    items: List[BudgetItem] = []


# ==========================================
# 請求関連
# ==========================================
class InvoiceItem(BaseModel):
    """請求明細"""
    item_name: str
    specification: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    amount: float
    tax_category: str = "standard"


class InvoiceCreate(BaseModel):
    """請求作成リクエスト"""
    estimate_id: Optional[str] = None
    budget_id: Optional[str] = None
    customer_name: str
    project_name: str
    project_location: Optional[str] = None
    payment_due_date: Optional[str] = None
    items: List[InvoiceItem]


class Invoice(BaseModel):
    """請求"""
    id: str
    estimate_id: Optional[str] = None
    budget_id: Optional[str] = None
    invoice_number: str
    invoice_date: str
    customer_name: str
    project_name: str
    project_location: Optional[str] = None
    payment_due_date: Optional[str] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_status: str
    paid_amount: float
    created_at: str
    updated_at: str
    items: List[InvoiceItem] = []


# ==========================================
# アップロード関連
# ==========================================
class ParsedEstimateData(BaseModel):
    """Excelから抽出したデータ"""
    customer_name: str
    project_name: str
    project_location: Optional[str] = None
    staff_name: Optional[str] = None
    valid_period: Optional[str] = None
    payment_terms: Optional[str] = None
    waste_notice: Optional[str] = None
    special_notes: Optional[str] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    items: List[EstimateItem]
    details: List[EstimateDetail]


# ==========================================
# レスポンス
# ==========================================
class GenerateResponse(BaseModel):
    """生成結果レスポンス"""
    success: bool
    estimate_id: str
    estimate_number: str
    excel_path: str
    pdf_path: str
    message: str
