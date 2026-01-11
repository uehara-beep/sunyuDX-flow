import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EstimateUpload.css';

const EstimateUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleUpload = () => {
    if (file) {
      console.log('Uploading:', file.name);
      // アップロード処理
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/sales')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          営業部屋
        </button>
        <h1 className="page-title">見積書アップロード</h1>
        <div className="user-badge">たく</div>
      </header>

      <main className="page-content">
        <div className="upload-card">
          <div className="card-header-section">
            <h2 className="card-title">見積Excelをアップロード</h2>
            <p className="card-description">KAKUSA形式の見積書に変換します</p>
          </div>

          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {file ? (
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-name">{file.name}</div>
                <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                <button className="change-file" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                  変更
                </button>
              </div>
            ) : (
              <div className="drop-content">
                <div className="drop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="drop-text">ファイルをドラッグ＆ドロップ</div>
                <div className="drop-subtext">または クリックして選択</div>
                <div className="drop-formats">.xlsx, .xls 形式対応</div>
              </div>
            )}
          </div>

          <button 
            className={`upload-button ${file ? 'active' : ''}`}
            onClick={handleUpload}
            disabled={!file}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            アップロード
          </button>
        </div>
      </main>
    </div>
  );
};

export default EstimateUpload;
