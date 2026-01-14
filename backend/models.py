"""
データベースモデル
S-BASE方式のテーブル設計
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

# =====================================
# ユーザー・認証
# =====================================

class User(Base):
    """ユーザー"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default="user")  # admin, manager, user
    company_id = Column(String(36), ForeignKey("companies.id"))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    company = relationship("Company", back_populates="users")
    projects = relationship("Project", back_populates="created_by_user")

class Company(Base):
    """会社"""
    __tablename__ = "companies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    address = Column(String(500))
    phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # リレーション
    users = relationship("User", back_populates="company")
    projects = relationship("Project", back_populates="company")

# =====================================
# プロジェクト管理
# =====================================

class Project(Base):
    """工事プロジェクト"""
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    client_name = Column(String(255), nullable=False)
    contract_amount = Column(Float, default=0)
    budget_amount = Column(Float, default=0)
    actual_cost = Column(Float, default=0)
    profit_rate = Column(Float, default=0)
    progress = Column(Float, default=0)  # 0-100
    status = Column(String(50), default="active")  # active, warning, danger, completed
    construction_type = Column(String(50))  # paving, wj, grinding, deck_repair, other
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    company_id = Column(String(36), ForeignKey("companies.id"))
    created_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    company = relationship("Company", back_populates="projects")
    created_by_user = relationship("User", back_populates="projects")
    budgets = relationship("Budget", back_populates="project")
    estimates = relationship("Estimate", back_populates="project")
    daily_reports = relationship("DailyReport", back_populates="project")
    estimate_imports = relationship("EstimateImport", back_populates="project")
    attachments = relationship("Attachment", back_populates="project")

# =====================================
# 見積・予算
# =====================================

class Estimate(Base):
    """見積書"""
    __tablename__ = "estimates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"))
    file_name = Column(String(255))
    file_path = Column(String(500))
    total_amount = Column(Float, default=0)
    breakdown_data = Column(JSON)  # 内訳明細（JSON形式）
    status = Column(String(50), default="draft")  # draft, submitted, ordered, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    # リレーション
    project = relationship("Project", back_populates="estimates")

class Budget(Base):
    """実行予算"""
    __tablename__ = "budgets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"))
    
    # 5科目
    material_total = Column(Float, default=0)
    labor_total = Column(Float, default=0)
    equipment_total = Column(Float, default=0)
    subcontract_total = Column(Float, default=0)
    expense_total = Column(Float, default=0)
    
    budget_total = Column(Float, default=0)
    profit_rate = Column(Float, default=0)
    profit_amount = Column(Float, default=0)
    estimate_amount = Column(Float, default=0)
    
    items_data = Column(JSON)  # 詳細項目（JSON形式）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # リレーション
    project = relationship("Project", back_populates="budgets")
    cost_records = relationship("CostRecord", back_populates="budget")

# =====================================
# 原価管理
# =====================================

class CostRecord(Base):
    """実際原価記録"""
    __tablename__ = "cost_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    budget_id = Column(String(36), ForeignKey("budgets.id"))
    project_id = Column(String(36), ForeignKey("projects.id"))
    daily_report_id = Column(String(36), ForeignKey("daily_reports.id"), nullable=True)  # 日報連動用

    category = Column(String(50))  # material, labor, equipment, subcontract, expense
    item_name = Column(String(255))
    quantity = Column(Float, default=0)
    unit = Column(String(50))
    unit_price = Column(Float, default=0)
    amount = Column(Float, default=0)

    invoice_number = Column(String(100))
    invoice_date = Column(DateTime)
    vendor_name = Column(String(255))
    receipt_path = Column(String(500))

    created_at = Column(DateTime, default=datetime.utcnow)

    # リレーション
    budget = relationship("Budget", back_populates="cost_records")

# =====================================
# 日報管理
# =====================================

class DailyReport(Base):
    """日報"""
    __tablename__ = "daily_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"))
    work_date = Column(DateTime, nullable=False)
    foreman_name = Column(String(100))  # 職長名
    notes = Column(Text)  # 備考
    total_amount = Column(Float, default=0)  # 合計金額（自動計算）
    created_at = Column(DateTime, default=datetime.utcnow)

    # リレーション
    project = relationship("Project", back_populates="daily_reports")
    items = relationship("DailyReportItem", back_populates="daily_report", cascade="all, delete-orphan")


class DailyReportItem(Base):
    """日報明細"""
    __tablename__ = "daily_report_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    daily_report_id = Column(String(36), ForeignKey("daily_reports.id"), nullable=False)
    worker_name = Column(String(100))  # 作業員名
    hours = Column(Float, default=8.0)  # 作業時間
    wage_rate = Column(Integer, default=15000)  # 日当単価
    amount = Column(Integer, default=0)  # 金額（hours * wage_rate）

    # リレーション
    daily_report = relationship("DailyReport", back_populates="items")

# =====================================
# ファイル管理
# =====================================

class FileUpload(Base):
    """アップロードファイル"""
    __tablename__ = "file_uploads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"))
    file_type = Column(String(50))  # estimate, receipt, photo, drawing
    original_name = Column(String(255))
    stored_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# =====================================
# 請求管理
# =====================================

class Invoice(Base):
    """請求書"""
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    billing_month = Column(String(7))  # YYYY-MM形式
    amount = Column(Float, default=0)
    status = Column(String(50), default="draft")  # draft, issued, paid
    notes = Column(Text)
    issued_at = Column(DateTime)  # 発行日
    paid_at = Column(DateTime)  # 入金日
    created_at = Column(DateTime, default=datetime.utcnow)


# =====================================
# Excel取込・明細管理
# =====================================

class EstimateImport(Base):
    """Excel取込記録"""
    __tablename__ = "estimate_imports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_hash = Column(String(64))  # SHA256
    meta_json = Column(Text)  # シート名、行数等のメタ情報
    status = Column(String(50), default="draft")  # draft, committed

    # リレーション
    project = relationship("Project", back_populates="estimate_imports")
    lines = relationship("EstimateLine", back_populates="estimate_import", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="estimate_import")


class EstimateLine(Base):
    """見積/予算/原価の統一明細"""
    __tablename__ = "estimate_lines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    import_id = Column(String(36), ForeignKey("estimate_imports.id"), nullable=False)
    sheet_name = Column(String(255))  # 元シート名
    row_no = Column(Integer)  # 元行番号

    kind = Column(String(20))  # estimate, budget, actual
    name = Column(String(255))  # 名称
    breakdown = Column(String(255))  # 内訳
    qty = Column(Float)  # 数量
    unit = Column(String(50))  # 単位
    unit_price = Column(Float)  # 単価
    amount = Column(Float)  # 合計
    note = Column(Text)  # 備考

    category = Column(String(50))  # labor, subcontract, material, machine, expense (actual only)
    month = Column(String(7))  # YYYY-MM (予算月/原価月)
    sort_order = Column(Integer, default=0)  # 並び順

    created_at = Column(DateTime, default=datetime.utcnow)

    # リレーション
    estimate_import = relationship("EstimateImport", back_populates="lines")


class Attachment(Base):
    """添付ファイル（条件書・確認書等）"""
    __tablename__ = "attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    import_id = Column(String(36), ForeignKey("estimate_imports.id"), nullable=True)
    type = Column(String(50))  # excel, conditions, confirmation, other
    filename = Column(String(255))
    storage_path = Column(String(500))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # リレーション
    project = relationship("Project", back_populates="attachments")
    estimate_import = relationship("EstimateImport", back_populates="attachments")
