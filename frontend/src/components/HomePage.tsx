import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'ホーム', path: '/' },
    { name: '営業', path: '/sales' },
    { name: '工事', path: '/construction' },
    { name: '事務', path: '/office' },
    { name: '経営', path: '/management' },
  ];

  const departments = [
    {
      id: 'sales',
      name: '営業',
      color: '#FF6B00',
      gradientEnd: '#ffaa00',
      description: '見積・受注・予算管理',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="32" height="32">
          <defs>
            <linearGradient id="salesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
          </defs>
          <path stroke="url(#salesGrad)" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
          <path stroke="url(#salesGrad)" strokeLinecap="round" strokeLinejoin="round" d="M7 14l4-4 3 3 6-6" />
          <path stroke="url(#salesGrad)" strokeLinecap="round" strokeLinejoin="round" d="M17 7h3v3" />
        </svg>
      ),
      items: [
        { name: '見積書アップロード', path: '/estimate/upload' },
        { name: '実行予算作成', path: '/budget/create' },
        { name: '予算一覧', path: '/budget/list' },
        { name: '案件一覧', path: '/projects' },
      ],
    },
    {
      id: 'construction',
      name: '工事',
      color: '#0066cc',
      gradientEnd: '#00d4ff',
      description: '現場・日報・原価管理',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="32" height="32">
          <defs>
            <linearGradient id="constGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066cc" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="3" stroke="url(#constGrad)" strokeLinecap="round" />
          <path stroke="url(#constGrad)" strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      items: [
        { name: '工事台帳', path: '/construction/ledger' },
        { name: '日報入力', path: '/daily/report' },
        { name: '原価入力', path: '/cost/input' },
      ],
    },
    {
      id: 'office',
      name: '事務',
      color: '#10b981',
      gradientEnd: '#34d399',
      description: '勤怠・経費・請求管理',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="32" height="32">
          <defs>
            <linearGradient id="officeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#officeGrad)" strokeLinecap="round" />
          <path stroke="url(#officeGrad)" strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
          <path stroke="url(#officeGrad)" strokeLinecap="round" strokeLinejoin="round" d="M9 16l2 2 4-4" />
        </svg>
      ),
      items: [
        { name: '勤怠管理', path: '/office/attendance' },
        { name: '経費精算', path: '/office/expense' },
        { name: '請求書管理', path: '/office/invoice' },
      ],
    },
    {
      id: 'management',
      name: '経営',
      color: '#8b5cf6',
      gradientEnd: '#c084fc',
      description: 'ダッシュボード・分析',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="32" height="32">
          <defs>
            <linearGradient id="mgmtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" stroke="url(#mgmtGrad)" strokeLinecap="round" />
          <path stroke="url(#mgmtGrad)" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
      items: [
        { name: 'ダッシュボード', path: '/management/dashboard' },
        { name: '利益率分析', path: '/management/analysis' },
        { name: 'AI秘書', path: '/management/ai' },
      ],
    },
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <div className="logo">
            <img src="/images/logo.png" alt="SunyuTECH" className="logo-image" />
            <span className="logo-text">
              <span className="logo-sunyu">sunyu</span>
              <span className="logo-tech">TECH</span>
            </span>
          </div>
          <nav className="header-nav">
            {navItems.map((item) => (
              <a
                key={item.name}
                className={`nav-item ${item.path === '/' ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="header-right">
          <div className="user-badge">たく</div>
        </div>
      </header>

      <section className="hero-section">
        <h1 className="title">
          <span className="title-dark">sunyuTECHの</span>
          <span className="title-gradient">未来を創る</span>
        </h1>
        <p className="subtitle">次世代の原価管理システム</p>
      </section>

      {/* 12月入力導線カード */}
      <section className="december-guide-section">
        <div className="december-guide-card" onClick={() => navigate('/projects')}>
          <div className="guide-badge">運用中</div>
          <div className="guide-content">
            <h3>12月 売上・原価入力</h3>
            <p className="guide-path">
              営業部屋 → 案件一覧 → 案件クリック → 詳細で請求/原価入力
            </p>
          </div>
          <div className="guide-arrow">→</div>
        </div>
      </section>

      <section className="departments-grid">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="department-card"
            style={{ '--dept-color': dept.color, '--dept-gradient-end': dept.gradientEnd } as React.CSSProperties}
            onClick={() => navigate(`/${dept.id}`)}
          >
            <div className="card-top-line"></div>
            <div className="card-header">
              <div className="card-icon-wrapper">
                {dept.icon}
              </div>
              <h2 className="card-title">{dept.name}</h2>
            </div>
            <p className="card-description">{dept.description}</p>
            <ul className="card-items">
              {dept.items.map((item, index) => (
                <li
                  key={index}
                  className="card-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                >
                  <span className="item-dot"></span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-arrow">→</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="home-footer">
        <p>© 2026 株式会社サンユウテック</p>
      </footer>
    </div>
  );
};

export default HomePage;
