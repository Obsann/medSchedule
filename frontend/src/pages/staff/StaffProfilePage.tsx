import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { profileApi, getSavedToken, getFullPhotoUrl } from '../../api';
import {
  User, Mail, Shield, AlertCircle,
  Edit3, Save, X, Camera, Clock, Activity,
  Stethoscope, Building2, Check, Upload, Briefcase
} from 'lucide-react';
import { validateEthiopianPhone } from '../../utils/phoneValidation';

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return dateString; }
}

export default function StaffProfilePage() {
  const { updateUserPhoto, updateUserName } = useAuth();
  const { getDepartmentName, refetch } = useData();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    specialization: '',
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
          phone: res.data.staff?.phone || '',
          specialization: res.data.staff?.specialization || '',
        });
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

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await profileApi.updateProfile(token, {
        name: form.name,
        staff: {
          phone: form.phone,
          specialization: form.specialization,
        }
      });
      if (res.status === 200 && res.data) {
        setProfile(res.data);
        setIsEditing(false);
        setSaveSuccess(true);
        if (res.data.name) updateUserName(res.data.name);
        refetch();
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
        phone: profile.staff?.phone || '',
        specialization: profile.staff?.specialization || '',
      });
    }
    setIsEditing(false);
  };

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

  if (error && !profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Profile</h3>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={fetchProfile} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">Retry</button>
      </div>
    );
  }

  if (!profile) return null;

  const staffData = profile.staff || {};
  const isAdmin = profile.role === 'admin';
  const gradientFrom = isAdmin ? 'from-blue-600 via-blue-700 to-indigo-800' : 'from-teal-600 via-teal-700 to-emerald-800';
  const accentColor = isAdmin ? 'blue' : 'teal';
  const initials = profile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  const photoSrc = getFullPhotoUrl(profile.photoUrl);

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'on-leave': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    inactive:  { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  };
  const staffStatus = statusConfig[staffData.status] || statusConfig['active'];

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800">Profile saved successfully</span>
        </div>
      )}

      {error && profile && (
        <div className="bg-red-50 border border-red-200 px-5 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium text-red-800">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════ HEADER ═══════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`h-36 bg-gradient-to-r ${gradientFrom} relative`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          </div>
          {/* Role badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/20`}>
              <Shield className="w-3.5 h-3.5" /> {isAdmin ? 'Administrator' : staffData.role === 'doctor' ? 'Doctor' : 'Nurse'}
            </span>
          </div>
          {/* Status badge */}
          {staffData.status && (
            <div className="absolute top-4 left-4 z-10">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${staffStatus.bg} ${staffStatus.text} backdrop-blur-sm`}>
                <span className={`w-2 h-2 rounded-full ${staffStatus.dot} animate-pulse`} />
                {staffData.status}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 lg:px-8 pb-6 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Photo */}
            <div className="relative group flex-shrink-0">
              {photoSrc ? (
                <img src={photoSrc} alt={profile.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl" />
              ) : (
                <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${isAdmin ? 'from-blue-500 to-indigo-600' : 'from-teal-500 to-emerald-600'} border-4 border-white shadow-xl flex items-center justify-center text-white text-4xl font-bold`}>
                  {initials}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer border-4 border-transparent">
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

            <div className="flex-1 pt-2 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-gray-500">
                {staffData.specialization && (
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className={`w-4 h-4 text-${accentColor}-400`} />
                    {staffData.specialization}
                  </span>
                )}
                {staffData.departmentId && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className={`w-4 h-4 text-${accentColor}-400`} />
                    {getDepartmentName(staffData.departmentId)}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className={`w-4 h-4 text-${accentColor}-400`} />
                    {profile.email}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 sm:self-center flex-shrink-0">
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${isAdmin ? 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25' : 'from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-500/25'} disabled:opacity-60 flex items-center gap-1.5 shadow-lg transition-all`}>
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className={`px-5 py-2.5 rounded-xl text-sm font-medium text-${accentColor}-700 bg-${accentColor}-50 hover:bg-${accentColor}-100 border border-${accentColor}-200 flex items-center gap-1.5 transition-colors`}>
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ DETAIL CARDS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-${accentColor}-100 flex items-center justify-center`}>
              <User className={`w-4 h-4 text-${accentColor}-600`} />
            </div>
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="p-6 space-y-5">
            <FieldRow label="Full Name">
              {isEditing ? (
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              )}
            </FieldRow>

            <FieldRow label="Phone Number">
              {isEditing ? (
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251 912 345 678" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
              ) : (
                <p className="text-sm text-gray-700">{staffData.phone || <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </FieldRow>

            <FieldRow label="Specialization">
              {isEditing ? (
                <input type="text" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-gray-50 hover:bg-white transition-colors" />
              ) : (
                <p className="text-sm text-gray-700">{staffData.specialization || <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </FieldRow>

            <FieldRow label="Email Address">
              <p className="text-sm text-gray-700">{profile.email || <span className="text-gray-400 italic">Not set</span>}</p>
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
            <InfoRow icon={<User className="w-4 h-4" />} label="Username" value={profile.username} />
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Role" value={isAdmin ? 'Administrator' : staffData.role === 'doctor' ? 'Doctor' : 'Nurse'} />
            {staffData.departmentId && (
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department" value={getDepartmentName(staffData.departmentId)} />
            )}
            {staffData.status && (
              <InfoRow icon={<Activity className="w-4 h-4" />} label="Status" badge={
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${staffStatus.bg} ${staffStatus.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${staffStatus.dot}`} />
                  {staffData.status}
                </span>
              } />
            )}
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Member Since" value={formatDate(profile.createdAt)} />
            <InfoRow icon={<Upload className="w-4 h-4" />} label="Auth Provider" value={profile.authProvider === 'google' ? 'Google Account' : 'Local Account'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-sm text-gray-500 flex items-center gap-2">{icon} {label}</span>
      {badge || <span className="text-sm font-medium text-gray-900">{value}</span>}
    </div>
  );
}
