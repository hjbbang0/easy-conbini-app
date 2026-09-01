// open.er-api.com: 무료, API 키 불필요, 브라우저에서 바로 호출 가능.
// 1일 1회 갱신되는 참고용 환율이라 실시간 초단위 시세와는 약간 차이가 날 수 있어요.
export async function fetchKrwRate(fromCurrency) {
  const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`)
  if (!res.ok) throw new Error('exchange-rate-fetch-failed')
  const data = await res.json()
  if (data.result !== 'success' || !data.rates?.KRW) {
    throw new Error('exchange-rate-bad-response')
  }
  return data.rates.KRW
}
