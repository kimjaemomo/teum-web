import { LoginForm } from './LoginForm'

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function PartnerLoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  // 미들웨어가 이미 인증된 사용자를 /partner로 리다이렉트하므로
  // 여기에 도달했다면 미인증 상태임
  return <LoginForm redirectTo={next ?? '/partner'} />
}
