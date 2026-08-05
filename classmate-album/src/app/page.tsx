import { cookies } from 'next/headers'
import { HomeClient } from './home-client'
import { LandingPage } from './landing'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const isLoggedIn = !!token

  if (!isLoggedIn) {
    return <LandingPage />
  }

  return <HomeClient />
}
