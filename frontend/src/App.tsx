import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import StaffManagement from './pages/admin/StaffManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import ShiftManagement from './pages/admin/ShiftManagement';
import ScheduleView from './pages/ScheduleView';
import { MyShifts, ProfilePage } from './pages/staff/StaffPages';
import { PatientScheduleViewer, FindDoctor } from './pages/patient/PatientPages';
import { Activity } from 'lucide-react';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isLoading, error, refetch } = useData();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (isAuthenticated) setCurrentPage('dashboard');
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setCurrentPage('dashboard')} />;
  }

  // Show loading spinner while fetching data from API
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Loading Schedule Data</h2>
          <p className="text-sm text-gray-500">Fetching from server...</p>
          <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Show error with retry
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      <PageRouter page={currentPage} onNavigate={setCurrentPage} />
    </Layout>
  );
}

function PageRouter({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  switch (page) {
    case 'dashboard': return <DashboardPage onNavigate={onNavigate} />;
    case 'staff': return <StaffManagement />;
    case 'departments': return <DepartmentManagement />;
    case 'shifts': return <ShiftManagement />;
    case 'schedule': return <ScheduleView />;
    case 'my-shifts': return <MyShifts />;
    case 'profile': return <ProfilePage />;
    case 'view-schedule': return <PatientScheduleViewer />;
    case 'find-doctor': return <FindDoctor />;
    default: return <DashboardPage onNavigate={onNavigate} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
