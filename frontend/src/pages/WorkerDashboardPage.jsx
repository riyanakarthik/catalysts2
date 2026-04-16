import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { getStoredUser } from '../api/auth';
import PolicyCard from '../components/PolicyCard';
import ClaimCard from '../components/ClaimCard';
import Spinner from '../components/Spinner';
import RiskRadar from '../components/RiskRadar';
import { useLanguage } from '../i18n/LanguageContext';

export default function WorkerDashboardPage() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storedUser = getStoredUser();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/dashboard/worker');
      setDashboard(res.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const user = dashboard?.worker || storedUser;
  const policies = dashboard?.policies || [];
  const claims = dashboard?.claims || [];
  const activePolicy = dashboard?.activePolicy || null;

  return (
    <div className="space-y-10">
      <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">{t('workerDashboard')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              {t('welcomeBackUser')} {user?.fullName?.split(' ')[0] || 'Worker'}!
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/50">
              {t('dashboardSubtitle')}
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <span className={`transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            {refreshing ? t('refreshing') : t('refreshFeed')}
          </button>
        </div>

        {user && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: t('networkPlatform'), value: user.platform || '—' },
              { label: t('activeZone'), value: user.city && user.zone ? `${user.city}, ${user.zone}` : '—' },
              { label: t('dailyEarnings'), value: user.avgDailyEarnings ? `₹${user.avgDailyEarnings}` : '—' },
              { label: t('upiLinked'), value: user.upiId || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">{label}</p>
                <p className="mt-2 text-lg font-bold text-white/90 truncate">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Weekly Premium</p>
            <p className="mt-2 text-3xl font-black text-white">₹{dashboard?.weeklyPremium || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Claims Triggered</p>
            <p className="mt-2 text-3xl font-black text-white">{dashboard?.claimsTriggered || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Earnings Protected</p>
            <p className="mt-2 text-3xl font-black text-white">₹{dashboard?.totalEarningsProtected || 0}</p>
          </div>
        </div>

        {!loading && (
          <div className={`mt-8 inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider ${
            activePolicy
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <span className={`h-2 w-2 rounded-full ${activePolicy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {activePolicy ? `${t('statusActive')} (${activePolicy.planType})` : t('statusInactive')}
          </div>
        )}
      </section>

      <RiskRadar />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white">{t('activeProtection')}</h3>
            <p className="text-sm text-white/40 mt-1">{t('activeProtectionDesc')}</p>
          </div>

          {loading ? (
            <Spinner label={t('loading')} />
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-5xl">🛡️</div>
              <p className="font-bold text-white">{t('noPolicies')}</p>
              <p className="mt-2 text-xs text-white/30 leading-relaxed max-w-[200px]">{t('noPoliciesDesc')}</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {policies.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white">{t('triggerHistory')}</h3>
            <p className="text-sm text-white/40 mt-1">{t('triggerHistoryDesc')}</p>
          </div>

          {loading ? (
            <Spinner label={t('loading')} />
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-5xl">📋</div>
              <p className="font-bold text-white">{t('noClaims')}</p>
              <p className="mt-2 text-xs text-white/30 leading-relaxed max-w-[200px]">{t('noClaimsDesc')}</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {claims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
