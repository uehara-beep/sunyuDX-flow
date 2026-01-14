import React, { useState } from 'react';
import './LineItemTable.css';

export interface LineItem {
  id: string;
  name: string;
  breakdown: string;
  qty: string;
  unit: string;
  unit_price: string;
  amount: string;
  note: string;
  category?: string;
  month?: string;
}

interface LineItemTableProps {
  items: LineItem[];
  kind: 'estimate' | 'budget' | 'actual';
  editable?: boolean;
  onChange?: (items: LineItem[]) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'labor', label: '労務費', color: '#3b82f6' },
  { value: 'subcontract', label: '外注費', color: '#8b5cf6' },
  { value: 'material', label: '材料費', color: '#f59e0b' },
  { value: 'machine', label: '機械費', color: '#10b981' },
  { value: 'expense', label: '経費', color: '#6b7280' }
];

const getCategoryInfo = (category: string) => {
  return CATEGORY_OPTIONS.find(c => c.value === category) || { value: category, label: category, color: '#666' };
};

// 数値入力ヘルパー: 数字とドット以外を除去
const sanitizeNumber = (value: string): string => {
  return value.replace(/[^0-9.]/g, '');
};

// 数値フォーマット: 整形
const formatNumber = (value: string): string => {
  if (value === '') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return String(num);
};

const LineItemTable: React.FC<LineItemTableProps> = ({
  items,
  kind,
  editable = false,
  onChange,
  onDelete
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (id: string, field: keyof LineItem, value: string) => {
    if (!onChange) return;
    const updated = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleNumberChange = (id: string, field: keyof LineItem, value: string) => {
    handleChange(id, field, sanitizeNumber(value));
  };

  const handleNumberBlur = (id: string, field: keyof LineItem, value: string) => {
    handleChange(id, field, formatNumber(value));
  };

  const totalAmount = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="line-item-table-container">
      <table className="line-item-table">
        <thead>
          <tr>
            <th className="col-name">名称</th>
            <th className="col-breakdown">内訳</th>
            <th className="col-qty">数量</th>
            <th className="col-unit">単位</th>
            <th className="col-unit-price">単価</th>
            <th className="col-amount">金額</th>
            {kind === 'actual' && <th className="col-category">科目</th>}
            <th className="col-note">備考</th>
            {editable && <th className="col-actions">操作</th>}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={kind === 'actual' ? 9 : 8} className="empty-message">
                データがありません
              </td>
            </tr>
          ) : (
            items.map(item => {
              const catInfo = getCategoryInfo(item.category || 'expense');
              const isEditing = editable && editingId === item.id;

              return (
                <tr key={item.id} className={isEditing ? 'editing' : ''}>
                  <td className="col-name">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="col-breakdown">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.breakdown}
                        onChange={(e) => handleChange(item.id, 'breakdown', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span className="text-muted">{item.breakdown || '-'}</span>
                    )}
                  </td>
                  <td className="col-qty text-right">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.qty}
                        onChange={(e) => handleNumberChange(item.id, 'qty', e.target.value)}
                        onBlur={(e) => handleNumberBlur(item.id, 'qty', e.target.value)}
                        className="edit-input text-right"
                        placeholder=""
                      />
                    ) : (
                      item.qty || '-'
                    )}
                  </td>
                  <td className="col-unit text-center">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                        className="edit-input text-center"
                      />
                    ) : (
                      item.unit || '-'
                    )}
                  </td>
                  <td className="col-unit-price text-right">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.unit_price}
                        onChange={(e) => handleNumberChange(item.id, 'unit_price', e.target.value)}
                        onBlur={(e) => handleNumberBlur(item.id, 'unit_price', e.target.value)}
                        className="edit-input text-right"
                        placeholder=""
                      />
                    ) : (
                      item.unit_price ? `¥${parseFloat(item.unit_price).toLocaleString()}` : '-'
                    )}
                  </td>
                  <td className="col-amount text-right amount-value">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) => handleNumberChange(item.id, 'amount', e.target.value)}
                        onBlur={(e) => handleNumberBlur(item.id, 'amount', e.target.value)}
                        className="edit-input text-right"
                        placeholder=""
                      />
                    ) : (
                      `¥${(parseFloat(item.amount) || 0).toLocaleString()}`
                    )}
                  </td>
                  {kind === 'actual' && (
                    <td className="col-category text-center">
                      {isEditing ? (
                        <select
                          value={item.category || 'expense'}
                          onChange={(e) => handleChange(item.id, 'category', e.target.value)}
                          className="edit-select"
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="category-badge"
                          style={{ background: catInfo.color }}
                        >
                          {catInfo.label}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="col-note">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleChange(item.id, 'note', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span className="text-muted text-small">{item.note || '-'}</span>
                    )}
                  </td>
                  {editable && (
                    <td className="col-actions text-center">
                      {isEditing ? (
                        <button
                          className="action-btn save-btn"
                          onClick={() => setEditingId(null)}
                        >
                          完了
                        </button>
                      ) : (
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => setEditingId(item.id)}
                          >
                            編集
                          </button>
                          {onDelete && (
                            <button
                              className="action-btn delete-btn"
                              onClick={() => onDelete(item.id)}
                            >
                              削除
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan={5} className="total-label">合計</td>
            <td className="total-amount text-right">
              ¥{totalAmount.toLocaleString()}
            </td>
            {kind === 'actual' && <td></td>}
            <td></td>
            {editable && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default LineItemTable;
