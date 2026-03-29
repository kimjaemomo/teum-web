'use client'

import { useState } from 'react'
import type { CouponRow, CreditHistoryRow } from './page'

interface Props {
  userCoupons: CouponRow[]
  creditBalance: number
  creditHistory: CreditHistoryRow[]
}

// ── 날짜 유틸 ────────────────────────────────────────────────
function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── 쿠폰 할인 값 표시 ─────────────────────────────────────────
function discountLabel(type: string, value: number): string {
  if (type === 'percent') return `${value}%`
  if (type === 'fixed_amount') return `${value.toLocaleString()}원`
  if (type === 'free') return 'FREE'
  return `${value}`
}

function discountSubLabel(type: string, value: number): string {
  if (type === 'percent') return `${value}% 할인`
  if (type === 'fixed_amount') return `${value.toLocaleString()}원 할인`
  if (type === 'free') return '전액 무료'
  return ''
}

// ── 크레딧 이벤트 라벨 ─────────────────────────────────────────
const CREDIT_LABELS: Record<string, { label: string; emoji: string }> = {
  earn_visit: { label: '예약 완료', emoji: '✅' },
  earn_review: { label: '리뷰 작성', emoji: '✍️' },
  earn_referral: { label: '친구 초대', emoji: '👫' },
  earn_event: { label: '이벤트 참여', emoji: '🎉' },
  no_show: { label: '노쇼 패널티', emoji: '❌' },
  use_reservation: { label: '예약 시 사용', emoji: '🎟️' },
  expire: { label: '크레딧 만료', emoji: '⏰' },
  admin_adjust: { label: '관리자 조정', emoji: '🔧' },
}

function getCreditLabel(type: string) {
  return CREDIT_LABELS[type] ?? { label: type, emoji: '•' }
}

// ── 쿠폰 만료 상태 분류 ────────────────────────────────────────
type CouponStatus = 'available' | 'used' | 'expired'

function getCouponStatus(c: CouponRow): CouponStatus {
  if (c.is_used) return 'used'
  if (c.coupon.valid_until) {
    const days = daysUntil(c.coupon.valid_until)
    if (days <= 0) return 'expired'
  }
  return 'available'
}

// ── 탭 타입 ──────────────────────────────────────────────────
type Tab = 'available' | 'used' | 'expired'
const TABS: { key: Tab; label: string }[] = [
  { key: 'available', label: '사용 가능' },
  { key: 'used', label: '사용 완료' },
  { key: 'expired', label: '만료됨' },
]

// ── 크레딧 툴팁 ───────────────────────────────────────────────
function CreditTooltip() {
  const [open, setOpen] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label="크레딧 안내"
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1.5px solid #94B8B3',
          background: 'transparent',
          color: '#94B8B3',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          marginLeft: 6,
          flexShrink: 0,
        }}
      >
        i
      </button>

      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            background: '#0F2E2A',
            color: '#E0EDE8',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 12,
            lineHeight: 1.6,
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        >
          {/* 말풍선 꼬리 */}
          <span
            style={{
              position: 'absolute',
              top: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid #0F2E2A',
            }}
          />
          <strong style={{ color: '#6FCF97', display: 'block', marginBottom: 4 }}>
            💳 틈 크레딧이란?
          </strong>
          예약 완료·리뷰 작성 시 적립되며, 다음 예약 결제 시 현금처럼 차감됩니다.
          <br /><br />
          <strong style={{ color: '#FFD166' }}>노쇼 취소 시</strong>에는 결제된 보증금이 크레딧으로 전환되어 지갑에 자동 입금됩니다.
        </div>
      )}
    </span>
  )
}

// ── 쿠폰 카드 ────────────────────────────────────────────────
function CouponCard({ item }: { item: CouponRow }) {
  const status = getCouponStatus(item)
  const { coupon } = item

  const expiryDays = coupon.valid_until ? daysUntil(coupon.valid_until) : null
  const isUrgent = status === 'available' && expiryDays !== null && expiryDays <= 7 && expiryDays > 0
  const isExpired = status === 'expired'
  const isUsed = status === 'used'

  const dimmed = isExpired || isUsed

  // 할인 크기에 따른 카드 강조색
  const accentColor =
    coupon.type === 'free'
      ? '#9B51E0'
      : coupon.type === 'percent' && coupon.discount_value >= 30
      ? '#0F2E2A'
      : '#1A5C4F'

  return (
    <div
      style={{
        display: 'flex',
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: dimmed ? 'none' : '0 2px 12px rgba(15,46,42,0.08)',
        opacity: dimmed ? 0.5 : 1,
        border: isUrgent ? '1.5px solid #EB5757' : '1.5px solid transparent',
        position: 'relative',
        marginBottom: 12,
      }}
    >
      {/* 왼쪽 할인 컬럼 */}
      <div
        style={{
          width: 80,
          background: dimmed ? '#9E9E9E' : accentColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 8px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* 점선 구분선 (원형 노치) */}
        <div
          style={{
            position: 'absolute',
            right: -10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#F5F1E8',
            zIndex: 1,
          }}
        />
        <span
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {discountLabel(coupon.type, coupon.discount_value)}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 4, textAlign: 'center' }}>
          {coupon.type === 'percent' ? 'OFF' : coupon.type === 'free' ? 'FREE' : '할인'}
        </span>
      </div>

      {/* 오른쪽 정보 컬럼 */}
      <div style={{ flex: 1, padding: '14px 14px 12px 20px' }}>
        {/* 상단: 제목 + 만료 임박 뱃지 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 700,
              color: '#111',
              lineHeight: 1.4,
            }}
          >
            {coupon.title}
          </span>
          {isUrgent && (
            <span
              style={{
                flexShrink: 0,
                background: '#EB5757',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
              }}
            >
              D-{expiryDays}
            </span>
          )}
          {isUsed && (
            <span
              style={{
                flexShrink: 0,
                background: '#eee',
                color: '#999',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 20,
              }}
            >
              사용완료
            </span>
          )}
          {isExpired && (
            <span
              style={{
                flexShrink: 0,
                background: '#eee',
                color: '#999',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 20,
              }}
            >
              만료됨
            </span>
          )}
        </div>

        {/* 할인 조건 */}
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8, lineHeight: 1.5 }}>
          {discountSubLabel(coupon.type, coupon.discount_value)}
          {coupon.min_price > 0 && ` · ${coupon.min_price.toLocaleString()}원 이상 결제 시`}
          {coupon.max_discount != null && ` (최대 ${coupon.max_discount.toLocaleString()}원)`}
        </div>

        {/* 하단: 사용처 + 만료일 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94B8B3', fontWeight: 500 }}>
            🏪 틈 파트너 매장 전체
          </span>
          {coupon.valid_until ? (
            <span
              style={{
                fontSize: 11,
                color: isUrgent ? '#EB5757' : '#999',
                fontWeight: isUrgent ? 700 : 400,
              }}
            >
              {isUsed && item.used_at
                ? `${formatDate(item.used_at)} 사용`
                : `~${formatDate(coupon.valid_until)}`}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: '#999' }}>기간 제한 없음</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 크레딧 잔액 카드 ──────────────────────────────────────────
function CreditBalanceCard({
  balance,
  history,
}: {
  balance: number
  history: CreditHistoryRow[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: '#0F2E2A',
        borderRadius: 20,
        padding: '20px 20px 16px',
        marginBottom: 20,
        color: '#fff',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#94B8B3', fontWeight: 600, letterSpacing: 0.3 }}>
          💳 틈 크레딧
        </span>
        <CreditTooltip />
      </div>

      {/* 잔액 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 16 }}>
        <span
          style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: -1,
            lineHeight: 1,
            color: '#fff',
          }}
        >
          {balance.toLocaleString()}
        </span>
        <span style={{ fontSize: 16, color: '#94B8B3', fontWeight: 600, marginBottom: 4 }}>
          크레딧
        </span>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14 }} />

      {/* 최근 내역 토글 */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: '#6FCF97',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        최근 내역 {history.length}건
        <span
          style={{
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: 10,
          }}
        >
          ▼
        </span>
      </button>

      {/* 내역 리스트 */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {history.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94B8B3', textAlign: 'center', padding: '8px 0' }}>
              내역이 없습니다
            </p>
          ) : (
            history.map((h) => {
              const { label, emoji } = getCreditLabel(h.type)
              const isPositive = h.amount > 0
              return (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#C8DED9' }}>
                      {h.description ?? label}
                    </div>
                    <div style={{ fontSize: 10, color: '#6A8E88', marginTop: 1 }}>
                      {formatShortDate(h.created_at)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isPositive ? '#6FCF97' : '#FF7070',
                    }}
                  >
                    {isPositive ? '+' : ''}{h.amount.toLocaleString()}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── 빈 상태 ──────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { icon: string; text: string }> = {
    available: { icon: '🎟️', text: '보유 중인 쿠폰이 없어요\n예약 완료 후 쿠폰을 받아보세요!' },
    used: { icon: '✅', text: '사용한 쿠폰이 없어요' },
    expired: { icon: '⏰', text: '만료된 쿠폰이 없어요' },
  }
  const { icon, text } = messages[tab]

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 0',
        color: '#bbb',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, whiteSpace: 'pre-line', lineHeight: 1.7 }}>{text}</p>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function CouponWallet({ userCoupons, creditBalance, creditHistory }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('available')

  const filteredCoupons = userCoupons.filter(
    (c) => getCouponStatus(c) === activeTab
  )

  // 탭별 카운트
  const counts: Record<Tab, number> = {
    available: userCoupons.filter((c) => getCouponStatus(c) === 'available').length,
    used: userCoupons.filter((c) => getCouponStatus(c) === 'used').length,
    expired: userCoupons.filter((c) => getCouponStatus(c) === 'expired').length,
  }

  // 만료 임박 쿠폰 수 (7일 이내)
  const urgentCount = userCoupons.filter((c) => {
    if (getCouponStatus(c) !== 'available') return false
    if (!c.coupon.valid_until) return false
    const d = daysUntil(c.coupon.valid_until)
    return d > 0 && d <= 7
  }).length

  return (
    <>
      <style>{`
        .wallet-page {
          min-height: 100vh;
          background: #F5F1E8;
          padding: 28px 16px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, 'Apple SD Gothic Neo', sans-serif;
        }
        .wallet-inner {
          width: 100%;
          max-width: 400px;
        }
        .wallet-title {
          font-size: 22px;
          font-weight: 800;
          color: #0F2E2A;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-bar {
          display: flex;
          background: rgba(15,46,42,0.06);
          border-radius: 12px;
          padding: 3px;
          margin-bottom: 20px;
        }
        .tab-btn {
          flex: 1;
          padding: 9px 0;
          border: none;
          background: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #888;
          transition: background 0.2s, color 0.2s;
          position: 'relative';
        }
        .tab-btn.active {
          background: #0F2E2A;
          color: #fff;
        }
        .tab-count {
          font-size: 11px;
          margin-left: 3px;
          opacity: 0.7;
        }
        .urgent-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFF0F0;
          border: 1px solid #FFCDD2;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #C62828;
          font-weight: 600;
        }
      `}</style>

      <div className="wallet-page">
        <div className="wallet-inner">
          {/* 페이지 타이틀 */}
          <h1 className="wallet-title">🎟️ 쿠폰 지갑</h1>

          {/* 크레딧 잔액 카드 */}
          <CreditBalanceCard balance={creditBalance} history={creditHistory} />

          {/* 만료 임박 알림 배너 */}
          {urgentCount > 0 && (
            <div className="urgent-banner">
              <span style={{ fontSize: 18 }}>🔴</span>
              <span>
                만료 임박 쿠폰이 <strong>{urgentCount}장</strong> 있어요. 지금 사용하세요!
              </span>
            </div>
          )}

          {/* 탭 바 */}
          <div className="tab-bar">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`tab-btn${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
                <span className="tab-count">({counts[key]})</span>
              </button>
            ))}
          </div>

          {/* 쿠폰 카드 목록 */}
          {filteredCoupons.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            filteredCoupons.map((item) => (
              <CouponCard key={item.id} item={item} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
