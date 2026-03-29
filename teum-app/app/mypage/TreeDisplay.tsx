'use client'

import { useEffect, useRef } from 'react'
import type { XpSummary } from '@/lib/gamification'
import { getXpEventLabel } from '@/lib/gamification'

interface HistoryItem {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

interface Props {
  xpSummary: XpSummary
  history: HistoryItem[]
  userName: string
}

// 레벨별 나무 시각화 (CSS 그림)
function TreeVisual({ level }: { level: number }) {
  const trees = [
    // Lv.1 씨앗
    <div key={1} className="tree-stage">
      <div className="seed-pot">
        <span className="tree-emoji" style={{ fontSize: 64 }}>🌱</span>
      </div>
      <div className="tree-shadow" />
    </div>,
    // Lv.2 새싹
    <div key={2} className="tree-stage">
      <span className="tree-emoji" style={{ fontSize: 80 }}>🌿</span>
      <div className="tree-shadow" />
    </div>,
    // Lv.3 나무
    <div key={3} className="tree-stage">
      <span className="tree-emoji" style={{ fontSize: 96 }}>🌳</span>
      <div className="tree-shadow" />
    </div>,
    // Lv.4 숲
    <div key={4} className="tree-stage">
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
        <span className="tree-emoji" style={{ fontSize: 72 }}>🌲</span>
        <span className="tree-emoji" style={{ fontSize: 96 }}>🌲</span>
        <span className="tree-emoji" style={{ fontSize: 72 }}>🌲</span>
      </div>
      <div className="tree-shadow" />
    </div>,
  ]
  return trees[level - 1] ?? trees[0]
}

function XpBar({ percent, color }: { percent: number; color: string }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    // 초기 0%에서 시작 후 애니메이션
    bar.style.width = '0%'
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = `${percent}%`
      })
    })
    return () => cancelAnimationFrame(raf1)
  }, [percent])

  return (
    <div
      style={{
        height: 14,
        borderRadius: 7,
        background: 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          borderRadius: 7,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: 'width 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function TreeDisplay({ xpSummary, history, userName }: Props) {
  const { level, nextLevel, xp, progressXp, rangeXp, progressPercent } = xpSummary

  return (
    <>
      <style>{`
        .teum-mypage {
          min-height: 100vh;
          background: #F5F1E8;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 16px 80px;
          font-family: -apple-system, 'Apple SD Gothic Neo', sans-serif;
        }
        .teum-header {
          width: 100%;
          max-width: 400px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .teum-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0F2E2A;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F5F1E8;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .teum-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 24px;
          padding: 28px 24px;
          box-shadow: 0 2px 20px rgba(15,46,42,0.08);
          margin-bottom: 16px;
        }
        .level-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .tree-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 16px 0 24px;
          animation: treeAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes treeAppear {
          from { opacity: 0; transform: scale(0.6) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .tree-emoji {
          display: block;
          line-height: 1;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.12));
        }
        .tree-shadow {
          width: 60px;
          height: 8px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%);
          margin-top: 4px;
          border-radius: 50%;
        }
        .xp-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
          color: #666;
        }
        .xp-total {
          font-size: 28px;
          font-weight: 800;
          color: #0F2E2A;
          line-height: 1;
          margin-bottom: 4px;
        }
        .xp-unit {
          font-size: 14px;
          font-weight: 500;
          color: #888;
          margin-left: 4px;
        }
        .history-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 24px;
          padding: 20px 24px;
          box-shadow: 0 2px 20px rgba(15,46,42,0.08);
        }
        .history-title {
          font-size: 15px;
          font-weight: 700;
          color: #0F2E2A;
          margin-bottom: 16px;
        }
        .history-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #F0EDE6;
        }
        .history-item:last-child { border-bottom: none; }
        .history-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .history-desc {
          flex: 1;
          font-size: 13px;
          color: #333;
          line-height: 1.4;
        }
        .history-date {
          font-size: 11px;
          color: #aaa;
          margin-top: 2px;
        }
        .history-amount {
          font-size: 14px;
          font-weight: 700;
        }
        .rules-card {
          width: 100%;
          max-width: 400px;
          margin-top: 16px;
          background: #0F2E2A;
          border-radius: 20px;
          padding: 20px 24px;
        }
        .rules-title {
          font-size: 13px;
          font-weight: 700;
          color: #A8C5C0;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rule-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 13px;
          color: #E0EDE8;
        }
        .rule-xp-pos { color: #6FCF97; font-weight: 700; }
        .rule-xp-neg { color: #EB5757; font-weight: 700; }
        .levels-row {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .level-chip {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(255,255,255,0.08);
          color: #C8DED9;
          white-space: nowrap;
        }
      `}</style>

      <div className="teum-mypage">
        {/* 헤더 */}
        <div className="teum-header">
          <div className="teum-avatar">{userName.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F2E2A' }}>{userName}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>틈 트리 멤버</div>
          </div>
        </div>

        {/* 메인 트리 카드 */}
        <div className="teum-card">
          {/* 레벨 배지 */}
          <div
            className="level-badge"
            style={{ backgroundColor: level.badgeBg, color: level.badgeColor }}
          >
            <span>{level.treeEmoji}</span>
            <span>Lv.{level.level} {level.name}</span>
          </div>

          {/* 나무 비주얼 */}
          <div style={{ textAlign: 'center' }}>
            <TreeVisual level={level.level} />
            <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>{level.description}</p>
          </div>

          {/* XP 수치 */}
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <span className="xp-total">{xp.toLocaleString()}</span>
            <span className="xp-unit">XP</span>
          </div>

          {/* 진행 바 */}
          <div className="xp-label-row">
            <span>{level.treeEmoji} {level.name}</span>
            {nextLevel ? (
              <span>{progressXp} / {rangeXp} XP → {nextLevel.treeEmoji} {nextLevel.name}</span>
            ) : (
              <span>최고 레벨 달성!</span>
            )}
          </div>
          <XpBar percent={progressPercent} color={level.barColor} />
          {nextLevel && (
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'right' }}>
              다음 레벨까지 {rangeXp - progressXp} XP 남음
            </p>
          )}
        </div>

        {/* XP 이력 */}
        {history.length > 0 && (
          <div className="history-card">
            <div className="history-title">XP 이력</div>
            {history.map((item) => {
              const { label, emoji, positive } = getXpEventLabel(item.type)
              return (
                <div key={item.id} className="history-item">
                  <div
                    className="history-icon"
                    style={{ background: positive ? '#E8F5E9' : '#FEEBEB' }}
                  >
                    {emoji}
                  </div>
                  <div className="history-desc">
                    <div>{item.description ?? label}</div>
                    <div className="history-date">{formatDate(item.created_at)}</div>
                  </div>
                  <div
                    className="history-amount"
                    style={{ color: item.amount >= 0 ? '#2E7D32' : '#EB5757' }}
                  >
                    {item.amount >= 0 ? '+' : ''}{item.amount} XP
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* XP 획득 규칙 안내 */}
        <div className="rules-card">
          <div className="rules-title">XP 적립 규칙</div>
          <div className="rule-row">
            <span>✅ 예약 완료</span>
            <span className="rule-xp-pos">+10 XP</span>
          </div>
          <div className="rule-row">
            <span>✍️ 리뷰 작성</span>
            <span className="rule-xp-pos">+5 XP</span>
          </div>
          <div className="rule-row">
            <span>❌ 노쇼</span>
            <span className="rule-xp-neg">−20 XP</span>
          </div>
          <div className="levels-row">
            <span className="level-chip">🌱 씨앗 0~50</span>
            <span className="level-chip">🌿 새싹 51~150</span>
            <span className="level-chip">🌳 나무 151~300</span>
            <span className="level-chip">🌲 숲 301+</span>
          </div>
        </div>
      </div>
    </>
  )
}
