import '@/shared/ui/ui.css'
import { KawikaMark } from '@/shared/brand/KawikaMark'

/** Full-screen placeholder while the session is being checked. */
export function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <KawikaMark size={56} animated />
      <span className="visually-hidden">Loading Kawika</span>
    </div>
  )
}
