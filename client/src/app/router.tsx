import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { GuestOnly, RequireAuth } from '@/features/auth/guards/route-guards'
import AuthPage from '@/pages/auth/AuthPage'

// Signed-in screens load on demand so the login page stays light.
const AppShell = lazy(() => import('@/app/layouts/AppShell'))
const HomePage = lazy(() => import('@/pages/home/HomePage'))

const suspend = (element: ReactNode) => <Suspense fallback={null}>{element}</Suspense>

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthPage />,
        children: [{ path: '/login' }, { path: '/register' }],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: suspend(<AppShell />),
        children: [{ path: '/home', element: suspend(<HomePage />) }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/home" replace /> },
])
