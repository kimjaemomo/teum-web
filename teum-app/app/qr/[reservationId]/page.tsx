import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markVisited } from '@/app/actions/reviews'

interface Props {
  params: Promise<{ reservationId: string }>
}

export default async function QrPage({ params }: Props) {
  const { reservationId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/partner/login?next=/qr/${reservationId}`)
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select(`
      id, status, user_name, user_phone, visited_at,
      slots!inner(title, slot_date, start_time, end_time, discounted_price),
      partners!inner(id, business_name, owner_id)
    `)
    .eq('id', reservationId)
    .single()

  if (!reservation) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>❌</div>
          <p style={{ textAlign: 'center', color: '#C0392B' }}>
            예약을 찾을 수 없습니다.
          </p>
        </div>
      </div>
    )
  }

  const partner = reservation.partners as unknown as {
    id: string; business_name: string; owner_id: string
  }
  const slot = reservation.slots as unknown as {
    title: string; slot_date: string; start_time: string
    end_time: string; discounted_price: number
  }

  const isPartnerOwner = partner.owner_id === user.id
  const isVisited = reservation.status === 'visited'

  // 방문 완료 처리 Server Action form
  async function handleMarkVisited() {
    'use server'
    await markVisited(reservationId)
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            {isVisited ? '✅' : '📋'}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700, color: '#1C2B1B',
            fontFamily: "'Pretendard', sans-serif",
          }}>
            {isVisited ? '방문 완료' : '예약 확인'}
          </div>
          <div style={{ fontSize: 13, color: '#A8A89A', marginTop: 4, fontFamily: "'Pretendard', sans-serif" }}>
            {partner.business_name}
          </div>
        </div>

        {/* 예약 정보 */}
        <div style={infoBoxStyle}>
          <Row label="예약자" value={reservation.user_name as string} />
          <Row label="연락처" value={reservation.user_phone as string} />
          <Row label="서비스" value={slot.title} />
          <Row label="일시" value={`${slot.slot_date} ${(slot.start_time as string).slice(0, 5)}–${(slot.end_time as string).slice(0, 5)}`} />
          <Row label="금액" value={`${(slot.discounted_price as number).toLocaleString()}원`} />
          <Row label="상태" value={statusLabel(reservation.status as string)} />
        </div>

        {/* 파트너 뷰: 방문 처리 버튼 */}
        {isPartnerOwner && !isVisited && reservation.status === 'confirmed' && (
          <form action={handleMarkVisited} style={{ marginTop: 20 }}>
            <button type="submit" style={primaryBtnStyle}>
              방문 완료 처리
            </button>
          </form>
        )}

        {/* 방문 완료 확인 */}
        {isVisited && (
          <div style={{
            marginTop: 20, padding: '14px 16px',
            background: '#F0F7EE', borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: '#334732', fontWeight: 600, fontFamily: "'Pretendard', sans-serif" }}>
              방문 완료 처리되었습니다 🌱
            </div>
            {isPartnerOwner ? (
              <div style={{ fontSize: 12, color: '#6B6B5E', marginTop: 4, fontFamily: "'Pretendard', sans-serif" }}>
                고객에게 +10 XP 자동 지급됩니다.
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#6B6B5E', marginTop: 4, fontFamily: "'Pretendard', sans-serif" }}>
                후기를 작성하면 보증금 1,000원이 환급됩니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '대기 중',
    confirmed: '확정',
    visited: '방문 완료',
    cancelled: '취소됨',
    no_show: '노쇼',
  }
  return map[status] ?? status
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '8px 0',
      borderBottom: '1px solid #F4F0E6',
      fontFamily: "'Pretendard', sans-serif",
    }}>
      <span style={{ fontSize: 12, color: '#A8A89A' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1C2B1B', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ── 스타일 ───────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F4F0E6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  fontFamily: "'Pretendard', sans-serif",
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  background: '#fff',
  borderRadius: 20,
  padding: '28px 24px',
  boxShadow: '0 2px 24px rgba(51,71,50,0.10)',
}

const infoBoxStyle: React.CSSProperties = {
  background: '#FAF8F3',
  borderRadius: 10,
  padding: '4px 12px',
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  background: '#334732',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Pretendard', sans-serif",
}
