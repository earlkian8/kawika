import { createAccount, expect, fillRegister, hasHorizontalOverflow, makeUser, test } from '../support/fixtures'

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Tara, simulan.' })).toBeVisible()
  })

  test('happy path lands on the journey with the learner greeted by name', async ({ page }) => {
    await fillRegister(page, makeUser({ display_name: 'Juan dela Cruz' }))
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(', Juan.')
    await expect(page.getByRole('heading', { name: 'Pamilya' })).toBeVisible()
  })

  test('empty submit shows every field error without calling the API', async ({ page }) => {
    let calls = 0
    page.on('request', (r) => r.url().includes('/api/auth/register') && calls++)

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText("Enter the name you'd like to be called.")).toBeVisible()
    await expect(page.getByText('Use 3–24 letters, numbers, or underscores.')).toBeVisible()
    await expect(page.getByText('Enter a valid email address.')).toBeVisible()
    await expect(page.getByText('Use at least 15 characters.').first()).toBeVisible()
    await expect(page.getByLabel('What should we call you?')).toBeFocused()
    await expect(page.getByLabel('What should we call you?')).toHaveAttribute('aria-invalid', 'true')
    expect(calls).toBe(0)
  })

  test('whitespace-only name is rejected', async ({ page }) => {
    await fillRegister(page, makeUser({ display_name: '      ' }))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText("Enter the name you'd like to be called.")).toBeVisible()
  })

  for (const username of ['ab', 'juan dela cruz', 'juan-23', 'juan🇵🇭', "x' OR 1=1", 'juan!']) {
    test(`invalid username "${username}" is caught before submit`, async ({ page }) => {
      await fillRegister(page, makeUser({ username }))
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page.getByText('Use 3–24 letters, numbers, or underscores.')).toBeVisible()
      await expect(page).toHaveURL(/\/register$/)
    })
  }

  for (const email of ['juan@', 'juan@@example.com', 'juan dela@example.com', '@example.com', 'juan@example']) {
    test(`invalid email "${email}" is caught before submit`, async ({ page }) => {
      await fillRegister(page, makeUser({ email }))
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page.getByText('Enter a valid email address.')).toBeVisible()
    })
  }

  test('reserved username is rejected by the server on the right field', async ({ page }) => {
    await fillRegister(page, makeUser({ username: 'Admin' }))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('This username is reserved. Try another.')).toBeVisible()
    await expect(page.getByLabel('Username')).toBeFocused()
  })

  test('password meter guides the learner as they type', async ({ page }) => {
    const password = page.getByLabel('Password', { exact: true })
    await expect(page.getByText('Use at least 15 characters.')).toBeVisible()
    await password.fill('tahimik')
    await expect(page.getByText('8 more characters to go.')).toBeVisible()
    await password.fill('tahimik na gabi')
    await expect(page.getByText('Good. A few more characters makes it stronger.')).toBeVisible()
    await password.fill('tahimik na gabi sa probinsya')
    await expect(page.getByText('Strong. Nice one.')).toBeVisible()
  })

  test('a password built from the username is rejected by the server', async ({ page }) => {
    const user = makeUser({ username: 'bayanihan_22' + Date.now().toString(36).slice(-6) })
    await fillRegister(page, { ...user, password: `${user.username}${user.username}` })
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText("Don't build your password from your name, username, or email.")).toBeVisible()
  })

  test('a password known from data breaches is rejected', async ({ page }) => {
    await fillRegister(page, makeUser({ password: 'password1234567' }))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('This password has appeared in a data breach. Choose a different one.')).toBeVisible()
  })

  test('taken username (any case) and taken email are reported per field', async ({ page }) => {
    const existing = await createAccount(page)
    await page.goto('/register')
    await fillRegister(page, makeUser({ username: existing.username.toUpperCase(), email: existing.email.toUpperCase() }))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('This username is taken. Try another.')).toBeVisible()
    await expect(page.getByText("This email can't be used. If it's yours, log in instead.")).toBeVisible()
  })

  test('markup in the name is shown as text, never executed', async ({ page }) => {
    const name = '<img src=x onerror=alert(1)><b>x</b>'
    await fillRegister(page, makeUser({ display_name: name }))
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('<img')
    await expect(page.locator('h1 img, h1 script')).toHaveCount(0)
    await page.getByRole('button', { name: /Account menu/ }).click()
    await expect(page.locator('.profile__who strong')).toHaveText(name)
  })

  test('Filipino characters and emoji in names work end to end', async ({ page }) => {
    await fillRegister(page, makeUser({ display_name: 'Ñiño 🇵🇭 Santos' }))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(', Ñiño.')
  })

  test('input lengths are capped in the browser', async ({ page }) => {
    await page.getByLabel('What should we call you?').pressSequentially('x'.repeat(70), { delay: 0 })
    await page.getByLabel('Username').pressSequentially('y'.repeat(40), { delay: 0 })
    await expect(page.getByLabel('What should we call you?')).toHaveValue('x'.repeat(50))
    await expect(page.getByLabel('Username')).toHaveValue('y'.repeat(24))
  })

  test('a very long unbroken name does not break the layout', async ({ page }) => {
    await fillRegister(page, makeUser({ display_name: 'Maria'.repeat(10) }))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/home$/)
    expect(await hasHorizontalOverflow(page)).toBe(false)
  })

  test('double-clicking submit creates exactly one request', async ({ page }) => {
    let calls = 0
    page.on('request', (r) => r.url().includes('/api/auth/register') && r.method() === 'POST' && calls++)
    await fillRegister(page, makeUser())
    await page.getByRole('button', { name: 'Create account' }).dblclick()
    await expect(page).toHaveURL(/\/home$/)
    expect(calls).toBe(1)
  })

  test('Enter in the last field submits the form', async ({ page }) => {
    await fillRegister(page, makeUser())
    await page.getByLabel('Password', { exact: true }).press('Enter')
    await expect(page).toHaveURL(/\/home$/)
  })

  test('fixing a field clears its error while typing', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Enter a valid email address.')).toBeVisible()
    await page.getByLabel('Email', { exact: true }).fill('j')
    await expect(page.getByText('Enter a valid email address.')).toBeHidden()
  })
})
