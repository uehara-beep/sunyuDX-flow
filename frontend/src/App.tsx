import { BrowserRouter, Routes, Route } from 'react-router-dom';

// メインページ
import HomePage from './components/HomePage';

// 営業部屋
import EstimatePage from './pages/sales/EstimatePage';

// 工事部屋
import LedgerPage from './pages/construction/LedgerPage';
import SchedulePage from './pages/construction/SchedulePage';
import BudgetCreation from './pages/BudgetCreation';

// 事務所部屋
import AttendancePage from './pages/office/AttendancePage';
import DailyReport from './pages/DailyReport';

// 経営部屋
import DashboardPage from './pages/management/DashboardPage';

// その他
import ProjectList from './pages/ProjectList';
import CostInput from './pages/CostInput';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ホーム */}
        <Route path="/" element={<HomePage />} />

        {/* 営業部屋 */}
        <Route path="/sales/estimate" element={<EstimatePage />} />
        <Route path="/estimate/upload" element={<EstimatePage />} />

        {/* 工事部屋 */}
        <Route path="/construction/ledger" element={<LedgerPage />} />
        <Route path="/construction/schedule" element={<SchedulePage />} />
        <Route path="/budget/create" element={<BudgetCreation />} />

        {/* 事務所部屋 */}
        <Route path="/office/attendance" element={<AttendancePage />} />
        <Route path="/daily/report" element={<DailyReport />} />

        {/* 経営部屋 */}
        <Route path="/management/dashboard" element={<DashboardPage />} />

        {/* その他 */}
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/cost/input" element={<CostInput />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
