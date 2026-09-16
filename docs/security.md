# Security

Kawika's authentication follows the OWASP Cheat Sheet Series, NIST SP 800-63B-4 (2025), and the IETF guidance for browser-based apps (backend-for-frontend pattern: no tokens in JavaScript).

## Sessions

| Property | Value |
| -------- | ----- |
| Token | 256-bit random value (`secrets.token_urlsafe(32)`) |
| Storage (browser) | Cookie `__Host-kawika_session` (`kawika_session` over local HTTP): `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` |
| Storage (server) | SHA-256 of the token only. A database leak cannot be replayed. |
| Default lifetime | Browser-session cookie. Server-side: 2 h idle, 12 h absolute. |
| "Keep me logged in" | 30-day cookie. Server-side: 7 days idle, 30 days absolute. |
| Rotation | A new token on every login, and the presented token is revoked (prevents session fixation). |
| Revocation | Log out (this device) and log out on all devices both delete rows server-side. |

JavaScript never sees a credential: `document.cookie` does not contain the session.

## Passwords

- **Hashing:** Argon2id via argon2-cffi (RFC 9106 low-memory profile: 64 MiB, t=3, p=4), above the OWASP minimum. Hashes are upgraded automatically on login when parameters change.
- **Normalisation:** NFKC before hashing, so a passphrase typed with composed or decomposed characters (for example `ñ`) verifies the same.
- **Policy (NIST SP 800-63B-4):**
  - at least 15 characters (single-factor), at most 128
  - no composition rules and no forced rotation
  - rejects low-variety strings, keyboard or alphabet sequences, and a list of common long passwords
  - rejects passwords built mostly from the user's name, username, email, or "kawika"
  - checked against Have I Been Pwned using k-anonymity: only the first 5 hex characters of the SHA-1 leave the server, with response padding enabled. If the service is unreachable, the check is skipped (logged) instead of blocking sign-up.
- **Paste and password managers** are allowed. `autocomplete` attributes are set correctly.

## Login protection

| Control | Detail |
| ------- | ------ |
| Generic errors | Wrong password and unknown account return the same 401 body. |
| Timing | A dummy Argon2 hash is verified when the account does not exist. |
| Per-account throttle | 5 failures in 15 minutes lock that identifier (429 + `Retry-After`). A success resets the count. |
| Per-IP throttle | 30 attempts per 15 minutes. |
| Sign-up throttle | 5 accounts per IP per hour. |

Limits are in-memory (single process). Use Redis before scaling out.

## CSRF (defence in depth)

1. `SameSite=Strict` session cookie.
2. **Fetch Metadata:** unsafe requests with `Sec-Fetch-Site: cross-site` are refused.
3. **Origin allowlist:** a present `Origin` header must match `CLIENT_ORIGINS`.
4. **Signed double-submit token:** the `X-CSRF-Token` header must equal the CSRF cookie, and its HMAC-SHA256 signature (with `SECRET_KEY`) must be valid, so injected cookies are useless. Tokens rotate on login and logout.

## Input handling

- Strict Pydantic schemas (`extra="forbid"`), length limits, a username pattern, reserved names, and removal of control and bidi-override characters from display names.
- All SQL goes through SQLAlchemy with bound parameters.
- Validation error responses never echo submitted values, so passwords cannot leak through errors.
- React escapes all rendered text, and names containing markup are displayed literally (covered by e2e tests).
- The client accepts only in-app paths as post-login redirects (`safe-redirect.ts`).

## HTTP hardening

| Where | Headers |
| ----- | ------- |
| API | `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, COOP/CORP `same-origin`, restrictive `Permissions-Policy`, HSTS in production |
| Web app (`vite preview` / production proxy) | Strict CSP (`script-src 'self'`, no third-party origins, `frame-ancestors 'none'`), `nosniff`, `Referrer-Policy`, COOP |

Also: a Host header allowlist, CORS limited to known origins, methods, and headers, API docs disabled in production, and startup refused with a weak `SECRET_KEY` or insecure cookies in production.

## Known gaps (planned)

- **Email verification and password reset** are not built yet. Until verification exists, registration reveals whether an email is already in use.
- **Multi-factor authentication** is not built yet (a passkey/WebAuthn option is the intended path).
- **Rate limits** need a shared store for multi-instance deployments.
