import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Department } from '../../types';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';

export default function DepartmentManagement() {
  const { departments, staff, addDepartment, updateDepartment, deleteDepartment } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', headDoctor: '', color: '#3B82F6' });

  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4'];

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', headDoctor: '', color: colors[Math.floor(Math.random() * colors.length)] });
    setShowModal(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description, headDoctor: d.headDoctor, color: d.color });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateDepartment({ ...editing, ...form });
      } else {
        await addDepartment(form);
      }
      setShowModal(false);
    } catch {
      // error toast already shown
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDepartment(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hospital departments and their information</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptStaff = staff.filter(s => s.departmentId === dept.id && s.status === 'active');
          const doctors = deptStaff.filter(s => s.role === 'doctor').length;
          const nurses = deptStaff.filter(s => s.role === 'nurse').length;

          return (
            <div key={dept.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-2" style={{ backgroundColor: dept.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: dept.color + '20' }}>
                      <Building2 className="w-6 h-6" style={{ color: dept.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{dept.name}</h3>
                      <p className="text-xs text-gray-500">{dept.headDoctor}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(dept.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{dept.description}</p>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{doctors}</p>
                    <p className="text-xs text-gray-500">Doctors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{nurses}</p>
                    <p className="text-xs text-gray-500">Nurses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{doctors + nurses}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>

                {deleteConfirm === dept.id && (
                  <div className="mt-4 pt-4 border-t border-red-100 bg-red-50 -mx-6 -mb-6 px-6 py-3 rounded-b-2xl">
                    <p className="text-sm text-red-700 mb-2">Delete this department?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(dept.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-medium border border-gray-200">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g., Cardiology" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" rows={3} placeholder="Brief description of the department" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head Doctor</label>
                <input required value={form.headDoctor} onChange={e => setForm({ ...form, headDoctor: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g., Dr. John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">
                  {editing ? 'Save Changes' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
