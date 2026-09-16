import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useCountdown } from '@/features/auth/hooks/use-countdown'
import { describeError, formatWait, type FieldErrors } from '@/features/auth/lib/auth-errors'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { PasswordField } from '@/shared/ui/PasswordField'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { authToasts } from '@/features/auth/lib/auth-toasts'
import { useToast } from '@/shared/ui/toast/toast-context'
import { PasswordMeter } from '@/features/auth/components/PasswordMeter'
import { MIN_PASSWORD_LENGTH } from '@/features/auth/lib/password-strength'

export function RegisterForm() {
  const { register } = useAuth()
  const toast = useToast()
  const [values, setValues] = useState({ display_name: '', username: '', email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const wait = useCountdown(lockedUntil)
  const locked = wait > 0

  const set = (key: keyof typeof values) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: event.target.value }))
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!values.display_name.trim()) next.display_name = "Enter the name you'd like to be called."
    if (!/^[A-Za-z0-9_]{3,24}$/.test(values.username.trim()))
      next.username = 'Use 3–24 letters, numbers, or underscores.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter a valid email address.'
    if ([...values.password].length < MIN_PASSWORD_LENGTH)
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    return next
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending || locked) return
    const next = validate()
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) {
      document.getElementById(`register-${Object.keys(next)[0]}`)?.focus()
      return
    }

    setPending(true)
    try {
      const user = await register({
        display_name: values.display_name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      toast.show(authToasts.registered(user))
    } catch (error) {
      const { message, fields, retryAfter } = describeError(error)
      setErrors(fields)
      setFormError(Object.keys(fields).length ? null : message)
      if (retryAfter) setLockedUntil(Date.now() + retryAfter * 1000)
      const firstField = Object.keys(fields)[0]
      if (firstField) document.getElementById(`register-${firstField}`)?.focus()
      setPending(false)
    }
  }

  const context = [values.display_name, values.username, values.email.split('@')[0]]

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <FormAlert message={locked ? `Too many sign-ups from this network. Try again in ${formatWait(wait)}.` : formError} />
      <Field
        id="register-display_name"
        label="What should we call you?"
        name="display_name"
        autoComplete="nickname"
        value={values.display_name}
        onChange={set('display_name')}
        error={errors.display_name}
        maxLength={50}
        required
      />
      <Field
        id="register-username"
        label="Username"
        name="username"
        prefix="@"
        autoComplete="username"
        autoCapitalize="off"
        spellCheck={false}
        value={values.username}
        onChange={set('username')}
        error={errors.username}
        hint={errors.username ? undefined : 'Shown on leaderboards. Letters, numbers, and underscores.'}
        maxLength={24}
        required
      />
      <Field
        id="register-email"
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        spellCheck={false}
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        maxLength={254}
        required
      />
      <PasswordField
        id="register-password"
        label="Password"
        name="password"
        autoComplete="new-password"
        value={values.password}
        onChange={set('password')}
        error={errors.password}
        maxLength={128}
        hint={errors.password ? undefined : <PasswordMeter password={values.password} context={context} />}
        required
      />
      <p className="auth-form__tip">
        A short sentence is easier to remember than symbols, like <q>sabay kain sa bahay ni lola</q>. We also
        check it against passwords leaked in data breaches.
      </p>
      <Button type="submit" loading={pending} disabled={locked}>
        Create account
      </Button>
    </form>
  )
}
