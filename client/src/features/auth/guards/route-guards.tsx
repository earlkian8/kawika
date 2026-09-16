import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/context/auth-context'
import { safeRedirect } from '@/features/auth/lib/safe-redirect'
import { Splash } from '@/shared/ui/Splash'

/** Renders child routes only for signed-in learners. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

/** Renders child routes only for visitors; signed-in learners go to where they were headed. */
export function GuestOnly() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status === 'authenticated') {
    // Covers both a returning visitor and the moment a login succeeds.
    const from = (location.state as { from?: unknown } | null)?.from
    return <Navigate to={safeRedirect(from)} replace />
  }
  return <Outlet />
}
