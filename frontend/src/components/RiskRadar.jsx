import { useEffect, useState } from 'react';
import api from '../api/client';
import { getStoredUser } from '../api/auth';
import { useLanguage } from '../i18n/LanguageContext';

export default function RiskRadar() {
  const { t } = useLanguage();
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    const fetchRisk = async () => {
      if (!user?.zone) return;
      try {
        const res = await api.get(`/risk/${user.zone}`);
        setRiskData(res.data);
      } catch (err) {
        console.error('Failed to load risk data');
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
    const interval = setInterval(fetchRisk, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, [user]);

  if (!user?.zone) return null;

  return (
    <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-indigo-900/40 to-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">{t('riskRadar')}</h3>
          <p className="text-sm text-white/50 mt-1">{t('liveForecasting')} {user.zone}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">{t('liveMlFeed')}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : riskData ? (
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Circular Chart Representation */}
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[8px] border-white/5 bg-black/20 shadow-inner">
            <div 
              className={`absolute inset-0 rounded-full border-[8px] border-transparent `}
              style={{
                borderTopColor: riskData.riskIndex > 40 ? '#ef4444' : '#10b981',
                borderRightColor: riskData.riskIndex > 40 ? '#ef4444' : '#10b981',
                borderBottomColor: '#10b981',
                transform: `rotate(${riskData.riskIndex * 2.5}deg)`,
                transition: 'transform 1s ease-in-out'
              }}
            ></div>
            <div className="text-center">
              <span className="block text-3xl font-black text-white">{Math.round(riskData.riskIndex)}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t('riskIndex')}</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{t('prediction')}</p>
              <p className="mt-1 text-lg font-bold text-white capitalize">{riskData.prediction.replace('_', ' ')}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{t('aiReasoning')}</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-300/80">{riskData.aiReasoning}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-white/40 text-center">Unable to load AI predictions.</p>
      )}
    </div>
  );
}
