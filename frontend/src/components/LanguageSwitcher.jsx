import { useLanguage } from '../i18n/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'hi', label: 'हिं', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್', flag: '🇮🇳' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
            lang === l.code
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
          title={l.code === 'en' ? 'English' : l.code === 'hi' ? 'हिन्दी' : 'ಕನ್ನಡ'}
        >
          <span className="text-xs">{l.flag}</span>
          {l.label}
        </button>
      ))}
    </div>
  );
}
