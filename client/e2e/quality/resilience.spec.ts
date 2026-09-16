import { createAccount, expect, fillLogin, makeUser, test } from '../support/fixtures'

test.describe('Resilience when the API misbehaves', () => {
  test('API unreachable on first load still shows the login page', async ({ page }) => {
    await page.route((url) => url.pathname.startsWith('/api/'), (route) => route.abort('connectionrefused'))
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Tara, magpatuloy.' })).toBeVisible()
  })

  test('network failure on submit explains the problem and allows retry', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/login')
    await page.route('**/api/auth/login', (route) => route.abort('internetdisconnected'))
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText("We can't reach Kawika right now.")

    await page.unroute('**/api/auth/login')
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/home$/)
  })

  test('server error page (HTML 502) shows a calm generic message', async ({ page }) => {
    await page.goto('/register')
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 502, contentType: 'text/html', body: '<html><h1>Bad Gateway</h1></html>' }),
    )
    const user = makeUser()
    await page.getByLabel('What should we call you?').fill(user.display_name)
    await page.getByLabel('Username').fill(user.username)
    await page.getByLabel('Email', { exact: true }).fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('alert')).toContainText('Something went wrong on our side.')
    await expect(page.getByText('Bad Gateway')).toHaveCount(0)
  })

  test('slow login shows a busy button that cannot be pressed twice', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/login')
    let calls = 0
    await page.route('**/api/auth/login', async (route) => {
      calls++
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })
    await fillLogin(page, user.username, user.password)
    const submit = page.getByRole('button', { name: 'Log in' })
    await submit.click()
    await expect(submit).toHaveAttribute('aria-busy', 'true')
    await expect(submit).toBeDisabled()
    await submit.click({ force: true })
    await expect(page).toHaveURL(/\/home$/)
    expect(calls).toBe(1)
  })

  test('malformed success payload does not crash the app', async ({ page }) => {
    const user = await createAccount(page)
    await page.goto('/login')
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"user": {"id": 1}}' }),
    )
    await fillLogin(page, user.username, user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText('Something went wrong on our side.')
    await expect(page).toHaveURL(/\/login$/)
  })
})
