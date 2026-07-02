import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import CheckoutContent from './_content'

const Loading = () => (
  <div className="min-h-screen bg-stone-950 flex items-center justify-center">
    <p className="text-stone-400 text-sm">Loading…</p>
  </div>
)

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ customId?: string }>
}) {
  const session = await auth()
  const { customId = '' } = await searchParams

  if (!session) {
    const returnUrl = `/checkout${customId ? `?customId=${customId}` : ''}`
    redirect(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`)
  }

  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContent customId={customId} />
    </Suspense>
  )
}
