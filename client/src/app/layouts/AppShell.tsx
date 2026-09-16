import { Hand, Map as MapIcon, Swords, Trophy, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { AccountMenu } from '@/features/auth/components/AccountMenu'
import { StatsBar } from '@/features/progress/components/StatsBar'
import { KawikaMark } from '@/shared/brand/KawikaMark'
import './app-shell.css'

const NAV_ITEMS = [
  { id: 'lakbay', label: 'Lakbay', english: 'Journey', icon: MapIcon, to: '/home' },
  { id: 'senyas', label: 'Senyas', english: 'Sign library', icon: Hand },
  { id: 'hamon', label: 'Hamon', english: 'Challenges', icon: Swords },
  { id: 'ranggo', label: 'Ranggo', english: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Profile', english: 'Your progress', icon: UserRound },
]

function AppNav() {
  return (
    <nav className="nav" aria-label="Main">
      <NavLink className="nav__brand" to="/home" aria-label="Kawika home">
        <KawikaMark size={38} />
        <span>Kawika</span>
      </NavLink>
      <ul className="nav__list">
        {NAV_ITEMS.map(({ id, label, english, icon: Icon, to }) => {
          const content = (
            <>
              <Icon size={24} strokeWidth={2.4} aria-hidden="true" />
              <span className="nav__text">
                {label}
                <small>{english}</small>
              </span>
            </>
          )
          return (
            <li key={id}>
              {to ? (
                <NavLink className="nav__item" to={to}>
                  {content}
                </NavLink>
              ) : (
                <span className="nav__item" aria-disabled="true" title={`${english} is coming soon`}>
                  {content}
                  <span className="nav__soon">Soon</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Layout for every signed-in page: navigation, top bar, and the routed page. */
export default function AppShell() {
  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <AppNav />
      <header className="topbar">
        <NavLink className="topbar__brand" to="/home" aria-label="Kawika home">
          <KawikaMark size={36} />
        </NavLink>
        <StatsBar />
        <AccountMenu />
      </header>
      <main className="shell__content" id="content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
