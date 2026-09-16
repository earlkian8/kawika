import '@/shared/ui/ui.css'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: ReactNode
  prefix?: string
  trailing?: ReactNode
}

export function Field({ label, error, hint, prefix, trailing, id, className, ...input }: FieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={['field', error ? 'field--invalid' : '', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="field__control">
        {prefix && (
          <span className="field__prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
        {trailing}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key={error}
            id={errorId}
            className="field__error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <CircleAlert size={15} aria-hidden="true" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {hint && (
        <div id={hintId} className="field__hint">
          {hint}
        </div>
      )}
    </div>
  )
}
