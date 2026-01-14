import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BudgetCreate.css';

interface BudgetItem {
  id: number;
  category: string;
  name: string;
  amount: string;  // string for input handling
}

const BudgetCreate: React.FC = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([]);

  const categories = ['労務費', '外注費', '材料費', '機械費', '経費'];

  const addItem = () => {
    const newItem: BudgetItem = {
      id: Date.now(),
      category: '労務費',
      name: '',
      amount: '',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: number, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getCategoryTotal = (category: string) => {
    return items.filter(item => item.category === category)
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/sales')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          営業部屋
        </button>
        <h1 className="page-title">実行予算書作成</h1>
        <div className="user-badge">たく</div>
      </header>

      <main className="page-content">
        {/* 基本情報 */}
        <section className="form-section">
          <h2 className="section-title">
            <span className="title-line"></span>
            基本情報
          </h2>
          <div className="form-card">
            <div className="form-group">
              <label className="form-label">工事名 <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="例: 長崎駅交通広場整備工事"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">工事コード</label>
              <input
                type="text"
                className="form-input"
                placeholder="例: PRJ-2026-001"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 予算明細 */}
        <section className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-line"></span>
              予算明細
            </h2>
            <button className="add-row-button" onClick={addItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              行追加
            </button>
          </div>

          <div className="form-card">
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-text">明細がありません</div>
                <div className="empty-subtext">「行追加」ボタンで明細を追加してください</div>
              </div>
            ) : (
              <div className="items-table">
                <div className="table-header">
                  <div className="col-category">科目</div>
                  <div className="col-name">項目名</div>
                  <div className="col-amount">金額</div>
                  <div className="col-action"></div>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="table-row">
                    <div className="col-category">
                      <select
                        className="form-select"
                        value={item.category}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-name">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="項目名を入力"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-amount">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-input amount-input"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                      />
                    </div>
                    <div className="col-action">
                      <button className="delete-button" onClick={() => removeItem(item.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 科目別合計 */}
        <section className="form-section">
          <h2 className="section-title">
            <span className="title-line"></span>
            科目別合計
          </h2>
          <div className="form-card">
            <div className="totals-grid">
              {categories.map(cat => (
                <div key={cat} className="total-item">
                  <div className="total-label">{cat}</div>
                  <div className="total-value">¥{getCategoryTotal(cat).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="grand-total">
              <div className="grand-total-label">合計金額</div>
              <div className="grand-total-value">¥{totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </section>

        {/* アクションボタン */}
        <div className="action-buttons">
          <button className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            保存
          </button>
          <button className="btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            PDF出力
          </button>
          <button className="btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel出力
          </button>
        </div>
      </main>
    </div>
  );
};

export default BudgetCreate;
