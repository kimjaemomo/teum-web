'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── markVisited ─────────────────────────────────────────────────────────────
// 파트너가 QR 페이지에서 호출. reservation.status → 'visited'
// DB 트리거 trg_reservation_xp 가 자동으로 earn_visit +10 XP 지급

export async function markVisited(
  reservationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 예약 + 파트너 오너십 확인
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status, partner_id, partners!inner(owner_id)')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: '예약을 찾을 수 없습니다.' }

  const partner = reservation.partners as unknown as { owner_id: string }
  if (partner.owner_id !== user.id) return { error: '권한이 없습니다.' }

  if (reservation.status === 'visited') return {}
  if (reservation.status !== 'confirmed') {
    return { error: `처리할 수 없는 예약 상태입니다: ${reservation.status}` }
  }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'visited', visited_at: new Date().toISOString() })
    .eq('id', reservationId)

  if (error) return { error: error.message }

  revalidatePath('/qr/' + reservationId)
  return {}
}

// ── submitReview ─────────────────────────────────────────────────────────────
// 소비자가 호출. reviews 삽입 후 deposit_refund 크레딧 지급.
// DB 트리거 trg_review_xp 가 자동으로 earn_review +5 XP 지급 (수동 지급 금지)

export interface SubmitReviewInput {
  reservationId: string
  rating: number        // 1–5
  content: string       // 최소 10자
  imageUrls: string[]   // 클라이언트에서 Storage 업로드 후 URL 배열
  isAnonymous: boolean
  keywords: string[]
}

export async function submitReview(
  input: SubmitReviewInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const trimmedContent = input.content.trim()
  if (trimmedContent.length < 10) return { error: '후기를 10자 이상 작성해주세요.' }
  if (input.rating < 1 || input.rating > 5) return { error: '별점을 선택해주세요.' }

  // 예약 조회 — 소유권 + 방문 완료 상태 확인
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, user_id, partner_id, slot_id, status, user_name')
    .eq('id', input.reservationId)
    .single()

  if (!reservation) return { error: '예약을 찾을 수 없습니다.' }
  if (reservation.user_id !== user.id) return { error: '본인 예약이 아닙니다.' }
  if (reservation.status !== 'visited') {
    return { error: '방문 완료 후 후기를 작성할 수 있습니다.' }
  }

  // 중복 후기 방지
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('reservation_id', input.reservationId)
    .single()

  if (existing) return { error: '이미 후기를 작성하셨습니다.' }

  // 후기 삽입 — DB 트리거가 earn_review +5 XP 자동 지급
  const { error: insertError } = await supabase.from('reviews').insert({
    reservation_id: input.reservationId,
    user_id:        user.id,
    partner_id:     reservation.partner_id,
    slot_id:        reservation.slot_id,
    rating:         input.rating,
    content:        trimmedContent,
    image_urls:     input.imageUrls.length > 0 ? input.imageUrls : null,
    is_photo_review: input.imageUrls.length > 0,
    is_anonymous:   input.isAnonymous,
    keywords:       input.keywords.length > 0 ? input.keywords : null,
    reviewer_name:  input.isAnonymous ? null : (reservation.user_name as string | null),
  })

  if (insertError) return { error: insertError.message }

  // 보증금 크레딧 환급 (+1000)
  const { data: balanceRow } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const currentBalance = (balanceRow?.balance as number | null) ?? 0

  await supabase.from('credits').insert({
    user_id:      user.id,
    amount:       1000,
    balance:      currentBalance + 1000,
    type:         'deposit_refund',
    description:  '후기 작성 보증금 환급',
    reference_id: input.reservationId,
  })

  revalidatePath('/store/' + reservation.partner_id)
  revalidatePath('/review/' + input.reservationId)
  return {}
}
