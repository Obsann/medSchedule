import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { ShiftType, Shift } from '../../types';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Clock, AlertTriangle } from 'lucide-react';

const SHIFT_TYPES: { type: ShiftType; start: string; end: string; label: string; color: string; bgColor: string }[] = [
  { type: 'morning', start: '07:00', end: '13:00', label: 'Morning', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { type: 'afternoon', start: '13:00', end: '19:00', label: 'Afternoon', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { type: 'night', start: '19:00', end: '07:00', label: 'Night', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
];

export default function ShiftManagement() {
  const { staff, departments, shifts, addShift, deleteShift } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDept, setSelectedDept] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({
    staffId: '', shiftType: 'morning' as ShiftType, date: '', notes: '',
  });

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredStaff = staff.filter(s => {
    if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
    return s.status === 'active';
  });

  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => {
      if (s.date !== dateStr || s.status === 'cancelled') return false;
      if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
      return true;
    });
  };

  const openAddShift = (date: string) => {
    setSelectedDate(date);
    setForm({ staffId: filteredStaff[0]?.id || '', shiftType: 'morning', date, notes: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shiftConfig = SHIFT_TYPES.find(t => t.type === form.shiftType)!;
    const staffMember = staff.find(s => s.id === form.staffId);
    if (!staffMember) return;

    const success = await addShift({
      staffId: form.staffId,
      date: form.date,
      startTime: shiftConfig.start,
      endTime: shiftConfig.end,
      shiftType: form.shiftType,
      departmentId: staffMember.departmentId,
      status: 'scheduled',
      notes: form.notes,
    });
    if (success) setShowModal(false);
  };

  const handleDeleteShift = async (shift: Shift) => {
    await deleteShift(shift.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Assignment</h1>
          <p className="text-sm text-gray-500 mt-1">Assign and manage weekly duty shifts for staff</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-gray-900 min-w-[200px] text-center">
              {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                Today
              </button>
            )}
          </div>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {SHIFT_TYPES.map(t => (
          <div key={t.type} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${t.bgColor}`}>
            <Clock className={`w-4 h-4 ${t.color}`} />
            <span className={`text-xs font-medium ${t.color}`}>{t.label} ({t.start}-{t.end})</span>
          </div>
        ))}
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dayShifts = getShiftsForDay(day);
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          const dateStr = format(day, 'yyyy-MM-dd');

          return (
            <div key={dateStr} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'} overflow-hidden`}>
              <div className={`px-4 py-3 ${isToday ? 'bg-blue-50' : 'bg-gray-50'} border-b border-gray-100`}>
                <p className={`text-xs font-medium uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                  {format(day, 'EEE')}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                  {format(day, 'dd')}
                </p>
                <p className="text-xs text-gray-500">{format(day, 'MMM')}</p>
              </div>

              <div className="p-2 space-y-1.5 min-h-[200px]">
                {dayShifts.map(shift => {
                  const shiftTypeConfig = SHIFT_TYPES.find(t => t.type === shift.shiftType)!;
                  const staffMember = staff.find(s => s.id === shift.staffId);
                  return (
                    <div key={shift.id} className={`group relative p-2 rounded-lg border ${shiftTypeConfig.bgColor} text-xs`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold capitalize ${shiftTypeConfig.color}`}>
                          {shift.shiftType}
                        </span>
                        <button
                          onClick={() => handleDeleteShift(shift)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-medium text-gray-800 truncate">
                        {staffMember?.role === 'doctor' ? 'Dr. ' : ''}{staffMember?.firstName} {staffMember?.lastName}
                      </p>
                      <p className="text-gray-500 mt-0.5">{shift.startTime}-{shift.endTime}</p>
                      {shift.notes && <p className="text-gray-400 mt-0.5 italic truncate">{shift.notes}</p>}
                    </div>
                  );
                })}

                <button
                  onClick={() => openAddShift(dateStr)}
                  className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Shift
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Assign Shift</h2>
                <p className="text-sm text-gray-500">{format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                <select
                  required
                  value={form.staffId}
                  onChange={e => setForm({ ...form, staffId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">Select Staff</option>
                  {filteredStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.role === 'doctor' ? 'Dr. ' : ''}{s.firstName} {s.lastName} - {departments.find(d => d.id === s.departmentId)?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {SHIFT_TYPES.map(t => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setForm({ ...form, shiftType: t.type })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        form.shiftType === t.type
                          ? `${t.bgColor} border-current`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Clock className={`w-5 h-5 mx-auto mb-1 ${form.shiftType === t.type ? t.color : 'text-gray-400'}`} />
                      <p className={`text-xs font-bold ${form.shiftType === t.type ? t.color : 'text-gray-600'}`}>{t.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t.start}-{t.end}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlap warning */}
              {form.staffId && form.shiftType && (() => {
                const existing = shifts.filter(s => s.staffId === form.staffId && s.date === selectedDate && s.status !== 'cancelled');
                const shiftConfig = SHIFT_TYPES.find(t => t.type === form.shiftType)!;
                const hasOverlap = existing.some(s => shiftConfig.start < s.endTime && shiftConfig.end > s.startTime);
                if (hasOverlap) {
                  return (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <p className="text-sm text-amber-700">This staff member already has an overlapping shift on this day.</p>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">Assign Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
