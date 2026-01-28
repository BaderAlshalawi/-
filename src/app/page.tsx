import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function Home() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value
  
  // If authenticated, go to dashboard; otherwise go to login
  if (token) {
    redirect('/dashboard')
  }
  redirect('/login')
}
