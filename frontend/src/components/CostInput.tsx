import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CostInput.css';

interface CostEntry {
  id: string;
  date: string;
  category: string;
  itemName: string;
  amount: number;
  vendor: string;
  invoiceNumber: string;
  receiptUrl: string;
}

const CostInput: React.FC = () => {
  const navigate = useNavigate();
  
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('material');
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState(0);
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);

  // AI自動分類
  const classifyWithAI = async () => {
    if (!itemName || amount === 0) {
      alert('項目名と金額を入力してください');
      return;
    }

    setAiClassifying(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/ai/classify?item_name=${encodeURIComponent(itemName)}&amount=${amount}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('AI分類に失敗しました');
      }

      const data = await response.json();
      setCategory(data.category);
      alert(`AIが「${getCategoryName(data.category)}」に分類しました（信頼度: ${(data.confidence * 100).toFixed(0)}%）\n理由: ${data.reason}`);
      
    } catch (error) {
      console.error('AI分類エラー:', error);
      alert('AI分類中にエラーが発生しました。手動で選択してください。');
    } finally {
      setAiClassifying(false);
    }
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      material: '材料費',
      labor: '労務費',
      equipment: '機械費',
      subcontract: '外注費',
      expense: '経費',
    };
    return names[cat] || cat;
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const saveCost = async () => {
    if (!projectId || !itemName || amount === 0) {
      alert('必須項目を入力してください');
      return;
    }

    const newEntry: CostEntry = {
      id: Date.now().toString(),
      date,
      category,
      itemName,
      amount,
      vendor,
      invoiceNumber,
      receiptUrl: receipt ? URL.createObjectURL(receipt) : '',
    };

    setCostEntries([...costEntries, newEntry]);

    // フォームリセット
    setItemName('');
    setAmount(0);
    setVendor('');
    setInvoiceNumber('');
    setReceipt(null);

    alert('原価を記録しました！');
  };

  const totalCost = costEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="cost-input-container">
      <header className="cost-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="page-title">原価入力</h1>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
            工事一覧へ
          </button>
        </div>
      </header>

      <div className="cost-content">
        {/* 入力フォーム */}
        <div className="cost-form-card">
          <h2 className="section-title">原価記録</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>工事選択 *</label>
              <select
                className="input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="1">広島自動車道工事</option>
                <option value="2">○○市水道管工事</option>
                <option value="3">△△高速道路舗装工事</option>
              </select>
            </div>

            <div className="form-group">
              <label>日付 *</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>項目名 *</label>
              <input
                type="text"
                className="input"
                placeholder="コンクリート材料"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>金額 *</label>
              <input
                type="number"
                className="input"
                placeholder="50000"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                科目 *
                <button
                  className="ai-classify-button"
                  onClick={classifyWithAI}
                  disabled={aiClassifying}
                >
                  {aiClassifying ? '🤖 AI分類中...' : '🤖 AIで自動分類'}
                </button>
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="material">材料費</option>
                <option value="labor">労務費</option>
                <option value="equipment">機械費</option>
                <option value="subcontract">外注費</option>
                <option value="expense">経費</option>
              </select>
            </div>

            <div className="form-group">
              <label>業者名</label>
              <input
                type="text"
                className="input"
                placeholder="○○建材株式会社"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>請求書番号</label>
              <input
                type="text"
                className="input"
                placeholder="INV-2026-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>レシート画像</label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={handleReceiptUpload}
              />
              {receipt && (
                <div className="file-preview">
                  📎 {receipt.name}
                </div>
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-large" onClick={saveCost}>
            💾 原価を記録
          </button>
        </div>

        {/* 記録一覧 */}
        {costEntries.length > 0 && (
          <div className="cost-entries-card">
            <div className="section-header">
              <h2 className="section-title">本日の記録</h2>
              <div className="total-badge">
                合計: ¥{totalCost.toLocaleString()}
              </div>
            </div>

            <div className="entries-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>科目</th>
                    <th>項目名</th>
                    <th>金額</th>
                    <th>業者</th>
                    <th>請求書番号</th>
                    <th>レシート</th>
                  </tr>
                </thead>
                <tbody>
                  {costEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.date}</td>
                      <td>
                        <span className={`badge badge-${entry.category}`}>
                          {getCategoryName(entry.category)}
                        </span>
                      </td>
                      <td>{entry.itemName}</td>
                      <td className="text-right">¥{entry.amount.toLocaleString()}</td>
                      <td>{entry.vendor || '-'}</td>
                      <td>{entry.invoiceNumber || '-'}</td>
                      <td>
                        {entry.receiptUrl ? (
                          <a href={entry.receiptUrl} target="_blank" rel="noopener noreferrer">
                            📎 表示
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostInput;
