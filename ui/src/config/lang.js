import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

export const list = [
  { label: '简体中文', value: 'zh-CN', autoChangeMap: ['zh-CN', 'zh'] },
  { label: 'English', value: 'en-US', autoChangeMap: ['en-US', 'en'] }
]

const locales = list.map((x) => x.value)
const i18n = createI18n({ locale: locales[0], legacy: false })

export function setupI18n() {
  loadLocaleMessages(locales[0])
  setI18nLanguage(locales[0])
  return i18n
}

export function setI18nLanguage(locale) {
  i18n.global.locale.value = locale
  document.querySelector('html').setAttribute('lang', locale)
}

export async function loadLocaleMessages(locale) {
  const messages = await import(`../locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  return nextTick()
}

export async function autoLang() {
  for (const lang of list) {
    if (lang.autoChangeMap.indexOf(navigator.language) !== -1) {
      await loadLocaleMessages(lang.value)
      setI18nLanguage(lang.value)
      return lang.value
    }
  }
}
