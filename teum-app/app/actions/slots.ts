'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SlotType = 'early_bird' | 'flash'

export interface CreateSlotInput {
  partnerId: string
  slotType: SlotType
  serviceName: string
  originalPrice: number
  discountRate: number
  availableDate: string  // 'YYYY-MM-DD'
  startTime: string      // 'HH:MM'
  endTime: string        // 'HH:MM'
  totalSeats: number
}

export async function createSlot(
  input: CreateSlotInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 파트너 오너십 확인
  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('id', input.partnerId)
    .eq('owner_user_id', user.id)
    .single()

  if (!partner) return { error: '파트너 권한이 없습니다.' }

  const discountPrice = Math.round(
    input.originalPrice * (1 - input.discountRate / 100)
  )

  // 슬롯 시작 시간 = 공개 만료 시점
  const expiresAt = new Date(
    `${input.availableDate}T${input.startTime}:00`
  ).toISOString()

  const { error } = await supabase.from('slots').insert({
    partner_id: input.partnerId,
    slot_type: input.slotType,
    service_name: input.serviceName || '공실 시간',
    original_price: input.originalPrice,
    discount_price: discountPrice,
    discount_rate: input.discountRate,
    available_date: input.availableDate,
    start_time: input.startTime,
    end_time: input.endTime,
    total_seats: input.totalSeats,
    booked_seats: 0,
    status: 'open',
    expires_at: expiresAt,
  })

  if (error) return { error: error.message }

  revalidatePath('/partner')
  return {}
}

export async function closeSlot(
  slotId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 파트너 ID 조회 (소유권 확인용)
  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()

  if (!partner) return { error: '파트너 권한이 없습니다.' }

  const { error } = await supabase
    .from('slots')
    .update({ status: 'closed' })
    .eq('id', slotId)
    .eq('partner_id', partner.id)

  if (error) return { error: error.message }

  revalidatePath('/partner')
  return {}
}

export async function updateSlotDiscount(
  slotId: string,
  discountRate: number
): Promise<{ error?: string; discountPrice?: number }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!partner) return { error: '파트너 권한이 없습니다.' }

  const { data: slot } = await supabase
    .from('slots')
    .select('original_price')
    .eq('id', slotId)
    .eq('partner_id', partner.id)
    .single()
  if (!slot) return { error: '슬롯을 찾을 수 없습니다.' }

  const discountPrice = Math.round(
    (slot.original_price as number) * (1 - discountRate / 100)
  )

  const { error } = await supabase
    .from('slots')
    .update({ discount_rate: discountRate, discount_price: discountPrice })
    .eq('id', slotId)
    .eq('partner_id', partner.id)

  if (error) return { error: error.message }

  revalidatePath('/partner')
  return { discountPrice }
}

export async function copySlotToNextDay(
  slotId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: partner } = await supabase
    .from('partners')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!partner) return { error: '파트너 권한이 없습니다.' }

  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('id', slotId)
    .eq('partner_id', partner.id)
    .single()
  if (!slot) return { error: '슬롯을 찾을 수 없습니다.' }

  const nextDate = new Date(slot.available_date + 'T00:00:00')
  nextDate.setDate(nextDate.getDate() + 1)
  const nextDateStr = nextDate.toISOString().slice(0, 10)

  const startTimePart = (slot.start_time as string).slice(0, 5)
  const expiresAt = new Date(`${nextDateStr}T${startTimePart}:00`).toISOString()

  const { error } = await supabase.from('slots').insert({
    partner_id: partner.id,
    slot_type: slot.slot_type,
    service_name: slot.service_name,
    original_price: slot.original_price,
    discount_price: slot.discount_price,
    discount_rate: slot.discount_rate,
    available_date: nextDateStr,
    start_time: slot.start_time,
    end_time: slot.end_time,
    total_seats: slot.total_seats,
    booked_seats: 0,
    status: 'open',
    expires_at: expiresAt,
  })

  if (error) return { error: error.message }

  revalidatePath('/partner')
  return {}
}
