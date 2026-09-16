import { AnimatePresence, motion } from 'motion/react'
import { LogOut, MonitorSmartphone } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { authToasts } from '@/features/auth/lib/auth-toasts'
import { useDismiss } from '@/shared/hooks/use-dismiss'
import { useToast } from '@/shared/ui/toast/toast-context'
import '@/features/auth/styles/account-menu.css'

/** Avatar button in the top bar that reveals account details and sign-out actions. */
export function AccountMenu() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<'one' | 'all' | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback(() => {
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }, [])
  useDismiss(open, wrapper, close)

  if (!user) return null

  const signOut = async (everywhere: boolean) => {
    setPending(everywhere ? 'all' : 'one')
    // Toasts about the signed-in screens make no sense on the login page.
    toast.dismissAll()
    try {
      await logout({ everywhere })
      toast.show(everywhere ? authToasts.loggedOutEverywhere() : authToasts.loggedOut())
    } catch {
      // The local session is cleared either way; say what could not be confirmed.
      toast.show(authToasts.logoutUnconfirmed())
    }
  }

  return (
    <div className="profile" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className="profile__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{[...user.display_name][0]?.toUpperCase()}</span>
        <span className="visually-hidden">Account menu for {user.display_name}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            className="profile__panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
          >
            <div className="profile__who">
              <strong>{user.display_name}</strong>
              <span>@{user.username}</span>
              <span>{user.email}</span>
            </div>
            <button type="button" className="profile__action" onClick={() => signOut(false)} disabled={!!pending}>
              <LogOut size={18} aria-hidden="true" />
              {pending === 'one' ? 'Logging out…' : 'Log out'}
            </button>
            <button type="button" className="profile__action" onClick={() => signOut(true)} disabled={!!pending}>
              <MonitorSmartphone size={18} aria-hidden="true" />
              {pending === 'all' ? 'Logging out…' : 'Log out on all devices'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
