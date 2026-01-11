import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DailyReport.css';

interface WorkEntry {
  id: number;
  worker: string;
  task: string;
  hours: number;
}

const DailyReport: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState('');
  const [weather, setWeather] = useState('晴れ');
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [progress, setProgress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), worker: '', task: '', hours: 8 }]);
  };

  const updateEntry = (id: number, field: keyof WorkEntry, value: string | number) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleSubmit = () => {
    alert('日報を保存しました');
    navigate('/construction');
  };

  return (
    <div className="page-container construction">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/construction')}>
          ← 工事部屋へ
        </button>
        <h1 className="page-title">📝 日報入力</h1>
        <p className="page-subtitle">作業内容と進捗を記録</p>
      </header>

      <main className="page-content">
        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>基本情報</h2>
          </div>
          <div className="form-card">
            <div className="form-grid three-col">
              <div className="form-group">
                <label>日付</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>工事名</label>
                <select value={project} onChange={e => setProject(e.target.value)}>
                  <option value="">選択してください</option>
                  <option value="1">広島自動車道 烏帽子橋工事</option>
                  <option value="2">国道2号線 舗装工事</option>
                  <option value="3">市道改良工事</option>
                </select>
              </div>
              <div className="form-group">
                <label>天候</label>
                <select value={weather} onChange={e => setWeather(e.target.value)}>
                  <option value="晴れ">☀️ 晴れ</option>
                  <option value="曇り">☁️ 曇り</option>
                  <option value="雨">🌧️ 雨</option>
                  <option value="雪">❄️ 雪</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>作業員・作業内容</h2>
            <button className="add-button" onClick={addEntry}>+ 追加</button>
          </div>
          <div className="entries-list">
            {entries.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👷</span>
                <p>作業員を追加してください</p>
              </div>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-row">
                    <input
                      type="text"
                      placeholder="作業員名"
                      value={entry.worker}
                      onChange={e => updateEntry(entry.id, 'worker', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="作業内容"
                      value={entry.task}
                      onChange={e => updateEntry(entry.id, 'task', e.target.value)}
                      className="flex-2"
                    />
                    <div className="hours-input">
                      <input
                        type="number"
                        value={entry.hours}
                        onChange={e => updateEntry(entry.id, 'hours', Number(e.target.value))}
                      />
                      <span>時間</span>
                    </div>
                    <button className="remove-button" onClick={() => removeEntry(entry.id)}>×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>進捗状況</h2>
          </div>
          <div className="form-card">
            <textarea
              placeholder="本日の進捗状況を入力してください..."
              value={progress}
              onChange={e => setProgress(e.target.value)}
              rows={4}
            />
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>工事写真</h2>
          </div>
          <div className="photo-upload">
            <label className="upload-area">
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} />
              <span className="upload-icon">📷</span>
              <span>クリックまたはドラッグで写真を追加</span>
            </label>
            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((photo, i) => (
                  <div key={i} className="photo-item">
                    <img src={photo} alt={`写真${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="form-actions">
          <button className="cancel-button" onClick={() => navigate('/construction')}>キャンセル</button>
          <button className="submit-button" onClick={handleSubmit}>保存する</button>
        </div>
      </main>
    </div>
  );
};

export default DailyReport;
