import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

import en from './lang/en.json'
import id from './lang/id.json'
import ja from './lang/ja.json'
import ko from './lang/ko.json'

export const supportedLanguages = ['en', 'id', 'ja', 'ko'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

const resources = {
  en: {
    translation: en,
  },
  id: {
    translation: id,
  },
  ja: {
    translation: ja,
  },
  ko: {
    translation: ko,
  },
}

if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: supportedLanguages,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      react: {
        useSuspense: false,
      },
    })
}

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage)
}

export default i18n
