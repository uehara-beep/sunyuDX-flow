import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Sparkles, Save, Plus,
  Trash2, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface CostItem {
  id: string;
  itemName: string;
  amount: string;  // string for input handling
  category: string;
  confidence: number;
  isClassified: boolean;
}

const CostInput = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<CostItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isClassifying, setIsClassifying] = useState<string | null>(null);

  const categories = ['材料費', '労務費', '機械費', '外注費', '経費'];

  const addItem = () => {
    const newItem: CostItem = {
      id: crypto.randomUUID(),
      itemName: '',
      amount: '',
      category: '',
      confidence: 0,
      isClassified: false
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof CostItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const classifyItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !item.itemName) {
      alert('項目名を入力してください');
      return;
    }

    setIsClassifying(id);
    try {
      const res = await axios.post(`${API_URL}/api/ai/classify`, {
        item_name: item.itemName,
        amount: parseFloat(item.amount) || 0
      });

      updateItem(id, 'category', res.data.category);
      updateItem(id, 'confidence', res.data.confidence);
      updateItem(id, 'isClassified', true);
    } catch (err) {
      // デモ用：AIなしでもシミュレーション
      const demoCategories: Record<string, { category: string; confidence: number }> = {
        'コンクリート': { category: '材料費', confidence: 95 },
        'セメント': { category: '材料費', confidence: 92 },
        '鉄筋': { category: '材料費', confidence: 94 },
        '作業員': { category: '労務費', confidence: 88 },
        '人件費': { category: '労務費', confidence: 96 },
        'クレーン': { category: '機械費', confidence: 90 },
        '重機': { category: '機械費', confidence: 85 },
        '下請け': { category: '外注費', confidence: 91 },
        '電気工事': { category: '外注費', confidence: 87 },
        '交通費': { category: '経費', confidence: 93 },
        '消耗品': { category: '経費', confidence: 89 }
      };

      // 部分一致でカテゴリを推定
      let matched = { category: '経費', confidence: 70 };
      for (const [keyword, result] of Object.entries(demoCategories)) {
        if (item.itemName.includes(keyword)) {
          matched = result;
          break;
        }
      }

      updateItem(id, 'category', matched.category);
      updateItem(id, 'confidence', matched.confidence);
      updateItem(id, 'isClassified', true);
    } finally {
      setIsClassifying(null);
    }
  };

  const classifyAll = async () => {
    for (const item of items) {
      if (!item.isClassified && item.itemName) {
        await classifyItem(item.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // 少し待機
      }
    }
  };

  const handleSave = async () => {
    if (!projectId) {
      alert('工事を選択してください');
      return;
    }

    setIsSaving(true);
    try {
      // string amounts を number に変換して送信
      const itemsWithNumbers = items.map(item => ({
        ...item,
        amount: parseFloat(item.amount) || 0
      }));
      await axios.post(`${API_URL}/api/cost/save`, {
        project_id: projectId,
        items: itemsWithNumbers
      });
      alert('保存しました');
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const totalByCategory = categories.map(cat => ({
    category: cat,
    total: items.filter(i => i.category === cat).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
  }));

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-green-100 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            ホームに戻る
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">原価入力</h1>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm flex items-center gap-1">
              <Sparkles size={16} />
              AI自動分類
            </span>
          </div>
          <p className="text-green-100 text-sm mt-1">項目名からAIが自動で科目を分類</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 工事選択 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">対象工事</h2>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">工事を選択...</option>
            <option value="1">長崎駅交通広場整備工事</option>
            <option value="2">佐世保市庁舎改修工事</option>
            <option value="3">大村市道路舗装工事</option>
          </select>
        </div>

        {/* 原価明細入力 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">原価明細</h2>
            <div className="flex gap-2">
              <button
                onClick={classifyAll}
                disabled={items.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                <Sparkles size={20} />
                一括AI分類
              </button>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={20} />
                行追加
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
              <p>原価項目がありません</p>
              <p className="text-sm mt-1">「行追加」ボタンで項目を追加してください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        項目名
                      </label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        placeholder="例: コンクリート打設"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        金額
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        科目
                      </label>
                      <div className="flex items-center gap-2">
                        {item.isClassified ? (
                          <div className={`flex-1 px-3 py-2 rounded-lg font-medium ${getConfidenceColor(item.confidence)}`}>
                            {item.category}
                            <span className="ml-2 text-xs">({item.confidence}%)</span>
                          </div>
                        ) : (
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">選択...</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => classifyItem(item.id)}
                          disabled={isClassifying === item.id}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                          title="AI分類"
                        >
                          {isClassifying === item.id ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <Sparkles size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {item.isClassified && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {item.confidence >= 90 ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : (
                        <AlertCircle className="text-yellow-500" size={16} />
                      )}
                      <span className="text-gray-600">
                        AI分類結果: {item.category} (信頼度: {item.confidence}%)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 科目別集計 */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">科目別集計</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {totalByCategory.map(({ category, total }) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{category}</p>
                  <p className="text-xl font-bold text-gray-800">
                    ¥{total.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-lg font-bold">合計</span>
              <span className="text-2xl font-bold text-green-600">
                ¥{items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={isSaving || items.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          保存
        </button>

        {/* ヘルプ */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">🤖 AI自動分類について</h3>
          <p className="text-sm text-blue-800">
            項目名を入力して「AI分類」ボタンを押すと、AIが自動的に適切な科目を推定します。
            信頼度90%以上は緑、70%以上は黄色で表示されます。
          </p>
        </div>
      </main>
    </div>
  );
};

export default CostInput;
