import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ja', label: 'JA' },
  { code: 'zh-CN', label: '简中' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function handleChange(e) {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('recipi-lang', lang);
  }

  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      className="bg-blue-600 text-white text-sm rounded-lg px-2 py-1 border border-blue-400 focus:outline-none cursor-pointer"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code} className="bg-blue-500">
          {l.label}
        </option>
      ))}
    </select>
  );
}
