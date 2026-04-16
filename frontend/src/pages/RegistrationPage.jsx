import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import AmbientBackground from '../components/AmbientBackground';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: '1 uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: '1 lowercase', test: (p) => /[a-z]/.test(p) },
  { label: '1 digit', test: (p) => /\d/.test(p) },
  { label: '1 special char', test: (p) => /[!@#$%^&*()_\-+={}\[\]|:;"'<>,.?/~`]/.test(p) },
];

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}$/;

const initialState = {
  fullName: '',
  phone: '',
  platform: 'ZOMATO',
  city: 'Bengaluru',
  zone: 'Koramangala',
  avgDailyEarnings: '',
  upiId: '',
  password: ''
};

export default function RegistrationPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialState);
  const navigate = useNavigate();

  const selectedRole = localStorage.getItem("selectedRole") || "WORKER";
  const isAdmin = selectedRole === "ADMIN";

  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const normalizedPhone = form.phone.replace(/\D/g, '');

    if (normalizedPhone.length !== 10) {
      setStatus({ type: 'error', message: 'Phone number must contain exactly 10 digits.' });
      return;
    }

    // Password validation
    const allPasswordRulesPass = PASSWORD_RULES.every(r => r.test(form.password));
    if (!allPasswordRulesPass) {
      setStatus({ type: 'error', message: 'Password does not meet all requirements.' });
      return;
    }

    // UPI validation (workers only)
    if (!isAdmin && !UPI_REGEX.test(form.upiId.trim())) {
      setStatus({ type: 'error', message: 'Invalid UPI ID. Use format: username@provider (e.g. rahul@oksbi)' });
      return;
    }

    try {
      const payload = {
        ...form,
        role: selectedRole?.toUpperCase(),
        fullName: form.fullName.trim(),
        phone: normalizedPhone,
        ...( !isAdmin && {
          platform: form.platform.toUpperCase(),
          city: form.city.trim(),
          zone: form.zone.trim(),
          avgDailyEarnings: Number(form.avgDailyEarnings),
          upiId: form.upiId.trim()
        })
      };

      const { data } = await api.post('/users/register', payload);

      setStatus({ type: 'success', message: `${t('appName')} - Registered ${data.fullName} successfully. Redirecting...` });
      setForm(initialState);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Registration failed' });
    }
  };

  const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-2 px-1';
  const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder-white/20 transition focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10';

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          
          {/* Left Side: Branding / Info */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size={48} />
                <h1 className="text-3xl font-black text-white">{t('appName')}</h1>
              </div>
              <LanguageSwitcher />
            </div>
            
            <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
               {t('heroBadge')}
            </span>
            
            <h2 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl">
              {isAdmin ? t('registerAdminTitle') : t('registerWorkerTitle')}
            </h2>
            
            <p className="mt-6 text-lg leading-relaxed text-white/50">
              {isAdmin 
                ? t('registerAdminDesc')
                : t('registerWorkerDesc')}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { title: t('fastSetup'), desc: t('fastSetupDesc') },
                { title: t('zeroForms'), desc: t('zeroFormsDesc') },
              ].map(f => (
                <div key={f.title} className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                  <h3 className="font-bold text-white">{f.title}</h3>
                  <p className="mt-1 text-sm text-white/40">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-white">{t('createAccountTitle')}</h3>
              <p className="text-sm text-white/40 mt-1">{t('createAccountDesc')}</p>
            </div>

            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
              
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('fullName')}</label>
                <input className={inputClass} name="fullName" value={form.fullName} onChange={handleChange} required placeholder="John Doe" />
              </div>

              <label className="block">
                <span className={labelClass}>{t('phoneNumber')}</span>
                <input className={inputClass} name="phone" value={form.phone} onChange={handleChange} required placeholder="10-digit mobile" />
              </label>

              <label className="block">
                <span className={labelClass}>{t('password')}</span>
                <input className={inputClass} type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Min 8 chars, Aa1!" />
                {form.password.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                    {PASSWORD_RULES.map(r => (
                      <span
                        key={r.label}
                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          r.test(form.password)
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-white/25'
                        }`}
                      >
                        {r.test(form.password) ? '✓' : '○'} {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </label>

              {!isAdmin && (
                <>
                  <label className="block">
                    <span className={labelClass}>{t('city')}</span>
                    <input className={inputClass} name="city" value={form.city} onChange={handleChange} required placeholder="Bengaluru" />
                  </label>

                  <label className="block">
                    <span className={labelClass}>{t('zone')}</span>
                    <input className={inputClass} name="zone" value={form.zone} onChange={handleChange} required placeholder="Koramangala" />
                  </label>

                  <label className="block">
                    <span className={labelClass}>{t('avgDailyEarnings')}</span>
                    <input className={inputClass} type="number" name="avgDailyEarnings" value={form.avgDailyEarnings} onChange={handleChange} required placeholder="500" />
                  </label>

                  <label className="block">
                    <span className={labelClass}>{t('upiId')}</span>
                    <input className={inputClass} name="upiId" value={form.upiId} onChange={handleChange} required placeholder="username@oksbi" />
                    {form.upiId.length > 0 && (
                      <p className={`mt-1.5 px-1 text-[10px] font-bold ${
                        UPI_REGEX.test(form.upiId.trim())
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}>
                        {UPI_REGEX.test(form.upiId.trim()) ? '✓ Valid UPI format' : '✕ Format: username@provider'}
                      </p>
                    )}
                  </label>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>{t('platform')}</label>
                    <select className={inputClass} name="platform" value={form.platform} onChange={handleChange}>
                      <option value="ZOMATO">Zomato</option>
                      <option value="SWIGGY">Swiggy</option>
                    </select>
                  </div>
                </>
              )}

              <div className="mt-4 sm:col-span-2">
                <button
                  className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-500 hover:-translate-y-0.5"
                  type="submit"
                >
                  {isAdmin ? t('createInsurerAccount') : t('createWorkerAccount')}
                </button>
                <p className="mt-6 text-center text-sm text-white/40">
                  {t('alreadyRegistered')}{" "}
                  <button type="button" onClick={() => navigate('/login')} className="font-bold text-indigo-400 hover:text-indigo-300">
                    {t('signIn')}
                  </button>
                </p>
              </div>
            </form>

            {status.message && (
              <p className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
                status.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
              }`}>
                {status.type === 'success' ? '✅' : '❌'} {status.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
