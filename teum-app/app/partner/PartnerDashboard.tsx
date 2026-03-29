'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createSlot,
  closeSlot,
  updateSlotDiscount,
  copySlotToNextDay,
} from '@/app/actions/slots'
import type { PartnerRow, SlotRow } from './page'

interface Props {
  partner: PartnerRow
  slots: SlotRow[]
}

// ── 상수 ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  hair: '헤어', nail: '네일', skin: '피부', wax: '왁싱', etc: '기타',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  open:    { label: '예약 가능', bg: '#E6F4EC', color: '#1E7A3E' },
  full:    { label: '마감',     bg: '#FEF3E2', color: '#B45309' },
  closed:  { label: '종료',     bg: '#F3F3F3', color: '#6B6B5E' },
  expired: { label: '만료',     bg: '#FEE2E2', color: '#C0392B' },
}

const TIME_BLOCKS = [
  { name: '오전', start: '10:00', end: '12:00' },
  { name: '점심', start: '12:00', end: '14:00' },
  { name: '오후', start: '14:00', end: '16:00' },
  { name: '저녁', start: '17:00', end: '19:00' },
]

// ── 유틸 ──────────────────────────────────────────────────────────

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10) }
function formatPrice(n: number): string { return n.toLocaleString('ko-KR') + '원' }
function formatTime(t: string): string { return t.slice(0, 5) }

function formatDateKo(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`
}

// ── 시간 프리셋 ───────────────────────────────────────────────────

interface Preset {
  id: string
  label: string
  timeLabel: string
  date: string
  startTime: string
  endTime: string
  isToday: boolean
}

function generatePresets(): Preset[] {
  const now = new Date()
  const todayStr = toDateStr(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDateStr(tomorrow)

  const presets: Preset[] = []
  for (const block of TIME_BLOCKS) {
    if (new Date(`${todayStr}T${block.start}:00`) > now) {
      presets.push({
        id: `today-${block.name}`,
        label: `오늘 ${block.name}`,
        timeLabel: `${block.start} – ${block.end}`,
        date: todayStr, startTime: block.start, endTime: block.end, isToday: true,
      })
    }
  }
  for (const block of TIME_BLOCKS) {
    presets.push({
      id: `tomorrow-${block.name}`,
      label: `내일 ${block.name}`,
      timeLabel: `${block.start} – ${block.end}`,
      date: tomorrowStr, startTime: block.start, endTime: block.end, isToday: false,
    })
  }
  return presets
}

// ── 슬롯 카드 ─────────────────────────────────────────────────────

interface SlotCardProps {
  slot: SlotRow
  onRequestClose: (id: string) => void
  onSaveDiscount: (id: string, rate: number) => Promise<{ error?: string }>
  onCopy: (id: string) => Promise<{ error?: string }>
}

function SlotCard({ slot, onRequestClose, onSaveDiscount, onCopy }: SlotCardProps) {
  const [isEditingDiscount, setIsEditingDiscount] = useState(false)
  const [editRate, setEditRate] = useState(slot.discount_rate)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle')
  const [copyError, setCopyError] = useState<string | null>(null)

  // props 변경 시 editRate 동기화 (realtime 업데이트 후)
  useEffect(() => {
    if (!isEditingDiscount) setEditRate(slot.discount_rate)
  }, [slot.discount_rate, isEditingDiscount])

  const typeLabel = slot.slot_type === 'flash' ? 'Flash 긴급' : 'Early-Bird'
  const typeBg    = slot.slot_type === 'flash' ? '#C8A96E' : '#334732'
  const status    = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.closed
  const isClosed  = slot.status === 'closed' || slot.status === 'expired'
  const isFull    = slot.booked_seats >= slot.total_seats

  const editDiscountPrice = Math.round(slot.original_price * (1 - editRate / 100))

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    const result = await onSaveDiscount(slot.id, editRate)
    if (result.error) {
      setSaveError(result.error)
    } else {
      setIsEditingDiscount(false)
    }
    setIsSaving(false)
  }

  async function handleCopy() {
    setCopyState('copying')
    setCopyError(null)
    const result = await onCopy(slot.id)
    if (result.error) {
      setCopyState('error')
      setCopyError(result.error)
      setTimeout(() => { setCopyState('idle'); setCopyError(null) }, 3000)
    } else {
      setCopyState('done')
      setTimeout(() => setCopyState('idle'), 2500)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #E3DFD4',
        overflow: 'hidden',
        opacity: isClosed ? 0.65 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      {/* 상단 메인 영역 */}
      <div style={{ padding: '14px 16px 12px' }}>
        {/* 타입 + 상태 + 날짜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 9px', borderRadius: 100,
            background: typeBg, color: '#fff', fontSize: 11, fontWeight: 600,
          }}>
            {typeLabel}
          </span>
          <span style={{
            padding: '2px 9px', borderRadius: 100,
            background: status.bg, color: status.color, fontSize: 11, fontWeight: 600,
          }}>
            {status.label}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#A8A89A', whiteSpace: 'nowrap' }}>
            {formatDateKo(slot.available_date)} {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </span>
        </div>

        {/* 서비스명 */}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1C2B1B', marginBottom: 8 }}>
          {slot.service_name}
        </div>

        {/* 가격 + 할인율 편집 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#334732' }}>
            {formatPrice(slot.discount_price)}
          </span>
          <span style={{ fontSize: 12, color: '#A8A89A', textDecoration: 'line-through' }}>
            {formatPrice(slot.original_price)}
          </span>
          {!isClosed && (
            <button
              onClick={() => {
                setIsEditingDiscount(v => !v)
                setSaveError(null)
                setEditRate(slot.discount_rate)
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 100,
                border: isEditingDiscount ? '1.5px solid #C8A96E' : '1.5px solid #E3DFD4',
                background: isEditingDiscount ? '#FDF6EC' : '#FAF8F3',
                color: isEditingDiscount ? '#B8913A' : '#6B6B5E',
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
                transition: 'all 200ms ease',
              }}
            >
              {slot.discount_rate}%
              <span style={{ fontSize: 10 }}>{isEditingDiscount ? '✕' : '✎'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 인라인 할인율 편집 패널 */}
      {isEditingDiscount && (
        <div style={{
          padding: '12px 16px 14px',
          background: '#FDF6EC',
          borderTop: '1px solid #F0E8D5',
          borderBottom: '1px solid #F0E8D5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6B5E' }}>할인율 수정</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#C8A96E' }}>{editRate}%</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334732' }}>
                → {formatPrice(editDiscountPrice)}
              </span>
            </div>
          </div>
          <input
            type="range" min={10} max={70} step={5}
            value={editRate}
            onChange={e => setEditRate(Number(e.target.value))}
            className="slot-edit-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#A8A89A', margin: '4px 0 10px' }}>
            <span>10%</span><span>70%</span>
          </div>
          {saveError && (
            <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 8 }}>{saveError}</div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={isSaving || editRate === slot.discount_rate}
              style={{
                flex: 1, padding: '9px 0',
                background: (isSaving || editRate === slot.discount_rate) ? '#E3DFD4' : '#C8A96E',
                color: (isSaving || editRate === slot.discount_rate) ? '#A8A89A' : '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Pretendard', sans-serif",
                transition: 'background 200ms ease',
              }}
            >
              {isSaving ? '저장 중…' : '저장'}
            </button>
            <button
              onClick={() => { setIsEditingDiscount(false); setSaveError(null) }}
              style={{
                padding: '9px 18px',
                background: '#fff', border: '1.5px solid #E3DFD4',
                borderRadius: 8, color: '#6B6B5E',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Pretendard', sans-serif",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 하단 액션 바 */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: isEditingDiscount ? 'none' : '1px solid #F5F2ED',
        background: '#FAF8F3',
      }}>
        {/* 예약 현황 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isFull ? '#B45309' : '#334732' }}>
            {slot.booked_seats}
            <span style={{ color: '#A8A89A', fontWeight: 400 }}>/{slot.total_seats}석</span>
          </span>
          {isFull && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#B45309',
              background: '#FEF3E2', padding: '1px 7px', borderRadius: 100,
            }}>
              FULL
            </span>
          )}
          {!isClosed && !isFull && slot.booked_seats > 0 && (
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: slot.total_seats }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < slot.booked_seats ? '#334732' : '#E3DFD4',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* 버튼 그룹 */}
        {!isClosed && (
          <div style={{ display: 'flex', gap: 6 }}>
            {/* 내일 복사 */}
            <button
              onClick={handleCopy}
              disabled={copyState === 'copying'}
              style={{
                padding: '5px 12px',
                background: copyState === 'done' ? '#E6F4EC' : '#fff',
                border: '1.5px solid',
                borderColor: copyState === 'done' ? '#B7DFCA' : copyState === 'error' ? '#FCCACA' : '#E3DFD4',
                borderRadius: 7,
                color: copyState === 'done' ? '#1E7A3E' : copyState === 'error' ? '#C0392B' : '#6B6B5E',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Pretendard', sans-serif",
                transition: 'all 200ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {copyState === 'copying' ? '복사 중…'
                : copyState === 'done' ? '✓ 복사 완료'
                : copyState === 'error' ? '✕ 실패'
                : '내일 복사'}
            </button>

            {/* 마감 처리 */}
            <button
              onClick={() => onRequestClose(slot.id)}
              style={{
                padding: '5px 12px',
                background: '#fff',
                border: '1.5px solid #E3DFD4',
                borderRadius: 7,
                color: '#6B6B5E',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Pretendard', sans-serif",
              }}
            >
              마감
            </button>
          </div>
        )}
      </div>

      {/* 복사 에러 메시지 */}
      {copyError && (
        <div style={{ padding: '6px 16px', background: '#FEE2E2', fontSize: 12, color: '#C0392B' }}>
          {copyError}
        </div>
      )}
    </div>
  )
}

// ── 확인 모달 ─────────────────────────────────────────────────────

function ConfirmModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20,
          padding: '28px 24px', width: '100%', maxWidth: 320,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          fontFamily: "'Pretendard', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1C2B1B', textAlign: 'center', marginBottom: 8 }}>
          슬롯을 마감할까요?
        </div>
        <div style={{ fontSize: 13, color: '#6B6B5E', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          마감된 슬롯은 더 이상 소비자에게 노출되지 않습니다.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px 0',
              background: '#F4F0E6', border: 'none', borderRadius: 10,
              color: '#6B6B5E', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1, padding: '12px 0',
              background: isLoading ? '#E3DFD4' : '#C0392B',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: "'Pretendard', sans-serif",
              transition: 'background 200ms ease',
            }}
          >
            {isLoading ? '처리 중…' : '마감 확인'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

export function PartnerDashboard({ partner, slots }: Props) {
  const router = useRouter()
  const presets = useMemo(() => generatePresets(), [])

  // ── 로컬 슬롯 상태 (Realtime 업데이트 반영) ──
  const [liveSlots, setLiveSlots] = useState<SlotRow[]>(slots)

  // 서버 re-fetch 시 props 동기화
  useEffect(() => { setLiveSlots(slots) }, [slots])

  // ── Supabase Realtime 구독 ──────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`partner-slots-${partner.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slots',
          filter: `partner_id=eq.${partner.id}`,
        },
        (payload) => {
          const updated = payload.new as SlotRow
          setLiveSlots(prev =>
            prev.map(s => s.id === updated.id
              ? { ...s, booked_seats: updated.booked_seats, status: updated.status }
              : s
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [partner.id])

  // ── 퀵 등록 폼 상태 ────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [slotType, setSlotType] = useState<'early_bird' | 'flash'>('early_bird')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountRate, setDiscountRate] = useState(30)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [totalSeats, setTotalSeats] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ── 슬롯 목록 상태 ─────────────────────────
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week'>('today')
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  // ── 날짜 ───────────────────────────────────
  const todayStr    = useMemo(() => toDateStr(new Date()), [])
  const tomorrowStr = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return toDateStr(d) }, [])

  const filteredSlots = useMemo(() => {
    if (activeTab === 'today')    return liveSlots.filter(s => s.available_date === todayStr)
    if (activeTab === 'tomorrow') return liveSlots.filter(s => s.available_date === tomorrowStr)
    return liveSlots
  }, [liveSlots, activeTab, todayStr, tomorrowStr])

  const todayOpenCount = useMemo(
    () => liveSlots.filter(s => s.available_date === todayStr && s.status === 'open').length,
    [liveSlots, todayStr]
  )

  const selectedPresetObj = presets.find(p => p.id === selectedPreset)
  const parsedPrice   = parseInt(originalPrice.replace(/[^0-9]/g, ''), 10)
  const discountPrice = parsedPrice > 0 ? Math.round(parsedPrice * (1 - discountRate / 100)) : 0
  const canSubmit     = selectedPreset !== null && parsedPrice > 0 && !isSubmitting
  const accentColor   = slotType === 'flash' ? '#C8A96E' : '#334732'

  // ── 슬롯 등록 ──────────────────────────────

  async function handleSubmit() {
    if (!canSubmit || !selectedPresetObj) return
    setIsSubmitting(true)
    setSubmitError(null)

    const result = await createSlot({
      partnerId: partner.id, slotType,
      serviceName: serviceName.trim() || '공실 시간',
      originalPrice: parsedPrice, discountRate,
      availableDate: selectedPresetObj.date,
      startTime: selectedPresetObj.startTime,
      endTime: selectedPresetObj.endTime,
      totalSeats,
    })

    if (result.error) {
      setSubmitError(result.error)
    } else {
      setSelectedPreset(null); setOriginalPrice(''); setDiscountRate(30)
      setServiceName(''); setTotalSeats(1); setShowAdvanced(false)
      setSubmitSuccess(true)
      router.refresh()
      setTimeout(() => setSubmitSuccess(false), 3000)
    }
    setIsSubmitting(false)
  }

  // ── 슬롯 마감 (확인 후) ─────────────────────

  async function handleConfirmClose() {
    if (!closeConfirmId) return
    setIsClosing(true)
    const result = await closeSlot(closeConfirmId)
    if (!result.error) {
      setLiveSlots(prev =>
        prev.map(s => s.id === closeConfirmId ? { ...s, status: 'closed' } : s)
      )
      router.refresh()
    }
    setIsClosing(false)
    setCloseConfirmId(null)
  }

  // ── 할인율 수정 ─────────────────────────────

  async function handleSaveDiscount(slotId: string, rate: number) {
    const result = await updateSlotDiscount(slotId, rate)
    if (!result.error && result.discountPrice !== undefined) {
      setLiveSlots(prev =>
        prev.map(s => s.id === slotId
          ? { ...s, discount_rate: rate, discount_price: result.discountPrice! }
          : s
        )
      )
    }
    return result
  }

  // ── 슬롯 복사 ───────────────────────────────

  async function handleCopySlot(slotId: string) {
    const result = await copySlotToNextDay(slotId)
    if (!result.error) router.refresh()
    return result
  }

  // ── 렌더 ───────────────────────────────────

  return (
    <>
      <style>{`
        .partner-page {
          min-height: 100vh;
          background: #F4F0E6;
          padding: 24px 16px 80px;
          font-family: 'Pretendard', -apple-system, sans-serif;
        }
        .partner-inner {
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(51,71,50,0.07);
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1C2B1B;
          margin-bottom: 14px;
        }
        .type-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: 8px;
          border: 1.5px solid #E3DFD4;
          background: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          font-family: 'Pretendard', sans-serif;
        }
        .preset-btn {
          padding: 10px 8px;
          border-radius: 10px;
          border: 1.5px solid #E3DFD4;
          background: #fff;
          cursor: pointer;
          text-align: left;
          transition: all 200ms ease;
          font-family: 'Pretendard', sans-serif;
        }
        .preset-btn:hover { border-color: #334732; }
        .tab-btn {
          flex: 1;
          padding: 8px 0;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 200ms ease;
          font-family: 'Pretendard', sans-serif;
          color: #A8A89A;
        }
        .tab-btn.active { color: #334732; border-bottom-color: #334732; }
        .price-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #E3DFD4;
          border-radius: 8px;
          font-size: 15px;
          font-family: 'Pretendard', sans-serif;
          color: #1C2B1B;
          outline: none;
          transition: border-color 200ms ease;
          box-sizing: border-box;
        }
        .price-input:focus { border-color: #334732; }
        .slider, .slot-edit-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #E3DFD4;
          outline: none;
          cursor: pointer;
          display: block;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: var(--slider-color, #334732);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(51,71,50,0.25);
        }
        .slider::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: var(--slider-color, #334732);
          cursor: pointer; border: none;
          box-shadow: 0 2px 6px rgba(51,71,50,0.25);
        }
        .slot-edit-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #C8A96E;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(200,169,110,0.4);
        }
        .slot-edit-slider::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #C8A96E;
          cursor: pointer; border: none;
        }
        .adv-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #E3DFD4;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Pretendard', sans-serif;
          color: #1C2B1B;
          outline: none;
          transition: border-color 200ms ease;
          box-sizing: border-box;
        }
        .adv-input:focus { border-color: #334732; }
        .submit-btn {
          width: 100%;
          padding: 14px 0;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 200ms ease;
          font-family: 'Pretendard', sans-serif;
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* 마감 확인 모달 */}
      {closeConfirmId && (
        <ConfirmModal
          onConfirm={handleConfirmClose}
          onCancel={() => setCloseConfirmId(null)}
          isLoading={isClosing}
        />
      )}

      <div className="partner-page">
        <div className="partner-inner">

          {/* ── 헤더 ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1C2B1B' }}>{partner.name}</div>
              <div style={{ fontSize: 13, color: '#6B6B5E', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {CATEGORY_LABELS[partner.category] ?? partner.category}
                {partner.fee_phase === 0 && (
                  <span style={{
                    padding: '1px 8px', borderRadius: 100,
                    background: '#E6F4EC', color: '#1E7A3E', fontSize: 11, fontWeight: 600,
                  }}>
                    수수료 무료
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#334732', lineHeight: 1 }}>
                  {todayOpenCount}
                </span>
                <span style={{ fontSize: 12, color: '#A8A89A' }}>개</span>
              </div>
              <div style={{ fontSize: 11, color: '#A8A89A', marginTop: 2 }}>오늘 공개 슬롯</div>
              {/* Realtime 활성 표시 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#1E7A3E',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 10, color: '#A8A89A' }}>실시간 연동</span>
              </div>
            </div>
          </div>

          {/* ── 성공 배너 ── */}
          {submitSuccess && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: '#E6F4EC', border: '1px solid #B7DFCA',
              color: '#1E7A3E', fontSize: 14, fontWeight: 600,
            }}>
              ✅ 슬롯이 등록되었습니다!
            </div>
          )}

          {/* ── 퀵 슬롯 등록 카드 ── */}
          <div className="card">
            <div className="section-title">빠른 슬롯 등록</div>

            {/* 슬롯 타입 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {([
                { value: 'early_bird', label: 'Early-Bird', desc: '사전 예약' },
                { value: 'flash',      label: 'Flash 긴급', desc: '당일 공실' },
              ] as const).map(({ value, label, desc }) => {
                const isActive  = slotType === value
                const activeBg  = value === 'flash' ? '#C8A96E' : '#334732'
                return (
                  <button key={value} className="type-btn" onClick={() => setSlotType(value)}
                    style={{
                      background: isActive ? activeBg : '#fff',
                      color: isActive ? '#fff' : '#6B6B5E',
                      borderColor: isActive ? activeBg : '#E3DFD4',
                    }}
                  >
                    <div>{label}</div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>{desc}</div>
                  </button>
                )
              })}
            </div>

            {/* 시간 프리셋 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6B5E', marginBottom: 8 }}>
                시간대 선택
              </div>
              {presets.length === 0 ? (
                <div style={{ fontSize: 13, color: '#A8A89A', padding: '8px 0' }}>
                  오늘 예약 가능한 시간대가 없습니다.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {presets.map(preset => {
                    const isActive = selectedPreset === preset.id
                    return (
                      <button key={preset.id} className="preset-btn"
                        onClick={() => setSelectedPreset(isActive ? null : preset.id)}
                        style={{
                          background: isActive ? accentColor : '#FAF8F3',
                          borderColor: isActive ? accentColor : '#E3DFD4',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : '#1C2B1B' }}>
                          {preset.label}
                        </div>
                        <div style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.8)' : '#A8A89A', marginTop: 2 }}>
                          {preset.timeLabel}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 원래 가격 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6B5E', marginBottom: 6 }}>원래 가격</div>
              <input type="text" inputMode="numeric" placeholder="예: 50000"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value.replace(/[^0-9]/g, ''))}
                className="price-input"
              />
            </div>

            {/* 할인율 슬라이더 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6B5E' }}>할인율</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: accentColor }}>{discountRate}%</span>
                  {parsedPrice > 0 && (
                    <span style={{ fontSize: 13, color: '#334732', fontWeight: 700 }}>
                      → {formatPrice(discountPrice)}
                    </span>
                  )}
                </div>
              </div>
              <input type="range" min={10} max={70} step={5} value={discountRate}
                onChange={e => setDiscountRate(Number(e.target.value))}
                className="slider"
                style={{ '--slider-color': accentColor } as React.CSSProperties}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#A8A89A', marginTop: 4 }}>
                <span>10%</span><span>70%</span>
              </div>
            </div>

            {/* 추가 설정 */}
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowAdvanced(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', color: '#6B6B5E',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                <span style={{
                  display: 'inline-block', transition: 'transform 200ms ease',
                  transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▼</span>
                추가 설정 (선택)
              </button>
              {showAdvanced && (
                <div style={{
                  marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10,
                  padding: 14, background: '#FAF8F3', borderRadius: 10, border: '1px solid #E3DFD4',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6B5E', marginBottom: 5 }}>
                      서비스명 (미입력 시 '공실 시간')
                    </div>
                    <input type="text" placeholder="예: 여성 커트, 젤네일" maxLength={50}
                      value={serviceName} onChange={e => setServiceName(e.target.value)}
                      className="adv-input"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6B5E', marginBottom: 5 }}>인원 제한</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => setTotalSeats(n)}
                          style={{
                            flex: 1, padding: '8px 0', borderRadius: 8, border: '1.5px solid',
                            borderColor: totalSeats === n ? '#334732' : '#E3DFD4',
                            background: totalSeats === n ? '#334732' : '#fff',
                            color: totalSeats === n ? '#fff' : '#6B6B5E',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'Pretendard', sans-serif",
                          }}
                        >
                          {n}명
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#C0392B', fontSize: 13 }}>
                {submitError}
              </div>
            )}

            <button className="submit-btn" disabled={!canSubmit} onClick={handleSubmit}
              style={{ background: canSubmit ? accentColor : '#E3DFD4', color: canSubmit ? '#fff' : '#A8A89A' }}
            >
              {isSubmitting ? '등록 중...'
                : selectedPresetObj
                  ? `${selectedPresetObj.label} ${selectedPresetObj.timeLabel} 등록`
                  : '시간대와 가격을 선택하세요'}
            </button>
          </div>

          {/* ── 등록된 슬롯 목록 ── */}
          <div className="card">
            <div className="section-title">등록된 슬롯</div>

            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E3DFD4', marginBottom: 14 }}>
              {([
                { key: 'today',    label: '오늘' },
                { key: 'tomorrow', label: '내일' },
                { key: 'week',     label: '이번 주' },
              ] as const).map(({ key, label }) => (
                <button key={key} className={`tab-btn${activeTab === key ? ' active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                  <span style={{ marginLeft: 4, fontSize: 11, color: activeTab === key ? '#334732' : '#A8A89A' }}>
                    {key === 'today'
                      ? liveSlots.filter(s => s.available_date === todayStr).length
                      : key === 'tomorrow'
                        ? liveSlots.filter(s => s.available_date === tomorrowStr).length
                        : liveSlots.length}
                  </span>
                </button>
              ))}
            </div>

            {filteredSlots.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#A8A89A', fontSize: 14 }}>
                등록된 슬롯이 없습니다
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredSlots.map(slot => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onRequestClose={setCloseConfirmId}
                    onSaveDiscount={handleSaveDiscount}
                    onCopy={handleCopySlot}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
