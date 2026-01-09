from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import io
import pandas as pd
from .. import repo

router = APIRouter(prefix="/api/estimate", tags=["estimate"])

# ---- response models ----
class BudgetRow(BaseModel):
    row_no: int
    name: str
    category: str  # 労務/外注/材料/機械/経費
    quantity: float
    unit: str
    unit_price: float
    amount: float
    vendor: Optional[str] = None
    note: Optional[str] = None

class ImportResult(BaseModel):
    source_filename: str
    rows: List[BudgetRow]
    summary: Dict[str, float]  # category totals + grand_total

def _norm(s: Any) -> str:
    if s is None:
        return ""
    return str(s).strip()

def _to_float(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if s == "":
        return 0.0
    s = s.replace(",", "").replace("¥", "").replace("円", "")
    try:
        return float(s)
    except:
        return 0.0

CATEGORY_ALIASES = {
    "労務": ["労務", "労務費", "labor"],
    "外注": ["外注", "外注費", "協力", "下請", "subcontract"],
    "材料": ["材料", "材料費", "資材", "material"],
    "機械": ["機械", "機械費", "レンタル", "重機", "machine"],
    "経費": ["経費", "雑費", "交通費", "燃料", "etc", "expense"],
}

def _guess_category(v: str) -> str:
    v = v.strip()
    if v == "":
        return "材料"
    low = v.lower()
    for cat, keys in CATEGORY_ALIASES.items():
        for k in keys:
            if k.lower() in low:
                return cat
    # already exact?
    if v in CATEGORY_ALIASES.keys():
        return v
    return "材料"

def _find_col(cols, candidates):
    lowcols = {c.lower(): c for c in cols}
    for cand in candidates:
        c = cand.lower()
        if c in lowcols:
            return lowcols[c]
    # partial match
    for col in cols:
        l = col.lower()
        for cand in candidates:
            if cand.lower() in l:
                return col
    return None

def _read_excel_to_rows(content: bytes) -> List[BudgetRow]:
    # read first sheet
    xls = pd.ExcelFile(io.BytesIO(content))
    sheet_name = xls.sheet_names[0]
    df = pd.read_excel(xls, sheet_name=sheet_name)

    # normalize column names
    df.columns = [str(c).strip() for c in df.columns]

    # detect columns (supports Japanese/English)
    c_name = _find_col(df.columns, ["項目", "名称", "品名", "工種", "作業内容", "name", "item"])
    c_cat  = _find_col(df.columns, ["区分", "分類", "カテゴリ", "費目", "category"])
    c_qty  = _find_col(df.columns, ["数量", "qty", "quantity"])
    c_unit = _find_col(df.columns, ["単位", "unit"])
    c_up   = _find_col(df.columns, ["単価", "unit_price", "price"])
    c_amt  = _find_col(df.columns, ["金額", "合計", "amount", "total"])
    c_vend = _find_col(df.columns, ["業者", "会社", "発注先", "vendor", "supplier"])
    c_note = _find_col(df.columns, ["備考", "メモ", "note", "memo"])

    if not c_name:
        raise HTTPException(status_code=400, detail="Excelに「項目/名称/name」列が見つかりません。見積の明細シートを入れてください。")

    rows: List[BudgetRow] = []
    for i, r in df.iterrows():
        name = _norm(r.get(c_name))
        if name == "" or name.lower() in ["nan", "none"]:
            continue

        category = _guess_category(_norm(r.get(c_cat))) if c_cat else "材料"
        qty = _to_float(r.get(c_qty)) if c_qty else 0.0
        unit = _norm(r.get(c_unit)) if c_unit else ""
        unit_price = _to_float(r.get(c_up)) if c_up else 0.0
        amount = _to_float(r.get(c_amt)) if c_amt else 0.0

        # If amount missing but qty & unit_price present
        if amount == 0.0 and qty != 0.0 and unit_price != 0.0:
            amount = qty * unit_price

        vendor = _norm(r.get(c_vend)) if c_vend else None
        note = _norm(r.get(c_note)) if c_note else None

        rows.append(BudgetRow(
            row_no=len(rows) + 1,
            name=name,
            category=category,
            quantity=qty,
            unit=unit,
            unit_price=unit_price,
            amount=amount,
            vendor=vendor if vendor else None,
            note=note if note else None
        ))
    return rows

@router.post("/import", response_model=ImportResult)
async def import_estimate(file: UploadFile = File(...)):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Excel（.xlsx/.xls）のみ対応です。PDFは次フェーズでOCRに回します。")
    content = await file.read()
    try:
        rows = _read_excel_to_rows(content)
        repo.ensure_estimate_tables()
        import_id = repo.save_estimate_import(file.filename, rows)  # keep for audit
        summary = repo.calc_budget_summary(rows)
        return ImportResult(source_filename=file.filename, rows=rows, summary=summary)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"見積Excel取込エラー: {str(e)}")
