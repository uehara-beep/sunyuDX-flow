import { useState } from 'react';
import axios from 'axios';
import { Calendar, Download, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

const AttendancePage = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/attendance/generate`,
        { year, month },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setDownloadUrl(res.data.download_url);
      alert('生成完了！');
    } catch (err: any) {
      console.error('Generate error:', err);
      alert('生成失敗: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-orange-100 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            ホームに戻る
          </button>
          <h1 className="text-3xl font-bold">出面表作成</h1>
          <p className="text-orange-100 text-sm mt-1">事務所部屋</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-bold">対象月を選択</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  生成中...
                </>
              ) : (
                <>
                  <Calendar size={20} />
                  {year}年{month}月の出面表を生成
                </>
              )}
            </button>
          </div>
        </div>

        {downloadUrl && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">2</div>
              <h2 className="text-xl font-bold">ダウンロード</h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <CheckCircle className="text-green-600 mb-2" size={24} />
              <p className="font-medium">生成完了</p>
              <p className="text-sm text-gray-600 mt-1">
                {year}年{month}月の出面表が作成されました
              </p>
            </div>
            <button
              onClick={() => window.open(`${API_URL}${downloadUrl}`)}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              ダウンロード
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📅 出面表について</h3>
          <p className="text-sm text-blue-800">
            指定した月の作業員出勤状況を管理するExcel表を自動生成します。
          </p>
        </div>
      </main>
    </div>
  );
};

export default AttendancePage;
