'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '@/locales/en/common.json';
import arTranslations from '@/locales/ar/common.json';

type Translations = typeof enTranslations;

interface I18nContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<string, Translations> = {
  en: enTranslations,
  ar: arTranslations,
};

/**
 * Get nested translation value by dot-notation key
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

/**
 * Replace placeholders in translation string
 */
function replaceParams(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

export function I18nProvider({
  children,
  locale: initialLocale = 'en',
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[locale] || translations.en, key);
    return replaceParams(translation, params);
  };

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      window.location.href = `/${newLocale}${window.location.pathname.replace(/^\/(en|ar)/, '')}`;
    }
  };

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
