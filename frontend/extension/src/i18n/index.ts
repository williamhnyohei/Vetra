import en from '../locales/en.json';
import pt from '../locales/pt.json';

export type Language = 'en' | 'pt';

export type TranslationKeys = typeof en;

const translations = {
  en,
  pt,
};

export const getTranslation = (lang: Language = 'en') => {
  return translations[lang] || translations.en;
};

export const t = (key: string, lang: Language = 'en', params?: Record<string, string>) => {
  const translation = getTranslation(lang);
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  if (value === undefined) {
    console.warn(`Translation key "${key}" not found for language "${lang}"`);
    return key;
  }
  
  // Replace parameters in string
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
  }
  
  return value;
};

// For development - use English by default
export const DEV_LANGUAGE: Language = 'en';
