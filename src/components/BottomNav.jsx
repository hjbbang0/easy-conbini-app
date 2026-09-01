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
          <span className="bottom-nav-dot" aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </nav>
  )
}
