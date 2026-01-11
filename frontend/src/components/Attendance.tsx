import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Attendance.css';

interface AttendanceRecord {
  id: number;
  name: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakTime: number;
  workHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'leave';
}

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [records] = useState<AttendanceRecord[]>([
    { id: 1, name: '田中 太郎', date: selectedDate, checkIn: '08:00', checkOut: '17:30', breakTime: 60, workHours: 8.5, overtime: 0.5, status: 'present' },
    { id: 2, name: '鈴木 花子', date: selectedDate, checkIn: '08:15', checkOut: '17:00', breakTime: 60, workHours: 7.75, overtime: 0, status: 'late' },
    { id: 3, name: '佐藤 次郎', date: selectedDate, checkIn: '08:00', checkOut: '19:00', breakTime: 60, workHours: 10, overtime: 2, status: 'present' },
    { id: 4, name: '山田 美咲', date: selectedDate, checkIn: '-', checkOut: '-', breakTime: 0, workHours: 0, overtime: 0, status: 'absent' },
    { id: 5, name: '高橋 健一', date: selectedDate, checkIn: '-', checkOut: '-', breakTime: 0, workHours: 0, overtime: 0, status: 'leave' },
  ]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      present: { label: '出勤', class: 'status-present' },
      absent: { label: '欠勤', class: 'status-absent' },
      late: { label: '遅刻', class: 'status-late' },
      leave: { label: '休暇', class: 'status-leave' },
    };
    return badges[status] || badges.present;
  };

  const summary = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    leave: records.filter(r => r.status === 'leave').length,
    totalHours: records.reduce((sum, r) => sum + r.workHours, 0),
    totalOvertime: records.reduce((sum, r) => sum + r.overtime, 0),
  };

  return (
    <div className="page-container office">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/office')}>
          ← 事務部屋へ
        </button>
        <h1 className="page-title">📋 勤怠管理</h1>
        <p className="page-subtitle">出退勤・残業時間の管理</p>
      </header>

      <main className="page-content">
        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>日付選択</h2>
          </div>
          <div className="date-picker-card">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-number">{summary.present}</span>
                <span className="stat-label">出勤</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number late">{summary.late}</span>
                <span className="stat-label">遅刻</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number absent">{summary.absent}</span>
                <span className="stat-label">欠勤</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number leave">{summary.leave}</span>
                <span className="stat-label">休暇</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number">{summary.totalHours}h</span>
                <span className="stat-label">総労働</span>
              </div>
              <div className="summary-stat">
                <span className="stat-number overtime">{summary.totalOvertime}h</span>
                <span className="stat-label">残業</span>
              </div>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <div className="section-line"></div>
            <h2>勤怠一覧</h2>
            <button className="add-button">+ 手動登録</button>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>ステータス</th>
                  <th>出勤</th>
                  <th>退勤</th>
                  <th>休憩</th>
                  <th>労働時間</th>
                  <th>残業</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td className="name-cell">{record.name}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(record.status).class}`}>
                        {getStatusBadge(record.status).label}
                      </span>
                    </td>
                    <td>{record.checkIn}</td>
                    <td>{record.checkOut}</td>
                    <td>{record.breakTime > 0 ? `${record.breakTime}分` : '-'}</td>
                    <td className="hours">{record.workHours > 0 ? `${record.workHours}h` : '-'}</td>
                    <td className={`overtime ${record.overtime > 0 ? 'has-overtime' : ''}`}>
                      {record.overtime > 0 ? `${record.overtime}h` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="form-actions">
          <button className="cancel-button">Excel出力</button>
          <button className="submit-button">月次レポート</button>
        </div>
      </main>
    </div>
  );
};

export default Attendance;
