/**
 * sunyuDX-flow Backend API
 * Node.js/Express/PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// PostgreSQL接続
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sunyutech_dx',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || ''
});

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET || 'sunyudx-secret-key-2024';
const JWT_EXPIRES = '24h';

// CORS設定（開発環境：すべてのオリジンを許可）
const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ファイルアップロード設定
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// =====================================
// 認証ミドルウェア
// =====================================
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'トークンが無効です' });
  }
};

// =====================================
// ルートエンドポイント
// =====================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'sunyuDX-flow API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      projects: '/api/projects/*',
      budgets: '/api/budgets/*',
      estimates: '/api/estimates/*',
      meetings: '/api/meetings/*',
      reports: '/api/reports/*'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// =====================================
// 認証API
// =====================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    const user = result.rows[0];
    // デモ用: パスワードチェックをスキップ（本番ではbcrypt.compare使用）
    // const validPassword = await bcrypt.compare(password, user.hashed_password);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'ログインに失敗しました' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }
});

// =====================================
// プロジェクトAPI
// =====================================
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(b.budget_total, 0) as budget_total,
        COALESCE(b.profit_rate, 0) as profit_rate
      FROM projects p
      LEFT JOIN budgets b ON p.id = b.project_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'プロジェクト一覧の取得に失敗しました' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'プロジェクトの取得に失敗しました' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, client_name, contract_amount, start_date, end_date } = req.body;
    const id = uuidv4();

    const result = await pool.query(`
      INSERT INTO projects (id, name, client_name, contract_amount, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `, [id, name, client_name, contract_amount || 0, start_date, end_date]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'プロジェクトの作成に失敗しました' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, client_name, contract_amount, status, progress } = req.body;

    const result = await pool.query(`
      UPDATE projects
      SET name = COALESCE($1, name),
          client_name = COALESCE($2, client_name),
          contract_amount = COALESCE($3, contract_amount),
          status = COALESCE($4, status),
          progress = COALESCE($5, progress),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, client_name, contract_amount, status, progress, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'プロジェクトの更新に失敗しました' });
  }
});

// =====================================
// 予算API
// =====================================
app.get('/api/budgets', async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = `
      SELECT b.*, p.name as project_name, p.client_name
      FROM budgets b
      JOIN projects p ON b.project_id = p.id
    `;
    const params = [];

    if (project_id) {
      query += ' WHERE b.project_id = $1';
      params.push(project_id);
    }
    query += ' ORDER BY b.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: '予算一覧の取得に失敗しました' });
  }
});

app.get('/api/budgets/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.name as project_name, p.client_name, p.contract_amount
      FROM budgets b
      JOIN projects p ON b.project_id = p.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '予算が見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '予算の取得に失敗しました' });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const {
      project_id,
      material_total,
      labor_total,
      equipment_total,
      subcontract_total,
      expense_total,
      estimate_amount,
      items_data
    } = req.body;

    const id = uuidv4();
    const budget_total = (material_total || 0) + (labor_total || 0) +
                         (equipment_total || 0) + (subcontract_total || 0) + (expense_total || 0);
    const profit_amount = (estimate_amount || 0) - budget_total;
    const profit_rate = estimate_amount > 0 ? (profit_amount / estimate_amount) * 100 : 0;

    const result = await pool.query(`
      INSERT INTO budgets (
        id, project_id, material_total, labor_total, equipment_total,
        subcontract_total, expense_total, budget_total, profit_rate,
        profit_amount, estimate_amount, items_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      id, project_id, material_total || 0, labor_total || 0, equipment_total || 0,
      subcontract_total || 0, expense_total || 0, budget_total, profit_rate,
      profit_amount, estimate_amount || 0, JSON.stringify(items_data || [])
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: '予算の作成に失敗しました' });
  }
});

// =====================================
// 見積API
// =====================================
app.get('/api/estimates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, p.name as project_name
      FROM estimates e
      LEFT JOIN projects p ON e.project_id = p.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '見積一覧の取得に失敗しました' });
  }
});

app.post('/api/estimates/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    const id = uuidv4();
    const { project_id } = req.body;

    const result = await pool.query(`
      INSERT INTO estimates (id, project_id, file_name, file_path, total_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, project_id || null, req.file.originalname, req.file.path, 0]);

    res.status(201).json({
      message: 'ファイルがアップロードされました',
      estimate: result.rows[0]
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'アップロードに失敗しました' });
  }
});

// =====================================
// 商談API
// =====================================
app.get('/api/meetings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.name as project_name
      FROM meetings m
      LEFT JOIN projects p ON m.project_id = p.id
      ORDER BY m.meeting_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '商談一覧の取得に失敗しました' });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const {
      project_id,
      meeting_date,
      customer_name,
      attendees,
      content,
      next_action,
      next_date,
      status,
      probability,
      expected_amount,
      tags
    } = req.body;

    const id = uuidv4();

    const result = await pool.query(`
      INSERT INTO meetings (
        id, project_id, meeting_date, customer_name, attendees, content,
        next_action, next_date, status, probability, expected_amount, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      id, project_id, meeting_date, customer_name,
      JSON.stringify(attendees || []), content,
      next_action, next_date, status || 'new',
      probability || 50, expected_amount || 0,
      JSON.stringify(tags || [])
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: '商談の作成に失敗しました' });
  }
});

// =====================================
// 日報API
// =====================================
app.get('/api/reports', async (req, res) => {
  try {
    const { project_id, date } = req.query;
    let query = `
      SELECT dr.*, p.name as project_name, u.name as user_name
      FROM daily_reports dr
      LEFT JOIN projects p ON dr.project_id = p.id
      LEFT JOIN users u ON dr.user_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (project_id) {
      params.push(project_id);
      conditions.push(`dr.project_id = $${params.length}`);
    }
    if (date) {
      params.push(date);
      conditions.push(`DATE(dr.report_date) = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY dr.report_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '日報一覧の取得に失敗しました' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const {
      project_id,
      user_id,
      report_date,
      work_type,
      work_hours,
      workers_count,
      progress_description,
      weather,
      status
    } = req.body;

    const id = uuidv4();

    const result = await pool.query(`
      INSERT INTO daily_reports (
        id, project_id, user_id, report_date, work_type, work_hours,
        workers_count, progress_description, weather, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id, project_id, user_id, report_date, work_type,
      work_hours || 8, workers_count || 1,
      progress_description, weather, status || '順調'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: '日報の作成に失敗しました' });
  }
});

// =====================================
// 承認API
// =====================================
app.get('/api/approvals', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, b.budget_total, b.profit_rate, p.name as project_name,
             u1.name as requested_by_name, u2.name as approved_by_name
      FROM approvals a
      JOIN budgets b ON a.budget_id = b.id
      JOIN projects p ON a.project_id = p.id
      LEFT JOIN users u1 ON a.requested_by = u1.id
      LEFT JOIN users u2 ON a.approved_by = u2.id
      ORDER BY a.requested_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '承認一覧の取得に失敗しました' });
  }
});

app.post('/api/approvals/:id/approve', async (req, res) => {
  try {
    const { comment, approved_by } = req.body;

    const result = await pool.query(`
      UPDATE approvals
      SET status = 'approved',
          approved_by = $1,
          comment = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [approved_by, comment, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '承認リクエストが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '承認処理に失敗しました' });
  }
});

app.post('/api/approvals/:id/reject', async (req, res) => {
  try {
    const { comment, approved_by } = req.body;

    const result = await pool.query(`
      UPDATE approvals
      SET status = 'rejected',
          approved_by = $1,
          comment = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [approved_by, comment, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '承認リクエストが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '却下処理に失敗しました' });
  }
});

// =====================================
// ダッシュボードAPI
// =====================================
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const projectCount = await pool.query('SELECT COUNT(*) FROM projects WHERE status = $1', ['active']);
    const budgetSum = await pool.query('SELECT SUM(budget_total) as total FROM budgets');
    const profitAvg = await pool.query('SELECT AVG(profit_rate) as avg FROM budgets WHERE profit_rate > 0');
    const meetingCount = await pool.query(
      "SELECT COUNT(*) FROM meetings WHERE meeting_date >= CURRENT_DATE - INTERVAL '30 days'"
    );

    res.json({
      activeProjects: parseInt(projectCount.rows[0].count) || 0,
      totalBudget: parseFloat(budgetSum.rows[0].total) || 0,
      averageProfitRate: parseFloat(profitAvg.rows[0].avg) || 0,
      recentMeetings: parseInt(meetingCount.rows[0].count) || 0
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'ダッシュボードデータの取得に失敗しました' });
  }
});

// =====================================
// サーバー起動
// =====================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     sunyuDX-flow API Server Started        ║
╠════════════════════════════════════════════╣
║  URL:  http://localhost:${PORT}               ║
║  Docs: http://localhost:${PORT}/              ║
║  DB:   PostgreSQL (sunyutech_dx)           ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
