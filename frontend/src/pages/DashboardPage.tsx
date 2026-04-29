import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { format, startOfWeek, addDays, parseISO, isToday } from 'date-fns';
import {
  Users, Building2, CalendarDays, Clock, TrendingUp, UserCheck,
  Activity, Stethoscope, ArrowRight, AlertCircle, ShieldCheck,
  BarChart3, Sunrise, Sun, Moon, CheckCircle2, XCircle, UserX,
  Heart, PhoneCall, MapPin
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const { staff, departments, shifts, getStaffName, getDepartmentName } = useData();

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const activeStaff = staff.filter(s => s.status === 'active');
  const doctors = staff.filter(s => s.role === 'doctor' && s.status === 'active');
  const nurses = staff.filter(s => s.role === 'nurse' && s.status === 'active');
  const onLeave = staff.filter(s => s.status === 'on-leave');
  const inactive = staff.filter(s => s.status === 'inactive');
  const todayShifts = shifts.filter(s => s.date === today && s.status === 'scheduled');
  const weekShifts = shifts.filter(s => {
    const d = parseISO(s.date);
    return d >= weekStart && d <= weekEnd && s.status === 'scheduled';
  });
  const allScheduled = shifts.filter(s => s.status === 'scheduled');
  const allCompleted = shifts.filter(s => s.status === 'completed');
  const allCancelled = shifts.filter(s => s.status === 'cancelled');

  if (user?.role === 'admin') {
    return <AdminDashboard
      onNavigate={onNavigate}
      activeStaff={activeStaff.length}
      doctors={doctors.length}
      nurses={nurses.length}
      onLeave={onLeave.length}
      inactive={inactive.length}
      departments={departments.length}
      todayShifts={todayShifts.length}
      weekShifts={weekShifts.length}
      totalScheduled={allScheduled.length}
      totalCompleted={allCompleted.length}
      totalCancelled={allCancelled.length}
      todayShiftsList={todayShifts}
      allShifts={shifts}
      departmentsList={departments}
      staffList={staff}
      getStaffName={getStaffName}
      getDepartmentName={getDepartmentName}
    />;
  }

  if (user?.role === 'staff') {
    return <StaffDashboard
      onNavigate={onNavigate}
      staffId={user.staffId || ''}
      shifts={shifts}
      staffList={staff}
      getDepartmentName={getDepartmentName}
    />;
  }

  return <PatientDashboard onNavigate={onNavigate} />;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function AdminDashboard({ onNavigate, activeStaff, doctors, nurses, onLeave, inactive, departments, todayShifts, weekShifts, totalScheduled, totalCompleted, totalCancelled, todayShiftsList, allShifts, departmentsList, staffList, getStaffName, getDepartmentName }: {
  onNavigate: (page: string) => void;
  activeStaff: number; doctors: number; nurses: number; onLeave: number; inactive: number;
  departments: number; todayShifts: number; weekShifts: number;
  totalScheduled: number; totalCompleted: number; totalCancelled: number;
  todayShiftsList: any[]; allShifts: any[]; departmentsList: any[]; staffList: any[];
  getStaffName: (id: string) => string; getDepartmentName: (id: string) => string;
}) {
  const { user } = useAuth();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Shift type distribution
  const morningCount = todayShiftsList.filter((s: any) => s.shiftType === 'morning').length;
  const afternoonCount = todayShiftsList.filter((s: any) => s.shiftType === 'afternoon').length;
  const nightCount = todayShiftsList.filter((s: any) => s.shiftType === 'night').length;

  // Department breakdown for today
  const deptBreakdown = departmentsList.map((dept: any) => {
    const count = todayShiftsList.filter((s: any) => s.departmentId === dept.id).length;
    const deptStaffCount = staffList.filter((s: any) => s.departmentId === dept.id && s.status === 'active').length;
    return { ...dept, shiftCount: count, staffCount: deptStaffCount };
  }).filter((d: any) => d.shiftCount > 0 || d.staffCount > 0);

  // Next upcoming shift
  const now = new Date();
  const currentHour = format(now, 'HH:mm');
  const nextShifts = todayShiftsList
    .filter((s: any) => s.startTime > currentHour)
    .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const nextShift = nextShifts[0] || null;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-32 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute left-1/2 top-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back, {user?.name || 'Administrator'} </h1>
              <p className="text-blue-200 text-sm lg:text-base">Here's your medSchedule duty overview for today.</p>
              <p className="text-blue-300 text-sm mt-2 font-medium">
                📅 {format(now, 'EEEE, MMMM dd, yyyy')} · Week {format(weekStart, 'MMM dd')} – {format(addDays(weekStart, 6), 'MMM dd')}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Panel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={Users} label="Active Staff" value={activeStaff} color="text-blue-600" bgColor="bg-blue-50" iconBg="bg-blue-100" subtext={`${doctors} doctors, ${nurses} nurses`} trend={`${onLeave} on leave`} />
        <StatCard icon={Building2} label="Departments" value={departments} color="text-purple-600" bgColor="bg-purple-50" iconBg="bg-purple-100" subtext="All operational" />
        <StatCard icon={Clock} label="Today's Shifts" value={todayShifts} color="text-teal-600" bgColor="bg-teal-50" iconBg="bg-teal-100" subtext={`${morningCount}M · ${afternoonCount}A · ${nightCount}N`} />
        <StatCard icon={CalendarDays} label="This Week" value={weekShifts} color="text-amber-600" bgColor="bg-amber-50" iconBg="bg-amber-100" subtext="Scheduled shifts" />
      </div>

      {/* Schedule Lifecycle Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{totalCompleted}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{totalScheduled}</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{totalCancelled}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule - Main panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shift Type Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" /> Today's Shift Distribution
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{format(new Date(), 'EEEE, MMMM dd')}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <Sunrise className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700">{morningCount}</p>
                  <p className="text-xs font-medium text-amber-600">Morning</p>
                  <p className="text-[10px] text-amber-400">07:00–13:00</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <Sun className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{afternoonCount}</p>
                  <p className="text-xs font-medium text-blue-600">Afternoon</p>
                  <p className="text-[10px] text-blue-400">13:00–19:00</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <Moon className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-indigo-700">{nightCount}</p>
                  <p className="text-xs font-medium text-indigo-600">Night</p>
                  <p className="text-[10px] text-indigo-400">19:00–07:00</p>
                </div>
              </div>
              {/* Visual bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {todayShifts > 0 && (
                  <>
                    <div className="bg-amber-400 h-full" style={{ width: `${(morningCount / todayShifts) * 100}%` }} />
                    <div className="bg-blue-400 h-full" style={{ width: `${(afternoonCount / todayShifts) * 100}%` }} />
                    <div className="bg-indigo-400 h-full" style={{ width: `${(nightCount / todayShifts) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Today's Detailed Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Today's Duty Roster</h3>
                <p className="text-xs text-gray-500">{todayShiftsList.length} staff on duty</p>
              </div>
              <button onClick={() => onNavigate('shifts')} className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                Manage Shifts <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {todayShiftsList.map((shift: any) => {
                const shiftColors: Record<string, string> = {
                  morning: 'bg-amber-100 text-amber-800',
                  afternoon: 'bg-blue-100 text-blue-800',
                  night: 'bg-indigo-100 text-indigo-800',
                };
                const isNext = nextShift && shift.id === nextShift.id;
                const staffMember = staffList.find((s: any) => s.id === shift.staffId);
                return (
                  <div key={shift.id} className={`px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors ${isNext ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize whitespace-nowrap ${shiftColors[shift.shiftType]}`}>
                      {shift.shiftType}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getStaffName(shift.staffId)}
                        </p>
                        {isNext && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">NEXT</span>}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${staffMember?.role === 'doctor' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                          {staffMember?.role === 'doctor' ? 'DR' : 'RN'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{getDepartmentName(shift.departmentId)}</p>
                      {shift.notes && <p className="text-[11px] text-gray-400 italic truncate mt-0.5">💬 {shift.notes}</p>}
                    </div>
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">{shift.startTime} – {shift.endTime}</span>
                  </div>
                );
              })}
              {todayShiftsList.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No shifts scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Next Up */}
          {nextShift && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <h3 className="font-semibold text-blue-900 text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Next Shift Starting
              </h3>
              <p className="text-lg font-bold text-gray-900">{getStaffName(nextShift.staffId)}</p>
              <p className="text-sm text-gray-600">{getDepartmentName(nextShift.departmentId)}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold capitalize">{nextShift.shiftType}</span>
                <span className="text-sm text-gray-700 font-mono">{nextShift.startTime} – {nextShift.endTime}</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Add Staff Member', icon: UserCheck, page: 'staff', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
                { label: 'Assign Shifts', icon: CalendarDays, page: 'shifts', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
                { label: 'Manage Departments', icon: Building2, page: 'departments', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
                { label: 'Full Schedule View', icon: Clock, page: 'schedule', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
              ].map(action => (
                <button
                  key={action.page}
                  onClick={() => onNavigate(action.page)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${action.color}`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Department Activity Today</h3>
            <div className="space-y-2.5">
              {deptBreakdown.map((dept: any) => (
                <div key={dept.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 truncate">{dept.name}</span>
                      <span className="text-xs text-gray-400">{dept.shiftCount} shifts</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-full rounded-full transition-all" style={{ backgroundColor: dept.color, width: `${Math.max((dept.shiftCount / Math.max(todayShiftsList.length, 1)) * 100, 4)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Week Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" /> Week at a Glance
            </h3>
            <div className="space-y-1.5">
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayCount = allShifts.filter((s: any) => s.date === dateStr && s.status === 'scheduled').length;
                const isTodayDate = isToday(day);
                const maxShifts = Math.max(...weekDays.map(d => allShifts.filter((s: any) => s.date === format(d, 'yyyy-MM-dd') && s.status === 'scheduled').length), 1);
                return (
                  <div key={dateStr} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg ${isTodayDate ? 'bg-blue-50 border border-blue-200' : ''}`}>
                    <span className={`text-xs font-bold w-8 ${isTodayDate ? 'text-blue-700' : 'text-gray-500'}`}>
                      {format(day, 'EEE')}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isTodayDate ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${(dayCount / maxShifts) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-mono w-10 text-right ${isTodayDate ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                      {dayCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Status Summary */}
          {(onLeave > 0 || inactive > 0) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <UserX className="w-4 h-4 text-gray-400" /> Staff Availability
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                  <span className="font-bold text-green-700">{doctors + nurses}</span>
                </div>
                {onLeave > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> On Leave</span>
                    <span className="font-bold text-amber-700">{onLeave}</span>
                  </div>
                )}
                {inactive > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5"><UserX className="w-3.5 h-3.5" /> Inactive</span>
                    <span className="font-bold text-gray-500">{inactive}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAFF DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function StaffDashboard({ onNavigate, staffId, shifts, staffList, getDepartmentName }: {
  onNavigate: (page: string) => void;
  staffId: string;
  shifts: any[];
  staffList: any[];
  getDepartmentName: (id: string) => string;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const myShifts = shifts.filter(s => s.staffId === staffId && s.status === 'scheduled');
  const todayMyShifts = myShifts.filter(s => s.date === today);
  const upcomingShifts = myShifts.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  const completedShifts = shifts.filter(s => s.staffId === staffId && s.status === 'completed');
  const profile = staffList.find(s => s.id === staffId);

  const morningShifts = myShifts.filter(s => s.shiftType === 'morning').length;
  const afternoonShifts = myShifts.filter(s => s.shiftType === 'afternoon').length;
  const nightShifts = myShifts.filter(s => s.shiftType === 'night').length;
  const totalShifts = myShifts.length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back, {profile?.firstName || 'Staff'}</h1>
          <p className="text-teal-200">{profile?.specialization || ''} · {getDepartmentName(profile?.departmentId || '')}</p>
          <p className="text-teal-300 text-sm mt-2">📅 {format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CalendarDays} label="Upcoming" value={myShifts.length} color="text-blue-600" bgColor="bg-blue-50" iconBg="bg-blue-100" />
        <StatCard icon={Clock} label="Today" value={todayMyShifts.length} color="text-teal-600" bgColor="bg-teal-50" iconBg="bg-teal-100" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedShifts.length} color="text-green-600" bgColor="bg-green-50" iconBg="bg-green-100" />
        <StatCard icon={TrendingUp} label="This Week" value={myShifts.filter(s => {
          const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
          const we = addDays(ws, 6);
          const d = parseISO(s.date);
          return d >= ws && d <= we;
        }).length} color="text-amber-600" bgColor="bg-amber-50" iconBg="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Shifts */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upcoming Shifts</h3>
            <button onClick={() => onNavigate('my-shifts')} className="text-teal-600 text-sm font-medium hover:text-teal-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingShifts.map(shift => {
              const shiftColors: Record<string, string> = { morning: 'bg-amber-100 text-amber-800', afternoon: 'bg-blue-100 text-blue-800', night: 'bg-indigo-100 text-indigo-800' };
              const isToday = shift.date === today;
              return (
                <div key={shift.id} className={`px-6 py-4 flex items-center gap-4 ${isToday ? 'bg-teal-50/30' : ''}`}>
                  <div className={`text-center min-w-[56px] p-2 rounded-xl ${isToday ? 'bg-teal-100' : 'bg-gray-50'}`}>
                    <p className={`text-[10px] uppercase font-bold ${isToday ? 'text-teal-600' : 'text-gray-400'}`}>{format(parseISO(shift.date), 'EEE')}</p>
                    <p className={`text-xl font-bold ${isToday ? 'text-teal-700' : 'text-gray-900'}`}>{format(parseISO(shift.date), 'dd')}</p>
                    <p className="text-[10px] text-gray-400">{format(parseISO(shift.date), 'MMM')}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200" />
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold capitalize mb-1 ${shiftColors[shift.shiftType]}`}>
                      {shift.shiftType} Shift
                    </span>
                    <p className="text-sm text-gray-600 font-medium">{shift.startTime} – {shift.endTime}</p>
                    <p className="text-xs text-gray-400">{getDepartmentName(shift.departmentId)}</p>
                    {shift.notes && <p className="text-[11px] text-gray-400 italic mt-0.5">💬 {shift.notes}</p>}
                  </div>
                  {isToday && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white">TODAY</span>}
                </div>
              );
            })}
            {upcomingShifts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">No upcoming shifts</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">My Shift Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'Morning', icon: Sunrise, count: morningShifts, color: 'bg-amber-500', textColor: 'text-amber-700' },
                { label: 'Afternoon', icon: Sun, count: afternoonShifts, color: 'bg-blue-500', textColor: 'text-blue-700' },
                { label: 'Night', icon: Moon, count: nightShifts, color: 'bg-indigo-500', textColor: 'text-indigo-700' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className={`flex items-center gap-1.5 font-medium ${item.textColor}`}>
                      <item.icon className="w-4 h-4" /> {item.label}
                    </span>
                    <span className="font-bold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${totalShifts > 0 ? (item.count / totalShifts) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => onNavigate('my-shifts')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-teal-50 text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors border border-teal-200">
                <CalendarDays className="w-4 h-4" /> View All My Shifts
              </button>
              <button onClick={() => onNavigate('staff-profile')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                <UserCheck className="w-4 h-4" /> Update Profile
              </button>
              <button onClick={() => onNavigate('schedule')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200">
                <Clock className="w-4 h-4" /> Full Schedule View
              </button>
            </div>
          </div>

          {/* Today's Shifts detail */}
          {todayMyShifts.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200">
              <h3 className="font-semibold text-teal-900 mb-3 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Your Shifts Today
              </h3>
              <div className="space-y-2">
                {todayMyShifts.map(s => (
                  <div key={s.id} className="bg-white/80 rounded-xl p-3 flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${s.shiftType === 'morning' ? 'bg-amber-100 text-amber-700' : s.shiftType === 'afternoon' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {s.shiftType}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.startTime} – {s.endTime}</p>
                      {s.notes && <p className="text-[11px] text-gray-500 italic">💬 {s.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PATIENT DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function PatientDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { departments, shifts, staff, getStaffName, addToast } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayScheduled = shifts.filter(s => s.date === today && s.status === 'scheduled');
  const todayDoctorsOnDuty = [...new Set(todayScheduled.filter(s => {
    const st = staff.find(ss => ss.id === s.staffId);
    return st?.role === 'doctor';
  }).map(s => s.staffId))];
  const todayNursesOnDuty = [...new Set(todayScheduled.filter(s => {
    const st = staff.find(ss => ss.id === s.staffId);
    return st?.role === 'nurse';
  }).map(s => s.staffId))];

  // Departments with today's shift count
  const deptsToday = departments.map(dept => ({
    ...dept,
    shiftCount: todayScheduled.filter(s => s.departmentId === dept.id).length,
    doctorsOnDuty: todayDoctorsOnDuty.filter(id => staff.find(s => s.id === id)?.departmentId === dept.id).length,
  })).filter(d => d.shiftCount > 0);

  // Currently on duty (shift where start time <= now and end time > now)
  const now = format(new Date(), 'HH:mm');
  const currentlyOnDuty = todayScheduled.filter(s => s.startTime <= now && s.endTime > now);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-violet-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome to medSchedule</h1>
          <p className="text-purple-200">Find available doctors and nurses. View today's duty schedule.</p>
          <p className="text-purple-300 text-sm mt-2 font-medium">📅 {format(new Date(), 'EEEE, MMMM dd, yyyy')} · {currentlyOnDuty.length} staff currently on duty</p>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Stethoscope} label="Doctors Available" value={todayDoctorsOnDuty.length} color="text-blue-600" bgColor="bg-blue-50" iconBg="bg-blue-100" subtext="On duty today" />
        <StatCard icon={Heart} label="Nurses Available" value={todayNursesOnDuty.length} color="text-teal-600" bgColor="bg-teal-50" iconBg="bg-teal-100" subtext="On duty today" />
        <StatCard icon={Building2} label="Active Departments" value={deptsToday.length} color="text-purple-600" bgColor="bg-purple-50" iconBg="bg-purple-100" />
        <StatCard icon={Clock} label="Currently On Duty" value={currentlyOnDuty.length} color="text-amber-600" bgColor="bg-amber-50" iconBg="bg-amber-100" subtext="Right now" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments with today's schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" /> Departments Today
            </h3>
            <button onClick={() => onNavigate('view-schedule')} className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1">
              Full Schedule <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {deptsToday.map(dept => (
              <div key={dept.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: dept.color + '20' }}>
                  <Building2 className="w-5 h-5" style={{ color: dept.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                  <p className="text-xs text-gray-500">{dept.headDoctor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{dept.shiftCount}</p>
                  <p className="text-[10px] text-gray-400">shifts</p>
                </div>
              </div>
            ))}
            {deptsToday.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No departments with shifts today</div>
            )}
          </div>
        </div>

        {/* Currently On Duty */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" /> Currently On Duty
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{currentlyOnDuty.length} staff members on shift right now</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {currentlyOnDuty.map(shift => {
              const staffMember = staff.find(s => s.id === shift.staffId);
              return (
                <div key={shift.id} className="px-6 py-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${staffMember?.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                    {staffMember?.role === 'doctor' ? 'DR' : 'RN'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{getStaffName(shift.staffId)}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${shift.shiftType === 'morning' ? 'bg-amber-100 text-amber-700' : shift.shiftType === 'afternoon' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {shift.shiftType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{staffMember?.specialization}</p>
                    <p className="text-[11px] text-gray-400">{shift.startTime} – {shift.endTime} · {departments.find(d => d.id === shift.departmentId)?.name}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (staffMember?.phone) {
                        navigator.clipboard.writeText(staffMember.phone);
                        addToast(`Copied ${staffMember.phone} to clipboard`, 'success');
                      } else {
                        addToast('No phone number available', 'error');
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Available now"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {currentlyOnDuty.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No staff currently on duty</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'View Full Schedule', desc: 'Browse schedules by date, department, or shift type', icon: CalendarDays, page: 'view-schedule', color: 'from-purple-500 to-violet-600' },
          { label: 'Find a Doctor', desc: 'Search for doctors and see their availability', icon: Stethoscope, page: 'find-doctor', color: 'from-teal-500 to-emerald-600' },
          { label: 'Hospital Info', desc: 'Department details and contact information', icon: MapPin, page: 'view-schedule', color: 'from-blue-500 to-cyan-600' },
        ].map(action => (
          <button key={action.page + action.label} onClick={() => onNavigate(action.page)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all text-left group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{action.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, color, bgColor, iconBg, subtext, trend }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bgColor: string; iconBg: string; subtext?: string; trend?: string;
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-5 border border-transparent hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
          {subtext && <p className="text-[11px] text-gray-400 mt-1">{subtext}</p>}
          {trend && <p className="text-[11px] text-amber-600 mt-1">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}
