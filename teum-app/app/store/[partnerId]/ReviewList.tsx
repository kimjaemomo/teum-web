'use client'

import { useState } from 'react'
import type { ReviewRow } from './page'

const TREE_EMOJIS = ['🌱', '🌿', '🌳', '🌲', '🌲']

interface Props {
  reviews: ReviewRow[]
  partnerName: string
  averageRating: number
}

export function ReviewList({ reviews, partnerName, averageRating }: Props) {
  if (reviews.length === 0) {
    return (
      <div style={{ background: '#fff', padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#A8A89A', fontFamily: "'Pretendard', sans-serif" }}>
          아직 후기가 없습니다. 첫 번째 후기를 남겨보세요 🌱
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', padding: '20px 20px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B1B', fontFamily: "'Pretendard', sans-serif" }}>
          후기 {reviews.length}개
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{TREE_EMOJIS[Math.round(averageRating) - 1] ?? '🌱'}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#334732', fontFamily: "'Pretendard', sans-serif" }}>
            {averageRating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewRow }) {
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate = review.content.length > 100

  const displayName = review.is_anonymous ? '익명' : (review.reviewer_name ?? '익명')
  const dateStr = new Date(review.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div style={{
      padding: '16px',
      background: '#FAF8F3',
      borderRadius: 12,
      border: '1px solid #E3DFD4',
      fontFamily: "'Pretendard', sans-serif",
    }}>
      {/* 상단: 작성자 + 별점 + 날짜 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 아바타 */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#334732',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0,
          }}>
            {displayName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1C2B1B' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: '#A8A89A' }}>{dateStr}</div>
          </div>
        </div>
        {/* 별점 트리 아이콘 */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TREE_EMOJIS.map((emoji, i) => (
            <span key={i} style={{ fontSize: 14, opacity: i < review.rating ? 1 : 0.25 }}>
              {emoji}
            </span>
          ))}
        </div>
      </div>

      {/* 키워드 */}
      {review.keywords && review.keywords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {review.keywords.map(kw => (
            <span key={kw} style={{
              padding: '3px 8px',
              background: 'rgba(51,71,50,0.08)',
              borderRadius: 100,
              fontSize: 11, color: '#334732', fontWeight: 500,
            }}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* 본문 */}
      <p style={{
        fontSize: 13, color: '#6B6B5E', lineHeight: 1.6,
        margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {shouldTruncate && !expanded
          ? review.content.slice(0, 100) + '...'
          : review.content}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(p => !p)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#A8A89A', padding: '4px 0 0',
            fontFamily: "'Pretendard', sans-serif",
          }}
        >
          {expanded ? '접기' : '더 보기'}
        </button>
      )}

      {/* 사진 */}
      {review.image_urls && review.image_urls.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          marginTop: 10, paddingBottom: 2,
        }}>
          {review.image_urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`후기 사진 ${i + 1}`}
              style={{
                width: 80, height: 80, borderRadius: 8,
                objectFit: 'cover', flexShrink: 0,
                border: '1px solid #E3DFD4',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
