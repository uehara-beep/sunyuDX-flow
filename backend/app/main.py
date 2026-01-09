from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import schedule, notify, estimate
from .db import init_db, seed_if_empty

app = FastAPI(title="sunyuDX-flow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sunyu-dx-flow.vercel.app",
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
