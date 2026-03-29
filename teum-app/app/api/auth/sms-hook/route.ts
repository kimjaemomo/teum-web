// Supabase Auth Hook — Send SMS
// Supabase가 OTP 발송 시 이 엔드포인트를 호출합니다.
// 설정 경로: Supabase Dashboard → Authentication → Hooks → Send SMS

import { sendSMS, msgOtp } from '@/lib/aligo'
import { NextRequest, NextResponse } from 'next/server'

// Supabase가 전송하는 Hook secret으로 요청 인증
const HOOK_SECRET = process.env.SUPABASE_HOOK_SECRET ?? ''

export async function POST(request: NextRequest) {
  // 인증 헤더 검증
  const authHeader = request.headers.get('authorization')
  if (HOOK_SECRET && authHeader !== `Bearer ${HOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { user?: { phone?: string }; sms?: { otp?: string } }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const phone = body.user?.phone
  const otp   = body.sms?.otp

  if (!phone || !otp) {
    return NextResponse.json({ error: 'Missing phone or otp' }, { status: 400 })
  }

  const result = await sendSMS({
    receiver: phone,
    msg: msgOtp(otp),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
