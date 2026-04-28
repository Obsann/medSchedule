import { startOfWeek, addDays, format } from 'date-fns';
import type { User, Department, Staff, Shift } from './types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const STORAGE_KEYS = {
  USERS: 'medschedule_users_v3',
  DEPARTMENTS: 'medschedule_departments_v3',
  STAFF: 'medschedule_staff_v3',
  SHIFTS: 'medschedule_shifts_v3',
  INITIALIZED: 'medschedule_initialized_v3',
};

// ─── 10 Departments ──────────────────────────────────────────────────────────
const defaultDepartments: Department[] = [
  { id: 'dept-1', name: 'Cardiology', description: 'Heart and cardiovascular system diagnosis, treatment, and rehabilitation', headDoctor: 'Dr. Abebe Kebede', color: '#EF4444' },
  { id: 'dept-2', name: 'Neurology', description: 'Brain, spinal cord and nervous system disorders diagnosis and treatment', headDoctor: 'Dr. Tigist Hailu', color: '#8B5CF6' },
  { id: 'dept-3', name: 'Pediatrics', description: 'Comprehensive child healthcare from newborn to adolescent', headDoctor: 'Dr. Mohammed Yusuf', color: '#F59E0B' },
  { id: 'dept-4', name: 'Emergency Medicine', description: '24/7 emergency and trauma care for critical and acute conditions', headDoctor: 'Dr. Sarah Johnson', color: '#DC2626' },
  { id: 'dept-5', name: 'General Medicine', description: 'Primary care, diagnostics, and treatment of common illnesses', headDoctor: 'Dr. Lemma Worku', color: '#10B981' },
  { id: 'dept-6', name: 'Surgery', description: 'General and specialized surgical procedures and post-operative care', headDoctor: 'Dr. Kidane Tadesse', color: '#3B82F6' },
  { id: 'dept-7', name: 'Obstetrics & Gynecology', description: "Women's reproductive health, prenatal care, and childbirth services", headDoctor: 'Dr. Hanna Bekele', color: '#EC4899' },
  { id: 'dept-8', name: 'Orthopedics', description: 'Musculoskeletal system: bones, joints, ligaments, and tendons', headDoctor: 'Dr. Samuel Gizaw', color: '#6366F1' },
  { id: 'dept-9', name: 'Dermatology', description: 'Skin, hair, and nail conditions diagnosis and treatment', headDoctor: 'Dr. Lydia Adera', color: '#F97316' },
  { id: 'dept-10', name: 'Radiology', description: 'Medical imaging services including X-ray, CT, MRI, and ultrasound', headDoctor: 'Dr. Daniel Hailu', color: '#06B6D4' },
];

// ─── 30 Staff Members ────────────────────────────────────────────────────────
const defaultStaff: Staff[] = [
  // ── Cardiology (dept-1) ──
  { id: 'staff-1', firstName: 'Abebe', lastName: 'Kebede', email: 'abebe.kebede@jimma-hospital.et', phone: '+251 911 001 001', role: 'doctor', departmentId: 'dept-1', specialization: 'Interventional Cardiology', status: 'active' },
  { id: 'staff-16', firstName: 'Tewodros', lastName: 'Moges', email: 'tewodros.moges@jimma-hospital.et', phone: '+251 911 016 016', role: 'doctor', departmentId: 'dept-1', specialization: 'Electrophysiology', status: 'active' },
  { id: 'staff-9', firstName: 'Alemnesh', lastName: 'Fikadu', email: 'alemnesh.fikadu@jimma-hospital.et', phone: '+251 911 009 009', role: 'nurse', departmentId: 'dept-1', specialization: 'Cardiac Care Nursing', status: 'active' },
  { id: 'staff-26', firstName: 'Sara', lastName: 'Teshome', email: 'sara.teshome@jimma-hospital.et', phone: '+251 911 026 026', role: 'nurse', departmentId: 'dept-1', specialization: 'ICU Nursing', status: 'active' },

  // ── Neurology (dept-2) ──
  { id: 'staff-2', firstName: 'Tigist', lastName: 'Hailu', email: 'tigist.hailu@jimma-hospital.et', phone: '+251 911 002 002', role: 'doctor', departmentId: 'dept-2', specialization: 'Clinical Neurology', status: 'active' },
  { id: 'staff-17', firstName: 'Bereket', lastName: 'Assefa', email: 'bereket.assefa@jimma-hospital.et', phone: '+251 911 017 017', role: 'doctor', departmentId: 'dept-2', specialization: 'Neurophysiology', status: 'on-leave' },
  { id: 'staff-15', firstName: 'Yonas', lastName: 'Damtew', email: 'yonas.damtew@jimma-hospital.et', phone: '+251 911 015 015', role: 'nurse', departmentId: 'dept-2', specialization: 'Neuro Nursing', status: 'active' },
  { id: 'staff-27', firstName: 'Helen', lastName: 'Gebre', email: 'helen.gebre@jimma-hospital.et', phone: '+251 911 027 027', role: 'nurse', departmentId: 'dept-2', specialization: 'Stroke Care', status: 'active' },

  // ── Pediatrics (dept-3) ──
  { id: 'staff-3', firstName: 'Mohammed', lastName: 'Yusuf', email: 'mohammed.yusuf@jimma-hospital.et', phone: '+251 911 003 003', role: 'doctor', departmentId: 'dept-3', specialization: 'Neonatal & Pediatric Care', status: 'active' },
  { id: 'staff-18', firstName: 'Mestawet', lastName: 'Tadesse', email: 'mestawet.tadesse@jimma-hospital.et', phone: '+251 911 018 018', role: 'doctor', departmentId: 'dept-3', specialization: 'Pediatric Infectious Diseases', status: 'active' },
  { id: 'staff-11', firstName: 'Hiwot', lastName: 'Tadesse', email: 'hiwot.tadesse@jimma-hospital.et', phone: '+251 911 011 011', role: 'nurse', departmentId: 'dept-3', specialization: 'Pediatric Nursing', status: 'active' },
  { id: 'staff-28', firstName: 'Kidist', lastName: 'Abebe', email: 'kidist.abebe@jimma-hospital.et', phone: '+251 911 028 028', role: 'nurse', departmentId: 'dept-3', specialization: 'Neonatal Intensive Care', status: 'active' },

  // ── Emergency Medicine (dept-4) ──
  { id: 'staff-4', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@jimma-hospital.et', phone: '+251 911 004 004', role: 'doctor', departmentId: 'dept-4', specialization: 'Emergency Trauma', status: 'active' },
  { id: 'staff-19', firstName: 'Natnael', lastName: 'Demissie', email: 'natnael.demissie@jimma-hospital.et', phone: '+251 911 019 019', role: 'doctor', departmentId: 'dept-4', specialization: 'Critical Care Medicine', status: 'active' },
  { id: 'staff-10', firstName: 'Dereje', lastName: 'Bekele', email: 'dereje.bekele@jimma-hospital.et', phone: '+251 911 010 010', role: 'nurse', departmentId: 'dept-4', specialization: 'Emergency Nursing', status: 'active' },
  { id: 'staff-29', firstName: 'Abel', lastName: 'Girma', email: 'abel.girma@jimma-hospital.et', phone: '+251 911 029 029', role: 'nurse', departmentId: 'dept-4', specialization: 'Trauma Nursing', status: 'active' },

  // ── General Medicine (dept-5) ──
  { id: 'staff-5', firstName: 'Lemma', lastName: 'Worku', email: 'lemma.worku@jimma-hospital.et', phone: '+251 911 005 005', role: 'doctor', departmentId: 'dept-5', specialization: 'Internal Medicine', status: 'active' },
  { id: 'staff-20', firstName: 'Feleke', lastName: 'Dagne', email: 'feleke.dagne@jimma-hospital.et', phone: '+251 911 020 020', role: 'doctor', departmentId: 'dept-5', specialization: 'Family Medicine', status: 'inactive' },
  { id: 'staff-13', firstName: 'Meron', lastName: 'Girma', email: 'meron.girma@jimma-hospital.et', phone: '+251 911 013 013', role: 'nurse', departmentId: 'dept-5', specialization: 'General Nursing', status: 'active' },
  { id: 'staff-30', firstName: 'Tigabu', lastName: 'Mekonnen', email: 'tigabu.mekonnen@jimma-hospital.et', phone: '+251 911 030 030', role: 'nurse', departmentId: 'dept-5', specialization: 'Community Health Nursing', status: 'active' },

  // ── Surgery (dept-6) ──
  { id: 'staff-6', firstName: 'Kidane', lastName: 'Tadesse', email: 'kidane.tadesse@jimma-hospital.et', phone: '+251 911 006 006', role: 'doctor', departmentId: 'dept-6', specialization: 'General & Laparoscopic Surgery', status: 'active' },
  { id: 'staff-21', firstName: 'Rediet', lastName: 'Alemayehu', email: 'rediet.alemayehu@jimma-hospital.et', phone: '+251 911 021 021', role: 'doctor', departmentId: 'dept-6', specialization: 'Thoracic Surgery', status: 'active' },
  { id: 'staff-12', firstName: 'Belayneh', lastName: 'Assefa', email: 'belayneh.assefa@jimma-hospital.et', phone: '+251 911 012 012', role: 'nurse', departmentId: 'dept-6', specialization: 'Surgical Nursing', status: 'active' },
  { id: 'staff-31', firstName: 'Muluken', lastName: 'Hailu', email: 'muluken.hailu@jimma-hospital.et', phone: '+251 911 031 031', role: 'nurse', departmentId: 'dept-6', specialization: 'Anesthesia Nursing', status: 'active' },

  // ── OB/GYN (dept-7) ──
  { id: 'staff-7', firstName: 'Hanna', lastName: 'Bekele', email: 'hanna.bekele@jimma-hospital.et', phone: '+251 911 007 007', role: 'doctor', departmentId: 'dept-7', specialization: 'Maternal-Fetal Medicine', status: 'active' },
  { id: 'staff-22', firstName: 'Segne', lastName: 'Wondimu', email: 'segne.wondimu@jimma-hospital.et', phone: '+251 911 022 022', role: 'doctor', departmentId: 'dept-7', specialization: 'Reproductive Endocrinology', status: 'active' },
  { id: 'staff-14', firstName: 'Feven', lastName: 'Alemu', email: 'feven.alemu@jimma-hospital.et', phone: '+251 911 014 014', role: 'nurse', departmentId: 'dept-7', specialization: 'Midwifery', status: 'active' },
  { id: 'staff-32', firstName: 'Blen', lastName: 'Kassa', email: 'blen.kassa@jimma-hospital.et', phone: '+251 911 032 032', role: 'nurse', departmentId: 'dept-7', specialization: 'Labor & Delivery', status: 'active' },

  // ── Orthopedics (dept-8) ──
  { id: 'staff-8', firstName: 'Samuel', lastName: 'Gizaw', email: 'samuel.gizaw@jimma-hospital.et', phone: '+251 911 008 008', role: 'doctor', departmentId: 'dept-8', specialization: 'Joint Replacement & Sports Medicine', status: 'active' },
  { id: 'staff-23', firstName: 'Eyob', lastName: 'Tadesse', email: 'eyob.tadesse@jimma-hospital.et', phone: '+251 911 023 023', role: 'doctor', departmentId: 'dept-8', specialization: 'Spine Surgery', status: 'on-leave' },
  { id: 'staff-33', firstName: 'Dawit', lastName: 'Fikadu', email: 'dawit.fikadu@jimma-hospital.et', phone: '+251 911 033 033', role: 'nurse', departmentId: 'dept-8', specialization: 'Orthopedic Nursing', status: 'active' },

  // ── Dermatology (dept-9) ──
  { id: 'staff-24', firstName: 'Lydia', lastName: 'Adera', email: 'lydia.adera@jimma-hospital.et', phone: '+251 911 024 024', role: 'doctor', departmentId: 'dept-9', specialization: 'Clinical Dermatology', status: 'active' },
  { id: 'staff-34', firstName: 'Nardos', lastName: 'Belete', email: 'nardos.belete@jimma-hospital.et', phone: '+251 911 034 034', role: 'nurse', departmentId: 'dept-9', specialization: 'Dermatology Nursing', status: 'active' },

  // ── Radiology (dept-10) ──
  { id: 'staff-25', firstName: 'Daniel', lastName: 'Hailu', email: 'daniel.hailu@jimma-hospital.et', phone: '+251 911 025 025', role: 'doctor', departmentId: 'dept-10', specialization: 'Diagnostic Radiology', status: 'active' },
  { id: 'staff-35', firstName: 'Yared', lastName: 'Mulat', email: 'yared.mulat@jimma-hospital.et', phone: '+251 911 035 035', role: 'nurse', departmentId: 'dept-10', specialization: 'Radiology Nursing', status: 'active' },
];

// ─── Users ────────────────────────────────────────────────────────────────────
const defaultUsers: User[] = [
  { id: 'user-1', username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
  { id: 'user-2', username: 'drabebe', password: 'staff123', role: 'staff', name: 'Dr. Abebe Kebede', staffId: 'staff-1' },
  { id: 'user-3', username: 'patient1', password: 'patient123', role: 'patient', name: 'Amanuel Girma' },
  { id: 'user-4', username: 'drsarah', password: 'staff123', role: 'staff', name: 'Dr. Sarah Johnson', staffId: 'staff-4' },
  { id: 'user-5', username: 'nursemeron', password: 'staff123', role: 'staff', name: 'Nurse Meron Girma', staffId: 'staff-13' },
  { id: 'user-6', username: 'drhanna', password: 'staff123', role: 'staff', name: 'Dr. Hanna Bekele', staffId: 'staff-7' },
  { id: 'user-7', username: 'drsamuel', password: 'staff123', role: 'staff', name: 'Dr. Samuel Gizaw', staffId: 'staff-8' },
  { id: 'user-8', username: 'nursedereje', password: 'staff123', role: 'staff', name: 'Nurse Dereje Bekele', staffId: 'staff-10' },
];

// ─── Shift Notes Pool ────────────────────────────────────────────────────────
const shiftNotes = [
  '', '', '', '', '', // many shifts have no notes
  'Regular shift', 'On-call coverage', 'Double coverage required',
  'Follow-up rounds needed', 'New patient intake expected',
  'Equipment check scheduled', 'Emergency overflow coverage',
  'Training day — junior staff supervision', 'Special clinic duty',
  'Post-op monitoring required', 'Night differential applies',
  'Weekend shift — extra compensation', 'Holiday coverage',
  'Cross-department support', 'Temporary assignment from Radiology',
];

// ─── Deterministic shift generation (4 weeks) ───────────────────────────────
function generateDefaultShifts(): Shift[] {
  const shifts: Shift[] = [];
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  // We use a simple seeded approach: index-based to avoid Math.random
  let noteIdx = 0;
  const getNote = () => shiftNotes[noteIdx++ % shiftNotes.length];

  const shiftConfigs: { type: 'morning' | 'afternoon' | 'night'; start: string; end: string }[] = [
    { type: 'morning', start: '07:00', end: '13:00' },
    { type: 'afternoon', start: '13:00', end: '19:00' },
    { type: 'night', start: '19:00', end: '07:00' },
  ];

  const activeStaff = defaultStaff.filter(s => s.status === 'active');
  const deptIds = [...new Set(activeStaff.map(s => s.departmentId))];

  // Generate for 4 weeks: last week (completed), this week (mixed), next 2 weeks (scheduled)
  for (let week = -1; week <= 2; week++) {
    const baseDate = addDays(thisWeekStart, week * 7);

    for (let day = 0; day < 7; day++) {
      const date = addDays(baseDate, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const isWeekend = day >= 5;

      // Determine status based on date relative to today
      const todayStr = format(today, 'yyyy-MM-dd');
      let defaultStatus: 'completed' | 'scheduled' = dateStr < todayStr ? 'completed' : 'scheduled';

      deptIds.forEach(deptId => {
        const deptStaff = activeStaff.filter(s => s.departmentId === deptId);
        if (deptStaff.length === 0) return;

        const doctors = deptStaff.filter(s => s.role === 'doctor');
        const nurses = deptStaff.filter(s => s.role === 'nurse');

        shiftConfigs.forEach((config, shiftIdx) => {
          // Weekend: only morning + afternoon for non-emergency departments; Emergency has all 3
          if (isWeekend && shiftIdx === 2 && deptId !== 'dept-4') return;

          // Rotate doctors through shifts
          const doctorIdx = (day + shiftIdx + (week + 1) * 3) % Math.max(doctors.length, 1);
          const nurseIdx = (day + shiftIdx + (week + 1) * 2 + 1) % Math.max(nurses.length, 1);

          // Doctor shift
          if (doctors[doctorIdx]) {
            shifts.push({
              id: `shift-${generateId()}`,
              staffId: doctors[doctorIdx].id,
              date: dateStr,
              startTime: config.start,
              endTime: config.end,
              shiftType: config.type,
              departmentId: deptId,
              status: defaultStatus,
              notes: getNote(),
            });
          }

          // Nurse shift
          if (nurses[nurseIdx]) {
            shifts.push({
              id: `shift-${generateId()}`,
              staffId: nurses[nurseIdx].id,
              date: dateStr,
              startTime: config.start,
              endTime: config.end,
              shiftType: config.type,
              departmentId: deptId,
              status: defaultStatus,
              notes: getNote(),
            });
          }

          // Emergency dept gets extra nurse coverage on all shifts
          if (deptId === 'dept-4' && nurses.length > 1) {
            const extraNurseIdx = (nurseIdx + 1) % nurses.length;
            if (shiftIdx < 2) { // extra nurse for morning & afternoon
              shifts.push({
                id: `shift-${generateId()}`,
                staffId: nurses[extraNurseIdx].id,
                date: dateStr,
                startTime: config.start,
                endTime: config.end,
                shiftType: config.type,
                departmentId: deptId,
                status: defaultStatus,
                notes: getNote(),
              });
            }
          }
        });
      });
    }
  }

  // Add some cancelled shifts for realism
  const cancelledCount = 12;
  for (let i = 0; i < cancelledCount; i++) {
    const week = Math.floor(i / 3) - 1;
    const day = i % 7;
    const date = addDays(thisWeekStart, week * 7 + day);
    const deptId = deptIds[i % deptIds.length];
    const deptDocs = activeStaff.filter(s => s.departmentId === deptId && s.role === 'doctor');
    if (deptDocs.length === 0) continue;
    const doc = deptDocs[i % deptDocs.length];
    const config = shiftConfigs[i % 3];
    shifts.push({
      id: `shift-${generateId()}`,
      staffId: doc.id,
      date: format(date, 'yyyy-MM-dd'),
      startTime: config.start,
      endTime: config.end,
      shiftType: config.type,
      departmentId: deptId,
      status: 'cancelled',
      notes: 'Shift cancelled — staff unavailable',
    });
  }

  return shifts;
}

// ─── Initialize ──────────────────────────────────────────────────────────────
export function initializeData(): void {
  // Always force re-seed for this version so the rich data is always fresh
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
  localStorage.removeItem(STORAGE_KEYS.STAFF);
  localStorage.removeItem(STORAGE_KEYS.SHIFTS);
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(defaultDepartments));
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(defaultStaff));
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(generateDefaultShifts()));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const getUsers = () => getData<User>(STORAGE_KEYS.USERS);
export const setUsers = (users: User[]) => setData(STORAGE_KEYS.USERS, users);
export const getDepartments = () => getData<Department>(STORAGE_KEYS.DEPARTMENTS);
export const setDepartments = (depts: Department[]) => setData(STORAGE_KEYS.DEPARTMENTS, depts);
export const getStaff = () => getData<Staff>(STORAGE_KEYS.STAFF);
export const setStaff = (staff: Staff[]) => setData(STORAGE_KEYS.STAFF, staff);
export const getShifts = () => getData<Shift>(STORAGE_KEYS.SHIFTS);
export const setShifts = (shifts: Shift[]) => setData(STORAGE_KEYS.SHIFTS, shifts);

export { generateId, STORAGE_KEYS };
