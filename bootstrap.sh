#!/usr/bin/env bash
set -euo pipefail

echo "=== sunyuDX-flow: bootstrap (clone -> setup -> run) ==="

REPO_URL="https://github.com/uehara-beep/sunyuDX-flow.git"
BASE_DIR="${HOME}/Downloads"
APP_DIR="${BASE_DIR}/sunyuDX-flow"
BACK_DIR="${APP_DIR}/backend"
FRONT_DIR="${APP_DIR}/frontend"
BACK_PORT="8001"

cd "${BASE_DIR}"

# 0) clone (if not exists)
if [ ! -d "${APP_DIR}/.git" ]; then
  echo "[1/10] Cloning repo to ${APP_DIR}"
  git clone "${REPO_URL}" sunyuDX-flow
else
  echo "[1/10] Repo exists. Pull latest."
  cd "${APP_DIR}"
  git pull --rebase || true
fi

# 1) ensure dirs
cd "${APP_DIR}"
[ -d "${BACK_DIR}" ] || { echo "ERROR: backend/ not found"; exit 1; }
[ -d "${FRONT_DIR}" ] || { echo "ERROR: frontend/ not found"; exit 1; }

# 2) BACKEND venv + deps
echo "[2/10] Backend venv + deps"
cd "${BACK_DIR}"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip >/dev/null
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt >/dev/null
fi

# 3) free backend port (8001)
echo "[3/10] Free port ${BACK_PORT} (if in use)"
(lsof -ti:"${BACK_PORT}" | xargs kill -9) >/dev/null 2>&1 || true

# 4) start backend (8001)
echo "[4/10] Start backend on :${BACK_PORT}"
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port "${BACK_PORT}" > backend.log 2>&1 &

# 5) wait + health check (supports /health or /)
echo "[5/10] Health check"
sleep 2
if curl -fsS "http://127.0.0.1:${BACK_PORT}/health" >/dev/null 2>&1; then
  echo "Backend OK: http://127.0.0.1:${BACK_PORT}/health"
else
  # fallback
  echo "NOTE: /health not found. Checking root..."
  curl -fsS "http://127.0.0.1:${BACK_PORT}/" >/dev/null 2>&1 || {
    echo "ERROR: Backend not reachable on :${BACK_PORT}. See backend/backend.log"
    exit 1
  }
  echo "Backend OK: http://127.0.0.1:${BACK_PORT}/"
fi

# 6) FRONTEND env + API client unify
echo "[6/10] Frontend env + API_BASE unify"
cd "${FRONT_DIR}"

# env (project rule: VITE_API_BASE)
cat > .env <<EOF
VITE_API_BASE=http://127.0.0.1:${BACK_PORT}
EOF

# unify api client (keeps design: env-based API_BASE)
mkdir -p src
cat > src/api.ts <<'EOF'
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8001";

async function okOrThrow(r: Response) {
  if (!r.ok) throw new Error(await r.text());
  return r;
}

export async function jget<T>(path: string): Promise<T> {
  const r = await okOrThrow(await fetch(API_BASE + path));
  return r.json();
}

export async function jpost<T = any>(path: string, body?: any): Promise<T> {
  const r = await okOrThrow(await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  return r.json();
}

export async function jdel<T = any>(path: string): Promise<T> {
  const r = await okOrThrow(await fetch(API_BASE + path, { method: "DELETE" }));
  return r.json();
}
EOF

# 7) frontend deps
echo "[7/10] Frontend npm install"
npm install >/dev/null

# 8) start frontend (vite chooses free port; print URL)
echo "[8/10] Start frontend (vite)"
# stop previous vite if running on 5173/5174 (best-effort)
(lsof -ti:5173 | xargs kill -9) >/dev/null 2>&1 || true
(lsof -ti:5174 | xargs kill -9) >/dev/null 2>&1 || true
nohup npm run dev -- --host > frontend.log 2>&1 &

sleep 2
FRONT_URL=""
if grep -Eo 'http://localhost:[0-9]+' -m 1 frontend.log >/dev/null 2>&1; then
  FRONT_URL=$(grep -Eo 'http://localhost:[0-9]+' -m 1 frontend.log | head -n 1)
else
  # fallback guess
  FRONT_URL="http://localhost:5174"
fi
echo "Frontend: ${FRONT_URL}"

# 9) add .gitignore (venv/node_modules/env)
echo "[9/10] Add .gitignore (safe append if missing)"
cd "${APP_DIR}"
if [ ! -f ".gitignore" ]; then touch .gitignore; fi
# append only if markers missing
grep -q "backend/.venv" .gitignore || cat >> .gitignore <<'EOF'

# Python
backend/.venv/
backend/__pycache__/
*.pyc

# Node
frontend/node_modules/
frontend/dist/

# Env (keep local only)
frontend/.env
EOF

# 10) commit & push (only if there are changes)
echo "[10/10] Git commit & push (if changes)"
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit. Done."
else
  git commit -m "chore: bootstrap env + api base + gitignore"
  git push
fi

echo ""
echo "=== DONE ==="
echo "Backend:  http://127.0.0.1:${BACK_PORT}"
echo "Frontend: ${FRONT_URL}"
echo "Logs:     ${BACK_DIR}/backend.log , ${FRONT_DIR}/frontend.log"
echo "Open:     ${FRONT_URL}"
