'use client'

import { Suspense, useEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', '/login')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B365D] via-[#2d4a7c] to-[#7C3AED]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#1B365D] to-[#7C3AED] rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">LP</span>
          </div>
          <h2 className="text-3xl font-extrabold text-primary">
            LeanPulse
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <Suspense fallback={<div className="animate-pulse h-32 bg-gray-100 rounded" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
