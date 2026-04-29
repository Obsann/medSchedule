import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Staff, StaffRole } from '../../types';
import { Search, Plus, Edit2, Trash2, X, UserCheck, Stethoscope, Filter, Eye, EyeOff } from 'lucide-react';
import { validateEthiopianPhone } from '../../utils/phoneValidation';

export default function StaffManagement() {
  const { staff, departments, addStaff, updateStaff, deleteStaff } = useData();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<StaffRole | 'all'>('all');
  const [filterDept, setFilterDept] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    role: 'doctor' as StaffRole, departmentId: '', specialization: '', status: 'active' as 'active' | 'on-leave' | 'inactive',
  });
  const [showPassword, setShowPassword] = useState(false);

  const filteredStaff = staff.filter(s => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.email} ${s.specialization}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    const matchesDept = filterDept === 'all' || s.departmentId === filterDept;
    return matchesSearch && matchesRole && matchesDept;
  });

  const openAdd = () => {
    setEditingStaff(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'doctor', departmentId: departments[0]?.id || '', specialization: '', status: 'active' });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (s: Staff) => {
    setEditingStaff(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, email: s.email, phone: s.phone, role: s.role, departmentId: s.departmentId, specialization: s.specialization, status: s.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.phone) {
      const phoneVal = validateEthiopianPhone(form.phone);
      if (!phoneVal.valid) {
        // Since error toast is handled by DataContext typically, we could just alert for now
        // or add addToast from useData
        alert(phoneVal.error || 'Invalid phone format');
        return;
      }
    }

    try {
      if (editingStaff) {
        const { password, ...updateData } = form;
        await updateStaff({ ...editingStaff, ...updateData });
      } else {
        await addStaff(form as any);
      }
      setShowModal(false);
    } catch {
      // error toast already shown by DataContext
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStaff(id);
    setDeleteConfirm(null);
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';
  const getDeptColor = (id: string) => departments.find(d => d.id === id)?.color || '#6B7280';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctors and nurses across all departments</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff by name, email, or specialization..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)} className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
              </select>
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Staff count */}
      <p className="text-sm text-gray-500">{filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} found</p>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStaff.map(s => (
          <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.role === 'doctor' ? 'bg-blue-100' : 'bg-teal-100'}`}>
                  {s.role === 'doctor' ? <Stethoscope className="w-6 h-6 text-blue-600" /> : <UserCheck className="w-6 h-6 text-teal-600" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.role === 'doctor' ? 'Dr. ' : ''}{s.firstName} {s.lastName}</h3>
                  <p className="text-xs text-gray-500">{s.specialization}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getDeptColor(s.departmentId) }} />
                <span className="text-sm text-gray-600">{getDeptName(s.departmentId)}</span>
              </div>
              <p className="text-xs text-gray-400">{s.email}</p>
              <p className="text-xs text-gray-400">{s.phone}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                s.role === 'doctor' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
              }`}>
                {s.role === 'doctor' ? 'Doctor' : 'Nurse'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                s.status === 'active' ? 'bg-green-50 text-green-700' :
                s.status === 'on-leave' ? 'bg-amber-50 text-amber-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                {s.status === 'on-leave' ? 'On Leave' : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
              </span>
            </div>

            {/* Delete confirmation */}
            {deleteConfirm === s.id && (
              <div className="mt-3 pt-3 border-t border-red-100 bg-red-50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                <p className="text-sm text-red-700 mb-2">Remove this staff member?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Confirm</button>
                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No staff found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      minLength={6}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Staff will use this password with their email to log in</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffRole })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select required value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input required value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g., Cardiology, Emergency Nursing" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">
                  {editingStaff ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
