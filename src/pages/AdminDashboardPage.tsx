import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, type AppPage } from '../components/Sidebar';
import { AdminView } from '../components/AdminView';
import { AllProductsPage } from '../components/AllProductsPage';
import { LMPCRulesPage } from '../components/LMPCRulesPage';
import { ReportsPage } from '../components/ReportsPage';
import { loadScanHistory, clearScanHistory } from '../utils/storage';
import type { ScanHistoryItem } from '../types/compliance';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Only pages available for Admin
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadScanHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Clear all saved scan history?')) {
      clearScanHistory();
      setHistory([]);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        role="Admin"
        currentUserName={currentUser}
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onSignOut={handleSignOut}
        issuesCount={0}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6 no-print">
          {activePage === 'dashboard' ? (
            <AdminView history={history} onSignOut={handleSignOut} />
          ) : activePage === 'all-products' ? (
            <AllProductsPage
              history={history}
              onClearHistory={handleClearHistory}
              onSelectScan={() => setActivePage('dashboard')}
            />
          ) : activePage === 'rules' ? (
            <LMPCRulesPage />
          ) : activePage === 'reports' ? (
            <ReportsPage
              history={history}
              role="Admin"
              onPrintScan={() => window.print()}
            />
          ) : (
            // Fallback: show admin view for any other page
            <AdminView history={history} onSignOut={handleSignOut} />
          )}
        </main>

        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 no-print mt-auto">
          <p>
            LM Compliance Scanner &bull; 100% Client-Side OCR &bull; Legal Metrology Packaged Commodities (LMPC) Rules
          </p>
        </footer>
      </div>
    </div>
  );
};
