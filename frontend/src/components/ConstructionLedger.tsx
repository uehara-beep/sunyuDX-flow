import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jget } from '../api';
import './ConstructionLedger.css';

interface Project {
  id: string;
  name: string;
  client: string;
  contract_amount: number;
  status: string;
}

interface Summary {
  revenue: number;
  cost_total: number;
  gross_profit: number;
  gross_margin: number;
}

const ConstructionLedger: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await jget<{ projects: Project[] }>('/api/projects');
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    try {
      const data = await jget<{ summary: Summary }>(`/api/projects/${project.id}/summary`);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setSummary(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      active: { label: '進行中', class: 'status-active' },
      completed: { label: '完了', class: 'status-completed' },
      pending: { label: '着工前', class: 'status-pending' },
      warning: { label: '注意', class: 'status-warning' },
      danger: { label: '危険', class: 'status-danger' },
    };
    return badges[status] || badges.active;
  };

  if (loading) {
    return (
      <div className="page-container construction">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="page-container construction">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/construction')}>
          ← 工事部屋へ
        </button>
        <h1 className="page-title">📒 工事台帳</h1>
        <p className="page-subtitle">工事案件の詳細管理・進捗確認</p>
      </header>

      <main className="page-content">
        <div className="two-column-ledger">
          {/* 左カラム: プロジェクト一覧 */}
          <div className="projects-list">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>工事一覧</h2>
              <span className="count-badge">{projects.length}件</span>
            </div>
            <div className="projects-cards">
              {projects.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '1rem' }}>案件がありません</p>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="project-header">
                      <span className={`status-badge ${getStatusBadge(project.status).class}`}>
                        {getStatusBadge(project.status).label}
                      </span>
                    </div>
                    <h3 className="project-name">{project.name}</h3>
                    <p className="project-client">{project.client}</p>
                    <div className="project-stats">
                      <div className="stat">
                        <span className="stat-label">契約金額</span>
                        <span className="stat-value">¥{((project.contract_amount || 0) / 10000).toLocaleString()}万</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右カラム: 詳細 */}
          <div className="project-detail">
            {selectedProject ? (
              <>
                <div className="section-header">
                  <div className="section-line"></div>
                  <h2>工事詳細</h2>
                </div>
                <div className="detail-card">
                  <div className="detail-header">
                    <h3 className="detail-name">{selectedProject.name}</h3>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">発注者</span>
                      <span className="detail-value">{selectedProject.client}</span>
                    </div>
                  </div>

                  {summary && (
                    <div className="cost-summary">
                      <h4>収支サマリー</h4>
                      <div className="cost-grid">
                        <div className="cost-item">
                          <span className="cost-label">売上（請求）</span>
                          <span className="cost-value contract">¥{summary.revenue.toLocaleString()}</span>
                        </div>
                        <div className="cost-item">
                          <span className="cost-label">原価合計</span>
                          <span className="cost-value actual">¥{summary.cost_total.toLocaleString()}</span>
                        </div>
                        <div className="cost-item">
                          <span className="cost-label">粗利</span>
                          <span className={`cost-value profit ${summary.gross_profit >= 0 ? 'positive' : 'negative'}`}>
                            ¥{summary.gross_profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="cost-item">
                          <span className="cost-label">粗利率</span>
                          <span className={`cost-value profit ${summary.gross_margin >= 20 ? 'positive' : 'negative'}`}>
                            {summary.gross_margin}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button
                      className="action-button primary"
                      onClick={() => navigate(`/projects/${selectedProject.id}`)}
                    >
                      詳細を開く（原価・請求入力）
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-detail">
                <span className="empty-icon">👈</span>
                <p>左の一覧から工事を選択してください</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConstructionLedger;
