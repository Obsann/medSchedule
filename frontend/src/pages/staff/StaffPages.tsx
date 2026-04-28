import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { CalendarDays, Clock, User, Save, MapPin, Phone, Mail } from 'lucide-react';

export function MyShifts() {
  const { user } = useAuth();
  const { shifts, getDepartmentName } = useData();
  const staffId = user?.staffId || '';
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus] = useState<string>('all');

  const myShifts = shifts
    .filter(s => s.staffId === staffId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const filteredShifts = filterStatus === 'all' ? myShifts : myShifts.filter(s => s.status === filterStatus);
  const upcoming = filteredShifts.filter(s => s.date >= format(new Date(), 'yyyy-MM-dd') && s.status === 'scheduled');
  const past = filteredShifts.filter(s => s.date < format(new Date(), 'yyyy-MM-dd'));

  const shiftColors: Record<string, { bg: string; text: string }> = {
    morning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    afternoon: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    night: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
          <p className="text-sm text-gray-500 mt-1">View your assigned duty shifts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'list' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            List View
          </button>
          <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'calendar' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Calendar View
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', value: upcoming.length, color: 'text-blue-600' },
          { label: 'Morning', value: myShifts.filter(s => s.shiftType === 'morning').length, color: 'text-amber-600' },
          { label: 'Afternoon', value: myShifts.filter(s => s.shiftType === 'afternoon').length, color: 'text-blue-600' },
          { label: 'Night', value: myShifts.filter(s => s.shiftType === 'night').length, color: 'text-indigo-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Shifts</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {upcoming.map(shift => {
                    const colors = shiftColors[shift.shiftType];
                    return (
                      <div key={shift.id} className={`px-6 py-4 flex items-center gap-4 border-l-4 ${colors.bg}`}>
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-gray-400 uppercase">{format(parseISO(shift.date), 'EEE')}</p>
                          <p className="text-xl font-bold text-gray-900">{format(parseISO(shift.date), 'dd')}</p>
                          <p className="text-xs text-gray-500">{format(parseISO(shift.date), 'MMM yyyy')}</p>
                        </div>
                        <div className="w-px h-14 bg-gray-200" />
                        <div className="flex-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold capitalize mb-1 ${colors.text}`}>
                            {shift.shiftType} Shift
                          </span>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {shift.startTime} - {shift.endTime}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {getDepartmentName(shift.departmentId)}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          shift.status === 'scheduled' ? 'bg-green-50 text-green-700' :
                          shift.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {shift.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Past Shifts</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {past.slice(-10).reverse().map(shift => (
                    <div key={shift.id} className="px-6 py-3 flex items-center gap-4 opacity-60">
                      <span className="text-xs text-gray-400 w-20">{format(parseISO(shift.date), 'MMM dd, EEE')}</span>
                      <span className="text-xs text-gray-500 capitalize">{shift.shiftType}</span>
                      <span className="text-xs text-gray-400">{shift.startTime}-{shift.endTime}</span>
                      <span className="text-xs text-gray-300 ml-auto">Completed</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No shifts assigned</h3>
              <p className="text-sm text-gray-500 mt-1">You don't have any shifts scheduled yet.</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <CalendarView shifts={upcoming} />
      )}
    </div>
  );
}

function CalendarView({ shifts }: { shifts: any[] }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

  const shiftColors: Record<string, string> = {
    morning: 'bg-amber-200 border-amber-400',
    afternoon: 'bg-blue-200 border-blue-400',
    night: 'bg-indigo-200 border-indigo-400',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 text-xs text-gray-500 font-medium border-r border-gray-200">Time</div>
            {weekDays.map(day => {
              const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              return (
                <div key={day.toISOString()} className={`p-3 text-center border-r border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{format(day, 'EEE')}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>{format(day, 'dd')}</p>
                </div>
              );
            })}
          </div>
          {/* Time slots */}
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[40px]">
              <div className="p-2 text-xs text-gray-400 font-mono border-r border-gray-200 flex items-start">{hour}</div>
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hourShifts = shifts.filter(s => s.date === dateStr && s.startTime <= hour && s.endTime > hour);
                return (
                  <div key={day.toISOString() + hour} className="p-1 border-r border-gray-50 relative">
                    {hourShifts.map(s => (
                      <div key={s.id} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${shiftColors[s.shiftType]}`}>
                        {s.shiftType}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { staff, departments, updateStaff } = useData();
  const staffId = user?.staffId || '';
  const profile = staff.find(s => s.id === staffId);

  const [form, setForm] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    specialization: profile?.specialization || '',
  });
  const [saved, setSaved] = useState(false);

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No profile linked</h3>
        <p className="text-sm text-gray-500 mt-1">Your account is not linked to a staff profile.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStaff({ ...profile, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const dept = departments.find(d => d.id === profile.departmentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and update your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className={`w-24 h-24 rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold text-white ${profile.role === 'doctor' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'}`}>
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">
            {profile.role === 'doctor' ? 'Dr. ' : ''}{profile.firstName} {profile.lastName}
          </h2>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${profile.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
            {profile.role === 'doctor' ? 'Doctor' : 'Nurse'}
          </span>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-left">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> {dept?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> {profile.email}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" /> {profile.phone}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Information</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input required value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
            </div>
            <div className="pt-2">
              <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors">
                <Save className="w-5 h-5" /> {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
