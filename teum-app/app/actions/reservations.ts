'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateReservationInput {
  slotId: string
  userName: string
  userPhone: string
  memo?: string
}

export interface CreateReservationResult {
  reservationId?: string
  error?: string
}

export async function createReservation(
  input: CreateReservationInput
): Promise<CreateReservationResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const trimmedName = input.userName.trim()
  const trimmedPhone = input.userPhone.replace(/\D/g, '')
  if (!trimmedName) return { error: '이름을 입력해주세요.' }
  if (trimmedPhone.length < 10) return { error: '연락처를 올바르게 입력해주세요.' }

  // 슬롯 조회 — 존재 여부 + 예약 가능 여부 확인
  const { data: slot } = await supabase
    .from('slots')
    .select('id, partner_id, status, max_capacity, reserved_count, discounted_price, title, slot_date, start_time, end_time')
    .eq('id', input.slotId)
    .single()

  if (!slot) return { error: '슬롯을 찾을 수 없습니다.' }
  if (slot.status !== 'open') return { error: '이미 마감된 슬롯입니다.' }
  if ((slot.reserved_count as number) >= (slot.max_capacity as number)) {
    return { error: '잔여 자리가 없습니다.' }
  }

  // 중복 예약 방지
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('slot_id', input.slotId)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .single()

  if (existing) return { error: '이미 예약한 슬롯입니다.' }

  // 예약 생성
  const { data: reservation, error: insertError } = await supabase
    .from('reservations')
    .insert({
      slot_id:    input.slotId,
      user_id:    user.id,
      partner_id: slot.partner_id,
      status:     'confirmed',
      user_name:  trimmedName,
      user_phone: trimmedPhone,
      memo:       input.memo ?? null,
      final_price: slot.discounted_price,
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
    // unique constraint 위반 = 중복 예약
    if (insertError.code === '23505') return { error: '이미 예약한 슬롯입니다.' }
    return { error: insertError.message }
  }

  revalidatePath('/slots')
  revalidatePath('/store/' + slot.partner_id)

  return { reservationId: reservation.id }
}
