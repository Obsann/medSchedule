import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { authApi, saveToken, getSavedToken, clearToken, decodeToken } from '../api';

interface AuthContextType {
  user: Omit<User, 'password'> & { photoUrl?: string; email?: string } | null;
  staffLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  patientLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  patientRegister: (username: string, password: string, name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  googleAuth: (credential: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  updateUserPhoto: (photoUrl: string) => void;
  updateUserName: (name: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(() => {
    const token = getSavedToken();
    if (token) {
      const { valid, payload } = decodeToken(token);
      if (valid && payload) {
        return { id: payload.id, role: payload.role as User['role'], name: '', username: '' };
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getSavedToken();
    if (token && user && user.name === '') {
      authApi.getMe(token).then(res => {
        if (res.status === 200 && res.data) {
          setUser(res.data as any);
        } else if (res.status === 401) {
          clearToken();
          setUser(null);
        }
      }).catch(console.error);
    }
  }, [user?.name]);

  // ─── Staff & Admin: domain email login ─────────────────────────────────────
  const staffLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.staffLogin(email, password);
      if (res.status === 200) {
        saveToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: res.message || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Patient: username + password login ────────────────────────────────────
  const patientLogin = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.patientLogin(username, password);
      if (res.status === 200) {
        setUser(res.data.user);
        saveToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: res.message || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Patient: registration ─────────────────────────────────────────────────
  const patientRegister = useCallback(async (username: string, password: string, name: string, email: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.patientRegister(username, password, name, email);
      if (res.status === 201) {
        // Do NOT set user or token yet. They must verify OTP.
        return { success: true };
      }
      return { success: false, error: res.message || 'Registration failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Patient: Verify OTP ───────────────────────────────────────────────────
  const verifyOTP = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyOTP(email, otp);
      if (res.status === 200) {
        setUser(res.data.user);
        saveToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: res.message || 'OTP verification failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Patient: Resend OTP ───────────────────────────────────────────────────
  const resendOTP = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.resendOTP(email);
      if (res.status === 200) {
        return { success: true };
      }
      return { success: false, error: res.message || 'Failed to resend OTP' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Patient: Google OAuth ─────────────────────────────────────────────────
  const googleAuth = useCallback(async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.googleAuth(credential);
      if (res.status === 200 || res.status === 201) {
        setUser(res.data.user);
        saveToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: res.message || 'Google sign-in failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Forgot Password ────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (res.status === 200) {
        return { success: true, message: res.message };
      }
      return { success: false, error: res.message || 'Failed to send reset code' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Reset Password ────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.resetPassword(email, otp, newPassword);
      if (res.status === 200) {
        return { success: true, message: res.message };
      }
      return { success: false, error: res.message || 'Password reset failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearToken();
  }, []);

  const updateUserPhoto = useCallback((photoUrl: string) => {
    setUser(prev => prev ? { ...prev, photoUrl } : prev);
  }, []);

  const updateUserName = useCallback((name: string) => {
    setUser(prev => prev ? { ...prev, name } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, staffLogin, patientLogin, patientRegister, verifyOTP, resendOTP, googleAuth,
      forgotPassword, resetPassword, logout,
      updateUserPhoto, updateUserName,
      isAuthenticated: !!user, isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
