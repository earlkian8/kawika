import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = process.env.VITE_API_PROXY ?? 'http://localhost:8000'

// Production CSP. Everything is self-hosted (fonts included), so no third-party
// origins are allowed. Mirror these headers in the production web server.
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  server: {
    // The API is proxied so the browser sees a single origin: auth cookies stay
    // first-party and SameSite=Strict, and no CORS is involved.
    proxy: { '/api': { target: apiTarget, changeOrigin: false } },
  },
  preview: {
    proxy: { '/api': { target: apiTarget, changeOrigin: false } },
    headers: securityHeaders,
  },
})
