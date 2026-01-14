import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageInfo {
  name: string;
  description: string;
  features: string[];
}

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // パスから画面情報を取得
  const getPageInfo = (): PageInfo => {
    const path = location.pathname;
    const pages: Record<string, PageInfo> = {
      '/estimate/create': {
        name: '見積作成',
        description: '見積書をゼロから作成する機能',
        features: [
          '明細行の追加・編集・削除',
          '科目別自動集計',
          'PDF出力',
        ],
      },
      '/budget/create': {
        name: '実行予算作成',
        description: '見積から実行予算を作成',
        features: [
          '見積書から予算転記',
          '5科目別予算配分',
          '予算vs見積の差異表示',
        ],
      },
      '/budget/create-detailed': {
        name: '実行予算作成（詳細）',
        description: '詳細な実行予算を設定',
        features: [
          '月別予算配分',
          '工種別予算設定',
          '予算シミュレーション',
        ],
      },
      '/budget/list': {
        name: '予算一覧',
        description: '作成済み予算の管理',
        features: [
          '予算一覧表示',
          '予算編集・コピー',
          '予算vs実績比較',
        ],
      },
      '/daily/report': {
        name: '日報入力',
        description: '現場作業の日報を入力',
        features: [
          '作業員・時間入力',
          '作業内容記録',
          '原価自動計算',
        ],
      },
      '/cost/input': {
        name: '原価入力',
        description: '実際原価を入力',
        features: [
          '5科目別原価入力',
          '請求書紐付け',
          '月別原価管理',
        ],
      },
      '/office/attendance': {
        name: '勤怠管理',
        description: '社員の勤怠を管理',
        features: [
          '出退勤記録',
          '残業時間集計',
          '有給休暇管理',
        ],
      },
      '/office/expense': {
        name: '経費精算',
        description: '経費の申請・承認',
        features: [
          '経費申請入力',
          '領収書アップロード',
          '承認ワークフロー',
        ],
      },
      '/office/invoice': {
        name: '請求管理',
        description: '請求書の発行・管理',
        features: [
          '請求書作成',
          '入金消込',
          '売掛金管理',
        ],
      },
      '/management/dashboard': {
        name: 'ダッシュボード',
        description: '経営指標を一目で確認',
        features: [
          '売上・利益グラフ',
          '案件別進捗',
          'KPI一覧',
        ],
      },
      '/management/analysis': {
        name: '利益率分析',
        description: '詳細な利益分析レポート',
        features: [
          '案件別利益率',
          '月次推移グラフ',
          '予算vs実績分析',
        ],
      },
      '/management/ai-secretary': {
        name: 'AI秘書',
        description: 'AIが経営をサポート',
        features: [
          '自然言語で質問',
          'データ分析レポート',
          '異常検知アラート',
        ],
      },
      '/management/ai': {
        name: 'AI秘書',
        description: 'AIが経営をサポート',
        features: [
          '自然言語で質問',
          'データ分析レポート',
          '異常検知アラート',
        ],
      },
      '/construction/ledger': {
        name: '工事台帳',
        description: '工事の詳細管理',
        features: [
          '工事一覧表示',
          '進捗管理',
          '原価集計',
        ],
      },
    };
    return pages[path] || {
      name: path.split('/').pop() || 'ページ',
      description: 'この機能は現在開発中です',
      features: ['詳細は後日公開'],
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8E4DF 0%, #d4cfc8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #FF6B00, #ffaa00)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2.5rem'
        }}>
          🚧
        </div>
        <h1 style={{
          fontSize: '1.75rem',
          color: '#0a2540',
          marginBottom: '0.5rem',
          fontWeight: '700'
        }}>
          {pageInfo.name}
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          marginBottom: '1.5rem'
        }}>
          {pageInfo.description}
        </p>

        {/* 実装予定機能 */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}>
            実装予定の機能:
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '1.25rem',
            listStyle: 'none'
          }}>
            {pageInfo.features.map((feature, index) => (
              <li key={index} style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                padding: '0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#10b981' }}>●</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'linear-gradient(135deg, #0a2540 0%, #1a365d 100%)',
              color: 'white',
              border: 'none',
              padding: '0.875rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              padding: '0.875rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            ホームへ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
