import { useState } from 'react';
import { useData } from '../context/DataContext';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Search, Filter } from 'lucide-react';

export default function ScheduleView() {
  const { shifts, staff, departments, getStaffName, getDepartmentName } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterDept, setFilterDept] = useState('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredShifts = shifts.filter(s => {
    if (s.status === 'cancelled') return false;
    const d = parseISO(s.date);
    if (d < weekStart || d > addDays(weekStart, 6)) return false;
    if (filterDept !== 'all' && s.departmentId !== filterDept) return false;
    if (filterType !== 'all' && s.shiftType !== filterType) return false;
    if (searchQuery) {
      const name = getStaffName(s.staffId).toLowerCase();
      if (!name.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const shiftColors: Record<string, { bg: string; text: string }> = {
    morning: { bg: 'bg-amber-50', text: 'text-amber-700' },
    afternoon: { bg: 'bg-blue-50', text: 'text-blue-700' },
    night: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Full Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Complete view of all scheduled shifts</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-gray-900 min-w-[200px] text-center text-sm">
              {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">Today</button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="night">Night</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">Morning: {filteredShifts.filter(s => s.shiftType === 'morning').length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Afternoon: {filteredShifts.filter(s => s.shiftType === 'afternoon').length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-medium text-indigo-700">Night: {filteredShifts.filter(s => s.shiftType === 'night').length}</span>
        </div>
        <span className="text-sm text-gray-500 self-center">Total: {filteredShifts.length} shifts</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                {weekDays.map(day => (
                  <th key={day.toISOString()} className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-sm">{format(day, 'dd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.filter(s => s.status === 'active' && (filterDept === 'all' || s.departmentId === filterDept)).map(s => {
                if (searchQuery && !`${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                if (filterDept !== 'all' && s.departmentId !== filterDept) return null;

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${s.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.role === 'doctor' ? 'Dr. ' : ''}{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500 capitalize">{s.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-600">{getDepartmentName(s.departmentId)}</span>
                    </td>
                    {weekDays.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const dayShifts = filteredShifts.filter(sh => sh.staffId === s.id && sh.date === dateStr);
                      return (
                        <td key={dateStr} className={`px-2 py-2 text-center ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50/30' : ''}`}>
                          <div className="space-y-1">
                            {dayShifts.map(sh => {
                              const colors = shiftColors[sh.shiftType];
                              return (
                                <div key={sh.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize ${colors.bg} ${colors.text}`}>
                                  {sh.shiftType}
                                  <span className="block text-[9px] font-normal">{sh.startTime}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredShifts.length === 0 && (
          <div className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No shifts found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or selecting a different week</p>
          </div>
        )}
      </div>
    </div>
  );
}
