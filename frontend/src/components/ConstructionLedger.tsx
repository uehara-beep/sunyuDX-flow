import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConstructionLedger.css';

interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  contractAmount: number;
  budgetAmount: number;
  actualCost: number;
  profitRate: number;
  progress: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending';
}

const ConstructionLedger: React.FC = () => {
  const navigate = useNavigate();
  const categories = ['労務費', '外注費', '材料費', '機械費', '経費'];

  const [projects] = useState<Project[]>([
    {
      id: '1',
      code: 'SYT-2026-001',
      name: '広島自動車道 烏帽子橋工事',
      client: '広島県道路公社',
      contractAmount: 125000000,
      budgetAmount: 100000000,
      actualCost: 78500000,
      profitRate: 21.5,
      progress: 72,
      startDate: '2026-01-15',
      endDate: '2026-06-30',
      status: 'active',
    },
    {
      id: '2',
      code: 'SYT-2026-002',
      name: '国道2号線 舗装工事',
      client: '国土交通省',
      contractAmount: 45000000,
      budgetAmount: 36000000,
      actualCost: 32400000,
      profitRate: 18.2,
      progress: 90,
      startDate: '2025-11-01',
      endDate: '2026-02-28',
      status: 'active',
    },
    {
      id: '3',
      code: 'SYT-2026-003',
      name: '市道改良工事',
      client: '広島市',
      contractAmount: 28000000,
      budgetAmount: 22400000,
      actualCost: 5600000,
      profitRate: 25.0,
      progress: 25,
      startDate: '2026-02-01',
      endDate: '2026-05-31',
      status: 'active',
    },
  ]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      active: { label: '進行中', class: 'status-active' },
      completed: { label: '完了', class: 'status-completed' },
      pending: { label: '着工前', class: 'status-pending' },
    };
    return badges[status] || badges.pending;
  };

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
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-header">
                    <span className="project-code">{project.code}</span>
                    <span className={`status-badge ${getStatusBadge(project.status).class}`}>
                      {getStatusBadge(project.status).label}
                    </span>
                  </div>
                  <h3 className="project-name">{project.name}</h3>
                  <p className="project-client">{project.client}</p>
                  <div className="project-stats">
                    <div className="stat">
                      <span className="stat-label">契約金額</span>
                      <span className="stat-value">¥{(project.contractAmount / 10000).toLocaleString()}万</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">利益率</span>
                      <span className={`stat-value ${project.profitRate >= 20 ? 'positive' : 'negative'}`}>
                        {project.profitRate}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <span className="progress-label">{project.progress}% 完了</span>
                </div>
              ))}
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
                    <span className="detail-code">{selectedProject.code}</span>
                    <h3 className="detail-name">{selectedProject.name}</h3>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">発注者</span>
                      <span className="detail-value">{selectedProject.client}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">工期</span>
                      <span className="detail-value">{selectedProject.startDate} ~ {selectedProject.endDate}</span>
                    </div>
                  </div>

                  <div className="cost-summary">
                    <h4>原価サマリー</h4>
                    <div className="cost-grid">
                      <div className="cost-item">
                        <span className="cost-label">契約金額</span>
                        <span className="cost-value contract">¥{selectedProject.contractAmount.toLocaleString()}</span>
                      </div>
                      <div className="cost-item">
                        <span className="cost-label">実行予算</span>
                        <span className="cost-value budget">¥{selectedProject.budgetAmount.toLocaleString()}</span>
                      </div>
                      <div className="cost-item">
                        <span className="cost-label">実績原価</span>
                        <span className="cost-value actual">¥{selectedProject.actualCost.toLocaleString()}</span>
                      </div>
                      <div className="cost-item">
                        <span className="cost-label">予想利益率</span>
                        <span className={`cost-value profit ${selectedProject.profitRate >= 20 ? 'positive' : 'negative'}`}>
                          {selectedProject.profitRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="category-breakdown">
                    <h4>科目別内訳</h4>
                    {categories.map(cat => (
                      <div key={cat} className="category-row">
                        <span className="category-name">{cat}</span>
                        <div className="category-bar">
                          <div className="category-fill" style={{ width: `${Math.random() * 100}%` }}></div>
                        </div>
                        <span className="category-amount">¥{Math.floor(Math.random() * 20000000).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="detail-actions">
                    <button className="action-button" onClick={() => navigate('/daily/report')}>日報入力</button>
                    <button className="action-button" onClick={() => navigate('/cost/input')}>原価入力</button>
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
