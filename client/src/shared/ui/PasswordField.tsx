import { Eye, EyeOff } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Field, type FieldProps } from '@/shared/ui/Field'

type PasswordFieldProps = Omit<FieldProps, 'type' | 'trailing'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const detectCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState?.('CapsLock') ?? false)
  }

  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      onKeyUp={detectCaps}
      onKeyDown={detectCaps}
      onBlur={(event) => {
        setCapsLock(false)
        props.onBlur?.(event)
      }}
      hint={
        <>
          {capsLock && <span className="field__caps">Caps Lock is on</span>}
          {props.hint}
        </>
      }
      trailing={
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      }
    />
  )
}
