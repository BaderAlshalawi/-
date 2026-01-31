'use client'

import { useEffect } from 'react'
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  // Clean URL: remove any query parameters from address bar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', '/signup')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Lean Portfolio Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
