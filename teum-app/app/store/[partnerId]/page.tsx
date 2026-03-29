import { createClient } from '@/lib/supabase/server'
import { ReviewList } from './ReviewList'

interface Props {
  params: Promise<{ partnerId: string }>
}

export type ReviewRow = {
  id: string
  rating: number
  content: string
  image_urls: string[] | null
  is_anonymous: boolean
  keywords: string[] | null
  reviewer_name: string | null
  created_at: string
}

export default async function StorePage({ params }: Props) {
  const { partnerId } = await params
  const supabase = await createClient()

  const [partnerResult, reviewsResult, slotsResult] = await Promise.all([
    supabase
      .from('partners')
      .select('id, business_name, category, description, address, neighborhood, image_urls, tags, phone')
      .eq('id', partnerId)
      .single(),

    supabase
      .from('reviews')
      .select('id, rating, content, image_urls, is_anonymous, keywords, reviewer_name, created_at')
      .eq('partner_id', partnerId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('slots')
      .select('id, title, slot_date, start_time, end_time, discounted_price, original_price, status, max_capacity, reserved_count')
      .eq('partner_id', partnerId)
      .eq('status', 'open')
      .gte('slot_date', new Date().toISOString().slice(0, 10))
      .order('slot_date', { ascending: true })
      .limit(5),
  ])

  const partner = partnerResult.data
  if (!partner) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F4F0E6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Pretendard', sans-serif",
      }}>
        <p style={{ color: '#A8A89A' }}>매장을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const reviews = (reviewsResult.data ?? []) as ReviewRow[]
  const slots = slotsResult.data ?? []

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const coverImage = (partner.image_urls as string[] | null)?.[0] ?? null
  const galleryImages = (partner.image_urls as string[] | null)?.slice(1) ?? []

  return (
    <div style={{
      minHeight: '100vh', background: '#F4F0E6',
      fontFamily: "'Pretendard', -apple-system, sans-serif",
    }}>
      {/* 커버 이미지 */}
      <div style={{ position: 'relative', height: 260, background: '#334732', overflow: 'hidden' }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={partner.business_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 60,
          }}>🌿</div>
        )}
        {/* 그라데이션 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
        }} />
        {/* 매장명 */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20, right: 20,
        }}>
          <div style={{
            display: 'inline-block',
            padding: '3px 10px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 100,
            fontSize: 11, color: '#fff', fontWeight: 600,
            marginBottom: 6, letterSpacing: '0.04em',
          }}>
            {categoryLabel(partner.category as string)}
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, color: '#fff',
            margin: 0, letterSpacing: '-0.3px',
            fontFamily: "'DM Serif Display', serif",
          }}>
            {partner.business_name}
          </h1>
          {reviews.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#C8A96E', fontSize: 14 }}>
                {'🌲'.repeat(Math.round(averageRating))}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                {averageRating.toFixed(1)} ({reviews.length}개 후기)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 예약 가능 슬롯 */}
      {slots.length > 0 && (
        <div style={{ background: '#fff', padding: '20px 20px', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 14 }}>
            지금 예약 가능
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slots.map(slot => (
              <div key={slot.id} style={{
                padding: '14px 16px', background: '#FAF8F3',
                borderRadius: 10, border: '1px solid #E3DFD4',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1C2B1B' }}>{slot.title}</div>
                    <div style={{ fontSize: 12, color: '#A8A89A', marginTop: 4 }}>
                      {slot.slot_date} {(slot.start_time as string).slice(0, 5)}–{(slot.end_time as string).slice(0, 5)}
                      {' · '}{(slot.reserved_count as number)}/{slot.max_capacity}자리
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#334732' }}>
                      {(slot.discounted_price as number).toLocaleString()}원
                    </div>
                    {slot.original_price !== slot.discounted_price && (
                      <div style={{ fontSize: 11, color: '#A8A89A', textDecoration: 'line-through' }}>
                        {(slot.original_price as number).toLocaleString()}원
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 매장 정보 */}
      <div style={{ background: '#fff', padding: '20px 20px', marginBottom: 8 }}>
        {partner.description && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 10 }}>매장 소개</div>
            <p style={{ fontSize: 14, color: '#6B6B5E', lineHeight: 1.7, margin: 0 }}>
              {partner.description as string}
            </p>
          </>
        )}
        <div style={{ marginTop: partner.description ? 16 : 0 }}>
          {partner.address && (
            <InfoRow icon="📍" text={partner.address as string} />
          )}
          {partner.phone && (
            <InfoRow icon="📞" text={partner.phone as string} />
          )}
        </div>
        {(partner.tags as string[] | null)?.length ? (
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(partner.tags as string[]).map(tag => (
              <span key={tag} style={{
                padding: '4px 10px', background: '#F4F0E6',
                borderRadius: 100, fontSize: 12, color: '#6B6B5E', fontWeight: 500,
              }}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* 갤러리 */}
      {galleryImages.length > 0 && (
        <div style={{ background: '#fff', padding: '20px 0', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 12, paddingLeft: 20 }}>
            갤러리
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingLeft: 20, paddingRight: 20 }}>
            {galleryImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`갤러리 ${i + 1}`}
                style={{
                  width: 120, height: 120, borderRadius: 10,
                  objectFit: 'cover', flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 후기 목록 */}
      <ReviewList
        reviews={reviews}
        partnerName={partner.business_name as string}
        averageRating={averageRating}
      />

      {/* 하단 여백 */}
      <div style={{ height: 24 }} />
    </div>
  )
}

function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    pilates: '필라테스', yoga: '요가', esthetic: '에스테틱',
    hair_salon: '헤어살롱', nail: '네일', massage: '마사지',
    fitness: '피트니스', one_day_class: '원데이 클래스', etc: '기타',
  }
  return map[category] ?? category
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0' }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: '#6B6B5E', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}
