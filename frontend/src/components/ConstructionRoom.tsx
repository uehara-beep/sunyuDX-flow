import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConstructionRoom.css';

const ConstructionRoom: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const stats = [
    { label: '進行中工事', value: '8', color: 'blue' },
    { label: '本日の日報', value: '5', color: 'orange' },
    { label: '出勤作業員', value: '45', color: 'green' },
    { label: '平均利益率', value: '21%', color: 'purple' },
  ];

  const menuItems = [
    { name: '工事台帳', path: '/construction/ledger' },
    { name: '日報入力', path: '/daily/report' },
    { name: '原価入力', path: '/cost/input' },
  ];

  const recentItems = [
    { id: 1, name: '福岡高速5号線補修工事', progress: 75, status: '順調', statusType: 'good' },
    { id: 2, name: '博多駅前舗装工事', progress: 45, status: '順調', statusType: 'good' },
    { id: 3, name: '天神地下街防水工事', progress: 20, status: '遅延', statusType: 'delayed' },
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
        <h1 className="room-title">工事部屋</h1>
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

      {/* 12月入力導線 */}
      <section className="december-guide">
        <div className="guide-card" onClick={() => navigate('/construction/ledger')}>
          <div className="guide-badge-small">運用中</div>
          <div className="guide-text">
            <strong>12月 売上・原価入力</strong>
            <span>工事台帳 → 工事選択 → 詳細で入力</span>
          </div>
          <span className="guide-arrow-small">→</span>
        </div>
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
          進行中の工事
        </h2>
        <div className="recent-list">
          {recentItems.map((item, index) => (
            <div key={item.id} className="recent-item">
              <div className="recent-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="recent-info">
                <div className="recent-name">{item.name}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>
              <div className="progress-text">{item.progress}%</div>
              <div className={`recent-status status-${item.statusType}`}>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ConstructionRoom;
