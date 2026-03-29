'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  redirectTo: string
}

// ── 유틸 ──────────────────────────────────────────────────────────

/** 한국 전화번호 → E.164 (+821012345678) */
function toE164(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+' + digits
}

/** 전화번호 자동 하이픈 포맷 (010-1234-5678) */
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 11)
  if (digits.length < 4)  return digits
  if (digits.length < 8)  return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function isValidPhone(display: string): boolean {
  const digits = display.replace(/[^0-9]/g, '')
  return digits.length === 11 && digits.startsWith('010')
}

// ── 컴포넌트 ──────────────────────────────────────────────────────

type Step = 'phone' | 'otp'

const OTP_EXPIRE_SEC = 180 // 3분

export function LoginForm({ redirectTo }: Props) {
  const router = useRouter()
  const supabase = useRef(createClient())

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')          // 표시용 (하이픈 포함)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // OTP 재전송 쿨다운
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCountdown() {
    setCountdown(OTP_EXPIRE_SEC)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function formatCountdown(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── Step 1: 전화번호 입력 → OTP 발송 ─────────────────────────

  async function handleSendOtp() {
    if (!isValidPhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요. (010으로 시작하는 11자리)')
      return
    }
    setIsLoading(true)
    setError(null)

    const e164 = toE164(phone)
    const { error: authError } = await supabase.current.auth.signInWithOtp({
      phone: e164,
    })

    if (authError) {
      setError(authError.message === 'SMS send rate limit exceeded'
        ? '잠시 후 다시 시도해주세요. (SMS 발송 제한)'
        : `발송 오류: ${authError.message}`)
    } else {
      setStep('otp')
      startCountdown()
    }
    setIsLoading(false)
  }

  // ── Step 2: OTP 확인 → 세션 발급 ─────────────────────────────

  async function handleVerifyOtp() {
    if (otp.length < 6) {
      setError('6자리 인증번호를 입력해주세요.')
      return
    }
    setIsLoading(true)
    setError(null)

    const e164 = toE164(phone)
    const { error: verifyError } = await supabase.current.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: 'sms',
    })

    if (verifyError) {
      setError(verifyError.message.includes('Token has expired')
        ? '인증번호가 만료되었습니다. 다시 받아주세요.'
        : verifyError.message.includes('Invalid')
          ? '인증번호가 올바르지 않습니다.'
          : `오류: ${verifyError.message}`)
      setIsLoading(false)
      return
    }

    // 세션 발급 성공 → 서버 컴포넌트 재갱신 후 이동
    router.refresh()
    router.push(redirectTo)
  }

  // ── OTP 재전송 ─────────────────────────────────────────────────

  async function handleResend() {
    if (countdown > 0) return
    setOtp('')
    setError(null)
    setIsLoading(true)

    const e164 = toE164(phone)
    const { error: authError } = await supabase.current.auth.signInWithOtp({ phone: e164 })

    if (authError) {
      setError(`재전송 오류: ${authError.message}`)
    } else {
      startCountdown()
    }
    setIsLoading(false)
  }

  // ── 렌더 ───────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          background: #F4F0E6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: 'Pretendard', -apple-system, sans-serif;
        }
        .login-card {
          width: 100%;
          max-width: 360px;
          background: #fff;
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 2px 24px rgba(51,71,50,0.10);
        }
        .phone-input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #E3DFD4;
          border-radius: 10px;
          font-size: 16px;
          font-family: 'Pretendard', sans-serif;
          color: #1C2B1B;
          outline: none;
          transition: border-color 200ms ease;
          box-sizing: border-box;
          letter-spacing: 0.5px;
        }
        .phone-input:focus { border-color: #334732; }
        .phone-input::placeholder { color: #C4C4B8; }
        .otp-input {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #E3DFD4;
          border-radius: 10px;
          font-size: 24px;
          font-family: 'Pretendard', sans-serif;
          color: #1C2B1B;
          outline: none;
          transition: border-color 200ms ease;
          box-sizing: border-box;
          letter-spacing: 8px;
          text-align: center;
        }
        .otp-input:focus { border-color: #334732; }
        .otp-input::placeholder { letter-spacing: 0; font-size: 14px; color: #C4C4B8; }
        .primary-btn {
          width: 100%;
          padding: 14px 0;
          background: #334732;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Pretendard', sans-serif;
          transition: opacity 200ms ease;
        }
        .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .resend-btn {
          background: none;
          border: none;
          font-size: 13px;
          font-family: 'Pretendard', sans-serif;
          cursor: pointer;
          padding: 0;
          transition: color 200ms ease;
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          {/* 로고 영역 */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1C2B1B',
              letterSpacing: '-0.3px',
            }}>
              틈 파트너
            </div>
            <div style={{ fontSize: 13, color: '#A8A89A', marginTop: 4 }}>
              사장님 전용 공간
            </div>
          </div>

          {step === 'phone' ? (
            /* ── Step 1: 전화번호 입력 ── */
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6B5E', marginBottom: 8 }}>
                휴대폰 번호
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="010-0000-0000"
                value={phone}
                onChange={e => {
                  setError(null)
                  setPhone(formatPhoneDisplay(e.target.value))
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleSendOtp() }}
                className="phone-input"
                maxLength={13}
                autoFocus
              />

              {error && (
                <div style={{
                  marginTop: 10,
                  padding: '9px 12px',
                  background: '#FEE2E2',
                  borderRadius: 8,
                  color: '#C0392B',
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <button
                className="primary-btn"
                style={{ marginTop: 16 }}
                onClick={handleSendOtp}
                disabled={isLoading || !isValidPhone(phone)}
              >
                {isLoading ? '발송 중...' : '인증번호 받기'}
              </button>

              <p style={{
                marginTop: 16,
                fontSize: 12,
                color: '#A8A89A',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                틈 파트너로 등록된 번호만 접근 가능합니다.<br />
                등록 문의: contact@myteum.com
              </p>
            </div>
          ) : (
            /* ── Step 2: OTP 입력 ── */
            <div>
              {/* 발송 안내 */}
              <div style={{
                padding: '12px 14px',
                background: '#F4F0E6',
                borderRadius: 10,
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: '#6B6B5E', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: '#334732' }}>{phone}</span>
                  으로<br />인증번호를 발송했습니다.
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6B5E', marginBottom: 8 }}>
                인증번호 6자리
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="인증번호 입력"
                value={otp}
                onChange={e => {
                  setError(null)
                  setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp() }}
                className="otp-input"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
              />

              {/* 만료 카운트다운 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                marginBottom: 4,
              }}>
                <span style={{
                  fontSize: 13,
                  color: countdown > 0 && countdown <= 30 ? '#C0392B' : '#A8A89A',
                  fontWeight: countdown > 0 && countdown <= 30 ? 600 : 400,
                }}>
                  {countdown > 0
                    ? `${formatCountdown(countdown)} 후 만료`
                    : '인증번호가 만료되었습니다'}
                </span>
                <button
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading}
                  style={{ color: countdown > 0 ? '#C4C4B8' : '#334732' }}
                >
                  재전송
                  {countdown > 0 && (
                    <span style={{ marginLeft: 4, color: '#A8A89A' }}>
                      ({formatCountdown(countdown)})
                    </span>
                  )}
                </button>
              </div>

              {error && (
                <div style={{
                  marginTop: 8,
                  padding: '9px 12px',
                  background: '#FEE2E2',
                  borderRadius: 8,
                  color: '#C0392B',
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <button
                className="primary-btn"
                style={{ marginTop: 16 }}
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? '확인 중...' : '확인'}
              </button>

              {/* 번호 변경 */}
              <button
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError(null)
                  setCountdown(0)
                  if (timerRef.current) clearInterval(timerRef.current)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 12,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  color: '#A8A89A',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: "'Pretendard', sans-serif",
                  textAlign: 'center',
                }}
              >
                ← 전화번호 다시 입력
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
