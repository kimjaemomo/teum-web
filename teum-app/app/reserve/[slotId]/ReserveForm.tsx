'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReservation } from '@/app/actions/reservations'

interface Props {
  slotId: string
  slotTitle: string
  slotDate: string
  startTime: string
  endTime: string
  originalPrice: number
  discountedPrice: number
  discountRate: number
  remainingSeats: number
  partnerName: string
  partnerId: string
  partnerAddress: string
  partnerImageUrl: string | null
  defaultName: string
  defaultPhone: string
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export function ReserveForm({
  slotId, slotTitle, slotDate, startTime, endTime,
  originalPrice, discountedPrice, discountRate, remainingSeats,
  partnerName, partnerId, partnerAddress, partnerImageUrl,
  defaultName, defaultPhone,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(formatPhone(defaultPhone))
  const [memo, setMemo] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reservationId, setReservationId] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 10 && agreed && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    const result = await createReservation({
      slotId,
      userName: name,
      userPhone: phone,
      memo: memo || undefined,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setReservationId(result.reservationId!)
  }

  // 예약 완료 화면
  if (reservationId) {
    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/qr/${reservationId}`
    return (
      <div style={{
        minHeight: '100vh', background: '#F4F0E6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'Pretendard', -apple-system, sans-serif",
      }}>
        <div style={{
          width: '100%', maxWidth: 360, background: '#fff',
          borderRadius: 20, padding: '36px 28px', textAlign: 'center',
          boxShadow: '0 2px 24px rgba(51,71,50,0.10)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🌱</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B1B', marginBottom: 6 }}>예약 완료!</h2>
          <p style={{ fontSize: 14, color: '#6B6B5E', marginBottom: 20, lineHeight: 1.6 }}>
            <strong style={{ color: '#334732' }}>{partnerName}</strong>에<br />
            {slotTitle} 예약이 확정되었습니다.
          </p>

          {/* 예약 요약 */}
          <div style={{ background: '#FAF8F3', borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
            {[
              ['예약자', name],
              ['일시', `${slotDate} ${startTime}–${endTime}`],
              ['결제', `${discountedPrice.toLocaleString()}원 현장`],
              ['보증금', '1,000원 방문 후 환급'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid #F4F0E6', fontSize: 13,
              }}>
                <span style={{ color: '#A8A89A' }}>{label}</span>
                <span style={{ color: '#1C2B1B', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* QR 코드 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#6B6B5E', marginBottom: 10, fontWeight: 600 }}>
              방문 시 사장님께 QR 보여주세요
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`}
              alt="예약 QR코드"
              style={{ width: 160, height: 160, borderRadius: 10, border: '1px solid #E3DFD4' }}
            />
          </div>

          <a href="/" style={{
            display: 'block', background: '#334732', color: '#fff',
            padding: '14px 0', borderRadius: 10, textDecoration: 'none',
            fontSize: 15, fontWeight: 700,
          }}>
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F0E6', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <header style={{
        background: '#334732', height: 56, padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer',
        }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>예약하기</span>
      </header>

      {/* 슬롯 요약 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {partnerImageUrl ? (
            <img src={partnerImageUrl} alt={partnerName} style={{
              width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: 10, background: '#F4F0E6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0,
            }}>✂️</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1C2B1B', marginBottom: 3 }}>{partnerName}</div>
            <div style={{ fontSize: 14, color: '#6B6B5E', marginBottom: 3 }}>{slotTitle}</div>
            <div style={{ fontSize: 13, color: '#A8A89A' }}>
              {slotDate} {startTime}–{endTime} · 잔여 {remainingSeats}자리
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              background: '#FFF4E6', color: '#C8A96E',
              fontSize: 12, fontWeight: 700, padding: '2px 8px',
              borderRadius: 6, marginBottom: 4, display: 'inline-block',
            }}>{discountRate}% OFF</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#334732' }}>
              {discountedPrice.toLocaleString()}원
            </div>
            <div style={{ fontSize: 12, color: '#A8A89A', textDecoration: 'line-through' }}>
              {originalPrice.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>

      {/* 예약자 정보 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 16 }}>예약자 정보</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: '#6B6B5E', display: 'block', marginBottom: 6 }}>이름</label>
            <input
              type="text" placeholder="홍길동" value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#6B6B5E', display: 'block', marginBottom: 6 }}>연락처</label>
            <input
              type="tel" placeholder="010-0000-0000"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#6B6B5E', display: 'block', marginBottom: 6 }}>
              요청사항 <span style={{ color: '#A8A89A' }}>(선택)</span>
            </label>
            <textarea
              placeholder="특별히 요청하실 사항이 있으신가요?"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* 결제 안내 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 12 }}>결제 안내</div>
        {[
          { label: '시술 금액', value: `${discountedPrice.toLocaleString()}원`, sub: '현장 결제' },
          { label: '보증금', value: '1,000원', sub: '방문 후 크레딧 환급' },
          { label: '플랫폼 이용료', value: '500원', sub: '노쇼 방지 운영비' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 0', borderBottom: '1px solid #F4F0E6',
          }}>
            <span style={{ fontSize: 14, color: '#6B6B5E' }}>{item.label}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1C2B1B' }}>{item.value}</div>
              <div style={{ fontSize: 11, color: '#A8A89A' }}>{item.sub}</div>
            </div>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 0', fontSize: 15, fontWeight: 700,
        }}>
          <span style={{ color: '#1C2B1B' }}>지금 결제</span>
          <span style={{ color: '#334732' }}>1,500원</span>
        </div>
        <div style={{
          background: '#F0F7EE', borderRadius: 8, padding: '10px 12px',
          fontSize: 12, color: '#334732', lineHeight: 1.6,
        }}>
          🌱 방문 후 QR 인증 시 보증금 1,000원이 틈 크레딧으로 환급됩니다.
        </div>
      </div>

      {/* 동의 */}
      <div style={{ background: '#fff', padding: '16px 20px', marginBottom: 100 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <div onClick={() => setAgreed(p => !p)} style={{
            width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${agreed ? '#334732' : '#E3DFD4'}`,
            background: agreed ? '#334732' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1, cursor: 'pointer',
            transition: 'all 200ms ease',
          }}>
            {agreed && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: '#6B6B5E', lineHeight: 1.5 }}>
            노쇼 시 보증금 1,000원이 차감되며 틈 트리에 패널티가 적용됩니다. 예약 조건에 동의합니다.
          </span>
        </label>
        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: '#FEF0EE', borderRadius: 8,
            fontSize: 13, color: '#C0392B',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 20px', background: '#fff', borderTop: '1px solid #E3DFD4',
      }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '16px 0',
            background: canSubmit ? '#334732' : '#E3DFD4',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: "'Pretendard', sans-serif",
            transition: 'background 200ms ease',
          }}
        >
          {loading ? '처리 중...' : '1,500원 결제하고 예약 완료'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #E3DFD4', borderRadius: 10,
  fontSize: 15, color: '#1C2B1B',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Pretendard', sans-serif",
}
