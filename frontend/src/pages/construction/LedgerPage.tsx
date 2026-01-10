import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Download, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

const LedgerPage = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      alert('工事名を入力してください');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/ledger/generate`,
        { project_name: projectName },
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-green-100 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            ホームに戻る
          </button>
          <h1 className="text-3xl font-bold">工事台帳作成</h1>
          <p className="text-green-100 text-sm mt-1">工事部屋</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-bold">工事情報を入力</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工事名
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: 長崎駅交通広場整備工事"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !projectName.trim()}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  生成中...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  工事台帳を生成
                </>
              )}
            </button>
          </div>
        </div>

        {downloadUrl && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">2</div>
              <h2 className="text-xl font-bold">ダウンロード</h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <CheckCircle className="text-green-600 mb-2" size={24} />
              <p className="font-medium">生成完了</p>
              <p className="text-sm text-gray-600 mt-1">
                5科目の工事台帳が作成されました
              </p>
            </div>
            <button
              onClick={() => window.open(`${API_URL}${downloadUrl}`)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              ダウンロード
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📋 工事台帳について</h3>
          <p className="text-sm text-blue-800">
            材料費・労務費・機械費・外注費・経費の5科目で構成された工事台帳を自動生成します。
          </p>
        </div>
      </main>
    </div>
  );
};

export default LedgerPage;
