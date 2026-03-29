import { createClient } from '@/lib/supabase/server'
import { CouponWallet } from './CouponWallet'

export type CouponRow = {
  id: string
  is_used: boolean
  used_at: string | null
  issued_at: string
  coupon: {
    id: string
    title: string
    description: string | null
    type: 'percent' | 'fixed_amount' | 'free'
    discount_value: number
    min_price: number
    max_discount: number | null
    valid_until: string | null
    is_active: boolean
  }
}

export type CreditHistoryRow = {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

export default async function WalletPage() {
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
          background: '#F5F1E8',
        }}
      >
        <p style={{ color: '#0F2E2A', fontSize: 16 }}>로그인이 필요합니다.</p>
      </main>
    )
  }

  // 유저 쿠폰 목록 (coupons 조인)
  const { data: rawCoupons } = await supabase
    .from('user_coupons')
    .select(
      `id, is_used, used_at, issued_at,
       coupon:coupons (
         id, title, description, type, discount_value,
         min_price, max_discount, valid_until, is_active
       )`
    )
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  // 틈 크레딧 잔액
  const { data: balanceData } = await supabase
    .from('user_credit_balance')
    .select('total_balance')
    .eq('user_id', user.id)
    .single()

  // 크레딧 최근 내역 (최대 8건)
  const { data: creditHistory } = await supabase
    .from('credits')
    .select('id, amount, type, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const creditBalance = Math.max(0, (balanceData?.total_balance as number) ?? 0)

  return (
    <CouponWallet
      userCoupons={(rawCoupons ?? []) as CouponRow[]}
      creditBalance={creditBalance}
      creditHistory={(creditHistory ?? []) as CreditHistoryRow[]}
    />
  )
}
