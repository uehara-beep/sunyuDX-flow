import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2, FileText, DollarSign, Users,
  TrendingUp, Calendar, ClipboardList, ArrowRight,
  Loader2, RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface Stats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalCost: number;
  profitRate: number;
  pendingReports: number;
  todayWorkers: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // 実際のAPIエンドポイントに置き換え
      const res = await axios.get(`${API_URL}/api/stats`);
      setStats(res.data);
    } catch (err) {
      // デモ用のダミーデータ
      setStats({
        totalProjects: 15,
        activeProjects: 8,
        totalBudget: 125000000,
        totalCost: 98500000,
        profitRate: 21.2,
        pendingReports: 3,
        todayWorkers: 45
      });
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStats();
    // 30秒ごとに自動更新
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      id: 'projects',
      title: '工事案件',
      value: stats ? `${stats.activeProjects}/${stats.totalProjects}件` : '-',
      subtitle: '進行中/全体',
      icon: Building2,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      path: '/projects'
    },
    {
      id: 'budget',
      title: '総予算',
      value: stats ? `¥${(stats.totalBudget / 10000).toLocaleString()}万` : '-',
      subtitle: '全案件合計',
      icon: DollarSign,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
      path: '/budget/create'
    },
    {
      id: 'cost',
      title: '原価合計',
      value: stats ? `¥${(stats.totalCost / 10000).toLocaleString()}万` : '-',
      subtitle: '実績ベース',
      icon: TrendingUp,
      color: 'orange',
      bgGradient: 'from-orange-500 to-orange-600',
      path: '/cost/input'
    },
    {
      id: 'profit',
      title: '利益率',
      value: stats ? `${stats.profitRate}%` : '-',
      subtitle: '目標: 20%',
      icon: TrendingUp,
      color: stats && stats.profitRate >= 20 ? 'green' : 'red',
      bgGradient: stats && stats.profitRate >= 20 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
      path: '/management/dashboard'
    },
    {
      id: 'estimate',
      title: '見積書',
      value: 'アップロード',
      subtitle: 'S-BASE形式対応',
      icon: FileText,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      path: '/estimate/upload'
    },
    {
      id: 'daily',
      title: '日報',
      value: stats ? `${stats.pendingReports}件` : '-',
      subtitle: '未提出',
      icon: ClipboardList,
      color: stats && stats.pendingReports > 0 ? 'yellow' : 'green',
      bgGradient: stats && stats.pendingReports > 0 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600',
      path: '/daily/report'
    },
    {
      id: 'workers',
      title: '本日の作業員',
      value: stats ? `${stats.todayWorkers}名` : '-',
      subtitle: '出勤予定',
      icon: Users,
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-indigo-600',
      path: '/office/attendance'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">sunyuDX-flow</h1>
              <p className="text-green-100 text-sm mt-1">株式会社サンユウテック</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">ログイン中</p>
              <p className="font-medium">たく</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 更新情報 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
            <p className="text-sm text-gray-500">
              最終更新: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            更新
          </button>
        </div>

        {/* 7カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-r ${card.bgGradient} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <Icon size={32} />
                    <ArrowRight size={20} className="opacity-70" />
                  </div>
                  <h3 className="text-lg font-medium mt-4">{card.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-2xl font-bold text-gray-800">
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : card.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* クイックアクション */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">クイックアクション</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/estimate/upload')}
              className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
            >
              <FileText className="text-blue-600 mb-2" size={24} />
              <p className="font-medium text-gray-800">見積書アップロード</p>
              <p className="text-xs text-gray-500 mt-1">S-BASE形式</p>
            </button>
            <button
              onClick={() => navigate('/cost/input')}
              className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left"
            >
              <DollarSign className="text-green-600 mb-2" size={24} />
              <p className="font-medium text-gray-800">原価入力</p>
              <p className="text-xs text-gray-500 mt-1">AI自動分類</p>
            </button>
            <button
              onClick={() => navigate('/daily/report')}
              className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-left"
            >
              <ClipboardList className="text-orange-600 mb-2" size={24} />
              <p className="font-medium text-gray-800">日報入力</p>
              <p className="text-xs text-gray-500 mt-1">写真付き</p>
            </button>
            <button
              onClick={() => navigate('/budget/create')}
              className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left"
            >
              <Calendar className="text-purple-600 mb-2" size={24} />
              <p className="font-medium text-gray-800">実行予算作成</p>
              <p className="text-xs text-gray-500 mt-1">PDF/Excel出力</p>
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>sunyuDX-flow v0.1.0</p>
          <p className="mt-1">© 2026 株式会社サンユウテック</p>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
