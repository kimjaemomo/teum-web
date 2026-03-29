import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_EMOJI: Record<string, string> = {
  pilates: '🧘', yoga: '🧘', esthetic: '✨',
  hair_salon: '✂️', nail: '💅', massage: '💆',
  fitness: '💪', one_day_class: '🎨', etc: '🌿',
}

export default async function SlotsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: slots } = await supabase
    .from('slots')
    .select(`
      id, title, slot_date, start_time, end_time,
      original_price, discounted_price, max_capacity, reserved_count,
      partners!inner(id, business_name, category, neighborhood, image_urls)
    `)
    .eq('status', 'open')
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .limit(30)

  return (
    <div style={{ minHeight: '100vh', background: '#F4F0E6', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <header style={{
        background: '#334732', padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 12, height: 56,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>근처 슬롯</span>
      </header>

      {/* 위치 배너 */}
      <div style={{
        background: '#fff', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid #E3DFD4', fontSize: 13, color: '#6B6B5E',
      }}>
        <span>📍</span>
        <span>마곡나루역 기준 반경 2km</span>
        <span style={{ marginLeft: 'auto', color: '#334732', fontWeight: 600, fontSize: 12 }}>
          {slots?.length ?? 0}개
        </span>
      </div>

      {/* 슬롯 목록 */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!slots || slots.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            fontSize: 14, color: '#A8A89A',
          }}>
            현재 예약 가능한 슬롯이 없습니다.<br />
            <span style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
              파트너가 슬롯을 등록하면 여기에 표시됩니다.
            </span>
          </div>
        ) : (
          slots.map(slot => {
            const partner = slot.partners as unknown as {
              id: string; business_name: string; category: string
              neighborhood: string; image_urls: string[] | null
            }
            const rate = Math.round(
              (1 - (slot.discounted_price as number) / (slot.original_price as number)) * 100
            )
            const remaining = (slot.max_capacity as number) - (slot.reserved_count as number)
            const isToday = slot.slot_date === today

            return (
              <Link key={slot.id} href={`/reserve/${slot.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', borderRadius: 14, padding: '16px',
                  boxShadow: '0 2px 12px rgba(51,71,50,0.06)',
                  border: '1px solid #E3DFD4',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{
                          background: isToday ? '#C8A96E' : '#334732',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 100,
                        }}>
                          {isToday ? 'FLASH' : 'EARLY-BIRD'}
                        </span>
                        <span style={{ fontSize: 12, color: '#A8A89A' }}>{partner.neighborhood}</span>
                        <span style={{ fontSize: 12, color: '#A8A89A' }}>· {remaining}/{slot.max_capacity}자리</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 14 }}>
                          {CATEGORY_EMOJI[partner.category] ?? '🌿'}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B' }}>
                          {partner.business_name}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6B6B5E', marginBottom: 4 }}>{slot.title}</div>
                      <div style={{ fontSize: 12, color: '#A8A89A' }}>
                        {slot.slot_date} {(slot.start_time as string).slice(0, 5)}–{(slot.end_time as string).slice(0, 5)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div style={{
                        background: '#FFF4E6', color: '#C8A96E',
                        fontSize: 13, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 6, marginBottom: 6, display: 'inline-block',
                      }}>
                        {rate}% OFF
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#334732' }}>
                        {(slot.discounted_price as number).toLocaleString()}원
                      </div>
                      <div style={{ fontSize: 12, color: '#A8A89A', textDecoration: 'line-through' }}>
                        {(slot.original_price as number).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}
