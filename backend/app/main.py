from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import schedule, notify
from .db import init_db, seed_if_empty

app = FastAPI(title="sunyuDX-flow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
app.include_router(__import__('app.routers.estimate', fromlist=['router']).router)
app.include_router(__import__('app.routers.invoice', fromlist=['router']).router)

@app.get("/health")
def health():
    return {"ok": True}
