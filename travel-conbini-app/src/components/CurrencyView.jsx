import { useEffect, useState } from 'react'
import { fetchKrwRate } from '../utils/exchangeRate.js'

export default function CurrencyView({ t, countries, selectedCountry, onSelectCountry }) {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setRate(null)

    fetchKrwRate(selectedCountry.currency)
      .then((r) => {
        if (!cancelled) {
          setRate(r)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [selectedCountry.currency])

  const numericAmount = Number(amount)
  const hasValidAmount = amount !== '' && !Number.isNaN(numericAmount)
  const converted = hasValidAmount && rate ? Math.round(numericAmount * rate) : null

  return (
    <div className="currency-view">
      <h2 className="currency-title">{t.currencyTitle}</h2>

      <div className="currency-country-row">
        {countries.map((c) => (
          <button
            key={c.code}
            className={`currency-chip ${selectedCountry.code === c.code ? 'is-active' : ''}`}
            onClick={() => onSelectCountry(c)}
          >
            {c.symbol} {c.name}
          </button>
        ))}
      </div>

      <label className="currency-input-label">{t.currencyPriceLabel}</label>
      <div className="currency-input-row">
        <span className="currency-symbol">{selectedCountry.symbol}</span>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="currency-input"
        />
      </div>

      <div className="currency-result">
        {status === 'loading' && <p className="currency-status">{t.currencyLoading}</p>}
        {status === 'error' && <p className="currency-status currency-status-error">{t.currencyError}</p>}
        {status === 'ready' && (
          <p className="currency-result-value">
            {t.currencyResultPrefix} {converted !== null ? converted.toLocaleString() : '0'}
            <span className="currency-result-unit">원</span>
          </p>
        )}
      </div>

      <p className="currency-note">{t.currencySourceNote}</p>
    </div>
  )
}
