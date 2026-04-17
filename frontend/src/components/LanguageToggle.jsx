import { useLanguage } from '../i18n/LanguageContext';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'मर' },
];

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center bg-white/80 backdrop-blur-xl rounded-full shadow-2xl border border-gray-200/50 p-1 gap-0.5">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-4 py-2 rounded-full text-xs font-black transition-all duration-300 ${
            lang === code
              ? 'bg-[#004f20] text-white shadow-lg shadow-[#004f20]/30 scale-105'
              : 'text-[#3d4a3d] hover:bg-[#eaf7eb] hover:text-[#006e2d]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
