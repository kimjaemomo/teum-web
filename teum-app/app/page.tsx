import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#F4F0E6', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <header style={{
        background: '#334732', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#fff' }}>
          틈
        </span>
        <Link href="/partner/login" style={{
          fontSize: 13, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500,
        }}>
          사장님 로그인
        </Link>
      </header>

      {/* 히어로 */}
      <section style={{ background: '#334732', padding: '48px 24px 56px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(200,169,110,0.25)', color: '#C8A96E',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
          padding: '5px 14px', borderRadius: 100, marginBottom: 20,
        }}>
          마곡·가양 뷰티샵 특가
        </div>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 38, color: '#fff', lineHeight: 1.2, marginBottom: 14,
        }}>
          동네 빈 시간,<br />지금 바로 예약
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 32 }}>
          오늘 갑자기 생긴 공실을 최대 50% 할인으로.<br />
          도보 10분 내 검증된 매장에서.
        </p>
        <Link href="/slots" style={{
          display: 'inline-block', background: '#C8A96E', color: '#fff',
          padding: '14px 32px', borderRadius: 10,
          fontSize: 16, fontWeight: 700, textDecoration: 'none',
        }}>
          지금 가능한 슬롯 보기 →
        </Link>
      </section>

      {/* 오늘의 슬롯 */}
      <section style={{ padding: '28px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{
            background: '#C8A96E', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
          }}>FLASH</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B' }}>오늘 마감 임박</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SlotCard
            partnerName="헤어살롱 봄"
            service="커트 + 드라이"
            time="오늘 15:00–16:30"
            originalPrice={45000}
            discountPrice={28000}
            distance="도보 6분"
            type="flash"
          />
          <SlotCard
            partnerName="네일샵 루나"
            service="젤 네일 기본 케어"
            time="오늘 14:00–15:00"
            originalPrice={35000}
            discountPrice={22000}
            distance="도보 9분"
            type="early_bird"
          />
        </div>
        <Link href="/slots" style={{
          display: 'block', textAlign: 'center', marginTop: 14,
          fontSize: 14, color: '#334732', fontWeight: 600, textDecoration: 'none', padding: '12px 0',
        }}>
          전체 슬롯 보기 →
        </Link>
      </section>

      {/* 서비스 특징 */}
      <section style={{ padding: '28px 20px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C2B1B', marginBottom: 16, textAlign: 'center' }}>
          틈이 특별한 이유
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '⚡', title: '30초 예약', desc: '이름 + 연락처만으로 즉시 예약 완료' },
            { icon: '📍', title: '도보 10분 내', desc: '내 동네 검증된 매장만 노출' },
            { icon: '💰', title: '최대 50% 할인', desc: '빈 시간대 한정 특가, 매장도 윈윈' },
            { icon: '🌱', title: '틈 트리', desc: '방문할수록 XP 쌓여 혜택 늘어남' },
          ].map(item => (
            <div key={item.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              background: '#fff', borderRadius: 12, padding: '16px',
              boxShadow: '0 2px 12px rgba(51,71,50,0.06)',
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1C2B1B', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#6B6B5E', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 파트너 CTA */}
      <section style={{
        margin: '0 20px 32px', background: '#334732',
        borderRadius: 16, padding: '28px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>파트너 사장님</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>
          공실 시간을<br />지금 바로 현금으로
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.6 }}>
          1분 안에 슬롯 등록 · 파트너 수수료 0원 (현재)
        </p>
        <Link href="/partner/login" style={{
          display: 'inline-block', background: '#C8A96E', color: '#fff',
          padding: '13px 28px', borderRadius: 10,
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
        }}>
          파트너 시작하기
        </Link>
      </section>

      <footer style={{
        textAlign: 'center', padding: '20px',
        fontSize: 12, color: '#A8A89A', borderTop: '1px solid #E3DFD4',
      }}>
        © 2026 TEUM · myteum.com
      </footer>
    </div>
  )
}

function SlotCard({
  partnerName, service, time, originalPrice, discountPrice, distance, type,
}: {
  partnerName: string; service: string; time: string
  originalPrice: number; discountPrice: number; distance: string
  type: 'flash' | 'early_bird'
}) {
  const discountRate = Math.round((1 - discountPrice / originalPrice) * 100)
  return (
    <Link href="/store/demo" style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '16px',
        boxShadow: '0 2px 12px rgba(51,71,50,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        border: '1px solid #E3DFD4',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              background: type === 'flash' ? '#C8A96E' : '#334732',
              color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 100,
            }}>
              {type === 'flash' ? 'FLASH' : 'EARLY-BIRD'}
            </span>
            <span style={{ fontSize: 12, color: '#A8A89A' }}>{distance}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 2 }}>{partnerName}</div>
          <div style={{ fontSize: 13, color: '#6B6B5E', marginBottom: 4 }}>{service}</div>
          <div style={{ fontSize: 12, color: '#A8A89A' }}>{time}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{
            background: '#FFF4E6', color: '#C8A96E',
            fontSize: 13, fontWeight: 700, padding: '3px 8px',
            borderRadius: 6, marginBottom: 4, display: 'inline-block',
          }}>
            {discountRate}% OFF
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#334732' }}>
            {discountPrice.toLocaleString()}원
          </div>
          <div style={{ fontSize: 12, color: '#A8A89A', textDecoration: 'line-through' }}>
            {originalPrice.toLocaleString()}원
          </div>
        </div>
      </div>
    </Link>
  )
}
