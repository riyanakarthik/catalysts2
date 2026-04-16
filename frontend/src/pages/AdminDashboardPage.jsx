import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';

function StatCard({ label, value, sub, accent = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-600/20 to-indigo-800/10 border-indigo-500/20 text-indigo-300',
    emerald: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 text-emerald-300',
    rose: 'from-rose-600/20 to-rose-800/10 border-rose-500/20 text-rose-300',
    amber: 'from-amber-600/20 to-amber-800/10 border-amber-500/20 text-amber-300',
  };

  return (
    <div className={`rounded-[32px] border bg-gradient-to-br ${colors[accent]} p-8 backdrop-blur-xl`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</p>
      <p className="mt-4 text-4xl font-black tracking-tight text-white">{value}</p>
      {sub && <p className="mt-2 text-xs font-bold opacity-40">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [triggerForm, setTriggerForm] = useState({ triggerType: 'RAIN', zone: 'Koramangala', severity: 'high' });
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get('/dashboard/admin');
      setDashboard(data.data);
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(true), 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const simulate = async () => {
    try {
      const { data } = await api.post('/triggers/simulate', { ...triggerForm, source: 'admin-dashboard' });
      setMessage(`Trigger created. ${data.data.generatedClaimsCount} claim(s) generated.`);
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to simulate trigger');
    }
  };

  const workers = dashboard?.workers || [];
  const claims = dashboard?.claims || [];
  const highRiskZones = dashboard?.highRiskZones || [];
  const predictedDisruptions = dashboard?.predictedDisruptions || [];
  const totalPaidOut = claims.reduce((sum, claim) => sum + (claim.payoutAmount || 0), 0);
  const activePolicies = workers.reduce((sum, worker) => sum + (worker.policies?.filter((policy) => policy.status === 'ACTIVE').length || 0), 0);
  const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/20 transition focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold';

  return (
    <div className="space-y-10">
      <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">{t('insurerConsole')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{t('opsCenter')}</h2>
            <p className="mt-5 text-lg leading-relaxed text-white/50">{t('adminSubtitle')}</p>
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

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select className={inputClass} value={triggerForm.triggerType} onChange={(e) => setTriggerForm((p) => ({ ...p, triggerType: e.target.value }))}>
            <option value="RAIN">🌧 {t('heavyRain')}</option>
            <option value="AQI">😷 {t('aqiAlert')}</option>
            <option value="OUTAGE">⚡ {t('platformOutage')}</option>
          </select>
          <input className={inputClass} value={triggerForm.zone} onChange={(e) => setTriggerForm((p) => ({ ...p, zone: e.target.value }))} placeholder={t('targetZone')} />
          <select className={inputClass} value={triggerForm.severity} onChange={(e) => setTriggerForm((p) => ({ ...p, severity: e.target.value }))}>
            <option value="low">{t('severity')}: {t('low')}</option>
            <option value="medium">{t('severity')}: {t('medium')}</option>
            <option value="high">{t('severity')}: {t('high')}</option>
          </select>
          <button className="rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition" onClick={simulate}>
            {t('simulateTrigger')}
          </button>
        </div>
        {message && <p className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4 text-sm font-bold text-emerald-400">{message}</p>}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('liveClaims')} value={dashboard?.totalClaims || 0} sub="Auto-created claims" accent="amber" />
        <StatCard label="Fraud Flags" value={dashboard?.fraudFlaggedClaims || 0} sub="Rule-based claim checks" accent="rose" />
        <StatCard label={t('statActivePolicies')} value={activePolicies} sub={t('inForce')} accent="emerald" />
        <StatCard label={t('netPayoutFlow')} value={`₹${Math.round(totalPaidOut).toLocaleString()}`} sub={t('automatedPayouts')} accent="indigo" />
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h3 className="text-xl font-black text-white">High-Risk Zones</h3>
          <div className="mt-6 grid gap-4">
            {highRiskZones.length === 0 ? (
              <p className="text-sm text-white/40">No zones are above the high-risk threshold yet.</p>
            ) : highRiskZones.map((zone) => (
              <div key={zone.zone} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-white">{zone.zone}</p>
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                    Risk {zone.averageRiskScore}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/50">Recent claims: {zone.recentClaims}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h3 className="text-xl font-black text-white">Predicted Disruptions</h3>
          <div className="mt-6 grid gap-4">
            {predictedDisruptions.length === 0 ? (
              <p className="text-sm text-white/40">No upcoming disruption watchlist at the moment.</p>
            ) : predictedDisruptions.map((item) => (
              <div key={item.zone} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-white">{item.zone}</p>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                    {item.confidence}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/50">{item.prediction}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-10">
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
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 font-bold text-white">{worker.fullName}</td>
                    <td className="px-6 py-5 text-indigo-300 font-bold">{worker.platform}</td>
                    <td className="px-6 py-5 tracking-tight">{worker.zone}</td>
                    <td className="px-6 py-5 font-mono">₹{worker.avgDailyEarnings}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black ${worker.policies?.some((policy) => policy.status === 'ACTIVE') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                        {worker.policies?.filter((policy) => policy.status === 'ACTIVE').length || 0} active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
                {claims.map((claim) => (
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
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase border ${claim.fraudFlag ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {claim.fraudFlag ? 'FRAUD FLAG' : claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-white/40 italic">{claim.payout?.payoutStatus || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
