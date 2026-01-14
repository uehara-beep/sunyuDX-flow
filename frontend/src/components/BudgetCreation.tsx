import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BudgetCreation.css';

interface BudgetItem {
  id: string;
  category: string;
  item_name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  vendor_name: string;
}

interface BudgetData {
  project_name: string;
  client_name: string;
  location: string;
  contract_amount: number;
  items: BudgetItem[];
}

const CATEGORIES = ['材料費', '労務費', '機械費', '外注費', '経費'];

const BudgetCreation: React.FC = () => {
  const navigate = useNavigate();
  const [budgetData, setBudgetData] = useState<BudgetData>({
    project_name: '',
    client_name: '',
    location: '',
    contract_amount: 0,
    items: [],
  });
  // 数値入力はstringで管理（0先頭バグ防止）
  const [newItem, setNewItem] = useState({
    category: '材料費',
    item_name: '',
    specification: '',
    quantity: '1',  // string
    unit: '式',
    unit_price: '',  // string (初期は空)
    vendor_name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddItem = () => {
    if (!newItem.item_name || !newItem.unit_price) {
      setMessage('項目名と単価を入力してください');
      return;
    }

    // string → number 変換 (保存時のみ)
    const qty = parseFloat(newItem.quantity) || 1;
    const price = parseFloat(newItem.unit_price) || 0;

    const item: BudgetItem = {
      id: Date.now().toString(),
      category: newItem.category || '材料費',
      item_name: newItem.item_name || '',
      specification: newItem.specification || '',
      quantity: qty,
      unit: newItem.unit || '式',
      unit_price: price,
      amount: qty * price,
      vendor_name: newItem.vendor_name || '',
    };

    setBudgetData({
      ...budgetData,
      items: [...budgetData.items, item],
    });

    setNewItem({
      category: newItem.category,
      item_name: '',
      specification: '',
      quantity: '1',
      unit: '式',
      unit_price: '',
      vendor_name: '',
    });
    setMessage('');
  };

  const handleRemoveItem = (id: string) => {
    setBudgetData({
      ...budgetData,
      items: budgetData.items.filter(item => item.id !== id),
    });
  };

  const calculateTotal = () => {
    return budgetData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateByCategory = (category: string) => {
    return budgetData.items
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSave = async () => {
    if (!budgetData.project_name) {
      setMessage('工事名を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/budget/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...budgetData,
          budget_amount: calculateTotal(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`保存完了: ${result.budget_number}`);
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('保存に失敗しました（デモモード）');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/ledger/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_name: budgetData.project_name || 'テスト工事' }),
      });

      if (response.ok) {
        const result = await response.json();
        window.open(`http://localhost:8000${result.download_url}`, '_blank');
        setMessage('Excel出力完了');
      } else {
        throw new Error('Excel出力に失敗しました');
      }
    } catch (error) {
      console.error('Export error:', error);
      setMessage('Excel出力に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="budget-container">
      <header className="budget-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← 戻る
        </button>
        <h1>実行予算作成</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportExcel} disabled={isLoading}>
            Excel出力
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
            {isLoading ? '処理中...' : '保存'}
          </button>
        </div>
      </header>

      {message && (
        <div className={`message ${message.includes('失敗') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="budget-content">
        <section className="project-info">
          <h2>工事情報</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>工事名 *</label>
              <input
                type="text"
                value={budgetData.project_name}
                onChange={(e) => setBudgetData({ ...budgetData, project_name: e.target.value })}
                placeholder="例: 長崎駅交通広場整備工事"
              />
            </div>
            <div className="form-group">
              <label>発注者</label>
              <input
                type="text"
                value={budgetData.client_name}
                onChange={(e) => setBudgetData({ ...budgetData, client_name: e.target.value })}
                placeholder="例: 西九州ニチレキ工事株式会社"
              />
            </div>
            <div className="form-group">
              <label>工事場所</label>
              <input
                type="text"
                value={budgetData.location}
                onChange={(e) => setBudgetData({ ...budgetData, location: e.target.value })}
                placeholder="例: 長崎県長崎市"
              />
            </div>
            <div className="form-group">
              <label>請負金額</label>
              <input
                type="text"
                inputMode="numeric"
                value={budgetData.contract_amount || ''}
                onChange={(e) => setBudgetData({ ...budgetData, contract_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
        </section>

        <section className="budget-items">
          <h2>予算明細</h2>

          <div className="add-item-form">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="項目名"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="仕様"
              value={newItem.specification}
              onChange={(e) => setNewItem({ ...newItem, specification: e.target.value })}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="数量"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              style={{ width: '80px' }}
            />
            <input
              type="text"
              placeholder="単位"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              style={{ width: '60px' }}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="単価"
              value={newItem.unit_price}
              onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
              style={{ width: '100px' }}
            />
            <input
              type="text"
              placeholder="業者名"
              value={newItem.vendor_name}
              onChange={(e) => setNewItem({ ...newItem, vendor_name: e.target.value })}
            />
            <button className="btn-add" onClick={handleAddItem}>追加</button>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>科目</th>
                <th>項目名</th>
                <th>仕様</th>
                <th>数量</th>
                <th>単位</th>
                <th>単価</th>
                <th>金額</th>
                <th>業者</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {budgetData.items.map(item => (
                <tr key={item.id}>
                  <td><span className={`category-badge ${item.category}`}>{item.category}</span></td>
                  <td>{item.item_name}</td>
                  <td>{item.specification}</td>
                  <td className="number">{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td className="number">¥{item.unit_price.toLocaleString()}</td>
                  <td className="number">¥{item.amount.toLocaleString()}</td>
                  <td>{item.vendor_name}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleRemoveItem(item.id)}>×</button>
                  </td>
                </tr>
              ))}
              {budgetData.items.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-message">
                    明細を追加してください
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="budget-summary">
          <h2>予算集計</h2>
          <div className="summary-grid">
            {CATEGORIES.map(cat => (
              <div key={cat} className="summary-item">
                <span className="summary-label">{cat}</span>
                <span className="summary-value">¥{calculateByCategory(cat).toLocaleString()}</span>
              </div>
            ))}
            <div className="summary-item total">
              <span className="summary-label">合計</span>
              <span className="summary-value">¥{calculateTotal().toLocaleString()}</span>
            </div>
            {budgetData.contract_amount > 0 && (
              <div className="summary-item profit">
                <span className="summary-label">粗利</span>
                <span className="summary-value">
                  ¥{(budgetData.contract_amount - calculateTotal()).toLocaleString()}
                  <small>({((budgetData.contract_amount - calculateTotal()) / budgetData.contract_amount * 100).toFixed(1)}%)</small>
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BudgetCreation;
