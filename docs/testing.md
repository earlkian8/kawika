# Testing

Kawika is tested at three layers. Run all of them before opening a pull request.

| Layer | Tool | Location | Command |
| ----- | ---- | -------- | ------- |
| Server (API, unit, migrations) | pytest | `server/tests/` | `cd server && pytest` |
| Client units | Vitest | `client/src/**/*.test.ts` | `cd client && npm test` |
| End-to-end UAT | Playwright + axe-core | `client/e2e/` | `cd client && npm run test:e2e` |

Also run `npm run lint` and `npm run build` in `client/`.

## Server tests

Tests run against **PostgreSQL** (`TEST_DATABASE_URL`) and refuse any database whose name does not end in `_test`. At session start the suite downgrades to base and upgrades to head, then truncates tables and clears rate limits before each test. The Have I Been Pwned lookup is disabled here and covered with mocks instead.

| File | Covers |
| ---- | ------ |
| `tests/api/test_register.py` | Session creation, Argon2id storage, name cleanup, Unicode and markup stored verbatim, per-field validation, reserved names and control characters, unknown fields, weak passwords, length bounds, no password echo, case-insensitive duplicates, sign-up rate limit |
| `tests/api/test_login.py` | Email or username in any case, identical errors for wrong password and unknown account, injection-style identifiers, NFC/NFD passwords, lockout and reset, remember-me cookie, CSRF required |
| `tests/api/test_sessions.py` | 401 without a session, hashed token storage, rotation on login, logout, logout everywhere, idle and absolute expiry, forged or oversized tokens, cascade on user delete |
| `tests/api/test_hardening.py` | CSRF (missing, forged, cross-site, foreign origin), Host allowlist, 404/405 error shape, malformed JSON, health check, security headers |
| `tests/unit/test_passwords.py` | Hash round trip, corrupt hashes, policy messages, passphrases, k-anonymity request, offline fail-open |
| `tests/unit/test_rate_limit.py` | Limits, sliding window, independent keys |
| `tests/test_migrations.py` | Models match migrations (`alembic check`), clean downgrade and upgrade |
| `tests/cli/test_db_commands.py` | `status` (no password shown), idempotent `migrate`, `--to`, `rollback`, `reset`, `make-migration` (refuses no-op, `--empty` file), `check`; `fresh` removes unknown tables, views, and enums; `fresh --seed`; prompt required without a terminal, decline and accept; idempotent and selective `seed`, growing learners, unknown seeder, count bounds, pending migrations; demo account can log in; production refusal before connecting; test-database name guard; unreachable database message |
| `tests/unit/test_seed_data.py` | Filipino name slugs; 1,000 learner profiles valid, unique, and reproducible; seed passwords pass the policy; URL display hides the password; `fresh` stops on a lock without dropping anything |

## Client unit tests

| File | Covers |
| ---- | ------ |
| `features/auth/lib/safe-redirect.test.ts` | Open-redirect attempts (`//`, backslash, absolute and `javascript:` URLs, control characters, redirect loops) |
| `features/auth/lib/password-strength.test.ts` | Countdown to 15 characters, emoji length, variety and personal-detail checks, passphrases |
| `features/auth/lib/auth-errors.test.ts` | Wait formatting and error normalisation |
| `features/journey/lib/route-layout.test.ts` | Continuous numbering, node rows, sway continuity, a single current quest |
| `pages/home/greeting.test.ts` | Greeting boundaries |
| `shared/api/http-client.test.ts` | CSRF header rules, `ApiError` mapping, network failures, non-JSON errors, CSRF refresh and retry |

## End-to-end UAT suite

`npm run test:e2e` starts an **isolated stack**: the API on port 8010 against `kawika_test` (rebuilt first with `kawika db --database test fresh --force`), and Vite on port 5180. Your dev servers and dev database are untouched. Every scenario runs on a **desktop** (1440×900) and a **mobile** (Pixel 7) browser.

Every test also fails automatically on an uncaught JavaScript error, an unexpected console error, or any `alert()`/`confirm()` dialog (which would signal injected script).

| Spec | Scenarios |
| ---- | --------- |
| `auth/register.spec.ts` | Happy path; empty submit (all errors, focus, no request); whitespace name; 6 invalid usernames; 5 invalid emails; reserved username; live password meter; password built from username; breached password (live HIBP); taken username and email in other case; HTML/script in name rendered as text; Ñ and emoji names; `maxlength` caps; 50-character unbroken name without layout break; double-click sends one request; Enter submits; error clears while typing |
| `auth/login.spec.ts` | Redirect to login and back to the deep link; email or username with case and spaces; wrong password keeps identifier and clears password; unknown account gets the same message; SQL, HTML, `%`, and 254-character identifiers; empty submit; lockout after 5 failures with countdown and disabled button; session vs 30-day cookie; session cookie hidden from `document.cookie`; show/hide password; tab switching keeps the destination and moves focus; keyboard-only login |
| `auth/session.spec.ts` | Signed-in users skip auth pages and unknown routes; reload keeps the session; logout plus the back button; logout on all devices ends another browser's session; forged session cookie; missing CSRF cookie recovered |
| `home/journey.spec.ts` | Five islands and the current quest; Continue quest scrolls, focuses, and opens; Escape and outside click close; one popover at a time; locked vs completed details; account menu with Escape returning focus; nav current page and "Soon" items; today in the streak week; reduced motion |
| `quality/responsive.spec.ts` | No horizontal scroll at 320, 375, 414, 768, 1024, 1280, and 1920 px for login, register with errors, and home with a long name, an open quest, and the account menu inside the viewport; mobile bottom nav never covers content |
| `quality/accessibility.spec.ts` | axe-core WCAG 2.2 AA with no serious or critical violations on login, register with errors, the login error state, and home with an open quest |
| `quality/resilience.spec.ts` | API down on first load; network failure on submit, then retry; HTML 502 shown as a calm message; slow API (busy button, one request); malformed success payload does not crash |

Reports: `npm run test:e2e:report` opens the HTML report. Traces and screenshots of failures are saved in `client/test-results/`.

### Issues found and fixed by this suite

| Finding | Fix |
| ------- | --- |
| White text on hibiscus and leaf-green surfaces was below 4.5:1 (axe) | Darkened `--gumamela` to `#CC2A50` and `--dahon` to `#0B7F54`, and removed translucent small text |
| Top bar overflowed sideways at 320 px | Compact stats and hidden logo mark at very small widths |
| Focus was not moved to the new heading when switching Log in / Create account, because the page remounted | `AuthPage` became a layout route shared by both paths, and focus now moves when the new heading mounts |
| Sticky top bar and bottom nav could cover focused elements (WCAG 2.2 "Focus Not Obscured") | `scroll-padding-block` on the app shell |
| Streak number lost contrast when pink content scrolled under the translucent top bar | Streak number uses `--gumamela-deep`, and the top bar is now 96% opaque |
| Last bottom-nav label clipped at 320 px (fixed nav, invisible to the page-overflow check) | Nav items share the width evenly with truncation, and the responsive test now checks every nav item's bounds |
| Repeated runs locked the shared "nobody@example.com" test identifier (the server behaved correctly) | Throttle-sensitive tests use a unique identifier per run |
| Icon-only side nav (921–1240 px) hid its labels with `display: none`, leaving links without accessible names | Labels are visually hidden instead, so screen readers still announce them |
