import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Expense.css';

interface ExpenseItem {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  receipt: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

const Expense: React.FC = () => {
  const navigate = useNavigate();
  const categories = ['交通費', '宿泊費', '会議費', '消耗品費', '通信費', 'その他'];

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('交通費');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 1, date: '2026-01-10', category: '交通費', description: '現場往復タクシー代', amount: 3200, receipt: true, status: 'approved' },
    { id: 2, date: '2026-01-09', category: '会議費', description: '打ち合わせ昼食代', amount: 1500, receipt: true, status: 'pending' },
  ]);

  const addExpense = () => {
    if (!description || !amount) {
      alert('内容と金額を入力してください');
      return;
    }
    const newExpense: ExpenseItem = {
      id: Date.now(),
      date,
      category,
      description,
      amount,
      receipt: false,
      status: 'pending',
    };
    setExpenses([newExpense, ...expenses]);
    setDescription('');
    setAmount(0);
    alert('経費を申請しました');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      pending: { label: '申請中', class: 'status-pending' },
      approved: { label: '承認済', class: 'status-approved' },
      rejected: { label: '却下', class: 'status-rejected' },
    };
    return badges[status];
  };

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page-container office">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/office')}>
          ← 事務部屋へ
        </button>
        <h1 className="page-title">💳 経費精算</h1>
        <p className="page-subtitle">経費申請・精算管理</p>
      </header>

      <main className="page-content">
        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>経費申請</h2>
          </div>
          <div className="form-card">
            <div className="form-grid">
              <div className="form-group">
                <label>日付</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>カテゴリ</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>内容</label>
                <input
                  type="text"
                  placeholder="タクシー代、電車代 など"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>金額</label>
                <input
                  type="number"
                  placeholder="3000"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>領収書</label>
              <input type="file" accept="image/*,application/pdf" />
            </div>
            <button className="submit-button full-width" onClick={addExpense}>
              申請する
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>申請一覧</h2>
            <div className="summary-badges">
              <span className="badge pending">申請中: ¥{totalPending.toLocaleString()}</span>
              <span className="badge approved">承認済: ¥{totalApproved.toLocaleString()}</span>
            </div>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>カテゴリ</th>
                  <th>内容</th>
                  <th>金額</th>
                  <th>領収書</th>
                  <th>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td>{expense.category}</td>
                    <td>{expense.description}</td>
                    <td className="amount">¥{expense.amount.toLocaleString()}</td>
                    <td>{expense.receipt ? '📎 あり' : '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(expense.status).class}`}>
                        {getStatusBadge(expense.status).label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Expense;
