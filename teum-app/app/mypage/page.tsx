import { createClient } from '@/lib/supabase/server'
import { getXpSummary } from '@/lib/gamification'
import { TreeDisplay } from './TreeDisplay'

export default async function MyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F1E8' }}>
        <p style={{ color: '#0F2E2A', fontSize: 16 }}>로그인이 필요합니다.</p>
      </main>
    )
  }

  // XP 잔액 조회 (credits 합산)
  const { data: balanceData } = await supabase
    .from('user_credit_balance')
    .select('total_balance')
    .eq('user_id', user.id)
    .single()

  const rawXp = (balanceData?.total_balance as number) ?? 0
  const xpSummary = getXpSummary(rawXp)

  // 최근 XP 이벤트 이력
  const { data: history } = await supabase
    .from('credits')
    .select('id, amount, type, description, created_at')
    .eq('user_id', user.id)
    .in('type', ['earn_visit', 'no_show', 'earn_review', 'earn_referral', 'earn_event', 'admin_adjust'])
    .order('created_at', { ascending: false })
    .limit(10)

  // 유저 프로필
  const { data: profile } = await supabase
    .from('users')
    .select('name, profile_image')
    .eq('id', user.id)
    .single()

  return (
    <TreeDisplay
      xpSummary={xpSummary}
      history={(history ?? []) as Array<{
        id: string
        amount: number
        type: string
        description: string | null
        created_at: string
      }>}
      userName={profile?.name ?? '틈 멤버'}
    />
  )
}
