import asyncio
asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import schedule, notify, estimate
from .db import init_db, seed_if_empty
import os

app = FastAPI(title="sunyuDX-flow API", version="1.0.0")

# 環境変数から許可するオリジンを取得（本番環境用）
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sunyu-dx-flow.vercel.app",
        *allowed_origins,  # 環境変数から追加のオリジンを許可
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    init_db()
    seed_if_empty()

app.include_router(schedule.router)
app.include_router(notify.router)
app.include_router(estimate.router)

@app.get("/health")
def health():
    return {"ok": True}