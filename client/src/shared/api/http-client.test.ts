import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './http-client'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

describe('request', () => {
  let cookie: string

  beforeEach(() => {
    cookie = 'kawika_csrf=tok.sig'
    vi.stubGlobal('document', {
      get cookie() {
        return cookie
      },
    })
  })

  it('sends the CSRF token on unsafe methods only', async () => {
    const fetchMock = vi.fn(async () => json(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await request('/api/auth/me')
    await request('/api/auth/logout', { method: 'POST' })

    const [, getInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const [, postInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(new Headers(getInit.headers).has('X-CSRF-Token')).toBe(false)
    expect(new Headers(postInit.headers).get('X-CSRF-Token')).toBe('tok.sig')
    expect(postInit.credentials).toBe('same-origin')
  })

  it('turns API errors into ApiError with fields and retry delay', async () => {
    vi.stubGlobal('fetch', async () =>
      json(429, { error: { code: 'rate_limited', message: 'Slow down.' } }, { 'Retry-After': '12' }),
    )
    const error = await request('/api/auth/login', { method: 'POST' }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, code: 'rate_limited', retryAfter: 12 })
  })

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })
    const error = await request('/api/auth/me').catch((e) => e)
    expect(error).toMatchObject({ status: 0, code: 'network' })
  })

  it('does not trust unexpected error bodies', async () => {
    vi.stubGlobal('fetch', async () => new Response('<html>502</html>', { status: 502 }))
    const error = await request('/api/auth/me').catch((e) => e)
    expect(error).toMatchObject({ status: 502, code: 'unknown' })
  })

  it('refreshes a stale CSRF token once and retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(403, { error: { code: 'csrf_failed', message: 'expired' } }))
      .mockImplementationOnce(async () => {
        cookie = 'kawika_csrf=fresh.sig'
        return new Response(null, { status: 204 })
      })
      .mockResolvedValueOnce(json(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await request('/api/auth/login', { method: 'POST' })
    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit]
    expect(new Headers(retryInit.headers).get('X-CSRF-Token')).toBe('fresh.sig')
  })
})
