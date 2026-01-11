import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Invoice.css';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  projectName: string;
  client: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

const Invoice: React.FC = () => {
  const navigate = useNavigate();

  const [invoices] = useState<InvoiceItem[]>([
    { id: '1', invoiceNo: 'INV-2026-001', projectName: '広島自動車道 烏帽子橋工事', client: '広島県道路公社', amount: 25000000, issueDate: '2026-01-01', dueDate: '2026-01-31', status: 'sent' },
    { id: '2', invoiceNo: 'INV-2026-002', projectName: '国道2号線 舗装工事', client: '国土交通省', amount: 15000000, issueDate: '2026-01-05', dueDate: '2026-02-05', status: 'paid' },
    { id: '3', invoiceNo: 'INV-2025-045', projectName: '県道改良工事', client: '広島県', amount: 8500000, issueDate: '2025-12-15', dueDate: '2026-01-15', status: 'overdue' },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      draft: { label: '下書き', class: 'status-draft' },
      sent: { label: '送付済', class: 'status-sent' },
      paid: { label: '入金済', class: 'status-paid' },
      overdue: { label: '期限超過', class: 'status-overdue' },
    };
    return badges[status];
  };

  const summary = {
    total: invoices.reduce((s, i) => s + i.amount, 0),
    sent: invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.amount, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
  };

  return (
    <div className="page-container office">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/office')}>
          ← 事務部屋へ
        </button>
        <h1 className="page-title">📑 請求書管理</h1>
        <p className="page-subtitle">請求書の発行・入金管理</p>
      </header>

      <main className="page-content">
        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>サマリー</h2>
          </div>
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">請求総額</span>
              <span className="summary-value">¥{(summary.total / 10000).toLocaleString()}万</span>
            </div>
            <div className="summary-card sent">
              <span className="summary-label">未入金</span>
              <span className="summary-value">¥{(summary.sent / 10000).toLocaleString()}万</span>
            </div>
            <div className="summary-card paid">
              <span className="summary-label">入金済</span>
              <span className="summary-value">¥{(summary.paid / 10000).toLocaleString()}万</span>
            </div>
            <div className="summary-card overdue">
              <span className="summary-label">期限超過</span>
              <span className="summary-value">¥{(summary.overdue / 10000).toLocaleString()}万</span>
            </div>
          </div>
        </section>

        <div className="two-column-invoice">
          <div className="invoice-list">
            <div className="section-header">
              <div className="section-line"></div>
              <h2>請求書一覧</h2>
              <button className="add-button">+ 新規作成</button>
            </div>
            <div className="invoice-cards">
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  className={`invoice-card ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <div className="invoice-header">
                    <span className="invoice-no">{invoice.invoiceNo}</span>
                    <span className={`status-badge ${getStatusBadge(invoice.status).class}`}>
                      {getStatusBadge(invoice.status).label}
                    </span>
                  </div>
                  <h3 className="invoice-project">{invoice.projectName}</h3>
                  <p className="invoice-client">{invoice.client}</p>
                  <div className="invoice-amount">¥{invoice.amount.toLocaleString()}</div>
                  <div className="invoice-dates">
                    <span>発行: {invoice.issueDate}</span>
                    <span>期限: {invoice.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="invoice-detail">
            {selectedInvoice ? (
              <>
                <div className="section-header">
                  <div className="section-line"></div>
                  <h2>請求書詳細</h2>
                </div>
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-no">{selectedInvoice.invoiceNo}</span>
                    <span className={`status-badge large ${getStatusBadge(selectedInvoice.status).class}`}>
                      {getStatusBadge(selectedInvoice.status).label}
                    </span>
                  </div>
                  <h3 className="detail-project">{selectedInvoice.projectName}</h3>
                  <div className="detail-info">
                    <div className="info-row">
                      <span className="info-label">請求先</span>
                      <span className="info-value">{selectedInvoice.client}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">請求金額</span>
                      <span className="info-value amount">¥{selectedInvoice.amount.toLocaleString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">発行日</span>
                      <span className="info-value">{selectedInvoice.issueDate}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">支払期限</span>
                      <span className="info-value">{selectedInvoice.dueDate}</span>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button className="action-button secondary">PDF出力</button>
                    <button className="action-button">入金登録</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-detail">
                <span className="empty-icon">👈</span>
                <p>左の一覧から請求書を選択してください</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Invoice;
