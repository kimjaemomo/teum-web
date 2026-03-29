import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReserveForm } from './ReserveForm'

interface Props {
  params: Promise<{ slotId: string }>
}

export default async function ReservePage({ params }: Props) {
  const { slotId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/reserve/${slotId}`)
  }

  const { data: slot } = await supabase
    .from('slots')
    .select(`
      id, title, slot_date, start_time, end_time,
      original_price, discounted_price, max_capacity, reserved_count, status,
      partners!inner(id, business_name, address, image_urls)
    `)
    .eq('id', slotId)
    .single()

  if (!slot) {
    return <ErrorPage message="슬롯을 찾을 수 없습니다." />
  }
  if (slot.status !== 'open') {
    return <ErrorPage message="이미 마감된 슬롯입니다." />
  }

  // 유저 프로필 (이름 미리 채우기용)
  const { data: profile } = await supabase
    .from('users')
    .select('name, phone')
    .eq('id', user.id)
    .single()

  const partner = slot.partners as unknown as {
    id: string; business_name: string; address: string; image_urls: string[] | null
  }

  const discountRate = Math.round(
    (1 - (slot.discounted_price as number) / (slot.original_price as number)) * 100
  )

  return (
    <ReserveForm
      slotId={slotId}
      slotTitle={slot.title as string}
      slotDate={slot.slot_date as string}
      startTime={(slot.start_time as string).slice(0, 5)}
      endTime={(slot.end_time as string).slice(0, 5)}
      originalPrice={slot.original_price as number}
      discountedPrice={slot.discounted_price as number}
      discountRate={discountRate}
      remainingSeats={(slot.max_capacity as number) - (slot.reserved_count as number)}
      partnerName={partner.business_name}
      partnerId={partner.id}
      partnerAddress={partner.address}
      partnerImageUrl={partner.image_urls?.[0] ?? null}
      defaultName={profile?.name ?? ''}
      defaultPhone={profile?.phone ?? ''}
    />
  )
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#F4F0E6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Pretendard', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 28px',
        textAlign: 'center', maxWidth: 320,
        boxShadow: '0 2px 24px rgba(51,71,50,0.10)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1C2B1B', marginBottom: 16 }}>{message}</p>
        <a href="/slots" style={{
          display: 'inline-block', background: '#334732', color: '#fff',
          padding: '12px 24px', borderRadius: 10,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>다른 슬롯 보기</a>
      </div>
    </div>
  )
}
