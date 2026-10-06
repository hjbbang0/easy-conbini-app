// /api/kakao-keepalive — 매주 한 번 Vercel Cron이 호출해서 카카오 연결이 끊기지 않게 유지해요.
// 카카오 리프레시 토큰은 2달 뒤 만료되는데, 만료 1달 전부터 갱신하면 새 토큰이 나와요.
// 알림이 오래 안 울려도 이 호출이 토큰을 계속 새로 이어줘요.
//
// 보호: CRON_SECRET 환경변수를 만들어두면 Vercel이 Authorization 헤더로 자동으로 보내줘요.

import { getKakaoAccessToken, kakaoConfigured } from '../ownerAlert.js'

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers?.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false })
    return
  }
  if (!kakaoConfigured()) {
    res.status(200).json({ ok: true, skipped: 'not_configured' })
    return
  }
  try {
    const token = await getKakaoAccessToken()
    res.status(200).json({ ok: true, linked: Boolean(token) })
  } catch (err) {
    console.error('kakao-keepalive 실패 (카카오 연결을 다시 해야 할 수 있어요):', err?.message ?? err)
    res.status(500).json({ ok: false })
  }
}
