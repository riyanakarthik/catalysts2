import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { getStoredUser } from '../api/auth';
import ClaimCard from '../components/ClaimCard';
import Spinner from '../components/Spinner';
import { useLanguage } from '../i18n/LanguageContext';

export default function ClaimsListPage() {
  const { t } = useLanguage();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';

  const fetchClaims = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const endpoint = isAdmin ? '/claims' : `/claims/${user.id}`;
      const res = await api.get(endpoint);
      setClaims(res.data.data);
    } catch (err) {
      console.error('Failed to fetch claims', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Auto-refresh every 15s to catch cron-generated claims
  useEffect(() => {
    const interval = setInterval(() => fetchClaims(true), 15000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  return (
    <section className="space-y-10">
      
      {/* HEADER SECTION */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{t('claimsHistory')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              {isAdmin ? t('netSettlementFeed') : t('myClaimsPayouts')}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/50">
              {isAdmin
                ? t('adminClaimsSubtitle')
                : t('workerClaimsSubtitle')}
            </p>
          </div>
          <button
            onClick={() => fetchClaims(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <span className={`${refreshing ? 'animate-spin' : ''}`}>↻</span>
            {refreshing ? t('pollingNetwork') : t('refreshRecords')}
          </button>
        </div>
      </div>

      {/* CONTENT LAYER */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        {loading ? (
          <Spinner label={t('dbAccess')} />
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 text-6xl opacity-20">📋</div>
            <p className="text-xl font-black text-white px-2">{t('noRecordsFound')}</p>
            <p className="mt-3 text-sm text-white/30 leading-relaxed max-w-sm">
              {isAdmin
                ? t('simulateTrigger')
                : t('noRecordsWorker')}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                {t('displayingRecords')}: {claims.length}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {claims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          </>
        )}
      </div>

    </section>
  );
}
