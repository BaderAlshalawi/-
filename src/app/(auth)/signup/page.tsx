'use client'

import { useEffect } from 'react'
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', '/signup')
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
            Create your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
