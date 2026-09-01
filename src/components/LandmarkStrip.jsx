const ICONS = {
  eiffel: (
    <svg viewBox="0 0 24 32" width="26" height="34">
      <path
        d="M12 2 L7 20 L4 30 M12 2 L17 20 L20 30 M9 14 L15 14 M6 24 L18 24 M12 2 L12 30"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
  'tokyo-tower': (
    <svg viewBox="0 0 24 32" width="26" height="34">
      <path
        d="M12 2 L5 30 M12 2 L19 30 M8 18 L16 18 M6 24 L18 24 M9 12 L15 12"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
  'great-wall': (
    <svg viewBox="0 0 24 32" width="26" height="34">
      <path
        d="M2 26 L2 20 L6 20 L6 16 L10 16 L10 22 L14 22 L14 15 L18 15 L18 21 L22 21 L22 26 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  ),
  temple: (
    <svg viewBox="0 0 24 32" width="26" height="34">
      <path
        d="M12 2 L20 12 L4 12 Z M6 12 L6 28 L18 28 L18 12 M9 28 L9 20 L15 20 L15 28"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

const COLORS = ['var(--sticker)', 'var(--neon)', 'var(--sticker)', 'var(--neon)']

export default function LandmarkStrip({ landmarks }) {
  return (
    <div className="landmark-strip">
      {landmarks.map((mark, i) => (
        <div
          className="landmark-item"
          key={mark.id}
          style={{ color: COLORS[i % COLORS.length], animationDelay: `${i * 0.15}s` }}
        >
          {ICONS[mark.id]}
        </div>
      ))}
    </div>
  )
}
