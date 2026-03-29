// 알리고 SMS 발송 유틸리티
// 환경변수: ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER

const ALIGO_BASE = 'https://apis.aligo.in'

interface AligoSendParams {
  receiver: string   // 수신번호 (010-xxxx-xxxx 또는 01012345678)
  msg: string        // 메시지 내용 (90바이트 초과 시 LMS 자동 전환)
  title?: string     // 제목 (LMS/MMS 전용)
}

interface AligoResponse {
  result_code: string  // '1' = 성공
  message: string
  msg_id: string
  success_cnt: number
  error_cnt: number
  msg_type: string
}

export async function sendSMS(params: AligoSendParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey  = process.env.ALIGO_API_KEY
  const userId  = process.env.ALIGO_USER_ID
  const sender  = process.env.ALIGO_SENDER

  if (!apiKey || !userId || !sender) {
    console.error('[Aligo] 환경변수가 설정되지 않았습니다.')
    return { ok: false, error: '알리고 설정 누락' }
  }

  const body = new URLSearchParams({
    key:      apiKey,
    user_id:  userId,
    sender:   sender,
    receiver: params.receiver.replace(/\D/g, ''),
    msg:      params.msg,
    ...(params.title ? { title: params.title, msg_type: 'LMS' } : {}),
  })

  try {
    const res = await fetch(`${ALIGO_BASE}/send/`, {
      method: 'POST',
      body,
    })
    const json: AligoResponse = await res.json()

    if (json.result_code !== '1') {
      console.error('[Aligo] 발송 실패:', json.message)
      return { ok: false, error: json.message }
    }

    return { ok: true }
  } catch (err) {
    console.error('[Aligo] 네트워크 오류:', err)
    return { ok: false, error: '발송 중 오류가 발생했습니다.' }
  }
}

// ── 메시지 템플릿 ────────────────────────────────────────────

export function msgOtp(otp: string): string {
  return `[틈] 인증번호: ${otp}\n유효시간 3분. 타인에게 절대 알리지 마세요.`
}

export function msgReservationConfirmed(params: {
  partnerName: string
  slotDate: string
  startTime: string
  userName: string
}): string {
  return `[틈] ${params.userName}님, 예약이 확정되었습니다!\n` +
    `📍 ${params.partnerName}\n` +
    `📅 ${params.slotDate} ${params.startTime}\n` +
    `방문 시 QR 코드를 보여주세요.`
}

export function msgVisitReminder(params: {
  partnerName: string
  slotDate: string
  startTime: string
}): string {
  return `[틈] 내일 예약 리마인드\n` +
    `📍 ${params.partnerName}\n` +
    `📅 ${params.slotDate} ${params.startTime}\n` +
    `노쇼 시 보증금이 차감됩니다.`
}
