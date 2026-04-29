import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Heart, Eye, EyeOff, UserPlus, LogIn, Mail, User as UserIcon } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { staffLogin, patientLogin, patientRegister, googleAuth } = useAuth();

  const [isLoginView, setIsLoginView] = useState(true); // true = login, false = register

  // Form state
  const [identifier, setIdentifier] = useState(''); // Used for Login (Email or Username)
  const [username, setUsername] = useState(''); // Used for Register
  const [email, setEmail] = useState(''); // Used for Register
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Used for Register

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
          window.google.accounts.id.renderButton(
            googleButtonContainerRef.current,
            { theme: 'outline', size: 'large', text: 'continue_with', width: '100%' }
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
  }, [isLoginView]);

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
    setIsLoading(true);

    try {
      let result;

      if (isLoginView) {
        // Automatically route to staff or patient auth based on whether it looks like an email
        const isStaff = identifier.trim().includes('@');
        if (isStaff) {
          result = await staffLogin(identifier.trim(), password);
        } else {
          result = await patientLogin(identifier.trim(), password);
        }
      } else {
        // Registration is strictly for patients
        result = await patientRegister(username.trim(), password, name.trim(), email.trim() || undefined);
      }

      if (result && result.success) {
        onLogin();
      } else {
        setError(result?.error || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIdentifier('');
    setUsername('');
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700">
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
              {isLoginView ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500">
              {isLoginView
                ? 'Sign in to access your dashboard'
                : 'Join MedSchedule to manage your healthcare'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Registration specific fields */}
            {!isLoginView && (
              <>
                <div className="animate-fade-up">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="Amanuel Girma" required />
                </div>

                <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900" placeholder="you@example.com" />
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
            {isLoginView && (
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

            {/* Password (Shared) */}
            <div className="animate-fade-up" style={{ animationDelay: isLoginView ? '0.1s' : '0.3s' }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 pr-12" placeholder={isLoginView ? "Enter your password" : "Create a password (min 6. chars)"} required minLength={!isLoginView ? 6 : undefined} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                <Shield className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 animate-fade-up shadow-blue-500/25 shadow-lg" style={{ animationDelay: isLoginView ? '0.2s' : '0.4s' }}>
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <>{!isLoginView ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />} {!isLoginView ? 'Create Account' : 'Sign In'}</>
              )}
            </button>
          </form>

          {/* Google OAuth */}
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

          {/* Toggle View */}
          <div className="mt-8 text-center text-sm text-gray-600 animate-fade-up" style={{ animationDelay: isLoginView ? '0.4s' : '0.5s' }}>
            {isLoginView ? "Don't have a patient account? " : "Already have an account? "}
            <button type="button" onClick={toggleView} className="font-semibold text-blue-600 hover:underline">
              {isLoginView ? 'Register here' : 'Sign in instead'}
            </button>
          </div>



        </div>
      </div>
    </div>
  );
}
