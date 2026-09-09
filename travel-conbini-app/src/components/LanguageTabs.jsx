import { LANGUAGES } from '../i18n/translations.js'

export default function LanguageTabs({ language, onChange }) {
  return (
    <div className="lang-tabs">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          className={`lang-tab ${language === l.code ? 'is-active' : ''}`}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
