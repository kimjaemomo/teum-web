import { createClient } from '@/lib/supabase/server'
import { PartnerDashboard } from './PartnerDashboard'

export type PartnerRow = {
  id: string
  name: string
  category: string
  cover_image_url: string | null
  fee_phase: number
}

export type SlotRow = {
  id: string
  slot_type: string
  service_name: string
  original_price: number
  discount_price: number
  discount_rate: number
  available_date: string
  start_time: string
  end_time: string
  total_seats: number
  booked_seats: number
  status: string
  created_at: string
}

export default async function PartnerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4F0E6',
        }}
      >
        <p style={{ color: '#1C2B1B', fontSize: 16, fontFamily: "'Pretendard', sans-serif" }}>
          로그인이 필요합니다.
        </p>
      </main>
    )
  }

  // 파트너 정보 조회
  const { data: partner } = await supabase
    .from('partners')
    .select('id, name, category, cover_image_url, fee_phase')
    .eq('owner_user_id', user.id)
    .single()

  if (!partner) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: '#F4F0E6',
          fontFamily: "'Pretendard', sans-serif",
        }}
      >
        <p style={{ color: '#1C2B1B', fontSize: 16 }}>
          등록된 매장 정보가 없습니다.
        </p>
        <a
          href="/partner/onboard"
          style={{
            padding: '12px 28px',
            background: '#334732',
            color: '#fff',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          파트너 입점 등록
        </a>
      </main>
    )
  }

  // 오늘부터 7일치 슬롯 조회
  const today = new Date().toISOString().slice(0, 10)
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: slots } = await supabase
    .from('slots')
    .select(
      'id, slot_type, service_name, original_price, discount_price, discount_rate, available_date, start_time, end_time, total_seats, booked_seats, status, created_at'
    )
    .eq('partner_id', partner.id)
    .gte('available_date', today)
    .lte('available_date', weekLater)
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true })

  return (
    <PartnerDashboard
      partner={partner as PartnerRow}
      slots={(slots ?? []) as SlotRow[]}
    />
  )
}
