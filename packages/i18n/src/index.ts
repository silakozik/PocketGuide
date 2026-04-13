import enCommon from './locales/en/common.json';
import trCommon from './locales/tr/common.json';

export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const resources = {
  en: {
    common: enCommon,
  },
  tr: {
    common: trCommon,
  },
} as const;

export type TranslationKeys = typeof resources.en;
