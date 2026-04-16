import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { getStoredUser } from '../api/auth';
import { useLanguage } from '../i18n/LanguageContext';

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data, color = '#6366f1' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const chartH = 120;
  const barW = 40;
  const gap = 16;
  const totalW = data.length * (barW + gap);

  return (
    <svg viewBox={`0 -10 ${totalW} ${chartH + 46}`} className="w-full drop-shadow-sm">
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * chartH, 4);
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx="8" fill={color} opacity="0.9" className="transition-all duration-300 hover:opacity-100" />
            <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize="12" fontWeight="900" fill="white">
              {d.value}
            </text>
            <text x={x + barW / 2} y={chartH + 24} textAnchor="middle" fontSize="10" fontWeight="700" fill="white" opacity="0.4" className="uppercase tracking-widest">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 50; const cx = 70; const cy = 70;
  let cumulative = 0;

  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;

    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: colors[i % colors.length], label: d.label, value: d.value, pct };
  });

  return (
    <div className="flex items-center gap-10">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0 drop-shadow-xl">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="white" opacity="0.05" />
        ) : (
          slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} opacity="0.85" className="hover:opacity-100 transition-opacity" />
          ))
        )}
        <circle cx={cx} cy={cy} r={32} fill="#11111a" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="900" fill="white">{total}</text>
      </svg>
      <div className="flex flex-col gap-3">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: s.color }} />
            <span className="font-bold text-white/50 uppercase tracking-tighter">{s.label}</span>
            <span className="font-black text-white ml-auto border-l border-white/5 pl-4">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-600/20 to-indigo-800/10 border-indigo-500/20 text-indigo-300',
    emerald: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 text-emerald-300',
    rose: 'from-rose-600/20 to-rose-800/10 border-rose-500/20 text-rose-300',
    amber: 'from-amber-600/20 to-amber-800/10 border-amber-500/20 text-amber-300',
  };
  return (
    <div className={`rounded-[32px] border bg-gradient-to-br ${colors} p-8 backdrop-blur-xl transition hover:border-white/20 hover:scale-[1.02] duration-300`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 underline underline-offset-4 decoration-current/30">{label}</p>
      <p className="mt-4 text-4xl font-black tracking-tight text-white">{value}</p>
      {sub && <p className="mt-2 text-xs font-bold opacity-40">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [triggerForm, setTriggerForm] = useState({ triggerType: 'RAIN', zone: 'Koramangala', severity: 'high' });
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [userRes, claimRes] = await Promise.all([api.get('/users'), api.get('/claims')]);
      setUsers(userRes.data.filter(u => u.role === 'WORKER'));
      setClaims(claimRes.data);
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 15s to capture cron-generated claims
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const simulate = async () => {
    try {
      const { data } = await api.post('/triggers/simulate', { ...triggerForm, source: 'admin-dashboard' });
      setMessage(`✅ Trigger created. ${data.generatedClaimsCount} claim(s) generated.`);
      loadData();
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Failed to simulate trigger'}`);
    }
  };

  // ── Analytics ──
  const workers = users;
  const activePolicies = workers.reduce((a, u) => a + (u.policies?.filter(p => p.status === 'ACTIVE').length || 0), 0);
  const totalPaidOut = claims.reduce((s, c) => s + (c.payoutAmount || 0), 0);
  const approvedClaims = claims.filter(c => c.status === 'APPROVED').length;

  const triggerCounts = [
    { label: t('heavyRain'), value: claims.filter(c => c.triggerEvent?.triggerType === 'RAIN').length },
    { label: t('aqiAlert'), value: claims.filter(c => c.triggerEvent?.triggerType === 'AQI').length },
    { label: t('platformOutage'), value: claims.filter(c => c.triggerEvent?.triggerType === 'OUTAGE').length }
  ];

  const platformCounts = [
    { label: 'Zomato', value: workers.filter(u => u.platform === 'ZOMATO').length },
    { label: 'Swiggy', value: workers.filter(u => u.platform === 'SWIGGY').length },
  ];

  const allZones = [...new Set(workers.map(u => u.zone).filter(Boolean))];
  const zoneCounts = allZones.map(z => ({ label: z, value: workers.filter(u => u.zone === z).length }));

  const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/20 transition focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold';

  return (
    <div className="space-y-10">

      {/* HEADER SECTION */}
      <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">{t('insurerConsole')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
               {t('opsCenter')}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/50">
              {t('adminSubtitle')}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <span className={`${refreshing ? 'animate-spin' : ''}`}>↻</span>
            {refreshing ? t('polling') : t('syncLiveData')}
          </button>
        </div>

        {/* SIMULATOR CONTROLS */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select className={inputClass} value={triggerForm.triggerType} onChange={e => setTriggerForm(p => ({ ...p, triggerType: e.target.value }))}>
            <option value="RAIN">🌧 {t('heavyRain')}</option>
            <option value="AQI">😷 {t('aqiAlert')}</option>
            <option value="OUTAGE">⚡ {t('platformOutage')}</option>
          </select>
          <input className={inputClass} value={triggerForm.zone} onChange={e => setTriggerForm(p => ({ ...p, zone: e.target.value }))} placeholder={t('targetZone')} />
          <select className={inputClass} value={triggerForm.severity} onChange={e => setTriggerForm(p => ({ ...p, severity: e.target.value }))}>
            <option value="low">{t('severity')}: {t('low')}</option>
            <option value="medium">{t('severity')}: {t('medium')}</option>
            <option value="high">{t('severity')}: {t('high')}</option>
          </select>
          <button className="rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition shadow-xl shadow-indigo-600/30 active:scale-95" onClick={simulate}>
            {t('simulateTrigger')}
          </button>
        </div>
        {message && <p className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4 text-sm font-bold text-emerald-400">{message}</p>}
      </section>

      {/* ANALYTICS ROW */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('regWorkers')} value={workers.length} sub={t('networkDirectory')} accent="indigo" />
        <StatCard label={t('statActivePolicies')} value={activePolicies} sub={t('inForce')} accent="emerald" />
        <StatCard label={t('liveClaims')} value={claims.length} sub={`${approvedClaims} Status: Clear`} accent="amber" />
        <StatCard label={t('netPayoutFlow')} value={`₹${Math.round(totalPaidOut).toLocaleString()}`} sub={t('automatedPayouts')} accent="rose" />
      </section>

      {/* CHARTS LAYER */}
      <section className="grid gap-8 xl:grid-cols-3">
        {/* Claims by Trigger */}
        <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">{t('disruptionSplit')}</h3>
            <p className="mt-1 text-xl font-black text-white">{t('liveClaims')}</p>
          </div>
          <div>
            {claims.length === 0
              ? <div className="h-32 flex items-center justify-center text-xs font-bold text-white/20 uppercase tracking-widest">Awaiting Trigger Data</div>
              : <BarChart data={triggerCounts} color="#6366f1" />}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">{t('networkShare')}</h3>
            <p className="mt-1 text-xl font-black text-white">{t('platform')}</p>
          </div>
          <div>
            {workers.length === 0
              ? <div className="h-32 flex items-center justify-center text-xs font-bold text-white/20 uppercase tracking-widest">Empty User Directory</div>
              : <DonutChart data={platformCounts} colors={['#f97316', '#10b981']} />}
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">{t('regionalDensity')}</h3>
            <p className="mt-1 text-xl font-black text-white">{t('zone')}</p>
          </div>
          <div>
            {zoneCounts.length === 0
              ? <div className="h-32 flex items-center justify-center text-xs font-bold text-white/20 uppercase tracking-widest">Awaiting Registration</div>
              : <BarChart data={zoneCounts} color="#10b981" />}
          </div>
        </div>
      </section>

      {/* TABLES LAYER */}
      <div className="grid gap-10">
        
        {/* WORKERS TABLE */}
        <section className="rounded-[40px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl overflow-hidden">
          <h3 className="text-2xl font-black text-white px-2">{t('networkDirectory')}</h3>
          <div className="mt-8 overflow-auto rounded-3xl border border-white/5">
            <table className="w-full min-w-[760px] text-sm text-left">
              <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40">
                <tr>
                  <th className="px-6 py-5">{t('verifiedName')}</th>
                  <th className="px-6 py-5">{t('platform')}</th>
                  <th className="px-6 py-5">{t('zone')}</th>
                  <th className="px-6 py-5">{t('avgDailyEarnings')}</th>
                  <th className="px-6 py-5 text-right">{t('inForce')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {workers.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 font-bold text-white">{u.fullName}</td>
                    <td className="px-6 py-5 text-indigo-300 font-bold">{u.platform}</td>
                    <td className="px-6 py-5 tracking-tight">{u.zone}</td>
                    <td className="px-6 py-5 font-mono">₹{u.avgDailyEarnings}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black ${u.policies?.some(p=>p.status==='ACTIVE') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                        {u.policies?.filter(p => p.status === 'ACTIVE').length || 0} {t('statusActive').split(':')[1]?.trim().split(' ')[0]}
                      </span>
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-white/20 font-black uppercase tracking-widest">No worker data records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* CLAIMS TABLE */}
        <section className="rounded-[40px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl overflow-hidden">
          <h3 className="text-2xl font-black text-white px-2">{t('settlementFeed')}</h3>
          <div className="mt-8 overflow-auto rounded-3xl border border-white/5">
            <table className="w-full min-w-[950px] text-sm text-left">
              <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40">
                <tr>
                  <th className="px-6 py-5">{t('claimId')}</th>
                  <th className="px-6 py-5">{t('workerEntity')}</th>
                  <th className="px-6 py-5">{t('triggerHistory').split(' ')[0]}</th>
                  <th className="px-6 py-5">{t('volume')}</th>
                  <th className="px-6 py-5">{t('logicStatus')}</th>
                  <th className="px-6 py-5 text-right">{t('payoutState')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {claims.map(claim => (
                  <tr key={claim.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 font-mono text-xs opacity-50">#{claim.id}</td>
                    <td className="px-6 py-5 font-bold text-white">{claim.user?.fullName || '—'}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-black tracking-tighter">
                        {claim.triggerEvent?.triggerType || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black text-white">₹{claim.payoutAmount?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-5">
                       <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase border ${claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                         {claim.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-white/40 italic">{claim.payout?.payoutStatus || '—'}</td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-white/20 font-black uppercase tracking-widest">No claim settlement events</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
