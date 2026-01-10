import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Download, Search, Filter,
  Building2, Loader2, RefreshCw, Eye
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  budget: number;
  cost: number;
  profitRate: number;
  status: 'active' | 'completed' | 'pending';
  startDate: string;
  endDate: string;
}

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data);
    } catch (err) {
      // デモ用ダミーデータ
      setProjects([
        {
          id: '1',
          name: '長崎駅交通広場整備工事',
          code: 'PRJ-2026-001',
          client: '長崎市',
          budget: 50000000,
          cost: 42000000,
          profitRate: 16.0,
          status: 'active',
          startDate: '2026-01-15',
          endDate: '2026-06-30'
        },
        {
          id: '2',
          name: '佐世保市庁舎改修工事',
          code: 'PRJ-2026-002',
          client: '佐世保市',
          budget: 30000000,
          cost: 24000000,
          profitRate: 20.0,
          status: 'active',
          startDate: '2026-02-01',
          endDate: '2026-05-31'
        },
        {
          id: '3',
          name: '大村市道路舗装工事',
          code: 'PRJ-2025-015',
          client: '大村市',
          budget: 15000000,
          cost: 14500000,
          profitRate: 3.3,
          status: 'completed',
          startDate: '2025-10-01',
          endDate: '2025-12-31'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await axios.get(`${API_URL}/api/projects/export/excel`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `工事台帳_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">進行中</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">完了</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">準備中</span>;
      default:
        return null;
    }
  };

  const getProfitRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            ホームに戻る
          </button>
          <h1 className="text-3xl font-bold">工事台帳</h1>
          <p className="text-blue-100 text-sm mt-1">全案件の一覧と管理</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="工事名、コード、発注者で検索..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全ステータス</option>
                <option value="active">進行中</option>
                <option value="completed">完了</option>
                <option value="pending">準備中</option>
              </select>
            </div>
            <button
              onClick={fetchProjects}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw size={20} />
              更新
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              Excel出力
            </button>
          </div>
        </div>

        {/* 案件一覧 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>案件が見つかりません</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">工事名</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">発注者</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">予算</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">原価</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">利益率</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">期間</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">状態</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{project.name}</p>
                        <p className="text-sm text-gray-500">{project.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{project.client}</td>
                    <td className="px-6 py-4 text-gray-800">
                      ¥{(project.budget / 10000).toLocaleString()}万
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      ¥{(project.cost / 10000).toLocaleString()}万
                    </td>
                    <td className={`px-6 py-4 font-bold ${getProfitRateColor(project.profitRate)}`}>
                      {project.profitRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.startDate} 〜 {project.endDate}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 統計サマリー */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">総案件数</p>
            <p className="text-2xl font-bold text-gray-800">{projects.length}件</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">進行中</p>
            <p className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.status === 'active').length}件
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">総予算</p>
            <p className="text-2xl font-bold text-gray-800">
              ¥{(projects.reduce((sum, p) => sum + p.budget, 0) / 10000).toLocaleString()}万
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-600">平均利益率</p>
            <p className="text-2xl font-bold text-blue-600">
              {(projects.reduce((sum, p) => sum + p.profitRate, 0) / projects.length || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectList;
