import Link from 'next/link'

const DEMO_REVIEWS = [
  {
    name: '김**', rating: 5, date: '2026.03.25',
    keywords: ['사장님이 전문적이에요', '가성비가 좋아요'],
    content: '처음 방문했는데 정말 만족스러웠어요! 커트도 깔끔하고 사장님이 너무 친절하셨어요. 틈으로 예약하니까 50% 가까이 할인받아서 완전 득템했습니다. 다음에도 꼭 올게요 :)',
  },
  {
    name: '이**', rating: 4, date: '2026.03.20',
    keywords: ['청결해요', '시간이 잘 지켜져요'],
    content: '깔끔하고 위생적인 매장이에요. 예약 시간 딱 맞춰서 시작해줘서 좋았습니다.',
  },
  {
    name: '익명', rating: 5, date: '2026.03.18',
    keywords: ['또 방문하고 싶어요'],
    content: '공간도 아늑하고 결과물도 마음에 들어요. 틈 트리 XP도 쌓이고 좋네요!',
  },
]

const TREE_EMOJI = ['🌱', '🌿', '🌳', '🌲', '🌲']

export default function DemoStorePage() {
  const avgRating = 4.7

  return (
    <div style={{ minHeight: '100vh', background: '#F4F0E6', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 커버 이미지 */}
      <div style={{ position: 'relative', height: 260, background: '#334732', overflow: 'hidden' }}>
        {/* 그라데이션 플레이스홀더 */}
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #334732 0%, #4a6648 50%, #2d3f2c 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 80,
        }}>
          ✂️
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        }} />
        {/* 뒤로가기 */}
        <Link href="/slots" style={{
          position: 'absolute', top: 16, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', textDecoration: 'none', fontSize: 18,
        }}>←</Link>
        {/* 매장 정보 */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px',
            background: 'rgba(255,255,255,0.15)', borderRadius: 100,
            fontSize: 11, color: '#fff', fontWeight: 600, marginBottom: 6,
          }}>
            헤어살롱
          </div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28, color: '#fff', margin: 0,
          }}>
            헤어살롱 봄
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ color: '#C8A96E', fontSize: 14 }}>🌲🌲🌲🌲🌿</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
              {avgRating} ({DEMO_REVIEWS.length}개 후기)
            </span>
          </div>
        </div>
      </div>

      {/* 예약 가능 슬롯 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 14 }}>
          지금 예약 가능
        </div>
        {[
          { label: 'FLASH', bg: '#C8A96E', service: '커트 + 드라이', time: '오늘 15:00–16:30', price: 28000, original: 45000, seats: '1/2' },
          { label: 'EARLY-BIRD', bg: '#334732', service: '펌 + 커트', time: '내일 10:00–12:00', price: 55000, original: 85000, seats: '0/1' },
        ].map((slot, i) => (
          <Link key={i} href="/reserve/demo" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: '#FAF8F3', borderRadius: 10,
              border: '1px solid #E3DFD4', marginBottom: 8,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    background: slot.bg, color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                  }}>{slot.label}</span>
                  <span style={{ fontSize: 12, color: '#A8A89A' }}>{slot.seats}자리</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1C2B1B' }}>{slot.service}</div>
                <div style={{ fontSize: 12, color: '#A8A89A', marginTop: 3 }}>{slot.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#334732' }}>
                  {slot.price.toLocaleString()}원
                </div>
                <div style={{ fontSize: 12, color: '#A8A89A', textDecoration: 'line-through' }}>
                  {slot.original.toLocaleString()}원
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 매장 정보 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', marginBottom: 12 }}>매장 소개</div>
        <p style={{ fontSize: 14, color: '#6B6B5E', lineHeight: 1.7, margin: '0 0 14px' }}>
          마곡나루역 도보 3분 거리의 여성 전문 헤어샵입니다. 10년 경력의 원장님이 직접 시술하며, 두피 케어부터 컬러까지 다양한 서비스를 제공합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { icon: '📍', text: '서울시 강서구 마곡동 789-3 1층' },
            { icon: '🚇', text: '마곡나루역 도보 3분' },
            { icon: '📞', text: '010-1234-5678' },
            { icon: '🕐', text: '평일 10:00–20:00 · 주말 11:00–18:00' },
          ].map(item => (
            <div key={item.icon} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6B6B5E' }}>
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {['여성컷', '펌', '컬러', '두피케어', '원장직접시술'].map(tag => (
            <span key={tag} style={{
              padding: '4px 10px', background: '#F4F0E6',
              borderRadius: 100, fontSize: 12, color: '#6B6B5E',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* 후기 */}
      <div style={{ background: '#fff', padding: '20px', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B' }}>
            후기 {DEMO_REVIEWS.length}개
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🌲</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#334732' }}>{avgRating}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {DEMO_REVIEWS.map((r, i) => (
            <div key={i} style={{
              padding: '16px', background: '#FAF8F3',
              borderRadius: 12, border: '1px solid #E3DFD4',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#334732',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#fff', fontWeight: 700,
                  }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1C2B1B' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#A8A89A' }}>{r.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {TREE_EMOJI.map((e, j) => (
                    <span key={j} style={{ fontSize: 13, opacity: j < r.rating ? 1 : 0.2 }}>{e}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {r.keywords.map(k => (
                  <span key={k} style={{
                    padding: '3px 8px', background: 'rgba(51,71,50,0.08)',
                    borderRadius: 100, fontSize: 11, color: '#334732', fontWeight: 500,
                  }}>{k}</span>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#6B6B5E', lineHeight: 1.6, margin: 0 }}>{r.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
