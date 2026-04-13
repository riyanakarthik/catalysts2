import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getStoredUser } from '../api/auth';
import Logo from '../components/Logo';

const plans = ['BASIC', 'STANDARD', 'PREMIUM'];

const planDetails = {
  BASIC: { desc: 'Essential coverage for major rain & air quality disruptions.', features: ['Rain Protection', 'AQI Alerts'] },
  STANDARD: { desc: 'Comprehensive protection with higher payout limits.', features: ['Rain Protection', 'AQI Alerts', 'Priority Payouts'] },
  PREMIUM: { desc: 'VIP enterprise-grade protection including platform outages.', features: ['Rain Protection', 'AQI Alerts', 'Outage Coverage', 'Max Limits'] },
};

export default function PlanSelectionPage() {

  const user = getStoredUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({ planType: 'BASIC' });
  const [quote, setQuote] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const createPolicy = async () => {
    setLoading(true);
    try {
      if (!user) {
        setMessage("❌ User not logged in");
        return;
      }

      const { data } = await api.post('/policies/create', {
        planType: form.planType,
        activateNow: true 
      });

      setMessage(`✅ Policy activated! Redirecting to dashboard...`);
      setTimeout(() => navigate('/worker'), 1500);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to create policy'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPremiumEstimate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/premium/calculate', {
        planType: form.planType,
        zone: user.zone,
        platform: user.platform
      });
      setQuote(data);
    } catch (error) {
      console.error("Premium calc error", error);
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2 block px-1';
  const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-bold';

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      
      {/* HEADER SECTION */}
      <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        <div className="flex items-center gap-4 mb-6">
          <Logo size={48} />
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Select Your Protection</h2>
        </div>
        <p className="max-w-2xl text-lg leading-relaxed text-white/50">
          GigShield uses AI and hyper-local data to calculate stable, fair premiums. Select a plan to activate your automated income protection.
        </p>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* CONFIGURATION COLUMN */}
        <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-10">
          <div className="mb-10 pb-8 border-b border-white/5">
            <h3 className="text-2xl font-black text-white">Plan Configuration</h3>
            <p className="mt-1 text-sm text-white/40">Select from three tiers of parametric coverage.</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className={labelClass}>Choose a Coverage Tier</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {plans.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setForm({ planType: p }); setQuote(null); }}
                    className={`rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-widest transition duration-300 ${
                      form.planType === p
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8">
              <h4 className="text-lg font-black text-white flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">⚡</span>
                {form.planType} Plan Features
              </h4>
              <p className="mt-3 text-sm text-white/40 italic leading-relaxed">{planDetails[form.planType].desc}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {planDetails[form.planType].features.map(f => (
                  <li key={f} className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter text-indigo-300">
                    {f}
                  </li >
                ))}
              </ul>
            </div>

            <button
              onClick={getPremiumEstimate}
              disabled={loading}
              className="w-full rounded-2xl bg-white text-[#0a0a0f] py-4 text-sm font-black uppercase tracking-widest transition hover:bg-slate-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Calculate Premium Quote'}
            </button>
          </div>
        </section>

        {/* QUOTE COLUMN */}
        <section className="rounded-[40px] border border-indigo-500/10 bg-indigo-500/5 p-8 backdrop-blur-xl shadow-2xl md:p-10 flex flex-col items-center justify-center">
          <div className="w-full text-center mb-8">
             <h3 className="text-2xl font-black text-white">Dynamic Quote</h3>
             <p className="text-sm text-indigo-300/40 mt-1 uppercase tracking-widest font-bold">Powered by ML Oracle</p>
          </div>

          {quote ? (
            <div className="w-full space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] bg-white/5 border border-white/10 p-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Weekly Premium</p>
                  <p className="mt-2 text-4xl font-black text-white">₹{quote.weeklyPremium}</p>
                </div>
                <div className="rounded-[28px] bg-white/5 border border-white/10 p-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Weekly Cap</p>
                  <p className="mt-2 text-4xl font-black text-white">₹{quote.maxWeeklyPayout}</p>
                </div>
              </div>

              {quote.aiReasoning && (
                <div className="rounded-[32px] bg-indigo-600/10 border border-indigo-400/20 p-8 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 px-1">🤖 AI Pricing Insight</p>
                  <p className="text-sm leading-relaxed text-indigo-100 italic">{quote.aiReasoning}</p>
                  <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-indigo-500/20">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Zone Risk</span>
                        <span className="text-white font-bold">{quote.zoneRisk}</span>
                     </div>
                     <div className="flex flex-col border-l border-indigo-500/20 pl-4">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Platform Status</span>
                        <span className="text-white font-bold">{quote.platformReliability}</span>
                     </div>
                  </div>
                </div>
              )}

              <button
                onClick={createPolicy}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 py-5 text-base font-black uppercase tracking-[0.1em] text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                {loading ? 'Activating...' : 'Activate Coverage Policy'}
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-6 mx-auto h-20 w-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse border border-white/10">
                 <span className="text-3xl">📡</span>
              </div>
              <p className="text-white/40 text-sm font-bold leading-relaxed max-w-[220px] mx-auto italic uppercase tracking-widest">
                Awaiting premium calculations for {form.planType} tier
              </p>
            </div>
          )}

          {message && (
            <p className={`mt-8 w-full rounded-2xl px-6 py-4 text-center text-sm font-bold border ${message.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              {message}
            </p>
          )}
        </section>

      </div>
    </div>
  );
}