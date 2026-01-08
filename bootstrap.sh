#!/usr/bin/env bash
set -euo pipefail

### ===============================
### sunyuDX-flow FULL AUTO SETUP
### ===============================

REPO_URL="https://github.com/uehara-beep/sunyuDX-flow.git"
BASE_DIR="$HOME/Downloads"
APP_DIR="$BASE_DIR/sunyuDX-flow"
BACK_DIR="$APP_DIR/backend"
FRONT_DIR="$APP_DIR/frontend"
BACK_PORT=8001

echo "=== sunyuDX-flow START ==="

cd "$BASE_DIR"

# ---------- clone or pull ----------
if [ ! -d "$APP_DIR/.git" ]; then
  echo "[1] clone repo"
  git clone "$REPO_URL" sunyuDX-flow
else
  echo "[1] repo exists -> pull"
  cd "$APP_DIR"
  git pull --rebase || true
fi

# ---------- backend setup ----------
echo "[2] backend setup"
cd "$BACK_DIR"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip >/dev/null
[ -f requirements.txt ] && pip install -r requirements.txt >/dev/null

# ---------- free port ----------
echo "[3] free backend port $BACK_PORT"
(lsof -ti:$BACK_PORT | xargs kill -9) >/dev/null 2>&1 || true

# ---------- start backend ----------
echo "[4] start backend"
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port $BACK_PORT > backend.log 2>&1 &
sleep 2

# ---------- health check ----------
echo "[5] backend health check"
curl -fsS http://127.0.0.1:$BACK_PORT/health >/dev/null \
 || curl -fsS http://127.0.0.1:$BACK_PORT/ >/dev/null

echo "Backend OK : http://127.0.0.1:$BACK_PORT"

# ---------- frontend setup ----------
echo "[6] frontend setup"
cd "$FRONT_DIR"

cat > .env <<EOF
VITE_API_BASE=http://127.0.0.1:$BACK_PORT
EOF

mkdir -p src
cat > src/api.ts <<'EOF'
const API_BASE = import.meta.env.VITE_API_BASE;

async function ok(r: Response) {
  if (!r.ok) throw new Error(await r.text());
  return r;
}

export async function jget<T>(p: string): Promise<T> {
  const r = await ok(await fetch(API_BASE + p));
  return r.json();
}

export async function jpost<T>(p: string, b?: any): Promise<T> {
  const r = await ok(await fetch(API_BASE + p, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: b ? JSON.stringify(b) : undefined
  }));
  return r.json();
}

export async function jdel<T>(p: string): Promise<T> {
  const r = await ok(await fetch(API_BASE + p, { method: "DELETE" }));
  return r.json();
}
EOF

npm install >/dev/null

# ---------- start frontend ----------
echo "[7] start frontend"
(lsof -ti:5173 | xargs kill -9) >/dev/null 2>&1 || true
(lsof -ti:5174 | xargs kill -9) >/dev/null 2>&1 || true
nohup npm run dev -- --host > frontend.log 2>&1 &
sleep 2

FRONT_URL=$(grep -Eo 'http://localhost:[0-9]+' frontend.log | head -n 1 || echo "http://localhost:5174")

echo "Frontend OK : $FRONT_URL"

# ---------- gitignore ----------
echo "[8] gitignore"
cd "$APP_DIR"
cat >> .gitignore <<'EOF'

# Python
backend/.venv/
backend/__pycache__/
*.pyc

# Node
frontend/node_modules/
frontend/dist/

# Env
frontend/.env
EOF

# ---------- git commit & push ----------
echo "[9] git commit & push"
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit"
else
  git commit -m "chore: full auto bootstrap (backend+frontend+env)"
  git push
fi

echo "=== DONE ==="
echo "Backend  : http://127.0.0.1:$BACK_PORT"
echo "Frontend : $FRONT_URL"
echo "Logs     : backend/backend.log , frontend/frontend.log"
