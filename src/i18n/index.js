import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import zhTW from './locales/zh-TW.json';

const savedLang = localStorage.getItem('recipi-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ja: { translation: ja },
    'zh-TW': { translation: zhTW },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
