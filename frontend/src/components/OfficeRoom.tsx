import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OfficeRoom.css';

const OfficeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const stats = [
    { label: '本日出勤', value: '48', color: 'green' },
    { label: '経費承認待ち', value: '7', color: 'orange' },
    { label: '未処理請求', value: '12', color: 'blue' },
    { label: '今月処理数', value: '156', color: 'purple' },
  ];

  const menuItems = [
    { name: '勤怠管理', path: '/office/attendance' },
    { name: '経費精算', path: '/office/expense' },
    { name: '請求書管理', path: '/office/invoice' },
  ];

  const pendingItems = [
    { id: 1, type: '経費', name: '燃料費 - 田中', amount: '¥8,500', date: '2026/01/10' },
    { id: 2, type: '請求', name: '〇〇建設 請求書', amount: '¥2,500,000', date: '2026/01/09' },
    { id: 3, type: '経費', name: '駐車場代 - 山田', amount: '¥3,200', date: '2026/01/08' },
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
        <h1 className="room-title">事務部屋</h1>
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
          承認待ち
        </h2>
        <div className="recent-list">
          {pendingItems.map((item, index) => (
            <div key={item.id} className="pending-item">
              <div className="type-badge">{item.type}</div>
              <div className="pending-info">
                <div className="pending-name">{item.name}</div>
                <div className="pending-date">{item.date}</div>
              </div>
              <div className="pending-amount">{item.amount}</div>
              <div className="pending-actions">
                <button className="btn-approve">承認</button>
                <button className="btn-reject">却下</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OfficeRoom;
