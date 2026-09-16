import '@/shared/ui/ui.css'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'mangga' | 'quiet'
  loading?: boolean
}

export function Button({ variant = 'primary', loading = false, children, className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={['btn', `btn--${variant}`, className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <LoaderCircle className="btn__spinner" size={20} aria-hidden="true" />}
      <span className="btn__label">{children}</span>
    </button>
  )
}
