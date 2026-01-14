import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jget } from '../api';
import './EstimateUpload.css';

// プロキシ経由でAPIを呼び出し（vite.config.tsで設定）

interface Project {
  id: string;
  name?: string;
  title?: string;
  project_name?: string;
  client?: string;
  client_name?: string;
}

// プロジェクト表示名を取得（フォールバック付き）
const getProjectDisplayName = (p: Project): string => {
  const name = p.name || p.title || p.project_name || `案件(${p.id.slice(0, 6)})`;
  const client = p.client || p.client_name || '';
  return client ? `${name} (${client})` : name;
};

interface PreviewLine {
  sheet_name: string;
  row_no: number;
  name: string;
  breakdown: string;
  qty: number | null;
  unit: string;
  unit_price: number | null;
  amount: number | null;
  note: string;
  category: string;
}

interface SheetInfo {
  name: string;
  line_count?: number;
  reason?: string;
  header_row?: number;
  detected_columns?: string[];
  candidates?: { row: number; columns: string[]; key_count: number }[];
}

interface ValueStats {
  total_lines?: number;
  qty_missing_rate?: string;
  unit_missing_rate?: string;
  unit_price_missing_rate?: string;
  amount_missing_rate?: string;
}

interface Preview {
  lines: PreviewLine[];
  total_amount: number;
  line_count: number;
  sheets_processed?: SheetInfo[];
  sheets_skipped?: SheetInfo[];
  missing_columns?: string[];
  error_reasons?: string[];
  reason?: string;  // header_not_found, required_columns_missing, etc.
  reason_label?: string;  // 日本語ラベル
  detected_headers?: Record<string, number>;
  value_stats?: ValueStats;
}

const EstimateUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // プロジェクト選択
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // インポート状態
  const [importing, setImporting] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  // コミット状態
  const [committing, setCommitting] = useState(false);
  const [kind, setKind] = useState<'estimate' | 'budget' | 'actual'>('estimate');
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 添付ファイル
  const [conditionsFile, setConditionsFile] = useState<File | null>(null);
  const [confirmationFile, setConfirmationFile] = useState<File | null>(null);

  // トースト
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // エラー状態（行番号付き）
  const [errors, setErrors] = useState<{ row?: number; sheet?: string; message: string }[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // APIエラーをパース（ユーザーフレンドリーなメッセージに変換）
  const parseApiError = (errorText: string): { message: string; errors?: { row?: number; sheet?: string; message: string }[] } => {
    // 長いエラーはコンソールに出力
    if (errorText.length > 200) {
      console.error('API Error (full):', errorText);
    }

    // DB関連エラーの検出
    if (errorText.includes('does not exist') || errorText.includes('relation') || errorText.includes('UndefinedTable')) {
      return { message: 'DBの初期化が未完了です（migration未適用）。管理者に連絡してください。' };
    }
    if (errorText.includes('connection') || errorText.includes('connect')) {
      return { message: 'データベースに接続できません。しばらく待ってから再試行してください。' };
    }
    if (errorText.includes('duplicate') || errorText.includes('unique')) {
      return { message: 'このデータは既に登録されています。' };
    }

    try {
      const data = JSON.parse(errorText);
      if (data.detail) {
        // FastAPIのエラー形式
        if (Array.isArray(data.detail)) {
          return {
            message: 'バリデーションエラー',
            errors: data.detail.map((e: any) => ({
              row: e.loc?.[1],
              message: e.msg
            }))
          };
        }
        // 詳細メッセージが長い場合は短縮
        const detail = String(data.detail);
        if (detail.length > 100) {
          console.error('API Error (detail):', detail);
          return { message: 'サーバーエラーが発生しました。詳細はコンソールを確認してください。' };
        }
        return { message: detail };
      }
      return { message: errorText.slice(0, 100) };
    } catch {
      // JSONパース失敗 - テキストが長い場合は短縮
      if (errorText.length > 100) {
        return { message: 'サーバーエラーが発生しました。詳細はコンソールを確認してください。' };
      }
      return { message: errorText };
    }
  };

  // プロジェクト一覧取得
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await jget<{ projects: Project[] }>('/api/projects');
        setProjects(data.projects);
      } catch (err) {
        console.error('プロジェクト取得エラー:', err);
      }
    };
    fetchProjects();
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreview(null);
      setImportId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setImportId(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProjectId) {
      showToast('ファイルとプロジェクトを選択してください', 'error');
      return;
    }

    setImporting(true);
    setErrors([]);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch(`/api/projects/${selectedProjectId}/imports/estimate`, {
        method: 'POST',
        body: fd
      });

      if (!res.ok) {
        const errorText = await res.text();
        const parsed = parseApiError(errorText);
        if (parsed.errors) {
          setErrors(parsed.errors);
        }
        throw new Error(parsed.message);
      }

      const data = await res.json();

      // 診断情報をコンソールに出力
      console.log('[Excel取込結果]', {
        status: data.status,
        line_count: data.preview.line_count,
        sheets_processed: data.preview.sheets_processed,
        sheets_skipped: data.preview.sheets_skipped,
        detected_headers: data.preview.detected_headers,
        value_stats: data.preview.value_stats,
        reason: data.preview.reason,
      });

      // 0件の場合（status: 'warning'）
      if (data.status === 'warning' || data.preview.line_count === 0) {
        setImportId(null);
        setPreview(data.preview);
        // エラー理由を表示
        const reasons = data.preview.error_reasons || [];
        if (reasons.length > 0) {
          setErrors(reasons.map((r: string) => ({ message: r })));
        }
        const reasonLabel = data.preview.reason_label || '明細を検出できませんでした';
        showToast(reasonLabel, 'error');
        return;
      }

      setImportId(data.import_id);
      setPreview(data.preview);

      // 欠損率が高い場合は警告を含める
      const stats = data.preview.value_stats;
      let toastMsg = `プレビュー読込完了（${data.preview.line_count}件）`;
      if (stats) {
        const qtyMissing = parseFloat(stats.qty_missing_rate) || 0;
        const amtMissing = parseFloat(stats.amount_missing_rate) || 0;
        if (qtyMissing > 50 || amtMissing > 30) {
          toastMsg += ` ※一部欠損あり`;
        }
      }
      showToast(toastMsg, 'success');
    } catch (err: any) {
      showToast(err.message || '読込に失敗しました', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleCommit = async () => {
    if (!importId) return;

    setCommitting(true);
    setErrors([]);
    try {
      const res = await fetch(`/api/imports/${importId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          month: kind !== 'estimate' ? month : null
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        const parsed = parseApiError(errorText);
        if (parsed.errors) {
          setErrors(parsed.errors);
        }
        throw new Error(parsed.message);
      }

      const data = await res.json();

      // 添付ファイルのアップロード
      const uploadAttachment = async (file: File, type: string) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        fd.append('import_id', importId);
        await fetch(`/api/projects/${selectedProjectId}/attachments`, {
          method: 'POST',
          body: fd
        });
      };

      if (conditionsFile) {
        await uploadAttachment(conditionsFile, 'conditions');
      }
      if (confirmationFile) {
        await uploadAttachment(confirmationFile, 'confirmation');
      }

      showToast(`保存しました（${data.line_count}件）`, 'success');

      // 少し待ってから遷移
      setTimeout(() => {
        navigate(`/projects/${selectedProjectId}`);
      }, 1200);
    } catch (err: any) {
      showToast(err.message || '保存に失敗しました', 'error');
    } finally {
      setCommitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      labor: { label: '労務費', color: '#3b82f6' },
      subcontract: { label: '外注費', color: '#8b5cf6' },
      material: { label: '材料費', color: '#f59e0b' },
      machine: { label: '機械費', color: '#10b981' },
      expense: { label: '経費', color: '#6b7280' }
    };
    return labels[category] || { label: category, color: '#666' };
  };

  return (
    <div className="page-container">
      {/* トースト通知 */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#059669' : '#dc2626',
          color: 'white',
          fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}

      {/* エラー一覧（行番号付き） */}
      {errors.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          maxWidth: '400px',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '16px',
          borderRadius: '8px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 9998
        }}>
          <div style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>エラー詳細</span>
            <button onClick={() => setErrors([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
          </div>
          {errors.map((err, idx) => (
            <div key={idx} style={{ fontSize: '0.875rem', color: '#991b1b', padding: '4px 0', borderBottom: '1px solid #fecaca' }}>
              {err.sheet && <span style={{ fontWeight: '600' }}>[{err.sheet}]</span>}
              {err.row && <span style={{ fontWeight: '600' }}> 行{err.row}:</span>}
              <span> {err.message}</span>
            </div>
          ))}
        </div>
      )}

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
            <p className="card-description">Excel1冊分を一括で取り込み・保存します</p>
          </div>

          {/* プロジェクト選択 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              対象プロジェクト
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="">プロジェクトを選択...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{getProjectDisplayName(p)}</option>
              ))}
            </select>
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
                <button className="change-file" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setImportId(null); }}>
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

          {/* 読込ボタン */}
          {!preview && (
            <button
              className={`upload-button ${file && selectedProjectId ? 'active' : ''}`}
              onClick={handleUpload}
              disabled={!file || !selectedProjectId || importing}
              style={{ opacity: importing ? 0.7 : 1 }}
            >
              {importing ? (
                <>読込中...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  読込（プレビュー）
                </>
              )}
            </button>
          )}
        </div>

        {/* プレビュー表示 */}
        {preview && (
          <div className="upload-card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header-section">
              <h2 className="card-title">プレビュー</h2>
              <p className="card-description">
                {preview.line_count}件 / 合計 ¥{preview.total_amount.toLocaleString()}
              </p>
            </div>

            {/* シート情報 */}
            {(preview.sheets_processed?.length || preview.sheets_skipped?.length) && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem' }}>
                {preview.sheets_processed && preview.sheets_processed.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#059669' }}>取込済シート: </span>
                    {preview.sheets_processed.map((s, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        margin: '0.125rem 0.25rem',
                        padding: '0.125rem 0.5rem',
                        background: '#d1fae5',
                        borderRadius: '4px',
                        color: '#065f46'
                      }}>
                        {s.name} ({s.line_count}件)
                      </span>
                    ))}
                  </div>
                )}
                {preview.sheets_skipped && preview.sheets_skipped.length > 0 && (
                  <div>
                    <span style={{ fontWeight: '600', color: '#9ca3af' }}>スキップ: </span>
                    {preview.sheets_skipped.map((s, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        margin: '0.125rem 0.25rem',
                        padding: '0.125rem 0.5rem',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        color: '#6b7280'
                      }} title={s.reason}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 欠損率統計（行がある場合） */}
            {preview.line_count > 0 && preview.value_stats && (() => {
              // 欠損率をパース
              const parseRate = (rate: string | undefined) => parseFloat((rate || '0%').replace('%', '')) || 0;
              const qtyMissing = parseRate(preview.value_stats.qty_missing_rate);
              const priceMissing = parseRate(preview.value_stats.unit_price_missing_rate);
              const amountMissing = parseRate(preview.value_stats.amount_missing_rate);
              const hasHighMissing = qtyMissing > 20 || priceMissing > 50 || amountMissing > 50;
              const hasWarning = qtyMissing > 0 || priceMissing > 30;

              return (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: hasHighMissing ? '#fef2f2' : hasWarning ? '#fffbeb' : '#f0fdf4',
                  borderRadius: '8px',
                  border: hasHighMissing ? '1px solid #fecaca' : hasWarning ? '1px solid #fde68a' : '1px solid #bbf7d0'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginBottom: hasWarning ? '0.5rem' : 0
                  }}>
                    <span style={{ fontWeight: '600', color: hasHighMissing ? '#dc2626' : hasWarning ? '#92400e' : '#059669' }}>
                      {hasHighMissing ? '⚠️ 取込品質:' : hasWarning ? '📊 取込品質:' : '✓ 取込品質:'}
                    </span>
                    <span style={{ color: qtyMissing > 20 ? '#dc2626' : qtyMissing > 0 ? '#b45309' : '#059669' }}>
                      数量: {preview.value_stats.qty_missing_rate || '0%'}欠損
                    </span>
                    <span style={{ color: priceMissing > 50 ? '#dc2626' : priceMissing > 30 ? '#b45309' : '#059669' }}>
                      単価: {preview.value_stats.unit_price_missing_rate || '0%'}欠損
                    </span>
                    <span style={{ color: amountMissing > 50 ? '#dc2626' : amountMissing > 30 ? '#b45309' : '#059669' }}>
                      金額: {preview.value_stats.amount_missing_rate || '0%'}欠損
                    </span>
                  </div>
                  {hasWarning && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: hasHighMissing ? '#991b1b' : '#92400e',
                      background: hasHighMissing ? '#fee2e2' : '#fef3c7',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px'
                    }}>
                      {qtyMissing > 20 ? (
                        <>💡 数量が空の行があります。Excelの数量列を確認するか、金額÷単価で自動逆算されます。</>
                      ) : qtyMissing > 0 ? (
                        <>💡 一部の行で数量が空です。金額と単価から自動計算されます。</>
                      ) : priceMissing > 30 ? (
                        <>💡 単価が空の行があります。金額÷数量で自動計算されます。</>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 0件の場合のメッセージ */}
            {preview.line_count === 0 && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#fef2f2',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {preview.reason_label || 'このExcelは明細ヘッダーを検出できませんでした'}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.75rem' }}>
                  ヘッダー行には「名称」「数量」「単価」「金額」のうち2つ以上が必要です
                </div>

                {/* 原因コードと詳細（簡潔に） */}
                {preview.reason && (
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#fee2e2',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#7f1d1d',
                    marginBottom: '0.75rem'
                  }}>
                    原因: {preview.reason}
                  </div>
                )}

                {/* スキップされたシート情報 */}
                {preview.sheets_skipped && preview.sheets_skipped.length > 0 && (
                  <div style={{ marginTop: '0.5rem', textAlign: 'left', padding: '0.75rem', background: '#fff', borderRadius: '4px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#7f1d1d', fontSize: '0.875rem' }}>
                      シート別詳細:
                    </div>
                    {preview.sheets_skipped.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', color: '#991b1b', padding: '0.25rem 0', borderBottom: '1px solid #fecaca' }}>
                        <strong>{s.name}:</strong> {s.reason?.split('。')[0] || 'ヘッダー未検出'}
                      </div>
                    ))}
                    {preview.sheets_skipped.length > 3 && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        ... 他 {preview.sheets_skipped.length - 3} シート
                      </div>
                    )}
                  </div>
                )}

                {/* error_reasons は詳細ログとしてコンソールに出力 */}
                {preview.error_reasons && preview.error_reasons.length > 0 && (() => {
                  console.log('[Excel取込診断]', preview.error_reasons);
                  return null;
                })()}
              </div>
            )}

            {/* 種類・月選択 (0件でない場合のみ) */}
            {preview.line_count > 0 && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', color: '#6b7280' }}>
                    種類
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as any)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="estimate">見積</option>
                    <option value="budget">予算</option>
                    <option value="actual">原価（実績）</option>
                  </select>
                </div>
                {kind !== 'estimate' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', color: '#6b7280' }}>
                      対象月
                    </label>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* プレビューテーブル */}
            {preview.line_count > 0 && (
            <>
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>シート</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>名称</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>内訳</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>数量</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>単位</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>単価</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>金額</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>科目</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>備考</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.lines.slice(0, 50).map((line, idx) => {
                    const catInfo = getCategoryLabel(line.category);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.75rem' }}>{line.sheet_name}</td>
                        <td style={{ padding: '0.75rem' }}>{line.name}</td>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>{line.breakdown}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{line.qty != null ? line.qty : '-'}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{line.unit || '-'}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {line.unit_price != null ? `¥${line.unit_price.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#0066cc' }}>
                          ¥{(line.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'white',
                            background: catInfo.color
                          }}>
                            {catInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>{line.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #0a2540', background: '#f9fafb' }}>
                    <td colSpan={5} style={{ padding: '0.75rem', fontWeight: '600' }}>合計</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#059669', fontSize: '1.1rem' }}>
                      ¥{preview.total_amount.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
              {preview.lines.length > 50 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  ... 他 {preview.lines.length - 50} 件
                </div>
              )}
            </div>

            {/* 添付ファイル */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                添付ファイル（任意）
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                    条件書
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="file"
                      onChange={(e) => setConditionsFile(e.target.files?.[0] || null)}
                      accept=".pdf,.xlsx,.xls,.doc,.docx"
                      style={{ fontSize: '0.875rem' }}
                    />
                    {conditionsFile && (
                      <button onClick={() => setConditionsFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                    確認書
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="file"
                      onChange={(e) => setConfirmationFile(e.target.files?.[0] || null)}
                      accept=".pdf,.xlsx,.xls,.doc,.docx"
                      style={{ fontSize: '0.875rem' }}
                    />
                    {confirmationFile && (
                      <button onClick={() => setConfirmationFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <button
              onClick={handleCommit}
              disabled={committing}
              style={{
                width: '100%',
                padding: '1rem',
                background: committing ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.125rem',
                fontWeight: '700',
                cursor: committing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)'
              }}
            >
              {committing ? (
                <>保存中...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  保存（{kind === 'estimate' ? '見積' : kind === 'budget' ? '予算' : '原価'}として登録）
                </>
              )}
            </button>
            </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EstimateUpload;
