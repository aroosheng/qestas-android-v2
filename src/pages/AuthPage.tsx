import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, User as UserIcon, Phone, MapPin, Scale, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCMS } from '@/contexts/CMSContext';
import { IRAN_PROVINCES } from '@/types/database';
import { Logo } from '@/components/auth/FileUploadField';

type AuthMode = 'login' | 'register';
type AccountType = 'user' | 'lawyer';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, login, register } = useAuth(); // استفاده از توابع جدید
  const { getText } = useCMS();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  useEffect(() => {
    if (session) {
      const from = (location.state as { from?: string })?.from;
      navigate(from ?? '/', { replace: true });
    }
  }, [session, navigate, location]);

  const resetForm = () => {
    setEmail(''); setPassword('');
    setFirstName(''); setLastName(''); setPhoneNumber('');
    setProvince(''); setCity(''); setLicenseNumber('');
    setError(''); setSuccess('');
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('ایمیل و رمز عبور الزامی هستند');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'خطا در ورود');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('نام و نام خانوادگی الزامی هستند');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('ایمیل و رمز عبور الزامی هستند');
      return;
    }
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (accountType === 'lawyer' && !licenseNumber.trim()) {
      setError('شماره پروانه وکالت الزامی است');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim() || null,
        province: province || null,
        city: city.trim() || null,
        role: accountType === 'lawyer' ? 'lawyer' : 'user',
        license_number: accountType === 'lawyer' ? licenseNumber.trim() : null,
      };

      const res = await register(payload);
      if (res.success) {
        setSuccess('حساب کاربری با موفقیت ایجاد شد.');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } else {
        setError(res.error || 'خطا در ثبت‌نام');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const canRegisterAsLawyer = true; // به طور موقت برای تست فعال کردیم
  const showLawyerFields = authMode === 'register' && accountType === 'lawyer' && canRegisterAsLawyer;

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-950 to-primary-950/30" />
      
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-surface-900/80 backdrop-blur-xl border border-surface-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Mode toggle */}
          <div className="flex border-b border-surface-800">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                authMode === 'login' ? 'text-primary-400 bg-primary-950/30' : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              ورود
              {authMode === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                authMode === 'register' ? 'text-primary-400 bg-primary-950/30' : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              ثبت‌نام
              {authMode === 'register' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Account type toggle (register only) */}
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setAccountType('user'); setError(''); }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                    accountType === 'user' ? 'bg-primary-600 border-primary-500 text-white' : 'bg-surface-800 border-surface-700 text-surface-400'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  کاربر عادی
                </button>
                <button
                  onClick={() => { setAccountType('lawyer'); setError(''); }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                    accountType === 'lawyer' ? 'bg-accent-600 border-accent-500 text-white' : 'bg-surface-800 border-surface-700 text-surface-400'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  وکیل
                </button>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300">{success}</p>
              </div>
            )}

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField icon={<Mail className="w-4 h-4" />} placeholder="ایمیل" value={email} onChange={setEmail} type="email" />
                <InputField icon={<Lock className="w-4 h-4" />} placeholder="رمز عبور" value={password} onChange={setPassword} type="password" />
                <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ورود به حساب'}
                </button>
              </form>
            )}

            {/* Register Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField icon={<UserIcon className="w-4 h-4" />} placeholder="نام" value={firstName} onChange={setFirstName} />
                  <InputField icon={<UserIcon className="w-4 h-4" />} placeholder="نام خانوادگی" value={lastName} onChange={setLastName} />
                </div>
                <InputField icon={<Mail className="w-4 h-4" />} placeholder="ایمیل" value={email} onChange={setEmail} type="email" />
                <InputField icon={<Lock className="w-4 h-4" />} placeholder="رمز عبور" value={password} onChange={setPassword} type="password" />
                <InputField icon={<Phone className="w-4 h-4" />} placeholder="شماره تلفن" value={phoneNumber} onChange={setPhoneNumber} type="tel" />
                
                <div className="grid grid-cols-2 gap-3">
                  <SelectField icon={<MapPin className="w-4 h-4" />} placeholder="استان" value={province} onChange={setProvince} options={IRAN_PROVINCES} />
                  <InputField icon={<MapPin className="w-4 h-4" />} placeholder="شهر" value={city} onChange={setCity} />
                </div>

                {showLawyerFields && (
                  <div className="space-y-4 pt-2 border-t border-surface-800">
                    <div className="flex items-center gap-2 text-accent-400">
                      <Scale className="w-4 h-4" />
                      <span className="text-sm font-medium">اطلاعات حرفه‌ای وکیل</span>
                    </div>
                    <InputField icon={<span className="text-xs font-bold">#</span>} placeholder="شماره پروانه وکالت" value={licenseNumber} onChange={setLicenseNumber} />
                    <p className="text-xs text-surface-500">آپلود مدارک در مرحله بعد اضافه می‌شود.</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : accountType === 'lawyer' ? 'ثبت‌نام به عنوان وکیل' : 'ساخت حساب کاربری'}
                </button>
              </form>
            )}
          </div>
        </div>

        <button onClick={() => navigate('/')} className="mt-6 mx-auto flex items-center gap-2 text-sm text-surface-500 hover:text-surface-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به صفحه اصلی
        </button>
      </div>
    </div>
  );
}

// کامپوننت‌های ورودی (بدون تغییر)
function InputField({ icon, placeholder, value, onChange, type = 'text' }: any) {
  return (
    <div className="relative">
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none">{icon}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-surface-800/80 border border-surface-700 rounded-xl py-3 pr-10 pl-4 text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-primary-600 transition-all" />
    </div>
  );
}

function SelectField({ icon, placeholder, value, onChange, options }: any) {
  return (
    <div className="relative">
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none z-10">{icon}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-surface-800/80 border border-surface-700 rounded-xl py-3 pr-10 pl-4 text-white text-sm focus:outline-none focus:border-primary-600 appearance-none cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((opt: string) => <option key={opt} value={opt} className="bg-surface-800">{opt}</option>)}
      </select>
    </div>
  );
}