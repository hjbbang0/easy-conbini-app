import { useEffect, useRef, useState } from 'react'
import { LANGUAGES } from '../i18n/translations.js'

export default function LanguageTabs({ language, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="lang-dropdown" ref={rootRef}>
      <button
        type="button"
        className="lang-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current.label}</span>
        <span className={`lang-dropdown-caret ${open ? 'is-open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul className="lang-dropdown-menu" role="listbox">
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={language === l.code}>
              <button
                type="button"
                className={`lang-dropdown-item ${language === l.code ? 'is-active' : ''}`}
                onClick={() => {
                  onChange(l.code)
                  setOpen(false)
                }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
