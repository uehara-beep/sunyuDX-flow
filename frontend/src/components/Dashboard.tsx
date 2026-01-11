import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const categories = ['労務費', '外注費', '材料費', '機械費', '経費'];

  const kpis = [
    { label: '総売上', value: '¥248M', change: '+12.5%', positive: true },
    { label: '総原価', value: '¥198M', change: '+8.2%', positive: false },
    { label: '粗利益', value: '¥50M', change: '+24.3%', positive: true },
    { label: '利益率', value: '20.2%', change: '+2.1pt', positive: true },
  ];

  const projects = [
    { name: '広島自動車道 烏帽子橋工事', budget: 100000000, actual: 78500000, rate: 21.5, progress: 72 },
    { name: '国道2号線 舗装工事', budget: 36000000, actual: 32400000, rate: 18.2, progress: 90 },
    { name: '市道改良工事', budget: 22400000, actual: 5600000, rate: 25.0, progress: 25 },
  ];

  const categoryData = [
    { name: '労務費', budget: 40000000, actual: 35200000 },
    { name: '外注費', budget: 35000000, actual: 32100000 },
    { name: '材料費', budget: 30000000, actual: 28500000 },
    { name: '機械費', budget: 20000000, actual: 18200000 },
    { name: '経費', budget: 15000000, actual: 12500000 },
  ];

  return (
    <div className="page-container management">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/management')}>
          ← 経営部屋へ
        </button>
        <h1 className="page-title">📊 経営ダッシュボード</h1>
        <p className="page-subtitle">リアルタイム経営分析</p>
      </header>

      <main className="page-content">
        {/* KPIカード */}
        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>主要KPI</h2>
            <span className="period-badge">2026年1月</span>
          </div>
          <div className="kpi-grid">
            {kpis.map((kpi, i) => (
              <div key={i} className="kpi-card">
                <span className="kpi-label">{kpi.label}</span>
                <span className="kpi-value">{kpi.value}</span>
                <span className={`kpi-change ${kpi.positive ? 'positive' : 'negative'}`}>
                  {kpi.change}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="dashboard-grid">
          {/* 左カラム：プロジェクト別 */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>工事別利益率</h2>
            </div>
            <div className="project-chart">
              {projects.map((project, i) => (
                <div key={i} className="project-row">
                  <div className="project-info">
                    <span className="project-name">{project.name}</span>
                    <span className={`project-rate ${project.rate >= 20 ? 'positive' : 'warning'}`}>
                      {project.rate}%
                    </span>
                  </div>
                  <div className="project-bars">
                    <div className="bar-row">
                      <span className="bar-label">予算</span>
                      <div className="bar budget">
                        <div className="bar-fill" style={{ width: '100%' }}></div>
                      </div>
                      <span className="bar-value">¥{(project.budget / 10000).toLocaleString()}万</span>
                    </div>
                    <div className="bar-row">
                      <span className="bar-label">実績</span>
                      <div className="bar actual">
                        <div className="bar-fill" style={{ width: `${(project.actual / project.budget) * 100}%` }}></div>
                      </div>
                      <span className="bar-value">¥{(project.actual / 10000).toLocaleString()}万</span>
                    </div>
                  </div>
                  <div className="progress-indicator">
                    <span>{project.progress}%完了</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 右カラム：科目別 */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>科目別予実</h2>
            </div>
            <div className="category-chart">
              {categoryData.map((cat, i) => (
                <div key={i} className="category-row">
                  <span className="category-name">{cat.name}</span>
                  <div className="category-bars">
                    <div className="dual-bar">
                      <div className="bar-budget" style={{ width: '100%' }}></div>
                      <div className="bar-actual" style={{ width: `${(cat.actual / cat.budget) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="category-values">
                    <span className="budget-value">¥{(cat.budget / 10000).toLocaleString()}万</span>
                    <span className="actual-value">¥{(cat.actual / 10000).toLocaleString()}万</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot budget"></span>予算</span>
              <span className="legend-item"><span className="dot actual"></span>実績</span>
            </div>
          </section>
        </div>

        {/* アラート */}
        <section className="form-section">
          <div className="section-header">
            <div className="section-line alert"></div>
            <h2>⚠️ アラート</h2>
          </div>
          <div className="alerts-card">
            <div className="alert-item warning">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <span className="alert-title">国道2号線 舗装工事</span>
                <span className="alert-message">利益率が目標20%を下回っています（現在18.2%）</span>
              </div>
              <button className="alert-action" onClick={() => navigate('/construction/ledger')}>詳細</button>
            </div>
            <div className="alert-item info">
              <span className="alert-icon">📅</span>
              <div className="alert-content">
                <span className="alert-title">請求書期限</span>
                <span className="alert-message">県道改良工事の請求書が期限超過しています</span>
              </div>
              <button className="alert-action" onClick={() => navigate('/office/invoice')}>確認</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
