'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { submitReview } from '@/app/actions/reviews'

interface Props {
  reservationId: string
  partnerId: string
  partnerName: string
  partnerImageUrl: string | null
  slotTitle: string
  slotDate: string
}

const TREE_EMOJIS = ['🌱', '🌿', '🌳', '🌲', '🌲']

const KEYWORDS = [
  '공간이 아늑해요',
  '사장님이 전문적이에요',
  '가성비가 좋아요',
  '또 방문하고 싶어요',
  '청결해요',
  '예약이 편해요',
  '시간이 잘 지켜져요',
  '친절해요',
]

type ToastState = { message: string; type: 'success' | 'error' } | null

export function ReviewForm({
  reservationId, partnerId, partnerName, partnerImageUrl, slotTitle, slotDate,
}: Props) {
  const router = useRouter()

  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function toggleKeyword(kw: string) {
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    )
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - photos.length
    const newFiles = files.slice(0, remaining)
    setPhotos(prev => [...prev, ...newFiles])
    const newUrls = newFiles.map(f => URL.createObjectURL(f))
    setPhotoPreviewUrls(prev => [...prev, ...newUrls])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviewUrls[index])
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (rating === 0) {
      showToast('별점을 선택해주세요.', 'error')
      return
    }
    if (content.trim().length < 10) {
      showToast('후기를 10자 이상 작성해주세요.', 'error')
      return
    }

    setIsSubmitting(true)

    // 사진 Storage 업로드
    const uploadedUrls: string[] = []
    if (photos.length > 0) {
      const supabase = createClient()
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${reservationId}/${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(path, file, { upsert: true })
        if (uploadError) {
          showToast('사진 업로드에 실패했습니다.', 'error')
          setIsSubmitting(false)
          return
        }
        const { data: urlData } = supabase.storage
          .from('review-images')
          .getPublicUrl(path)
        uploadedUrls.push(urlData.publicUrl)
      }
    }

    const result = await submitReview({
      reservationId,
      rating,
      content,
      imageUrls: uploadedUrls,
      isAnonymous,
      keywords: selectedKeywords,
    })

    if (result.error) {
      showToast(result.error, 'error')
      setIsSubmitting(false)
      return
    }

    showToast('후기 작성 완료! +5 XP 적립 🌱', 'success')
    setTimeout(() => router.push('/store/' + partnerId), 2000)
  }

  return (
    <>
      <style>{`
        .review-page {
          min-height: 100vh;
          background: #F4F0E6;
          padding: 0 0 80px 0;
          font-family: 'Pretendard', -apple-system, sans-serif;
        }
        .review-section {
          background: #fff;
          margin-bottom: 8px;
          padding: 20px 20px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #334732;
          margin-bottom: 14px;
          letter-spacing: 0.02em;
        }
        .keyword-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-family: 'Pretendard', sans-serif;
          cursor: pointer;
          border: 1.5px solid #E3DFD4;
          background: #fff;
          color: #6B6B5E;
          margin: 4px;
          transition: all 200ms ease;
          font-weight: 500;
        }
        .keyword-chip.selected {
          border-color: #334732;
          background: #334732;
          color: #fff;
        }
        .review-textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px 14px;
          border: 1.5px solid #E3DFD4;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Pretendard', sans-serif;
          color: #1C2B1B;
          resize: none;
          outline: none;
          box-sizing: border-box;
          transition: border-color 200ms ease;
          line-height: 1.6;
        }
        .review-textarea:focus { border-color: #334732; }
        .review-textarea::placeholder { color: #C4C4B8; }
        .submit-btn {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 392px;
          padding: 16px 0;
          background: #334732;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Pretendard', sans-serif;
          transition: opacity 200ms ease;
          z-index: 10;
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .toggle-track {
          width: 40px; height: 22px;
          background: #E3DFD4;
          border-radius: 100px;
          position: relative;
          cursor: pointer;
          transition: background 200ms ease;
          flex-shrink: 0;
        }
        .toggle-track.on { background: #334732; }
        .toggle-thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 16px; height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: transform 200ms ease;
        }
        .toggle-track.on .toggle-thumb { transform: translateX(18px); }
      `}</style>

      <div className="review-page">
        {/* 헤더 */}
        <div style={{
          background: '#334732', padding: '20px 20px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {partnerImageUrl ? (
            <img
              src={partnerImageUrl}
              alt={partnerName}
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>🌿</div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{partnerName}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {slotTitle} · {slotDate}
            </div>
          </div>
        </div>

        {/* 별점 */}
        <div className="review-section" style={{ marginTop: 0 }}>
          <div className="section-title">방문은 어떠셨나요?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '8px 0' }}>
            {TREE_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  fontSize: i < rating ? 36 : 28,
                  opacity: i < rating ? 1 : 0.3,
                  transition: 'all 200ms ease',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#334732', fontWeight: 600, marginTop: 4 }}>
              {['', '아쉬웠어요', '별로였어요', '보통이에요', '좋았어요', '최고였어요'][rating]}
            </div>
          )}
        </div>

        {/* 키워드 */}
        <div className="review-section">
          <div className="section-title">어떤 점이 좋으셨나요? (복수 선택)</div>
          <div style={{ margin: '-4px' }}>
            {KEYWORDS.map(kw => (
              <button
                key={kw}
                className={`keyword-chip${selectedKeywords.includes(kw) ? ' selected' : ''}`}
                onClick={() => toggleKeyword(kw)}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* 후기 텍스트 */}
        <div className="review-section">
          <div className="section-title">후기 작성</div>
          <textarea
            className="review-textarea"
            placeholder="방문하신 소감을 자유롭게 적어주세요. (최소 10자)"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#A8A89A', marginTop: 4 }}>
            {content.length}/500
          </div>
        </div>

        {/* 사진 첨부 */}
        <div className="review-section">
          <div className="section-title">사진 첨부 (선택, 최대 3장)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {photoPreviewUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt={`미리보기 ${i + 1}`}
                  style={{
                    width: 80, height: 80, borderRadius: 8,
                    objectFit: 'cover', border: '1.5px solid #E3DFD4',
                  }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#C0392B', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: 8,
                  border: '1.5px dashed #E3DFD4', background: '#FAF8F3',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  color: '#A8A89A', fontSize: 12, fontFamily: "'Pretendard', sans-serif",
                }}
              >
                <span style={{ fontSize: 20 }}>📷</span>
                <span>추가</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        {/* 익명 옵션 */}
        <div className="review-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1C2B1B' }}>익명으로 작성</div>
              <div style={{ fontSize: 12, color: '#A8A89A', marginTop: 2 }}>
                이름 대신 '익명'으로 표시됩니다.
              </div>
            </div>
            <div
              className={`toggle-track${isAnonymous ? ' on' : ''}`}
              onClick={() => setIsAnonymous(p => !p)}
              role="switch"
              aria-checked={isAnonymous}
            >
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          className="submit-btn"
          disabled={isSubmitting || rating === 0 || content.trim().length < 10}
          onClick={handleSubmit}
        >
          {isSubmitting ? '제출 중...' : '후기 등록하기'}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 20px',
          background: toast.type === 'success' ? '#334732' : '#C0392B',
          color: '#fff',
          borderRadius: 100,
          fontSize: 14, fontWeight: 600,
          fontFamily: "'Pretendard', sans-serif",
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          {toast.message}
        </div>
      )}
    </>
  )
}
