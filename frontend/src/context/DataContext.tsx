import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Department, Staff, Shift, ToastMessage } from '../types';
import {
  staffApi, departmentsApi, shiftsApi,
  getSavedToken, decodeToken,
} from '../api';
import { useAuth } from './AuthContext';

interface DataContextType {
  departments: Department[];
  staff: Staff[];
  shifts: Shift[];
  toasts: ToastMessage[];
  isLoading: boolean;
  error: string | null;
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  // Departments
  addDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  // Staff
  addStaff: (s: Omit<Staff, 'id'> & { password?: string }) => Promise<void>;
  updateStaff: (s: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  // Shifts
  addShift: (s: Omit<Shift, 'id'>) => Promise<boolean>;
  updateShift: (s: Shift) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  getStaffName: (staffId: string) => string;
  getDepartmentName: (deptId: string) => string;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

let toastIdCounter = 0;

export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // ─── Toast helpers ────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Fetch all data from API ──────────────────────────────────────────────
  const fetchData = useCallback(async (isBackground = false) => {
    const token = getSavedToken();
    if (!token) { setIsLoading(false); return; }
    const { valid } = decodeToken(token);
    if (!valid) { setIsLoading(false); return; }

    if (!isBackground) setIsLoading(true);
    setError(null);
    try {
      const [deptRes, staffRes, shiftRes] = await Promise.all([
        departmentsApi.getAll(token),
        staffApi.getAll(token),
        shiftsApi.getAll(token),
      ]);
      if (deptRes.status === 200) setDepartments(deptRes.data);
      if (staffRes.status === 200) setStaff(staffRes.data);
      if (shiftRes.status === 200) setShifts(shiftRes.data);
      setHasFetchedInitial(true);
    } catch {
      setError('Failed to load data from server. Please refresh.');
      addToast('Network error: Could not fetch data', 'error');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [addToast]);

  // Fetch data when authenticated state changes
  useEffect(() => { 
    if (isAuthenticated) {
      fetchData(); 
    } else {
      setDepartments([]);
      setStaff([]);
      setShifts([]);
      setHasFetchedInitial(false);
      setIsLoading(false);
    }
  }, [fetchData, isAuthenticated]);

  // Auto-refresh data when the window regains focus
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleFocus = () => {
      // Background refresh without triggering full-screen loading
      fetchData(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, fetchData, isLoading]);

  // ─── Departments ──────────────────────────────────────────────────────────
  const addDepartment = useCallback(async (dept: Omit<Department, 'id'>) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await departmentsApi.create(token, dept);
    if (res.status === 201) {
      setDepartments(prev => [...prev, res.data]);
      addToast(res.message || `Department "${dept.name}" created`, 'success');
    } else {
      addToast(res.message || 'Failed to create department', 'error');
      throw new Error(res.message);
    }
  }, [addToast]);

  const updateDepartment = useCallback(async (dept: Department) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await departmentsApi.update(token, dept.id, dept);
    if (res.status === 200) {
      setDepartments(prev => prev.map(d => d.id === dept.id ? res.data : d));
      addToast(res.message || 'Department updated', 'success');
    } else {
      addToast(res.message || 'Failed to update department', 'error');
    }
  }, [addToast]);

  const deleteDepartment = useCallback(async (id: string) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await departmentsApi.delete(token, id);
    if (res.status === 200) {
      setDepartments(prev => prev.filter(d => d.id !== id));
      addToast(res.message || 'Department deleted', 'info');
    } else {
      addToast(res.message || 'Failed to delete department', 'error');
    }
  }, [addToast]);

  // ─── Staff ────────────────────────────────────────────────────────────────
  const addStaff = useCallback(async (s: Omit<Staff, 'id'> & { password?: string }) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await staffApi.create(token, s);
    if (res.status === 201) {
      setStaff(prev => [...prev, res.data]);
      addToast(res.message || `${s.role === 'doctor' ? 'Dr.' : 'Nurse'} ${s.firstName} ${s.lastName} added`, 'success');
    } else {
      addToast(res.message || 'Failed to add staff', 'error');
      throw new Error(res.message);
    }
  }, [addToast]);

  const updateStaff = useCallback(async (s: Staff) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await staffApi.update(token, s.id, s);
    if (res.status === 200) {
      setStaff(prev => prev.map(st => st.id === s.id ? res.data : st));
      addToast(res.message || `Staff "${s.firstName} ${s.lastName}" updated`, 'success');
    } else {
      addToast(res.message || 'Failed to update staff', 'error');
    }
  }, [addToast]);

  const deleteStaff = useCallback(async (id: string) => {
    const token = getSavedToken();
    if (!token) return;
    const s = staff.find(st => st.id === id);
    const res = await staffApi.delete(token, id);
    if (res.status === 200) {
      setStaff(prev => prev.filter(st => st.id !== id));
      setShifts(prev => prev.filter(sh => sh.staffId !== id)); // cascade
      addToast(res.message || `${s?.firstName} ${s?.lastName} removed`, 'info');
    } else {
      addToast(res.message || 'Failed to delete staff', 'error');
    }
  }, [addToast, staff]);

  // ─── Shifts ───────────────────────────────────────────────────────────────
  const addShift = useCallback(async (s: Omit<Shift, 'id'>): Promise<boolean> => {
    const token = getSavedToken();
    if (!token) return false;
    const res = await shiftsApi.create(token, s);
    if (res.status === 201) {
      setShifts(prev => [...prev, res.data]);
      addToast(res.message || 'Shift assigned', 'success');
      return true;
    } else {
      addToast(res.message || 'Failed to assign shift', 'error');
      return false;
    }
  }, [addToast]);

  const updateShift = useCallback(async (s: Shift) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await shiftsApi.update(token, s.id, s);
    if (res.status === 200) {
      setShifts(prev => prev.map(sh => sh.id === s.id ? res.data : sh));
      addToast(res.message || 'Shift updated', 'success');
    } else {
      addToast(res.message || 'Failed to update shift', 'error');
    }
  }, [addToast]);

  const deleteShift = useCallback(async (id: string) => {
    const token = getSavedToken();
    if (!token) return;
    const res = await shiftsApi.delete(token, id);
    if (res.status === 200) {
      setShifts(prev => prev.filter(sh => sh.id !== id));
      addToast(res.message || 'Shift removed', 'info');
    } else {
      addToast(res.message || 'Failed to delete shift', 'error');
    }
  }, [addToast]);

  // ─── Exposed Methods ──────────────────────────────────────────────────────
  const refreshData = async () => {
    await fetchData(true);
  };

  // ─── Lookup helpers ───────────────────────────────────────────────────────
  const getStaffName = useCallback((staffId: string) => {
    const s = staff.find(st => st.id === staffId);
    if (!s) return 'Unknown';
    return `${s.role === 'doctor' ? 'Dr. ' : ''}${s.firstName} ${s.lastName}`;
  }, [staff]);

  const getDepartmentName = useCallback((deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || 'Unknown';
  }, [departments]);

  return (
    <DataContext.Provider value={{
      departments, staff, shifts, toasts, 
      isLoading: isLoading || (isAuthenticated && !hasFetchedInitial), 
      error,
      addToast, removeToast,
      addDepartment, updateDepartment, deleteDepartment,
      addStaff, updateStaff, deleteStaff,
      addShift, updateShift, deleteShift,
      getStaffName, getDepartmentName,
      refreshData: fetchData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
