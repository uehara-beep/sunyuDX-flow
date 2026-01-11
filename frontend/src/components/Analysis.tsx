import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Analysis.css';

const Analysis: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('2026-01');
  const [analysisType, setAnalysisType] = useState<'profit' | 'cost' | 'trend'>('profit');

  const profitData = [
    { project: '広島自動車道 烏帽子橋工事', revenue: 100000000, cost: 78500000, profit: 21500000, rate: 21.5 },
    { project: '国道2号線 舗装工事', revenue: 36000000, cost: 29448000, profit: 6552000, rate: 18.2 },
    { project: '市道改良工事', revenue: 22400000, cost: 16800000, profit: 5600000, rate: 25.0 },
  ];

  const costBreakdown = [
    { category: '労務費', budget: 40000000, actual: 35200000, variance: 4800000 },
    { category: '外注費', budget: 35000000, actual: 32100000, variance: 2900000 },
    { category: '材料費', budget: 30000000, actual: 28500000, variance: 1500000 },
    { category: '機械費', budget: 20000000, actual: 18200000, variance: 1800000 },
    { category: '経費', budget: 15000000, actual: 12500000, variance: 2500000 },
  ];

  const monthlyTrend = [
    { month: '2025-08', revenue: 45000000, cost: 38000000, profit: 7000000 },
    { month: '2025-09', revenue: 52000000, cost: 42000000, profit: 10000000 },
    { month: '2025-10', revenue: 48000000, cost: 40000000, profit: 8000000 },
    { month: '2025-11', revenue: 55000000, cost: 44000000, profit: 11000000 },
    { month: '2025-12', revenue: 60000000, cost: 48000000, profit: 12000000 },
    { month: '2026-01', revenue: 65000000, cost: 50000000, profit: 15000000 },
  ];

  const totalProfit = profitData.reduce((sum, p) => sum + p.profit, 0);
  const avgRate = (profitData.reduce((sum, p) => sum + p.rate, 0) / profitData.length).toFixed(1);

  return (
    <div className="page-container management">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/management')}>
          ← 経営部屋へ
        </button>
        <h1 className="page-title">📈 収益分析</h1>
        <p className="page-subtitle">プロジェクト別収益・コスト分析</p>
      </header>

      <main className="page-content">
        {/* フィルター */}
        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>分析条件</h2>
          </div>
          <div className="filter-card">
            <div className="filter-row">
              <div className="filter-group">
                <label>対象期間</label>
                <input
                  type="month"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                />
              </div>
              <div className="analysis-tabs">
                <button
                  className={`tab-button ${analysisType === 'profit' ? 'active' : ''}`}
                  onClick={() => setAnalysisType('profit')}
                >
                  利益分析
                </button>
                <button
                  className={`tab-button ${analysisType === 'cost' ? 'active' : ''}`}
                  onClick={() => setAnalysisType('cost')}
                >
                  コスト分析
                </button>
                <button
                  className={`tab-button ${analysisType === 'trend' ? 'active' : ''}`}
                  onClick={() => setAnalysisType('trend')}
                >
                  推移分析
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* サマリー */}
        <div className="analysis-summary">
          <div className="summary-item">
            <span className="summary-label">総利益</span>
            <span className="summary-value">¥{(totalProfit / 10000).toLocaleString()}万</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">平均利益率</span>
            <span className="summary-value">{avgRate}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">分析対象</span>
            <span className="summary-value">{profitData.length}件</span>
          </div>
        </div>

        {/* 利益分析 */}
        {analysisType === 'profit' && (
          <section className="form-section">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>プロジェクト別利益</h2>
            </div>
            <div className="analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>工事名</th>
                    <th className="right">売上</th>
                    <th className="right">原価</th>
                    <th className="right">利益</th>
                    <th className="right">利益率</th>
                  </tr>
                </thead>
                <tbody>
                  {profitData.map((project, i) => (
                    <tr key={i}>
                      <td>{project.project}</td>
                      <td className="right">¥{(project.revenue / 10000).toLocaleString()}万</td>
                      <td className="right">¥{(project.cost / 10000).toLocaleString()}万</td>
                      <td className="right profit">¥{(project.profit / 10000).toLocaleString()}万</td>
                      <td className={`right rate ${project.rate >= 20 ? 'positive' : 'warning'}`}>
                        {project.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-section">
              <h3>利益率比較</h3>
              <div className="horizontal-bars">
                {profitData.map((project, i) => (
                  <div key={i} className="h-bar-row">
                    <span className="h-bar-label">{project.project.substring(0, 15)}...</span>
                    <div className="h-bar-container">
                      <div
                        className={`h-bar-fill ${project.rate >= 20 ? 'positive' : 'warning'}`}
                        style={{ width: `${(project.rate / 30) * 100}%` }}
                      ></div>
                    </div>
                    <span className="h-bar-value">{project.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* コスト分析 */}
        {analysisType === 'cost' && (
          <section className="form-section">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>科目別コスト分析</h2>
            </div>
            <div className="analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>科目</th>
                    <th className="right">予算</th>
                    <th className="right">実績</th>
                    <th className="right">差異</th>
                    <th className="right">消化率</th>
                  </tr>
                </thead>
                <tbody>
                  {costBreakdown.map((item, i) => (
                    <tr key={i}>
                      <td>{item.category}</td>
                      <td className="right">¥{(item.budget / 10000).toLocaleString()}万</td>
                      <td className="right">¥{(item.actual / 10000).toLocaleString()}万</td>
                      <td className="right variance positive">
                        +¥{(item.variance / 10000).toLocaleString()}万
                      </td>
                      <td className="right">
                        {((item.actual / item.budget) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-section">
              <h3>予算vs実績</h3>
              <div className="stacked-bars">
                {costBreakdown.map((item, i) => (
                  <div key={i} className="stacked-row">
                    <span className="stacked-label">{item.category}</span>
                    <div className="stacked-container">
                      <div className="stacked-budget" style={{ width: '100%' }}></div>
                      <div
                        className="stacked-actual"
                        style={{ width: `${(item.actual / item.budget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="dot budget"></span>予算</span>
                <span className="legend-item"><span className="dot actual"></span>実績</span>
              </div>
            </div>
          </section>
        )}

        {/* 推移分析 */}
        {analysisType === 'trend' && (
          <section className="form-section">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>月次推移</h2>
            </div>
            <div className="analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>月</th>
                    <th className="right">売上</th>
                    <th className="right">原価</th>
                    <th className="right">利益</th>
                    <th className="right">前月比</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrend.map((month, i) => {
                    const prevProfit = i > 0 ? monthlyTrend[i - 1].profit : month.profit;
                    const change = ((month.profit - prevProfit) / prevProfit * 100).toFixed(1);
                    return (
                      <tr key={i}>
                        <td>{month.month}</td>
                        <td className="right">¥{(month.revenue / 10000).toLocaleString()}万</td>
                        <td className="right">¥{(month.cost / 10000).toLocaleString()}万</td>
                        <td className="right profit">¥{(month.profit / 10000).toLocaleString()}万</td>
                        <td className={`right ${Number(change) >= 0 ? 'positive' : 'negative'}`}>
                          {Number(change) >= 0 ? '+' : ''}{change}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="chart-section">
              <h3>利益推移グラフ</h3>
              <div className="trend-chart">
                {monthlyTrend.map((month, i) => {
                  const maxProfit = Math.max(...monthlyTrend.map(m => m.profit));
                  return (
                    <div key={i} className="trend-bar-wrapper">
                      <div
                        className="trend-bar"
                        style={{ height: `${(month.profit / maxProfit) * 100}%` }}
                      ></div>
                      <span className="trend-label">{month.month.split('-')[1]}月</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Analysis;
