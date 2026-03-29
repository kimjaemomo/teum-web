import type { Metadata } from 'next'
import { DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '틈 — 동네 빈 시간, 지금 바로 예약',
  description: '도보 10분 내 뷰티샵 공실을 최대 50% 할인으로. 틈(TEUM) 하이퍼로컬 타임 커머스.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={dmSerifDisplay.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
