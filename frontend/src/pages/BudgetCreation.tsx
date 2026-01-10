import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Save, FileText, Download,
  Plus, Trash2, Loader2, CheckCircle
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

const BudgetCreation = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const categories = ['材料費', '労務費', '機械費', '外注費', '経費'];

  const addItem = () => {
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      category: '材料費',
      item: '',
      quantity: 1,
      unit: '式',
      unitPrice: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: items.filter(i => i.category === cat).reduce((sum, i) => sum + i.amount, 0)
  }));

  const handleSave = async () => {
    if (!projectName) {
      alert('工事名を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/budget/save`, {
        project_name: projectName,
        project_code: projectCode,
        items: items
      });
      setSavedId(res.data.id);
      alert('保存しました');
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await axios.post(`${API_URL}/api/budget/export/pdf`, {
        project_name: projectName,
        project_code: projectCode,
        items: items
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `実行予算書_${projectName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('PDF出力に失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await axios.post(`${API_URL}/api/budget/export/excel`, {
        project_name: projectName,
        project_code: projectCode,
        items: items
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `実行予算書_${projectName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Excel出力に失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            ホームに戻る
          </button>
          <h1 className="text-3xl font-bold">実行予算書作成</h1>
          <p className="text-purple-100 text-sm mt-1">5科目で構成された予算書を作成</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 基本情報 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工事名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: 長崎駅交通広場整備工事"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工事コード
              </label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="例: PRJ-2026-001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* 予算明細 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">予算明細</h2>
            <button
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={20} />
              行追加
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>明細がありません</p>
              <p className="text-sm mt-1">「行追加」ボタンで明細を追加してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">科目</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">項目名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">数量</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">単位</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">単価</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金額</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                          placeholder="項目名"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ¥{item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 科目別合計 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">科目別合計</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categoryTotals.map(({ category, total }) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{category}</p>
                <p className="text-xl font-bold text-gray-800">
                  ¥{total.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold">合計金額</span>
            <span className="text-2xl font-bold text-purple-600">
              ¥{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            保存
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || items.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            PDF出力
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting || items.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Excel出力
          </button>
        </div>

        {savedId && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <p className="text-green-800">保存完了 (ID: {savedId})</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BudgetCreation;
