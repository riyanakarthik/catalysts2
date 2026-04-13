import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { getStoredUser } from '../api/auth';
import PolicyCard from '../components/PolicyCard';
import ClaimCard from '../components/ClaimCard';
import Spinner from '../components/Spinner';

export default function WorkerDashboardPage() {
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = getStoredUser();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [polRes, claimRes] = await Promise.all([
        api.get('/policies'),
        api.get(`/claims/${user.id}`)
      ]);
      setPolicies(polRes.data);
      setClaims(claimRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15s to pick up cron-generated claims
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activePolicy = policies.find(p => p.status === 'ACTIVE');

  return (
    <div className="space-y-10">

      {/* PROFILE HEADER */}
      <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-12">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Worker Dashboard</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Worker'}! 
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/50">
              Review your active coverage, monitor trigger events, and track automated payouts in real-time.
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <span className={`transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>

        {/* PROFILE STATS */}
        {user && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Network Platform', value: user.platform || '—' },
              { label: 'Active Zone', value: user.city && user.zone ? `${user.city}, ${user.zone}` : '—' },
              { label: 'Daily Earnings', value: user.avgDailyEarnings ? `₹${user.avgDailyEarnings}` : '—' },
              { label: 'UPI Linked', value: user.upiId || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">{label}</p>
                <p className="mt-2 text-lg font-bold text-white/90 truncate">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* COVERAGE BADGE */}
        {!loading && (
          <div className={`mt-8 inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider ${
            activePolicy
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <span className={`h-2 w-2 rounded-full ${activePolicy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {activePolicy
              ? `Status: ACTIVE COVERAGE (${activePolicy.planType})`
              : 'Status: NO ACTIVE POLICY FOUND'}
          </div>
        )}
      </section>

      {/* TWO COLUMN CONTENT */}
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        
        {/* POLICIES SECTION */}
        <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white">Active Protection</h3>
            <p className="text-sm text-white/40 mt-1">Your current and past insurance plans.</p>
          </div>
          
          {loading ? (
            <Spinner label="Loading policies..." />
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-5xl">🛡️</div>
              <p className="font-bold text-white">No policies yet</p>
              <p className="mt-2 text-xs text-white/30 leading-relaxed max-w-[200px]">Activate a plan from the Selection page to get covered.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {policies.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          )}
        </section>

        {/* CLAIMS SECTION */}
        <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white">Trigger History</h3>
            <p className="text-sm text-white/40 mt-1">Automated payouts from environmental triggers.</p>
          </div>

          {loading ? (
            <Spinner label="Loading claims..." />
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-5xl">📋</div>
              <p className="font-bold text-white">No claims recorded</p>
              <p className="mt-2 text-xs text-white/30 leading-relaxed max-w-[200px]">Claims appear automatically when a trigger hits your zone.</p>
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
