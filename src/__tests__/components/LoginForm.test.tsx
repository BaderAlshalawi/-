import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render email and password fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument()
  })

  it('should show validation error for empty submit', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitBtn)
    await waitFor(() => {
      const emailError = screen.queryByText(/invalid email/i)
      const passwordError = screen.queryByText(/password is required/i)
      expect(emailError !== null || passwordError !== null).toBe(true)
    })
  })
})
