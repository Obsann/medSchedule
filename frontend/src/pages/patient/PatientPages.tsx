import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { Search, CalendarDays, Clock, Building2, Stethoscope, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export function PatientScheduleViewer() {
  const { shifts, staff, departments } = useData();
  const [filterDept, setFilterDept] = useState('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const shiftColors: Record<string, { bg: string; text: string; border: string }> = {
    morning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    afternoon: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    night: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  };

  const filteredShifts = shifts.filter(s => {
    if (s.status === 'cancelled') return false;
    if (filterDept !== 'all' && s.departmentId !== filterDept) return false;
    if (filterType !== 'all' && s.shiftType !== filterType) return false;
    if (viewMode === 'day' && s.date !== selectedDate) return false;
    if (viewMode === 'week') {
      const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
      const we = addDays(ws, 6);
      const d = parseISO(s.date);
      if (d < ws || d > we) return false;
    }
    return true;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const adjustDate = (days: number) => {
    const d = parseISO(selectedDate);
    setSelectedDate(format(addDays(d, days), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">View Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Browse duty schedules to find available doctors and nurses</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {viewMode === 'day' && (
            <div className="flex items-center gap-2">
              <button onClick={() => adjustDate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button onClick={() => adjustDate(1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
              {selectedDate !== format(new Date(), 'yyyy-MM-dd') && (
                <button onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))} className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100">Today</button>
              )}
            </div>
          )}
          <div className="flex gap-2 flex-wrap flex-1">
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white">
              <option value="all">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="night">Night</option>
            </select>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode('day')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'day' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Day</button>
              <button onClick={() => setViewMode('week')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'week' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Week</button>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { type: 'morning', label: 'Morning (07:00-13:00)' },
          { type: 'afternoon', label: 'Afternoon (13:00-19:00)' },
          { type: 'night', label: 'Night (19:00-07:00)' },
        ].map(s => (
          <div key={s.type} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${shiftColors[s.type].bg} ${shiftColors[s.type].border}`}>
            <Clock className={`w-4 h-4 ${shiftColors[s.type].text}`} />
            <span className={`text-xs font-medium ${shiftColors[s.type].text}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Schedule Content */}
      {viewMode === 'day' ? (
        <DayView shifts={filteredShifts} staff={staff} departments={departments} selectedDate={selectedDate} shiftColors={shiftColors} />
      ) : (
        <WeekView shifts={filteredShifts} staff={staff} shiftColors={shiftColors} />
      )}

      {filteredShifts.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No schedules found</h3>
          <p className="text-sm text-gray-500 mt-1">Try selecting a different date or adjusting filters</p>
        </div>
      )}
    </div>
  );
}

function DayView({ shifts, staff, departments, selectedDate, shiftColors }: any) {
  const grouped = shifts.reduce((acc: any, shift: any) => {
    const dept = departments.find((d: any) => d.id === shift.departmentId);
    const key = dept?.id || 'other';
    if (!acc[key]) acc[key] = { department: dept, shifts: [] };
    acc[key].shifts.push(shift);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}
        <span className="text-sm text-gray-500 font-normal ml-2">({shifts.length} shifts)</span>
      </h2>
      {Object.values(grouped).map(({ department, shifts: deptShifts }: any) => (
        <div key={department?.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: department?.color || '#6B7280' }} />
            <h3 className="font-semibold text-gray-900">{department?.name || 'Unknown'}</h3>
            <span className="text-xs text-gray-500">({deptShifts.length} shifts)</span>
          </div>
          <div className="divide-y divide-gray-50">
            {deptShifts.map((shift: any) => {
              const s = staff.find((st: any) => st.id === shift.staffId);
              const colors = shiftColors[shift.shiftType];
              return (
                <div key={shift.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {shift.shiftType}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {s?.role === 'doctor' ? 'Dr. ' : ''}{s?.firstName} {s?.lastName}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${s?.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                        {s?.role}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{s?.specialization}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-700">{shift.startTime} - {shift.endTime}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekView({ shifts, staff, shiftColors }: any) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayShifts = shifts.filter((s: any) => s.date === dateStr);
        const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

        return (
          <div key={dateStr} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'} overflow-hidden`}>
            <div className={`px-4 py-3 ${isToday ? 'bg-purple-50' : 'bg-gray-50'} border-b border-gray-100 text-center`}>
              <p className={`text-xs font-medium uppercase ${isToday ? 'text-purple-600' : 'text-gray-400'}`}>{format(day, 'EEE')}</p>
              <p className={`text-lg font-bold ${isToday ? 'text-purple-700' : 'text-gray-900'}`}>{format(day, 'dd')}</p>
            </div>
            <div className="p-2 space-y-1.5 min-h-[150px]">
              {dayShifts.map((shift: any) => {
                const s = staff.find((st: any) => st.id === shift.staffId);
                const colors = shiftColors[shift.shiftType];
                return (
                  <div key={shift.id} className={`p-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <span className={`text-[10px] font-bold capitalize ${colors.text}`}>{shift.shiftType}</span>
                    <p className="text-xs font-medium text-gray-800 truncate mt-0.5">
                      {s?.role === 'doctor' ? 'Dr. ' : ''}{s?.firstName} {s?.lastName}
                    </p>
                    <p className="text-[10px] text-gray-500">{shift.startTime}-{shift.endTime}</p>
                  </div>
                );
              })}
              {dayShifts.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const simpleShiftColors: Record<string, string> = {
  morning: 'bg-amber-100 text-amber-800',
  afternoon: 'bg-blue-100 text-blue-800',
  night: 'bg-indigo-100 text-indigo-800',
};

export function FindDoctor() {
  const { staff, departments, shifts } = useData();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const filteredStaff = staff.filter(s => {
    if (s.status !== 'active') return false;
    if (filterDept !== 'all' && s.departmentId !== filterDept) return false;
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${s.firstName} ${s.lastName} ${s.specialization}`.toLowerCase().includes(q);
    }
    return true;
  });

  const selected = selectedStaff ? staff.find(s => s.id === selectedStaff) : null;
  const selectedShifts = selectedStaff
    ? shifts.filter(s => s.staffId === selectedStaff && s.date >= format(new Date(), 'yyyy-MM-dd') && s.status === 'scheduled')
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';
  const getDeptColor = (id: string) => departments.find(d => d.id === id)?.color || '#6B7280';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-sm text-gray-500 mt-1">Search for doctors and nurses, view their upcoming schedules</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or specialization..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
            />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="all">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="nurse">Nurses</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff list */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredStaff.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStaff(s.id === selectedStaff ? null : s.id)}
                className={`bg-white rounded-2xl p-5 text-left transition-all border ${
                  selectedStaff === s.id ? 'border-teal-300 ring-2 ring-teal-100 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.role === 'doctor' ? 'bg-blue-100' : 'bg-teal-100'}`}>
                    <Stethoscope className={`w-6 h-6 ${s.role === 'doctor' ? 'text-blue-600' : 'text-teal-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{s.role === 'doctor' ? 'Dr. ' : ''}{s.firstName} {s.lastName}</h3>
                    <p className="text-xs text-gray-500">{s.specialization}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span style={{ color: getDeptColor(s.departmentId) }}>{getDeptName(s.departmentId)}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.role === 'doctor' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'}`}>
                    {s.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {filteredStaff.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No staff found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Selected staff detail */}
        <div>
          {selected ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className={`p-6 ${selected.role === 'doctor' ? 'bg-gradient-to-r from-blue-50 to-blue-100' : 'bg-gradient-to-r from-teal-50 to-teal-100'}`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold text-white ${selected.role === 'doctor' ? 'bg-blue-500' : 'bg-teal-500'}`}>
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mt-3">
                  {selected.role === 'doctor' ? 'Dr. ' : ''}{selected.firstName} {selected.lastName}
                </h3>
                <p className="text-sm text-gray-600 text-center">{selected.specialization}</p>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" /> {getDeptName(selected.departmentId)}
                </p>
                <p className="text-sm text-gray-600">📧 {selected.email}</p>
                <p className="text-sm text-gray-600">📞 {selected.phone}</p>
              </div>
              <div className="border-t border-gray-100 p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Upcoming Shifts</h4>
                {selectedShifts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedShifts.slice(0, 7).map(shift => (
                      <div key={shift.id} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-gray-400 w-16">{format(parseISO(shift.date), 'MMM dd')}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${simpleShiftColors[shift.shiftType]}`}>
                          {shift.shiftType}
                        </span>
                        <span className="text-xs text-gray-500">{shift.startTime}-{shift.endTime}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No upcoming shifts</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center sticky top-24">
              <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a staff member to view their details and upcoming schedule</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
