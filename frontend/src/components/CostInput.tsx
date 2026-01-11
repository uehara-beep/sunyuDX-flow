import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CostInput.css';

interface CostEntry {
  id: number;
  date: string;
  category: string;
  item: string;
  amount: number;
  vendor: string;
}

const CostInput: React.FC = () => {
  const navigate = useNavigate();
  const categories = ['労務費', '外注費', '材料費', '機械費', '経費'];

  const [project, setProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('労務費');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [vendor, setVendor] = useState('');
  const [entries, setEntries] = useState<CostEntry[]>([]);

  const handleAIClassify = () => {
    if (!item) {
      alert('項目名を入力してください');
      return;
    }
    // AIによる自動分類（デモ）
    const keywords: Record<string, string> = {
      '人件費': '労務費', '給料': '労務費', '作業員': '労務費',
      '下請': '外注費', '協力会社': '外注費',
      'コンクリート': '材料費', '鉄筋': '材料費', '資材': '材料費',
      'クレーン': '機械費', '重機': '機械費', 'リース': '機械費',
      '交通費': '経費', '宿泊': '経費', '消耗品': '経費',
    };
    for (const [keyword, cat] of Object.entries(keywords)) {
      if (item.includes(keyword)) {
        setCategory(cat);
        alert(`AIが「${cat}」に分類しました`);
        return;
      }
    }
    alert('分類できませんでした。手動で選択してください。');
  };

  const addEntry = () => {
    if (!project || !item || !amount) {
      alert('必須項目を入力してください');
      return;
    }
    const newEntry: CostEntry = {
      id: Date.now(),
      date,
      category,
      item,
      amount,
      vendor,
    };
    setEntries([newEntry, ...entries]);
    setItem('');
    setAmount(0);
    setVendor('');
    alert('原価を記録しました');
  };

  const totalByCategory = categories.map(cat => ({
    name: cat,
    total: entries.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  }));

  return (
    <div className="page-container construction">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/construction')}>
          ← 工事部屋へ
        </button>
        <h1 className="page-title">💹 原価入力</h1>
        <p className="page-subtitle">AI自動分類で科目別原価管理</p>
      </header>

      <main className="page-content">
        <div className="two-column">
          <div className="main-column">
            <section className="form-section">
              <div className="section-header">
                <div className="section-line"></div>
                <h2>原価記録</h2>
              </div>
              <div className="form-card">
                <div className="form-grid">
                  <div className="form-group">
                    <label>工事名 *</label>
                    <select value={project} onChange={e => setProject(e.target.value)}>
                      <option value="">選択してください</option>
                      <option value="1">広島自動車道 烏帽子橋工事</option>
                      <option value="2">国道2号線 舗装工事</option>
                      <option value="3">市道改良工事</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>日付 *</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>項目名 *</label>
                    <input
                      type="text"
                      placeholder="コンクリート材料、作業員派遣 など"
                      value={item}
                      onChange={e => setItem(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>金額 *</label>
                    <input
                      type="number"
                      placeholder="50000"
                      value={amount || ''}
                      onChange={e => setAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      科目 *
                      <button className="ai-button" onClick={handleAIClassify}>🤖 AI分類</button>
                    </label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>業者名</label>
                    <input
                      type="text"
                      placeholder="○○建材株式会社"
                      value={vendor}
                      onChange={e => setVendor(e.target.value)}
                    />
                  </div>
                </div>

                <button className="submit-button full-width" onClick={addEntry}>
                  原価を記録する
                </button>
              </div>
            </section>

            {entries.length > 0 && (
              <section className="form-section">
                <div className="section-header">
                  <div className="section-line"></div>
                  <h2>記録一覧</h2>
                  <span className="badge">合計: ¥{entries.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>科目</th>
                        <th>項目</th>
                        <th>金額</th>
                        <th>業者</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(entry => (
                        <tr key={entry.id}>
                          <td>{entry.date}</td>
                          <td><span className="category-badge">{entry.category}</span></td>
                          <td>{entry.item}</td>
                          <td className="amount">¥{entry.amount.toLocaleString()}</td>
                          <td>{entry.vendor || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          <div className="side-column">
            <section className="form-section">
              <div className="section-header">
                <div className="section-line"></div>
                <h2>科目別集計</h2>
              </div>
              <div className="summary-card">
                {totalByCategory.map(item => (
                  <div key={item.name} className="summary-item">
                    <span className="summary-label">{item.name}</span>
                    <span className="summary-value">¥{item.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="summary-total">
                  <span>合計</span>
                  <span>¥{entries.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CostInput;
