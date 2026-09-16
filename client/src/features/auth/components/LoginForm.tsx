import { useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCountdown } from '@/features/auth/hooks/use-countdown'
import { describeError, formatWait, type FieldErrors } from '@/features/auth/lib/auth-errors'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { PasswordField } from '@/shared/ui/PasswordField'
import { FormAlert } from '@/features/auth/components/FormAlert'

export function LoginForm() {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const wait = useCountdown(lockedUntil)
  const locked = wait > 0

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending || locked) return
    const next: FieldErrors = {}
    if (!identifier.trim()) next.identifier = 'Enter your email or username.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return

    setPending(true)
    try {
      await login({ identifier: identifier.trim(), password, remember })
    } catch (error) {
      const { message, fields, retryAfter } = describeError(error)
      setErrors(fields)
      setFormError(message)
      if (retryAfter) setLockedUntil(Date.now() + retryAfter * 1000)
      setPassword('')
      setPending(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <FormAlert message={locked ? `Too many attempts. Try again in ${formatWait(wait)}.` : formError} />
      <Field
        label="Email or username"
        name="identifier"
        autoComplete="username"
        autoCapitalize="off"
        spellCheck={false}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        error={errors.identifier}
        maxLength={254}
        required
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        maxLength={128}
        required
      />
      <label className="check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span className="check__box" aria-hidden="true" />
        <span>
          Keep me logged in for 30 days
          <small>Only on a device you don't share.</small>
        </span>
      </label>
      <Button type="submit" loading={pending} disabled={locked}>
        Log in
      </Button>
    </form>
  )
}
