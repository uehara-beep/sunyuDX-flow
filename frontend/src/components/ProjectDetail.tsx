import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jget, jpost, jpatch } from '../api';
import LineItemTable, { LineItem } from './LineItemTable';
import './ProjectList.css';

interface Estimate {
  id: string;
  name: string;
  amount: number;
  estimate_status: string;
  created_at: string;
}

interface EstimateLine {
  id: string;
  import_id: string;
  sheet_name: string;
  row_no: number;
  kind: string;
  name: string;
  breakdown: string;
  qty: number | null;
  unit: string;
  unit_price: number | null;
  amount: number | null;
  note: string;
  category: string | null;
  month: string | null;
  sort_order: number;
  created_at: string | null;
}

interface EstimateLinesResponse {
  status: string;
  project_id: string;
  lines: EstimateLine[];
  total_amount: number;
  filters: {
    year: number | null;
    kind: string | null;
    month: string | null;
  };
}

interface Attachment {
  id: string;
  import_id: string | null;
  type: string;
  filename: string;
  download_url: string | null;
  uploaded_at: string | null;
}

interface AttachmentsResponse {
  status: string;
  project_id: string;
  attachments: Attachment[];
}

interface Project {
  id: string;
  name: string;
  client: string;
  contract_amount: number;
  budget_amount: number;
  actual_cost: number;
  profit_rate: number;
  progress: number;
  status: string;
  created_at: string;
}

interface ProjectResponse {
  status: string;
  projects: Project[];
}

interface EstimatesResponse {
  status: string;
  project_id: string;
  estimates: Estimate[];
}

interface Cost {
  id: string;
  category: string;
  amount: number;
  note: string;
  cost_date: string;
}

interface CostsResponse {
  status: string;
  project_id: string;
  month: string | null;
  costs: Cost[];
  category_subtotals: Record<string, number>;
  total: number;
}

interface Summary {
  revenue: number;
  cost_total: number;
  gross_profit: number;
  gross_margin: number;
  billed_total: number;
  paid_total: number;
  unbilled_amount: number;
  unpaid_amount: number;
}

interface SummaryResponse {
  status: string;
  project_id: string;
  summary: Summary;
}

interface Invoice {
  id: string;
  billing_month: string;
  amount: number;
  status: string;
  notes: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface InvoicesResponse {
  status: string;
  project_id: string;
  invoices: Invoice[];
}

interface DailyReportItem {
  id: string;
  worker_name: string;
  hours: number;
  wage_rate: number;
  amount: number;
}

interface DailyReport {
  id: string;
  work_date: string;
  foreman_name: string;
  notes: string;
  total_amount: number;
  items: DailyReportItem[];
  created_at: string;
}

interface DailyReportsResponse {
  status: string;
  project_id: string;
  daily_reports: DailyReport[];
}

// よく使うテンプレート
const COST_TEMPLATES = [
  { category: 'subcontract', note: '外注工事', label: '外注' },
  { category: 'expense', note: 'ETC・高速代', label: 'ETC' },
  { category: 'expense', note: '燃料代', label: '燃料' },
  { category: 'material', note: '資材購入', label: '材料' },
];

const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [categorySubtotals, setCategorySubtotals] = useState<Record<string, number>>({});
  const [costsTotal, setCostsTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [newEstimate, setNewEstimate] = useState({ name: '', amount: '' });
  const [newCost, setNewCost] = useState({ category: 'labor', amount: '', note: '' });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<'costs' | 'daily' | 'invoices'>('costs');
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [newDaily, setNewDaily] = useState({
    work_date: new Date().toISOString().split('T')[0],
    foreman_name: '',
    notes: '',
    items: [{ worker_name: '', hours: 8, wage_rate: 15000 }]
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    billing_month: new Date().toISOString().slice(0, 7),
    amount: '',
    notes: ''
  });

  // 運用モード: トースト通知 & 保存中状態
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(''); // YYYY-MM or '' for all

  // 見積明細（Excel取込データ）
  const [estimateLines, setEstimateLines] = useState<EstimateLine[]>([]);
  const [estimateYear, setEstimateYear] = useState<number>(new Date().getFullYear());
  const [estimateKind, setEstimateKind] = useState<string>('all'); // all, estimate, budget, actual
  const [estimateMonth, setEstimateMonth] = useState<string>(''); // YYYY-MM（予算・原価用）
  const [estimateLinesTotal, setEstimateLinesTotal] = useState<number>(0);

  // 添付ファイル
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // トースト表示
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 金額入力ヘルパー: 数字以外を除去
  const sanitizeAmount = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  // 金額パース: 文字列 → 数値（NaNなら-1）
  const parseAmount = (value: string): number => {
    const clean = value.replace(/,/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? -1 : num;
  };

  // 金額表示用フォーマット（カンマ区切り）
  const formatAmountDisplay = (value: string): string => {
    const num = parseAmount(value);
    return num >= 0 ? num.toLocaleString() : value;
  };

  // 利用可能な月リスト生成（請求・原価から抽出）
  const getAvailableMonths = (): string[] => {
    const months = new Set<string>();
    invoices.forEach(i => {
      if (i.billing_month) months.add(i.billing_month);
    });
    costs.forEach(c => {
      if (c.cost_date) months.add(c.cost_date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchCosts();
    }
  }, [projectId, selectedMonth]);

  useEffect(() => {
    if (projectId && activeTab === 'daily') {
      fetchDailyReports();
    }
  }, [projectId, activeTab]);

  useEffect(() => {
    if (projectId && activeTab === 'invoices') {
      fetchInvoices();
    }
  }, [projectId, activeTab]);

  // デフォルトで最新月を選択
  useEffect(() => {
    if (invoices.length > 0 || costs.length > 0) {
      const months = getAvailableMonths();
      if (months.length > 0 && !filterMonth) {
        setFilterMonth(months[0]); // 最新月をデフォルト
      }
    }
  }, [invoices, costs]);

  // 見積明細（Excel取込）取得
  useEffect(() => {
    if (projectId) {
      fetchEstimateLines();
      fetchAttachments();
    }
  }, [projectId, estimateYear, estimateKind, estimateMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // プロジェクト情報取得
      const projectData = await jget<ProjectResponse>('/api/projects');
      const found = projectData.projects.find(p => p.id === projectId);
      if (found) {
        setProject(found);
      }

      // 見積一覧取得
      const estimatesData = await jget<EstimatesResponse>(`/api/projects/${projectId}/estimates`);
      setEstimates(estimatesData.estimates);

      // サマリー取得
      const summaryData = await jget<SummaryResponse>(`/api/projects/${projectId}/summary`);
      setSummary(summaryData.summary);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchCosts = async () => {
    try {
      const costsData = await jget<CostsResponse>(`/api/projects/${projectId}/costs?month=${selectedMonth}`);
      setCosts(costsData.costs);
      setCategorySubtotals(costsData.category_subtotals);
      setCostsTotal(costsData.total);
    } catch (err) {
      console.error('原価取得エラー:', err);
    }
  };

  const fetchDailyReports = async () => {
    try {
      const data = await jget<DailyReportsResponse>(`/api/projects/${projectId}/daily-reports`);
      setDailyReports(data.daily_reports);
    } catch (err) {
      console.error('日報取得エラー:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await jget<InvoicesResponse>(`/api/projects/${projectId}/invoices`);
      setInvoices(data.invoices);
    } catch (err) {
      console.error('請求取得エラー:', err);
    }
  };

  const fetchEstimateLines = async () => {
    try {
      let url = `/api/projects/${projectId}/estimate-lines?year=${estimateYear}`;
      if (estimateKind !== 'all') {
        url += `&kind=${estimateKind}`;
      }
      // 予算・原価の場合は月フィルタを適用
      if (estimateMonth && (estimateKind === 'budget' || estimateKind === 'actual')) {
        url += `&month=${estimateMonth}`;
      }
      const data = await jget<EstimateLinesResponse>(url);
      setEstimateLines(data.lines);
      setEstimateLinesTotal(data.total_amount);
    } catch (err) {
      console.error('見積明細取得エラー:', err);
    }
  };

  const fetchAttachments = async () => {
    try {
      const data = await jget<AttachmentsResponse>(`/api/projects/${projectId}/attachments`);
      setAttachments(data.attachments);
    } catch (err) {
      console.error('添付ファイル取得エラー:', err);
    }
  };

  // 明細行の並び替え
  const handleReorderLines = async (reorderedItems: LineItem[]) => {
    // 楽観的更新: 先にUIを更新
    setEstimateLines(reorderedItems.map((item, index) => {
      const original = estimateLines.find(l => l.id === item.id);
      return original ? { ...original, sort_order: index } : original!;
    }).filter(Boolean));

    try {
      await jpatch(`/api/projects/${projectId}/estimate-lines/reorder`, {
        line_ids: reorderedItems.map(item => item.id),
        sort_orders: reorderedItems.map((_, index) => index)
      });
    } catch (err) {
      console.error('並び替えエラー:', err);
      showToast('並び替えに失敗しました', 'error');
      // エラー時は元に戻す
      fetchEstimateLines();
    }
  };

  const handleAddInvoice = async () => {
    // バリデーション
    if (!newInvoice.billing_month || !/^\d{4}-\d{2}$/.test(newInvoice.billing_month)) {
      showToast('請求月を正しく入力してください（YYYY-MM形式）', 'error');
      return;
    }
    const invoiceAmount = parseAmount(newInvoice.amount);
    if (invoiceAmount < 0) {
      showToast('金額を正しく入力してください', 'error');
      return;
    }

    setSavingInvoice(true);
    try {
      await jpost(`/api/projects/${projectId}/invoices`, {
        billing_month: newInvoice.billing_month,
        amount: invoiceAmount,
        notes: newInvoice.notes
      });
      setNewInvoice({
        billing_month: new Date().toISOString().slice(0, 7),
        amount: '',
        notes: ''
      });
      setShowInvoiceForm(false);
      showToast('請求を追加しました', 'success');
      fetchInvoices();
      fetchData(); // サマリー更新
    } catch (err) {
      showToast('請求の追加に失敗しました', 'error');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchInvoices();
      fetchData(); // サマリー更新
    } catch (err) {
      alert('ステータス更新に失敗しました');
    }
  };

  const getInvoiceStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string; bg: string }> = {
      draft: { label: '下書き', color: '#666', bg: '#f1f5f9' },
      issued: { label: '発行済', color: '#0066cc', bg: '#e0f2fe' },
      paid: { label: '入金済', color: '#059669', bg: '#d1fae5' }
    };
    return labels[status] || labels.draft;
  };

  const handleAddDaily = async () => {
    if (!newDaily.foreman_name || newDaily.items.every(i => !i.worker_name)) {
      alert('職長名と作業員を入力してください');
      return;
    }
    try {
      const validItems = newDaily.items.filter(i => i.worker_name);
      await jpost(`/api/projects/${projectId}/daily-reports`, {
        ...newDaily,
        items: validItems
      });
      setNewDaily({
        work_date: new Date().toISOString().split('T')[0],
        foreman_name: '',
        notes: '',
        items: [{ worker_name: '', hours: 8, wage_rate: 15000 }]
      });
      setShowDailyForm(false);
      fetchDailyReports();
      fetchCosts(); // 労務費が追加されるのでcostsも更新
      fetchData(); // サマリー更新
    } catch (err) {
      alert('日報の追加に失敗しました');
    }
  };

  const addDailyItem = () => {
    setNewDaily({
      ...newDaily,
      items: [...newDaily.items, { worker_name: '', hours: 8, wage_rate: 15000 }]
    });
  };

  const updateDailyItem = (index: number, field: string, value: string | number) => {
    const items = [...newDaily.items];
    items[index] = { ...items[index], [field]: value };
    setNewDaily({ ...newDaily, items });
  };

  const removeDailyItem = (index: number) => {
    if (newDaily.items.length > 1) {
      const items = newDaily.items.filter((_, i) => i !== index);
      setNewDaily({ ...newDaily, items });
    }
  };

  const handleAddEstimate = async () => {
    if (!newEstimate.name) return;
    const estimateAmount = parseAmount(newEstimate.amount);
    if (estimateAmount < 0) {
      showToast('金額を正しく入力してください', 'error');
      return;
    }
    try {
      await jpost(`/api/projects/${projectId}/estimates`, {
        name: newEstimate.name,
        amount: estimateAmount
      });
      setNewEstimate({ name: '', amount: '' });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert('見積の追加に失敗しました');
    }
  };

  const handleOrder = async (estimateId: string) => {
    if (!confirm('この見積を受注しますか？')) return;
    try {
      await jpost(`/api/estimates/${estimateId}/order`, {});
      fetchData();
    } catch (err) {
      alert('受注処理に失敗しました');
    }
  };

  const handleAddCost = async () => {
    // バリデーション
    if (!newCost.category) {
      showToast('科目を選択してください', 'error');
      return;
    }
    const costAmount = parseAmount(newCost.amount);
    if (costAmount < 0) {
      showToast('金額を正しく入力してください', 'error');
      return;
    }

    setSavingCost(true);
    try {
      await jpost(`/api/projects/${projectId}/costs`, {
        category: newCost.category,
        amount: costAmount,
        note: newCost.note
      });
      setNewCost({ category: 'labor', amount: '', note: '' });
      setShowCostForm(false);
      showToast('原価を追加しました', 'success');
      fetchCosts();
      fetchData(); // サマリー更新
    } catch (err) {
      showToast('原価の追加に失敗しました', 'error');
    } finally {
      setSavingCost(false);
    }
  };

  const handleTemplateClick = (template: { category: string; note: string }) => {
    setNewCost({ ...newCost, category: template.category, note: template.note });
    setShowCostForm(true);
  };

  const handleDuplicateLast = () => {
    if (costs.length > 0) {
      const last = costs[0];
      setNewCost({ category: last.category, amount: String(last.amount), note: last.note });
      setShowCostForm(true);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      labor: { label: '労務費', color: '#3b82f6' },
      subcontract: { label: '外注費', color: '#8b5cf6' },
      material: { label: '材料費', color: '#f59e0b' },
      machine: { label: '機械費', color: '#10b981' },
      expense: { label: '経費', color: '#6b7280' }
    };
    return labels[category] || { label: category, color: '#666' };
  };

  const getEstimateStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string; bg: string }> = {
      draft: { label: '下書き', color: '#666', bg: '#f1f5f9' },
      submitted: { label: '提出済', color: '#0066cc', bg: '#e0f2fe' },
      ordered: { label: '受注', color: '#059669', bg: '#d1fae5' },
      rejected: { label: '失注', color: '#dc2626', bg: '#fee2e2' }
    };
    return labels[status] || labels.draft;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '進行中',
      completed: '完了',
      warning: '注意',
      danger: '危険'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="list-page-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="list-page-container">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          エラー: {error || 'プロジェクトが見つかりません'}
          <button onClick={() => navigate('/projects')} style={{ marginLeft: '1rem' }}>一覧に戻る</button>
        </div>
      </div>
    );
  }

  // 月フィルタ適用した請求/原価
  const availableMonths = getAvailableMonths();
  const filteredInvoices = filterMonth
    ? invoices.filter(i => i.billing_month === filterMonth)
    : invoices;
  const filteredCosts = filterMonth
    ? costs.filter(c => c.cost_date?.startsWith(filterMonth))
    : costs;

  return (
    <div className="list-page-container">
      {/* トースト通知 */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#059669' : '#dc2626',
          color: 'white',
          fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}

      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/projects')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          工事台帳一覧
        </button>
        <h1 className="page-title">工事詳細</h1>
        <div className="user-badge">たく</div>
      </header>

      <div style={{ padding: '1.5rem' }}>
        {/* サマリー固定表示（上部） */}
        {summary && (
          <div style={{
            background: 'linear-gradient(135deg, #0a2540 0%, #1a365d 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>収支サマリー</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>表示月:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" style={{ color: '#333' }}>全期間</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month} style={{ color: '#333' }}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>売上（請求）</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>¥{summary.revenue.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>原価合計</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>¥{summary.cost_total.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>粗利</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: summary.gross_profit >= 0 ? '#10b981' : '#ef4444' }}>
                  ¥{summary.gross_profit.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>粗利率</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: summary.gross_margin >= 20 ? '#10b981' : summary.gross_margin >= 10 ? '#f59e0b' : '#ef4444' }}>
                  {summary.gross_margin.toFixed(1)}%
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>請求済</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>¥{(summary.billed_total || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>入金済</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981' }}>¥{(summary.paid_total || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>未請求</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: (summary.unbilled_amount || 0) > 0 ? '#f59e0b' : 'white' }}>
                  ¥{(summary.unbilled_amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>未入金</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: (summary.unpaid_amount || 0) > 0 ? '#ef4444' : 'white' }}>
                  ¥{(summary.unpaid_amount || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* プロジェクト情報 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#0a2540' }}>{project.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>発注者</div>
              <div style={{ fontWeight: '600' }}>{project.client}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>請負金額</div>
              <div style={{ fontWeight: '600', color: '#FF6B00' }}>¥{(project.contract_amount || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>予算金額</div>
              <div style={{ fontWeight: '600' }}>¥{(project.budget_amount || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>ステータス</div>
              <div className={`project-status status-${project.status}`} style={{ display: 'inline-block' }}>
                {getStatusLabel(project.status)}
              </div>
            </div>
          </div>
        </div>

        {/* 見積一覧 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0a2540' }}>見積一覧</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="add-button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              見積追加
            </button>
          </div>

          {/* 見積追加フォーム */}
          {showAddForm && (
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>見積名</label>
                <input
                  type="text"
                  value={newEstimate.name}
                  onChange={(e) => setNewEstimate({ ...newEstimate, name: e.target.value })}
                  placeholder="例: 初回見積書"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ width: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>金額</label>
                <input
                  type="text"
                  value={newEstimate.amount}
                  onChange={(e) => setNewEstimate({ ...newEstimate, amount: sanitizeAmount(e.target.value) })}
                  placeholder="例: 1000000"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <button
                onClick={handleAddEstimate}
                style={{
                  background: '#FF6B00',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                追加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  background: '#e2e8f0',
                  color: '#666',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          )}

          {/* 見積リスト */}
          {estimates.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              見積がまだありません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666', fontWeight: '600' }}>見積名</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#666', fontWeight: '600' }}>金額</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', color: '#666', fontWeight: '600' }}>ステータス</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#666', fontWeight: '600' }}>作成日</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', color: '#666', fontWeight: '600' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map(estimate => {
                  const statusInfo = getEstimateStatusLabel(estimate.estimate_status);
                  return (
                    <tr key={estimate.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>{estimate.name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#FF6B00' }}>
                        ¥{(estimate.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: statusInfo.color,
                          background: statusInfo.bg
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                        {formatDate(estimate.created_at)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {estimate.estimate_status !== 'ordered' ? (
                          <button
                            onClick={() => handleOrder(estimate.id)}
                            style={{
                              background: '#059669',
                              color: 'white',
                              border: 'none',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.75rem'
                            }}
                          >
                            受注
                          </button>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.875rem' }}>受注済</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #0a2540' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>合計</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#FF6B00', fontSize: '1.1rem' }}>
                    ¥{estimates.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Excel取込明細 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginTop: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0a2540' }}>Excel取込明細</h3>
              <select
                value={estimateYear}
                onChange={(e) => setEstimateYear(Number(e.target.value))}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
              <select
                value={estimateKind}
                onChange={(e) => {
                  setEstimateKind(e.target.value);
                  // 見積の場合は月フィルタをクリア
                  if (e.target.value === 'estimate' || e.target.value === 'all') {
                    setEstimateMonth('');
                  }
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">全種別</option>
                <option value="estimate">見積</option>
                <option value="budget">予算</option>
                <option value="actual">原価</option>
              </select>
              {/* 予算・原価の場合は月フィルタを表示 */}
              {(estimateKind === 'budget' || estimateKind === 'actual') && (
                <input
                  type="month"
                  value={estimateMonth}
                  onChange={(e) => setEstimateMonth(e.target.value)}
                  placeholder="対象月"
                  style={{
                    padding: '0.375rem 0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              )}
            </div>
            <button
              onClick={() => navigate('/estimate/upload')}
              className="add-button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Excel取込
            </button>
          </div>

          {estimateLines.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              取込データがありません。Excel取込ボタンから取り込んでください。
            </div>
          ) : (
            <LineItemTable
              items={estimateLines.map(line => ({
                id: line.id,
                name: line.name,
                breakdown: line.breakdown || '',
                qty: line.qty !== null ? String(line.qty) : '',
                unit: line.unit || '',
                unit_price: line.unit_price !== null ? String(line.unit_price) : '',
                amount: line.amount !== null ? String(line.amount) : '0',
                note: line.note || '',
                category: line.category || undefined,
                month: line.month || undefined
              }))}
              kind={estimateKind === 'actual' ? 'actual' : estimateKind === 'budget' ? 'budget' : 'estimate'}
              editable={false}
              onReorder={handleReorderLines}
            />
          )}

          {estimateLines.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {estimateLines.length}件
              </span>
              <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#059669' }}>
                合計: ¥{estimateLinesTotal.toLocaleString()}
              </span>
            </div>
          )}

          {/* 添付ファイル */}
          {attachments.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                添付ファイル ({attachments.length}件)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.download_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      color: '#0066cc',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    {att.filename}
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      background: att.type === 'conditions' ? '#dbeafe' : att.type === 'confirmation' ? '#d1fae5' : '#f3f4f6',
                      color: att.type === 'conditions' ? '#1d4ed8' : att.type === 'confirmation' ? '#059669' : '#6b7280',
                      borderRadius: '4px',
                      fontSize: '0.625rem',
                      fontWeight: '600'
                    }}>
                      {att.type === 'conditions' ? '条件書' : att.type === 'confirmation' ? '確認書' : 'その他'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* タブ切り替え */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('costs')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'costs' ? 'white' : '#e2e8f0',
              color: activeTab === 'costs' ? '#0a2540' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            原価
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'daily' ? 'white' : '#e2e8f0',
              color: activeTab === 'daily' ? '#0a2540' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            日報
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'invoices' ? 'white' : '#e2e8f0',
              color: activeTab === 'invoices' ? '#0a2540' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            請求
          </button>
        </div>

        {/* 原価一覧 */}
        {activeTab === 'costs' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0a2540' }}>原価一覧</h3>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '0.375rem 0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              onClick={() => setShowCostForm(!showCostForm)}
              className="add-button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              原価追加
            </button>
          </div>

          {/* クイック入力ボタン */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            {COST_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => handleTemplateClick(t)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#334155'
                }}
              >
                + {t.label}
              </button>
            ))}
            {costs.length > 0 && (
              <button
                onClick={handleDuplicateLast}
                style={{
                  background: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#0369a1'
                }}
              >
                前回複製
              </button>
            )}
          </div>

          {/* 原価追加フォーム */}
          {showCostForm && (
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-end'
            }}>
              <div style={{ width: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>科目</label>
                <select
                  value={newCost.category}
                  onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="labor">労務費</option>
                  <option value="subcontract">外注費</option>
                  <option value="material">材料費</option>
                  <option value="machine">機械費</option>
                  <option value="expense">経費</option>
                </select>
              </div>
              <div style={{ width: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>金額</label>
                <input
                  type="text"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: sanitizeAmount(e.target.value) })}
                  placeholder="例: 1000000"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>備考</label>
                <input
                  type="text"
                  value={newCost.note}
                  onChange={(e) => setNewCost({ ...newCost, note: e.target.value })}
                  placeholder="例: 作業員人件費"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <button
                onClick={handleAddCost}
                disabled={savingCost}
                style={{
                  background: savingCost ? '#ccc' : '#FF6B00',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: savingCost ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {savingCost ? '保存中...' : '追加'}
              </button>
              <button
                onClick={() => setShowCostForm(false)}
                style={{
                  background: '#e2e8f0',
                  color: '#666',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          )}

          {/* 原価リスト */}
          {costs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              原価がまだありません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666', fontWeight: '600' }}>科目</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#666', fontWeight: '600' }}>金額</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666', fontWeight: '600' }}>備考</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', color: '#666', fontWeight: '600' }}>日付</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(cost => {
                  const catInfo = getCategoryLabel(cost.category);
                  return (
                    <tr key={cost.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'white',
                          background: catInfo.color
                        }}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        ¥{(cost.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>{cost.note}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                        {formatDate(cost.cost_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #0a2540' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>合計</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#f59e0b', fontSize: '1.1rem' }}>
                    ¥{costsTotal.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* 科目別小計 */}
          {Object.keys(categorySubtotals).length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.75rem' }}>
                {selectedMonth}月 科目別小計
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {Object.entries(categorySubtotals).map(([cat, amount]) => {
                  const catInfo = getCategoryLabel(cat);
                  return (
                    <div key={cat} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: catInfo.color
                      }}></span>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{catInfo.label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                        ¥{amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* 日報タブ */}
        {activeTab === 'daily' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0a2540' }}>日報一覧</h3>
              <button
                onClick={() => setShowDailyForm(!showDailyForm)}
                className="add-button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                日報追加
              </button>
            </div>

            {/* 日報追加フォーム */}
            {showDailyForm && (
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>作業日</label>
                    <input
                      type="date"
                      value={newDaily.work_date}
                      onChange={(e) => setNewDaily({ ...newDaily, work_date: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>職長名</label>
                    <input
                      type="text"
                      value={newDaily.foreman_name}
                      onChange={(e) => setNewDaily({ ...newDaily, foreman_name: e.target.value })}
                      placeholder="例: 田中"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ flex: 2, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>備考</label>
                    <input
                      type="text"
                      value={newDaily.notes}
                      onChange={(e) => setNewDaily({ ...newDaily, notes: e.target.value })}
                      placeholder="例: 基礎工事"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>作業員明細</label>
                    <button
                      onClick={addDailyItem}
                      style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      + 行追加
                    </button>
                  </div>
                  {newDaily.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="作業員名"
                        value={item.worker_name}
                        onChange={(e) => updateDailyItem(idx, 'worker_name', e.target.value)}
                        style={{ flex: 2, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                      />
                      <input
                        type="number"
                        placeholder="時間"
                        value={item.hours}
                        onChange={(e) => updateDailyItem(idx, 'hours', Number(e.target.value))}
                        style={{ width: '80px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                      />
                      <span style={{ color: '#666', fontSize: '0.875rem' }}>h</span>
                      <input
                        type="number"
                        placeholder="単価"
                        value={item.wage_rate}
                        onChange={(e) => updateDailyItem(idx, 'wage_rate', Number(e.target.value))}
                        style={{ width: '100px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                      />
                      <span style={{ color: '#666', fontSize: '0.875rem' }}>円</span>
                      <span style={{ color: '#3b82f6', fontWeight: '600', width: '100px', textAlign: 'right' }}>
                        ¥{(item.hours * item.wage_rate).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeDailyItem(idx)}
                        style={{ background: '#fee2e2', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', fontWeight: '600', color: '#0a2540', marginTop: '0.5rem' }}>
                    合計: ¥{newDaily.items.reduce((sum, i) => sum + (i.hours * i.wage_rate), 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleAddDaily}
                    style={{ background: '#FF6B00', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setShowDailyForm(false)}
                    style={{ background: '#e2e8f0', color: '#666', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* 日報一覧 */}
            {dailyReports.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                日報がまだありません
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dailyReports.map(report => (
                  <div key={report.id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: '600', color: '#0a2540' }}>{report.work_date}</span>
                        <span style={{ color: '#666' }}>職長: {report.foreman_name}</span>
                        {report.notes && <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({report.notes})</span>}
                      </div>
                      <span style={{ fontWeight: '600', color: '#3b82f6', fontSize: '1.1rem' }}>
                        ¥{report.total_amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {report.items.map(item => (
                        <span key={item.id} style={{
                          background: '#f1f5f9',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          color: '#475569'
                        }}>
                          {item.worker_name} ({item.hours}h × ¥{item.wage_rate.toLocaleString()} = ¥{item.amount.toLocaleString()})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 請求タブ */}
        {activeTab === 'invoices' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0a2540' }}>請求一覧</h3>
              <button
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="add-button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                請求追加
              </button>
            </div>

            {/* 請求追加フォーム */}
            {showInvoiceForm && (
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <div style={{ width: '150px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>請求月</label>
                  <input
                    type="month"
                    value={newInvoice.billing_month}
                    onChange={(e) => setNewInvoice({ ...newInvoice, billing_month: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ width: '180px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>金額</label>
                  <input
                    type="text"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: sanitizeAmount(e.target.value) })}
                    placeholder="例: 1000000"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>備考</label>
                  <input
                    type="text"
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    placeholder="例: 1月分出来高"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <button
                  onClick={handleAddInvoice}
                  disabled={savingInvoice}
                  style={{
                    background: savingInvoice ? '#ccc' : '#FF6B00',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: savingInvoice ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {savingInvoice ? '保存中...' : '追加'}
                </button>
                <button
                  onClick={() => setShowInvoiceForm(false)}
                  style={{ background: '#e2e8f0', color: '#666', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  キャンセル
                </button>
              </div>
            )}

            {/* 請求一覧 */}
            {invoices.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                請求がまだありません
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666', fontWeight: '600' }}>請求月</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: '#666', fontWeight: '600' }}>金額</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: '#666', fontWeight: '600' }}>ステータス</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666', fontWeight: '600' }}>備考</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: '#666', fontWeight: '600' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => {
                    const statusInfo = getInvoiceStatusLabel(invoice.status);
                    return (
                      <tr key={invoice.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{invoice.billing_month}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#0066cc' }}>
                          ¥{invoice.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: statusInfo.color,
                            background: statusInfo.bg
                          }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#666' }}>{invoice.notes || '-'}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleInvoiceStatus(invoice.id, 'issued')}
                              style={{ background: '#0066cc', color: 'white', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                            >
                              発行
                            </button>
                          )}
                          {invoice.status === 'issued' && (
                            <button
                              onClick={() => handleInvoiceStatus(invoice.id, 'paid')}
                              style={{ background: '#059669', color: 'white', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                            >
                              入金
                            </button>
                          )}
                          {invoice.status === 'paid' && (
                            <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.875rem' }}>完了</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #0a2540' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>合計</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#0066cc', fontSize: '1.1rem' }}>
                      ¥{invoices.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
