import { useEffect } from 'react';
import { Heart, CalendarDays, Users, ArrowRight, Activity, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface WelcomePageProps {
  onNavigate: (mode: 'login' | 'register') => void;
}

export default function WelcomePage({ onNavigate }: WelcomePageProps) {
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

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-teal-500 selection:text-white">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-4 py-4 md:px-6 md:py-6 lg:px-12 flex justify-between items-center backdrop-blur-sm bg-white/10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">MedSchedule</span>
        </div>
        <div className="flex items-center gap-4">
          <div id="google_translate_header_target" className="hidden sm:block"></div>
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-2.5 text-slate-900 font-semibold hover:text-teal-600 transition-colors"
          >
            <span>Sign In</span>
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-full shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <span>Get Started</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hospital_welcome_bg.png"
            alt="Medical Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-transparent backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-medium text-sm mb-6 shadow-sm">
              <Activity className="w-4 h-4" />
              <span>Modern Healthcare Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              <span>Simplifying</span>{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">hospital schedules</span>{' '}<span>for everyone</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg md:max-w-xl">
              <span>MedSchedule connects patients, doctors, and nurses through a seamless, real-time scheduling platform </span><span>Experience healthcare coordination without the wait</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => onNavigate('register')}
                className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-base md:text-lg font-semibold rounded-full shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                <span>Register as Patient</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-3 md:px-8 md:py-4 bg-white text-slate-900 text-base md:text-lg font-semibold rounded-full shadow-md border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <span>Staff Portal</span>
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-500" /> <span>Secure Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> <span>24/7 Access</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            {/* Floating Glass Cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-blue-500/10 to-teal-500/10 blur-3xl -z-10 rounded-full animate-pulse-soft"></div>

            <div className="relative z-10 grid gap-6 animate-fade-scale">
              <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-6 transform hover:-translate-y-2 transition-transform">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900"><span>Real-time Schedules</span></h3>
                    <p className="text-sm text-slate-500"><span>Always up to date</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-6 ml-12 transform hover:-translate-y-2 transition-transform delay-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900"><span>Find Your Doctor</span></h3>
                    <p className="text-sm text-slate-500"><span>Know exactly who is on duty</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-6 mr-12 transform hover:-translate-y-2 transition-transform delay-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900"><span>Department Tracking</span></h3>
                    <p className="text-sm text-slate-500"><span>Navigate departments easily</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
