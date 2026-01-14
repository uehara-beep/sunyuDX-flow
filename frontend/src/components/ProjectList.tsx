import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jget, jpost } from '../api';
import './ProjectList.css';

interface Project {
  id: string;
  name?: string;
  title?: string;
  project_name?: string;
  client?: string;
  client_name?: string;
  contract_amount: number;
  budget_amount: number;
  actual_cost: number;
  profit_rate: number;
  progress: number;
  status: string;
  construction_type?: string;
  created_at: string;
}

// プロジェクト表示名を取得（フォールバック付き）
const getProjectName = (p: Project): string => {
  return p.name || p.title || p.project_name || `案件(${p.id.slice(0, 6)})`;
};

const getClientName = (p: Project): string => {
  return p.client || p.client_name || '';
};

const CONSTRUCTION_TYPES = [
  { key: 'all', label: '全て' },
  { key: 'paving', label: '舗装' },
  { key: 'wj', label: 'WJ' },
  { key: 'grinding', label: '研掃' },
  { key: 'deck_repair', label: '床版補修' },
  { key: 'other', label: 'その他' },
];

interface ProjectsResponse {
  status: string;
  projects: Project[];
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [constructionType, setConstructionType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新規作成フォーム用state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', client_name: '', contract_amount: 0, construction_type: 'other' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await jget<ProjectsResponse>('/api/projects');
      setProjects(data.projects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      setFormError('工事名を入力してください');
      return;
    }
    if (!formData.client_name.trim()) {
      setFormError('発注者を入力してください');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      await jpost('/api/projects', formData);
      setShowForm(false);
      setFormData({ name: '', client_name: '', contract_amount: 0, construction_type: 'other' });
      await fetchProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const filters = [
    { id: 'all', name: '全案件', count: projects.length },
    { id: 'active', name: '進行中', count: projects.filter(p => p.status === 'active').length },
    { id: 'completed', name: '完了', count: projects.filter(p => p.status === 'completed').length },
    { id: 'warning', name: '注意', count: projects.filter(p => p.status === 'warning').length },
    { id: 'danger', name: '危険', count: projects.filter(p => p.status === 'danger').length },
  ];

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const name = getProjectName(p);
    const client = getClientName(p);
    const matchesSearch = name.includes(searchTerm) || client.includes(searchTerm);
    const matchesType = constructionType === 'all' || p.construction_type === constructionType;
    return matchesFilter && matchesSearch && matchesType;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '進行中',
      completed: '完了',
      warning: '注意',
      danger: '危険',
      pending: '保留'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <div className="list-page-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-page-container">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          エラー: {error}
          <button onClick={fetchProjects} style={{ marginLeft: '1rem' }}>再読み込み</button>
        </div>
      </div>
    );
  }

  return (
    <div className="list-page-container">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/sales')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          営業部屋
        </button>
        <h1 className="page-title">工事台帳一覧</h1>
        <div className="user-badge">たく</div>
      </header>

      {/* 工種タブ */}
      <div className="construction-type-tabs">
        {CONSTRUCTION_TYPES.map(type => (
          <button
            key={type.key}
            className={`type-tab ${constructionType === type.key ? 'active' : ''}`}
            onClick={() => setConstructionType(type.key)}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="list-layout">
        {/* サイドバー */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">ステータス</h3>
            <ul className="filter-list">
              {filters.map(f => (
                <li key={f.id}>
                  <button
                    className={`filter-item ${filter === f.id ? 'active' : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    <span className="filter-name">{f.name}</span>
                    <span className="filter-count">{f.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="list-main">
          <div className="list-header">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="案件名・発注者で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="add-button" onClick={() => setShowForm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新規案件
            </button>
          </div>

          {/* 新規作成フォーム */}
          {showForm && (
            <div className="create-form-overlay">
              <div className="create-form">
                <h3>新規案件作成</h3>
                {formError && <div className="form-error">{formError}</div>}
                <div className="form-group">
                  <label>工事名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: ○○改修工事"
                  />
                </div>
                <div className="form-group">
                  <label>発注者 *</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="例: ○○建設"
                  />
                </div>
                <div className="form-group">
                  <label>契約金額</label>
                  <input
                    type="number"
                    value={formData.contract_amount}
                    onChange={(e) => setFormData({ ...formData, contract_amount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>工種</label>
                  <select
                    value={formData.construction_type}
                    onChange={(e) => setFormData({ ...formData, construction_type: e.target.value })}
                  >
                    {CONSTRUCTION_TYPES.filter(t => t.key !== 'all').map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button className="btn-cancel" onClick={() => { setShowForm(false); setFormError(null); }}>
                    キャンセル
                  </button>
                  <button className="btn-save" onClick={handleCreateProject} disabled={saving}>
                    {saving ? '保存中...' : '作成'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="project-list">
            {filteredProjects.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                該当する案件がありません
              </div>
            ) : (
              filteredProjects.map(project => (
                <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="project-main">
                    <div className="project-name" style={{ color: '#0066cc', textDecoration: 'underline' }}>{getProjectName(project)}</div>
                    <div className="project-client">{getClientName(project)}</div>
                  </div>
                  <div className="project-amount">¥{(project.contract_amount || 0).toLocaleString()}</div>
                  <div className="project-date">{formatDate(project.created_at)}</div>
                  <div className={`project-status status-${project.status}`}>
                    {getStatusLabel(project.status)}
                  </div>
                  <button className="project-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectList;
