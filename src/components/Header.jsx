export default function Header({ country, onOpenCountryPicker, remaining, isPremium }) {
  return (
    <header className="header">
      <div className="awning" aria-hidden="true" />
      <div className="header-content">
        <div className="header-top">
          <p className="kicker">편의점, 어디까지 써봤니</p>
          <button className="country-pill" onClick={onOpenCountryPicker}>
            <span>{country.symbol}</span>
            <span>{country.name}</span>
          </button>
        </div>
        <h1 className="header-title">
          뭘 사야 할지
          <br />
          3초 안에 알려줄게
        </h1>

        <p className="usage-badge">
          {isPremium ? '프리미엄 · 스캔 무제한' : `무료 스캔 ${Math.max(remaining, 0)}/5 남음`}
        </p>
      </div>
    </header>
  )
}
