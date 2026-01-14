import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManagementRoom.css';

const ManagementRoom: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const stats = [
    { label: '今期売上', value: '¥125M', color: 'purple' },
    { label: '利益率', value: '18.5%', color: 'green' },
    { label: '全工事数', value: '23', color: 'blue' },
    { label: 'アラート', value: '2', color: 'orange' },
  ];

  const menuItems = [
    { name: 'ダッシュボード', path: '/management/dashboard' },
    { name: '利益率分析', path: '/management/analysis' },
    { name: 'AI秘書', path: '/management/ai' },
  ];

  const alerts = [
    { id: 1, type: 'warning', message: '福岡高速5号線 - 利益率が目標を下回っています', value: '12.3%' },
    { id: 2, type: 'info', message: '今月の売上目標達成まであと ¥15,000,000', value: '88%' },
  ];

  const topProjects = [
    { id: 1, name: '博多駅前舗装工事', revenue: '¥82M', profit: '24.5%' },
    { id: 2, name: '天神地下街防水工事', revenue: '¥158M', profit: '19.8%' },
    { id: 3, name: '福岡空港連絡道路', revenue: '¥245M', profit: '22.1%' },
  ];

  const visibleItems = expanded ? menuItems : menuItems.slice(0, 3);
  const hiddenCount = menuItems.length - 3;

  return (
    <div className="room-container">
      <header className="room-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          ホーム
        </button>
        <h1 className="room-title">経営部屋</h1>
        <div className="user-badge">たく</div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-glow"></div>
          </div>
        ))}
      </section>

      {/* アラートセクション */}
      <section className="alerts-section">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-card alert-${alert.type}`}>
            <div className="alert-icon">{alert.type === 'warning' ? '⚠️' : 'ℹ️'}</div>
            <div className="alert-content">
              <div className="alert-message">{alert.message}</div>
            </div>
            <div className="alert-value">{alert.value}</div>
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="title-line"></span>
          クイックアクション
        </h2>
        <div className="menu-list">
          {visibleItems.map((item, index) => (
            <button
              key={index}
              className={`menu-item ${index >= 3 ? 'menu-item-animated' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="menu-dot"></span>
              <span className="menu-name">{item.name}</span>
              <span className="menu-arrow">→</span>
            </button>
          ))}
        </div>
        
        {hiddenCount > 0 && (
          <button className="expand-button" onClick={() => setExpanded(!expanded)}>
            <span className="pulse-line"></span>
            <span className="expand-badge">
              {expanded ? '▲ 閉じる' : `▼ +${hiddenCount}件`}
            </span>
            <span className="pulse-line"></span>
          </button>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="title-line"></span>
          利益率TOP工事
        </h2>
        <div className="recent-list">
          {topProjects.map((project, index) => (
            <div key={project.id} className="top-project-item">
              <div className="rank-badge">#{index + 1}</div>
              <div className="project-info">
                <div className="project-name">{project.name}</div>
                <div className="project-revenue">売上 {project.revenue}</div>
              </div>
              <div className="profit-badge">
                <span className="profit-value">{project.profit}</span>
                <span className="profit-label">利益率</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ManagementRoom;
