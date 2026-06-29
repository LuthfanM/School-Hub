import { apiRequest } from './api'
import i18n, { isSupportedLanguage, type SupportedLanguage } from './i18n'

export async function applyUserLanguagePreference(language: string | null | undefined) {
  if (!language || !isSupportedLanguage(language)) return

  if (i18n.language !== language) {
    await i18n.changeLanguage(language)
  }
}

export async function saveUserLanguagePreference(language: SupportedLanguage) {
  const response = await apiRequest<{ preferences: { language: SupportedLanguage } }>('/api/session/preferences/language', {
    method: 'PATCH',
    body: JSON.stringify({ language }),
  })

  await applyUserLanguagePreference(response.preferences.language)

  return response.preferences
}
