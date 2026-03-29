import { ConsumerLoginForm } from './ConsumerLoginForm'

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <ConsumerLoginForm redirectTo={next ?? '/'} />
}
