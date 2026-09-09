export default function PaywallCard({ t, onSubscribe }) {
  return (
    <div className="paywall-card">
      <p className="paywall-eyebrow">{t.paywallEyebrow}</p>
      <h2 className="paywall-title">
        {t.paywallTitle1}
        <br />
        {t.paywallTitle2}
      </h2>
      <p className="paywall-body">{t.paywallBody}</p>

      <ul className="paywall-perks">
        {t.paywallPerks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>

      <button className="paywall-cta" onClick={onSubscribe}>
        {t.paywallCta}
      </button>
      <p className="paywall-note">{t.paywallNote}</p>
    </div>
  )
}
