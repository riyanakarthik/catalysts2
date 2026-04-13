import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import AmbientBackground from '../components/AmbientBackground';
import Logo from '../components/Logo';

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

      setStatus({ type: 'success', message: `Registered ${data.fullName} successfully. Redirecting to login...` });
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
            <div className="mb-6 flex items-center gap-3">
              <Logo size={48} />
              <h1 className="text-3xl font-black text-white">GigShield</h1>
            </div>
            
            <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
               Parametric Coverage MVP
            </span>
            
            <h2 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl">
              {isAdmin ? "Register as an Insurer" : "Join the protection network"}
            </h2>
            
            <p className="mt-6 text-lg leading-relaxed text-white/50">
              {isAdmin 
                ? "Manage payouts, monitor triggers, and scale automated income protection across all gig platforms."
                : "Active-duty gig workers get automated payouts during verified rain, AQI, or platform outages."}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Fast Setup', desc: 'Verified onboarding in under 2 minutes.' },
                { title: 'Zero Forms', desc: 'No claim filing. No paperwork.' },
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
              <h3 className="text-2xl font-black text-white">Create Account</h3>
              <p className="text-sm text-white/40 mt-1">Please provide accurate details for policy activation.</p>
            </div>

            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
              
              <div className="sm:col-span-2">
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} name="fullName" value={form.fullName} onChange={handleChange} required placeholder="John Doe" />
              </div>

              <label className="block">
                <span className={labelClass}>Phone Number</span>
                <input className={inputClass} name="phone" value={form.phone} onChange={handleChange} required placeholder="10-digit mobile" />
              </label>

              <label className="block">
                <span className={labelClass}>Password</span>
                <input className={inputClass} type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
              </label>

              {!isAdmin && (
                <>
                  <label className="block">
                    <span className={labelClass}>City</span>
                    <input className={inputClass} name="city" value={form.city} onChange={handleChange} required placeholder="Bengaluru" />
                  </label>

                  <label className="block">
                    <span className={labelClass}>Zone</span>
                    <input className={inputClass} name="zone" value={form.zone} onChange={handleChange} required placeholder="Koramangala" />
                  </label>

                  <label className="block">
                    <span className={labelClass}>Avg Daily Earnings (₹)</span>
                    <input className={inputClass} type="number" name="avgDailyEarnings" value={form.avgDailyEarnings} onChange={handleChange} required placeholder="500" />
                  </label>

                  <label className="block">
                    <span className={labelClass}>UPI ID</span>
                    <input className={inputClass} name="upiId" value={form.upiId} onChange={handleChange} required placeholder="user@upi" />
                  </label>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Platform</label>
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
                  Create {isAdmin ? "Insurer" : "Worker"} Account
                </button>
                <p className="mt-6 text-center text-sm text-white/40">
                  Already registered?{" "}
                  <button type="button" onClick={() => navigate('/login')} className="font-bold text-indigo-400 hover:text-indigo-300">
                    Sign In
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
