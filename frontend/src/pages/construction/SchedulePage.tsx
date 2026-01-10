import { useState } from 'react';
import { Calendar, Download, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily' | 'gantt'>('monthly');
  const [projectName, setProjectName] = useState('');

  const viewModes = [
    { id: 'monthly', name: '月次', icon: '📅', color: 'blue' },
    { id: 'weekly', name: '週次', icon: '📆', color: 'green' },
    { id: 'daily', name: '日次', icon: '📋', color: 'orange' },
    { id: 'gantt', name: 'ガント', icon: '📊', color: 'purple' },
  ];

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
          <h1 className="text-3xl font-bold">工程表管理</h1>
          <p className="text-green-100 text-sm mt-1">工事部屋</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 表示切替 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">表示モード選択</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  viewMode === mode.id
                    ? `border-${mode.color}-500 bg-${mode.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{mode.icon}</div>
                <div className="font-medium">{mode.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 工程表エリア */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {viewModes.find(m => m.id === viewMode)?.name}工程表
            </h2>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Download size={20} />
              Excel出力
            </button>
          </div>

          {/* プレースホルダー */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl font-medium text-gray-600 mb-2">
              {viewModes.find(m => m.id === viewMode)?.name}工程表
            </p>
            <p className="text-gray-500">
              工程データを追加すると、ここに表示されます
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📊 工程表について</h3>
          <p className="text-sm text-blue-800">
            月次・週次・日次・ガントチャートの4つの視点で工程を管理できます。
          </p>
        </div>
      </main>
    </div>
  );
};

export default SchedulePage;
