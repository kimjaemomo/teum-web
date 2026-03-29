'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DemoReservePage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [step, setStep] = useState<'form' | 'done'>('form')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  function handleSubmit() {
    if (!name.trim() || phone.replace(/\D/g, '').length < 10 || !agreed) return
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div style={{
        minHeight: '100vh', background: '#F4F0E6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'Pretendard', -apple-system, sans-serif",
      }}>
        <div style={{
          width: '100%', maxWidth: 360, background: '#fff',
          borderRadius: 20, padding: '40px 28px', textAlign: 'center',
          boxShadow: '0 2px 24px rgba(51,71,50,0.10)',
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🌱</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B1B', marginBottom: 8 }}>
            예약 완료!
          </h2>
          <p style={{ fontSize: 14, color: '#6B6B5E', lineHeight: 1.7, marginBottom: 8 }}>
            <strong style={{ color: '#334732' }}>헤어살롱 봄</strong>에<br />
            커트 + 드라이 예약이 확정되었습니다.
          </p>
          <div style={{
            background: '#FAF8F3', borderRadius: 12, padding: '16px', margin: '20px 0',
            textAlign: 'left',
          }}>
            {[
              ['예약자', name],
              ['연락처', phone],
              ['일시', '오늘 15:00–16:30'],
              ['결제', '28,000원 (현장 결제)'],
              ['보증금', '1,000원 (방문 시 환급)'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid #F4F0E6',
                fontSize: 13,
              }}>
                <span style={{ color: '#A8A89A' }}>{label}</span>
                <span style={{ color: '#1C2B1B', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: '#F0F7EE', borderRadius: 10, padding: '12px 14px',
            fontSize: 12, color: '#334732', marginBottom: 24, lineHeight: 1.6,
          }}>
            📱 예약 확정 문자가 발송되었습니다.<br />
            방문 후 QR 인증 시 보증금 1,000원 환급!
          </div>
          <Link href="/" style={{
            display: 'block', background: '#334732', color: '#fff',
            padding: '14px 0', borderRadius: 10, textDecoration: 'none',
            fontSize: 15, fontWeight: 700,
          }}>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const canSubmit = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 10 && agreed

  return (
    <div style={{ minHeight: '100vh', background: '#F4F0E6', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <header style={{
        background: '#334732', height: 56, padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link href="/store/demo" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>예약하기</span>
      </header>

      {/* 슬롯 요약 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <span style={{
                background: '#C8A96E', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              }}>FLASH</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1C2B1B' }}>헤어살롱 봄</div>
            <div style={{ fontSize: 14, color: '#6B6B5E', marginTop: 2 }}>커트 + 드라이</div>
            <div style={{ fontSize: 13, color: '#A8A89A', marginTop: 4 }}>
              오늘 15:00–16:30 · 도보 6분
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#334732' }}>28,000원</div>
            <div style={{ fontSize: 12, color: '#A8A89A', textDecoration: 'line-through' }}>45,000원</div>
            <div style={{ fontSize: 12, color: '#C8A96E', fontWeight: 700 }}>38% OFF</div>
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
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #E3DFD4', borderRadius: 10,
                fontSize: 15, color: '#1C2B1B',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: "'Pretendard', sans-serif",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#6B6B5E', display: 'block', marginBottom: 6 }}>연락처</label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #E3DFD4', borderRadius: 10,
                fontSize: 15, color: '#1C2B1B',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: "'Pretendard', sans-serif",
              }}
            />
          </div>
        </div>
      </div>

      {/* 결제 안내 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 12 }}>결제 안내</div>
        {[
          { label: '시술 금액', value: '28,000원 (현장 결제)', muted: true },
          { label: '보증금', value: '1,000원', muted: false },
          { label: '플랫폼 이용료', value: '500원', muted: false },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: '1px solid #F4F0E6', fontSize: 14,
          }}>
            <span style={{ color: '#6B6B5E' }}>{item.label}</span>
            <span style={{ color: item.muted ? '#A8A89A' : '#1C2B1B', fontWeight: 600 }}>{item.value}</span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
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
          <div
            onClick={() => setAgreed(p => !p)}
            style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${agreed ? '#334732' : '#E3DFD4'}`,
              background: agreed ? '#334732' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1, cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {agreed && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: '#6B6B5E', lineHeight: 1.5 }}>
            노쇼 시 보증금 1,000원이 차감되며 틈 트리에 패널티가 적용됩니다. 예약 조건에 동의합니다.
          </span>
        </label>
      </div>

      {/* 예약 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 20px',
        background: '#fff', borderTop: '1px solid #E3DFD4',
      }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '16px 0',
            background: canSubmit ? '#334732' : '#E3DFD4',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: "'Pretendard', sans-serif",
            transition: 'background 200ms ease',
          }}
        >
          1,500원 결제하고 예약 완료
        </button>
      </div>
    </div>
  )
}
