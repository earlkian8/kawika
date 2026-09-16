import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { ToastProvider } from '@/shared/ui/toast/ToastProvider'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}
