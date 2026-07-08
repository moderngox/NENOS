import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, type Lang, type Strings } from '../i18n/strings';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Strings;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');
  const value = useMemo(() => ({ lang, setLang, t: dictionaries[lang] }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
