import { useState } from 'react';
import {
  Building2, ClipboardList, Users, BarChart3,
  FileText, Calendar, DollarSign, UserCheck,
  Home, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MainNavigation = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const departments = [
    {
      id: 'sales',
      name: '営業部屋',
      icon: Building2,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      items: [
        { name: '見積書', path: '/sales/estimate', status: '利用可能', icon: FileText },
        { name: '確認書', path: '/sales/confirmation', status: '準備中', icon: ClipboardList },
        { name: '条件書', path: '/sales/conditions', status: '準備中', icon: FileText },
      ]
    },
    {
      id: 'construction',
      name: '工事部屋',
      icon: Users,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
      items: [
        { name: '工程表', path: '/construction/schedule', status: '利用可能', icon: Calendar },
        { name: '工事台帳', path: '/construction/ledger', status: '利用可能', icon: ClipboardList },
        { name: '実行予算書', path: '/construction/budget', status: '準備中', icon: DollarSign },
      ]
    },
    {
      id: 'office',
      name: '事務所部屋',
      icon: ClipboardList,
      color: 'orange',
      bgGradient: 'from-orange-500 to-orange-600',
      items: [
        { name: '出面表', path: '/office/attendance', status: '利用可能', icon: UserCheck },
        { name: '作業員名簿', path: '/office/workers', status: '準備中', icon: Users },
        { name: '安全書類', path: '/office/safety', status: '準備中', icon: ClipboardList },
      ]
    },
    {
      id: 'management',
      name: '経営部屋',
      icon: BarChart3,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      items: [
        { name: 'ダッシュボード', path: '/management/dashboard', status: '利用可能', icon: BarChart3 },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Home size={32} />
                sunyuDX-flow
              </h1>
              <p className="text-green-100 text-sm mt-1">株式会社サンユウテック</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">ログイン中</p>
              <p className="font-medium">たく</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            どの部屋を使いますか？
          </h2>
          <p className="text-gray-600">
            機能ごとに分かれた4つの部屋から選択してください
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const Icon = dept.icon;
            const isOpen = openDropdown === dept.id;

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : dept.id)}
                  className={`w-full bg-gradient-to-r ${dept.bgGradient} text-white p-6 flex items-center justify-between hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Icon size={32} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-bold">{dept.name}</h3>
                      <p className="text-sm text-white/80 mt-1">
                        {dept.items.length}個の機能
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={24}
                    className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="p-4 space-y-2">
                    {dept.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isAvailable = item.status === '利用可能';

                      return (
                        <button
                          key={item.path}
                          onClick={() => isAvailable && navigate(item.path)}
                          disabled={!isAvailable}
                          className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                            isAvailable
                              ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                              : 'bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ItemIcon size={20} className="text-gray-600" />
                            <span className="font-medium text-gray-800">
                              {item.name}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${
                              isAvailable
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>sunyuDX-flow v0.1.0</p>
          <p className="mt-1">© 2026 株式会社サンユウテック</p>
        </div>
      </main>
    </div>
  );
};

export default MainNavigation;
