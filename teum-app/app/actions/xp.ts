'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type XpEventType = 'earn_visit' | 'no_show' | 'earn_review'

const XP_AMOUNTS: Record<XpEventType, number> = {
  earn_visit: 10,
  no_show: -20,
  earn_review: 5,
}

const XP_DESCRIPTIONS: Record<XpEventType, string> = {
  earn_visit: '예약 완료 보상 (+10 XP)',
  no_show: '노쇼 패널티 (-20 XP)',
  earn_review: '리뷰 작성 보상 (+5 XP)',
}

/**
 * 특정 유저에게 XP를 수동 지급/차감합니다.
 * DB 트리거가 자동으로 처리하지만, 필요시 직접 호출할 수 있습니다.
 */
export async function awardXp(
  userId: string,
  type: XpEventType,
  referenceId?: string
): Promise<{ newBalance: number; error?: string }> {
  const supabase = await createClient()
  const amount = XP_AMOUNTS[type]

  // 현재 잔액 조회
  const { data: balanceData } = await supabase
    .from('user_credit_balance')
    .select('total_balance')
    .eq('user_id', userId)
    .single()

  const currentBalance = (balanceData?.total_balance as number) ?? 0
  const newBalance = currentBalance + amount

  const { error } = await supabase.from('credits').insert({
    user_id: userId,
    amount,
    balance: newBalance,
    type,
    description: XP_DESCRIPTIONS[type],
    reference_id: referenceId ?? null,
  })

  if (error) {
    return { newBalance: currentBalance, error: error.message }
  }

  revalidatePath('/mypage')
  return { newBalance }
}

/**
 * 현재 로그인 유저의 XP 잔액을 조회합니다.
 */
export async function getMyXp(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 0

  const { data } = await supabase
    .from('user_credit_balance')
    .select('total_balance')
    .eq('user_id', user.id)
    .single()

  return Math.max(0, (data?.total_balance as number) ?? 0)
}
