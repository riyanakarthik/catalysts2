import { useLanguage } from '../i18n/LanguageContext';

const PLAN_COLORS = {
  BASIC:    { bg: 'from-slate-600 to-slate-800', badge: 'bg-white/10 text-white' },
  STANDARD: { bg: 'from-indigo-600 to-blue-700', badge: 'bg-white/10 text-white' },
  PREMIUM:  { bg: 'from-violet-600 to-purple-800', badge: 'bg-white/10 text-white' },
};

export default function PolicyCard({ policy }) {
  const { t, lang } = useLanguage();
  const colors = PLAN_COLORS[policy.planType] || PLAN_COLORS.BASIC;
  const isActive = policy.status === 'ACTIVE';

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 transition hover:border-white/20 hover:shadow-xl">
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${colors.bg} p-6 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('policyInForce')}</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight uppercase">{policy.planType}</h3>
          </div>
          <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-black tracking-widest border ${
            isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/10 text-white/40 border-white/10'
          }`}>
            {isActive ? `● ${t('statusActive').split(':')[1]?.trim().split(' ')[0] || 'ACTIVE'}` : policy.status}
          </span>
        </div>
        <p className="mt-4 text-[10px] font-medium opacity-50 uppercase tracking-widest">
           {t('validity')}: {fmt(policy.startDate)} — {fmt(policy.endDate)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-white/[0.02]">
        <div className="p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{t('weeklyRate')}</p>
          <p className="mt-2 text-xl font-black text-white">₹{Number(policy.weeklyPremium).toFixed(2)}</p>
        </div>
        <div className="p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{t('payoutCap')}</p>
          <p className="mt-2 text-xl font-black text-white">₹{Number(policy.maxWeeklyPayout).toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/5 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">
        <span>Risk {policy.riskLevel || 'LOW'}</span>
        <span>Score {typeof policy.riskScore === 'number' ? policy.riskScore.toFixed(2) : '0.00'}</span>
      </div>
    </div>
  );
}
