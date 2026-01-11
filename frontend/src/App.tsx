import { BrowserRouter, Routes, Route } from 'react-router-dom';

// メインページ
import HomePage from './components/HomePage';

// 4部門
import SalesRoom from './components/SalesRoom';
import ConstructionRoom from './components/ConstructionRoom';
import OfficeRoom from './components/OfficeRoom';
import ManagementRoom from './components/ManagementRoom';

// 営業系ページ
import EstimateUpload from './components/EstimateUpload';
import ProjectList from './components/ProjectList';
import BudgetCreate from './components/BudgetCreate';

// 工事系ページ
import DailyReport from './components/DailyReport';
import CostInput from './components/CostInput';
import ConstructionLedger from './components/ConstructionLedger';

// 事務系ページ
import Attendance from './components/Attendance';
import Expense from './components/Expense';
import Invoice from './components/Invoice';

// 経営系ページ
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import AISecretary from './components/AISecretary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ホーム */}
        <Route path="/" element={<HomePage />} />

        {/* 営業部屋 */}
        <Route path="/sales" element={<SalesRoom />} />
        <Route path="/estimate/upload" element={<EstimateUpload />} />
        <Route path="/budget/create" element={<BudgetCreate />} />
        <Route path="/projects" element={<ProjectList />} />

        {/* 工事部屋 */}
        <Route path="/construction" element={<ConstructionRoom />} />
        <Route path="/construction/ledger" element={<ConstructionLedger />} />
        <Route path="/daily/report" element={<DailyReport />} />
        <Route path="/cost/input" element={<CostInput />} />

        {/* 事務部屋 */}
        <Route path="/office" element={<OfficeRoom />} />
        <Route path="/office/attendance" element={<Attendance />} />
        <Route path="/office/expense" element={<Expense />} />
        <Route path="/office/invoice" element={<Invoice />} />

        {/* 経営部屋 */}
        <Route path="/management" element={<ManagementRoom />} />
        <Route path="/management/dashboard" element={<Dashboard />} />
        <Route path="/management/analysis" element={<Analysis />} />
        <Route path="/management/ai-secretary" element={<AISecretary />} />
        <Route path="/management/ai" element={<AISecretary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
