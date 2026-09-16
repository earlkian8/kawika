import { motion } from 'motion/react'
import { assessPassword, MIN_PASSWORD_LENGTH } from '@/features/auth/lib/password-strength'

const LEVEL_COLORS = ['var(--gumamela)', 'var(--mangga)', 'var(--bughaw)', 'var(--dahon)']

export function PasswordMeter({ password, context }: { password: string; context: string[] }) {
  const { level, label } = assessPassword(password, context)
  const length = [...password].length
  const progress = level === 0 ? Math.min(length / MIN_PASSWORD_LENGTH, 1) * 0.3 : [0.3, 0.45, 0.72, 1][level]

  return (
    <div className="meter">
      <div className="meter__track" aria-hidden="true">
        <motion.div
          className="meter__fill"
          animate={{ scaleX: progress, backgroundColor: LEVEL_COLORS[level] }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        />
        <span className="meter__goal" />
      </div>
      <p className="meter__label" aria-live="polite">
        {label}
      </p>
    </div>
  )
}
