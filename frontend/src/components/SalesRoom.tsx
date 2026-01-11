import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SalesRoom.css';

const SalesRoom: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const stats = [
    { label: '見積総数', value: '12', color: 'orange' },
    { label: '承認待ち', value: '3', color: 'blue' },
    { label: '受注率', value: '85%', color: 'green' },
    { label: '今週作成', value: '2', color: 'purple' },
  ];

  const menuItems = [
    { name: '見積書アップロード', path: '/estimate/upload' },
    { name: '実行予算作成', path: '/budget/create' },
    { name: '案件一覧', path: '/projects' },
    { name: '請求書発行', path: '/sales/invoice' },
    { name: '契約管理', path: '/sales/contract' },
    { name: '顧客データ', path: '/sales/customers' },
  ];

  const recentItems = [
    { id: 1, name: '福岡高速5号線補修工事', amount: '¥12,500,000', status: '承認待ち', statusType: 'pending' },
    { id: 2, name: '博多駅前舗装工事', amount: '¥8,200,000', status: '承認済み', statusType: 'approved' },
    { id: 3, name: '天神地下街防水工事', amount: '¥15,800,000', status: '下書き', statusType: 'draft' },
  ];

  const visibleItems = expanded ? menuItems : menuItems.slice(0, 3);
  const hiddenCount = menuItems.length - 3;

  return (
    <div className="room-container">
      {/* ヘッダー */}
      <header className="room-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          ホーム
        </button>
        <h1 className="room-title">営業部屋</h1>
        <div className="user-badge">たく</div>
      </header>

      {/* 統計カード */}
      <section className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-glow"></div>
          </div>
        ))}
      </section>

      {/* クイックアクション */}
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
        
        {/* パルスライン展開ボタン */}
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

      {/* 最近の活動 */}
      <section className="section">
        <h2 className="section-title">
          <span className="title-line"></span>
          最近の見積
        </h2>
        <div className="recent-list">
          {recentItems.map((item, index) => (
            <div key={item.id} className="recent-item">
              <div className="recent-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="recent-info">
                <div className="recent-name">{item.name}</div>
                <div className="recent-amount">{item.amount}</div>
              </div>
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

export default SalesRoom;
