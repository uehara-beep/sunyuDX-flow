import { ArrowLeft, TrendingUp, DollarSign, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  const kpis = [
    {
      name: '月次売上',
      value: '¥12,500,000',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'blue'
    },
    {
      name: '営業利益率',
      value: '18.5%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      name: '受注件数',
      value: '23件',
      change: '+5件',
      trend: 'up',
      icon: FileText,
      color: 'orange'
    },
    {
      name: '稼働人員',
      value: '48名',
      change: '-2名',
      trend: 'down',
      icon: Users,
      color: 'purple'
    },
  ];

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
          <h1 className="text-3xl font-bold">経営ダッシュボード</h1>
          <p className="text-purple-100 text-sm mt-1">経営部屋</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.name} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${kpi.color}-100`}>
                    <Icon className={`text-${kpi.color}-600`} size={24} />
                  </div>
                  <span className={`text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{kpi.name}</p>
                  <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* グラフエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 売上推移 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">売上推移</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">グラフデータを準備中</p>
            </div>
          </div>

          {/* 利益率推移 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">利益率推移</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">グラフデータを準備中</p>
            </div>
          </div>
        </div>

        {/* アラート */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">📢 アラート</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-yellow-900">工程遅延の可能性</p>
                <p className="text-sm text-yellow-800">長崎駅工事の進捗が予定より10%遅れています</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-medium text-blue-900">支払期限間近</p>
                <p className="text-sm text-blue-800">3件の外注費支払いが7日以内に迫っています</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📊 ダッシュボードについて</h3>
          <p className="text-sm text-blue-800">
            経営に必要なKPIをリアルタイムで可視化します。売上・利益・人員などの重要指標を一目で確認できます。
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
