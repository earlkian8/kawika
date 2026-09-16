import { createAccount, expect, fillLogin, makeUser, test } from '../support/fixtures'

const INVALID = 'That email, username, or password is incorrect.'

test.describe('Login', () => {
  test('signed-out visitors are sent to login, then back where they were headed', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/home?from=email')
    await expect(page).toHaveURL(/\/login$/)

    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home\?from=email$/)
  })

  test('accepts email or username in any case, with stray spaces', async ({ page }) => {
    const user = await createAccount(page)
    for (const identifier of [`  ${user.email.toUpperCase()} `, user.username.toUpperCase()]) {
      await page.goto('/login')
      await fillLogin(page, identifier, user.password)
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page).toHaveURL(/\/home$/)
      await page.context().clearCookies()
    }
  })

  test('wrong password keeps the identifier, clears the password, and explains', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/login')
    await fillLogin(page, user.username, 'not the right password')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByRole('alert')).toContainText(INVALID)
    await expect(page.getByLabel('Email or username')).toHaveValue(user.username)
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  })

  test('unknown account gets the same message as a wrong password', async ({ page }) => {
    await page.goto('/login')
    await fillLogin(page, makeUser().email, 'whatever password it is')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText(INVALID)
  })

  for (const identifier of ["' OR '1'='1' --", '<script>alert(1)</script>', '%', 'ñ'.repeat(254)]) {
    test(`hostile identifier ${JSON.stringify(identifier.slice(0, 20))} is just a failed login`, async ({ page }) => {
      await page.goto('/login')
      await fillLogin(page, identifier, 'any password at all')
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page.getByRole('alert')).toContainText(INVALID)
    })
  }

  test('empty fields are caught before submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText('Enter your email or username.')).toBeVisible()
    await expect(page.getByText('Enter your password.')).toBeVisible()
  })

  test('five wrong passwords lock the account with a live countdown', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/login')
    for (let attempt = 0; attempt < 5; attempt++) {
      await fillLogin(page, user.username, `wrong password number ${attempt}`)
      await Promise.all([
        page.waitForResponse((r) => r.url().endsWith('/api/auth/login') && r.status() === 401),
        page.getByRole('button', { name: 'Log in' }).click(),
      ])
      await expect(page.getByRole('alert')).toContainText(INVALID)
    }
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByRole('alert')).toContainText(/Too many attempts\. Try again in \d+:\d\d\./)
    await expect(page.getByRole('button', { name: 'Log in' })).toBeDisabled()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('"Keep me logged in" decides between a browser-session and a 30-day cookie', async ({ page }) => {
    const user = await createAccount(page)
    const sessionCookie = async () =>
      (await page.context().cookies()).find((c) => c.name.endsWith('kawika_session'))

    await page.goto('/login')
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home$/)
    expect((await sessionCookie())?.expires).toBe(-1)
    expect((await sessionCookie())?.httpOnly).toBe(true)
    expect((await sessionCookie())?.sameSite).toBe('Strict')

    await page.context().clearCookies()
    await page.goto('/login')
    await fillLogin(page, user.username, user.password)
    await page.getByText('Keep me logged in for 30 days').click()
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home$/)
    const days = ((await sessionCookie())!.expires * 1000 - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(29)
    expect(days).toBeLessThanOrEqual(30)
  })

  test('session cookie is invisible to page scripts', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/login')
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home$/)
    expect(await page.evaluate(() => document.cookie)).not.toContain('kawika_session')
  })

  test('show/hide password toggles visibility', async ({ page }) => {
    await page.goto('/login')
    const password = page.getByLabel('Password', { exact: true })
    await password.fill('secret words here')
    await expect(password).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('tabs switch forms and keep the post-login destination', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/home?deep=1')
    await expect(page).toHaveURL(/\/login$/)
    await page.getByRole('link', { name: 'Create account' }).click()
    await expect(page.getByRole('heading', { name: 'Tara, simulan.' })).toBeFocused()
    await page.getByRole('link', { name: 'Log in' }).click()
    await expect(page.getByRole('heading', { name: 'Tara, magpatuloy.' })).toBeFocused()
    await fillLogin(page, user.email, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home\?deep=1$/)
  })

  test('keyboard only: tab through the form and submit with Enter', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Physical keyboard scenario')
    const user = await createAccount(page)
    await page.goto('/login')
    await page.getByLabel('Email or username').focus()
    await page.keyboard.type(user.username)
    await page.keyboard.press('Tab')
    await page.keyboard.type(user.password)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/home$/)
  })
})
