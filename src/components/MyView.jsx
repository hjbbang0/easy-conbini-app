import { LANGUAGES } from '../i18n/translations.js'

export default function MyView({ t, language, onChangeLanguage, premium, scanCount, onResetPremium }) {
  return (
    <div className="my-view">
      <h2 className="my-title">{t.myTitle}</h2>

      <div className="my-status-card">
        {premium ? (
          <p className="my-status-line my-status-premium">{t.myStatusPremium}</p>
        ) : (
          <p className="my-status-line">{t.myStatusFree(scanCount)}</p>
        )}
      </div>

      <div className="my-section">
        <p className="my-section-label">{t.myLanguageLabel}</p>
        <div className="my-lang-grid">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`my-lang-btn ${language === l.code ? 'is-active' : ''}`}
              onClick={() => onChangeLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {premium && (
        <button className="my-dev-reset" onClick={onResetPremium}>
          {t.myDevReset}
        </button>
      )}
    </div>
  )
}
