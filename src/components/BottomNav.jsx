const ICONS = {
  scan: (
    // 초밥
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="3" y="14" width="18" height="6" rx="2" fill="currentColor" opacity="0.9" />
      <ellipse cx="12" cy="12" rx="9" ry="5" fill="currentColor" />
      <path d="M5 12c1-2 4-3 7-3s6 1 7 3" stroke="var(--night)" strokeWidth="1.3" fill="none" />
    </svg>
  ),
  currency: (
    // 비빔밥
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M3 11a9 9 0 0 0 18 0Z" fill="currentColor" />
      <circle cx="9" cy="9" r="1.6" fill="var(--night)" />
      <circle cx="14" cy="8" r="1.4" fill="var(--night)" />
      <circle cx="12" cy="10.5" r="1.3" fill="var(--night)" />
      <path d="M3 11h18" stroke="var(--night)" strokeWidth="1.3" />
    </svg>
  ),
  recipe: (
    // 커피
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" fill="currentColor" />
      <path d="M16 10h1.5a2.2 2.2 0 0 1 0 4.4H16" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 4c0 1-1.2 1-1.2 2S8 8 8 8" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M12 4c0 1-1.2 1-1.2 2S12 8 12 8" stroke="currentColor" strokeWidth="1.3" fill="none" />
    </svg>
  ),
  my: (
    // 피자
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M12 3 21 20H3Z" fill="currentColor" />
      <circle cx="12" cy="11" r="1.1" fill="var(--night)" />
      <circle cx="9.5" cy="15" r="1" fill="var(--night)" />
      <circle cx="14.5" cy="15.5" r="1" fill="var(--night)" />
    </svg>
  ),
}

export default function BottomNav({ t, active, onChange }) {
  const items = [
    { id: 'scan', label: t.navScan },
    { id: 'currency', label: t.navCurrency },
    { id: 'recipe', label: t.navRecipe },
    { id: 'my', label: t.navMy },
  ]

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav-item ${active === item.id ? 'is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          <span className="bottom-nav-icon">{ICONS[item.id]}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
