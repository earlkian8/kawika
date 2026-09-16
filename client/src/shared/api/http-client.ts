/**
 * Fetch wrapper for the Kawika API: same-origin cookies, CSRF header on unsafe
 * methods, and a typed ApiError for every failure.
 */
import * as z from 'zod/mini'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const CSRF_COOKIES = ['__Host-kawika_csrf', 'kawika_csrf']
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.optional(z.record(z.string(), z.string())),
    retry_after: z.optional(z.number()),
  }),
})

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string>
  readonly retryAfter: number | undefined

  constructor(status: number, code: string, message: string, fields = {}, retryAfter?: number) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
    this.retryAfter = retryAfter
  }
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function csrfToken(): string | undefined {
  for (const name of CSRF_COOKIES) {
    const value = readCookie(name)
    if (value) return decodeURIComponent(value)
  }
  return undefined
}

export async function ensureCsrf(force = false): Promise<void> {
  if (!force && csrfToken()) return
  await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'same-origin', cache: 'no-store' })
}

export async function request(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (UNSAFE.has(method)) {
    await ensureCsrf()
    const token = csrfToken()
    if (token) headers.set('X-CSRF-Token', token)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    })
  } catch {
    throw new ApiError(0, 'network', "We can't reach Kawika right now. Check your connection and try again.")
  }

  if (response.ok) return response

  const parsed = errorSchema.safeParse(await response.json().catch(() => null))
  const error = parsed.success
    ? new ApiError(
        response.status,
        parsed.data.error.code,
        parsed.data.error.message,
        parsed.data.error.fields,
        parsed.data.error.retry_after ?? (Number(response.headers.get('Retry-After')) || undefined),
      )
    : new ApiError(response.status, 'unknown', 'Something went wrong on our side. Try again in a moment.')

  // A stale CSRF token (e.g. after the server rotated its key): fetch a fresh one once.
  if (error.code === 'csrf_failed' && !retried) {
    await ensureCsrf(true)
    return request(path, init, true)
  }
  throw error
}
