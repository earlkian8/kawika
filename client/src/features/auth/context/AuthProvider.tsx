import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginInput, type RegisterInput, type User } from '@/features/auth/api/auth-api'
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/features/auth/context/auth-context'
import { ensureCsrf } from '@/shared/api/http-client'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false
    Promise.all([ensureCsrf(), authApi.me()])
      .then(([, me]) => {
        if (cancelled) return
        setUser(me)
        setStatus(me ? 'authenticated' : 'anonymous')
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const next = await authApi.login(input)
    setUser(next)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const next = await authApi.register(input)
    setUser(next)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async ({ everywhere = false } = {}) => {
    try {
      await authApi.logout(everywhere)
    } finally {
      // Clear local state even if the network call fails; the cookie is
      // HttpOnly, so the server-side session simply expires.
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
