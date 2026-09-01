export default function Header({ t, remaining, isPremium }) {
  return (
    <header className="header">
      <div className="awning" aria-hidden="true" />
      <div className="header-content">
        <p className="kicker">{t.kicker}</p>
        <h1 className="header-title">
          {t.titleLine1}
          <br />
          {t.titleLine2}
        </h1>

        <p className="usage-badge">{isPremium ? t.usagePremium : t.usageFree(Math.max(remaining, 0))}</p>
      </div>
    </header>
  )
}
