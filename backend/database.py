"""
データベース接続設定
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# データベースURL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sunyudx.db")

# Engine作成
engine = create_engine(
    DATABASE_URL,
    echo=True,  # SQLログ出力
)

# SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 依存性注入用
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# テーブル作成
def init_db():
    from models import Base
    Base.metadata.create_all(bind=engine)
