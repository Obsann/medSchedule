import type { User, Department, Staff, Shift, PatientProfile } from '../types';

// ─── API Base URL ────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5123/api';

// ─── API Response Types ──────────────────────────────────────────────────────
interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  message?: string;
}

interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// ─── Token Utilities ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'medschedule_jwt_token';

export function saveToken(token: string) { 
  localStorage.setItem(TOKEN_KEY, token); 
}

export function getSavedToken(): string | null { 
  return localStorage.getItem(TOKEN_KEY); 
}

export function clearToken() { 
  localStorage.removeItem(TOKEN_KEY); 
}

export function decodeToken(token: string) {
  if (!token) return { valid: false };
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return { valid: false };
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    // Check expiration (JWT exp is in seconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// ─── Base Fetch Wrapper ──────────────────────────────────────────────────────
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getSavedToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      status: 500,
      data: null as any,
      message: err instanceof Error ? err.message : 'Network error while reaching the server',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════════════════
export const authApi = {
  /** Staff & Admin login via domain email */
  async staffLogin(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return fetchApi<AuthResponse>('/auth/staff-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /** Patient login via username + password */
  async patientLogin(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return fetchApi<AuthResponse>('/auth/patient/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /** Patient registration */
  async patientRegister(username: string, password: string, name: string, email?: string): Promise<ApiResponse<AuthResponse>> {
    return fetchApi<AuthResponse>('/auth/patient/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email }),
    });
  },

  /** Google OAuth — send the credential token from GIS */
  async googleAuth(credential: string): Promise<ApiResponse<AuthResponse>> {
    return fetchApi<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  /** Get current user from JWT */
  async getMe(token: string): Promise<ApiResponse<Omit<User, 'password'>>> {
    return fetchApi<Omit<User, 'password'>>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF API
// ═══════════════════════════════════════════════════════════════════════════════
export const staffApi = {
  async getAll(token: string, filters?: { departmentId?: string; role?: string; status?: string; search?: string }): Promise<ApiResponse<Staff[]>> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Staff[]>(`/staff${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async getById(token: string, id: string): Promise<ApiResponse<Staff>> {
    return fetchApi<Staff>(`/staff/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async create(token: string, data: Omit<Staff, 'id'>): Promise<ApiResponse<Staff>> {
    return fetchApi<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async update(token: string, id: string, data: Partial<Staff>): Promise<ApiResponse<Staff>> {
    return fetchApi<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async delete(token: string, id: string): Promise<ApiResponse<null>> {
    return fetchApi<null>(`/staff/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS API
// ═══════════════════════════════════════════════════════════════════════════════
export const departmentsApi = {
  async getAll(token: string): Promise<ApiResponse<Department[]>> {
    return fetchApi<Department[]>('/departments', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async create(token: string, data: Omit<Department, 'id'>): Promise<ApiResponse<Department>> {
    return fetchApi<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async update(token: string, id: string, data: Partial<Department>): Promise<ApiResponse<Department>> {
    return fetchApi<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async delete(token: string, id: string): Promise<ApiResponse<null>> {
    return fetchApi<null>(`/departments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFTS API
// ═══════════════════════════════════════════════════════════════════════════════
export const shiftsApi = {
  async getAll(token: string, filters?: { departmentId?: string; staffId?: string; date?: string; status?: string; shiftType?: string }): Promise<ApiResponse<Shift[]>> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.staffId) params.append('staffId', filters.staffId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.shiftType) params.append('shiftType', filters.shiftType);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Shift[]>(`/shifts${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async create(token: string, data: Omit<Shift, 'id'>): Promise<ApiResponse<Shift>> {
    return fetchApi<Shift>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async update(token: string, id: string, data: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return fetchApi<Shift>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async delete(token: string, id: string): Promise<ApiResponse<null>> {
    return fetchApi<null>(`/shifts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATS API
// ═══════════════════════════════════════════════════════════════════════════════
export const statsApi = {
  async getDashboardStats(token: string) {
    return fetchApi<any>('/stats/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE API (all roles)
// ═══════════════════════════════════════════════════════════════════════════════
const SERVER_BASE = 'http://localhost:5123';

export function getFullPhotoUrl(photoUrl: string | undefined | null): string {
  if (!photoUrl) return '';
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${SERVER_BASE}${photoUrl}`;
}

export const profileApi = {
  async getProfile(token: string): Promise<ApiResponse<any>> {
    return fetchApi<any>('/profile/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async updateProfile(token: string, data: any): Promise<ApiResponse<any>> {
    return fetchApi<any>('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async uploadPhoto(token: string, file: File): Promise<ApiResponse<{ photoUrl: string }>> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/profile/upload-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },
};

// Keep old patientApi for backward compat
export const patientApi = {
  async getProfile(token: string): Promise<ApiResponse<PatientProfile>> {
    return fetchApi<PatientProfile>('/patient/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  async updateProfile(token: string, data: Partial<PatientProfile>): Promise<ApiResponse<PatientProfile>> {
    return fetchApi<PatientProfile>('/patient/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};
