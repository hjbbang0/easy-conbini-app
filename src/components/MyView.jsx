import { useState } from 'react'
import { LANGUAGES } from '../i18n/translations.js'
import { AFFILIATE_LINKS } from '../data/affiliateLinks.js'
import PolicyModal from './PolicyModal.jsx'

const AFFILIATE_TEXT_KEYS = {
  esim: { label: 'affiliateEsimLabel', sub: 'affiliateEsimSub' },
  insurance: { label: 'affiliateInsuranceLabel', sub: 'affiliateInsuranceSub' },
  tripcom: { label: 'affiliateTripcomLabel', sub: 'affiliateTripcomSub' },
  klook: { label: 'affiliateKlookLabel', sub: 'affiliateKlookSub' },
  transfer: { label: 'affiliateTransferLabel', sub: 'affiliateTransferSub' },
  rentalcars: { label: 'affiliateRentalcarsLabel', sub: 'affiliateRentalcarsSub' },
}

function AffiliateGroup({ title, items, t }) {
  if (items.length === 0) return null
  return (
    <div className="my-section">
      <p className="my-section-label">{title}</p>
      <div className="affiliate-banner-group">
        {items.map((item) => {
          const keys = AFFILIATE_TEXT_KEYS[item.id]
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="affiliate-banner"
            >
              <span className="affiliate-banner-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="affiliate-banner-text">
                <span className="affiliate-banner-label">{t[keys.label]}</span>
                <span className="affiliate-banner-sub">{t[keys.sub]}</span>
              </span>
              <span className="affiliate-banner-arrow" aria-hidden="true">
                →
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default function MyView({ t, language, onChangeLanguage, premium, scanCount, onResetPremium }) {
  const [showPolicy, setShowPolicy] = useState(false)
  const liveLinks = AFFILIATE_LINKS.filter((item) => item.url)
  const beforeItems = liveLinks.filter((item) => item.group === 'before')
  const duringItems = liveLinks.filter((item) => item.group === 'during')

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

      <AffiliateGroup title={t.affiliateGroupBefore} items={beforeItems} t={t} />
      <AffiliateGroup title={t.affiliateGroupDuring} items={duringItems} t={t} />

      {liveLinks.length > 0 && <p className="affiliate-banner-disclosure">{t.affiliateDisclosure}</p>}

      {premium && (
        <button className="my-dev-reset" onClick={onResetPremium}>
          {t.myDevReset}
        </button>
      )}

      <button className="my-policy-link" onClick={() => setShowPolicy(true)}>
        {t.myPolicyLink}
      </button>

      <PolicyModal open={showPolicy} onClose={() => setShowPolicy(false)} />
    </div>
  )
}
