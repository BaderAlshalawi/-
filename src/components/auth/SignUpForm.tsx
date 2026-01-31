'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRole } from '@/types'

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PROGRAM_MANAGER,
    UserRole.PRODUCT_MANAGER,
    UserRole.CONTRIBUTOR,
    UserRole.VIEWER,
  ]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export function SignUpForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onSubmit',
    defaultValues: {
      role: UserRole.VIEWER,
    },
  })

  const doSignUp = useCallback(async (data: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      // Redirect to login page after successful registration
      router.push('/login?registered=true')
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }, [router])

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      handleSubmit(doSignUp)(e)
    },
    [handleSubmit, doSignUp]
  )

  return (
    <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            {...register('name')}
            className="mt-1"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="john.doe@company.com"
            {...register('email')}
            className="mt-1"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            {...register('password')}
            className="mt-1"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Must be 8+ chars with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...register('confirmPassword')}
            className="mt-1"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            {...register('role')}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={UserRole.VIEWER}>Viewer - Read-only access</option>
            <option value={UserRole.CONTRIBUTOR}>Contributor - Can contribute to features</option>
            <option value={UserRole.PRODUCT_MANAGER}>Product Manager - Manage products</option>
            <option value={UserRole.PROGRAM_MANAGER}>Program Manager - Manage portfolios</option>
            <option value={UserRole.ADMIN}>Admin - Full administrative access</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin - System administrator</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
      </div>

      <div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </div>

      <div className="text-sm text-center">
        <span className="text-gray-600">Already have an account? </span>
        <a
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Sign in
        </a>
      </div>
    </form>
  )
}
