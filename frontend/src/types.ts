export type UserRole = 'admin' | 'staff' | 'patient';
export type StaffRole = 'doctor' | 'nurse';
export type ShiftType = 'morning' | 'afternoon' | 'night';
export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled';
export type ScheduleStatus = 'draft' | 'published' | 'archived';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  staffId?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headDoctor: string;
  color: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  departmentId: string;
  specialization: string;
  status: 'active' | 'on-leave' | 'inactive';
}

export interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  departmentId: string;
  status: ShiftStatus;
  notes: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
