import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { Banderitas } from '@/shared/brand/Banderitas'
import { KawikaWordmark } from '@/shared/brand/KawikaMark'
import '@/features/auth/styles/auth.css'
import './auth-page.css'

type Mode = 'login' | 'register'

const COPY = {
  login: {
    title: 'Tara, magpatuloy.',
    lede: 'Log in to keep your streak going.',
  },
  register: {
    title: 'Tara, simulan.',
    lede: 'Create a free account. Your first quest takes about five minutes.',
  },
} satisfies Record<Mode, { title: string; lede: string }>

/**
 * Layout route for /login and /register. Staying mounted across both lets the
 * tab pill and form slide animate, and moves focus to the new heading.
 */
export default function AuthPage() {
  const location = useLocation()
  const mode: Mode = location.pathname.startsWith('/register') ? 'register' : 'login'
  const reduce = useReducedMotion()
  const initialMode = useRef(mode)
  const hasSwitched = useRef(false)

  useEffect(() => {
    document.title = mode === 'login' ? 'Log in: Kawika' : 'Create account: Kawika'
    if (mode !== initialMode.current) hasSwitched.current = true
  }, [mode])

  // After a tab switch, move focus to the new heading once it mounts (the old
  // form animates out first). The heading on first load is left alone.
  const focusIfSwitched = useCallback((node: HTMLHeadingElement | null) => {
    if (node && hasSwitched.current) node.focus()
  }, [])

  return (
    <div className="auth">
      <section className="auth__story" aria-label="About Kawika">
        <Banderitas className="auth__banderitas" />
        <div className="auth__story-body">
          <KawikaWordmark size={40} />
          <h1 className="auth__headline">Kamay na nagsasalita.</h1>
          <p className="auth__pitch">
            Learn Filipino Sign Language in five-minute quests set in places you already know: the sari-sari
            store, the jeepney, the fiesta down the street.
          </p>
        </div>
        <p className="auth__footnote">
          FSL is the national sign language of the Philippines under Republic Act 11106.
        </p>
        <div className="banig" aria-hidden="true" />
      </section>

      <main className="auth__panel">
        <div className="auth__card">
          <nav className="auth-tabs" aria-label="Account">
            {(['login', 'register'] as const).map((tab) => (
              <NavLink
                key={tab}
                to={tab === 'login' ? '/login' : '/register'}
                state={location.state}
                replace
                className="auth-tabs__tab"
                aria-current={mode === tab ? 'page' : undefined}
              >
                {mode === tab && (
                  <motion.span
                    layoutId="auth-tab-pill"
                    className="auth-tabs__pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="auth-tabs__label">{tab === 'login' ? 'Log in' : 'Create account'}</span>
              </NavLink>
            ))}
          </nav>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: mode === 'register' ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: mode === 'register' ? -24 : 24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="auth__header">
                <h2 ref={focusIfSwitched} tabIndex={-1}>
                  {COPY[mode].title}
                </h2>
                <p>{COPY[mode].lede}</p>
              </header>
              {mode === 'login' ? <LoginForm /> : <RegisterForm />}
            </motion.div>
          </AnimatePresence>

          <p className="auth__trust">
            <ShieldCheck size={16} aria-hidden="true" />
            Passwords are stored as a one-way hash, never as plain text.
          </p>
        </div>
      </main>
    </div>
  )
}
