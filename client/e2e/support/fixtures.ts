import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'

export type TestUser = {
  display_name: string
  username: string
  email: string
  password: string
}

let counter = 0

/** A unique, valid learner. Override any field for a scenario. */
export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = `${Date.now().toString(36)}${process.pid.toString(36)}${(counter++).toString(36)}`
  return {
    display_name: 'Maria Clara',
    username: `mc_${id}`.slice(0, 24),
    email: `maria.${id}@example.com`,
    password: 'sabay kain sa bahay ni lola',
    ...overrides,
  }
}

async function csrfHeader(request: APIRequestContext): Promise<Record<string, string>> {
  await request.get('/api/auth/csrf')
  const { cookies } = await request.storageState()
  const token = cookies.find((c) => c.name.endsWith('kawika_csrf'))?.value ?? ''
  return { 'X-CSRF-Token': token }
}

/** Register through the API using the page's cookie jar, so the page is signed in. */
export async function registerViaApi(page: Page, user: TestUser = makeUser()): Promise<TestUser> {
  const request = page.context().request
  const response = await request.post('/api/auth/register', { data: user, headers: await csrfHeader(request) })
  expect(response.status(), await response.text()).toBe(201)
  return user
}

/** Create an account, then drop its session so the page starts signed out. */
export async function createAccount(page: Page, user: TestUser = makeUser()): Promise<TestUser> {
  await registerViaApi(page, user)
  await page.context().clearCookies()
  return user
}

export async function fillRegister(page: Page, user: Partial<TestUser>) {
  if (user.display_name !== undefined) await page.getByLabel('What should we call you?').fill(user.display_name)
  if (user.username !== undefined) await page.getByLabel('Username').fill(user.username)
  if (user.email !== undefined) await page.getByLabel('Email', { exact: true }).fill(user.email)
  if (user.password !== undefined) await page.getByLabel('Password', { exact: true }).fill(user.password)
}

export async function fillLogin(page: Page, identifier: string, password: string) {
  await page.getByLabel('Email or username').fill(identifier)
  await page.getByLabel('Password', { exact: true }).fill(password)
}

/** True when the page scrolls sideways (a layout break). */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

/**
 * Every test fails on uncaught exceptions or unexpected JS dialogs (e.g. an
 * injected alert). HTTP 4xx responses are expected in auth flows and ignored.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = []
      page.on('pageerror', (error) => problems.push(`Uncaught: ${error.message}`))
      page.on('dialog', async (dialog) => {
        problems.push(`Unexpected dialog: ${dialog.message()}`)
        await dialog.dismiss()
      })
      page.on('console', (message) => {
        if (message.type() !== 'error') return
        if (/status of 4\d\d|Failed to load resource/.test(message.text())) return
        problems.push(`Console error: ${message.text()}`)
      })
      await use()
      expect(problems, problems.join('\n')).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
