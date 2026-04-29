/**
 * Database Seeder
 * Run: node seed.js
 * Seeds the MongoDB database with initial departments, staff, users, and shifts.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { startOfWeek, addDays, format } = require('date-fns');

const User = require('./models/User');
const Department = require('./models/Department');
const Staff = require('./models/Staff');
const Shift = require('./models/Shift');
const Patient = require('./models/Patient');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Staff.deleteMany({}),
      Shift.deleteMany({}),
      Patient.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // ── Seed Departments ──────────────────────────────────────────────────────
    const deptData = [
      { name: 'Cardiology', description: 'Heart and cardiovascular system diagnosis, treatment, and rehabilitation', headDoctor: 'Dr. Abebe Kebede', color: '#EF4444' },
      { name: 'Neurology', description: 'Brain, spinal cord and nervous system disorders diagnosis and treatment', headDoctor: 'Dr. Tigist Hailu', color: '#8B5CF6' },
      { name: 'Pediatrics', description: 'Comprehensive child healthcare from newborn to adolescent', headDoctor: 'Dr. Mohammed Yusuf', color: '#F59E0B' },
      { name: 'Emergency Medicine', description: '24/7 emergency and trauma care for critical and acute conditions', headDoctor: 'Dr. Sarah Johnson', color: '#DC2626' },
      { name: 'General Medicine', description: 'Primary care, diagnostics, and treatment of common illnesses', headDoctor: 'Dr. Lemma Worku', color: '#10B981' },
      { name: 'Surgery', description: 'General and specialized surgical procedures and post-operative care', headDoctor: 'Dr. Kidane Tadesse', color: '#3B82F6' },
      { name: 'Obstetrics & Gynecology', description: "Women's reproductive health, prenatal care, and childbirth services", headDoctor: 'Dr. Hanna Bekele', color: '#EC4899' },
      { name: 'Orthopedics', description: 'Musculoskeletal system: bones, joints, ligaments, and tendons', headDoctor: 'Dr. Samuel Gizaw', color: '#6366F1' },
      { name: 'Dermatology', description: 'Skin, hair, and nail conditions diagnosis and treatment', headDoctor: 'Dr. Lydia Adera', color: '#F97316' },
      { name: 'Radiology', description: 'Medical imaging services including X-ray, CT, MRI, and ultrasound', headDoctor: 'Dr. Daniel Hailu', color: '#06B6D4' },
    ];

    const departments = await Department.insertMany(deptData);
    console.log(`📋 Seeded ${departments.length} departments`);

    // Create a lookup: deptName -> ObjectId
    const deptMap = {};
    departments.forEach(d => { deptMap[d.name] = d._id; });

    // ── Seed Staff ────────────────────────────────────────────────────────────
    const staffData = [
      // Cardiology
      { firstName: 'Abebe', lastName: 'Kebede', email: 'abebe.kebede@medSchedule.et', phone: '+251 911 001 001', role: 'doctor', departmentId: deptMap['Cardiology'], specialization: 'Interventional Cardiology', status: 'active' },
      { firstName: 'Tewodros', lastName: 'Moges', email: 'tewodros.moges@medSchedule.et', phone: '+251 911 016 016', role: 'doctor', departmentId: deptMap['Cardiology'], specialization: 'Electrophysiology', status: 'active' },
      { firstName: 'Alemnesh', lastName: 'Fikadu', email: 'alemnesh.fikadu@medSchedule.et', phone: '+251 911 009 009', role: 'nurse', departmentId: deptMap['Cardiology'], specialization: 'Cardiac Care Nursing', status: 'active' },
      { firstName: 'Sara', lastName: 'Teshome', email: 'sara.teshome@medSchedule.et', phone: '+251 911 026 026', role: 'nurse', departmentId: deptMap['Cardiology'], specialization: 'ICU Nursing', status: 'active' },
      // Neurology
      { firstName: 'Tigist', lastName: 'Hailu', email: 'tigist.hailu@medSchedule.et', phone: '+251 911 002 002', role: 'doctor', departmentId: deptMap['Neurology'], specialization: 'Clinical Neurology', status: 'active' },
      { firstName: 'Bereket', lastName: 'Assefa', email: 'bereket.assefa@medSchedule.et', phone: '+251 911 017 017', role: 'doctor', departmentId: deptMap['Neurology'], specialization: 'Neurophysiology', status: 'on-leave' },
      { firstName: 'Yonas', lastName: 'Damtew', email: 'yonas.damtew@medSchedule.et', phone: '+251 911 015 015', role: 'nurse', departmentId: deptMap['Neurology'], specialization: 'Neuro Nursing', status: 'active' },
      { firstName: 'Helen', lastName: 'Gebre', email: 'helen.gebre@medSchedule.et', phone: '+251 911 027 027', role: 'nurse', departmentId: deptMap['Neurology'], specialization: 'Stroke Care', status: 'active' },
      // Pediatrics
      { firstName: 'Mohammed', lastName: 'Yusuf', email: 'mohammed.yusuf@medSchedule.et', phone: '+251 911 003 003', role: 'doctor', departmentId: deptMap['Pediatrics'], specialization: 'Neonatal & Pediatric Care', status: 'active' },
      { firstName: 'Mestawet', lastName: 'Tadesse', email: 'mestawet.tadesse@medSchedule.et', phone: '+251 911 018 018', role: 'doctor', departmentId: deptMap['Pediatrics'], specialization: 'Pediatric Infectious Diseases', status: 'active' },
      { firstName: 'Hiwot', lastName: 'Tadesse', email: 'hiwot.tadesse@medSchedule.et', phone: '+251 911 011 011', role: 'nurse', departmentId: deptMap['Pediatrics'], specialization: 'Pediatric Nursing', status: 'active' },
      { firstName: 'Kidist', lastName: 'Abebe', email: 'kidist.abebe@medSchedule.et', phone: '+251 911 028 028', role: 'nurse', departmentId: deptMap['Pediatrics'], specialization: 'Neonatal Intensive Care', status: 'active' },
      // Emergency Medicine
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@medSchedule.et', phone: '+251 911 004 004', role: 'doctor', departmentId: deptMap['Emergency Medicine'], specialization: 'Emergency Trauma', status: 'active' },
      { firstName: 'Natnael', lastName: 'Demissie', email: 'natnael.demissie@medSchedule.et', phone: '+251 911 019 019', role: 'doctor', departmentId: deptMap['Emergency Medicine'], specialization: 'Critical Care Medicine', status: 'active' },
      { firstName: 'Dereje', lastName: 'Bekele', email: 'dereje.bekele@medSchedule.et', phone: '+251 911 010 010', role: 'nurse', departmentId: deptMap['Emergency Medicine'], specialization: 'Emergency Nursing', status: 'active' },
      { firstName: 'Abel', lastName: 'Girma', email: 'abel.girma@medSchedule.et', phone: '+251 911 029 029', role: 'nurse', departmentId: deptMap['Emergency Medicine'], specialization: 'Trauma Nursing', status: 'active' },
      // General Medicine
      { firstName: 'Lemma', lastName: 'Worku', email: 'lemma.worku@medSchedule.et', phone: '+251 911 005 005', role: 'doctor', departmentId: deptMap['General Medicine'], specialization: 'Internal Medicine', status: 'active' },
      { firstName: 'Feleke', lastName: 'Dagne', email: 'feleke.dagne@medSchedule.et', phone: '+251 911 020 020', role: 'doctor', departmentId: deptMap['General Medicine'], specialization: 'Family Medicine', status: 'inactive' },
      { firstName: 'Meron', lastName: 'Girma', email: 'meron.girma@medSchedule.et', phone: '+251 911 013 013', role: 'nurse', departmentId: deptMap['General Medicine'], specialization: 'General Nursing', status: 'active' },
      { firstName: 'Tigabu', lastName: 'Mekonnen', email: 'tigabu.mekonnen@medSchedule.et', phone: '+251 911 030 030', role: 'nurse', departmentId: deptMap['General Medicine'], specialization: 'Community Health Nursing', status: 'active' },
      // Surgery
      { firstName: 'Kidane', lastName: 'Tadesse', email: 'kidane.tadesse@medSchedule.et', phone: '+251 911 006 006', role: 'doctor', departmentId: deptMap['Surgery'], specialization: 'General & Laparoscopic Surgery', status: 'active' },
      { firstName: 'Rediet', lastName: 'Alemayehu', email: 'rediet.alemayehu@medSchedule.et', phone: '+251 911 021 021', role: 'doctor', departmentId: deptMap['Surgery'], specialization: 'Thoracic Surgery', status: 'active' },
      { firstName: 'Belayneh', lastName: 'Assefa', email: 'belayneh.assefa@medSchedule.et', phone: '+251 911 012 012', role: 'nurse', departmentId: deptMap['Surgery'], specialization: 'Surgical Nursing', status: 'active' },
      { firstName: 'Muluken', lastName: 'Hailu', email: 'muluken.hailu@medSchedule.et', phone: '+251 911 031 031', role: 'nurse', departmentId: deptMap['Surgery'], specialization: 'Anesthesia Nursing', status: 'active' },
      // Obstetrics & Gynecology
      { firstName: 'Hanna', lastName: 'Bekele', email: 'hanna.bekele@medSchedule.et', phone: '+251 911 007 007', role: 'doctor', departmentId: deptMap['Obstetrics & Gynecology'], specialization: 'Maternal-Fetal Medicine', status: 'active' },
      { firstName: 'Segne', lastName: 'Wondimu', email: 'segne.wondimu@medSchedule.et', phone: '+251 911 022 022', role: 'doctor', departmentId: deptMap['Obstetrics & Gynecology'], specialization: 'Reproductive Endocrinology', status: 'active' },
      { firstName: 'Feven', lastName: 'Alemu', email: 'feven.alemu@medSchedule.et', phone: '+251 911 014 014', role: 'nurse', departmentId: deptMap['Obstetrics & Gynecology'], specialization: 'Midwifery', status: 'active' },
      { firstName: 'Blen', lastName: 'Kassa', email: 'blen.kassa@medSchedule.et', phone: '+251 911 032 032', role: 'nurse', departmentId: deptMap['Obstetrics & Gynecology'], specialization: 'Labor & Delivery', status: 'active' },
      // Orthopedics
      { firstName: 'Samuel', lastName: 'Gizaw', email: 'samuel.gizaw@medSchedule.et', phone: '+251 911 008 008', role: 'doctor', departmentId: deptMap['Orthopedics'], specialization: 'Joint Replacement & Sports Medicine', status: 'active' },
      { firstName: 'Eyob', lastName: 'Tadesse', email: 'eyob.tadesse@medSchedule.et', phone: '+251 911 023 023', role: 'doctor', departmentId: deptMap['Orthopedics'], specialization: 'Spine Surgery', status: 'on-leave' },
      { firstName: 'Dawit', lastName: 'Fikadu', email: 'dawit.fikadu@medSchedule.et', phone: '+251 911 033 033', role: 'nurse', departmentId: deptMap['Orthopedics'], specialization: 'Orthopedic Nursing', status: 'active' },
      // Dermatology
      { firstName: 'Lydia', lastName: 'Adera', email: 'lydia.adera@medSchedule.et', phone: '+251 911 024 024', role: 'doctor', departmentId: deptMap['Dermatology'], specialization: 'Clinical Dermatology', status: 'active' },
      { firstName: 'Nardos', lastName: 'Belete', email: 'nardos.belete@medSchedule.et', phone: '+251 911 034 034', role: 'nurse', departmentId: deptMap['Dermatology'], specialization: 'Dermatology Nursing', status: 'active' },
      // Radiology
      { firstName: 'Daniel', lastName: 'Hailu', email: 'daniel.hailu@medSchedule.et', phone: '+251 911 025 025', role: 'doctor', departmentId: deptMap['Radiology'], specialization: 'Diagnostic Radiology', status: 'active' },
      { firstName: 'Yared', lastName: 'Mulat', email: 'yared.mulat@medSchedule.et', phone: '+251 911 035 035', role: 'nurse', departmentId: deptMap['Radiology'], specialization: 'Radiology Nursing', status: 'active' },
    ];

    const staffMembers = await Staff.insertMany(staffData);
    console.log(` Seeded ${staffMembers.length} staff members`);

    // Create staffName -> ObjectId lookup
    const staffMap = {};
    staffMembers.forEach(s => {
      staffMap[`${s.firstName} ${s.lastName}`] = s._id;
    });

    // Staff email -> ObjectId lookup
    const staffEmailMap = {};
    staffMembers.forEach(s => {
      staffEmailMap[s.email] = s._id;
    });

    // ── Seed Users ────────────────────────────────────────────────────────────
    // Users are created one-by-one so the bcrypt pre-save hook runs
    // Create an admin Staff record so profile editing works
    const adminStaff = await Staff.create({
      firstName: 'System', lastName: 'Administrator',
      email: 'admin@medschedule.et', phone: '+251 911 000 000',
      role: 'doctor', departmentId: deptMap['General Medicine'],
      specialization: 'Hospital Administration', status: 'active',
    });

    const usersData = [
      // Admin — uses domain email for login
      { username: 'admin', email: 'admin@medSchedule.et', password: 'admin123', role: 'admin', name: 'System Administrator', staffId: adminStaff._id, authProvider: 'local' },
      // Staff — each has their domain email for login
      { username: 'drabebe', email: 'abebe.kebede@medSchedule.et', password: 'staff123', role: 'staff', name: 'Dr. Abebe Kebede', staffId: staffMap['Abebe Kebede'], authProvider: 'local' },
      { username: 'drsarah', email: 'sarah.johnson@medSchedule.et', password: 'staff123', role: 'staff', name: 'Dr. Sarah Johnson', staffId: staffMap['Sarah Johnson'], authProvider: 'local' },
      { username: 'nursemeron', email: 'meron.girma@medSchedule.et', password: 'staff123', role: 'staff', name: 'Nurse Meron Girma', staffId: staffMap['Meron Girma'], authProvider: 'local' },
      { username: 'drhanna', email: 'hanna.bekele@medSchedule.et', password: 'staff123', role: 'staff', name: 'Dr. Hanna Bekele', staffId: staffMap['Hanna Bekele'], authProvider: 'local' },
      { username: 'drsamuel', email: 'samuel.gizaw@medSchedule.et', password: 'staff123', role: 'staff', name: 'Dr. Samuel Gizaw', staffId: staffMap['Samuel Gizaw'], authProvider: 'local' },
      { username: 'nursedereje', email: 'dereje.bekele@medSchedule.et', password: 'staff123', role: 'staff', name: 'Nurse Dereje Bekele', staffId: staffMap['Dereje Bekele'], authProvider: 'local' },
      // Patients — use standard username/password
      { username: 'patient1', email: 'amanuel@gmail.com', password: 'patient123', role: 'patient', name: 'Amanuel Girma', staffId: null, authProvider: 'local' },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const created = await User.create(u);
      createdUsers.push(created);
    }
    console.log(`Seeded ${usersData.length} users`);

    // Create Patient profiles for patient users
    const patientUsers = createdUsers.filter(u => u.role === 'patient');
    for (const pu of patientUsers) {
      const patient = await Patient.create({
        userId: pu._id,
        mrn: 'MRN-' + Math.floor(100000 + Math.random() * 900000).toString(),
        dob: '1995-03-15',
        gender: 'Male',
        phone: '+251 912 345 678',
        emergencyContact: {
          name: 'Tigist Girma',
          phone: '+251 911 234 567',
          relation: 'Spouse',
        },
        status: 'Out-patient',
      });
      pu.patientId = patient._id;
      await pu.save();
    }
    console.log(`Seeded ${patientUsers.length} patient profiles`);

    // ── Seed Shifts (4 weeks) ─────────────────────────────────────────────────
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    const shiftConfigs = [
      { type: 'morning', start: '07:00', end: '13:00' },
      { type: 'afternoon', start: '13:00', end: '19:00' },
      { type: 'night', start: '19:00', end: '07:00' },
    ];

    const notes = [
      '', '', '', '', 'Regular shift', 'On-call coverage', 'Follow-up rounds needed',
      'Equipment check scheduled', 'Training day — junior staff supervision', 'Post-op monitoring required',
      'Weekend shift — extra compensation', 'Cross-department support', 'Double coverage required',
      'Special clinic duty', 'Night differential applies', 'New patient intake expected',
    ];
    let ni = 0;

    const activeStaff = staffMembers.filter(s => s.status === 'active');
    const deptIds = [...new Set(activeStaff.map(s => s.departmentId.toString()))];

    // Find the Emergency dept id
    const emergencyDeptId = deptMap['Emergency Medicine'].toString();

    const shiftsToInsert = [];

    for (let week = -1; week <= 2; week++) {
      for (let day = 0; day < 7; day++) {
        const date = addDays(thisWeekStart, week * 7 + day);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isWeekend = day >= 5;
        const todayStr = format(today, 'yyyy-MM-dd');
        const status = dateStr < todayStr ? 'completed' : 'scheduled';

        deptIds.forEach(deptId => {
          const ds = activeStaff.filter(s => s.departmentId.toString() === deptId);
          if (!ds.length) return;
          const docs = ds.filter(s => s.role === 'doctor');
          const nurses = ds.filter(s => s.role === 'nurse');

          shiftConfigs.forEach((cfg, si) => {
            if (isWeekend && si === 2 && deptId !== emergencyDeptId) return;
            const di = (day + si + (week + 1) * 3) % Math.max(docs.length, 1);
            const nri = (day + si + (week + 1) * 2 + 1) % Math.max(nurses.length, 1);

            if (docs[di]) {
              shiftsToInsert.push({
                staffId: docs[di]._id,
                date: dateStr,
                startTime: cfg.start,
                endTime: cfg.end,
                shiftType: cfg.type,
                departmentId: docs[di].departmentId,
                status,
                notes: notes[ni++ % notes.length],
              });
            }
            if (nurses[nri]) {
              shiftsToInsert.push({
                staffId: nurses[nri]._id,
                date: dateStr,
                startTime: cfg.start,
                endTime: cfg.end,
                shiftType: cfg.type,
                departmentId: nurses[nri].departmentId,
                status,
                notes: notes[ni++ % notes.length],
              });
            }

            // Emergency gets extra nurse
            if (deptId === emergencyDeptId && nurses.length > 1 && si < 2) {
              const en = (nri + 1) % nurses.length;
              shiftsToInsert.push({
                staffId: nurses[en]._id,
                date: dateStr,
                startTime: cfg.start,
                endTime: cfg.end,
                shiftType: cfg.type,
                departmentId: nurses[en].departmentId,
                status,
                notes: notes[ni++ % notes.length],
              });
            }
          });
        });
      }
    }

    // Add cancelled shifts
    for (let i = 0; i < 12; i++) {
      const d = addDays(thisWeekStart, (Math.floor(i / 3) - 1) * 7 + (i % 7));
      const did = deptIds[i % deptIds.length];
      const dd = activeStaff.filter(s => s.departmentId.toString() === did && s.role === 'doctor');
      if (!dd.length) continue;
      const c = shiftConfigs[i % 3];
      shiftsToInsert.push({
        staffId: dd[i % dd.length]._id,
        date: format(d, 'yyyy-MM-dd'),
        startTime: c.start,
        endTime: c.end,
        shiftType: c.type,
        departmentId: dd[i % dd.length].departmentId,
        status: 'cancelled',
        notes: 'Shift cancelled — staff unavailable',
      });
    }

    await Shift.insertMany(shiftsToInsert);
    console.log(` Seeded ${shiftsToInsert.length} shifts`);

    console.log('\n Database seeded successfully!');
    console.log('\n── Login Credentials ──────────────────────────');
    console.log('STAFF PORTAL (use domain email):');
    console.log('  Admin:    admin@medSchedule.et / admin123');
    console.log('  Doctor:   abebe.kebede@medSchedule.et / staff123');
    console.log('  Doctor:   sarah.johnson@medSchedule.et / staff123');
    console.log('  Nurse:    meron.girma@medSchedule.et / staff123');
    console.log('');
    console.log('PATIENT PORTAL (use username):');
    console.log('  Patient:  patient1 / patient123');
    console.log('──────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error(' Seed error:', error);
    process.exit(1);
  }
}

seed();
