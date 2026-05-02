import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Heart, Eye, EyeOff, UserPlus, LogIn, Mail, User as UserIcon, KeyRound, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

type Mode = 'login' | 'register' | 'otp' | 'forgot-password' | 'reset-password';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { staffLogin, patientLogin, patientRegister, verifyOTP, resendOTP, googleAuth, forgotPassword, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');

  // Form state
  const [identifier, setIdentifier] = useState(''); // Used for Login (Email or Username)
  const [username, setUsername] = useState(''); // Used for Register
  const [email, setEmail] = useState(''); // Used for Register & OTP & Forgot Password
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // Used for Register
  const [otp, setOtp] = useState(''); // Used for OTP & Reset Password

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE',
          callback: handleGoogleCredentialResponse
        });
        if (googleButtonContainerRef.current) {
          googleButtonContainerRef.current.innerHTML = ''; // Prevent duplicates on re-render
          window.google.accounts.id.renderButton(
            googleButtonContainerRef.current,
            { theme: 'outline', size: 'large', text: 'continue_with', width: 300 }
          );
        }
        if (intervalId) clearInterval(intervalId);
      }
    };

    initGoogle();

    // Fallback if not loaded yet
    if (!window.google) {
      intervalId = setInterval(initGoogle, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode]);

  useEffect(() => {
    // Teleport the Google Translate widget from the body into the header
    const translateWidget = document.getElementById('google_translate_element');
    const headerTarget = document.getElementById('google_translate_header_target');
    
    if (translateWidget && headerTarget) {
      translateWidget.style.position = 'static';
      headerTarget.appendChild(translateWidget);
    }
    
    return () => {
      // Put it back to the body when component unmounts
      if (translateWidget) {
        translateWidget.style.position = 'fixed';
        translateWidget.style.bottom = '16px';
        translateWidget.style.left = '16px';
        document.body.appendChild(translateWidget);
      }
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    setError('');
    setIsLoading(true);
    const result = await googleAuth(response.credential);
    if (result.success) {
      onLogin();
    } else {
      setError(result.error || 'Google Sign-In failed');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      let result;

      if (mode === 'login') {
        // Automatically route to staff or patient auth based on whether it looks like an email
        const isStaff = identifier.trim().includes('@');
        if (isStaff) {
          result = await staffLogin(identifier.trim(), password);
        } else {
          result = await patientLogin(identifier.trim(), password);
        }

        if (result && result.success) {
          onLogin();
        } else {
          // Special handling if email is not verified
          if (result?.error?.includes('verify your email')) {
            setEmail(identifier.trim()); // Set email for OTP flow
            setMode('otp');
            setSuccessMsg('Please enter the OTP sent to your email to continue.');
          } else {
            setError(result?.error || 'Authentication failed');
          }
        }
      } else if (mode === 'register') {
        // Registration is strictly for patients
        result = await patientRegister(username.trim(), password, name.trim(), email.trim());
        if (result && result.success) {
          setMode('otp');
          setSuccessMsg('Registration successful! Please check your email for the verification code.');
        } else {
          setError(result?.error || 'Registration failed');
        }
      } else if (mode === 'otp') {
        result = await verifyOTP(email.trim(), otp.trim());
        if (result && result.success) {
          onLogin();
        } else {
          setError(result?.error || 'OTP Verification failed');
        }
      } else if (mode === 'forgot-password') {
        result = await forgotPassword(email.trim());
        if (result && result.success) {
          setMode('reset-password');
          setSuccessMsg(result.message || 'If an account exists with this email, a reset code has been sent.');
          setOtp('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setError(result?.error || 'Failed to send reset code');
        }
      } else if (mode === 'reset-password') {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        result = await resetPassword(email.trim(), otp.trim(), newPassword);
        if (result && result.success) {
          setMode('login');
          resetForm();
          setSuccessMsg(result.message || 'Password reset successfully! You can now log in.');
        } else {
          setError(result?.error || 'Password reset failed');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    const result = await resendOTP(email.trim());
    if (result && result.success) {
      setSuccessMsg('A new OTP has been sent to your email.');
    } else {
      setError(result?.error || 'Failed to resend OTP');
    }
    setIsLoading(false);
  };

  const handleResendResetCode = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    const result = await forgotPassword(email.trim());
    if (result && result.success) {
      setSuccessMsg('A new reset code has been sent to your email.');
    } else {
      setError(result?.error || 'Failed to resend code');
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setIdentifier('');
    setUsername('');
    setEmail('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setName('');
    setOtp('');
    setError('');
    setSuccessMsg('');
  };

  const toggleView = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  // ── Mode-specific header text ──
  const headings: Record<Mode, { title: string; subtitle: string }> = {
    'login': { title: 'Welcome Back', subtitle: 'Sign in to access your dashboard' },
    'register': { title: 'Create Account', subtitle: 'Join MedSchedule to manage your healthcare' },
    'otp': { title: 'Verify Email', subtitle: 'Enter the 6-digit code sent to your email' },
    'forgot-password': { title: 'Forgot Password', subtitle: 'Enter your email to receive a reset code' },
    'reset-password': { title: 'Reset Password', subtitle: 'Enter the code and your new password' },
  };

  // ── Mode-specific button text & icon ──
  const buttonConfig: Record<Mode, { label: string; icon: JSX.Element }> = {
    'login': { label: 'Sign In', icon: <LogIn className="w-5 h-5" /> },
    'register': { label: 'Create Account', icon: <UserPlus className="w-5 h-5" /> },
    'otp': { label: 'Verify OTP', icon: <Shield className="w-5 h-5" /> },
    'forgot-password': { label: 'Send Reset Code', icon: <Mail className="w-5 h-5" /> },
    'reset-password': { label: 'Reset Password', icon: <KeyRound className="w-5 h-5" /> },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        <div id="google_translate_header_target"></div>
      </div>
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 relative z-10 animate-fade-scale shadow-2xl rounded-3xl overflow-hidden bg-white">

        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 to-indigo-800 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">MedSchedule</h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              A unified platform for healthcare professionals and patients.
              Manage schedules, book appointments, and coordinate care seamlessly.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <Shield className="w-6 h-6 text-blue-200" />
                <div>
                  <h3 className="font-semibold">For Staff & Admins</h3>
                  <p className="text-sm text-blue-200">Log in using your email and password</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <UserIcon className="w-6 h-6 text-blue-200" />
                <div>
                  <h3 className="font-semibold">For Patients</h3>
                  <p className="text-sm text-blue-200">Use your standard username or Google Auth</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-12 relative bg-white">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {headings[mode].title}
            </h2>
            <p className="text-gray-500">
              {headings[mode].subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP specific fields */}
            {mode === 'otp' && (
              <div className="animate-fade-up">
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="------" maxLength={6} required />
                <p className="text-sm text-gray-500 mt-3 text-center">Code sent to {email}</p>
              </div>
            )}

            {/* Forgot Password — email input */}
            {mode === 'forgot-password' && (
              <div className="animate-fade-up">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="Enter your account email" required />
                </div>
              </div>
            )}

            {/* Reset Password — OTP + new password + confirm */}
            {mode === 'reset-password' && (
              <>
                <div className="animate-fade-up">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reset Code</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="------" maxLength={6} required />
                  <p className="text-sm text-gray-500 mt-3 text-center">Code sent to {email}</p>
                </div>

                <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 pr-12" placeholder="Min 6 characters" required minLength={6} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 pr-12" placeholder="Re-enter new password" required minLength={6} />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </>
            )}

            {/* Registration specific fields */}
            {mode === 'register' && (
              <>
                <div className="animate-fade-up">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="Amanuel Girma" required />
                </div>

                <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="you@example.com" required />
                  </div>
                </div>

                <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="Choose a username" required />
                  </div>
                </div>
              </>
            )}

            {/* Login specific fields */}
            {mode === 'login' && (
              <div className="animate-fade-up">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email or Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="Email or Username" required />
                </div>
              </div>
            )}

            {/* Password (Shared between Login and Register) */}
            {(mode === 'login' || mode === 'register') && (
              <div className="animate-fade-up" style={{ animationDelay: mode === 'login' ? '0.1s' : '0.3s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 pr-12" placeholder={mode === 'login' ? "Enter your password" : "Create a password (min 6. chars)"} required minLength={mode === 'register' ? 6 : undefined} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Forgot password link — only on login mode */}
                {mode === 'login' && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setMode('forgot-password'); }}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                <Mail className="w-4 h-4 flex-shrink-0" /> {successMsg}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                <Shield className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 animate-fade-up shadow-blue-500/25 shadow-lg" style={{ animationDelay: mode === 'login' ? '0.2s' : '0.4s' }}>
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <>{buttonConfig[mode].icon} {buttonConfig[mode].label}</>
              )}
            </button>
            
            {/* Resend OTP for email verification */}
            {mode === 'otp' && (
              <div className="text-center mt-4">
                <button type="button" onClick={handleResendOTP} disabled={isLoading} className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50">
                  Didn't receive code? Resend
                </button>
              </div>
            )}

            {/* Resend code for password reset */}
            {mode === 'reset-password' && (
              <div className="text-center mt-4">
                <button type="button" onClick={handleResendResetCode} disabled={isLoading} className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50">
                  Didn't receive code? Resend
                </button>
              </div>
            )}
          </form>

          {/* Google OAuth — only on login/register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <div className="mt-4 flex justify-center w-full">
                <div ref={googleButtonContainerRef} className="w-full flex justify-center"></div>
              </div>
            </div>
          )}

          {/* Toggle View — Login ↔ Register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-8 text-center text-sm text-gray-600 animate-fade-up" style={{ animationDelay: mode === 'login' ? '0.4s' : '0.5s' }}>
              {mode === 'login' ? "Don't have a patient account? " : "Already have an account? "}
              <button type="button" onClick={toggleView} className="font-semibold text-blue-600 hover:underline">
                {mode === 'login' ? 'Register here' : 'Sign in instead'}
              </button>
            </div>
          )}
          
          {/* Back to Login — for OTP, Forgot Password, Reset Password */}
          {(mode === 'otp' || mode === 'forgot-password' || mode === 'reset-password') && (
            <div className="mt-8 text-center text-sm text-gray-600 animate-fade-up">
              <button type="button" onClick={() => { resetForm(); setMode('login'); }} className="font-semibold text-gray-600 hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
