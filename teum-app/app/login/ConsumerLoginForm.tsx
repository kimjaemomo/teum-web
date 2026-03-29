'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const OTP_EXPIRE_SEC = 180

interface Props { redirectTo: string }

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('0') ? '+82' + digits.slice(1) : '+' + digits
}

function formatDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export function ConsumerLoginForm({ redirectTo }: Props) {
  const router = useRouter()
  const supabase = useRef(createClient())

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function sendOtp() {
    setError('')
    setLoading(true)
    const e164 = toE164(phone)
    const { error: err } = await supabase.current.auth.signInWithOtp({ phone: e164 })
    setLoading(false)
    if (err) {
      if (err.message.includes('rate')) setError('잠시 후 다시 시도해주세요.')
      else setError('인증번호 발송에 실패했습니다.')
      return
    }
    setStep('otp')
    setCountdown(OTP_EXPIRE_SEC)
  }

  async function verifyOtp() {
    setError('')
    setLoading(true)
    const e164 = toE164(phone)
    const { data, error: err } = await supabase.current.auth.verifyOtp({
      phone: e164, token: otp, type: 'sms',
    })
    if (err) {
      setLoading(false)
      if (err.message.includes('expired')) setError('인증번호가 만료되었습니다. 다시 발송해주세요.')
      else setError('인증번호가 올바르지 않습니다.')
      return
    }
    // 첫 로그인 시 public.users 레코드 생성
    if (data.user) {
      await supabase.current.from('users').upsert({
        id: data.user.id,
        phone: phone.replace(/\D/g, ''),
        name: phone.replace(/\D/g, ''),  // 추후 프로필 설정에서 변경
        role: 'consumer',
      }, { onConflict: 'id', ignoreDuplicates: true })
    }
    router.refresh()
    router.push(redirectTo)
  }

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')

  return (
    <div style={{
      minHeight: '100vh', background: '#F4F0E6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', fontFamily: "'Pretendard', -apple-system, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#fff', borderRadius: 20, padding: '36px 28px',
        boxShadow: '0 2px 24px rgba(51,71,50,0.10)',
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 32, color: '#334732', marginBottom: 6,
          }}>틈</div>
          <div style={{ fontSize: 14, color: '#6B6B5E' }}>
            {step === 'phone' ? '전화번호로 시작하기' : '인증번호를 입력해주세요'}
          </div>
        </div>

        {step === 'phone' ? (
          <>
            <label style={{ fontSize: 13, color: '#6B6B5E', display: 'block', marginBottom: 6 }}>
              전화번호
            </label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={formatDisplay(phone)}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && !loading && phone.length >= 10 && sendOtp()}
              style={inputStyle}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              style={{ ...btnStyle, marginTop: 16, opacity: loading || phone.replace(/\D/g, '').length < 10 ? 0.5 : 1 }}
            >
              {loading ? '발송 중...' : '인증번호 받기'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#6B6B5E', marginBottom: 4 }}>
              {formatDisplay(phone)}으로 발송된 6자리 숫자
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: countdown > 30 ? '#334732' : '#C0392B', fontWeight: 700 }}>
                {mm}:{ss}
              </span>
            </div>
            <input
              type="number"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && !loading && otp.length === 6 && verifyOtp()}
              style={{ ...inputStyle, fontSize: 22, letterSpacing: '0.2em', textAlign: 'center' }}
              autoFocus
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              style={{ ...btnStyle, marginTop: 16, opacity: loading || otp.length !== 6 ? 0.5 : 1 }}
            >
              {loading ? '확인 중...' : '인증 완료'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              style={{ ...secondaryBtnStyle, marginTop: 10 }}
            >
              전화번호 다시 입력
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#A8A89A', marginTop: 20 }}>
          로그인 시 서비스 이용약관에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px',
  border: '1.5px solid #E3DFD4', borderRadius: 10,
  fontSize: 16, color: '#1C2B1B',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Pretendard', sans-serif",
  transition: 'border-color 200ms ease',
}

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '14px 0',
  background: '#334732', color: '#fff',
  border: 'none', borderRadius: 10,
  fontSize: 15, fontWeight: 700, cursor: 'pointer',
  fontFamily: "'Pretendard', sans-serif",
  transition: 'opacity 200ms ease',
}

const secondaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '12px 0',
  background: 'transparent', color: '#6B6B5E',
  border: '1.5px solid #E3DFD4', borderRadius: 10,
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
  fontFamily: "'Pretendard', sans-serif",
}

const errorStyle: React.CSSProperties = {
  fontSize: 13, color: '#C0392B', marginTop: 8,
}
