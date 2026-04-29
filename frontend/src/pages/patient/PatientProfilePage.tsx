import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

import { profileApi, getSavedToken, getFullPhotoUrl } from '../../api';
import {
  User, Mail, Phone, Calendar, Shield, Heart, AlertCircle,
  Edit3, Save, X, Camera, UserCheck, Clock, Activity,
  Upload, Check
} from 'lucide-react';
import { validateEthiopianPhone } from '../../utils/phoneValidation';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calculateAge(dobString: string): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return dateString; }
}

const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'In-patient':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-500' },
  'Out-patient': { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Discharged':  { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-300',  dot: 'bg-gray-400' },
};

const genderOptions = ['Male', 'Female', 'Other', 'Unknown'] as const;

// ═════════════════════════════════════════════════════════════════════════════════
export default function PatientProfilePage() {
  const { updateUserPhoto, updateUserName } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable form state
  const [form, setForm] = useState({
    name: '',
    dob: '', gender: 'Unknown' as string, phone: '',
    emergencyContact: { name: '', phone: '', relation: '' },
  });

  const fetchProfile = useCallback(async () => {
    const token = getSavedToken();
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await profileApi.getProfile(token);
      if (res.status === 200 && res.data) {
        setProfile(res.data);
        setForm({
          name: res.data.name || '',
          dob: res.data.patient?.dob || '',
          gender: res.data.patient?.gender || 'Unknown',
          phone: res.data.patient?.phone || '',
          emergencyContact: {
            name: res.data.patient?.emergencyContact?.name || '',
            phone: res.data.patient?.emergencyContact?.phone || '',
            relation: res.data.patient?.emergencyContact?.relation || '',
          },
        });
        // Sync photo to auth context
        if (res.data.photoUrl) updateUserPhoto(res.data.photoUrl);
        if (res.data.name) updateUserName(res.data.name);
      } else {
        setError(res.message || 'Failed to load profile');
      }
    } catch {
      setError('Network error while loading profile');
    } finally {
      setIsLoading(false);
    }
  }, [updateUserPhoto, updateUserName]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    const token = getSavedToken();
    if (!token) return;

    if (form.phone) {
      const phoneVal = validateEthiopianPhone(form.phone);
      if (!phoneVal.valid) {
        setError(phoneVal.error || 'Invalid phone format');
        return;
      }
    }

    if (form.emergencyContact.phone) {
      const emergencyPhoneVal = validateEthiopianPhone(form.emergencyContact.phone);
      if (!emergencyPhoneVal.valid) {
        setError(emergencyPhoneVal.error || 'Invalid emergency contact phone format');
        return;
      }
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await profileApi.updateProfile(token, {
        name: form.name,
        patient: {
          dob: form.dob,
          gender: form.gender,
          phone: form.phone,
          emergencyContact: form.emergencyContact,
        }
      });
      if (res.status === 200 && res.data) {
        setProfile(res.data);
        setIsEditing(false);
        setSaveSuccess(true);
        if (res.data.name) updateUserName(res.data.name);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(res.message || 'Failed to save profile');
      }
    } catch {
      setError('Network error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getSavedToken();
    if (!token) return;

    setIsUploading(true);
    try {
      const res = await profileApi.uploadPhoto(token, file);
      if (res.status === 200 && res.data?.photoUrl) {
        setProfile((prev: any) => ({ ...prev, photoUrl: res.data.photoUrl }));
        updateUserPhoto(res.data.photoUrl);
      }
    } catch {
      setError('Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        dob: profile.patient?.dob || '',
        gender: profile.patient?.gender || 'Unknown',
        phone: profile.patient?.phone || '',
        emergencyContact: {
          name: profile.patient?.emergencyContact?.name || '',
          phone: profile.patient?.emergencyContact?.phone || '',
          relation: profile.patient?.emergencyContact?.relation || '',
        },
      });
    }
    setIsEditing(false);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-56 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-72 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (error && !profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Profile</h3>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={fetchProfile} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">
          Retry
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const age = calculateAge(form.dob);
  const patientData = profile.patient || {};
  const status = statusConfig[patientData.status] || statusConfig['Out-patient'];
  const initials = profile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  const photoSrc = getFullPhotoUrl(profile.photoUrl);

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      {/* ─── Success Toast ──────────────────────────────────────────────────── */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800">Profile saved successfully</span>
        </div>
      )}

      {/* ─── Error Alert ────────────────────────────────────────────────────── */}
      {error && profile && (
        <div className="bg-red-50 border border-red-200 px-5 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium text-red-800">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           DEMOGRAPHIC & IDENTITY HEADER
           ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Gradient Banner */}
        <div className="h-36 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
            <div className="absolute left-10 top-4 w-20 h-20 bg-white/5 rounded-full" />
          </div>
          {/* Status badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${status.bg} ${status.text} ${status.border}`}>
              <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
              {patientData.status || 'Out-patient'}
            </span>
          </div>
          {/* MRN badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/20">
              <Shield className="w-3.5 h-3.5" /> {patientData.mrn || 'N/A'}
            </span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 lg:px-8 pb-6 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Photo with Upload Overlay */}
            <div className="relative group flex-shrink-0">
              {photoSrc ? (
                <img src={photoSrc} alt={profile.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 border-4 border-white shadow-xl flex items-center justify-center text-white text-4xl font-bold">
                  {initials}
                </div>
              )}
              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer border-4 border-transparent"
              >
                {isUploading ? (
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-[10px] text-white font-medium">Change Photo</span>
                  </div>
                )}
              </button>
            </div>

            {/* Name & Quick Info */}
            <div className="flex-1 pt-2 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-gray-500">
                {form.dob && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    {formatDate(form.dob)}{age !== null && <span className="text-purple-600 font-semibold">({age} yrs)</span>}
                  </span>
                )}
                {form.gender !== 'Unknown' && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-400" />
                    {form.gender}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-400" />
                    {profile.email}
                  </span>
                )}
                {form.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-purple-400" />
                    {form.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:self-center flex-shrink-0">
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-purple-500/25 transition-all">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition-colors">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
           DETAIL CARDS
           ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Personal Information ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Full Name */}
            <FieldRow label="Full Name" icon={<UserCheck className="w-4 h-4 text-gray-400" />}>
              {isEditing ? (
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              )}
            </FieldRow>

            {/* Date of Birth */}
            <FieldRow label="Date of Birth" icon={<Calendar className="w-4 h-4 text-gray-400" />}>
              {isEditing ? (
                <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
              ) : (
                <p className="text-sm text-gray-700">{form.dob ? `${formatDate(form.dob)}${age !== null ? ` — ${age} years old` : ''}` : <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </FieldRow>

            {/* Gender */}
            <FieldRow label="Gender" icon={<User className="w-4 h-4 text-gray-400" />}>
              {isEditing ? (
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white text-gray-900 transition-colors">
                  {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <p className="text-sm text-gray-700">{form.gender === 'Unknown' ? <span className="text-gray-400 italic">Not set</span> : form.gender}</p>
              )}
            </FieldRow>

            {/* Phone */}
            <FieldRow label="Phone Number" icon={<Phone className="w-4 h-4 text-gray-400" />}>
              {isEditing ? (
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251 912 345 678" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
              ) : (
                <p className="text-sm text-gray-700">{form.phone || <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </FieldRow>

            {/* Email (read-only) */}
            <FieldRow label="Email Address" icon={<Mail className="w-4 h-4 text-gray-400" />}>
              <p className="text-sm text-gray-700">{profile.email || <span className="text-gray-400 italic">Not set</span>}</p>
            </FieldRow>
          </div>
        </div>

        {/* ─── Emergency Contact & Account ──────────────────────────────────── */}
        <div className="space-y-6">
          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Emergency Contact</h3>
            </div>
            <div className="p-6 space-y-5">
              <FieldRow label="Contact Name">
                {isEditing ? (
                  <input type="text" value={form.emergencyContact.name} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))} placeholder="Full name" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
                ) : (
                  <p className="text-sm text-gray-700">{form.emergencyContact.name || <span className="text-gray-400 italic">Not set</span>}</p>
                )}
              </FieldRow>
              <FieldRow label="Contact Phone">
                {isEditing ? (
                  <input type="tel" value={form.emergencyContact.phone} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))} placeholder="+251 912 345 678" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
                ) : (
                  <p className="text-sm text-gray-700">{form.emergencyContact.phone || <span className="text-gray-400 italic">Not set</span>}</p>
                )}
              </FieldRow>
              <FieldRow label="Relationship">
                {isEditing ? (
                  <input type="text" value={form.emergencyContact.relation} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, relation: e.target.value } }))} placeholder="e.g. Spouse, Parent, Sibling" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
                ) : (
                  <p className="text-sm text-gray-700">{form.emergencyContact.relation || <span className="text-gray-400 italic">Not set</span>}</p>
                )}
              </FieldRow>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Account Details</h3>
            </div>
            <div className="p-5 space-y-3">
              <InfoRow icon={<Shield className="w-4 h-4" />} label="MRN" value={patientData.mrn || 'N/A'} mono />
              <InfoRow icon={<User className="w-4 h-4" />} label="Username" value={profile.username} />
              <InfoRow icon={<Activity className="w-4 h-4" />} label="Status" badge={
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {patientData.status || 'Out-patient'}
                </span>
              } />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Member Since" value={formatDate(profile.createdAt)} />
              <InfoRow icon={<Upload className="w-4 h-4" />} label="Auth Provider" value={profile.authProvider === 'google' ? 'Google Account' : 'Local Account'} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Shared Sub-components ───────────────────────────────────────────────────
function FieldRow({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value, mono, badge }: { icon: React.ReactNode; label: string; value?: string; mono?: boolean; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-sm text-gray-500 flex items-center gap-2">{icon} {label}</span>
      {badge || <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>}
    </div>
  );
}
