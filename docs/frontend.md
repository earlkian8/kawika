# Frontend modules (`client/`)

React 19, TypeScript, Vite 8, React Router 8, Motion, Lucide icons, Zod (mini). Fonts are self-hosted: *Anybody* for display text and *Atkinson Hyperlegible Next* for body text.

## `src/app/` — application root

| Module | Responsibility |
| ------ | -------------- |
| `App.tsx` | Wraps the router in `AuthProvider`. |
| `router.tsx` | Route table. Guest routes (`/login`, `/register`) share `AuthPage` as a layout. Signed-in routes render inside `AppShell`. Signed-in code is lazy-loaded. |
| `layouts/AppShell.tsx` | Signed-in chrome: side/bottom navigation, top bar (stats, account menu), skip link, and `<Outlet />`. |

### Routes

| Path | Guard | Screen |
| ---- | ----- | ------ |
| `/login`, `/register` | `GuestOnly` | `pages/auth/AuthPage` |
| `/home` | `RequireAuth` | `AppShell` → `pages/home/HomePage` |
| anything else | – | Redirects to `/home`, then to `/login` if signed out |

## `src/pages/` — route screens

| Module | Responsibility |
| ------ | -------------- |
| `auth/AuthPage.tsx` | Story panel (banderitas, headline), Log in / Create account tabs, animated form swap, focus management. |
| `home/HomePage.tsx` | Greeting, "Continue quest", journey map, and the progress rail. |
| `home/greeting.ts` | Filipino greeting for the time of day. |

## `src/features/` — domain modules

### `auth`

| Path | Responsibility |
| ---- | -------------- |
| `api/auth-api.ts` | Typed calls for `me`, `login`, `register`, `logout`. Responses are validated with Zod. |
| `context/AuthProvider.tsx`, `context/auth-context.ts` | Session state (`loading` / `authenticated` / `anonymous`) and the `useAuth()` hook. |
| `guards/route-guards.tsx` | `RequireAuth` and `GuestOnly` route elements. |
| `components/LoginForm.tsx` | Login with lockout countdown, generic errors, and "keep me logged in". |
| `components/RegisterForm.tsx` | Sign-up with client validation, server field errors, and the password meter. |
| `components/PasswordMeter.tsx` | Live strength feedback toward the 15-character minimum. |
| `components/FormAlert.tsx` | Announced form-level error banner. |
| `components/AccountMenu.tsx` | Account details, "Log out", and "Log out on all devices". |
| `hooks/use-countdown.ts` | Ticking seconds for rate-limit lockouts. |
| `lib/password-strength.ts` | Mirrors the server's length and context rules for instant feedback. |
| `lib/safe-redirect.ts` | Allows only in-app post-login destinations (no open redirects). |
| `lib/auth-errors.ts` | Maps thrown errors to messages, field errors, and retry delays. |

### `journey`

| Path | Responsibility |
| ---- | -------------- |
| `components/JourneyMap.tsx` | The island-hopping route. Owns which quest is open and exposes `focusCurrent()`. |
| `components/IslaSection.tsx` | Island banner and winding path. |
| `components/QuestNode.tsx` | Quest button, progress ring, "Simulan" callout, and details popover. |
| `components/QuestIcon.tsx`, `components/IslaCrossing.tsx` | Icon per quest type, sea crossing between islands. |
| `lib/route-layout.ts` | Node positions and the SVG path geometry. |
| `data/islands.ts`, `types.ts` | Mock islands and quests (to be replaced by API data). |

### `progress`

| Path | Responsibility |
| ---- | -------------- |
| `components/StatsBar.tsx` | Streak, XP, and perlas counters. |
| `components/WeekStreak.tsx` | Streak card with Lunes to Linggo. |
| `components/DailyQuests.tsx` | Today's three goals with progress bars. |
| `components/LeagueCard.tsx` | Weekly league standings. |
| `data/learner.ts` | Mock learner progress. |

## `src/shared/` — feature-agnostic building blocks

| Path | Responsibility |
| ---- | -------------- |
| `api/http-client.ts` | `request()`: same-origin cookies, CSRF header on unsafe methods, one automatic CSRF refresh, and a typed `ApiError` (including network failures). |
| `ui/Button.tsx`, `ui/Field.tsx`, `ui/PasswordField.tsx`, `ui/Splash.tsx` | Accessible form controls and the loading splash. |
| `brand/KawikaMark.tsx`, `brand/Banderitas.tsx` | Logo mark, wordmark, and the fiesta bunting. |
| `hooks/use-dismiss.ts` | Close on Escape or an outside click (menus, popovers). |
| `styles/tokens.css`, `styles/base.css` | Design tokens and element defaults. |

## Design system

| Token | Hex | Use |
| ----- | --- | --- |
| Tinta | `#1D1846` | Text, dark surfaces |
| Capiz | `#F3F1FA` | Page background |
| Bughaw | `#2F4BE0` | Primary actions |
| Mangga | `#FFB627` | XP and rewards |
| Gumamela | `#CC2A50` | Streaks and errors |
| Dahon | `#0B7F54` | Success and completion |

Every colour used behind white text meets WCAG AA (4.5:1). Motion is limited to one entrance per screen plus responses to user actions, and respects `prefers-reduced-motion`.
