import { createContext, useContext, useState, useCallback } from 'react';
import en from './locales/en';
import hi from './locales/hi';
import mr from './locales/mr';

const locales = { en, hi, mr };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('vc_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    try { localStorage.setItem('vc_lang', newLang); } catch {}
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * useTranslation hook
 * Returns a t() function that resolves dot-notation keys and interpolates {params}
 * 
 * Usage:
 *   const { t } = useTranslation();
 *   t('welcome.title', { name: 'John' })  →  "Welcome back, John"
 */
export function useTranslation() {
  const { lang } = useContext(LanguageContext);

  const t = useCallback((key, params = {}) => {
    const dict = locales[lang] || locales.en;
    const fallback = locales.en;

    // Resolve dot notation: 'welcome.title' → dict.welcome.title
    const resolve = (obj, path) => {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    };

    let value = resolve(dict, key) ?? resolve(fallback, key) ?? key;

    // Interpolate params: {name} → params.name
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }

    // Always return a string to avoid React "Objects are not valid as a React child" crashes
    return typeof value === 'string' ? value : String(value);
  }, [lang]);

  const { lang: currentLang } = useContext(LanguageContext);

  // Return date locale string for Intl formatting
  const dateLocale = currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-US';

  return { t, lang: currentLang, dateLocale };
}
