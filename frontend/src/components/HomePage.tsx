import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">
          <img src="/images/logo.png" alt="SunyuTECH" className="logo-image" />
        </div>
        <nav className="nav">
          <a href="/" className="nav-item">ホーム</a>
          <a href="/projects" className="nav-item">工事管理</a>
          <a href="#" className="nav-item">原価管理</a>
          <a href="#" className="nav-item">ダッシュボード</a>
        </nav>
      </header>

      <div className="hero-section">
        <h1 className="title">
          sunyuTECHの<br />
          <span className="title-gradient">未来を創る</span>
        </h1>
        <p className="subtitle">
          Stripe級のUX。建設会社のイメージを塗り替える、次世代の原価管理システム
        </p>
      </div>

      <div className="grid">
        <div className="card" onClick={() => navigate('/budget/create')}>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3z" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <h3 className="card-title">実行予算から作る</h3>
          <p className="card-description">
            ゼロから積み上げ方式で実行予算を作成。AIが過去データから最適な予算を提案します。
          </p>
          <button className="card-button">開始する →</button>
        </div>

        <div className="card" onClick={() => navigate('/estimate/upload')}>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <h3 className="card-title">見積書から作る</h3>
          <p className="card-description">
            Excelをアップロードするだけ。AIが自動解析して実行予算に変換します。
          </p>
          <button className="card-button">開始する →</button>
        </div>

        <div className="card" onClick={() => navigate('/projects')}>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11H3v9h6v-9zM15 4H9v16h6V4zM21 6h-6v14h6V6z" />
            </svg>
          </div>
          <h3 className="card-title">工事台帳</h3>
          <p className="card-description">
            リアルタイムで予実管理。赤字リスクを即座に検知します。
          </p>
          <button className="card-button">工事一覧へ →</button>
        </div>

        <div className="card" onClick={() => alert('AI秘書機能は近日公開予定です！')}>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3 className="card-title">AI秘書</h3>
          <p className="card-description">
            音声で質問するだけ。AIが工事の状況を即座に回答します。
          </p>
          <button className="card-button">使ってみる →</button>
        </div>
      </div>

      <div className="status-bar">
        <div className="stat">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="stat-value blue">23</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-value orange">18.5%</div>
          <div className="stat-label">Profit Margin</div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="stat-value green">¥125M</div>
          <div className="stat-label">Revenue</div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-value red">2</div>
          <div className="stat-label">Alerts</div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
