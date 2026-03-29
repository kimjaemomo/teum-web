import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewForm } from './ReviewForm'

interface Props {
  params: Promise<{ reservationId: string }>
}

export default async function ReviewPage({ params }: Props) {
  const { reservationId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/partner/login?next=/review/${reservationId}`)
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select(`
      id, status, user_id,
      partners!inner(id, business_name, image_urls),
      slots!inner(title, slot_date, start_time)
    `)
    .eq('id', reservationId)
    .single()

  if (!reservation) {
    return <ErrorCard message="예약을 찾을 수 없습니다." />
  }

  if ((reservation.user_id as string) !== user.id) {
    return <ErrorCard message="본인의 예약이 아닙니다." />
  }

  if (reservation.status !== 'visited') {
    return (
      <ErrorCard message="방문 완료 후 후기를 작성할 수 있습니다." hint={`현재 상태: ${statusLabel(reservation.status as string)}`} />
    )
  }

  // 이미 후기 작성 여부 확인
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('reservation_id', reservationId)
    .single()

  if (existing) {
    const partner = reservation.partners as unknown as { id: string; business_name: string }
    return (
      <ErrorCard
        message="이미 후기를 작성하셨습니다."
        hint={`${partner.business_name}에 대한 후기가 등록되어 있습니다.`}
        linkHref={`/store/${partner.id}`}
        linkLabel="매장 페이지 보기"
      />
    )
  }

  const partner = reservation.partners as unknown as {
    id: string; business_name: string; image_urls: string[] | null
  }
  const slot = reservation.slots as unknown as {
    title: string; slot_date: string; start_time: string
  }

  return (
    <ReviewForm
      reservationId={reservationId}
      partnerId={partner.id}
      partnerName={partner.business_name}
      partnerImageUrl={partner.image_urls?.[0] ?? null}
      slotTitle={slot.title}
      slotDate={slot.slot_date}
    />
  )
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '대기 중', confirmed: '확정', cancelled: '취소됨', no_show: '노쇼',
  }
  return map[status] ?? status
}

function ErrorCard({
  message, hint, linkHref, linkLabel,
}: {
  message: string
  hint?: string
  linkHref?: string
  linkLabel?: string
}) {
  return (
    <div style={{
      minHeight: '100vh', background: '#F4F0E6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'Pretendard', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 360, background: '#fff',
        borderRadius: 20, padding: '32px 24px',
        boxShadow: '0 2px 24px rgba(51,71,50,0.10)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1C2B1B', marginBottom: 8 }}>
          {message}
        </div>
        {hint && (
          <div style={{ fontSize: 13, color: '#A8A89A', marginBottom: 16 }}>{hint}</div>
        )}
        {linkHref && linkLabel && (
          <a href={linkHref} style={{
            display: 'inline-block', padding: '10px 20px',
            background: '#334732', color: '#fff',
            borderRadius: 8, fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
          }}>
            {linkLabel}
          </a>
        )}
      </div>
    </div>
  )
}
