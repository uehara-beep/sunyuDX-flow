import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectList.css';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const projects = [
    { id: 1, name: '福岡高速5号線補修工事', client: 'NEXCO西日本', amount: 12500000, status: 'active', date: '2026/01/10' },
    { id: 2, name: '博多駅前舗装工事', client: '福岡市', amount: 8200000, status: 'completed', date: '2026/01/05' },
    { id: 3, name: '天神地下街防水工事', client: '福岡地下街', amount: 15800000, status: 'active', date: '2026/01/08' },
    { id: 4, name: '福岡空港連絡道路', client: '国土交通省', amount: 24500000, status: 'pending', date: '2026/01/03' },
    { id: 5, name: '北九州モノレール補修', client: '北九州市', amount: 9800000, status: 'completed', date: '2025/12/20' },
  ];

  const filters = [
    { id: 'all', name: '全案件', count: projects.length },
    { id: 'active', name: '進行中', count: projects.filter(p => p.status === 'active').length },
    { id: 'completed', name: '完了', count: projects.filter(p => p.status === 'completed').length },
    { id: 'pending', name: '保留', count: projects.filter(p => p.status === 'pending').length },
  ];

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.name.includes(searchTerm) || p.client.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { active: '進行中', completed: '完了', pending: '保留' };
    return labels[status];
  };

  return (
    <div className="list-page-container">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/sales')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          営業部屋
        </button>
        <h1 className="page-title">案件一覧</h1>
        <div className="user-badge">たく</div>
      </header>

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
            <button className="add-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新規案件
            </button>
          </div>

          <div className="project-list">
            {filteredProjects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-main">
                  <div className="project-name">{project.name}</div>
                  <div className="project-client">{project.client}</div>
                </div>
                <div className="project-amount">¥{project.amount.toLocaleString()}</div>
                <div className="project-date">{project.date}</div>
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
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectList;
