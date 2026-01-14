import React, { useState, useEffect } from 'react';
import './BudgetList.css';

interface Budget {
  id: string;
  projectName: string;
  projectCode: string;
  customerName: string;
  totalAmount: number;
  laborCost: number;
  outsourceCost: number;
  materialCost: number;
  equipmentCost: number;
  expenseCost: number;
  profitRate: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

const BudgetList: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Budget>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/budgets');
      if (!response.ok) {
        throw new Error('予算データの取得に失敗しました');
      }
      const data = await response.json();
      setBudgets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この予算を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/budgets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('削除に失敗しました');
      
      setBudgets(budgets.filter(b => b.id !== id));
      alert('削除しました');
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleSort = (field: keyof Budget) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: '下書き', className: 'status-draft' },
      pending: { label: '承認待ち', className: 'status-pending' },
      approved: { label: '承認済み', className: 'status-approved' },
      rejected: { label: '差戻し', className: 'status-rejected' },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // フィルタリング & ソート
  const filteredBudgets = budgets
    .filter(budget => {
      const matchesSearch = 
        (budget.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const order = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? order : -order;
    });

  if (loading) {
    return (
      <div className="budget-list-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="budget-list-container">
        <div className="error-message">
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
          <button onClick={fetchBudgets} className="btn btn-primary">再読み込み</button>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-list-container">
      {/* ヘッダー */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => window.history.back()}>
            ← 営業部屋
          </button>
          <h1 className="page-title">予算一覧</h1>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/budget/create-detailed'}
          >
            + 新規予算作成
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="案件名、工事コード、顧客名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            全て
          </button>
          <button
            className={`filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            下書き
          </button>
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            承認待ち
          </button>
          <button
            className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            承認済み
          </button>
        </div>
        <div className="results-count">
          {filteredBudgets.length}件の予算
        </div>
      </div>

      {/* テーブル */}
      <div className="table-container">
        {filteredBudgets.length === 0 ? (
          <div className="empty-state">
            <p>予算が見つかりませんでした</p>
          </div>
        ) : (
          <table className="budget-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('projectName')}>
                  案件名 {sortField === 'projectName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('projectCode')}>
                  工事コード {sortField === 'projectCode' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('customerName')}>
                  顧客名 {sortField === 'customerName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('totalAmount')} className="text-right">
                  総額 {sortField === 'totalAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('profitRate')} className="text-right">
                  粗利率 {sortField === 'profitRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')}>
                  ステータス {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('createdAt')}>
                  作成日 {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map((budget) => (
                <tr key={budget.id} className="budget-row">
                  <td className="project-name">{budget.projectName}</td>
                  <td className="project-code">{budget.projectCode}</td>
                  <td>{budget.customerName}</td>
                  <td className="text-right amount">{formatCurrency(budget.totalAmount)}</td>
                  <td className="text-right profit-rate">
                    <span className={budget.profitRate >= 20 ? 'good' : budget.profitRate >= 15 ? 'normal' : 'low'}>
                      {budget.profitRate.toFixed(1)}%
                    </span>
                  </td>
                  <td>{getStatusBadge(budget.status)}</td>
                  <td>{formatDate(budget.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-view"
                        title="詳細"
                        onClick={() => window.location.href = `/budget/${budget.id}`}
                      >
                        👁
                      </button>
                      <button 
                        className="btn-icon btn-edit"
                        title="編集"
                        onClick={() => window.location.href = `/budget/${budget.id}/edit`}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-delete"
                        title="削除"
                        onClick={() => handleDelete(budget.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BudgetList;
