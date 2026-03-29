// ============================================================
// 틈 트리 게이미피케이션 - XP 규칙 & 레벨 시스템
// ============================================================

export const XP_RULES = {
  earn_visit: { amount: 10, label: '예약 완료', emoji: '✅' },
  no_show: { amount: -20, label: '노쇼 패널티', emoji: '❌' },
  earn_review: { amount: 5, label: '리뷰 작성', emoji: '✍️' },
} as const

export type XpType = keyof typeof XP_RULES

export const LEVELS = [
  {
    level: 1,
    name: '씨앗',
    minXp: 0,
    maxXp: 50,
    nextMinXp: 51,
    treeEmoji: '🌱',
    badgeColor: '#8B6F4E',
    badgeBg: '#FFF3E0',
    barColor: '#A1887F',
    description: '틈과 함께 시작했어요',
  },
  {
    level: 2,
    name: '새싹',
    minXp: 51,
    maxXp: 150,
    nextMinXp: 151,
    treeEmoji: '🌿',
    badgeColor: '#388E3C',
    badgeBg: '#E8F5E9',
    barColor: '#66BB6A',
    description: '조금씩 자라나고 있어요',
  },
  {
    level: 3,
    name: '나무',
    minXp: 151,
    maxXp: 300,
    nextMinXp: 301,
    treeEmoji: '🌳',
    badgeColor: '#2E7D32',
    badgeBg: '#C8E6C9',
    barColor: '#43A047',
    description: '제법 든든한 나무가 됐어요',
  },
  {
    level: 4,
    name: '숲',
    minXp: 301,
    maxXp: Infinity,
    nextMinXp: null,
    treeEmoji: '🌲',
    badgeColor: '#1B5E20',
    badgeBg: '#A5D6A7',
    barColor: '#2E7D32',
    description: '틈의 진정한 숲이 됐어요',
  },
] as const

export type LevelInfo = (typeof LEVELS)[number]

export interface XpSummary {
  xp: number
  level: LevelInfo
  nextLevel: LevelInfo | null
  /** 현재 레벨 내 진행 XP */
  progressXp: number
  /** 현재 레벨 총 범위 */
  rangeXp: number
  /** 0–100 사이 진행도 % */
  progressPercent: number
}

export function getXpSummary(rawXp: number): XpSummary {
  const xp = Math.max(0, rawXp)

  // 레벨 판별 (높은 레벨부터)
  const level = [...LEVELS].reverse().find((l) => xp >= l.minXp) ?? LEVELS[0]
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1) ?? null

  if (!nextLevel) {
    return {
      xp,
      level,
      nextLevel: null,
      progressXp: xp - level.minXp,
      rangeXp: 0,
      progressPercent: 100,
    }
  }

  const progressXp = xp - level.minXp
  const rangeXp = nextLevel.minXp - level.minXp
  const progressPercent = Math.min((progressXp / rangeXp) * 100, 100)

  return { xp, level, nextLevel, progressXp, rangeXp, progressPercent }
}

/** credits.type → 한글 레이블 & 아이콘 */
export function getXpEventLabel(type: string): { label: string; emoji: string; positive: boolean } {
  switch (type) {
    case 'earn_visit':
      return { label: '예약 완료', emoji: '✅', positive: true }
    case 'earn_review':
      return { label: '리뷰 작성', emoji: '✍️', positive: true }
    case 'earn_referral':
      return { label: '친구 초대', emoji: '👫', positive: true }
    case 'earn_event':
      return { label: '이벤트 참여', emoji: '🎉', positive: true }
    case 'no_show':
      return { label: '노쇼 패널티', emoji: '❌', positive: false }
    case 'admin_adjust':
      return { label: '관리자 조정', emoji: '🔧', positive: true }
    default:
      return { label: type, emoji: '•', positive: true }
  }
}
