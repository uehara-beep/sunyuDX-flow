import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Download, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

const EstimatePage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [estimateNumber, setEstimateNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setEstimateNumber('');
      setDownloadUrl('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('ファイルを選択してください');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API_URL}/api/estimate/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEstimateNumber(res.data.estimate_number);
      setProjectName(res.data.project_name);
      alert('アップロード完了！');
    } catch (err) {
      console.error('Upload error:', err);
      alert('アップロード失敗: ' + (err as any).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/estimate/generate`,
        { estimate_number: estimateNumber },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            ホームに戻る
          </button>
          <h1 className="text-3xl font-bold">見積書 KAKUSA形式変換</h1>
          <p className="text-blue-100 text-sm mt-1">営業部屋</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-bold">見積Excelをアップロード</h2>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500">
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <input type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium">ファイルを選択</label>
            {file && <p className="mt-2 text-sm text-gray-600">{file.name}</p>}
          </div>
          <button onClick={handleUpload} disabled={!file || isUploading} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2">
            {isUploading ? <><Loader2 className="animate-spin" size={20} />アップロード中...</> : <><Upload size={20} />アップロード</>}
          </button>
        </div>

        {estimateNumber && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">2</div>
              <h2 className="text-xl font-bold">KAKUSA形式で生成</h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-blue-600" size={24} />
                <div>
                  <p className="font-medium">見積番号: {estimateNumber}</p>
                  <p className="text-sm text-gray-600">工事名: {projectName}</p>
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2">
              {isGenerating ? <><Loader2 className="animate-spin" size={20} />生成中...</> : <><FileText size={20} />KAKUSA形式で生成</>}
            </button>
          </div>
        )}

        {downloadUrl && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">3</div>
              <h2 className="text-xl font-bold">ダウンロード</h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <CheckCircle className="text-green-600" size={24} />
              <p className="font-medium">生成完了</p>
            </div>
            <button onClick={() => window.open(`${API_URL}${downloadUrl}`)} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
              <Download size={20} />ダウンロード
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EstimatePage;
