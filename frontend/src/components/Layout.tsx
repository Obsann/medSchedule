import { useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  LayoutDashboard, Users, CalendarDays, Building2, Clock, UserCheck, LogOut, Menu, X,
  CheckCircle, AlertCircle, Info, AlertTriangle, Stethoscope, Activity
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Toast = () => {
  const { toasts, removeToast } = useData();
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[toast.type]} animate-slide-in`}
          onClick={() => removeToast(toast.id)}
        >
          {icons[toast.type]}
          <span className="text-sm font-medium text-gray-800 flex-1">{toast.message}</span>
          <X className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      ))}
    </div>
  );
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'shifts', label: 'Shift Assignment', icon: CalendarDays },
    { id: 'schedule', label: 'Schedule View', icon: Clock },
  ];

  const staffNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-shifts', label: 'My Shifts', icon: CalendarDays },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    { id: 'schedule', label: 'Schedule View', icon: Clock },
  ];

  const patientNav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'view-schedule', label: 'View Schedule', icon: CalendarDays },
    { id: 'find-doctor', label: 'Find Doctor', icon: Stethoscope },
  ];

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'staff' ? staffNav : patientNav;

  const roleColors = {
    admin: 'from-blue-600 to-blue-800',
    staff: 'from-teal-600 to-teal-800',
    patient: 'from-purple-600 to-purple-800',
  };

  const roleBadgeColors = {
    admin: 'bg-blue-100 text-blue-800',
    staff: 'bg-teal-100 text-teal-800',
    patient: 'bg-purple-100 text-purple-800',
  };

  const roleLabels = {
    admin: 'Administrator',
    staff: 'Staff',
    patient: 'Patient',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b ${roleColors[user?.role || 'patient']} z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">MedSchedule</h1>
              <p className="text-white/60 text-xs">Duty Management</p>
            </div>
            <button className="ml-auto lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleBadgeColors[user?.role || 'patient']}`}>
                  {roleLabels[user?.role || 'patient']}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top bar */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-800">
                {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
