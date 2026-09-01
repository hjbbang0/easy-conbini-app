export default function BottomNav({ items, active, onChange }) {
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
