// /api/kakao-setup — 카카오톡 알림 연결 (처음 한 번만 쓰고 환경변수를 지우면 닫혀요)
//
// 카카오 로그인 동의 화면이 끝나면 카카오가 이 주소로 ?code=...&state=... 를 붙여서 돌려보내요.
// 여기서 그 코드를 토큰으로 바꿔 저장소(KV)에 넣고, 카톡으로 테스트 메시지를 보내요.
// 토큰은 화면에 절대 보여주지 않아요.
//
// 안전장치: KAKAO_SETUP_SECRET 환경변수와 같은 state 값이 없으면 404를 돌려줘요.
// (남이 자기 카카오 계정으로 이 주소를 눌러서 알림 수신 계정을 바꾸는 걸 막아요.)

import {
  exchangeKakaoCode,
  touchKakaoUser,
  saveKakaoRefreshToken,
  sendKakaoMemo,
  kvConfigured,
} from '../ownerAlert.js'

function page(res, status, title, message) {
  const escape = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).send(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(title)}</title></head>` +
      `<body style="font-family:sans-serif;padding:24px;line-height:1.6"><h2>${escape(title)}</h2><p>${escape(message)}</p></body></html>`
  )
}

export default async function handler(req, res) {
  const secret = process.env.KAKAO_SETUP_SECRET
  const query = req.query ?? Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)

  if (!secret || query.state !== secret) {
    res.status(404).send('Not found')
    return
  }
  if (!process.env.KAKAO_REST_API_KEY) {
    page(res, 500, '설정이 덜 됐어요', 'Vercel 환경변수 KAKAO_REST_API_KEY가 없어요.')
    return
  }
  if (!kvConfigured()) {
    page(res, 500, '저장소가 아직 연결되지 않았어요', 'Vercel Storage에서 Upstash Redis를 이 프로젝트에 연결하고 다시 배포한 뒤 시도해주세요.')
    return
  }
  if (query.error) {
    page(res, 400, '카카오에서 연결이 취소됐어요', `${query.error_description ?? query.error}`)
    return
  }
  if (!query.code) {
    page(res, 400, '인가 코드가 없어요', '카카오 로그인 주소로 처음부터 다시 들어와주세요.')
    return
  }

  try {
    const tokens = await exchangeKakaoCode(query.code)
    await touchKakaoUser(tokens.access_token)
    await saveKakaoRefreshToken(tokens.refresh_token)
    await sendKakaoMemo(tokens.access_token, '✅ 콘비니스냅 알림이 연결됐어요!\nAI 분석이 멈추면 이 대화창으로 알려드릴게요.', 'https://www.konbinisnap.com')
    page(res, 200, '연결 완료 ✅', '카카오톡 "나와의 채팅"에 확인 메시지가 도착했는지 봐주세요. 이 창은 닫으셔도 돼요.')
  } catch (err) {
    console.error('kakao-setup 실패:', err?.message ?? err)
    page(res, 500, '연결에 실패했어요', '카카오 설정(Redirect URI, 동의항목, Client Secret)을 다시 확인해주세요. 자세한 원인은 Vercel Logs에 있어요.')
  }
}
