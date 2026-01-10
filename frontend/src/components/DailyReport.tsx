import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DailyReport.css';

interface Photo {
  id: string;
  url: string;
  description: string;
}

interface Report {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  workType: string;
  workHours: number;
  workersCount: number;
  progress: string;
  weather: string;
  photos: Photo[];
}

const DailyReport: React.FC = () => {
  const navigate = useNavigate();
  
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workType, setWorkType] = useState('');
  const [workHours, setWorkHours] = useState(8);
  const [workersCount, setWorkersCount] = useState(5);
  const [progress, setProgress] = useState('');
  const [weather, setWeather] = useState('晴れ');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: Photo[] = Array.from(e.target.files).map((file) => ({
        id: Date.now().toString() + Math.random(),
        url: URL.createObjectURL(file),
        description: '',
      }));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const updatePhotoDescription = (id: string, description: string) => {
    setPhotos(photos.map(photo =>
      photo.id === id ? { ...photo, description } : photo
    ));
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(photo => photo.id !== id));
  };

  const saveReport = async () => {
    if (!projectId || !workType || !progress) {
      alert('必須項目を入力してください');
      return;
    }

    const newReport: Report = {
      id: Date.now().toString(),
      date,
      projectId,
      projectName: getProjectName(projectId),
      workType,
      workHours,
      workersCount,
      progress,
      weather,
      photos: [...photos],
    };

    setReports([newReport, ...reports]);

    // フォームリセット
    setWorkType('');
    setProgress('');
    setPhotos([]);

    alert('日報を保存しました！');
  };

  const getProjectName = (id: string) => {
    const projects: Record<string, string> = {
      '1': '広島自動車道工事',
      '2': '○○市水道管工事',
      '3': '△△高速道路舗装工事',
    };
    return projects[id] || '';
  };

  return (
    <div className="daily-report-container">
      <header className="report-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="page-title">日報入力</h1>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
            工事一覧へ
          </button>
        </div>
      </header>

      <div className="report-content">
        {/* 入力フォーム */}
        <div className="report-form-card">
          <h2 className="section-title">📝 本日の作業報告</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>工事選択 *</label>
              <select
                className="input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="1">広島自動車道工事</option>
                <option value="2">○○市水道管工事</option>
                <option value="3">△△高速道路舗装工事</option>
              </select>
            </div>

            <div className="form-group">
              <label>日付 *</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>作業内容 *</label>
              <input
                type="text"
                className="input"
                placeholder="床版防水工事"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>天候</label>
              <select
                className="input"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              >
                <option value="晴れ">☀️ 晴れ</option>
                <option value="曇り">☁️ 曇り</option>
                <option value="雨">🌧️ 雨</option>
                <option value="雪">❄️ 雪</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>作業時間</label>
              <input
                type="number"
                className="input"
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
              />
              <span className="unit">時間</span>
            </div>

            <div className="form-group">
              <label>作業員数</label>
              <input
                type="number"
                className="input"
                value={workersCount}
                onChange={(e) => setWorkersCount(Number(e.target.value))}
              />
              <span className="unit">人</span>
            </div>
          </div>

          <div className="form-group">
            <label>進捗状況 *</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="本日の作業内容と進捗を記入してください"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>📸 工事写真</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="input"
              onChange={handlePhotoUpload}
            />
            {photos.length > 0 && (
              <div className="photos-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="photo-card">
                    <img src={photo.url} alt="工事写真" className="photo-image" />
                    <input
                      type="text"
                      className="photo-description"
                      placeholder="写真の説明"
                      value={photo.description}
                      onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                    />
                    <button
                      className="photo-remove"
                      onClick={() => removePhoto(photo.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-large" onClick={saveReport}>
            💾 日報を保存
          </button>
        </div>

        {/* 日報一覧 */}
        {reports.length > 0 && (
          <div className="reports-list-card">
            <h2 className="section-title">📋 最近の日報</h2>

            <div className="reports-list">
              {reports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-header-row">
                    <div className="report-date">
                      📅 {report.date}
                    </div>
                    <div className="report-weather">
                      {report.weather}
                    </div>
                  </div>

                  <h3 className="report-project">{report.projectName}</h3>
                  <div className="report-work-type">{report.workType}</div>

                  <div className="report-stats">
                    <div className="stat-item">
                      <span className="stat-icon">⏰</span>
                      <span className="stat-value">{report.workHours}時間</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">👷</span>
                      <span className="stat-value">{report.workersCount}人</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📸</span>
                      <span className="stat-value">{report.photos.length}枚</span>
                    </div>
                  </div>

                  <div className="report-progress">
                    {report.progress}
                  </div>

                  {report.photos.length > 0 && (
                    <div className="report-photos">
                      {report.photos.slice(0, 3).map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt="工事写真"
                          className="report-photo-thumb"
                        />
                      ))}
                      {report.photos.length > 3 && (
                        <div className="photo-count">
                          +{report.photos.length - 3}枚
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
