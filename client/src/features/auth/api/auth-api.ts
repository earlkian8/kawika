import * as z from 'zod/mini'
import { ApiError, request } from '@/shared/api/http-client'

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  email: z.string(),
  created_at: z.string(),
})
export type User = z.infer<typeof userSchema>

const authResponseSchema = z.object({ user: userSchema })

export type RegisterInput = {
  display_name: string
  username: string
  email: string
  password: string
}

export type LoginInput = {
  identifier: string
  password: string
  remember: boolean
}

export const authApi = {
  async me(): Promise<User | null> {
    try {
      const response = await request('/api/auth/me')
      return authResponseSchema.parse(await response.json()).user
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
  async login(input: LoginInput): Promise<User> {
    const response = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(input) })
    return authResponseSchema.parse(await response.json()).user
  },
  async register(input: RegisterInput): Promise<User> {
    const response = await request('/api/auth/register', { method: 'POST', body: JSON.stringify(input) })
    return authResponseSchema.parse(await response.json()).user
  },
  async logout(everywhere = false): Promise<void> {
    await request(everywhere ? '/api/auth/logout-all' : '/api/auth/logout', { method: 'POST' })
  },
}
