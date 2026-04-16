import { useLanguage } from '../i18n/LanguageContext';

const TRIGGER_ICONS = { RAIN: '🌧', AQI: '😷', OUTAGE: '⚡', UNKNOWN: '❓' };
const TRIGGER_COLORS = {
  RAIN: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  AQI: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  OUTAGE: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  UNKNOWN: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const PAYOUT_STATUS_STYLES = (t) => ({
  PROCESSED: { color: 'text-emerald-400', dot: 'bg-emerald-500 animate-pulse', label: t('statusActive').split(':')[1]?.trim() || 'UPI Sent' }, // Fallback logic
  PENDING: { color: 'text-amber-400', dot: 'bg-amber-400', label: t('loading') },
  FAILED: { color: 'text-rose-400', dot: 'bg-rose-500', label: 'Failed' }, // Need to add to i18n
});

export default function ClaimCard({ claim }) {
  const { t } = useLanguage();
  const type = claim.triggerEvent?.triggerType || 'UNKNOWN';
  const icon = TRIGGER_ICONS[type] || '❓';
  const colorClass = TRIGGER_COLORS[type] || TRIGGER_COLORS.UNKNOWN;
  const payoutStatus = claim.payout?.payoutStatus || 'PENDING';
  
  // Custom labels for payout status
  const getStatusLabel = (status) => {
     if (status === 'PROCESSED') return t('automatedPayouts').split(' ')[0] + ' ' + (t('lang') === 'en' ? 'Sent' : 'भेजा गया'); // Simple heuristic
     if (status === 'PENDING') return t('loading');
     return status;
  };

  const statusStyle = PAYOUT_STATUS_STYLES(t)[payoutStatus] || PAYOUT_STATUS_STYLES(t).PENDING;

  return (
    <div className="group rounded-[28px] border border-white/5 bg-white/[0.03] p-6 shadow-sm transition hover:shadow-xl hover:border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl ${colorClass}`}>
            {icon}
          </div>
          <div>
             <h3 className="text-sm font-black text-white uppercase tracking-tight">Claim #{claim.id}</h3>
             <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                {type} / {claim.triggerEvent?.zone || '—'}
             </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-black tracking-widest border ${
          claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/20 border-white/10'
        }`}>
          {claim.status}
        </span>
      </div>

      {/* Payout amount */}
      <div className="mt-6 rounded-[24px] bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 px-5 py-4 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{t('automatedPayouts')}</span>
        <p className="text-2xl font-black text-white">₹{Number(claim.payoutAmount || 0).toLocaleString()}</p>
      </div>

      {/* Payout status + Razorpay reference */}
      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t('statusActive').split(':')[0]}</p>
        <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter ${statusStyle.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
          {statusStyle.label}
        </span>
      </div>

      {claim.payout?.razorpayPayoutId && (
        <div className="mt-2 px-1">
          <p className="text-[9px] font-bold text-white/15 uppercase tracking-widest">
            Razorpay Ref: <span className="text-white/30 font-mono">{claim.payout.razorpayPayoutId}</span>
          </p>
        </div>
      )}

      {claim.payout?.failureReason && payoutStatus === 'PENDING' && (
        <div className="mt-2 px-1">
          <p className="text-[9px] text-amber-400/50 italic truncate" title={claim.payout.failureReason}>
            ⏳ {t('loading')} — {claim.payout.failureReason}
          </p>
        </div>
      )}

      {claim.fraudFlag && (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">Fraud Flag</p>
          <p className="mt-1 text-xs text-rose-100">{claim.fraudReason}</p>
        </div>
      )}
    </div>
  );
}
